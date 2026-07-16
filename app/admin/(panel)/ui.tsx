import type { BookingStatus } from '@prisma/client'
import { STATUS_LABEL } from '@/lib/admin-data'
import { toSpbParts } from '@/lib/spb-time'

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Время всегда петербургское и всегда подписано.
 *
 * Без явной подписи менеджер из другого пояса (или сервер с чужой TZ) прочитал
 * бы не тот час — а бронь живёт по времени прогулки.
 */
export function fmtDateTime(d: Date): string {
  const p = toSpbParts(d)
  return `${pad(p.day)}.${pad(p.month)}.${p.year} ${pad(p.hour)}:${pad(p.minute)}`
}

export function fmtDate(d: Date): string {
  const p = toSpbParts(d)
  return `${pad(p.day)}.${pad(p.month)}.${p.year}`
}

export function fmtTime(d: Date): string {
  const p = toSpbParts(d)
  return `${pad(p.hour)}:${pad(p.minute)}`
}

export function fmtPrice(v: number | null): string {
  return v == null ? 'по запросу' : `${v.toLocaleString('ru-RU')} ₽`
}

const STATUS_STYLE: Record<BookingStatus, string> = {
  NEW: 'bg-blue-500/15 text-blue-300 border-blue-500/30',
  REVIEW: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  CONFIRMED: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  COMPLETED: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
  CANCELLED: 'bg-red-500/15 text-red-300 border-red-500/30',
}

export function StatusBadge({ status }: { status: BookingStatus }) {
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-xs ${STATUS_STYLE[status]}`}
    >
      {STATUS_LABEL[status]}
    </span>
  )
}

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-card p-4 ${className}`}>{children}</div>
  )
}
