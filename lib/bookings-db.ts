import type { BookingSource, BookingStatus } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import {
  BLOCKING_STATUSES,
  BUFFER_MINUTES,
  calcPrice,
  durationHours,
  type Interval,
} from '@/lib/booking-rules'

/** Код ошибки Postgres для нарушения exclusion-констрейнта (пересечение броней). */
const PG_EXCLUSION_VIOLATION = '23P01'

export class BoatBusyError extends Error {
  constructor() {
    super('Boat is already booked for this interval')
    this.name = 'BoatBusyError'
  }
}

export class BoatNotFoundError extends Error {
  constructor(slug: string) {
    super(`Boat not found: ${slug}`)
    this.name = 'BoatNotFoundError'
  }
}

/**
 * Занятые интервалы катера в заданном окне.
 * Возвращает «сырые» брони без буфера — буфер накидывает вызывающий код
 * (правила в booking-rules), чтобы одна и та же логика работала на клиенте.
 */
export async function getBusyIntervals(
  boatSlug: string,
  from: Date,
  to: Date,
): Promise<Interval[]> {
  const boat = await prisma.boat.findUnique({ where: { slug: boatSlug }, select: { id: true } })
  if (!boat) throw new BoatNotFoundError(boatSlug)

  // Окно расширяем на буфер: бронь чуть за границей окна всё равно влияет на края.
  const pad = BUFFER_MINUTES * 60_000
  const rows = await prisma.booking.findMany({
    where: {
      boatId: boat.id,
      status: { in: [...BLOCKING_STATUSES] },
      startAt: { lt: new Date(to.getTime() + pad) },
      endAt: { gt: new Date(from.getTime() - pad) },
    },
    select: { startAt: true, endAt: true },
    orderBy: { startAt: 'asc' },
  })
  return rows.map((r) => ({ start: r.startAt, end: r.endAt }))
}

interface CreateBookingArgs {
  boatSlug: string
  startAt: Date
  endAt: Date
  guests: number
  clientName: string
  phone: string
  telegram?: string
  comment?: string
  lang: string
  utmSource?: string
  utmMedium?: string
  utmCampaign?: string
  referer?: string | null
}

/**
 * Создаёт заявку. От двойного бронирования защищает exclusion-констрейнт в БД
 * (см. миграцию add_booking_overlap_guard) — он ловит гонку двух одновременных
 * заявок на один слот, чего проверка «сначала посмотрели, потом вставили» не умеет.
 */
export async function createBooking(args: CreateBookingArgs) {
  const boat = await prisma.boat.findUnique({
    where: { slug: args.boatSlug },
    select: { id: true, price: true },
  })
  if (!boat) throw new BoatNotFoundError(args.boatSlug)

  const priceSnapshot = calcPrice(boat.price, durationHours({ start: args.startAt, end: args.endAt }))

  try {
    return await prisma.$transaction(async (tx) => {
      // Клиент агрегируется по телефону — он же признак повторного обращения.
      const existing = await tx.client.findUnique({ where: { phone: args.phone } })
      const client = existing
        ? await tx.client.update({
            where: { id: existing.id },
            data: {
              name: args.clientName,
              telegram: args.telegram ?? existing.telegram,
            },
          })
        : await tx.client.create({
            data: { phone: args.phone, name: args.clientName, telegram: args.telegram },
          })

      const source = detectSource({
        isRepeat: Boolean(existing),
        utmSource: args.utmSource,
        utmMedium: args.utmMedium,
        referer: args.referer,
      })

      const booking = await tx.booking.create({
        data: {
          boatId: boat.id,
          clientId: client.id,
          startAt: args.startAt,
          endAt: args.endAt,
          guests: args.guests,
          clientName: args.clientName,
          phone: args.phone,
          telegram: args.telegram,
          comment: args.comment,
          priceSnapshot,
          lang: args.lang,
          source,
          utmSource: args.utmSource,
          utmMedium: args.utmMedium,
          utmCampaign: args.utmCampaign,
        },
      })

      await tx.bookingStatusHistory.create({
        data: { bookingId: booking.id, from: null, to: 'NEW', changedBy: 'site' },
      })

      return booking
    })
  } catch (e) {
    if (isExclusionViolation(e)) throw new BoatBusyError()
    throw e
  }
}

/** Заявка со всем, что нужно для сообщения в Telegram. */
export async function getBookingForMessage(id: string) {
  const b = await prisma.booking.findUnique({
    where: { id },
    include: { boat: { select: { nameRu: true } } },
  })
  if (!b) return null
  return {
    id: b.id,
    boatName: b.boat.nameRu,
    startAt: b.startAt,
    endAt: b.endAt,
    guests: b.guests,
    clientName: b.clientName,
    phone: b.phone,
    telegram: b.telegram,
    comment: b.comment,
    priceSnapshot: b.priceSnapshot,
    status: b.status,
    source: b.source,
    utmSource: b.utmSource,
    utmMedium: b.utmMedium,
    lang: b.lang,
    tgMessageId: b.tgMessageId,
  }
}

