import Link from 'next/link'
import type { BookingSource } from '@prisma/client'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SOURCE_LABEL } from '@/lib/admin-data'
import { Card, fmtDateTime, fmtPrice, StatusBadge } from './ui'

export const dynamic = 'force-dynamic'

export default async function DashboardPage() {
  await requireAdmin()

  const now = new Date()
  const monthAgo = new Date(now.getTime() - 30 * 86_400_000)

  const [bySource, needAttention, upcoming, newCount] = await Promise.all([
    // Конверсия по источникам (ТЗ, п. 6.6) — за последние 30 дней по дате
    // создания заявки: источник — это про привлечение, а не про дату прогулки.
    prisma.booking.groupBy({
      by: ['source', 'status'],
      where: { createdAt: { gte: monthAgo } },
      _count: { _all: true },
    }),
    // Необработанные — то, ради чего менеджер сюда заходит.
    prisma.booking.findMany({
      where: { status: { in: ['NEW', 'REVIEW'] } },
      include: { boat: { select: { nameRu: true } } },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
    // Ближайшие подтверждённые прогулки.
    prisma.booking.findMany({
      where: { status: 'CONFIRMED', startAt: { gte: now } },
      include: { boat: { select: { nameRu: true } } },
      orderBy: { startAt: 'asc' },
      take: 5,
    }),
    prisma.booking.count({ where: { status: 'NEW' } }),
  ])

  const sources = summarize(bySource)

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-medium">Сводка</h1>

      {newCount > 0 && (
        <Card className="border-blue-500/30">
          <Link href="/admin/bookings?status=NEW" className="text-sm">
            Новых заявок: <span className="text-blue-300">{newCount}</span> — обработать →
          </Link>
        </Card>
      )}

      <section>
        <h2 className="mb-2 text-sm text-muted-foreground">Требуют внимания</h2>
        {needAttention.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">Всё разобрано.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {needAttention.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block">
                <Card className="transition hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={b.status} />
                      {b.clientName} · {b.boat.nameRu}
                    </span>
                    <span className="text-muted-foreground">{fmtDateTime(b.startAt)}</span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted-foreground">Ближайшие прогулки</h2>
        {upcoming.length === 0 ? (
          <Card>
            <p className="text-sm text-muted-foreground">Подтверждённых впереди нет.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {upcoming.map((b) => (
              <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block">
                <Card className="transition hover:border-primary/40">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
                    <span>
                      {fmtDateTime(b.startAt)} · {b.boat.nameRu}
                    </span>
                    <span className="text-muted-foreground">
                      {b.clientName} · {fmtPrice(b.priceSnapshot)}
                    </span>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-2 text-sm text-muted-foreground">Источники за 30 дней</h2>
        <Card>
          {sources.length === 0 ? (
            <p className="text-sm text-muted-foreground">За месяц заявок не было.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-normal">Источник</th>
                    <th className="pb-2 font-normal">Заявок</th>
                    <th className="pb-2 font-normal">Подтверждено</th>
                    <th className="pb-2 font-normal">Конверсия</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map((s) => (
                    <tr key={s.source} className="border-t border-border">
                      <td className="py-2">
                        <Link
                          href={`/admin/bookings?source=${s.source}`}
                          className="hover:text-primary"
                        >
                          {SOURCE_LABEL[s.source]}
                        </Link>
                      </td>
                      <td className="py-2">{s.total}</td>
                      <td className="py-2">{s.won}</td>
                      <td className="py-2 text-muted-foreground">
                        {s.total ? Math.round((s.won / s.total) * 100) : 0}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </section>
    </div>
  )
}

/**
 * groupBy отдаёт по строке на пару «источник + статус» — сворачиваем в один
 * ряд на источник. «Выиграно» — подтверждённые и завершённые: завершённая
 * прогулка тоже была подтверждена, и не считать её значило бы занижать
 * конверсию старых источников.
 */
function summarize(rows: { source: BookingSource; status: string; _count: { _all: number } }[]) {
  const acc = new Map<BookingSource, { source: BookingSource; total: number; won: number }>()

  for (const r of rows) {
    const cur = acc.get(r.source) ?? { source: r.source, total: 0, won: 0 }
    cur.total += r._count._all
    if (r.status === 'CONFIRMED' || r.status === 'COMPLETED') cur.won += r._count._all
    acc.set(r.source, cur)
  }

  return [...acc.values()].sort((a, b) => b.total - a.total)
}
