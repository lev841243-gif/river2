/**
 * Единые правила бронирования — используются и на клиенте (календарь, форма),
 * и на сервере (валидация, проверка занятости). Один источник правды, чтобы
 * UI и API не разъезжались.
 */

import { z } from 'zod'

// ─────────────────────── Бизнес-правила ───────────────────────

/** Статусы, при которых катер считается занятым и слот блокируется. */
export const BLOCKING_STATUSES = ['NEW', 'REVIEW', 'CONFIRMED'] as const

/** Первый час, когда можно начать прогулку (местное время СПб). */
export const DAY_START_HOUR = 10

/**
 * Последний час, когда прогулка должна закончиться. 26 = 02:00 следующих суток
 * (разводка мостов — ходовое время до глубокой ночи).
 */
export const DAY_END_HOUR = 26

/** Минимальная аренда, часов. */
export const MIN_DURATION_HOURS = 2

/** Максимальная аренда за одну заявку, часов. */
export const MAX_DURATION_HOURS = 12

/** Перерыв между бронями: катер должен вернуться к причалу, заправиться, убраться. */
export const BUFFER_MINUTES = 60

/** На сколько дней вперёд открыт календарь. */
export const BOOKING_HORIZON_DAYS = 180

/** Шаг сетки времени, минут. */
export const SLOT_STEP_MINUTES = 30

export const MAX_GUESTS = 20

// ─────────────────────── Работа с интервалами ───────────────────────

export interface Interval {
  start: Date
  end: Date
}

/** Два интервала пересекаются, если каждый начинается раньше, чем заканчивается другой. */
export function overlaps(a: Interval, b: Interval): boolean {
  return a.start < b.end && b.start < a.end
}

/** Интервал, расширенный на буфер с обеих сторон — «катер недоступен» в этих границах. */
export function withBuffer(interval: Interval, bufferMinutes = BUFFER_MINUTES): Interval {
  const ms = bufferMinutes * 60_000
  return {
    start: new Date(interval.start.getTime() - ms),
    end: new Date(interval.end.getTime() + ms),
  }
}

/** Свободен ли слот с учётом буфера между бронями. */
export function isSlotFree(slot: Interval, busy: Interval[], bufferMinutes = BUFFER_MINUTES) {
  return !busy.some((b) => overlaps(slot, withBuffer(b, bufferMinutes)))
}

// ─────────────────────── Цена ───────────────────────

/** Стоимость брони: цена за час × длительность. null, если цена «по запросу». */
export function calcPrice(pricePerHour: number | null, hours: number): number | null {
  if (pricePerHour == null) return null
  return Math.round(pricePerHour * hours)
}

export function durationHours(interval: Interval): number {
  return (interval.end.getTime() - interval.start.getTime()) / 3_600_000
}

// ─────────────────────── Схема заявки (Zod) ───────────────────────

/** Телефон: допускаем +, цифры, пробелы, скобки и дефисы; минимум 10 цифр. */
const phoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine((v) => (v.match(/\d/g)?.length ?? 0) >= 10, 'Некорректный номер телефона')

export const bookingInputSchema = z.object({
  boatId: z.string().min(1),
  startAt: z.string().datetime(),
  endAt: z.string().datetime(),
  guests: z.number().int().min(1).max(MAX_GUESTS),
  clientName: z.string().trim().min(2).max(120),
  phone: phoneSchema,
  telegram: z.string().trim().max(120).optional(),
  comment: z.string().trim().max(2000).optional(),
  lang: z.enum(['ru', 'en']).default('ru'),
  utmSource: z.string().trim().max(200).optional(),
  utmMedium: z.string().trim().max(200).optional(),
  utmCampaign: z.string().trim().max(200).optional(),
  /**
   * Honeypot: скрытое поле, которое заполняют только боты.
   * Схема его намеренно НЕ отвергает — иначе ответ с ошибкой подскажет боту,
   * какое поле его выдало. Заполненность проверяет обработчик и молча
   * притворяется, что заявка принята.
   */
  website: z.string().optional(),
})

export type BookingInput = z.infer<typeof bookingInputSchema>

/** Причины отказа, понятные и клиенту, и коду. */
export type BookingRejection =
  | 'PAST'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'OUTSIDE_HOURS'
  | 'TOO_FAR'
  | 'BOAT_BUSY'

/**
 * Проверяет интервал против правил, не заглядывая в БД.
 * Занятость катера проверяется отдельно — она требует запроса.
 */
export function validateInterval(interval: Interval, now = new Date()): BookingRejection | null {
  const hours = durationHours(interval)
  if (interval.start <= now) return 'PAST'
  if (hours < MIN_DURATION_HOURS) return 'TOO_SHORT'
  if (hours > MAX_DURATION_HOURS) return 'TOO_LONG'

  const horizon = new Date(now.getTime() + BOOKING_HORIZON_DAYS * 86_400_000)
  if (interval.start > horizon) return 'TOO_FAR'

  // Часы считаем относительно календарных суток начала: конец может уехать за полночь.
  const dayStart = new Date(interval.start)
  dayStart.setHours(0, 0, 0, 0)
  const startHour = (interval.start.getTime() - dayStart.getTime()) / 3_600_000
  const endHour = (interval.end.getTime() - dayStart.getTime()) / 3_600_000
  if (startHour < DAY_START_HOUR || endHour > DAY_END_HOUR) return 'OUTSIDE_HOURS'

  return null
}
