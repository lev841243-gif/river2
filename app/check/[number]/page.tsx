import type { Metadata } from 'next'
import { getAdmin } from '@/lib/auth'
import { findCertificate, normalizeNumber } from '@/lib/certificate/service'
import { formatSpbDate, formatSpbDateTime } from '@/lib/spb-time'
import { RedeemButton } from './redeem-button'

// Зависит от куки (getAdmin) и статуса в БД — кэшировать нельзя.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Проверка сертификата — Судоходная Компания «Дно»',
  robots: { index: false },
}

export default async function CheckPage({ params }: { params: Promise<{ number: string }> }) {
  const raw = decodeURIComponent((await params).number)
  const number = normalizeNumber(raw)
  const [certificate, admin] = await Promise.all([findCertificate(number), getAdmin()])

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="font-serif text-2xl text-primary">Судоходная Компания «Дно»</div>
          <p className="mt-1 text-sm text-muted-foreground">Проверка подарочного сертификата</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 text-center">
          {!certificate ? (
            <>
              <StatusMark tone="bad" />
              <h1 className="mt-4 font-serif text-xl text-card-foreground">Сертификат не найден</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Номера{' '}
                <span className="font-mono text-card-foreground">{number}</span> нет в системе.
                Проверьте, что он введён без ошибок.
              </p>
            </>
          ) : certificate.status === 'ISSUED' ? (
            <>
              <StatusMark tone="good" />
              <h1 className="mt-4 font-serif text-xl text-card-foreground">
                Сертификат действителен
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">{certificate.title}</p>
              <dl className="mt-5 space-y-2 text-left text-sm">
                <Row label="Номер" value={certificate.number} mono />
                <Row label="Выдан" value={formatSpbDate(certificate.issuedAt)} />
              </dl>
              {admin ? (
                <RedeemButton number={certificate.number} />
              ) : (
                // Менеджер навёл камеру, но ещё не вошёл: даём войти и вернуться
                // сюда же (next), чтобы сразу увидеть кнопку «Погасить». Клиенту
                // ссылка не мешает — она неприметная и ведёт на вход в панель.
                <a
                  href={`/admin/login?next=${encodeURIComponent(`/check/${certificate.number}`)}`}
                  className="mt-6 inline-block text-sm text-muted-foreground underline underline-offset-4 hover:text-card-foreground"
                >
                  Менеджер? Войдите, чтобы погасить
                </a>
              )}
            </>
          ) : (
            <>
              <StatusMark tone="neutral" />
              <h1 className="mt-4 font-serif text-xl text-card-foreground">
                Сертификат уже погашён
              </h1>
              <dl className="mt-5 space-y-2 text-left text-sm">
                <Row label="Номер" value={certificate.number} mono />
                <Row label="Выдан" value={formatSpbDate(certificate.issuedAt)} />
                {certificate.redeemedAt && (
                  <Row label="Погашён" value={formatSpbDateTime(certificate.redeemedAt)} />
                )}
                {admin && certificate.redeemedBy && (
                  <Row label="Погасил" value={certificate.redeemedBy} />
                )}
              </dl>
            </>
          )}
        </div>
      </div>
    </main>
  )
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/50 pb-2 last:border-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={mono ? 'font-mono text-card-foreground' : 'text-card-foreground'}>{value}</dd>
    </div>
  )
}

/** Цветной кружок-иконка статуса: подтверждение / нейтраль / отказ. */
function StatusMark({ tone }: { tone: 'good' | 'neutral' | 'bad' }) {
  const cls = {
    good: 'bg-emerald-500/15 text-emerald-500',
    neutral: 'bg-muted text-muted-foreground',
    bad: 'bg-destructive/15 text-destructive',
  }[tone]
  const glyph = { good: '✓', neutral: '✓', bad: '✕' }[tone]
  return (
    <div
      className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl ${cls}`}
    >
      {glyph}
    </div>
  )
}
