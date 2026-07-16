/**
 * Расчёт вариантов времени для формы. Работает поверх booking-rules и
 * московского времени, чтобы клиент и сервер считали занятость одинаково.
 *
 * Расписания «с 10:00 до 02:00» больше нет: катер берут на любое время суток,
 * в том числе на сутки и на несколько дней. Поэтому сетка — круглосуточная,
 * а длительность выбирается отдельным списком (часы, затем сутки).
 */

import {
  MAX_DURATION_HOURS,
  MIN_DURATION_HOURS,
  SLOT_STEP_MINUTES,
  isSlotFree,
  type Interval,
} from '@/lib/booking-rules'
import { formatHour, fromSpbParts, parseDayKey } from '@/lib/spb-time'

export interface TimeOption {
  /** Минуты от полуночи выбранных суток. */
  value: number
  label: string
  disabled: boolean
}

export interface DurationOption {
  /** Длительность в часах. */
  value: number
  label: string
  disabled: boolean
}

/** Момент времени для «минут от полуночи» указанных суток (МСК). */
export function slotDate(dayKey: string, minutes: number): Date {
  const { year, month, day } = parseDayKey(dayKey)
  return fromSpbParts({ year, month, day, hour: 0, minute: minutes })
}

const DAY_MINUTES = 24 * 60

/**
 * Варианты времени начала — круглые сутки с шагом SLOT_STEP_MINUTES.
 * Время недоступно, если уже прошло или если от него не помещается даже
 * минимальная аренда: не поместилась она — не поместится и длиннее.
 */
export function startOptions(dayKey: string, busy: Interval[], now = new Date()): TimeOption[] {
  const options: TimeOption[] = []
  for (let m = 0; m < DAY_MINUTES; m += SLOT_STEP_MINUTES) {
    const start = slotDate(dayKey, m)
    const end = slotDate(dayKey, m + MIN_DURATION_HOURS * 60)
    const disabled = start <= now || !isSlotFree({ start, end }, busy)
    options.push({ value: m, label: formatHour(Math.floor(m / 60), m % 60), disabled })
  }
  return options
}

/**
 * Варианты длительности: по часам до суток, дальше — сутками.
 * Интервал только растёт, поэтому после первой занятой длительности все
 * последующие тоже недоступны — иначе бронь перекрыла бы чужую.
 */
export function durationOptions(
  dayKey: string,
  startMinutes: number,
  busy: Interval[],
): DurationOption[] {
  const hours: number[] = []
  for (let h = MIN_DURATION_HOURS; h < 24; h++) hours.push(h)
  for (let d = 1; d <= MAX_DURATION_HOURS / 24; d++) hours.push(d * 24)

  const start = slotDate(dayKey, startMinutes)
  const options: DurationOption[] = []
  let blocked = false

  for (const h of hours) {
    const end = new Date(start.getTime() + h * 3_600_000)
    if (!blocked && !isSlotFree({ start, end }, busy)) blocked = true
    options.push({ value: h, label: durationLabel(h), disabled: blocked })
  }
  return options
}

/** «3 ч», «Сутки», «2 суток» — читается лучше, чем «48 ч». */
export function durationLabel(hours: number): string {
  if (hours < 24) return `${hours} ч`
  const days = hours / 24
  if (days === 1) return 'Сутки'
  return `${days} суток`
}

export function durationLabelEn(hours: number): string {
  if (hours < 24) return `${hours} h`
  const days = hours / 24
  return days === 1 ? '24 hours' : `${days} days`
}

/** Есть ли в этот день хоть одно свободное время начала — по этому красим день. */
export function dayHasFreeSlot(dayKey: string, busy: Interval[], now = new Date()): boolean {
  return startOptions(dayKey, busy, now).some((o) => !o.disabled)
}

/**
 * Окно запроса занятости для дня. Берём с запасом вперёд: многодневная бронь,
 * начавшаяся раньше, всё равно накрывает этот день.
 */
export function dayWindow(dayKey: string): Interval {
  const start = slotDate(dayKey, 0)
  return {
    start,
    end: new Date(start.getTime() + (MAX_DURATION_HOURS + 24) * 3_600_000),
  }
}
