/**
 * Что происходит вокруг смены брони — общее для бота и админки.
 *
 * Раньше это жило внутри вебхука Telegram. Теперь у брони два интерфейса, и
 * дублировать цепочку нельзя: стоит админке забыть перерисовать карточку — и в
 * группе висит «Новая» с живыми кнопками поверх уже отменённой заявки, то есть
 * два расходящихся источника правды.
 *
 * Сама бизнес-логика (переходы, журнал, констрейнт) остаётся в lib/bookings-db.ts —
 * здесь только побочные эффекты вокруг неё.
 */

import type { BookingStatus } from '@prisma/client'
import {
  changeBookingStatus,
  getBookingForMessage,
  mirrorToSheet,
  rescheduleBooking,
  type StatusChangeResult,
} from '@/lib/bookings-db'
import { telegramConfigured, updateBookingMessage } from '@/lib/telegram'

/**
 * Перерисовать карточку заявки в группе.
 *
 * id сообщения берём из БД, а не из update: Telegram не вкладывает
 * reply_to_message рекурсивно, поэтому у ответа на подсказку до карточки не
 * дотянуться. fallbackMessageId — для нажатия кнопки, где id сообщения известен
 * сразу и заявка могла не иметь tgMessageId.
 *
 * Ошибки только логируются: Telegram недоступен — статус всё равно уже сменён,
 * и ронять из-за косметики действие менеджера нельзя.
 */
export async function refreshCard(bookingId: string, fallbackMessageId?: number): Promise<void> {
  if (!telegramConfigured()) return
  try {
    const fresh = await getBookingForMessage(bookingId)
    if (!fresh) return
    const messageId = fresh.tgMessageId ?? fallbackMessageId
    if (messageId) await updateBookingMessage(messageId, fresh)
  } catch (e) {
    console.error('[refreshCard] карточка не обновилась:', e)
  }
}

/**
 * Сменить статус и подтянуть за этим всё остальное: карточку в Telegram и,
 * для подтверждённых, строку в Google Sheets (ТЗ, п. 6.5).
 *
 * Побочные эффекты только при успехе: на отказе («занято», «статус тот же»)
 * менять нечего.
 */
export async function applyStatusChange(
  bookingId: string,
  to: BookingStatus,
  by: string,
  fallbackMessageId?: number,
): Promise<StatusChangeResult> {
  const res = await changeBookingStatus(bookingId, to, by)
  if (!res.ok) return res

  await refreshCard(bookingId, fallbackMessageId)

  // Зеркалим только подтверждённые. Ждём, а не пускаем в фон: фоновая задача
  // может не пережить ответ.
  if (to === 'CONFIRMED') await mirrorToSheet(bookingId)

  return res
}

/** Перенос времени + перерисовка карточки. */
export async function applyReschedule(
  bookingId: string,
  startAt: Date,
  endAt: Date,
): Promise<'ok' | 'busy' | 'not_found'> {
  const res = await rescheduleBooking(bookingId, startAt, endAt)
  if (res !== 'ok') return res

  await refreshCard(bookingId)
  return res
}
