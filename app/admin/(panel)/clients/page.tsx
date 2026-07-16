import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, fmtDate } from '../ui'

export const dynamic = 'force-dynamic'

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>
}) {
  await requireAdmin()
  const { q } = await searchParams

  // Телефон в базе записан как ввёл клиент («+7 (999) …»), поэтому ищем и по
  // сырой строке, и по одним цифрам.
  const digits = (q ?? '').replace(/\D/g, '')
  const where = q
    ? {
        OR: [
          { name: { contains: q, mode: 'insensitive' as const } },
          { phone: { contains: q } },
          ...(digits.length >= 3 ? [{ phone: { contains: digits } }] : []),
        ],
      }
    : {}

  const clients = await prisma.client.findMany({
    where,
    include: { _count: { select: { bookings: true } } },
    orderBy: { firstSeen: 'desc' },
    take: 100,
  })

  return (
    <div className="space-y-4">
      <h1 className="text-xl font-medium">Клиенты</h1>

      <form className="rounded-lg border border-border bg-card p-3">
        <label className="mb-1 block text-xs text-muted-foreground">Имя или телефон</label>
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Иван или 9991234567"
          className="w-full max-w-sm rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
        />
      </form>

      {clients.length === 0 ? (
        <Card>
          <p className="text-sm text-muted-foreground">Никого не нашлось.</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {clients.map((c) => (
            <Link key={c.id} href={`/admin/clients/${c.id}`} className="block">
              <Card className="transition hover:border-primary/40">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{c.name ?? 'Без имени'}</span>
                      {/*
                        Повторный — это уже больше одного обращения. Тот же
                        признак, по которому detectSource ставит источник REPEAT.
                      */}
                      {c._count.bookings > 1 && (
                        <span className="rounded-full border border-primary/30 px-2 py-0.5 text-xs text-primary">
                          повторный
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-sm text-muted-foreground">{c.phone}</div>
                  </div>
                  <div className="text-right text-sm text-muted-foreground">
                    <div>обращений: {c._count.bookings}</div>
                    <div className="text-xs">впервые: {fmtDate(c.firstSeen)}</div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
