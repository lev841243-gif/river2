import { Prisma, PrismaClient } from '@prisma/client'
import { boats } from '../lib/i18n'

const prisma = new PrismaClient()

async function main() {
  for (let i = 0; i < boats.length; i++) {
    const b = boats[i]
    const data = {
      dir: b.dir,
      cover: b.cover,
      photos: b.photos,
      nameRu: b.name.ru,
      nameEn: b.name.en,
      descRu: b.desc.ru,
      descEn: b.desc.en,
      price: b.price ?? null,
      // Prisma.DbNull, а не undefined: undefined значит «не трогать поле», и
      // убранный из i18n ярлык навсегда остался бы в БД. Для Json-полей обычный
      // null означал бы JSON-значение null, поэтому нужен именно DbNull.
      specs: (b.specs ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
      amenities: b.amenities as unknown as Prisma.InputJsonValue,
      badge: (b.badge ?? Prisma.DbNull) as Prisma.InputJsonValue | typeof Prisma.DbNull,
      premium: Boolean(b.premium),
      isNew: Boolean(b.isNew),
      isVisible: true,
      sortOrder: i,
    }
    await prisma.boat.upsert({
      where: { slug: b.id },
      update: data,
      create: { slug: b.id, ...data },
    })
    console.log(`✓ ${b.id}`)
  }
  console.log(`\nЗагружено лодок: ${boats.length}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
