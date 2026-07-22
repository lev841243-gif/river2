/**
 * Ядро клиентского бота — разбор апдейта, транспортно-независимое.
 *
 * Один и тот же handleClientUpdate вызывают два входа:
 * - прод: app/api/telegram/client-webhook/route.ts (вебхук);
 * - локально: scripts/client-bot-dev.ts (long-polling, без деплоя).
 *
 * Фаза 1 — только каркас: /start → приветствие с кнопкой «Наши лодки».
 * Галерея (фаза 2) и мастер брони (фаза 3) подключатся сюда же.
 */

import path from 'node:path'
import { prisma } from '@/lib/prisma'
import { rateLimit } from '@/lib/rate-limit'
import { answerClientCallback, callClientTelegram, escapeHtml, sendClientPhoto } from './telegram'
import {
  beginBooking,
  cancelBooking,
  finishBooking,
  handleBookingContact,
  handleBookingText,
  pickDay,
  pickDuration,
  pickGuests,
  pickHour,
  pickMinute,
} from './booking-flow'
import { dropClientDraft, dropStaleClientDrafts, getClientDraft } from './draft'

// ── Типы Telegram: берём только используемые поля ──
interface TgChat {
  id: number
  type: string
}
interface TgUser {
  id?: number
  username?: string
  first_name?: string
}
interface TgMessage {
  message_id: number
  chat?: TgChat
  from?: TgUser
  text?: string
  contact?: { phone_number: string }
}
interface TgCallbackQuery {
  id: string
  data?: string
  from?: TgUser
  message?: TgMessage
}
export interface TgUpdate {
  update_id: number
  message?: TgMessage
  callback_query?: TgCallbackQuery
}

const GREETING =
  'Привет! Это бот судоходной компании «Дно» 🛥\n\n' +
  'Здесь можно посмотреть наши катера и оставить заявку на прогулку — ' +
  'менеджер свяжется с вами и подтвердит.'

/** Кнопка, ведущая в галерею лодок. Пока — единственный вход. */
function mainMenu() {
  return {
    inline_keyboard: [[{ text: '🛥 Наши лодки', callback_data: 'boats' }]],
  }
}

async function send(chatId: number | string, text: string, extra: Record<string, unknown> = {}) {
  await callClientTelegram('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    ...extra,
  })
}

/** Когда последний раз подчищали брошенные черновики (троттлинг сметания). */
let lastSweep = 0

export async function handleClientUpdate(update: TgUpdate): Promise<void> {
  // Бот публичный — любой может долбить кнопками и командами. Флуд-лимит на все
  // входящие действия пользователя. В личке chat.id === user.id, ключ по from.id.
  const userId = update.message?.from?.id ?? update.callback_query?.from?.id
  if (userId != null) {
    const flood = rateLimit(`client-bot:flood:${userId}`, 30, 60_000)
    if (!flood.ok) {
      // Сообщения гасим молча; у нажатой кнопки хотя бы убираем «часики».
      if (update.callback_query) {
        await answerClientCallback(update.callback_query.id, 'Слишком часто. Подождите немного.')
      }
      return
    }
  }

  // Раз в 5 минут сметаем брошенные черновики — кто начал бронь и ушёл.
  const now = Date.now()
  if (now - lastSweep > 5 * 60_000) {
    lastSweep = now
    void dropStaleClientDrafts()
  }

  if (update.callback_query) return handleCallback(update.callback_query)
  if (update.message) return handleMessage(update.message)
}

async function handleMessage(msg: TgMessage) {
  // Только личка: в группы этого бота не добавляем, но подстрахуемся.
  if (msg.chat?.type !== 'private') return
  const chatId = msg.chat.id

  // Телефон кнопкой «Поделиться номером» приходит как contact, не как текст.
  if (msg.contact?.phone_number) {
    if (await handleBookingContact(chatId, msg.contact.phone_number)) return
    // Контакт вне диалога брони — просто игнорируем.
    return
  }

  const text = (msg.text ?? '').trim()
  const command = text.split(/[\s@]/)[0].toLowerCase()

  if (command === '/start' || command === '/help') {
    // /start — явный сброс: бросаем недозаполненный черновик, чистим чужие
    // протухшие заодно.
    await dropClientDraft(String(chatId))
    await dropStaleClientDrafts()
    return send(chatId, GREETING, { reply_markup: mainMenu() })
  }

  // Шаг незаконченного мастера брони (имя, телефон, длительность, комментарий).
  if (await handleBookingText(chatId, text)) return

  // Иначе возвращаем в меню.
  return send(chatId, 'Нажмите кнопку ниже, чтобы посмотреть катера.', {
    reply_markup: mainMenu(),
  })
}

