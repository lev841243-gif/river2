import { NextResponse } from 'next/server'
import {
  bookingInputSchema,
  isSlotFree,
  validateInterval,
  type BookingRejection,
} from '@/lib/booking-rules'
import {
  BoatBusyError,
  BoatNotFoundError,
  createBooking,
  getBookingForMessage,
  getBusyIntervals,
  setTgMessageId,
} from '@/lib/bookings-db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { sendBookingNotification, telegramConfigured } from '@/lib/telegram'

/**
 * Уведомить менеджера. Ошибки только логируются: заявка уже в базе, и ронять
 * ответ клиенту из-за недоступного Telegram нельзя — он увидел бы ошибку и
 * отправил бронь повторно.
 */
async function notifyManager(bookingId: string): Promise<void> {
  if (!telegramConfigured()) return
  try {
    const b = await getBookingForMessage(bookingId)
    if (!b) return
    const messageId = await sendBookingNotification(b)
    await setTgMessageId(bookingId, messageId)
  } catch (e) {
    console.error('[notifyManager] уведомление не ушло:', e)
  }
}

export const dynamic = 'force-dynamic'

/** Отказы, из-за которых нет смысла повторять запрос как есть. */
const REJECTION_STATUS: Record<BookingRejection, number> = {
  PAST: 400,
  TOO_SHORT: 400,
  TOO_LONG: 400,
  OUTSIDE_HOURS: 400,
  TOO_FAR: 400,
  BOAT_BUSY: 409,
}

export async function POST(req: Request) {
  const limited = rateLimit(`bookings:${clientIp(req.headers)}`, 5, 10 * 60_000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'BAD_JSON' }, { status: 400 })
  }

  const parsed = bookingInputSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', issues: parsed.error.flatten().fieldErrors },
      { status: 400 },
    )
  }
  const input = parsed.data

  // Honeypot: поле скрыто от людей, заполнить его мог только бот.
  // Отвечаем «успехом», чтобы не подсказывать боту, что он опознан.
  if (input.website) {
    console.warn('[POST /api/bookings] honeypot triggered', { ip: clientIp(req.headers) })
    return NextResponse.json({ ok: true }, { status: 201 })
  }

  const interval = { start: new Date(input.startAt), end: new Date(input.endAt) }

  const rejection = validateInterval(interval)
  if (rejection) {
    return NextResponse.json({ error: rejection }, { status: REJECTION_STATUS[rejection] })
  }

  try {
    // Мягкая проверка — чтобы вернуть понятную ошибку до вставки. Настоящую
    // защиту от гонки даёт exclusion-констрейнт внутри createBooking.
    const busy = await getBusyIntervals(input.boatId, interval.start, interval.end)
    if (!isSlotFree(interval, busy)) {
      return NextResponse.json({ error: 'BOAT_BUSY' }, { status: 409 })
    }

    const booking = await createBooking({
      boatSlug: input.boatId,
      startAt: interval.start,
      endAt: interval.end,
      guests: input.guests,
      clientName: input.clientName,
      phone: input.phone,
      telegram: input.telegram,
      comment: input.comment,
      lang: input.lang,
      utmSource: input.utmSource,
      utmMedium: input.utmMedium,
      utmCampaign: input.utmCampaign,
      referer: req.headers.get('referer'),
    })

    // Ждём отправку: на serverless фоновая задача не переживёт ответ, а
    // потерянное уведомление — это потерянный клиент. Секунда терпима.
    await notifyManager(booking.id)

    return NextResponse.json(
      { ok: true, bookingId: booking.id, priceSnapshot: booking.priceSnapshot },
      { status: 201 },
    )
  } catch (e) {
    if (e instanceof BoatBusyError) {
      return NextResponse.json({ error: 'BOAT_BUSY' }, { status: 409 })
    }
    if (e instanceof BoatNotFoundError) {
      return NextResponse.json({ error: 'BOAT_NOT_FOUND' }, { status: 404 })
    }
    console.error('[POST /api/bookings]', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
