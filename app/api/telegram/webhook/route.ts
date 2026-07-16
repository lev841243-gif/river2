import { NextResponse } from 'next/server'
import {
  changeBookingStatus,
  getBookingForMessage,
  rescheduleBooking,
} from '@/lib/bookings-db'
import { validateInterval } from '@/lib/booking-rules'
import {
  adminChatId,
  answerCallback,
  callTelegram,
  formatInterval,
  telegramConfigured,
  updateBookingMessage,
} from '@/lib/telegram'
import { fromSpbParts, toSpbParts } from '@/lib/spb-time'

export const dynamic = 'force-dynamic'

/** Подсказка, которую бот присылает в ответ на «Изменить время». */
const RETIME_PROMPT = 'Отправьте новое время ответом на это сообщение.'

/**
 * Приём событий от Telegram.
 *
 * Адрес публичный, поэтому две проверки:
 * 1. секретный заголовок — его знает только Telegram (задаётся при setWebhook);
 * 2. chat_id — команды принимаются лишь из нашей группы.
 * Без них подтвердить чужую бронь мог бы любой, кто угадает адрес.
 */
export async function POST(req: Request) {
  if (!telegramConfigured()) {
    return NextResponse.json({ ok: true })
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET
  if (secret && req.headers.get('x-telegram-bot-api-secret-token') !== secret) {
    console.warn('[telegram webhook] неверный секрет')
    // 200, чтобы Telegram не долбился повторами; для чужого это тупик.
    return NextResponse.json({ ok: true })
  }

  let update: TgUpdate
  try {
    update = (await req.json()) as TgUpdate
  } catch {
    return NextResponse.json({ ok: true })
  }

  try {
    if (update.callback_query) await handleCallback(update.callback_query)
    else if (update.message) await handleMessage(update.message)
  } catch (e) {
    // Ошибку не показываем Telegram: он начнёт слать повторы и задублирует действие.
    console.error('[telegram webhook]', e)
  }

  return NextResponse.json({ ok: true })
}

// ─────────────────────────── Кнопки ───────────────────────────

async function handleCallback(cb: TgCallbackQuery) {
  const chatId = cb.message?.chat?.id
  if (String(chatId) !== adminChatId()) {
    await answerCallback(cb.id, 'Нет доступа', true)
    return
  }

  const [action, bookingId] = (cb.data ?? '').split(':')
  if (!bookingId) return answerCallback(cb.id)

  const who = cb.from?.username ? `@${cb.from.username}` : (cb.from?.first_name ?? 'менеджер')

  if (action === 'confirm' || action === 'cancel') {
    const to = action === 'confirm' ? 'CONFIRMED' : 'CANCELLED'
    const changed = await changeBookingStatus(bookingId, to, who)
    if (!changed) {
      await answerCallback(cb.id, 'Статус уже такой', false)
      return
    }
    await answerCallback(cb.id, action === 'confirm' ? 'Подтверждено' : 'Отменено')
    await refreshMessage(bookingId, cb.message!.message_id)
    return
  }

  if (action === 'retime') {
    const b = await getBookingForMessage(bookingId)
    if (!b) return answerCallback(cb.id, 'Заявка не найдена', true)

    const s = toSpbParts(b.startAt)
    const example = `${pad(s.day)}.${pad(s.month)} ${pad(s.hour)}:${pad(s.minute)}-${pad(toSpbParts(b.endAt).hour)}:${pad(toSpbParts(b.endAt).minute)}`

    await answerCallback(cb.id)
    // force_reply — у менеджера сразу откроется поле ответа; ответ мы
    // опознаём по этой подсказке и вытаскиваем из неё id заявки.
    await callTelegram('sendMessage', {
      chat_id: adminChatId(),
      reply_to_message_id: cb.message!.message_id,
      text: `${RETIME_PROMPT}\n\nФормат: <code>ДД.ММ ЧЧ:ММ-ЧЧ:ММ</code>\nСейчас: <code>${example}</code>\n\n#${bookingId}`,
      parse_mode: 'HTML',
      reply_markup: { force_reply: true, selective: true },
    })
    return
  }

  await answerCallback(cb.id)
}

// ─────────────────────────── Ответ с новым временем ───────────────────────────

async function handleMessage(msg: TgMessage) {
  if (String(msg.chat?.id) !== adminChatId()) return

  const replyTo = msg.reply_to_message
  if (!replyTo?.text?.startsWith(RETIME_PROMPT)) return

  // id заявки спрятан в подсказке — так не нужно помнить состояние диалога.
  const id = replyTo.text.match(/#([0-9a-f-]{36})/i)?.[1]
  if (!id) return

  const parsed = parseNewTime(msg.text ?? '')
  if (!parsed) {
    await reply(msg, '❌ Не понял время. Формат: <code>20.08 18:00-21:00</code>')
    return
  }

  const rejection = validateInterval(parsed)
  if (rejection) {
    await reply(msg, `❌ ${REJECTION_TEXT[rejection]}`)
    return
  }

  const result = await rescheduleBooking(id, parsed.start, parsed.end)
  if (result === 'not_found') return reply(msg, '❌ Заявка не найдена')
  if (result === 'busy') return reply(msg, '❌ Катер уже занят в это время')

  await reply(msg, `✅ Перенесено: ${formatInterval(parsed.start, parsed.end)}`)
  if (replyTo.reply_to_message?.message_id) {
    await refreshMessage(id, replyTo.reply_to_message.message_id)
  }
}

const REJECTION_TEXT: Record<string, string> = {
  PAST: 'Это время уже прошло',
  TOO_SHORT: 'Минимальная аренда — 2 часа',
  TOO_LONG: 'Максимум за одну заявку — 12 часов',
  OUTSIDE_HOURS: 'Прогулки возможны с 10:00 до 02:00',
  TOO_FAR: 'Бронирование открыто на 180 дней вперёд',
  BOAT_BUSY: 'Катер занят',
}

/**
 * Разбор «20.08 18:00-21:00» или «20.08.2026 18:00-21:00».
 * Год необязателен — подставляем ближайший будущий, чтобы менеджер не набирал лишнего.
 * Время трактуется как петербургское: заявка живёт по времени прогулки.
 */
export function parseNewTime(text: string, now = new Date()): { start: Date; end: Date } | null {
  const m = text
    .trim()
    .match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\s+(\d{1,2}):(\d{2})\s*[-–—]\s*(\d{1,2}):(\d{2})$/)
  if (!m) return null

  const [, dd, mm, yy, h1, min1, h2, min2] = m
  const day = +dd
  const month = +mm
  if (month < 1 || month > 12 || day < 1 || day > 31) return null

  let year = yy ? (yy.length === 2 ? 2000 + +yy : +yy) : toSpbParts(now).year

  let start = fromSpbParts({ year, month, day, hour: +h1, minute: +min1 })
  // Без года «20.08» в декабре означал бы прошлое — берём следующий год.
  if (!yy && start < now) {
    year += 1
    start = fromSpbParts({ year, month, day, hour: +h1, minute: +min1 })
  }

  // Конец раньше начала = прогулка за полночь: 22:00-01:00.
  const endHour = +h2 + (+h2 * 60 + +min2 <= +h1 * 60 + +min1 ? 24 : 0)
  const end = fromSpbParts({ year, month, day, hour: endHour, minute: +min2 })

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null
  return { start, end }
}

// ─────────────────────────── Вспомогательное ───────────────────────────

const pad = (n: number) => String(n).padStart(2, '0')

async function reply(msg: TgMessage, text: string) {
  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    reply_to_message_id: msg.message_id,
    text,
    parse_mode: 'HTML',
  })
}

/** Перерисовать карточку заявки после изменений. */
async function refreshMessage(bookingId: string, messageId: number) {
  const fresh = await getBookingForMessage(bookingId)
  if (fresh) await updateBookingMessage(messageId, fresh)
}

// ─────────────────────────── Типы Telegram ───────────────────────────
// Берём только те поля, которые реально используем.

interface TgChat {
  id: number
}
interface TgUser {
  username?: string
  first_name?: string
}
interface TgMessage {
  message_id: number
  chat?: TgChat
  text?: string
  reply_to_message?: TgMessage
}
interface TgCallbackQuery {
  id: string
  data?: string
  from?: TgUser
  message?: TgMessage
}
interface TgUpdate {
  message?: TgMessage
  callback_query?: TgCallbackQuery
}