async function handleCallback(cb: TgCallbackQuery) {
  const chatId = cb.message?.chat?.id
  if (!chatId) return answerClientCallback(cb.id)

  const [action, arg] = (cb.data ?? '').split(':')

  // ── Шаги мастера брони (префикс cb_) ──
  if (action.startsWith('cb_')) {
    // Кнопки живут в чате вечно, а черновик протухает за 30 мин. Нажатие в
    // старом сообщении иначе роняло бы updateClientDraft ошибкой P2025.
    if (action !== 'cb_cancel' && !(await getClientDraft(String(chatId)))) {
      return answerClientCallback(cb.id, 'Этот диалог уже устарел. Начните заново: /start')
    }
    await answerClientCallback(cb.id)
    if (action === 'cb_day') return pickDay(chatId, arg)
    if (action === 'cb_hour') return pickHour(chatId, Number(arg))
    if (action === 'cb_min') return pickMinute(chatId, Number(arg))
    if (action === 'cb_dur') return pickDuration(chatId, Number(arg))
    if (action === 'cb_guests') return pickGuests(chatId, Number(arg))
    if (action === 'cb_skip') return finishBooking(chatId, undefined)
    if (action === 'cb_cancel') return cancelBooking(chatId)
    return
  }

  if (action === 'boats') {
    await answerClientCallback(cb.id)
    return showBoats(chatId)
  }

  if (action === 'boat') {
    await answerClientCallback(cb.id)
    return showBoat(chatId, arg)
  }

  if (action === 'book') {
    await answerClientCallback(cb.id)
    return beginBooking(chatId, arg, cb.from?.username)
  }

  return answerClientCallback(cb.id)
}

// ─────────────────────────── Галерея лодок ───────────────────────────

/**
 * Лента карточек лодок: у каждой сразу обложка и цена, листаешь и выбираешь.
 * Источник — БД (то, что заказчик правит в админке).
 *
 * Шлём отдельным фото на лодку, а не одним списком: только так под каждой
 * помещается своя кнопка «Забронировать». Альбом (sendMediaGroup) кнопок на
 * элемент не поддерживает, поэтому не он.
 */
async function showBoats(chatId: number) {
  const boats = await prisma.boat.findMany({
    where: { isVisible: true },
    select: { slug: true, nameRu: true, price: true, dir: true, cover: true },
    orderBy: { sortOrder: 'asc' },
  })

  if (boats.length === 0) {
    return send(chatId, 'Пока нет доступных катеров. Загляните чуть позже.')
  }

  await send(chatId, `<b>Наши катера</b> — ${boats.length} шт. Листайте вниз 👇`)

  for (const b of boats) {
    const priceLine = b.price ? `от ${b.price.toLocaleString('ru-RU')} ₽/час` : 'Цена по запросу'
    const caption = `🛥 <b>${escapeHtml(b.nameRu)}</b>\n${priceLine}`
    const file = path.join(process.cwd(), 'public', 'boats', b.dir, b.cover)
    const markup = {
      inline_keyboard: [
        [
          { text: 'ℹ️ Подробнее', callback_data: `boat:${b.slug}` },
          { text: '📅 Забронировать', callback_data: `book:${b.slug}` },
        ],
      ],
    }
    await sendClientPhoto(chatId, file, caption, markup)
    // Небольшая пауза: 16 фото подряд в один чат Telegram может притормозить
    // по флуд-лимиту. Пары сотен мс между отправками хватает.
    await sleep(150)
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

/** Массив строк из specs/amenities вида { ru: [...], en: [...] } — только ru. */
function ruList(json: unknown): string[] {
  if (json && typeof json === 'object' && 'ru' in json) {
    const ru = (json as { ru?: unknown }).ru
    if (Array.isArray(ru)) return ru.filter((x): x is string => typeof x === 'string')
  }
  return []
}

/** Карточка лодки: обложка + цена + описание + удобства, кнопка «Забронировать». */
async function showBoat(chatId: number, slug: string) {
  const boat = await prisma.boat.findUnique({
    where: { slug },
    select: {
      slug: true, nameRu: true, descRu: true, price: true,
      dir: true, cover: true, isVisible: true, amenities: true,
    },
  })
  if (!boat || !boat.isVisible) {
    return send(chatId, 'Этот катер сейчас недоступен. Вернуться к списку: /start')
  }

  const priceLine = boat.price ? `${boat.price.toLocaleString('ru-RU')} ₽/час` : 'Цена по запросу'
  const amenities = ruList(boat.amenities)
  const amenitiesBlock = amenities.length
    ? '\n\n' + amenities.map((a) => `• ${escapeHtml(a)}`).join('\n')
    : ''

  // Подпись Telegram — до 1024 символов; описание подрезаем, чтобы влезли удобства.
  const desc = boat.descRu.length > 400 ? boat.descRu.slice(0, 400).trimEnd() + '…' : boat.descRu
  const caption =
    `🛥 <b>${escapeHtml(boat.nameRu)}</b>\n${priceLine}\n\n` +
    escapeHtml(desc) +
    amenitiesBlock

  const file = path.join(process.cwd(), 'public', 'boats', boat.dir, boat.cover)
  const markup = {
    inline_keyboard: [
      [{ text: '📅 Забронировать', callback_data: `book:${boat.slug}` }],
      [{ text: '‹ К списку катеров', callback_data: 'boats' }],
    ],
  }

  return sendClientPhoto(chatId, file, caption, markup)
}
