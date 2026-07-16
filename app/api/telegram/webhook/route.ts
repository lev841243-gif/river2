import { NextResponse } from 'next/server'
import { findBookingIdByTgMessage } from '@/lib/bookings-db'
import { applyReschedule, applyStatusChange } from '@/lib/booking-workflow'
import { MAX_DURATION_HOURS, MIN_DURATION_HOURS, validateInterval } from '@/lib/booking-rules'
import {
  adminChatId,
  answerCallback,
  callTelegram,
  formatInterval,
  mainKeyboard,
  PANEL_HELP,
  PANEL_NEW,
  telegramConfigured,
} from '@/lib/telegram'
import {
  askManualDate,
  beginManualBooking,
  beginRetime,
  cancelDraft,
  finishDraft,
  parseDayOnly,
  parseStart,
  pickBoat,
  pickDate,
  pickDuration,
  pickGuests,
  pickHour,
  pickMinute,
  pickName,
  pickPhone,
  pickWhen,
} from '@/lib/bot-flow'
import { dropStaleDrafts, getDraft } from '@/lib/bot-draft'
import { fromSpbParts, toSpbParts } from '@/lib/spb-time'

export const dynamic = 'force-dynamic'

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

  const [action, arg] = (cb.data ?? '').split(':')
  if (!arg) return answerCallback(cb.id)

  const who = cb.from?.username ? `@${cb.from.username}` : (cb.from?.first_name ?? 'менеджер')

  // ── Диалог «Создать бронь» (префикс mb_) ──
  if (action.startsWith('mb_')) {
    await answerCallback(cb.id)
    const chat = String(chatId)
    if (action === 'mb_start') await beginManualBooking(chat, String(cb.from?.id ?? ''))
    else if (action === 'mb_boat') await pickBoat(chat, arg)
    else if (action === 'mb_date') await pickDate(chat, arg)
    else if (action === 'mb_hour') await pickHour(chat, Number(arg))
    else if (action === 'mb_min') await pickMinute(chat, Number(arg))
    else if (action === 'mb_manual') await askManualDate(chat)
    else if (action === 'mb_dur') await pickDuration(chat, Number(arg))
    else if (action === 'mb_guests') await pickGuests(chat, Number(arg))
    else if (action === 'mb_skip') await finishDraft(chat, undefined, who)
    else if (action === 'mb_cancel') await cancelDraft(chat)
    return
  }

  const bookingId = arg

  const STATUS_BY_ACTION = {
    confirm: 'CONFIRMED',
    cancel: 'CANCELLED',
    // Возврат в работу. Слот при этом НЕ занимается: держит только CONFIRMED.
    reopen: 'REVIEW',
  } as const

  if (action in STATUS_BY_ACTION) {
    const to = STATUS_BY_ACTION[action as keyof typeof STATUS_BY_ACTION]
    // Карточку и Google Sheets подтягивает applyStatusChange — та же цепочка,
    // что и в админке.
    const res = await applyStatusChange(bookingId, to, who, cb.message?.message_id)

    if (!res.ok) {
      const why = {
        same: 'Статус уже такой',
        not_found: 'Заявка не найдена',
        busy: 'Не вышло: слот уже занят другой бронью',
      }[res.reason]
      await answerCallback(cb.id, why, res.reason === 'busy')
      return
    }

    const said = { confirm: 'Подтверждено', cancel: 'Отменено', reopen: 'Возвращено в работу' }
    await answerCallback(cb.id, said[action as keyof typeof said])
    return
  }

  if (action === 'retime') {
    // Раньше здесь была подсказка «ответьте сообщением в формате ДД.ММ ЧЧ:ММ-ЧЧ:ММ».
    // Теперь перенос идёт кнопками, как и новая бронь: набор руками — самое
    // хрупкое место диалога, на нём уже застревали. Ответ текстом на карточку
    // продолжает работать как быстрый путь.
    await answerCallback(cb.id)
    await beginRetime(String(chatId), String(cb.from?.id ?? ''), bookingId)
    return
  }

  await answerCallback(cb.id)
}

// ─────────────────────────── Сообщения ───────────────────────────

