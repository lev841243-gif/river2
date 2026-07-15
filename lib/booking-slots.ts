/**
 * Расчёт свободных слотов для календаря. Работает поверх booking-rules и
 * петербургского времени, чтобы клиент и сервер считали занятость одинаково.
 */

import {
  DAY_END_HOUR,
  DAY_START_HOUR,
  MAX_DURATION_HOURS,
  MIN_DURATION_HOURS,
  SLOT_STEP_MINUTES,
  isSlotFree,
  type Interval,
} from '@/lib/booking-rules'
import { formatHour, fromSpbParts, parseDayKey } from '@/lib/spb-time'

export interface TimeOption {
  /** Минуты от полуночи петербургских суток; ≥ 1440 — время следующего дня. */
  value: number
  label: string
  disabled: boolean
}

/** Момент времени для «минут от полуночи» указанных петербургских суток. */
export function slotDate(dayKey: string, minutes: number): Date {
  const { year, month, day } = parseDayKey(dayKey)
  return fromSpbParts({ year, month, day, hour: 0, minute: minutes })
}

function label(minutes: number): string {
  return formatHour(Math.floor(minutes / 60), minutes % 60)
}

const WINDOW_START = DAY_START_HOUR * 60
const WINDOW_END = DAY_END_HOUR * 60
const MIN_MINUTES = MIN_DURATION_HOURS * 60
const MAX_MINUTES = MAX_DURATION_HOURS * 60

/**
 * Варианты времени начала. Начало доступно, если от него помещается хотя бы
 * минимальная аренда — если не помещается она, не поместится и длиннее.
 */
export function startOptions(dayKey: string, busy: Interval[], now = new Date()): TimeOption[] {
  const options: TimeOption[] = []
  for (let m = WINDOW_START; m <= WINDOW_END - MIN_MINUTES; m += SLOT_STEP_MINUTES) {
    const start = slotDate(dayKey, m)
    const end = slotDate(dayKey, m + MIN_MINUTES)
    const disabled = start <= now || !isSlotFree({ start, end }, busy)
    options.push({ value: m, label: label(m), disabled })
  }
  return options
}

/**
 * Варианты времени конца для выбранного начала. Интервал только растёт, поэтому
 * после первого занятого варианта все последующие тоже недоступны.
 */
export function endOptions(dayKey: string, startMinutes: number, busy: Interval[]): TimeOption[] {
  const start = slotDate(dayKey, startMinutes)
  const last = Math.min(startMinutes + MAX_MINUTES, WINDOW_END)
  const options: TimeOption[] = []
  let blocked = false

  for (let m = startMinutes + MIN_MINUTES; m <= last; m += SLOT_STEP_MINUTES) {
    if (!blocked && !isSlotFree({ start, end: slotDate(dayKey, m) }, busy)) blocked = true
    options.push({ value: m, label: label(m), disabled: blocked })
  }
  return options
}

/** Есть ли в этот день хоть один свободный старт — по этому красим день в календаре. */
export function dayHasFreeSlot(dayKey: string, busy: Interval[], now = new Date()): boolean {
  return startOptions(dayKey, busy, now).some((o) => !o.disabled)
}

/** Полное окно петербургских суток — им запрашиваем занятость у API. */
export function dayWindow(dayKey: string): Interval {
  return { start: slotDate(dayKey, WINDOW_START), end: slotDate(dayKey, WINDOW_END) }
}
