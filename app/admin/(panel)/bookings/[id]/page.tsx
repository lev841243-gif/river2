import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth'
import {
  getBooking,
  getCompetingBookings,
  isBlocking,
  SOURCE_LABEL,
  STATUS_LABEL,
} from '@/lib/admin-data'
import { durationHours } from '@/lib/booking-rules'
import { phoneDigits } from '@/lib/telegram'
import { Card, fmtDate, fmtDateTime, fmtPrice, fmtTime, StatusBadge } from '../../ui'
import { StatusControls } from './status-controls'
import { RescheduleForm } from './reschedule-form'

export const dynamic = 'force-dynamic'

export default async function BookingPage({ params }: { params: Promise<{ id: string }> }) {
  await requireAdmin()
  const { id } = await params

  const b = await getBooking(id)
  if (!b) notFound()

  const competing = await getCompetingBookings(b)
  const hours = durationHours({ start: b.startAt, end: b.endAt })

  return (
    <div className="space-y-4">
      <Link href="/admin/bookings" className="text-sm text-muted-foreground hover:text-foreground">
        ← К списку
      </Link>

      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-xl font-medium">{b.clientName}</h1>
        <StatusBadge status={b.status} />
        {b.source === 'MANUAL' && (
          <span className="text-xs text-muted-foreground">заведена менеджером</span>
        )}
      </div>

      <div className="grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Прогулка</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Row k="Катер" v={b.boat.nameRu} />
              <Row k="Дата" v={fmtDate(b.startAt)} />
              <Row k="Время" v={`${fmtTime(b.startAt)} — ${fmtTime(b.endAt)} (МСК)`} />
              <Row k="Длительность" v={`${hours} ч`} />
              <Row k="Гостей" v={String(b.guests)} />
              <Row k="Стоимость" v={fmtPrice(b.priceSnapshot)} />
            </dl>
            {b.comment && (
              <div className="mt-3 border-t border-border pt-3">
                <div className="text-xs text-muted-foreground">Комментарий</div>
                <p className="mt-1 whitespace-pre-wrap text-sm">{b.comment}</p>
              </div>
            )}
          </Card>

          {competing.length > 0 && (
            <Card className="border-amber-500/30">
              {/*
                Следствие правила «слот держит только CONFIRMED»: на одно время
                может лежать несколько заявок. Без этого блока менеджер
                подтвердил бы одну и молча забыл про остальные.
              */}
              <h2 className="mb-2 text-sm text-amber-300">
                На это же время есть другие заявки: {competing.length}
              </h2>
              <div className="space-y-2">
                {competing.map((c) => (
                  <Link
                    key={c.id}
                    href={`/admin/bookings/${c.id}`}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm transition hover:border-primary/40"
                  >
                    <span className="flex items-center gap-2">
                      <StatusBadge status={c.status} />
                      {c.clientName}
                    </span>
                    <span className="text-muted-foreground">
                      {fmtTime(c.startAt)} — {fmtTime(c.endAt)}
                      {isBlocking(c.status) && ' · держит слот'}
                    </span>
                  </Link>
                ))}
              </div>
            </Card>
          )}

          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Перенести время</h2>
            <RescheduleForm
              id={b.id}
              date={dayInput(b.startAt)}
              time={fmtTime(b.startAt)}
              hours={hours}
            />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Журнал</h2>
            <ol className="space-y-2 text-sm">
              {b.statusHistory.map((h) => (
                <li key={h.id} className="flex flex-wrap items-center gap-2">
                  <span className="text-muted-foreground">{fmtDateTime(h.changedAt)}</span>
                  <span>
                    {h.from ? `${STATUS_LABEL[h.from]} → ` : 'создана: '}
                    {STATUS_LABEL[h.to]}
                  </span>
                  <span className="text-muted-foreground">· {h.changedBy ?? '—'}</span>
                </li>
              ))}
            </ol>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Статус</h2>
            <StatusControls id={b.id} current={b.status} />
          </Card>

          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Связаться</h2>
            <div className="space-y-2 text-sm">
              <div>
                <div className="text-xs text-muted-foreground">Телефон</div>
                {/*
                  Ссылка tel: здесь работает — это обычная веб-страница.
                  Ограничение с copy_text касалось только кнопок Telegram.
                */}
                <a href={`tel:${phoneDigits(b.phone)}`} className="text-primary hover:underline">
                  {b.phone}
                </a>
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                <a
                  href={`https://wa.me/${phoneDigits(b.phone)}`}
                  target="_blank"
                  rel="noreferrer"
                  className={contactBtn}
                >
                  WhatsApp
                </a>
                {b.telegram && (
                  <a
                    href={`https://t.me/${b.telegram.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={contactBtn}
                  >
                    Telegram
                  </a>
                )}
              </div>
            </div>
          </Card>

          <Card>
            <h2 className="mb-3 text-sm text-muted-foreground">Откуда</h2>
            <dl className="grid grid-cols-2 gap-y-2 text-sm">
              <Row k="Источник" v={SOURCE_LABEL[b.source]} />
              <Row k="Язык" v={b.lang.toUpperCase()} />
              {b.utmSource && <Row k="utm_source" v={b.utmSource} />}
              {b.utmMedium && <Row k="utm_medium" v={b.utmMedium} />}
              {b.utmCampaign && <Row k="utm_campaign" v={b.utmCampaign} />}
              <Row k="Создана" v={fmtDateTime(b.createdAt)} />
            </dl>
          </Card>

          {b.client && (
            <Card>
              <h2 className="mb-3 text-sm text-muted-foreground">Клиент</h2>
              <div className="space-y-1 text-sm">
                <div>
                  Обращений: {b.client._count.bookings}
                  {b.client._count.bookings > 1 && (
                    <span className="ml-2 text-xs text-primary">повторный</span>
                  )}
                </div>
                <div className="text-muted-foreground">
                  Впервые: {fmtDate(b.client.firstSeen)}
                </div>
                <Link
                  href={`/admin/clients/${b.client.id}`}
                  className="inline-block pt-1 text-primary hover:underline"
                >
                  История обращений →
                </Link>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <>
      <dt className="text-muted-foreground">{k}</dt>
      <dd>{v}</dd>
    </>
  )
}

/** «2026-08-20» для <input type="date"> — по петербургскому календарю. */
function dayInput(d: Date): string {
  const [day, month, year] = fmtDate(d).split('.')
  return `${year}-${month}-${day}`
}

const contactBtn =
  'rounded-md border border-border px-3 py-1.5 text-xs transition hover:border-primary/40'
