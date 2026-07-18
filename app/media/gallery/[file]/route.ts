import { createReadStream } from 'node:fs'
import { stat } from 'node:fs/promises'
import path from 'node:path'
import { Readable } from 'node:stream'
import { galleryDir } from '@/lib/gallery'

/**
 * Отдача файлов галереи «Моменты».
 *
 * Зачем свой обработчик, а не `public/`: Next составляет список файлов
 * `public/` на этапе сборки, поэтому всё загруженное из админки после деплоя
 * отдавалось 404 до следующей пересборки. Файлы лежат в `uploads/gallery` вне
 * `public/`, и раздаются отсюда — одинаково на localhost и на боевом.
 *
 * Range обязателен: без него браузер не даёт перематывать видео, а Safari
 * вообще отказывается его играть.
 */

const MIME: Record<string, string> = {
  '.webp': 'image/webp',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.mov': 'video/quicktime',
}

const notFound = () => new Response('Not found', { status: 404 })

export async function GET(req: Request, ctx: { params: Promise<{ file: string }> }) {
  const { file } = await ctx.params

  // Имя приходит из URL: не пускаем ни разделители, ни переходы вверх, иначе
  // запрос вида ..%2F..%2F.env вычитал бы что угодно с диска.
  if (file.includes('/') || file.includes('\\') || file.includes('..')) return notFound()

  const type = MIME[path.extname(file).toLowerCase()]
  if (!type) return notFound()

  const abs = path.join(galleryDir(), file)
  let st
  try {
    st = await stat(abs)
  } catch {
    return notFound()
  }
  if (!st.isFile()) return notFound()

  const headers = new Headers({
    'Content-Type': type,
    'Accept-Ranges': 'bytes',
    // Имя файла — UUID, содержимое под ним не меняется, поэтому кэшируем
    // надолго. При замене видео после сжатия имя то же, но файл живёт на
    // сервере, а не у клиента, — свежую версию получат новые посетители.
    'Cache-Control': 'public, max-age=31536000, immutable',
  })

  const range = req.headers.get('range')
  const m = range ? /^bytes=(\d*)-(\d*)$/.exec(range.trim()) : null
  if (m) {
    const start = m[1] ? Number(m[1]) : 0
    const end = m[2] ? Number(m[2]) : st.size - 1
    if (!Number.isFinite(start) || !Number.isFinite(end) || start > end || start >= st.size) {
      return new Response(null, {
        status: 416,
        headers: { 'Content-Range': `bytes */${st.size}` },
      })
    }
    const last = Math.min(end, st.size - 1)
    headers.set('Content-Range', `bytes ${start}-${last}/${st.size}`)
    headers.set('Content-Length', String(last - start + 1))
    const stream = Readable.toWeb(createReadStream(abs, { start, end: last }))
    return new Response(stream as ReadableStream, { status: 206, headers })
  }

  headers.set('Content-Length', String(st.size))
  return new Response(Readable.toWeb(createReadStream(abs)) as ReadableStream, {
    status: 200,
    headers,
  })
}
