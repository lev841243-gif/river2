'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'
import { revalidatePath } from 'next/cache'
import { requireAdmin } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { ALLOWED_EXT, MAX_FILE_BYTES, galleryDir } from '@/lib/gallery'

export interface GalleryState {
  error?: string
  ok?: string
}

/** Главная статична (ISR) — без пометки правка не появилась бы на сайте. */
function revalidatePublicGallery() {
  revalidatePath('/')
  revalidatePath('/en')
  revalidatePath('/admin/gallery')
}

const MB = 1024 * 1024

/**
 * Фото приводим к webp: снимок с телефона — это 8–12 МБ, и без пережатия он
 * так и уехал бы посетителям. Остальные фото на сайте (лодки) тоже webp.
 * Видео не трогаем: пережать его быстро нельзя, а server action столько не
 * живёт — см. разбор в Docs/stage2.md.
 */
const MAX_IMAGE_WIDTH = 1600
const WEBP_QUALITY = 80

export async function uploadGallery(
  _prev: GalleryState,
  formData: FormData,
): Promise<GalleryState> {
  await requireAdmin()

  const files = formData.getAll('files').filter((f): f is File => f instanceof File && f.size > 0)
  if (files.length === 0) return { error: 'Выберите хотя бы один файл' }

  const dir = galleryDir()
  await mkdir(dir, { recursive: true })

  // Новые кладём в конец: порядок правится стрелками.
  const last = await prisma.galleryItem.findFirst({
    orderBy: { sortOrder: 'desc' },
    select: { sortOrder: true },
  })
  let order = (last?.sortOrder ?? -1) + 1

  let saved = 0
  for (const f of files) {
    const ext = path.extname(f.name).toLowerCase()
    const kind = ALLOWED_EXT[ext]
    if (!kind) {
      return { error: `«${f.name}»: формат не поддерживается. Можно: ${Object.keys(ALLOWED_EXT).join(', ')}` }
    }
    if (f.size > MAX_FILE_BYTES) {
      return { error: `«${f.name}»: ${Math.round(f.size / MB)} МБ — больше лимита ${MAX_FILE_BYTES / MB} МБ` }
    }

    // Имя своё: файл с телефона может называться как угодно и повторяться,
    // а совпадение перезаписало бы чужую картинку.
    const id = randomUUID()
    const buf = Buffer.from(await f.arrayBuffer())

    if (kind === 'image') {
      const name = `${id}.webp`
      try {
        await sharp(buf)
          // rotate() без аргументов разворачивает по EXIF: снимки с телефона
          // иначе лежат на боку. Заодно EXIF (в т.ч. геометки) не сохраняется.
          .rotate()
          .resize({ width: MAX_IMAGE_WIDTH, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(path.join(dir, name))
      } catch {
        return { error: `«${f.name}»: не удалось обработать — файл повреждён или это не изображение` }
      }
      await prisma.galleryItem.create({ data: { kind, file: name, sortOrder: order++ } })
    } else {
      const name = `${id}${ext}`
      await writeFile(path.join(dir, name), buf)
      await prisma.galleryItem.create({ data: { kind, file: name, sortOrder: order++ } })
    }
    saved++
  }

  revalidatePublicGallery()
  return { ok: `Загружено файлов: ${saved}. На сайте обновится в течение минуты.` }
}

/** Удаление: сначала запись, потом файл — «сирота» на диске безобиднее битой плитки. */
export async function deleteGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const item = await prisma.galleryItem.findUnique({ where: { id }, select: { file: true } })
  if (!item) return

  await prisma.galleryItem.delete({ where: { id } })
  try {
    await unlink(path.join(galleryDir(), item.file))
  } catch {
    // Файла может не быть (удалили руками) — запись уже убрана, это не ошибка.
  }

  revalidatePublicGallery()
}

export async function toggleGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const item = await prisma.galleryItem.findUnique({ where: { id }, select: { isVisible: true } })
  if (!item) return

  await prisma.galleryItem.update({ where: { id }, data: { isVisible: !item.isVisible } })
  revalidatePublicGallery()
}

/** Сдвиг в порядке показа. Как у лодок: переписываем весь порядок номерами по
 *  списку — при совпадающих sortOrder обмен значений ничего не дал бы. */
export async function moveGalleryItem(formData: FormData) {
  await requireAdmin()

  const id = String(formData.get('id') ?? '')
  const dir = String(formData.get('dir') ?? '')

  const all = await prisma.galleryItem.findMany({
    orderBy: { sortOrder: 'asc' },
    select: { id: true },
  })
  const i = all.findIndex((x) => x.id === id)
  const j = dir === 'up' ? i - 1 : i + 1
  if (i < 0 || j < 0 || j >= all.length) return

  const reordered = [...all]
  ;[reordered[i], reordered[j]] = [reordered[j], reordered[i]]

  await prisma.$transaction(
    reordered.map((x, idx) =>
      prisma.galleryItem.update({ where: { id: x.id }, data: { sortOrder: idx } }),
    ),
  )

  revalidatePublicGallery()
}
