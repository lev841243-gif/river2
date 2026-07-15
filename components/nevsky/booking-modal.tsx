'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2, Send, X } from 'lucide-react'
import { contacts, dict, type Boat, type Lang } from '@/lib/i18n'
import { readUtmCookie } from '@/lib/utm'

interface FormState {
  boatId: string
  date: string
  time: string
  guests: number
  clientName: string
  phone: string
  telegram: string
  comment: string
}

type FieldErrors = Partial<Record<'boatId' | 'date' | 'time' | 'clientName' | 'phone', string>>

function todayISODate() {
  const d = new Date()
  const offset = d.getTimezoneOffset()
  return new Date(d.getTime() - offset * 60_000).toISOString().slice(0, 10)
}

const PHONE_RE = /^[+\d][\d\s\-()]{9,}$/

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

  const [form, setForm] = useState<FormState>({
    boatId: initialBoatId ?? boats[0]?.id ?? '',
    date: '',
    time: '',
    guests: 2,
    clientName: '',
    phone: '',
    telegram: '',
    comment: '',
  })
  const [errors, setErrors] = useState<FieldErrors>({})
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  function validate(): FieldErrors {
    const next: FieldErrors = {}
    if (!form.boatId) next.boatId = t.requiredError
    if (!form.date) next.date = t.requiredError
    if (!form.time) next.time = t.requiredError
    if (!form.clientName.trim()) next.clientName = t.requiredError
    if (!form.phone.trim()) next.phone = t.requiredError
    else if (!PHONE_RE.test(form.phone.trim())) next.phone = t.phoneError
    return next
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const next = validate()
    setErrors(next)
    if (Object.keys(next).length > 0) return

    setStatus('submitting')
    const utm = readUtmCookie()
    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          boatId: form.boatId,
          startAt: new Date(`${form.date}T${form.time}`).toISOString(),
          guests: form.guests,
          clientName: form.clientName.trim(),
          phone: form.phone.trim(),
          telegram: form.telegram.trim() || undefined,
          comment: form.comment.trim() || undefined,
          lang,
          ...utm,
        }),
      })
      if (!res.ok) throw new Error(`Request failed: ${res.status}`)
      setStatus('success')
    } catch (err) {
      console.error('[BookingModal] submit failed:', err)
      setStatus('error')
    }
  }

  const selectedBoat = boats.find((b) => b.id === form.boatId)

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
            <p className="mt-1.5 text-sm text-muted-foreground">{t.subtitle}</p>
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

        {status === 'success' ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <CheckCircle2 className="size-10 text-primary" />
            <p className="text-lg font-medium text-foreground">{t.successTitle}</p>
            <p className="text-sm text-muted-foreground">{t.successText}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 inline-flex items-center justify-center rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              {t.close}
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5 p-7">
            <Field label={t.boatLabel} error={errors.boatId}>
              <select
                value={form.boatId}
                onChange={(e) => set('boatId', e.target.value)}
                className={inputClass(!!errors.boatId)}
              >
                {!selectedBoat && (
                  <option value="" disabled>
                    {t.boatPlaceholder}
                  </option>
                )}
                {boats.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name[lang]}
                  </option>
                ))}
              </select>
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.dateLabel} error={errors.date}>
                <input
                  type="date"
                  min={todayISODate()}
                  value={form.date}
                  onChange={(e) => set('date', e.target.value)}
                  className={inputClass(!!errors.date)}
                />
              </Field>
              <Field label={t.timeLabel} error={errors.time}>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => set('time', e.target.value)}
                  className={inputClass(!!errors.time)}
                />
              </Field>
            </div>

            <Field label={`${t.guestsLabel}: ${form.guests}`}>
              <input
                type="range"
                min={1}
                max={20}
                value={form.guests}
                onChange={(e) => set('guests', Number(e.target.value))}
                className="w-full accent-primary"
              />
            </Field>

            <Field label={t.nameLabel} error={errors.clientName}>
              <input
                type="text"
                placeholder={t.namePlaceholder}
                value={form.clientName}
                onChange={(e) => set('clientName', e.target.value)}
                className={inputClass(!!errors.clientName)}
              />
            </Field>

            <div className="grid grid-cols-2 gap-4">
              <Field label={t.phoneLabel} error={errors.phone}>
                <input
                  type="tel"
                  placeholder={t.phonePlaceholder}
                  value={form.phone}
                  onChange={(e) => set('phone', e.target.value)}
                  className={inputClass(!!errors.phone)}
                />
              </Field>
              <Field label={t.telegramLabel}>
                <input
                  type="text"
                  placeholder={t.telegramPlaceholder}
                  value={form.telegram}
                  onChange={(e) => set('telegram', e.target.value)}
                  className={inputClass(false)}
                />
              </Field>
            </div>

            <Field label={t.commentLabel}>
              <textarea
                rows={3}
                placeholder={t.commentPlaceholder}
                value={form.comment}
                onChange={(e) => set('comment', e.target.value)}
                className={`${inputClass(false)} resize-none`}
              />
            </Field>

            {status === 'error' && (
              <div className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
                <AlertCircle className="mt-0.5 size-4 shrink-0" />
                <div>
                  <p className="font-medium">{t.errorTitle}</p>
                  <p className="mt-0.5 text-destructive/80">{t.errorText}</p>
                  <a
                    href={contacts.telegram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block font-medium underline underline-offset-2"
                  >
                    {t.errorFallback}
                  </a>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={status === 'submitting'}
              className="mt-1 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03] disabled:pointer-events-none disabled:opacity-60"
            >
              {status === 'submitting' ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
              {status === 'submitting' ? t.submitting : t.submit}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

function inputClass(invalid: boolean) {
  return `w-full rounded-xl border bg-background/40 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
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