async function handleMessage(msg: TgMessage) {
  if (String(msg.chat?.id) !== adminChatId()) return

  const chat = String(msg.chat!.id)
  const text = (msg.text ?? '').trim()
  const who = msg.from?.username ? `@${msg.from.username}` : (msg.from?.first_name ?? 'менеджер')

  // Команды: в группе режим приватности пропускает их всегда.
  // Telegram дописывает @имя_бота, если в группе несколько ботов.
  const command = text.split(/[\s@]/)[0].toLowerCase()

  // Кнопки панели шлют обычный текст со своей подписью — узнаём их по ней.
  // Доходит это только при выключенном режиме приватности; тогда же панель и
  // рисуется с такими подписями (см. mainKeyboard).
  if (text === PANEL_NEW) {
    await dropStaleDrafts()
    return beginManualBooking(chat, String(msg.from?.id ?? ''))
  }

  if (command === '/start' || command === '/help' || text === PANEL_HELP) {
    await dropStaleDrafts()
    // Панель показываем здесь: reply_markup с клавиатурой живёт до замены, и
    // одного сообщения хватает, чтобы она осталась под полем ввода навсегда.
    return callTelegram('sendMessage', {
      chat_id: adminChatId(),
      text:
        'Сюда приходят заявки с сайта.\n\n' +
        '<b>/bron</b> — завести бронь вручную (клиент позвонил или написал лично).\n' +
        'Дальше всё кнопками: катер → день → время → длительность → гости.\n' +
        'Набрать руками придётся только имя и телефон.\n\n' +
        'Кнопки на карточке заявки: подтвердить, отменить, вернуть в работу.\n' +
        'Чтобы перенести бронь — ответьте на её карточку новым временем, ' +
        'например <code>20.08 18:00-21:00</code>.\n\n' +
        '<i>Панель с кнопками закреплена под полем ввода.</i>',
      parse_mode: 'HTML',
      reply_markup: await mainKeyboard(),
    })
  }

  if (command === '/bron' || command === '/new') {
    await dropStaleDrafts()
    return beginManualBooking(chat, String(msg.from?.id ?? ''))
  }

  // Шаг незаконченного диалога создания брони.
  //
  // Принимаем только ОТВЕТ на сообщение бота. При включённой приватности иначе
  // и не бывает — обычный текст до бота не доходит. А если приватность выключат
  // ради красивых подписей на панели, бот начнёт видеть всю переписку, и без
  // этой проверки любая реплика менеджера на шаге «имя клиента» стала бы именем.
  const isReplyToBot = Boolean(msg.reply_to_message?.from?.is_bot)
  if (isReplyToBot && (await handleDraftStep(chat, text, who))) return

  // Ждём ответ на карточку заявки. Режим приватности бота как раз это и
  // пропускает: ответы на собственные сообщения бот видит, обычную болтовню — нет.
  const replyTo = msg.reply_to_message
  if (!replyTo) return

  const id = await findBookingIdByTgMessage(replyTo.message_id)
  if (!id) return

  const parsed = parseNewTime(msg.text ?? '')
  // Ответ не про время — молчим: в группе могут просто обсуждать заявку,
  // и бот не должен встревать с «не понял».
  if (!parsed) return

  const rejection = validateInterval(parsed)
  if (rejection) {
    await reply(msg, `❌ ${REJECTION_TEXT[rejection]}`)
    return
  }

  const result = await applyReschedule(id, parsed.start, parsed.end)
  if (result === 'not_found') return reply(msg, '❌ Заявка не найдена')
  if (result === 'busy') return reply(msg, '❌ Катер уже занят в это время')

  await reply(msg, `✅ Перенесено: ${formatInterval(parsed.start, parsed.end)}`)
}

const REJECTION_TEXT: Record<string, string> = {
  PAST: 'Это время уже прошло',
  TOO_SHORT: `Минимальная аренда — ${MIN_DURATION_HOURS} ч`,
  TOO_LONG: `Максимум за одну заявку — ${MAX_DURATION_HOURS / 24} суток`,
  TOO_FAR: 'Бронирование открыто на 180 дней вперёд',
  BOAT_BUSY: 'Катер занят',
}

/**
 * Шаг незаконченного диалога «Создать бронь».
 * Возвращает true, если сообщение съедено диалогом.
 */
async function handleDraftStep(chat: string, text: string, who: string): Promise<boolean> {
  const draft = await getDraft(chat)
  if (!draft) return false

  // Кнопочные шаги ждут нажатия, а не текста — не перехватываем болтовню.
  if (draft.step === 'boat' || draft.step === 'date' || draft.step === 'hour' || draft.step === 'minute') {
    return false
  }

  if (draft.step === 'when') {
    // Дата со временем — ведём сразу к длительности.
    const start = parseStart(text)
    if (start) {
      await pickWhen(chat, start)
      return true
    }
    // Одна дата без времени — время дальше спросим кнопками.
    const dayKey = parseDayOnly(text)
    if (dayKey) {
      await pickDate(chat, dayKey)
      return true
    }
    return false // не похоже на дату — вдруг просто разговор
  }

  if (draft.step === 'duration') {
    // На этом шаге есть и кнопки, поэтому текст принимаем только как число часов.
    const h = Number(text.replace(/\s*ч(ас(ов|а)?)?$/i, '').trim())
    if (!Number.isFinite(h) || h <= 0) return false
    await pickDuration(chat, h)
    return true
  }

  if (draft.step === 'name') {
    if (text.length < 2) return false
    await pickName(chat, text)
    return true
  }

  if (draft.step === 'phone') {
    if ((text.match(/\d/g)?.length ?? 0) < 10) {
      await callTelegram('sendMessage', {
        chat_id: adminChatId(),
        text: '❌ Не похоже на телефон. Пришлите номер, например +7 999 123-45-67',
      })
      return true
    }
    await pickPhone(chat, text)
    return true
  }

  if (draft.step === 'guests') {
    const g = Number(text)
    if (!Number.isInteger(g) || g < 1) return false
    await pickGuests(chat, g)
    return true
  }

  if (draft.step === 'comment') {
    await finishDraft(chat, text, who)
    return true
  }

  return false
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

async function reply(msg: TgMessage, text: string) {
  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    reply_to_message_id: msg.message_id,
    text,
    parse_mode: 'HTML',
  })
}

// ─────────────────────────── Типы Telegram ───────────────────────────
// Берём только те поля, которые реально используем.

interface TgChat {
  id: number
}
interface TgUser {
  id?: number
  /** Отличает ответ на сообщение бота от ответа коллеге. */
  is_bot?: boolean
  username?: string
  first_name?: string
}
interface TgMessage {
  message_id: number
  chat?: TgChat
  from?: TgUser
  text?: string
  /** Telegram НЕ вкладывает сюда собственный reply_to_message — только один уровень. */
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
