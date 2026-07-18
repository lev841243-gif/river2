'use server'

import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
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
    const name = `${randomUUID()}${ext}`
    await writeFile(path.join(dir, name), Buffer.from(await f.arrayBuffer()))
    await prisma.galleryItem.create({ data: { kind, file: name, sortOrder: order++ } })
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
