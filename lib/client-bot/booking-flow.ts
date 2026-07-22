/**
 * Мастер брони клиентского бота: клиент заводит заявку сам, по шагам.
 *
 * Заявка ложится как обычный лид с сайта — status NEW, source SOCIAL (через
 * utmSource: 'telegram', см. detectSource) — и подтверждает её менеджер теми же
 * кнопками в группе. Клиент ничего не подтверждает и не платит: «как на сайте».
 *
 * Доменное ядро переиспользуем целиком (validateInterval, createBooking,
 * sendBookingNotification) — здесь только диалог и сбор полей.
 *
 * Шаги кнопочные намеренно: набор даты/времени руками — самое хрупкое место,
 * на нём застревали ещё в менеджерском боте.
 */

import { prisma } from '@/lib/prisma'
import { MAX_DURATION_HOURS, MAX_GUESTS, MIN_DURATION_HOURS, validateInterval } from '@/lib/booking-rules'
import { durationLabel } from '@/lib/booking-slots'
import { BoatBusyError, createBooking, getBookingForMessage, setTgMessageId } from '@/lib/bookings-db'
import { rateLimit } from '@/lib/rate-limit'
import { formatInterval, renderBooking, sendBookingNotification, telegramConfigured } from '@/lib/telegram'
import { fromSpbParts, parseDayKey, spbDayKey, spbDayStart, spbTodayKey, toSpbParts } from '@/lib/spb-time'
import { callClientTelegram, escapeHtml } from './telegram'
import {
  dropClientDraft,
  getClientDraft,
  startClientDraft,
  updateClientDraft,
  type ClientDraftData,
} from './draft'

const pad = (n: number) => String(n).padStart(2, '0')

async function say(chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
  await callClientTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...extra,
  })
}

const CANCEL_ROW = [{ text: '✖️ Отмена', callback_data: 'cb_cancel:x' }]

// ─────────────────────────── Старт ───────────────────────────

export async function beginBooking(chatId: number, boatSlug: string, tgUsername?: string) {
  const boat = await prisma.boat.findUnique({
    where: { slug: boatSlug },
    select: { nameRu: true, isVisible: true },
  })
  if (!boat || !boat.isVisible) {
    return say(chatId, 'Этот катер сейчас недоступен. Вернуться к списку: /start')
  }
  await startClientDraft(String(chatId), { boatSlug, boatName: boat.nameRu, tgUsername })
  await askDay(chatId, boat.nameRu)
}

// ─────────────────────────── День ───────────────────────────

const DAY_BUTTONS = 14
const WEEKDAY_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

