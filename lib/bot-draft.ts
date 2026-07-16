/**
 * Черновик брони, которую менеджер заполняет в боте по шагам.
 *
 * Состояние держим в БД, а не в памяти процесса: при перезапуске PM2 память
 * обнуляется, и наполовину введённая бронь пропала бы. Плюс инстансов может
 * стать несколько — тогда память вообще не общая.
 */

import { prisma } from '@/lib/prisma'

/**
 * Шаги диалога по порядку.
 *
 * Дата, час и минуты разнесены по кнопкам: набор «ДД.ММ ЧЧ:ММ» руками — самое
 * хрупкое место диалога. Менеджер уже застревал, введя «18.00» вместо «18:00».
 * `when` остался как запасной путь «другая дата» — для дат дальше двух недель.
 */
export type DraftStep =
  | 'boat'
  | 'date'
  | 'hour'
  | 'minute'
  | 'when'
  | 'duration'
  | 'name'
  | 'phone'
  | 'guests'
  | 'comment'

export interface DraftData {
  /**
   * Что делаем: заводим новую бронь или переносим существующую.
   *
   * Шаги «день → час → минуты → длительность» у них общие, поэтому и черновик
   * общий: у переноса просто нет шагов про клиента, а в конце вместо создания
   * брони — перенос той, чей id лежит в bookingId.
   */
  mode?: 'new' | 'retime'
  /** Что переносим. Только при mode = 'retime'. */
  bookingId?: string
  boatSlug?: string
  boatName?: string
  /** Выбранный день по Петербургу, «2026-07-17». */
  dayKey?: string
  /** Выбранный час, 0–23. Минуты дожидаются отдельного шага. */
  hour?: number
  /** ISO-строка: в JSON Date не переживает сериализацию. */
  startAt?: string
  hours?: number
  clientName?: string
  phone?: string
  telegram?: string
  guests?: number
  comment?: string
}

export async function getDraft(chatId: string) {
  const d = await prisma.botDraft.findUnique({ where: { chatId } })
  if (!d) return null
  return { step: d.step as DraftStep, data: d.data as DraftData, userId: d.userId }
}

export async function startDraft(chatId: string, userId: string) {
  await prisma.botDraft.upsert({
    where: { chatId },
    create: { chatId, userId, step: 'boat', data: {} },
    update: { userId, step: 'boat', data: {} },
  })
}

export async function updateDraft(chatId: string, step: DraftStep, patch: DraftData) {
  const current = await prisma.botDraft.findUnique({ where: { chatId } })
  const data = { ...((current?.data as DraftData) ?? {}), ...patch }
  await prisma.botDraft.update({ where: { chatId }, data: { step, data } })
  return data
}

export async function dropDraft(chatId: string) {
  await prisma.botDraft.deleteMany({ where: { chatId } })
}

/**
 * Убрать заброшенные черновики. Менеджер мог начать бронь и уйти — такой
 * черновик молча перехватывал бы его следующие сообщения в группе.
 */
export async function dropStaleDrafts(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000)
  await prisma.botDraft.deleteMany({ where: { updatedAt: { lt: cutoff } } })
}
