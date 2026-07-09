import { ArrowRight } from 'lucide-react'

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Background image with slow cinematic zoom */}
      <div className="absolute inset-0 z-0">
        <img
          src="/images/hero-neva.png"
          alt="A luxury yacht cruising the Neva River in Saint Petersburg at sunset with a raised drawbridge"
          className="size-full animate-[heroZoom_18s_ease-out_forwards] object-cover"
        />
        {/* Cinematic overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-background/60" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 to-transparent" />
      </div>

      <div className="relative z-10 mx-auto w-full max-w-7xl px-6 pb-24 pt-40 lg:px-10">
        <div className="max-w-3xl">
          <p className="mb-6 animate-[fadeUp_1s_ease-out_both] text-xs uppercase tracking-[0.4em] text-primary [animation-delay:200ms]">
            Private cruises on the Neva
          </p>
          <h1 className="text-balance text-5xl font-medium leading-[1.02] tracking-tight text-foreground animate-[fadeUp_1.1s_ease-out_both] [animation-delay:350ms] sm:text-6xl lg:text-8xl">
            Experience Saint Petersburg from the Water
          </h1>
          <p className="mt-8 max-w-xl text-pretty text-lg leading-relaxed text-foreground/70 animate-[fadeUp_1.1s_ease-out_both] [animation-delay:600ms]">
            Private luxury boat tours with professional captains. An evening on
            the river that stays with you long after you step ashore.
          </p>

          <div className="mt-10 flex flex-col gap-4 animate-[fadeUp_1.1s_ease-out_both] [animation-delay:800ms] sm:flex-row sm:items-center">
            <a
              href="#fleet"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              Choose Your Boat
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#fleet"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-8 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              View Fleet
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
