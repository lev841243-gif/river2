/**
 * Диалог «Создать бронь» — менеджер заводит заявку прямо в боте.
 *
 * Зачем: часть клиентов звонит или пишет менеджеру лично, минуя сайт. Раньше
 * такие брони нигде не учитывались, и календарь занятости врал.
 *
 * Такая бронь помечается source = MANUAL и сразу CONFIRMED: менеджер уже
 * поговорил с клиентом, подтверждать нечего — и слот сразу занят.
 */

import { MAX_DURATION_HOURS, MIN_DURATION_HOURS, validateInterval } from '@/lib/booking-rules'
import { durationLabel } from '@/lib/booking-slots'
import { applyReschedule } from '@/lib/booking-workflow'
import { BoatBusyError, createBooking } from '@/lib/bookings-db'
import { dropDraft, getDraft, startDraft, updateDraft, type DraftData } from '@/lib/bot-draft'
import { prisma } from '@/lib/prisma'
import { fromSpbParts, parseDayKey, spbDayKey, spbDayStart, spbTodayKey, toSpbParts } from '@/lib/spb-time'
import { adminChatId, callTelegram, escapeHtml, formatInterval } from '@/lib/telegram'

const pad = (n: number) => String(n).padStart(2, '0')

async function say(text: string, extra: Record<string, unknown> = {}) {
  await callTelegram('sendMessage', {
    chat_id: adminChatId(),
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...extra,
  })
}

// ─────────────────────────── Шаг 1: катер ───────────────────────────

export async function beginManualBooking(chatId: string, userId: string) {
  await startDraft(chatId, userId)

  const boats = await prisma.boat.findMany({
    where: { isVisible: true },
    select: { slug: true, nameRu: true },
    orderBy: { sortOrder: 'asc' },
  })

  // По две кнопки в ряд: названия короткие, а список из 15 лодок в один
  // столбец занял бы пол-экрана.
  const rows: unknown[][] = []
  for (let i = 0; i < boats.length; i += 2) {
    rows.push(
      boats.slice(i, i + 2).map((b) => ({
        text: b.nameRu,
        callback_data: `mb_boat:${b.slug}`,
      })),
    )
  }
  rows.push([{ text: '✖️ Отмена', callback_data: 'mb_cancel:x' }])

  await say('<b>Новая бронь</b>\n\nШаг 1 из 6 — какой катер?', {
    reply_markup: { inline_keyboard: rows },
  })
}

// ─────────────────────────── Шаг 2: дата ───────────────────────────

/** Сколько дней показать кнопками. Две недели закрывают почти все брони. */
const DAY_BUTTONS = 14

const WEEKDAY_RU = ['вс', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб']

/** Подпись дня: «Сегодня», «Завтра» или «19.07 сб». */
function dayLabel(key: string, todayKey: string, tomorrowKey: string): string {
  if (key === todayKey) return 'Сегодня'
  if (key === tomorrowKey) return 'Завтра'
  const { year, month, day } = parseDayKey(key)
  // Date.UTC + getUTCDay даёт день недели самой календарной даты, без оглядки
  // на пояс машины.
  const wd = WEEKDAY_RU[new Date(Date.UTC(year, month - 1, day)).getUTCDay()]
  return `${pad(day)}.${pad(month)} ${wd}`
}

export async function pickBoat(chatId: string, slug: string) {
  const boat = await prisma.boat.findUnique({ where: { slug }, select: { nameRu: true } })
  if (!boat) return say('❌ Катер не найден. Начните заново: /bron')

  await updateDraft(chatId, 'date', { mode: 'new', boatSlug: slug, boatName: boat.nameRu })
  await askDate(chatId, boat.nameRu, 'new')
}

/**
 * Начать перенос времени существующей брони.
 *
 * Раньше кнопка «Изменить время» просто показывала подсказку «ответьте
 * сообщением в формате ДД.ММ ЧЧ:ММ-ЧЧ:ММ». Набор руками — самое хрупкое место
 * диалога, на нём уже застревали; поэтому перенос идёт теми же кнопками, что и
 * новая бронь. Ответ на карточку текстом по-прежнему работает — как быстрый путь.
 */
export async function beginRetime(chatId: string, userId: string, bookingId: string) {
  const b = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { boat: { select: { nameRu: true } } },
  })
  if (!b) return say('❌ Заявка не найдена.')

  await startDraft(chatId, userId)
  await updateDraft(chatId, 'date', { mode: 'retime', bookingId, boatName: b.boat.nameRu })
  await askDate(chatId, b.boat.nameRu, 'retime')
}

