import { Anchor, Award, BadgeCheck, Compass, Sparkles } from 'lucide-react'
import { Reveal } from './reveal'

const reasons = [
  {
    icon: Compass,
    title: 'Professional Captains',
    text: 'Licensed, seasoned and quietly attentive — they know every current and every view.',
  },
  {
    icon: Anchor,
    title: 'Modern Fleet',
    text: 'Impeccably maintained yachts, refreshed each season for comfort and safety.',
  },
  {
    icon: BadgeCheck,
    title: 'Licensed Company',
    text: 'Fully certified and insured, so your only concern is the sunset.',
  },
  {
    icon: Award,
    title: '10+ Years Experience',
    text: 'Thousands of unforgettable evenings crafted along the Neva River.',
  },
  {
    icon: Sparkles,
    title: 'Premium Service',
    text: 'Champagne, flowers, music, catering — every detail arranged before you arrive.',
  },
]

export function WhyUs() {
  return (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
      <Reveal className="max-w-2xl">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Why Nevsky</p>
        <h2 className="mt-5 text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Details you feel, never see
        </h2>
      </Reveal>

      <div className="mt-14 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map((reason, i) => (
          <Reveal
            key={reason.title}
            delay={i * 70}
            className="flex flex-col gap-5 bg-card p-8 lg:p-10"
          >
            <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <reason.icon className="size-6" />
            </span>
            <div>
              <h3 className="text-lg font-medium text-foreground">{reason.title}</h3>
              <p className="mt-2 text-pretty leading-relaxed text-muted-foreground">
                {reason.text}
              </p>
            </div>
          </Reveal>
        ))}

        <Reveal
          delay={350}
          className="flex flex-col justify-center gap-2 bg-[color:var(--navy)] p-8 lg:p-10"
        >
          <span className="text-4xl font-medium tracking-tight text-primary lg:text-5xl">
            4.9
          </span>
          <p className="text-pretty leading-relaxed text-foreground/70">
            Average guest rating across 1,200+ private cruises.
          </p>
        </Reveal>
      </div>
    </section>
  )
}