export async function setTgMessageId(id: string, messageId: number) {
  await prisma.booking.update({ where: { id }, data: { tgMessageId: messageId } })
}

/**
 * Найти заявку по id её карточки в Telegram.
 * Нужно, чтобы менеджер мог просто ответить на карточку новым временем —
 * без спрятанных id в тексте и без хранения состояния диалога.
 */
export async function findBookingIdByTgMessage(messageId: number): Promise<string | null> {
  const b = await prisma.booking.findFirst({
    where: { tgMessageId: messageId },
    select: { id: true },
    // Один и тот же message_id теоретически не повторится, но порядок
    // фиксируем, чтобы выбор был предсказуемым.
    orderBy: { createdAt: 'desc' },
  })
  return b?.id ?? null
}

export type StatusChangeResult =
  | { ok: true; from: BookingStatus }
  | { ok: false; reason: 'same' | 'not_found' | 'busy' }

/**
 * Сменить статус и записать переход в журнал (ТЗ, п. 6.4).
 *
 * Возврат отменённой заявки в работу может упереться в exclusion-констрейнт:
 * пока она была отменена, слот мог занять другой клиент, а NEW/REVIEW/CONFIRMED
 * слот держат. Поэтому 23P01 здесь — не сбой, а осмысленный ответ «занято».
 */
export async function changeBookingStatus(
  id: string,
  to: BookingStatus,
  changedBy: string,
): Promise<StatusChangeResult> {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({ where: { id }, select: { status: true } })
      if (!current) return { ok: false, reason: 'not_found' } as const
      if (current.status === to) return { ok: false, reason: 'same' } as const

      await tx.booking.update({ where: { id }, data: { status: to } })
      await tx.bookingStatusHistory.create({
        data: { bookingId: id, from: current.status, to, changedBy },
      })
      return { ok: true, from: current.status } as const
    })
  } catch (e) {
    if (isExclusionViolation(e)) return { ok: false, reason: 'busy' }
    throw e
  }
}

/**
 * Перенести заявку на другое время.
 * От пересечения защищает тот же exclusion-констрейнт, что и при создании:
 * перенос на занятый слот отбивается базой, а не только проверкой в коде.
 */
export async function rescheduleBooking(
  id: string,
  startAt: Date,
  endAt: Date,
): Promise<'ok' | 'busy' | 'not_found'> {
  const b = await prisma.booking.findUnique({
    where: { id },
    select: { boatId: true, boat: { select: { price: true } } },
  })
  if (!b) return 'not_found'

  try {
    // Цена пересчитывается: изменилась длительность — изменилась и стоимость.
    const priceSnapshot = calcPrice(b.boat.price, durationHours({ start: startAt, end: endAt }))
    await prisma.booking.update({ where: { id }, data: { startAt, endAt, priceSnapshot } })
    return 'ok'
  } catch (e) {
    if (isExclusionViolation(e)) return 'busy'
    throw e
  }
}

function isExclusionViolation(e: unknown): boolean {
  return (
    typeof e === 'object' &&
    e !== null &&
    'code' in e &&
    ((e as { code?: string }).code === PG_EXCLUSION_VIOLATION ||
      // Prisma заворачивает нативные ошибки Postgres в P2010 с полем meta.code.
      ((e as { code?: string }).code === 'P2010' &&
        (e as { meta?: { code?: string } }).meta?.code === PG_EXCLUSION_VIOLATION))
  )
}

/** Определение источника заявки по UTM и referer (ТЗ, п. 6.6). */
export function detectSource(args: {
  isRepeat: boolean
  utmSource?: string
  utmMedium?: string
  referer?: string | null
}): BookingSource {
  if (args.isRepeat) return 'REPEAT'

  const source = args.utmSource?.toLowerCase() ?? ''
  const medium = args.utmMedium?.toLowerCase() ?? ''
  const ref = args.referer?.toLowerCase() ?? ''

  if (['cpc', 'ppc', 'paid', 'ads'].includes(medium)) return 'ADS'
  if (/direct|adwords|google-ads|googleads/.test(source)) return 'ADS'
  if (/vk|telegram|instagram|facebook|social/.test(source) || medium === 'social') return 'SOCIAL'
  if (/vk\.com|t\.me|telegram|instagram|facebook/.test(ref)) return 'SOCIAL'
  if (source || medium) return 'ADS'
  if (/google\.|yandex\.|bing\.|duckduckgo\./.test(ref)) return 'ORGANIC'

  return 'UNKNOWN'
}
