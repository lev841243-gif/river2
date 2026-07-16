import Link from 'next/link'
import type { BookingSource, BookingStatus } from '@prisma/client'
import { requireAdmin } from '@/lib/auth'
import {
  countByStatus,
  listBoatsForFilter,
  listBookings,
  SOURCE_LABEL,
  STATUS_LABEL,
  type BookingFilters,
} from '@/lib/admin-data'
import { durationHours } from '@/lib/booking-rules'
import { Card, fmtDateTime, fmtPrice, StatusBadge } from '../ui'
import { Filters } from './filters'

// Персональные данные и живые статусы — ничего из этого кэшировать нельзя.
export const dynamic = 'force-dynamic'

type Search = Record<string, string | undefined>

export default async function BookingsPage({ searchParams }: { searchParams: Promise<Search> }) {
  await requireAdmin()
  const sp = await searchParams

  const filters: BookingFilters = {
    status: (sp.status as BookingStatus) || undefined,
    source: (sp.source as BookingSource) || undefined,
    boatId: sp.boat || undefined,
    from: sp.from || undefined,
    to: sp.to || undefined,
    q: sp.q || undefined,
  }
  const page = Number(sp.page ?? 0) || 0

  const [{ rows, total, pageSize }, counts, boats] = await Promise.all([
    listBookings(filters, page),
    countByStatus(),
    listBoatsForFilter(),
  ])

  const pages = Math.ceil(total / pageSize)

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">Заявки</h1>
        <span className="text-sm text-muted-foreground">Найдено: {total}</span>
      </div>

      <StatusTabs counts={counts} current={filters.status} sp={sp} />
      <Filters boats={boats} />

      {rows.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">Заявок по этим условиям нет.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {rows.map((b) => (
            <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block">
              <Card className="transition hover:border-primary/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      <span className="font-medium">{b.clientName}</span>
                      <span className="text-sm text-muted-foreground">{b.phone}</span>
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">
                      {b.boat.nameRu} · {fmtDateTime(b.startAt)} ·{' '}
                      {durationHours({ start: b.startAt, end: b.endAt })} ч · {b.guests} чел.
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm">{fmtPrice(b.priceSnapshot)}</div>
                    <div className="text-xs text-muted-foreground">{SOURCE_LABEL[b.source]}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {pages > 1 && <Pager page={page} pages={pages} sp={sp} />}
    </div>
  )
}

/** Ссылка с изменённым набором параметров — остальные фильтры сохраняются. */
function link(sp: Search, patch: Record<string, string | undefined>): string {
  const params = new URLSearchParams()
  for (const [k, v] of Object.entries({ ...sp, ...patch })) {
    if (v) params.set(k, v)
  }
  const qs = params.toString()
  return qs ? `/admin/bookings?${qs}` : '/admin/bookings'
}

function StatusTabs({
  counts,
  current,
  sp,
}: {
  counts: Record<string, number>
  current?: BookingStatus
  sp: Search
}) {
  const all = Object.values(counts).reduce((a, b) => a + b, 0)

  return (
    <div className="flex flex-wrap gap-1">
      <Link
        href={link(sp, { status: undefined, page: undefined })}
        className={tab(!current)}
      >
        Все <span className="text-muted-foreground">{all}</span>
      </Link>
      {(Object.keys(STATUS_LABEL) as BookingStatus[]).map((s) => (
        <Link key={s} href={link(sp, { status: s, page: undefined })} className={tab(current === s)}>
          {STATUS_LABEL[s]} <span className="text-muted-foreground">{counts[s] ?? 0}</span>
        </Link>
      ))}
    </div>
  )
}

const tab = (active: boolean) =>
  active
    ? 'rounded-md bg-muted px-3 py-1.5 text-sm'
    : 'rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:text-foreground'

function Pager({ page, pages, sp }: { page: number; pages: number; sp: Search }) {
  return (
    <div className="flex items-center justify-center gap-3 pt-2">
      {page > 0 && (
        <Link href={link(sp, { page: String(page - 1) })} className={tab(false)}>
          ← Назад
        </Link>
      )}
      <span className="text-sm text-muted-foreground">
        {page + 1} из {pages}
      </span>
      {page + 1 < pages && (
        <Link href={link(sp, { page: String(page + 1) })} className={tab(false)}>
          Вперёд →
        </Link>
      )}
    </div>
  )
}
