import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SOURCE_LABEL } from '@/lib/admin-data'
import { durationHours } from '@/lib/booking-rules'
import { phoneDigits } from '@/lib/telegram'
import { Card, fmtDate, fmtDateTime, fmtPrice, StatusBadge } from '../../ui'

export const dynamic = 'force-dynamic'

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const c = await prisma.client.findUnique({
    where: { id },
    include: {
      bookings: {
        include: { boat: { select: { nameRu: true } } },
        orderBy: { startAt: 'desc' },
      },
    },
  })
  if (!c) notFound()

  // Сумма только по подтверждённым и завершённым: новая заявка ещё ничего не
  // принесла, а отменённая — тем более.
  const earned = c.bookings
    .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.priceSnapshot ?? 0), 0)

  return (
    <div className="space-y-4">
      <Link href="/admin/clients" className="text-sm text-muted-foreground hover:text-foreground">
        ← К списку
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium">{c.name ?? 'Без имени'}</h1>
        {c.bookings.length > 1 && (
          <span className="rounded-full border border-primary/30 px-2 py-0.5 text-xs text-primary">
            повторный
          </span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <div className="text-xs text-muted-foreground">Телефон</div>
          <a href={`tel:${phoneDigits(c.phone)}`} className="text-primary hover:underline">
            {c.phone}
          </a>
          {c.telegram && (
            <div className="mt-2">
              <div className="text-xs text-muted-foreground">Telegram</div>
              <a
                href={`https://t.me/${c.telegram.replace(/^@/, '')}`}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {c.telegram}
              </a>
            </div>
          )}
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground">Обращений</div>
          <div className="text-2xl">{c.bookings.length}</div>
          <div className="mt-1 text-xs text-muted-foreground">впервые: {fmtDate(c.firstSeen)}</div>
        </Card>
        <Card>
          <div className="text-xs text-muted-foreground">Сумма подтверждённых</div>
          <div className="text-2xl">{fmtPrice(earned)}</div>
        </Card>
      </div>

      <h2 className="pt-2 text-sm text-muted-foreground">История обращений</h2>
      <div className="space-y-2">
        {c.bookings.map((b) => (
          <Link key={b.id} href={`/admin/bookings/${b.id}`} className="block">
            <Card className="transition hover:border-primary/40">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={b.status} />
                  <span className="text-sm">{b.boat.nameRu}</span>
                  <span className="text-sm text-muted-foreground">
                    {fmtDateTime(b.startAt)} · {durationHours({ start: b.startAt, end: b.endAt })} ч
                  </span>
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
    </div>
  )
}
