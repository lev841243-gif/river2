'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { AlertCircle, CalendarClock, CheckCircle2, Loader2, Send, X } from 'lucide-react'
import { contacts, dict, type Boat, type Lang } from '@/lib/i18n'
import { readUtmCookie } from '@/lib/utm'
import { MAX_GUESTS, type Interval } from '@/lib/booking-rules'
import { dayWindow, endOptions, slotDate, startOptions } from '@/lib/booking-slots'
import { parseDayKey, spbTodayKey } from '@/lib/spb-time'
import { BookingCalendar, type MonthCursor } from './booking-calendar'

type Step = 'when' | 'details' | 'success'

interface BusyResponse {
  busy: { start: string; end: string }[]
}

export function BookingModal({
  lang = 'ru',
  boats,
  initialBoatId,
  onClose,
}: {
  lang?: Lang
  boats: Boat[]
  initialBoatId: string | null
  onClose: () => void
}) {
  const t = dict[lang].booking

  // Момент открытия модалки — фиксируем, чтобы «сейчас» не плыло между рендерами
  // и календарь не перестраивался на каждый тик.
  const [now] = useState(() => new Date())
  const todayKey = spbTodayKey(now)

  const [step, setStep] = useState<Step>('when')
  const [boatSlug, setBoatSlug] = useState(initialBoatId ?? boats[0]?.id ?? '')
  const [cursor, setCursor] = useState<MonthCursor>(() => {
    const { year, month } = parseDayKey(todayKey)
    return { year, month }
  })
  const [day, setDay] = useState<string | null>(null)
  const [from, setFrom] = useState<number | null>(null)
  const [to, setTo] = useState<number | null>(null)

  const [busy, setBusy] = useState<Interval[]>([])
  const [loadingBusy, setLoadingBusy] = useState(false)

  const [guests, setGuests] = useState(2)
  const [clientName, setClientName] = useState('')
  const [phone, setPhone] = useState('')
  const [telegram, setTelegram] = useState('')
  const [comment, setComment] = useState('')
  const [website, setWebsite] = useState('') // honeypot

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<{ title: string; text: string } | null>(null)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Занятость тянем на весь видимый месяц с запасом в месяц по краям —
  // так соседние месяцы уже прогреты, когда пользователь листает.
  const loadBusy = useCallback(async () => {
    if (!boatSlug) return
    setLoadingBusy(true)
    const rangeStart = new Date(Date.UTC(cursor.year, cursor.month - 2, 1))
    const rangeEnd = new Date(Date.UTC(cursor.year, cursor.month + 1, 1))
    try {
      const res = await fetch(
        `/api/availability?boatSlug=${encodeURIComponent(boatSlug)}` +
          `&from=${rangeStart.toISOString()}&to=${rangeEnd.toISOString()}`,
      )
      if (!res.ok) throw new Error(`availability ${res.status}`)
      const data: BusyResponse = await res.json()
      setBusy(data.busy.map((b) => ({ start: new Date(b.start), end: new Date(b.end) })))
    } catch (e) {
      console.error('[BookingModal] availability failed:', e)
      // Занятость неизвестна — показываем календарь пустым; финальную проверку
      // всё равно делает сервер при отправке заявки.
      setBusy([])
    } finally {
      setLoadingBusy(false)
    }
  }, [boatSlug, cursor])

  useEffect(() => {
    void loadBusy()
  }, [loadBusy])

  // Смена катера или даты обнуляет выбранное время: слоты другие.
  useEffect(() => {
    setFrom(null)
    setTo(null)
  }, [boatSlug, day])

  const starts = useMemo(
    () => (day ? startOptions(day, busy, now) : []),
    [day, busy, now],
  )
  const ends = useMemo(
    () => (day && from != null ? endOptions(day, from, busy) : []),
    [day, from, busy],
  )

  const dayIsEmpty = day != null && starts.length > 0 && starts.every((o) => o.disabled)

  const boat = boats.find((b) => b.id === boatSlug)
  const hours = from != null && to != null ? (to - from) / 60 : null
  const price = boat?.price != null && hours != null ? Math.round(boat.price * hours) : null

  function goToDetails() {
    const next: Record<string, string> = {}
    if (!day) next.day = t.pickDateFirst
    else if (from == null || to == null) next.time = t.pickTimeFirst
    setErrors(next)
    if (Object.keys(next).length === 0) setStep('details')
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!day || from == null || to == null) return

    const next: Record<string, string> = {}
    if (clientName.trim().length < 2) next.clientName = t.nameError
    if (!phone.trim()) next.phone = t.requiredError
    else if ((phone.match(/\d/g)?.length ?? 0) < 10) next.phone = t.phoneError
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setSubmitting(true)
    setSubmitError(null)
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: boatSlug,
          startAt: slotDate(day, from).toISOString(),
          endAt: slotDate(day, to).toISOString(),
          guests,
          clientName: clientName.trim(),
          phone: phone.trim(),
          telegram: telegram.trim() || undefined,
          comment: comment.trim() || undefined,
          lang,
          website: website || undefined,
          ...readUtmCookie(),
        }),
      })

      if (res.ok) {
        setStep('success')
        return
      }

      const data = await res.json().catch(() => ({}))
      if (res.status === 409 || data.error === 'BOAT_BUSY') {
        setSubmitError({ title: t.busyTitle, text: t.busyText })
        await loadBusy() // слот заняли — перечитываем календарь
        setStep('when')
        setFrom(null)
        setTo(null)
        return
      }
      const rejection = t.rejection[data.error as keyof typeof t.rejection]
      setSubmitError({ title: t.errorTitle, text: rejection ?? t.errorText })
    } catch (err) {
      console.error('[BookingModal] submit failed:', err)
      setSubmitError({ title: t.errorTitle, text: t.errorText })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-md sm:items-center sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={t.title}
    >
      <div
        className="my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:my-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border p-7 pb-6">
          <div>
            <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-foreground">
              {t.title}
            </h3>
            {step !== 'success' && <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t.close}
            className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5"
          >
            <X className="size-4" />
          </button>
        </div>

        {step === 'success' && (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-lg font-medium text-foreground">{t.successTitle}</p>
            <p className="text-sm text-muted-foreground">{t.successText}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              {t.close}
            </button>
          </div>
        )}

        {step === 'when' && (
          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-7">
            {submitError && <ErrorBox title={submitError.title} text={submitError.text} lang={lang} />}

            <Field label={t.boatLabel}>
              <select
                value={boatSlug}
                onChange={(e) => setBoatSlug(e.target.value)}
                className={inputClass(false)}
              >
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name[lang]}
                  </option>
                ))}
              </select>
            </Field>

            <Field label={t.dateLabel} error={errors.day}>
              <BookingCalendar
                lang={lang}
                cursor={cursor}
                onCursorChange={setCursor}
                selected={day}
                onSelect={setDay}
                busy={busy}
                loading={loadingBusy}
                now={now}
              />
            </Field>

            {loadingBusy && (
              <p className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" />
                {t.loadingSlots}
              </p>
            )}

            {dayIsEmpty && (
              <p className="rounded-2xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                {t.noSlots}
              </p>
            )}

            {day && !dayIsEmpty && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Field label={t.timeFromLabel}>
                    <select
                      value={from ?? ''}
                      onChange={(e) => {
                        setFrom(Number(e.target.value))
                        setTo(null)
                      }}
                      className={inputClass(false)}
                    >
                      <option value="" disabled>
                        —
                      </option>
                      {starts.map((o) => (
                        <option key={o.value} value={o.value} disabled={o.disabled}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label={t.timeToLabel}>
                    <select
                      value={to ?? ''}
                      onChange={(e) => setTo(Number(e.target.value))}
                      disabled={from == null}
                      className={inputClass(false)}
                    >
                      <option value="" disabled>
                        —
                      </option>
                      {ends.map((o) => (
                        <option key={o.value} value={o.value} disabled={o.disabled}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>
                <p className="-mt-2 text-[11px] text-muted-foreground">{t.timeNote}</p>
                {errors.time && <p className="-mt-2 text-xs text-destructive">{errors.time}</p>}

                {hours != null && (
                  <div className="flex items-center justify-between rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      <CalendarClock className="size-4 text-primary" />
                      {t.durationLabel}: {hours} {t.hoursShort}
                    </span>
                    <span className="font-medium text-primary">
                      {price != null
                        ? `${price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} ₽`
                        : t.priceOnRequest}
                    </span>
                  </div>
                )}
              </>
            )}

            <button
              type="button"
              onClick={goToDetails}
              className="mt-1 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              {t.next}
            </button>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit} noValidate className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto p-7">
            {submitError && <ErrorBox title={submitError.title} text={submitError.text} lang={lang} />}

            <div className="rounded-2xl border border-border bg-background/40 px-4 py-3 text-sm">
              <p className="font-medium text-foreground">{boat?.name[lang]}</p>
              <p className="mt-0.5 text-muted-foreground">
                {day} · {starts.find((o) => o.value === from)?.label} — {ends.find((o) => o.value === to)?.label}
                {price != null && ` · ${price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')} ₽`}
              </p>
            </div>

            <Field label={`${t.guestsLabel}: ${guests}`}>
              <input
                type="range"
                min={1}
                max={MAX_GUESTS}
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
                className="w-full accent-primary"
              />
            </Field>

            <Field label={t.nameLabel} error={errors.clientName}>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className={inputClass(!!errors.clientName)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.phoneLabel} error={errors.phone}>
                <input
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={inputClass(!!errors.phone)}
                />
              </Field>
              <Field label={t.telegramLabel}>
                <input
                  type="text"
                  placeholder={t.telegramPlaceholder}
                  value={telegram}
                  onChange={(e) => setTelegram(e.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            </div>

            <Field label={t.commentLabel}>
              <textarea
                rows={3}
                placeholder={t.commentPlaceholder}
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className={`${inputClass(false)} resize-none`}
              />
            </Field>

            {/* Honeypot: скрыт от людей, но виден ботам, которые заполняют все поля. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="pointer-events-none absolute -left-[9999px] size-0 opacity-0"
            />

            <div className="mt-1 flex gap-3">
              <button
                type="button"
                onClick={() => setStep('when')}
                className="rounded-full border border-border px-6 py-3.5 text-sm font-medium text-foreground transition-colors hover:bg-foreground/5"
              >
                {t.back}
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
              >
                {submitting ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
                {submitting ? t.submitting : t.submit}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}

function ErrorBox({ title, text, lang }: { title: string; text: string; lang: Lang }) {
  const t = dict[lang].booking
  return (
    <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertCircle className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <p className="mt-0.5 text-destructive/80">{text}</p>
        <a
          href={contacts.telegram}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-2 inline-block font-medium underline underline-offset-2"
        >
          {t.contactManager}
        </a>
      </div>
    </div>
  )
}

function inputClass(invalid: boolean) {
  return `w-full rounded-xl border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-40 ${
    invalid ? 'border-destructive/60' : 'border-border'
  }`
}

function Field({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs uppercase tracking-wide text-muted-foreground">{label}</span>
      {children}
      {error && <span className="text-xs text-destructive">{error}</span>}
    </label>
  )
}
