import { boats as staticBoats, type Boat } from '@/lib/i18n'

/**
 * Источник флота для сайта.
 * Пока БД не подключена (нет DATABASE_URL) или пуста — используем статический
 * список из lib/i18n.ts, поэтому сайт работает и до миграции на БД.
 */
export async function getBoats(): Promise<Boat[]> {
  if (!process.env.DATABASE_URL) return staticBoats
  try {
    const { prisma } = await import('@/lib/prisma')
    const rows = await prisma.boat.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    })
    if (rows.length === 0) return staticBoats
    return rows.map(
      (r): Boat => ({
        id: r.slug,
        dir: r.dir,
        cover: r.cover,
        photos: r.photos,
        price: r.price,
        isNew: r.isNew || undefined,
        badge: (r.badge as unknown as Boat['badge']) ?? undefined,
        name: { ru: r.nameRu, en: r.nameEn },
        desc: { ru: r.descRu, en: r.descEn },
        specs: (r.specs as unknown as Boat['specs']) ?? null,
        amenities: r.amenities as unknown as Boat['amenities'],
      }),
    )
  } catch (e) {
    console.error('[getBoats] DB unavailable, falling back to static fleet:', e)
    return staticBoats
  }
}
