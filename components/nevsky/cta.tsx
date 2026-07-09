import { ArrowRight } from 'lucide-react'
import { Reveal } from './reveal'

export function Cta() {
  return (
    <section id="cta" className="relative flex min-h-[80svh] items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/cta-evening.png"
          alt="A couple watching the sunset from the deck of a luxury boat on the Neva River"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">Your evening awaits</p>
          <h2 className="mt-6 text-balance text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Ready for an unforgettable evening?
          </h2>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-foreground/75">
            Tell us the feeling you are after. We will take care of everything
            else — from the first pour of champagne to the last raised bridge.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a
              href="#fleet"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              Book a Boat
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </a>
            <a
              href="#footer"
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-8 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              Contact Us
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
