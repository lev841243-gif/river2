/**
 * Работа с Telegram Bot API: уведомления менеджеру о заявках.
 *
 * Проверено на живом боте, прежде чем строить на этом:
 * - `tel:` в кнопке Telegram ОТКЛОНЯЕТ («Wrong port number specified»);
 * - номер телефона в тексте НЕ становится ссылкой автоматически;
 * - `<code>` вокруг номера работает — тап копирует его в буфер;
 * - кнопка `copy_text` работает (Bot API 7.11+);
 * - `wa.me` и `t.me` в кнопках работают.
 * Отсюда и раскладка кнопок ниже: звонок — через копирование номера.
 */

import type { BookingStatus } from '@prisma/client'
import { durationHours } from '@/lib/booking-rules'
import { toSpbParts } from '@/lib/spb-time'

const API = 'https://api.telegram.org/bot'

export function telegramConfigured(): boolean {
  return Boolean(process.env.TELEGRAM_BOT_TOKEN && process.env.TELEGRAM_ADMIN_CHAT_ID)
}

function token(): string {
  const t = process.env.TELEGRAM_BOT_TOKEN
  if (!t) throw new Error('TELEGRAM_BOT_TOKEN не задан')
  return t
}

export function adminChatId(): string {
  const c = process.env.TELEGRAM_ADMIN_CHAT_ID
  if (!c) throw new Error('TELEGRAM_ADMIN_CHAT_ID не задан')
  return c
}

interface TelegramResponse<T = unknown> {
  ok: boolean
  result?: T
  description?: string
  error_code?: number
}

/**
 * Вызов метода Bot API с повторами.
 *
 * Повторяем только то, что имеет шанс пройти со второй попытки: обрыв сети,
 * таймаут, 5xx и 429. На 4xx не повторяем — это наша ошибка в запросе, и
 * повтор лишь задержит ответ. Без повторов моргнувшая сеть означала бы
 * неувиденную заявку: она молча легла бы в БД, и менеджер о ней не узнал.
 */
export class TelegramApiError extends Error {
  constructor(
    readonly code: number,
    message: string,
  ) {
    super(message)
    this.name = 'TelegramApiError'
  }

  /** 4xx — наш кривой запрос: повтор ничего не изменит. 429 и 5xx стоит повторить. */
  get retryable(): boolean {
    return this.code === 429 || this.code >= 500
  }
}

export async function callTelegram<T = unknown>(
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
        // Telegram может тупить — не держим запрос клиента вечно.
        signal: AbortSignal.timeout(10_000),
      })
      const data = (await res.json()) as TelegramResponse<T>
      if (data.ok) return data.result as T

      throw new TelegramApiError(
        data.error_code ?? 0,
        `Telegram ${method}: ${data.error_code} ${data.description}`,
      )
    } catch (e) {
      // Ошибку в самом запросе не повторяем — только сетевые сбои и 429/5xx.
      if (e instanceof TelegramApiError && !e.retryable) throw e
      lastError = e
    }

    // Растущая пауза: 300мс, затем 900мс. После последней попытки не ждём.
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 300 * 3 ** i))
  }

  throw lastError
}

/**
 * Экранирование для parse_mode: HTML.
 * Имя и комментарий приходят от клиента: без экранирования «<b>» в комментарии
 * сломает разметку сообщения, а то и подсунет менеджеру чужую ссылку.
 */
export function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

const MONTHS_RU = [
  'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
  'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
]

const pad = (n: number) => String(n).padStart(2, '0')

/** «20 августа, 18:00 — 21:00 (3 ч)» — всегда по петербургскому времени. */
export function formatInterval(startAt: Date, endAt: Date): string {
  const s = toSpbParts(startAt)
  const e = toSpbParts(endAt)
  const hours = durationHours({ start: startAt, end: endAt })
  const sameDay = s.day === e.day && s.month === e.month
  const endStr = sameDay
    ? `${pad(e.hour)}:${pad(e.minute)}`
    : `${e.day} ${MONTHS_RU[e.month - 1]} ${pad(e.hour)}:${pad(e.minute)}`
  return `${s.day} ${MONTHS_RU[s.month - 1]}, ${pad(s.hour)}:${pad(s.minute)} — ${endStr} (${hours} ч)`
}

const STATUS_LABEL: Record<BookingStatus, string> = {
  NEW: '🆕 Новая',
  REVIEW: '👀 На рассмотрении',
  CONFIRMED: '✅ Подтверждена',
  COMPLETED: '🏁 Завершена',
  CANCELLED: '❌ Отменена',
}

const SOURCE_LABEL: Record<string, string> = {
  ORGANIC: 'Поиск',
  ADS: 'Реклама',
  SOCIAL: 'Соцсети',
  REPEAT: 'Повторный клиент',
  MANUAL: 'Добавлена вручную',
  UNKNOWN: 'Не определён',
}

export interface BookingMessage {
  id: string
  boatName: string
  startAt: Date
  endAt: Date
  guests: number
  clientName: string
  phone: string
  telegram: string | null
  comment: string | null
  priceSnapshot: number | null
  status: BookingStatus
  source: string
  utmSource: string | null
  utmMedium: string | null
  lang: string
}

