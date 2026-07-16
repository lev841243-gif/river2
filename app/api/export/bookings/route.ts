import { NextResponse } from 'next/server'
import { toAnalyticsRecord } from '@/lib/analytics'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

/**
 * Выгрузка заявок в JSON для аналитики.
 *
 * Отдаёт персональные данные клиентов (имена, телефоны), поэтому закрыто
 * токеном. Пока нет админки с авторизацией — это простой общий секрет из
 * EXPORT_TOKEN; когда появится вход, выгрузку надо перевести на сессию.
 *
 * Без заданного EXPORT_TOKEN endpoint выключен: незакрытая выгрузка телефонов
 * в открытый интернет хуже, чем её отсутствие.
 *
 * Параметры: ?from=ISO&to=ISO&status=CONFIRMED&format=json|ndjson
 */
export async function GET(req: Request) {
  const expected = process.env.EXPORT_TOKEN
  if (!expected) {
    return NextResponse.json({ error: 'EXPORT_DISABLED' }, { status: 404 })
  }

  const url = new URL(req.url)
  const token = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? url.searchParams.get('token')
  if (token !== expected) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 })
  }

  const from = url.searchParams.get('from')
  const to = url.searchParams.get('to')
  const status = url.searchParams.get('status')

  const rows = await prisma.booking.findMany({
    where: {
      ...(status ? { status: status as never } : {}),
      ...(from || to
        ? {
            startAt: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    },
    include: { boat: { select: { slug: true, nameRu: true } } },
    orderBy: { startAt: 'asc' },
  })

  const records = rows.map(toAnalyticsRecord)

  // ndjson — по записи на строку: удобно скармливать построчно, не читая
  // весь файл в память, когда заявок станут десятки тысяч.
  if (url.searchParams.get('format') === 'ndjson') {
    return new NextResponse(records.map((r) => JSON.stringify(r)).join('\n'), {
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Content-Disposition': 'attachment; filename="bookings.ndjson"',
      },
    })
  }

  return NextResponse.json(
    { exportedAt: new Date().toISOString(), count: records.length, bookings: records },
    {
      headers: {
        'Content-Disposition': 'attachment; filename="bookings.json"',
        // Выгрузка с телефонами не должна осесть в кэше прокси.
        'Cache-Control': 'no-store',
      },
    },
  )
}
