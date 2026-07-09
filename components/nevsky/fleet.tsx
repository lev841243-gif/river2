import { ArrowRight, Users } from 'lucide-react'
import { Reveal } from './reveal'

const boats = [
  {
    name: 'Aurora',
    image: '/images/boat-aurora.png',
    passengers: 'Up to 12 guests',
    price: 'from €390 / hour',
    description:
      'A sleek modern motor yacht with a warm teak deck — our signature choice for intimate evenings.',
  },
  {
    name: 'Imperial',
    image: '/images/boat-imperial.png',
    passengers: 'Up to 8 guests',
    price: 'from €340 / hour',
    description:
      'A timeless mahogany cruiser with brass details and lantern light for slow, romantic canal drifts.',
  },
  {
    name: 'Lumière',
    image: '/images/boat-lumiere.png',
    passengers: 'Up to 30 guests',
    price: 'from €650 / hour',
    description:
      'A panoramic glass lounge yacht built for celebrations, corporate nights and grand occasions.',
  },
]

export function Fleet() {
  return (
    <section id="fleet" className="border-t border-border bg-[color:var(--navy)]/25">
      <div className="mx-auto max-w-7xl px-6 py-28 lg:px-10 lg:py-40">
        <Reveal className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="text-xs uppercase tracking-[0.4em] text-primary">The fleet</p>
            <h2 className="mt-5 text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Vessels chosen for their soul
            </h2>
          </div>
          <p className="max-w-sm text-pretty leading-relaxed text-muted-foreground">
            Every boat in our collection is privately maintained, discreetly
            crewed and ready for a flawless night on the Neva.
          </p>
        </Reveal>

        <div className="mt-16 grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {boats.map((boat, i) => (
            <Reveal
              key={boat.name}
              delay={i * 90}
              className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-500 hover:-translate-y-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden">
                <img
                  src={boat.image || '/placeholder.svg'}
                  alt={`${boat.name} luxury boat`}
                  loading="lazy"
                  className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                />
                <span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-background/70 px-3 py-1.5 text-xs text-foreground backdrop-blur-md">
                  <Users className="size-3.5 text-primary" />
                  {boat.passengers}
                </span>
              </div>

              <div className="flex flex-1 flex-col p-7">
                <div className="flex items-baseline justify-between gap-4">
                  <h3 className="text-2xl font-medium tracking-tight text-foreground">
                    {boat.name}
                  </h3>
                  <span className="text-sm text-primary">{boat.price}</span>
                </div>
                <p className="mt-3 flex-1 text-pretty leading-relaxed text-muted-foreground">
                  {boat.description}
                </p>

                <div className="mt-7 flex items-center gap-3">
                  <a
                    href="#cta"
                    className="group/btn inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
                  >
                    Book Now
                    <ArrowRight className="size-4 transition-transform duration-300 group-hover/btn:translate-x-1" />
                  </a>
                  <a
                    href="#cta"
                    className="inline-flex items-center justify-center rounded-full border border-border px-5 py-3 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-foreground/5"
                  >
                    View Details
                  </a>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
