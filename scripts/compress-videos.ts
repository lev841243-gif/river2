import path from 'node:path'
import { PrismaClient } from '@prisma/client'
import { compressVideoInPlace, isCompressibleVideo } from '../lib/video'

/**
 * Разовое пережатие уже загруженных видео галереи.
 *
 * Новые ролики сжимаются сами при загрузке (см. uploadGallery), но те, что
 * попали в галерею раньше, лежат как есть. Скрипт проходит по ним тем же
 * кодом. Идемпотентный: повторный прогон ничего не испортит — если результат
 * не стал меньше, файл остаётся прежним.
 *
 *   npx tsx scripts/compress-videos.ts
 */
const prisma = new PrismaClient()
const MB = 1024 * 1024

async function main() {
  const dir = path.join(process.cwd(), 'public', 'uploads', 'gallery')
  const items = await prisma.galleryItem.findMany({
    where: { kind: 'video' },
    orderBy: { sortOrder: 'asc' },
    select: { file: true },
  })

  let totalBefore = 0
  let totalAfter = 0
  let done = 0

  for (const it of items) {
    if (!isCompressibleVideo(it.file)) {
      console.log(`пропуск (контейнер): ${it.file}`)
      continue
    }
    process.stdout.write(`${it.file} … `)
    const r = await compressVideoInPlace(path.join(dir, it.file))
    if (!r) {
      console.log('без изменений')
      continue
    }
    console.log(`${(r.before / MB).toFixed(1)} → ${(r.after / MB).toFixed(1)} МБ`)
    totalBefore += r.before
    totalAfter += r.after
    done++
  }

  if (done === 0) {
    console.log('\nНечего сжимать.')
    return
  }
  console.log(
    `\nСжато роликов: ${done}. Итого ${(totalBefore / MB).toFixed(1)} → ` +
      `${(totalAfter / MB).toFixed(1)} МБ.`,
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
