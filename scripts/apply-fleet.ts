import { Prisma, PrismaClient } from '@prisma/client'
import { boats } from '../lib/i18n'

/**
 * Безопасная синхронизация порядка флота и добавление новых лодок из
 * lib/i18n.ts в БД — БЕЗ полного реseed.
 *
 * Зачем отдельно от prisma/seed.ts: seed делает upsert со всеми полями и
 * перезатёр бы правки, сделанные заказчиком в админке (цены, ТТХ, скрытые
 * лодки). Этот скрипт у существующих лодок трогает только sortOrder, а
 * отсутствующие в БД (например, новая «Картье») — создаёт целиком.
 *
 * Идемпотентный: можно гонять повторно. Деплой его сам не запускает —
 * вызывается вручную при изменении состава/порядка флота.
 */
const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.boat.findMany({ select: { slug: true } })
  const known = new Set(existing.map((b) => b.slug))

  let reordered = 0
  let created = 0

  for (let i = 0; i < boats.length; i++) {
    const b = boats[i]
    if (known.has(b.id)) {
      await prisma.boat.update({ where: { slug: b.id }, data: { sortOrder: i } })
      reordered++
    } else {
      await prisma.boat.create({
        data: {
          slug: b.id,
          dir: b.dir,
          cover: b.cover,
          photos: b.photos,
          nameRu: b.name.ru,
          nameEn: b.name.en,
          descRu: b.desc.ru,
          descEn: b.desc.en,
          price: b.price ?? null,
          specs: (b.specs ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
          amenities: b.amenities as unknown as Prisma.InputJsonValue,
          badge: (b.badge ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
          premium: Boolean(b.premium),
          isNew: Boolean(b.isNew),
          isVisible: true,
          sortOrder: i,
        },
      })
      created++
      console.log(`+ создана: ${b.id}`)
    }
  }

  console.log(`\nПорядок обновлён у ${reordered} лодок, создано новых: ${created}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
