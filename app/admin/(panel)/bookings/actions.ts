'use server'

import { revalidatePath } from 'next/cache'
import type { BookingStatus } from '@prisma/client'
import { z } from 'zod'
import { actorLabel, requireAdmin } from '@/lib/auth'
import { applyReschedule, applyStatusChange } from '@/lib/booking-workflow'
import { validateInterval } from '@/lib/booking-rules'
import { fromSpbParts } from '@/lib/spb-time'

export interface ActionState {
  error?: string
  ok?: string
}

const STATUSES = ['NEW', 'REVIEW', 'CONFIRMED', 'COMPLETED', 'CANCELLED'] as const

/**
 * Смена статуса из админки.
 *
 * Проверка доступа — здесь, а не только в layout: server action это открытая
 * HTTP-ручка, и без requireAdmin() статус мог бы сменить любой, кто знает её адрес.
 */
export async function setStatus(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const admin = await requireAdmin()

  const parsed = z
    .object({ id: z.string().min(1), status: z.enum(STATUSES) })
    .safeParse({ id: formData.get('id'), status: formData.get('status') })
  if (!parsed.success) return { error: 'Некорректный запрос' }

  const res = await applyStatusChange(
    parsed.data.id,
    parsed.data.status as BookingStatus,
    actorLabel(admin),
  )

  if (!res.ok) {
    // «Занято» — не сбой, а осмысленный ответ базы: пока менеджер думал, слот
    // мог занять другой (в том числе через бота).
    const why: Record<string, string> = {
      same: 'Статус уже такой',
      not_found: 'Заявка не найдена',
      busy: 'Не вышло: катер уже занят подтверждённой бронью на это время',
    }
    return { error: why[res.reason] ?? 'Не вышло' }
  }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${parsed.data.id}`)
  return { ok: 'Статус обновлён' }
}

const rescheduleSchema = z.object({
  id: z.string().min(1),
  /** «2026-08-20» из <input type="date"> */
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  /** «18:00» из <input type="time"> */
  time: z.string().regex(/^\d{2}:\d{2}$/),
  hours: z.coerce.number().positive(),
})

/**
 * Перенос времени.
 *
 * Длительность, а не «время до», — как и в форме на сайте: с «до» пришлось бы
 * гадать, какие это сутки при переходе через полночь.
 */
export async function reschedule(_prev: ActionState, formData: FormData): Promise<ActionState> {
  await requireAdmin()

  const parsed = rescheduleSchema.safeParse({
    id: formData.get('id'),
    date: formData.get('date'),
    time: formData.get('time'),
    hours: formData.get('hours'),
  })
  if (!parsed.success) return { error: 'Проверьте дату, время и длительность' }

  const [year, month, day] = parsed.data.date.split('-').map(Number)
  const [hour, minute] = parsed.data.time.split(':').map(Number)

  // Время вводится как петербургское — по нему живёт прогулка, а не по поясу
  // браузера менеджера.
  const start = fromSpbParts({ year, month, day, hour, minute })
  const end = new Date(start.getTime() + parsed.data.hours * 3_600_000)

  const rejection = validateInterval({ start, end })
  if (rejection) {
    const text: Record<string, string> = {
      PAST: 'Это время уже прошло',
      TOO_SHORT: 'Минимальная аренда — 1 ч',
      TOO_LONG: 'Максимум за одну заявку — 7 суток',
      TOO_FAR: 'Бронирование открыто на 180 дней вперёд',
      BOAT_BUSY: 'Катер занят',
    }
    return { error: text[rejection] ?? 'Некорректное время' }
  }

  const res = await applyReschedule(parsed.data.id, start, end)
  if (res === 'not_found') return { error: 'Заявка не найдена' }
  if (res === 'busy') return { error: 'Катер уже занят в это время' }

  revalidatePath('/admin/bookings')
  revalidatePath(`/admin/bookings/${parsed.data.id}`)
  return { ok: 'Время перенесено, цена пересчитана' }
}
