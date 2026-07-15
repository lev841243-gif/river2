import { ArrowRight } from 'lucide-react'
import { dict, type Lang } from '@/lib/i18n'

export function Hero({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].hero

  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background image with slow, continuous cinematic drift */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-neva.png"
          alt="Роскошный катер на Неве в Санкт-Петербурге на закате с разведённым мостом"
          className="hero-motion size-full object-cover"
        />
        {/* Cinematic overlays — light, so the photo/mini-video stays the hero */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/50 via-background/5 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-40 lg:px-10">
        <div className="max-w-md">
          <p className="mb-4 animate-[fadeUp_1s_ease-out_both] text-[15px] uppercase tracking-[0.3em] text-primary [animation-delay:200ms]">
            {t.eyebrow}
          </p>
          <h1 className="text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.1] tracking-tight text-foreground animate-[fadeUp_1.1s_ease-out_both] [animation-delay:350ms] sm:text-5xl">
            {t.title}
          </h1>
          <p className="mt-5 max-w-sm text-pretty text-xl leading-relaxed text-foreground/70 animate-[fadeUp_1.1s_ease-out_both] [animation-delay:600ms]">
            {t.subtitle}
          </p>

          <div className="mt-8 flex flex-col gap-3 animate-[fadeUp_1.1s_ease-out_both] [animation-delay:800ms] sm:flex-row sm:items-center">
            <a
              href="#fleet"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              {t.primary}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#fleet"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-7 py-3.5 text-sm font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              {t.secondary}
            </a>
          </div>
        </div>
      </div>

      {/* Scroll cue */}
      <div className="absolute inset-x-0 bottom-8 flex justify-center">
        <div className="flex h-11 w-6 items-start justify-center rounded-full border border-foreground/30 p-1.5">
          <span className="h-2 w-1 animate-[scrollCue_1.8s_ease-in-out_infinite] rounded-full bg-primary" />
        </div>
      </div>
    </section>
  )
}
