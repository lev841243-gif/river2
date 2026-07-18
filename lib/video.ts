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

function ffprobe(args: string[]): Promise<string | null> {
  return new Promise((resolve) => {
    const p = spawn('ffprobe', ['-v', 'error', ...args], { stdio: ['ignore', 'pipe', 'ignore'] })
    let out = ''
    p.stdout.on('data', (c) => (out += c))
    p.on('error', () => resolve(null)) // ffprobe нет
    p.on('close', () => resolve(out.trim()))
  })
}

/** Кодек видеодорожки (`h264`, `hevc`, …) или null, если ffprobe недоступен. */
function probeCodec(absPath: string): Promise<string | null> {
  return ffprobe([
    '-select_streams', 'v:0',
    '-show_entries', 'stream=codec_name',
    '-of', 'csv=p=0',
    absPath,
  ]).then((v) => v || null)
}

/** Есть ли звуковая дорожка. null — ffprobe недоступен. */
export async function hasAudioTrack(absPath: string): Promise<boolean | null> {
  const out = await ffprobe([
    '-select_streams', 'a',
    '-show_entries', 'stream=codec_name',
    '-of', 'csv=p=0',
    absPath,
  ])
  if (out === null) return null
  return out.length > 0
}

/** Кодек видео — публично, чтобы скрипты могли выбрать дешёвый путь. */
export function videoCodec(absPath: string) {
  return probeCodec(absPath)
}

/**
 * Убирает звук БЕЗ перекодирования видео (`-c:v copy`) — мгновенно и без потери
 * качества. Для уже сжатых роликов это правильный путь: повторный проход
 * через libx264 отнял бы качество второй раз ради того же результата.
 */
export async function stripAudioInPlace(absPath: string): Promise<CompressResult | null> {
  const ext = path.extname(absPath)
  const tmp = `${absPath}.tmp${ext}`
  const before = (await stat(absPath)).size

  const code = await runFfmpeg([
    '-y',
    '-i', absPath,
    '-c:v', 'copy',
    '-an',
    '-movflags', '+faststart',
    tmp,
  ])
  if (code !== 0) {
    await unlink(tmp).catch(() => {})
    return null
  }

  const after = (await stat(tmp)).size
  await rename(tmp, absPath)
  return { before, after }
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
  // Съёмка с iPhone — это HEVC (h265). Chrome и Firefox его в mp4 не
  // декодируют: играет звук, картинки нет. Значит перекодирование здесь нужно
  // не только ради размера, но и ради того, чтобы видео вообще показывалось.
  const sourceCodec = await probeCodec(absPath)
  const needsCodecFix = sourceCodec !== null && sourceCodec !== 'h264'

  const code = await runFfmpeg([
    '-y',
    '-i', absPath,
    // Ограничиваем 1920 по длинной стороне; вторым scale добиваем до чётных
    // размеров — H.264 не кодирует нечётные.
    '-vf', "scale='min(1920,iw)':'min(1920,ih)':force_original_aspect_ratio=decrease,scale=trunc(iw/2)*2:trunc(ih/2)*2",
    '-c:v', 'libx264',
    '-crf', '27',
    '-preset', 'veryfast',
    // Звук вырезаем совсем: на сайте ролики играют без него, а дорожка — это
    // лишний трафик. Плеер дополнительно с muted — на случай, если файл не
    // прошёл через ffmpeg и звук в нём остался.
    '-an',
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
  // Уже сжатый ролик может стать больше — тогда оставляем исходник. Но если
  // исходник в неподдерживаемом кодеке (HEVC), берём результат в любом случае:
  // файл поменьше, который не показывается, хуже файла побольше, который
  // показывается.
  if (after >= before && !needsCodecFix) {
    await unlink(tmp).catch(() => {})
    return null
  }

  // rename в пределах одной ФС атомарен: запрос получит либо старый файл,
  // либо новый, но не половину.
  await rename(tmp, absPath)
  return { before, after }
}
