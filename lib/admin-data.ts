/**
 * Запросы админки. Отдельно от lib/bookings-db.ts: там — правила и запись,
 * здесь — только чтение под списки и карточки.
 */

import type { BookingSource, BookingStatus, Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'
import { spbDayStart } from '@/lib/spb-time'
import { BLOCKING_STATUSES } from '@/lib/booking-rules'

export const STATUS_LABEL: Record<BookingStatus, string> = {
  NEW: 'Новая',
  REVIEW: 'На рассмотрении',
  CONFIRMED: 'Подтверждена',
  COMPLETED: 'Завершена',
  CANCELLED: 'Отменена',
}

export const SOURCE_LABEL: Record<BookingSource, string> = {
  ORGANIC: 'Поиск',
  ADS: 'Реклама',
  SOCIAL: 'Соцсети',
  REPEAT: 'Повторный',
  MANUAL: 'Вручную',
  UNKNOWN: 'Неизвестно',
}

export interface BookingFilters {
  status?: BookingStatus
  source?: BookingSource
  boatId?: string
  /** Дата начала прогулки, ключ петербургского дня: "2026-07-20". */
  from?: string
  to?: string
  /** Поиск по имени или телефону. */
  q?: string
}

const PAGE_SIZE = 50

function whereFromFilters(f: BookingFilters): Prisma.BookingWhereInput {
  const where: Prisma.BookingWhereInput = {}

  if (f.status) where.status = f.status
  if (f.source) where.source = f.source
  if (f.boatId) where.boatId = f.boatId

  // Фильтр по дате прогулки (startAt), а не по дате создания: менеджер думает
  // категориями «кто едет в субботу», а не «кто оставил заявку в среду».
  if (f.from || f.to) {
    where.startAt = {}
    if (f.from) where.startAt.gte = spbDayStart(f.from)
    // Включительно: «по 20-е» должно захватывать весь 20-й день, поэтому
    // берём начало следующих суток.
    if (f.to) where.startAt.lt = new Date(spbDayStart(f.to).getTime() + 86_400_000)
  }

  if (f.q) {
    const q = f.q.trim()
    // Телефон ищем по цифрам: в базе он записан как ввёл клиент
    // («+7 (999) 123-45-67»), и поиск по «9991234567» иначе ничего не найдёт.
    const digits = q.replace(/\D/g, '')
    where.OR = [
      { clientName: { contains: q, mode: 'insensitive' } },
      { phone: { contains: q } },
      ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
    ]
  }

  return where
}

export async function listBookings(f: BookingFilters, page = 0) {
  const where = whereFromFilters(f)

  const [rows, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: { boat: { select: { nameRu: true, slug: true } } },
      orderBy: { startAt: 'desc' },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    prisma.booking.count({ where }),
  ])

  return { rows, total, pageSize: PAGE_SIZE }
}

/** Счётчики по статусам — для вкладок над списком. */
export async function countByStatus(): Promise<Record<string, number>> {
  const rows = await prisma.booking.groupBy({ by: ['status'], _count: { _all: true } })
  return Object.fromEntries(rows.map((r) => [r.status, r._count._all]))
}

export async function getBooking(id: string) {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      boat: { select: { id: true, nameRu: true, slug: true, price: true } },
      statusHistory: { orderBy: { changedAt: 'desc' } },
      client: { select: { id: true, phone: true, firstSeen: true, _count: { select: { bookings: true } } } },
    },
  })
}

/**
 * Другие заявки на тот же катер, пересекающиеся по времени.
 *
 * Это прямое следствие правила «слот держит только CONFIRMED»: на одно время
 * могут лежать несколько заявок, и менеджер должен выбрать, кому отказать.
 * Не показать их — значит подтвердить одну и молча забыть про остальные.
 */
export async function getCompetingBookings(booking: {
  id: string
  boatId: string
  startAt: Date
  endAt: Date
}) {
  return prisma.booking.findMany({
    where: {
      id: { not: booking.id },
      boatId: booking.boatId,
      // Пересечение: начинается раньше, чем кончается наша, и кончается позже, чем наша началась.
      startAt: { lt: booking.endAt },
      endAt: { gt: booking.startAt },
      status: { notIn: ['CANCELLED'] },
    },
    select: {
      id: true,
      clientName: true,
      phone: true,
      startAt: true,
      endAt: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  })
}

/** Занимает ли этот статус слот — чтобы подписать конкурента в карточке. */
export function isBlocking(status: BookingStatus): boolean {
  return (BLOCKING_STATUSES as readonly string[]).includes(status)
}

export async function listBoatsForFilter() {
  return prisma.boat.findMany({
    select: { id: true, nameRu: true },
    orderBy: { sortOrder: 'asc' },
  })
}
