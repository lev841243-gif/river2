import { spawn } from 'node:child_process'
import { rename, stat, unlink } from 'node:fs/promises'
import path from 'node:path'

/**
 * Сжатие видео через ffmpeg.
 *
 * Ролик с телефона — 5–15 МБ на десяток секунд. Пережатие даёт 3–5-кратную
 * экономию без заметной потери качества.
 *
 * Два принципиальных момента:
 *
 * 1. Пишем результат ПОД ТЕМ ЖЕ ИМЕНЕМ. Главная статична (ISR, 5 минут), и
 *    если бы имя менялось, страница до следующей ревалидации ссылалась бы на
 *    исчезнувший файл — видео пропало бы у посетителей.
 * 2. Контейнер сохраняем (mp4 → mp4, mov → mov): имя файла и Content-Type
 *    должны остаться верными. webm не трогаем — там VP9, пережатие слишком
 *    медленное, а файлы и так компактные.
 *
 * Кодек — H.264/AAC намеренно, а не VP9/webm: mp4 играет везде, включая
 * старые iPhone.
 */

/** Контейнеры, которые умеем пережимать на месте. */
const COMPRESSIBLE = new Set(['.mp4', '.mov'])

export function isCompressibleVideo(file: string) {
  return COMPRESSIBLE.has(path.extname(file).toLowerCase())
}

export interface CompressResult {
  before: number
  after: number
}

/** Запуск ffmpeg. null — если ffmpeg не установлен (например, на Windows-машине разработчика). */
function runFfmpeg(args: string[]): Promise<number | null> {
  return new Promise((resolve) => {
    const p = spawn('ffmpeg', args, { stdio: 'ignore' })
    p.on('error', () => resolve(null)) // ENOENT — ffmpeg нет
    p.on('close', (code) => resolve(code ?? 1))
  })
}

/**
 * Пережимает файл на месте. Возвращает null, если ffmpeg недоступен, сжатие
 * не удалось или результат не стал меньше — в этих случаях исходник остаётся
 * нетронутым.
 */
export async function compressVideoInPlace(absPath: string): Promise<CompressResult | null> {
  if (!isCompressibleVideo(absPath)) return null

  const ext = path.extname(absPath)
  const tmp = `${absPath}.tmp${ext}`

  const before = (await stat(absPath)).size

  const code = await runFfmpeg([
    '-y',
    '-i', absPath,
    // Ограничиваем 1920 по длинной стороне; вторым scale добиваем до чётных
    // размеров — H.264 не кодирует нечётные.
    '-vf', "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v', 'libx264',
    '-crf', '27',
    '-preset', 'veryfast',
    '-c:a', 'aac',
    '-b:a', '128k',
    // Индекс в начало файла: без этого браузер не начнёт играть, пока не
    // скачает ролик целиком.
    '-movflags', '+faststart',
    tmp,
  ])

  if (code !== 0) {
    await unlink(tmp).catch(() => {})
    return null
  }

  const after = (await stat(tmp)).size
  // Уже сжатый ролик может стать больше — тогда оставляем исходник.
  if (after >= before) {
    await unlink(tmp).catch(() => {})
    return null
  }

  // rename в пределах одной ФС атомарен: запрос получит либо старый файл,
  // либо новый, но не половину.
  await rename(tmp, absPath)
  return { before, after }
}
