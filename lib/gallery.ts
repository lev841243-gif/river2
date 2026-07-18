import path from 'node:path'
import { prisma } from '@/lib/prisma'

/**
 * Раздел «Моменты» (галерея вечеров).
 *
 * Файлы лежат в папке `uploads/gallery` в корне проекта и НЕ попадают в git:
 * деплой их не трогает, потому что делает только `git checkout -- .` и
 * `git pull`, без `git clean`. В базе, как и у лодок, хранится только имя файла.
 *
 * ⚠️ Почему НЕ `public/`. Next составляет список файлов `public/` на этапе
 * сборки, и всё загруженное после деплоя отдавалось 404 до следующей
 * пересборки — то есть загрузка из админки не работала вовсе. Поэтому файлы
 * лежат вне `public/` и отдаются route handler'ом `app/media/gallery/[file]`.
 */

export type GalleryKind = 'image' | 'video'

export interface GalleryMedia {
  id: string
  kind: GalleryKind
  /** Готовый путь для <img>/<video>. */
  src: string
}

/** Папка с файлами галереи (абсолютный путь на диске), вне `public/`. */
export function galleryDir() {
  return path.join(process.cwd(), 'uploads', 'gallery')
}

/** Публичный URL файла — отдаёт route handler, а не статика Next. */
export function galleryUrl(file: string) {
  return `/media/gallery/${encodeURIComponent(file)}`
}

/** Что разрешаем грузить: расширение → тип. */
export const ALLOWED_EXT: Record<string, GalleryKind> = {
  '.jpg': 'image',
  '.jpeg': 'image',
  '.png': 'image',
  '.webp': 'image',
  '.mp4': 'video',
  '.webm': 'video',
  '.mov': 'video',
}

/** Потолок на файл. Совпадает с serverActions.bodySizeLimit в next.config.mjs. */
export const MAX_FILE_BYTES = 64 * 1024 * 1024

export function kindByFile(file: string): GalleryKind | null {
  return ALLOWED_EXT[path.extname(file).toLowerCase()] ?? null
}

/** Галерея для сайта: только видимые, в заданном порядке. */
export async function getGalleryItems(): Promise<GalleryMedia[]> {
  if (!process.env.DATABASE_URL) return []
  try {
    const rows = await prisma.galleryItem.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
      select: { id: true, kind: true, file: true },
    })
    return rows.map((r) => ({
      id: r.id,
      kind: r.kind === 'video' ? 'video' : 'image',
      src: galleryUrl(r.file),
    }))
  } catch (e) {
    // Раздел не должен ронять главную, если база недоступна.
    console.error('[getGalleryItems] БД недоступна:', e)
    return []
  }
}
