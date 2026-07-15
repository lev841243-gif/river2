import { Reveal } from './reveal'
import { dict, type Lang } from '@/lib/i18n'

export function Experiences({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].experiences

  return (
    <section id="experiences" className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">{t.eyebrow}</p>
        <h2 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t.title}
        </h2>
        <p className="mt-6 text-pretty text-lg leading-relaxed text-muted-foreground">
          {t.subtitle}
        </p>
      </Reveal>

      <div className="mt-14 grid auto-rows-[220px] grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
        {t.items.map((exp, i) => (
          <Reveal
            key={exp.title}
            delay={i * 70}
            className={`group relative overflow-hidden rounded-3xl ${exp.span}`}
          >
            <img
              src={exp.image || '/placeholder.svg'}
              alt={exp.title}
              loading="lazy"
              className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent transition-opacity duration-500 group-hover:from-background/95" />
            <div className="absolute inset-x-0 bottom-0 p-6">
              <p className="text-[11px] uppercase tracking-[0.25em] text-primary opacity-0 transition-all duration-500 group-hover:opacity-100">
                {exp.caption}
              </p>
              <h3 className="mt-1 text-pretty text-xl font-medium leading-snug text-foreground lg:text-2xl">
                {exp.title}
              </h3>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
