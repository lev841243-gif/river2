/**
 * Черновик заявки, которую клиент заполняет в боте по шагам.
 *
 * Своя таблица ClientBotDraft, отдельно от менеджерского BotDraft — см.
 * комментарий у модели в schema.prisma. Состояние в БД, а не в памяти:
 * при перезапуске процесса наполовину введённая заявка не пропадёт.
 */

import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export type ClientStep =
  | 'day'
  | 'hour'
  | 'minute'
  | 'duration'
  | 'guests'
  | 'name'
  | 'phone'
  | 'comment'

export interface ClientDraftData {
  boatSlug?: string
  boatName?: string
  /** Ник клиента в Telegram — попадёт в заявку как @username. */
  tgUsername?: string
  /** Выбранный день по Петербургу, «2026-07-22». */
  dayKey?: string
  /** Выбранный час, 0–23; минуты ждут отдельного шага. */
  hour?: number
  /** ISO-строка: Date не переживает сериализацию в JSON. */
  startAt?: string
  hours?: number
  guests?: number
  clientName?: string
  phone?: string
  comment?: string
}

export async function getClientDraft(chatId: string) {
  const d = await prisma.clientBotDraft.findUnique({ where: { chatId } })
  if (!d) return null
  return { step: d.step as ClientStep, data: d.data as ClientDraftData }
}

export async function startClientDraft(chatId: string, patch: ClientDraftData) {
  const data = patch as Prisma.InputJsonValue
  await prisma.clientBotDraft.upsert({
    where: { chatId },
    create: { chatId, step: 'day', data },
    update: { step: 'day', data },
  })
}

export async function updateClientDraft(chatId: string, step: ClientStep, patch: ClientDraftData) {
  const current = await prisma.clientBotDraft.findUnique({ where: { chatId } })
  const data = { ...((current?.data as ClientDraftData) ?? {}), ...patch }
  await prisma.clientBotDraft.update({
    where: { chatId },
    data: { step, data: data as Prisma.InputJsonValue },
  })
  return data
}

export async function dropClientDraft(chatId: string) {
  await prisma.clientBotDraft.deleteMany({ where: { chatId } })
}

/** Убрать заброшенные черновики — клиент мог начать и уйти. */
export async function dropStaleClientDrafts(olderThanMinutes = 30) {
  const cutoff = new Date(Date.now() - olderThanMinutes * 60_000)
  await prisma.clientBotDraft.deleteMany({ where: { updatedAt: { lt: cutoff } } })
}
