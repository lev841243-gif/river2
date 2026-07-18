import { ArrowUpRight, PenLine, Star } from 'lucide-react'
import { Reveal } from './reveal'
import { contacts, dict, type Lang } from '@/lib/i18n'

export function Testimonials({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].testimonials
  // Ёлочки — русская типографика, в английской версии они смотрятся чужеродно.
  const [open, close] = lang === 'ru' ? ['«', '»'] : ['“', '”']

  return (
    <div className="mx-auto max-w-7xl px-6 pb-28 lg:px-10 lg:pb-40">
      <Reveal className="mb-10 flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="font-[family-name:var(--font-display)] text-3xl text-foreground">
          {t.rating}
        </span>
        <div className="flex gap-1" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, s) => (
            <Star key={s} className="size-4 fill-primary text-primary" />
          ))}
        </div>
        <span className="text-sm text-muted-foreground">{t.ratingCount}</span>
      </Reveal>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {t.reviews.map((review, i) => (
          <Reveal
            key={review.name}
            delay={i * 90}
            className="flex flex-col justify-between gap-8 rounded-3xl border border-border bg-card p-8 lg:p-10"
          >
            <div>
              <div className="flex gap-1" aria-label="5 out of 5 stars">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star key={s} className="size-4 fill-primary text-primary" />
                ))}
              </div>
              <p className="mt-6 text-pretty text-lg leading-relaxed text-foreground/90">
                {open}{review.quote}{close}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Аватарок у авторов на Яндексе нет — рисуем первую букву имени,
                  а не заглушку с чужим лицом. */}
              <span
                aria-hidden="true"
                className="flex size-14 shrink-0 items-center justify-center rounded-full bg-primary/15 font-[family-name:var(--font-display)] text-xl text-primary"
              >
                {[...review.name][0]}
              </span>
              <div>
                <p className="font-medium text-foreground">{review.name}</p>
                <p className="text-sm text-muted-foreground">{review.date}</p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>

      <Reveal className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
        <a
          href={contacts.yandexReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
        >
          <PenLine className="size-4" />
          {t.writeReview}
        </a>
        <a
          href={contacts.yandexReviews}
          target="_blank"
          rel="noopener noreferrer"
          className="group inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-8 py-4 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-foreground/10"
        >
          {t.allReviews}
          <ArrowUpRight className="size-4 text-primary transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </a>
      </Reveal>
    </div>
  )
}
