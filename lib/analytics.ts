/**
 * Плоское представление заявки для аналитики и выгрузок.
 *
 * Один формат на всех потребителей: JSON-экспорт, Google Sheets, будущий
 * дашборд. Иначе колонки в таблице и поля в выгрузке разъедутся, и цифры
 * перестанут сходиться.
 *
 * Поля намеренно плоские и предподсчитанные (длительность, дата отдельно от
 * времени) — так их можно сразу сводить в таблице без формул.
 */

import type { Booking, Boat } from '@prisma/client'
import { durationHours } from '@/lib/booking-rules'
import { toSpbParts } from '@/lib/spb-time'

export interface AnalyticsRecord {
  id: string
  createdAt: string
  boatSlug: string
  boatName: string
  /** Дата начала по Москве — по ней удобно группировать в сводных таблицах. */
  startDate: string
  startTime: string
  endDate: string
  endTime: string
  durationHours: number
  guests: number
  clientName: string
  phone: string
  telegram: string | null
  comment: string | null
  price: number | null
  status: string
  source: string
  utmSource: string | null
  utmMedium: string | null
  utmCampaign: string | null
  lang: string
  /** true, если бронь завёл менеджер, а не клиент через сайт. */
  manual: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

function dateStr(d: Date): string {
  const p = toSpbParts(d)
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`
}

function timeStr(d: Date): string {
  const p = toSpbParts(d)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

export function toAnalyticsRecord(b: Booking & { boat: Pick<Boat, 'slug' | 'nameRu'> }): AnalyticsRecord {
  return {
    id: b.id,
    createdAt: b.createdAt.toISOString(),
    boatSlug: b.boat.slug,
    boatName: b.boat.nameRu,
    startDate: dateStr(b.startAt),
    startTime: timeStr(b.startAt),
    endDate: dateStr(b.endAt),
    endTime: timeStr(b.endAt),
    durationHours: durationHours({ start: b.startAt, end: b.endAt }),
    guests: b.guests,
    clientName: b.clientName,
    phone: b.phone,
    telegram: b.telegram,
    comment: b.comment,
    price: b.priceSnapshot,
    status: b.status,
    source: b.source,
    utmSource: b.utmSource,
    utmMedium: b.utmMedium,
    utmCampaign: b.utmCampaign,
    lang: b.lang,
    manual: b.source === 'MANUAL',
  }
}

/** Порядок колонок для Google Sheets — совпадает с ключами AnalyticsRecord. */
export const SHEET_COLUMNS: (keyof AnalyticsRecord)[] = [
  'id',
  'createdAt',
  'boatName',
  'startDate',
  'startTime',
  'endDate',
  'endTime',
  'durationHours',
  'guests',
  'clientName',
  'phone',
  'telegram',
  'comment',
  'price',
  'status',
  'source',
  'utmSource',
  'utmMedium',
  'utmCampaign',
  'lang',
  'manual',
]

export function toSheetRow(r: AnalyticsRecord): (string | number)[] {
  return SHEET_COLUMNS.map((k) => {
    const v = r[k]
    if (v == null) return ''
    if (typeof v === 'boolean') return v ? 'да' : 'нет'
    return v
  })
}
