/**
 * Транспорт клиентского бота (@neva10_booking_bot) — публичного, для клиентов.
 *
 * Отдельно от lib/telegram.ts намеренно: тот бот менеджерский и заперт на группу
 * (гард adminChatId), этот отвечает каждому в личке. Разные токены, разные
 * вебхуки; общее — только доменное ядро (createBooking и т.п.), не транспорт.
 *
 * Фаза 0 показала: sendPhoto принимает webp-обложки лодок как есть, конвертация
 * не нужна — обложки уже в webp.
 */

import { readFile } from 'node:fs/promises'

const API = 'https://api.telegram.org/bot'

export function clientBotConfigured(): boolean {
  return Boolean(process.env.CLIENT_BOT_TOKEN)
}

function token(): string {
  const t = process.env.CLIENT_BOT_TOKEN
  if (!t) throw new Error('CLIENT_BOT_TOKEN не задан')
  return t
}

interface TelegramResponse<T = unknown> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

export class TelegramApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'TelegramApiError'
  }

  /** 4xx — кривой запрос, повтор не поможет. 429 и 5xx стоит повторить. */
  get retryable(): boolean {
    return this.code === 429 || this.code >= 500
  }
}

/**
 * Вызов метода Bot API с повторами — тот же подход, что у менеджерского бота:
 * повторяем только сеть/таймаут/429/5xx, на 4xx не тратим время.
 */
export async function callClientTelegram<T = unknown>(
  method: string,
  payload: Record<string, unknown>,
  attempts = 3,
): Promise<T> {
  let lastError: unknown

  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${API}${token()}/${method}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000),
      })
      const data = (await res.json()) as TelegramResponse<T>
      if (data.ok) return data.result as T

      throw new TelegramApiError(
        data.error_code ?? 0,
        `Telegram ${method}: ${data.error_code} ${data.description}`,
      )
    } catch (e) {
      if (e instanceof TelegramApiError && !e.retryable) throw e
      lastError = e
    }

    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * 3 ** i))
  }

  throw lastError
}

/**
 * Отправить фото файлом с диска (multipart).
 *
 * Обложки лодок — статические webp в public/boats, лежат в git, поэтому путь
 * одинаков локально и на боевом. Фаза 0 показала: sendPhoto принимает webp как
 * есть. Если файла нет — не роняем диалог, шлём текст без картинки.
 */
export async function sendClientPhoto(
  chatId: number | string,
  filePath: string,
  caption: string,
  replyMarkup?: Record<string, unknown>,
): Promise<void> {
  let buf: Buffer
  try {
    buf = await readFile(filePath)
  } catch {
    await callClientTelegram('sendMessage', {
      chat_id: chatId,
      text: caption,
      parse_mode: 'HTML',
      ...(replyMarkup ? { reply_markup: replyMarkup } : {}),
    })
    return
  }

  const form = new FormData()
  form.append('chat_id', String(chatId))
  form.append('caption', caption)
  form.append('parse_mode', 'HTML')
  if (replyMarkup) form.append('reply_markup', JSON.stringify(replyMarkup))
  form.append('photo', new Blob([new Uint8Array(buf)], { type: 'image/webp' }), 'cover.webp')

  const res = await fetch(`${API}${token()}/sendPhoto`, { method: 'POST', body: form })
  const data = (await res.json()) as TelegramResponse
  if (!data.ok) throw new TelegramApiError(data.error_code ?? 0, `sendPhoto: ${data.description}`)
}

/** Ответ на нажатие inline-кнопки: без него у кнопки крутится «часики». */
export async function answerClientCallback(id: string, text?: string): Promise<void> {
  await callClientTelegram('answerCallbackQuery', {
    callback_query_id: id,
    ...(text ? { text } : {}),
  })
}

/** Экранирование для parse_mode: HTML — текст от клиента доверять нельзя. */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}
