import { Anchor, Award, BadgeCheck, Compass, Sparkles } from 'lucide-react'
import { Reveal } from './reveal'
import { dict, type Lang } from '@/lib/i18n'

const icons = [Compass, Anchor, BadgeCheck, Award, Sparkles]

export function WhyUs({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].why

  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">{t.eyebrow}</p>
        <h2 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          {t.title}
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {t.reasons.map((reason, i) => {
          const Icon = icons[i] ?? Sparkles
          return (
            <Reveal
              key={reason.title}
              delay={i * 70}
              className="flex flex-col gap-5 bg-card p-8 lg:p-10"
            >
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                <Icon className="size-6" />
              </span>
              <div>
                <h3 className="text-lg font-medium text-foreground">{reason.title}</h3>
                <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                  {reason.text}
                </p>
              </div>
            </Reveal>
          )
        })}

        <Reveal
          delay={350}
          className="flex flex-col justify-center gap-2 bg-[color:var(--navy)] p-8 lg:p-10"
        >
          <span className="font-[family-name:var(--font-display)] text-4xl font-medium tracking-tight text-primary lg:text-5xl">
            {t.rating}
          </span>
          <p className="text-pretty leading-relaxed text-foreground/70">{t.ratingText}</p>
        </Reveal>
      </div>
    </section>
  )
}
