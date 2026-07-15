/**
 * Работа со временем Санкт-Петербурга независимо от часового пояса посетителя.
 *
 * Прогулка идёт по петербургскому времени, а EN-версию открывают из других
 * поясов. Если считать через локальное время браузера, «20:00» у гостя из
 * Лондона превратится в 23:00 по Москве. Поэтому все даты собираем и
 * разбираем явно в петербургском поясе.
 *
 * Europe/Moscow — фиксированный UTC+3 без перехода на летнее время с 2014 года.
 * Если правила снова изменятся, менять надо только эту константу.
 */
const SPB_UTC_OFFSET_HOURS = 3

/** Календарные части времени по Петербургу. */
export interface SpbParts {
  year: number
  month: number // 1–12
  day: number
  hour: number
  minute: number
}

/** Момент времени → части по петербургскому календарю. */
export function toSpbParts(date: Date): SpbParts {
  const shifted = new Date(date.getTime() + SPB_UTC_OFFSET_HOURS * 3_600_000)
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
  }
}

/**
 * Части петербургского календаря → момент времени.
 * `hour` может быть ≥ 24 — это время следующих суток (26 = 02:00 назавтра).
 */
export function fromSpbParts(parts: {
  year: number
  month: number
  day: number
  hour?: number
  minute?: number
}): Date {
  const { year, month, day, hour = 0, minute = 0 } = parts
  return new Date(Date.UTC(year, month - 1, day, hour - SPB_UTC_OFFSET_HOURS, minute))
}

/** Ключ календарного дня по Петербургу: "2026-07-20". */
export function spbDayKey(date: Date): string {
  const { year, month, day } = toSpbParts(date)
  return `${year}-${pad(month)}-${pad(day)}`
}

/** "2026-07-20" → части. */
export function parseDayKey(key: string): { year: number; month: number; day: number } {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month, day }
}

/** Начало петербургских суток (00:00) для указанного дня. */
export function spbDayStart(key: string): Date {
  return fromSpbParts(parseDayKey(key))
}

/** Текущий день по Петербургу — от него отсчитываем «сегодня» в календаре. */
export function spbTodayKey(now = new Date()): string {
  return spbDayKey(now)
}

/** Часы в формате "20:00"; `hour` ≥ 24 сворачивается в сутки (26 → "02:00"). */
export function formatHour(hour: number, minute = 0): string {
  return `${pad(hour % 24)}:${pad(minute)}`
}

function pad(n: number): string {
  return String(n).padStart(2, '0')
}
