import { ArrowRight, Compass, MapPin } from 'lucide-react'
import { Reveal } from './reveal'
import { contacts, dict, type Lang } from '@/lib/i18n'

export function Expeditions({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].expeditions

  return (
    <section id="trips" className="border-t border-border bg-[color:var(--navy)]/25">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-28 lg:grid-cols-[0.85fr_1.15fr] lg:px-10 lg:py-40">
        <Reveal>
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-primary">
            <Compass className="size-4" />
            {t.eyebrow}
          </p>
          <h2 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {t.title}
          </h2>
          <p className="mt-6 max-w-md text-pretty text-lg leading-relaxed text-muted-foreground">
            {t.subtitle}
          </p>
          <p className="mt-8 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm text-primary">
            {t.note}
          </p>
          <div className="mt-8">
            <a
              href={contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              {t.cta}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
          </div>
        </Reveal>

        <Reveal className="lg:pt-4">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {t.items.map((place, i) => (
              <li
                key={place}
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card px-5 py-4 transition-colors duration-300 hover:border-primary/40"
              >
                <span className="font-[family-name:var(--font-display)] text-sm text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <MapPin className="size-4 shrink-0 text-primary" />
                <span className="text-foreground transition-colors group-hover:text-primary">
                  {place}
                </span>
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  )
}
