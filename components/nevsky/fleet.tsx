'use client'

import { useEffect, useState } from 'react'
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gauge,
  Maximize2,
  Moon,
  Ruler,
  Users,
  X,
} from 'lucide-react'
import { Reveal } from './reveal'
import { useBooking } from './booking-context'
import { boatImg, dict, type Boat, type Lang } from '@/lib/i18n'

function priceLabel(boat: Boat, lang: Lang, t: (typeof dict)['ru']['fleet']) {
  if (boat.price == null) return t.onRequest
  const from = lang === 'ru' ? 'от' : 'from'
  const n = boat.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')
  return `${from} ${n} ${t.perHour}`
}

const specIcons = [Ruler, Maximize2, Maximize2, Gauge, Users]

export function Fleet({ lang = 'ru', boats }: { lang?: Lang; boats: Boat[] }) {
  const t = dict[lang].fleet
  const { openBooking } = useBooking()
  const [active, setActive] = useState<number | null>(null)
  const [photo, setPhoto] = useState(0)

  const boat = active != null ? boats[active] : null

  /**
   * Галерея = обложка + остальные фото. Раньше обложка в галерею не входила:
   * кликаешь на фото карточки, а открывается совсем другое — выглядело как сбой.
   * Дублей не будет: ни у одной лодки обложка не повторяет галерейное фото.
   */
  const gallery = boat ? [boat.cover, ...boat.photos] : []

  useEffect(() => {
    if (active == null) return
    setPhoto(0)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(null)
      if (boat) {
        const n = boat.photos.length + 1
        if (e.key === 'ArrowRight') setPhoto((p) => (p + 1) % n)
        if (e.key === 'ArrowLeft') setPhoto((p) => (p - 1 + n) % n)
      }
    }
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [active, boat])

  return (
    <section id="fleet" className="border-t border-border bg-[color:var(--navy)]/25">
      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">{t.eyebrow}</p>
            <h2 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              {t.title}
            </h2>
          </div>
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            {t.subtitle}
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {boats.map((b, i) => (
            <Reveal
              key={b.id}
              delay={(i % 3) * 90}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-500 hover:-translate-y-2"
            >
              <button
                type="button"
                onClick={() => setActive(i)}
                className="relative aspect-[4/3] overflow-hidden text-left"
                aria-label={`${t.details}: ${b.name[lang]}`}
              >
                <img
                  src={boatImg(b.dir, b.cover)}
                  alt={b.name[lang]}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
                {/* Левый верхний угол: корона флагмана, следом вместимость — одним рядом, чтобы не наезжали. */}
                <div className="absolute left-4 top-4 flex items-center gap-2">
                  {b.premium && (
                    <span
                      title={t.premium}
                      aria-label={t.premium}
                      className="flex size-8 items-center justify-center rounded-full bg-background/70 ring-1 ring-primary/50 backdrop-blur-md"
                    >
                      <Crown className="size-4 text-primary" />
                    </span>
                  )}
                  {b.specs && b.specs[lang][4] !== '—' && (
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-xs text-foreground backdrop-blur-md">
                      <Users className="size-3.5 text-primary" />
                      {b.specs[lang][4]}
                    </span>
                  )}
                </div>
                {b.isNew && (
                  <span className="absolute right-4 top-4 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-primary-foreground">
                    {t.isNew}
                  </span>
                )}
                {b.badge && (
                  <span className="absolute right-4 top-4 inline-flex -rotate-3 items-center rounded-full bg-gradient-to-r from-primary to-[#e0c485] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30">
                    {b.badge[lang]}
                  </span>
                )}
              </button>

              <div className="flex flex-1 flex-col p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-foreground">
                    {b.name[lang]}
                  </h3>
                  <span className="shrink-0 text-sm text-primary">{priceLabel(b, lang, t)}</span>
                </div>
                <p className="mt-3 flex-1 text-pretty leading-relaxed text-muted-foreground">
                  {b.desc[lang]}
                </p>

                <div className="mt-7 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => openBooking(b.id)}
                    className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
                  >
                    {t.book}
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-foreground/5"
                  >
                    {t.details}
                  </button>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>

      {/* Detail modal */}
      {boat && (
        <div
          className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-background/80 p-4 backdrop-blur-md sm:items-center sm:p-6"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
          aria-label={boat.name[lang]}
        >
          <div
            className="my-8 w-full max-w-4xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gallery */}
            <div className="relative aspect-[16/10] overflow-hidden bg-background">
              {/* Размытая подложка: у части лодок фото вертикальные, и object-contain
                  оставлял бы по бокам пустоту. Так поля выглядят задуманными. */}
              <img
                src={boatImg(boat.dir, gallery[photo])}
                alt=""
                aria-hidden="true"
                className="absolute inset-0 size-full scale-110 object-cover opacity-40 blur-2xl"
              />
              <img
                src={boatImg(boat.dir, gallery[photo])}
                alt={`${boat.name[lang]} — ${photo + 1}`}
                className="relative size-full object-contain"
              />
              <button
                type="button"
                onClick={() => setActive(null)}
                aria-label={t.close}
                className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-background/70 text-foreground backdrop-blur-md transition-colors hover:bg-background"
              >
                <X className="size-5" />
              </button>

              {gallery.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setPhoto((p) => (p - 1 + gallery.length) % gallery.length)}
                    aria-label="prev"
                    className="absolute left-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background"
                  >
                    <ChevronLeft className="size-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhoto((p) => (p + 1) % gallery.length)}
                    aria-label="next"
                    className="absolute right-4 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-background/60 text-foreground backdrop-blur-md transition-colors hover:bg-background"
                  >
                    <ChevronRight className="size-6" />
                  </button>
                  <div className="absolute inset-x-0 bottom-4 flex justify-center gap-2">
                    {gallery.map((_, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setPhoto(idx)}
                        aria-label={`${idx + 1}`}
                        className={`h-1.5 rounded-full transition-all ${
                          idx === photo ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/40'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
              {boat.premium && (
                <span
                  title={t.premium}
                  aria-label={t.premium}
                  className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full bg-background/70 ring-1 ring-primary/50 backdrop-blur-md"
                >
                  <Crown className="size-4 text-primary" />
                </span>
              )}
              {boat.badge && (
                <span className="absolute left-4 top-4 inline-flex -rotate-3 items-center rounded-full bg-gradient-to-r from-primary to-[#e0c485] px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30">
                  {boat.badge[lang]}
                </span>
              )}
              {boat.isNew && (
                <span className="absolute left-4 top-4 inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-xs font-medium uppercase tracking-wide text-primary-foreground">
                  {t.isNew}
                </span>
              )}
            </div>

            {/* Body */}
            <div className="max-h-[60vh] overflow-y-auto p-7 lg:p-10">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-baseline sm:justify-between">
                <h3 className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-foreground">
                  {boat.name[lang]}
                </h3>
                <span className="text-lg text-primary">{priceLabel(boat, lang, t)}</span>
              </div>
              <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Moon className="size-4 text-primary" />
                {t.captainOnly}
              </p>

              <p className="mt-5 text-pretty leading-relaxed text-foreground/80">
                {boat.desc[lang]}
              </p>

              {boat.specs ? (
                <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
                  {boat.specs[lang].map((value, idx) => {
                    if (value === '—') return null
                    const Icon = specIcons[idx]
                    return (
                      <div
                        key={idx}
                        className="flex flex-col gap-1.5 rounded-2xl border border-border bg-background/40 p-4"
                      >
                        <Icon className="size-4 text-primary" />
                        <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                          {t.specLabels[idx]}
                        </span>
                        <span className="text-sm font-medium text-foreground">{value}</span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <p className="mt-8 rounded-2xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
                  {t.specsOnRequest}
                </p>
              )}

              {boat.amenities[lang].length > 0 && (
                <div className="mt-8">
                  <p className="text-xs uppercase tracking-[0.3em] text-primary">
                    {t.amenitiesTitle}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2.5">
                    {boat.amenities[lang].map((a) => (
                      <span
                        key={a}
                        className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground/80"
                      >
                        {a}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8">
                <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.extrasTitle}</p>
                <div className="mt-4 flex flex-wrap gap-2.5">
                  {t.extras.map((extra) => (
                    <span
                      key={extra}
                      className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm text-primary"
                    >
                      {extra}
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  setActive(null)
                  openBooking(boat.id)
                }}
                className="mt-9 inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
              >
                {t.bookThis}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
