import { PrismaClient } from '@prisma/client'
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
      specs: (b.specs ?? undefined) as object | undefined,
      amenities: b.amenities as object,
      badge: (b.badge ?? undefined) as object | undefined,
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