/** Подпись шага: у переноса своя нумерация — шагов про клиента у него нет. */
function stepLabel(mode: DraftData['mode'], newLabel: string, retimeLabel: string): string {
  return mode === 'retime' ? retimeLabel : newLabel
}

async function askDate(chatId: string, boatName: string, mode: DraftData['mode']) {
  const todayKey = spbTodayKey()
  const base = spbDayStart(todayKey).getTime()
  const keys = Array.from({ length: DAY_BUTTONS }, (_, i) => spbDayKey(new Date(base + i * 86_400_000)))
  const tomorrowKey = keys[1]

  const rows: unknown[][] = []
  for (let i = 0; i < keys.length; i += 3) {
    rows.push(
      keys.slice(i, i + 3).map((k) => ({
        text: dayLabel(k, todayKey, tomorrowKey),
        callback_data: `mb_date:${k}`,
      })),
    )
  }
  // Кнопками показаны только две недели — дальше редко, но бывает.
  rows.push([{ text: '✍️ Другая дата', callback_data: 'mb_manual:x' }])
  rows.push([{ text: '✖️ Отмена', callback_data: 'mb_cancel:x' }])

  const title = stepLabel(mode, 'Шаг 2 из 8 — какой день?', 'Перенос — шаг 1 из 4: какой день?')
  await say(`🛥 <b>${escapeHtml(boatName)}</b>\n\n${title}`, {
    reply_markup: { inline_keyboard: rows },
  })
}

// ─────────────────────────── Шаг 3: час ───────────────────────────

export async function pickDate(chatId: string, dayKey: string) {
  const data = await updateDraft(chatId, 'hour', { dayKey })

  const rows: unknown[][] = []
  for (let h = 0; h < 24; h += 4) {
    rows.push(
      [0, 1, 2, 3].map((i) => ({ text: `${pad(h + i)}:__`, callback_data: `mb_hour:${h + i}` })),
    )
  }
  rows.push([{ text: '✖️ Отмена', callback_data: 'mb_cancel:x' }])

  const { year, month, day } = parseDayKey(dayKey)
  const title = stepLabel(data.mode, 'Шаг 3 из 8 — во сколько начало?', 'Шаг 2 из 4 — во сколько?')
  await say(`📅 <b>${pad(day)}.${pad(month)}.${year}</b>\n\n${title}`, {
    reply_markup: { inline_keyboard: rows },
  })
}

// ─────────────────────────── Шаг 4: минуты ───────────────────────────

export async function pickHour(chatId: string, hour: number) {
  const data = await updateDraft(chatId, 'minute', { hour })

  const rows = [
    [0, 15, 30, 45].map((m) => ({ text: `${pad(hour)}:${pad(m)}`, callback_data: `mb_min:${m}` })),
    [{ text: '✖️ Отмена', callback_data: 'mb_cancel:x' }],
  ]
  await say(stepLabel(data.mode, 'Шаг 4 из 8 — минуты?', 'Шаг 3 из 4 — минуты?'), {
    reply_markup: { inline_keyboard: rows },
  })
}

export async function pickMinute(chatId: string, minute: number) {
  const draft = await getDraft(chatId)
  if (!draft?.data.dayKey || draft.data.hour == null) {
    return say('❌ Черновик потерян. Начните заново: /bron')
  }

  const { year, month, day } = parseDayKey(draft.data.dayKey)
  const start = fromSpbParts({ year, month, day, hour: draft.data.hour, minute })
  await pickWhen(chatId, start)
}

/** «Другая дата» — единственное место, где дату всё же набирают руками. */
export async function askManualDate(chatId: string) {
  await updateDraft(chatId, 'when', {})
  const now = toSpbParts(new Date())
  await say(
    'Пришлите дату и время.\n\n' +
      `Например: <code>${pad(now.day)}.${pad(now.month)} 18:00</code> — или только дату: <code>${pad(now.day)}.${pad(now.month)}</code>\n\n` +
      '<i>Время московское. Год можно не писать.</i>',
    { reply_markup: { force_reply: true } },
  )
}

