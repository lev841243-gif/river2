import { randomUUID } from 'node:crypto'
import { copyFile, mkdir, readdir } from 'node:fs/promises'
import path from 'node:path'
import { PrismaClient } from '@prisma/client'

/**
 * Разовый импорт готовой пачки фото/видео в раздел «Моменты».
 *
 * Обычный путь наполнения — админка (/admin/gallery). Этот скрипт нужен, когда
 * файлы уже лежат папкой на диске: он копирует их в public/uploads/gallery и
 * заводит записи в базе. Константы продублированы намеренно — чтобы скрипт
 * запускался через tsx без резолва alias «@/».
 *
 *   npx tsx scripts/import-gallery.ts "<папка с файлами>"
 */
const ALLOWED: Record<string, 'image' | 'video'> = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.mov': 'video',
}

const prisma = new PrismaClient()

async function main() {
  const src = process.argv[2]
  if (!src) {
    console.error('Укажите папку: npx tsx scripts/import-gallery.ts "<папка>"')
    process.exit(1)
  }

  const dir = path.join(process.cwd(), 'uploads', 'gallery')
  await mkdir(dir, { recursive: true })

  const last = await prisma.galleryItem.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  let order = (last?.sortOrder ?? -1) + 1

  let added = 0
  for (const name of (await readdir(src)).sort()) {
    const ext = path.extname(name).toLowerCase()
    const kind = ALLOWED[ext]
    if (!kind) {
      console.log(`пропуск (формат): ${name}`)
      continue
    }
    // Имя своё: исходные имена могут повторяться и перезаписать чужой файл.
    const out = `${randomUUID()}${ext}`
    await copyFile(path.join(src, name), path.join(dir, out))
    await prisma.galleryItem.create({ data: { kind, file: out, sortOrder: order++ } })
    console.log(`+ ${name} → ${out} (${kind})`)
    added++
  }

  console.log(`\nДобавлено в галерею: ${added}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
