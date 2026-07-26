/**
 * Номер подарочного сертификата: `DNO` + `YY` + `MM` + `NNNN`.
 *
 * Например `DNO25060001` — 1-й сертификат, выданный в июне 2026-го. Год и
 * месяц — петербургские (по ним же считается счётчик): сертификат «родился»
 * по местному времени менеджера, а не по UTC, иначе выданный поздно вечером
 * 30-го числа улетел бы в следующий месяц.
 *
 * Счётчик NNNN сбрасывается помесячно: `0001` — первый сертификат месяца.
 */

import { toSpbParts } from '@/lib/spb-time'

const pad = (n: number, width: number) => String(n).padStart(width, '0')

/** `DNO2506` — префикс всех номеров текущего месяца. */
export function certPrefix(now: Date = new Date()): string {
  const { year, month } = toSpbParts(now)
  return `DNO${pad(year % 100, 2)}${pad(month, 2)}`
}

/** Собрать полный номер из префикса и порядкового числа. */
export function formatNumber(prefix: string, seq: number): string {
  return `${prefix}${pad(seq, 4)}`
}

/**
 * Разобрать порядковый номер из хвоста. Внутри одного месяца длина номера
 * постоянна (префикс + 4 цифры), поэтому лексикографическая сортировка по
 * `number` совпадает с числовой — на этом держится выбор «последнего» в service.
 */
export function seqOf(number: string, prefix: string): number {
  const tail = Number(number.slice(prefix.length))
  return Number.isFinite(tail) ? tail : 0
}
