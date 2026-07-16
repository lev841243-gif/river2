import Link from 'next/link'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { Card, fmtPrice } from '../ui'
import { moveBoat, toggleBoat } from './actions'

export const dynamic = 'force-dynamic'

export default async function BoatsPage() {
  await requireAdmin()

  const boats = await prisma.boat.findMany({
    orderBy: { sortOrder: 'asc' },
    select: {
      id: true,
      slug: true,
      nameRu: true,
      price: true,
      isVisible: true,
      premium: true,
      isNew: true,
      _count: { select: { bookings: true } },
    },
  })

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="text-xl font-medium">Лодки</h1>
        <span className="text-sm text-muted-foreground">{boats.length} шт.</span>
      </div>

      <Card className="border-amber-500/20">
        <p className="text-sm text-muted-foreground">
          Фото пока живут в репозитории (<code className="text-foreground">public/boats/</code>), в
          базе — только имена файлов. Поэтому добавить лодку или заменить фото можно только через
          git и пересборку; здесь правятся тексты, цены, ТТХ, ярлык и порядок.
        </p>
      </Card>

      <div className="space-y-2">
        {boats.map((b, i) => (
          <Card key={b.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`/admin/boats/${b.id}`} className="font-medium hover:text-primary">
                    {b.nameRu}
                  </Link>
                  {b.premium && <span className="text-xs text-primary">флагман</span>}
                  {b.isNew && <span className="text-xs text-muted-foreground">новинка</span>}
                  {!b.isVisible && (
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs text-muted-foreground">
                      скрыта
                    </span>
                  )}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">
                  {fmtPrice(b.price)}
                  {b.price != null && ' / час'} · заявок: {b._count.bookings}
                </div>
              </div>

              <div className="flex items-center gap-1">
                <form action={moveBoat}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="up" />
                  <button type="submit" disabled={i === 0} className={iconBtn}>
                    ↑
                  </button>
                </form>
                <form action={moveBoat}>
                  <input type="hidden" name="id" value={b.id} />
                  <input type="hidden" name="dir" value="down" />
                  <button type="submit" disabled={i === boats.length - 1} className={iconBtn}>
                    ↓
                  </button>
                </form>
                <form action={toggleBoat}>
                  <input type="hidden" name="id" value={b.id} />
                  <button type="submit" className={iconBtn}>
                    {b.isVisible ? 'Скрыть' : 'Показать'}
                  </button>
                </form>
                <Link href={`/admin/boats/${b.id}`} className={iconBtn}>
                  Править
                </Link>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}

const iconBtn =
  'rounded-md border border-border px-2.5 py-1.5 text-xs text-muted-foreground transition hover:text-foreground disabled:opacity-30'
