/**
 * Черновик брони, которую менеджер заполняет в боте по шагам.
 *
 * Состояние держим в БД, а не в памяти процесса: при перезапуске PM2 память
 * обнуляется, и наполовину введённая бронь пропала бы. Плюс инстансов может
 * стать несколько — тогда память вообще не общая.
 */

import { prisma } from '@/lib/prisma'

/** Шаги диалога по порядку. */
export type DraftStep = 'boat' | 'when' | 'duration' | 'name' | 'phone' | 'guests' | 'comment'

export interface DraftData {
  boatSlug?: string
  boatName?: string
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
