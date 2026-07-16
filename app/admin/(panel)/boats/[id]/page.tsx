import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { BoatForm } from './boat-form'

export const dynamic = 'force-dynamic'

/** {ru:[...], en:[...]} из Json-поля → строки для textarea, по пункту на строку. */
function listOf(v: unknown, lang: 'ru' | 'en'): string {
  if (!v || typeof v !== 'object') return ''
  const arr = (v as Record<string, unknown>)[lang]
  return Array.isArray(arr) ? arr.join('\n') : ''
}

function badgeOf(v: unknown, lang: 'ru' | 'en'): string {
  if (!v || typeof v !== 'object') return ''
  const s = (v as Record<string, unknown>)[lang]
  return typeof s === 'string' ? s : ''
}

export default async function BoatPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const b = await prisma.boat.findUnique({ where: { id } })
  if (!b) notFound()

  return (
    <div className="space-y-4">
      <Link href="/admin/boats" className="text-sm text-muted-foreground hover:text-foreground">
        ← К списку
      </Link>

      <h1 className="text-xl font-medium">{b.nameRu}</h1>

      <BoatForm
        boat={{
          id: b.id,
          slug: b.slug,
          dir: b.dir,
          photoCount: b.photos.length,
          nameRu: b.nameRu,
          nameEn: b.nameEn,
          descRu: b.descRu,
          descEn: b.descEn,
          price: b.price,
          specsRu: listOf(b.specs, 'ru'),
          specsEn: listOf(b.specs, 'en'),
          amenitiesRu: listOf(b.amenities, 'ru'),
          amenitiesEn: listOf(b.amenities, 'en'),
          badgeRu: badgeOf(b.badge, 'ru'),
          badgeEn: badgeOf(b.badge, 'en'),
          premium: b.premium,
          isNew: b.isNew,
          isVisible: b.isVisible,
          sortOrder: b.sortOrder,
        }}
      />
    </div>
  )
}