/**
 * Разбор даты со временем: «20.08 18:00», «20.08.2026 18:00», «20.08 18.00».
 *
 * Разделитель времени — двоеточие, точка, дефис или пробел, а минуты вообще
 * можно не писать. Раньше принималось ТОЛЬКО двоеточие: менеджер прислал
 * «17.07 18.00», разбор молча вернул null, и диалог встал намертво — бот в
 * группе не отвечает на непонятное, чтобы не встревать в разговор.
 */
export function parseStart(text: string, now = new Date()): Date | null {
  const m = text
    .trim()
    .match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?\s+(\d{1,2})(?:[:.\-\s](\d{2}))?$/)
  if (!m) return null

  const [, dd, mm, yy, hh, mi] = m
  return buildStart(+dd, +mm, yy, +hh, mi ? +mi : 0, now)
}

/** Разбор одной даты: «20.08» или «20.08.2026». Время спросим кнопками. */
export function parseDayOnly(text: string, now = new Date()): string | null {
  const m = text.trim().match(/^(\d{1,2})[.\/](\d{1,2})(?:[.\/](\d{2,4}))?$/)
  if (!m) return null

  const [, dd, mm, yy] = m
  const d = buildStart(+dd, +mm, yy, 12, 0, now) // полдень — лишь бы день не съехал
  return d ? spbDayKey(d) : null
}

function buildStart(
  day: number,
  month: number,
  yy: string | undefined,
  hour: number,
  minute: number,
  now: Date,
): Date | null {
  if (month < 1 || month > 12 || day < 1 || day > 31 || hour > 23 || minute > 59) return null

  let year = yy ? (yy.length === 2 ? 2000 + +yy : +yy) : toSpbParts(now).year
  let d = fromSpbParts({ year, month, day, hour, minute })
  // Без года «20.08» в декабре означал бы прошлое — берём следующий год.
  if (!yy && d < now) {
    year += 1
    d = fromSpbParts({ year, month, day, hour, minute })
  }
  return Number.isNaN(d.getTime()) ? null : d
}

// ─────────────────────────── Шаг 3: длительность ───────────────────────────

export async function pickWhen(chatId: string, startAt: Date) {
  const data = await updateDraft(chatId, 'duration', { startAt: startAt.toISOString() })

  const quick = [2, 3, 4, 6, 8, 12, 24, 48, 72]
  const rows: unknown[][] = []
  for (let i = 0; i < quick.length; i += 3) {
    rows.push(
      quick.slice(i, i + 3).map((h) => ({
        text: durationLabel(h),
        callback_data: `mb_dur:${h}`,
      })),
    )
  }
  rows.push([{ text: '✖️ Отмена', callback_data: 'mb_cancel:x' }])

  const s = toSpbParts(startAt)
  const title = stepLabel(data.mode, 'Шаг 5 из 8 — на сколько?', 'Шаг 4 из 4 — на сколько?')
  await say(
    `📅 Начало: <b>${pad(s.day)}.${pad(s.month)}.${s.year}, ${pad(s.hour)}:${pad(s.minute)}</b>\n\n` +
      `${title}\n\n` +
      `<i>Или ответьте числом часов, например <code>5</code> (от ${MIN_DURATION_HOURS} до ${MAX_DURATION_HOURS / 24} суток).</i>`,
    { reply_markup: { inline_keyboard: rows } },
  )
}

// ─────────────────────────── Шаги 4–6: клиент ───────────────────────────

export async function pickDuration(chatId: string, hours: number) {
  const draft = await getDraft(chatId)
  if (!draft?.data.startAt) return say('❌ Черновик потерян. Начните заново: /bron')

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
    await updateDraft(chatId, 'duration', {})
    return say(`❌ Не выйдет: ${why[rejection]}. Пришлите другую длительность.`)
  }

  // Перенос на этом и заканчивается: клиент у брони уже есть.
  if (draft.data.mode === 'retime') {
    return finishRetime(chatId, draft.data, start, end)
  }

  await updateDraft(chatId, 'name', { hours })
  // Имя и телефон кнопками не выбрать — их всегда набирают. Отсюда force_reply:
  // ответ на сообщение бота доходит даже при включённом режиме приватности.
  await say(
    `🕐 ${formatInterval(start, end)}\n\nШаг 6 из 8 — имя клиента?`,
    { reply_markup: { force_reply: true } },
  )
}

