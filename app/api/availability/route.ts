import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getBusyIntervals, BoatNotFoundError } from '@/lib/bookings-db'
import { clientIp, rateLimit } from '@/lib/rate-limit'
import { BOOKING_HORIZON_DAYS } from '@/lib/booking-rules'

export const dynamic = 'force-dynamic'

const querySchema = z.object({
  boatSlug: z.string().min(1),
  from: z.string().datetime(),
  to: z.string().datetime(),
})

/** Занятые интервалы катера — календарь на клиенте по ним красит дни и слоты. */
export async function GET(req: Request) {
  const limited = rateLimit(`availability:${clientIp(req.headers)}`, 120, 60_000)
  if (!limited.ok) {
    return NextResponse.json(
      { error: 'RATE_LIMITED' },
      { status: 429, headers: { 'Retry-After': String(limited.retryAfterSeconds) } },
    )
  }

  const url = new URL(req.url)
  const parsed = querySchema.safeParse({
    boatSlug: url.searchParams.get('boatSlug'),
    from: url.searchParams.get('from'),
    to: url.searchParams.get('to'),
  })
  if (!parsed.success) {
    return NextResponse.json({ error: 'BAD_REQUEST' }, { status: 400 })
  }

  const from = new Date(parsed.data.from)
  const to = new Date(parsed.data.to)
  if (to <= from) return NextResponse.json({ error: 'BAD_RANGE' }, { status: 400 })

  const maxRange = (BOOKING_HORIZON_DAYS + 31) * 86_400_000
  if (to.getTime() - from.getTime() > maxRange) {
    return NextResponse.json({ error: 'RANGE_TOO_WIDE' }, { status: 400 })
  }

  try {
    const busy = await getBusyIntervals(parsed.data.boatSlug, from, to)
    return NextResponse.json({
      busy: busy.map((i) => ({ start: i.start.toISOString(), end: i.end.toISOString() })),
    })
  } catch (e) {
    if (e instanceof BoatNotFoundError) {
      return NextResponse.json({ error: 'BOAT_NOT_FOUND' }, { status: 404 })
    }
    console.error('[GET /api/availability]', e)
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 })
  }
}
