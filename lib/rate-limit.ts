/**
 * Простой лимит частоты запросов в памяти процесса (ТЗ, п. 6.1).
 *
 * Ограничение: счётчик живёт в памяти одного процесса — он обнуляется при
 * рестарте и не общий для нескольких инстансов PM2 в кластере. Для MVP с одним
 * инстансом этого достаточно; при масштабировании счётчик надо унести в Redis.
 */

interface Bucket {
  count: number
  resetAt: number
}

const buckets = new Map<string, Bucket>()

/** Чтобы карта не росла бесконечно от разовых IP. */
const MAX_BUCKETS = 10_000

export interface RateLimitResult {
  ok: boolean
  retryAfterSeconds: number
}

export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now()
  const bucket = buckets.get(key)

  if (!bucket || now >= bucket.resetAt) {
    if (buckets.size >= MAX_BUCKETS) evictExpired(now)
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSeconds: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSeconds: 0 }
}

function evictExpired(now: number) {
  for (const [key, bucket] of buckets) {
    if (now >= bucket.resetAt) buckets.delete(key)
  }
  // Если всё ещё переполнено — все записи живые; выкидываем самую раннюю.
  if (buckets.size >= MAX_BUCKETS) {
    const oldest = [...buckets.entries()].sort((a, b) => a[1].resetAt - b[1].resetAt)[0]
    if (oldest) buckets.delete(oldest[0])
  }
}

/** IP клиента за обратным прокси (Nginx на Beget проставляет x-forwarded-for). */
export function clientIp(headers: Headers): string {
  const fwd = headers.get('x-forwarded-for')
  if (fwd) return fwd.split(',')[0].trim()
  return headers.get('x-real-ip') ?? 'unknown'
}