/**
 * Применить перенос.
 *
 * Идёт через applyReschedule — тот же путь, что у ответа текстом на карточку и
 * у админки: перерисовать карточку в группе и пересчитать цену. Дублировать
 * это здесь значило бы развести три интерфейса.
 */
async function finishRetime(chatId: string, d: DraftData, start: Date, end: Date) {
  if (!d.bookingId) {
    await dropDraft(chatId)
    return say('❌ Потеряна заявка. Нажмите «Изменить время» на карточке заново.')
  }

  const res = await applyReschedule(d.bookingId, start, end)

  if (res === 'busy') {
    // Не бросаем на полпути: катер известен, менять надо только время.
    await updateDraft(chatId, 'date', {})
    await say('❌ Катер занят в это время. Выберите другой день.')
    return askDate(chatId, d.boatName ?? 'Катер', 'retime')
  }
  if (res === 'not_found') {
    await dropDraft(chatId)
    return say('❌ Заявка не найдена.')
  }

  await dropDraft(chatId)
  await say(`✅ Перенесено: ${formatInterval(start, end)}`)
}

export async function pickName(chatId: string, name: string) {
  await updateDraft(chatId, 'phone', { clientName: name })
  await say(`👤 ${escapeHtml(name)}\n\nШаг 7 из 8 — телефон?`, {
    reply_markup: { force_reply: true },
  })
}

export async function pickPhone(chatId: string, phone: string) {
  await updateDraft(chatId, 'guests', { phone })
  const rows = [
    [1, 2, 3, 4].map((g) => ({ text: String(g), callback_data: `mb_guests:${g}` })),
    [5, 6, 8, 10].map((g) => ({ text: String(g), callback_data: `mb_guests:${g}` })),
    [12, 15, 20].map((g) => ({ text: String(g), callback_data: `mb_guests:${g}` })),
  ]
  await say(`📞 ${escapeHtml(phone)}\n\nШаг 8 из 8 — сколько гостей?`, {
    reply_markup: { inline_keyboard: rows },
  })
}

export async function pickGuests(chatId: string, guests: number) {
  await updateDraft(chatId, 'comment', { guests })
  await say('Комментарий? (повод, пожелания)', {
    reply_markup: {
      inline_keyboard: [[{ text: '➡️ Пропустить', callback_data: 'mb_skip:x' }]],
      force_reply: true,
    },
  })
}

// ─────────────────────────── Финал ───────────────────────────

export async function finishDraft(chatId: string, comment: string | undefined, who: string) {
  const draft = await getDraft(chatId)
  if (!draft) return say('❌ Черновик потерян. Начните заново: /bron')

  const d: DraftData = { ...draft.data, comment }
  if (!d.boatSlug || !d.startAt || !d.hours || !d.clientName || !d.phone) {
    await dropDraft(chatId)
    return say('❌ Черновик неполный. Начните заново: /bron')
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
      comment: comment || undefined,
      lang: 'ru',
      manual: { by: who },
    })
    await dropDraft(chatId)

    // Карточку рисует общий код уведомлений — чтобы бронь от менеджера
    // выглядела в группе так же, как заявка с сайта.
    const { getBookingForMessage, setTgMessageId, mirrorToSheet } = await import('@/lib/bookings-db')
    const { sendBookingNotification } = await import('@/lib/telegram')
    const full = await getBookingForMessage(booking.id)
    if (full) {
      const messageId = await sendBookingNotification(full)
      await setTgMessageId(booking.id, messageId)
    }
    // Бронь от менеджера создаётся сразу подтверждённой — значит, и в таблицу.
    await mirrorToSheet(booking.id)
  } catch (e) {
    if (e instanceof BoatBusyError) {
      // Возвращаем к выбору дня кнопками, а не к набору руками: всё остальное
      // (катер, имя, телефон) в черновике уже есть, менять надо только время.
      await updateDraft(chatId, 'date', {})
      await say('❌ Катер уже занят в это время. Выберите другой день.')
      return askDate(chatId, d.boatName ?? 'Катер', 'new')
    }
    await dropDraft(chatId)
    console.error('[bot-flow] не удалось создать бронь:', e)
    return say('❌ Не удалось создать бронь. Попробуйте ещё раз: /bron')
  }
}

export async function cancelDraft(chatId: string) {
  await dropDraft(chatId)
  await say('Отменено.')
}