/** Только цифры — для ссылки wa.me. */
export function phoneDigits(phone: string): string {
  return phone.replace(/\D/g, '')
}

export function renderBooking(b: BookingMessage): string {
  const price =
    b.priceSnapshot != null ? `${b.priceSnapshot.toLocaleString('ru-RU')} ₽` : 'по запросу'

  const utm = [b.utmSource, b.utmMedium].filter(Boolean).join(' / ')
  const source = SOURCE_LABEL[b.source] ?? b.source

  const lines = [
    `<b>${STATUS_LABEL[b.status]}</b>`,
    '',
    `🛥 <b>${escapeHtml(b.boatName)}</b>`,
    `📅 ${formatInterval(b.startAt, b.endAt)}`,
    `👥 Гостей: ${b.guests}`,
    `💰 ${price}`,
    '',
    `👤 ${escapeHtml(b.clientName)}`,
    // <code> — чтобы номер копировался тапом: ссылку tel: Telegram в кнопке не принимает.
    `📞 <code>${escapeHtml(b.phone)}</code>`,
  ]

  if (b.telegram) lines.push(`✈️ ${escapeHtml(b.telegram)}`)
  if (b.comment) lines.push('', `💬 ${escapeHtml(b.comment)}`)

  lines.push('', `📊 ${source}${utm ? ` (${escapeHtml(utm)})` : ''}`)
  if (b.lang === 'en') lines.push('🌍 Заявка с английской версии')

  return lines.join('\n')
}

/** Данные кнопок — префикс отличает действие, дальше id заявки. */
export const CB = {
  confirm: (id: string) => `confirm:${id}`,
  cancel: (id: string) => `cancel:${id}`,
  retime: (id: string) => `retime:${id}`,
  /** Вернуть в работу — страховка от случайного нажатия. */
  reopen: (id: string) => `reopen:${id}`,
} as const

export function bookingKeyboard(b: BookingMessage) {
  const contact: Record<string, unknown>[] = [
    { text: '💬 WhatsApp', url: `https://wa.me/${phoneDigits(b.phone)}` },
  ]
  if (b.telegram) {
    const uname = b.telegram.replace(/^@/, '')
    contact.push({ text: '✈️ Telegram', url: `https://t.me/${encodeURIComponent(uname)}` })
  }
  // copy_text — единственный способ дать «позвонить» в один тап: номер
  // копируется в буфер, дальше менеджер вставляет его в звонилку.
  contact.push({ text: '📋 Номер', copy_text: { text: b.phone } })

  const done = b.status === 'CONFIRMED' || b.status === 'CANCELLED'
  const rows: Record<string, unknown>[][] = [contact]

  if (!done) {
    rows.push([
      { text: '✅ Подтвердить', callback_data: CB.confirm(b.id) },
      { text: '❌ Отменить', callback_data: CB.cancel(b.id) },
    ])
    rows.push([{ text: '🕐 Изменить время', callback_data: CB.retime(b.id) }])
  } else {
    // Решение принято, но время ещё можно поправить — планы у клиентов меняются.
    rows.push([
      { text: '🕐 Изменить время', callback_data: CB.retime(b.id) },
      { text: '↩️ Вернуть в работу', callback_data: CB.reopen(b.id) },
    ])
  }

  return { inline_keyboard: rows }
}

/**
 * Отправить заявку менеджеру. Возвращает message_id, чтобы потом
 * редактировать это же сообщение при смене статуса.
 */
export async function sendBookingNotification(b: BookingMessage): Promise<number> {
  const res = await callTelegram<{ message_id: number }>('sendMessage', {
    chat_id: adminChatId(),
    text: renderBooking(b),
    parse_mode: 'HTML',
    reply_markup: bookingKeyboard(b),
    link_preview_options: { is_disabled: true },
  })
  return res.message_id
}

/** Перерисовать сообщение после смены статуса или времени. */
export async function updateBookingMessage(messageId: number, b: BookingMessage): Promise<void> {
  await callTelegram('editMessageText', {
    chat_id: adminChatId(),
    message_id: messageId,
    text: renderBooking(b),
    parse_mode: 'HTML',
    reply_markup: bookingKeyboard(b),
    link_preview_options: { is_disabled: true },
  })
}

/**
 * Ответ на нажатие кнопки — гасит «часики» на кнопке.
 *
 * Ошибки намеренно проглатываются: это чистая косметика, и она не должна
 * мешать самому действию. Callback-запрос живёт около минуты — если менеджер
 * нажал кнопку в старом сообщении или моргнула сеть, вызов упадёт с «query is
 * too old». Раньше исключение обрывало обработчик, и нажатие не делало ничего.
 */
export async function answerCallback(id: string, text?: string, alert = false): Promise<void> {
  try {
    await callTelegram(
      'answerCallbackQuery',
      { callback_query_id: id, ...(text ? { text, show_alert: alert } : {}) },
      // Один заход: «часики» всё равно погаснут сами, а повторы задержат действие.
      1,
    )
  } catch (e) {
    console.warn('[answerCallback] не удалось ответить на нажатие:', e)
  }
}