function dayLabel(key: string, todayKey: string, tomorrowKey: string): string {
  if (key === todayKey) return 'Сегодня'
  if (key === tomorrowKey) return 'Завтра'
  const { year, month, day } = parseDayKey(key)
  const wd = WEEKDAY_RU[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${pad(day)}.${pad(month)} ${wd}`
}

async function askDay(chatId: number, boatName: string) {
  const todayKey = spbTodayKey()
  const base = spbDayStart(todayKey).getTime()
  const keys = Array.from({ length: DAY_BUTTONS }, (_, i) => spbDayKey(new Date(base + i * 86_400_000)))
  const tomorrowKey = keys[1]

  const rows: unknown[][] = []
  for (let i = 0; i < keys.length; i += 3) {
    rows.push(
      keys.slice(i, i + 3).map((k) => ({ text: dayLabel(k, todayKey, tomorrowKey), callback_data: `cb_day:${k}` })),
    )
  }
  rows.push(CANCEL_ROW)

  await say(chatId, `🛥 <b>${escapeHtml(boatName)}</b>\n\nНа какой день хотите прогулку?`, {
    reply_markup: { inline_keyboard: rows },
  })
}

export async function pickDay(chatId: number, dayKey: string) {
  await updateClientDraft(String(chatId), 'hour', { dayKey })
  await askHour(chatId, dayKey)
}

// ─────────────────────────── Час ───────────────────────────

async function askHour(chatId: number, dayKey: string) {
  const rows: unknown[][] = []
  for (let h = 0; h < 24; h += 4) {
    rows.push([0, 1, 2, 3].map((i) => ({ text: `${pad(h + i)}:__`, callback_data: `cb_hour:${h + i}` })))
  }
  rows.push(CANCEL_ROW)

  const { year, month, day } = parseDayKey(dayKey)
  await say(chatId, `📅 <b>${pad(day)}.${pad(month)}.${year}</b>\n\nВо сколько начало?`, {
    reply_markup: { inline_keyboard: rows },
  })
}

export async function pickHour(chatId: number, hour: number) {
  await updateClientDraft(String(chatId), 'minute', { hour })
  const rows = [
    [0, 15, 30, 45].map((m) => ({ text: `${pad(hour)}:${pad(m)}`, callback_data: `cb_min:${m}` })),
    CANCEL_ROW,
  ]
  await say(chatId, 'Минуты?', { reply_markup: { inline_keyboard: rows } })
}

export async function pickMinute(chatId: number, minute: number) {
  const draft = await getClientDraft(String(chatId))
  if (!draft?.data.dayKey || draft.data.hour == null) {
    return say(chatId, 'Что-то пошло не так. Начните заново: /start')
  }
  const { year, month, day } = parseDayKey(draft.data.dayKey)
  const start = fromSpbParts({ year, month, day, hour: draft.data.hour, minute })
  await updateClientDraft(String(chatId), 'duration', { startAt: start.toISOString() })
  await askDuration(chatId, start)
}

// ─────────────────────────── Длительность ───────────────────────────

async function askDuration(chatId: number, start: Date, prefix = '') {
  const quick = [2, 3, 4, 6, 8, 12, 24, 48, 72]
  const rows: unknown[][] = []
  for (let i = 0; i < quick.length; i += 3) {
    rows.push(quick.slice(i, i + 3).map((h) => ({ text: durationLabel(h), callback_data: `cb_dur:${h}` })))
  }
  rows.push(CANCEL_ROW)

  const s = toSpbParts(start)
  await say(
    chatId,
    `${prefix}📅 Начало: <b>${pad(s.day)}.${pad(s.month)}.${s.year}, ${pad(s.hour)}:${pad(s.minute)}</b>\n\n` +
      `На сколько? <i>Или ответьте числом часов, например <code>5</code> (от ${MIN_DURATION_HOURS} ч до ${MAX_DURATION_HOURS / 24} суток).</i>`,
    { reply_markup: { inline_keyboard: rows } },
  )
}

export async function pickDuration(chatId: number, hours: number) {
  const draft = await getClientDraft(String(chatId))
  if (!draft?.data.startAt) return say(chatId, 'Что-то пошло не так. Начните заново: /start')

  const start = new Date(draft.data.startAt)
  const end = new Date(start.getTime() + hours * 3_600_000)

  const rejection = validateInterval({ start, end })
  if (rejection) {
    const why: Record<string, string> = {
      PAST: 'это время уже прошло',
      TOO_SHORT: `минимум ${MIN_DURATION_HOURS} ч`,
      TOO_LONG: `максимум ${MAX_DURATION_HOURS / 24} суток`,
      TOO_FAR: 'слишком далеко вперёд',
      BOAT_BUSY: 'катер занят',
    }
    return askDuration(chatId, start, `❌ Не выйдет: ${why[rejection]}. Выберите другую длительность.\n\n`)
  }

  await updateClientDraft(String(chatId), 'guests', { hours })
  await askGuests(chatId, start, end)
}

// ─────────────────────────── Гости ───────────────────────────

async function askGuests(chatId: number, start: Date, end: Date) {
  const opts = [1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20].filter((g) => g <= MAX_GUESTS)
  const rows: unknown[][] = []
  for (let i = 0; i < opts.length; i += 4) {
    rows.push(opts.slice(i, i + 4).map((g) => ({ text: String(g), callback_data: `cb_guests:${g}` })))
  }
  rows.push(CANCEL_ROW)

  await say(chatId, `🕐 ${formatInterval(start, end)}\n\nСколько гостей?`, {
    reply_markup: { inline_keyboard: rows },
  })
}

export async function pickGuests(chatId: number, guests: number) {
  await updateClientDraft(String(chatId), 'name', { guests })
  await say(chatId, 'Как вас зовут?', { reply_markup: { force_reply: true } })
}

// ─────────────────────────── Имя ───────────────────────────

async function pickName(chatId: number, name: string) {
  if (name.length < 2) {
    await say(chatId, '❌ Слишком коротко. Как вас зовут?', { reply_markup: { force_reply: true } })
    return
  }
  await updateClientDraft(String(chatId), 'phone', { clientName: name })
  await say(chatId, `👤 ${escapeHtml(name)}\n\nОставьте телефон — менеджер перезвонит и подтвердит.`, {
    reply_markup: {
      keyboard: [[{ text: '📱 Поделиться номером', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    },
  })
}

// ─────────────────────────── Телефон ───────────────────────────

async function pickPhone(chatId: number, phone: string) {
  if ((phone.match(/\d/g)?.length ?? 0) < 10) {
    await say(chatId, '❌ Не похоже на телефон. Пришлите номер, например +7 999 123-45-67, или нажмите «Поделиться номером».', {
      reply_markup: {
        keyboard: [[{ text: '📱 Поделиться номером', request_contact: true }]],
        resize_keyboard: true,
        one_time_keyboard: true,
      },
    })
    return
  }
  await updateClientDraft(String(chatId), 'comment', { phone })
  // Убираем клавиатуру «Поделиться номером» и просим необязательный комментарий.
  await say(chatId, `📞 ${escapeHtml(phone)}`, { reply_markup: { remove_keyboard: true } })
  await say(chatId, 'Комментарий — повод, пожелания? Или пропустите.', {
    reply_markup: { inline_keyboard: [[{ text: '➡️ Пропустить', callback_data: 'cb_skip:x' }]], force_reply: true },
  })
}

// ─────────────────────────── Финал ───────────────────────────

export async function finishBooking(chatId: number, comment: string | undefined) {
  const draft = await getClientDraft(String(chatId))
  if (!draft) return say(chatId, 'Заявка не найдена. Начните заново: /start')

  const d: ClientDraftData = { ...draft.data, comment }
  if (!d.boatSlug || !d.startAt || !d.hours || !d.clientName || !d.phone) {
    await dropClientDraft(String(chatId))
    return say(chatId, 'Заявка неполная. Начните заново: /start')
  }

  // Антиспам: сколько заявок один клиент может оформить за окно. Публичный бот —
  // без этого один человек мог бы засыпать менеджера бронями. chatId в личке
  // равен user.id, поэтому это лимит именно на пользователя.
  const gate = rateLimit(`client-bot:booking:${chatId}`, 3, 15 * 60_000)
  if (!gate.ok) {
    await dropClientDraft(String(chatId))
    return say(
      chatId,
      'Вы уже оставили несколько заявок — менеджер скоро свяжется. ' +
        'Если нужно срочно, напишите ему напрямую.',
    )
  }

  const start = new Date(d.startAt)
  const end = new Date(start.getTime() + d.hours * 3_600_000)

  try {
    const booking = await createBooking({
      boatSlug: d.boatSlug,
      startAt: start,
      endAt: end,
      guests: d.guests ?? 1,
      clientName: d.clientName,
      phone: d.phone,
      telegram: d.tgUsername ? `@${d.tgUsername}` : undefined,
      comment: comment || undefined,
      lang: 'ru',
      // Помечает заявку как SOCIAL (detectSource ловит /telegram/). Статус —
      // NEW: лид, который подтверждает менеджер, ровно как с сайта.
      utmSource: 'telegram',
      utmMedium: 'social',
    })
    await dropClientDraft(String(chatId))

    await say(
      chatId,
      '✅ <b>Заявка принята!</b>\n\n' +
        `🛥 ${escapeHtml(d.boatName ?? '')}\n` +
        `🕐 ${formatInterval(start, end)}\n` +
        `👥 ${d.guests ?? 1} гост.\n\n` +
        'Менеджер свяжется с вами, чтобы подтвердить. Спасибо!',
    )

    await notifyManager(booking.id)
  } catch (e) {
    if (e instanceof BoatBusyError) {
      // Катер известен — возвращаем к выбору дня, остальное в черновике есть.
      await updateClientDraft(String(chatId), 'day', {})
      await say(chatId, '❌ К сожалению, этот катер уже занят в это время. Выберите другой день.')
      return askDay(chatId, d.boatName ?? 'Катер')
    }
    await dropClientDraft(String(chatId))
    console.error('[client-bot] не удалось создать заявку:', e)
    return say(chatId, 'Не удалось оформить заявку. Попробуйте ещё раз: /start')
  }
}

/**
 * Уведомить менеджера — той же карточкой в ту же группу, что и заявки с сайта.
 * Шлёт менеджерский бот (lib/telegram). Ошибку только логируем: заявка уже в
 * БД, ронять подтверждение клиенту нельзя.
 */
async function notifyManager(bookingId: string) {
  // Локальная страховка: если задан отладочный чат, карточку шлём туда (личкой
  // клиентского бота), а НЕ в реальную группу менеджера — чтобы тест не
  // тревожил живых людей. В проде переменная не задаётся.
  const devChat = process.env.CLIENT_BOT_DEV_MANAGER_CHAT

  if (!telegramConfigured() && !devChat) return
  try {
    const b = await getBookingForMessage(bookingId)
    if (!b) return

    if (devChat) {
      await callClientTelegram('sendMessage', {
        chat_id: devChat,
        text: '🔔 <b>[ТЕСТ]</b> Так эту заявку увидит менеджер в рабочей группе:\n\n' + renderBooking(b),
        parse_mode: 'HTML',
        link_preview_options: { is_disabled: true },
      })
      return
    }

    const messageId = await sendBookingNotification(b)
    await setTgMessageId(bookingId, messageId)
  } catch (e) {
    console.error('[client-bot] уведомление менеджеру не ушло:', e)
  }
}

export async function cancelBooking(chatId: number) {
  await dropClientDraft(String(chatId))
  await say(chatId, 'Отменено. Начать заново: /start', { reply_markup: { remove_keyboard: true } })
}

// ─────────────────── Роутер текста и контакта ───────────────────

/** Текст на шаге диалога. true — сообщение съедено мастером. */
export async function handleBookingText(chatId: number, text: string): Promise<boolean> {
  const draft = await getClientDraft(String(chatId))
  if (!draft) return false

  // Кнопочные шаги ждут нажатия, не текста.
  if (['day', 'hour', 'minute', 'guests'].includes(draft.step)) return false

  if (draft.step === 'duration') {
    const h = Number(text.replace(/\s*ч(ас(ов|а)?)?$/i, '').trim())
    if (!Number.isFinite(h) || h <= 0) return false
    await pickDuration(chatId, h)
    return true
  }
  if (draft.step === 'name') {
    await pickName(chatId, text)
    return true
  }
  if (draft.step === 'phone') {
    await pickPhone(chatId, text)
    return true
  }
  if (draft.step === 'comment') {
    await finishBooking(chatId, text)
    return true
  }
  return false
}

/** Контакт (кнопка «Поделиться номером») на шаге телефона. */
export async function handleBookingContact(chatId: number, phone: string): Promise<boolean> {
  const draft = await getClientDraft(String(chatId))
  if (draft?.step !== 'phone') return false
  await pickPhone(chatId, phone)
  return true
}
