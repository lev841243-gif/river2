import { Clock, MapPin } from 'lucide-react'
import { Reveal } from './reveal'

const routes = [
  {
    title: 'The Imperial Embankments',
    description:
      'Drift past the Winter Palace and the Hermitage as the façades turn gold. The city reveals itself the way it was always meant to be seen — from the water.',
    image: '/images/route-hermitage.png',
    duration: '2 hours',
    price: 'from €780',
    stops: 'Palace Embankment · Hermitage · Spit',
  },
  {
    title: 'White Nights & Open Bridges',
    description:
      'A midnight cruise timed to the raising of the drawbridges. Stand on deck beneath a sky that never fully darkens and watch the Neva part before you.',
    image: '/images/route-bridges.png',
    duration: '3 hours',
    price: 'from €1,150',
    stops: 'Palace Bridge · Trinity Bridge · Neva',
  },
  {
    title: 'Hidden Canals of the Old City',
    description:
      'Slip through the quiet inner canals toward the domes of the Savior on Spilled Blood — an intimate, unhurried route few ever experience.',
    image: '/images/route-canals.png',
    duration: '1.5 hours',
    price: 'from €560',
    stops: 'Moyka · Griboyedov · Fontanka',
  },
]

export function Routes() {
  return (
    <section id="routes" className="border-t border-border">
      <Reveal className="mx-auto max-w-7xl px-6 pb-4 pt-28 lg:px-10 lg:pt-40">
        <p className="text-xs uppercase tracking-[0.4em] text-primary">Popular routes</p>
        <h2 className="mt-5 max-w-2xl text-balance text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl lg:text-6xl">
          Every route tells a different story
        </h2>
      </Reveal>

      <div className="mt-10 flex flex-col">
        {routes.map((route, i) => (
          <Reveal key={route.title}>
            <article
              className={`group relative flex flex-col overflow-hidden lg:min-h-[560px] lg:flex-row ${
                i % 2 === 1 ? 'lg:flex-row-reverse' : ''
              }`}
            >
              <div className="relative lg:w-3/5">
                <div className="relative h-72 overflow-hidden sm:h-96 lg:h-full">
                  <img
                    src={route.image || '/placeholder.svg'}
                    alt={route.title}
                    loading="lazy"
                    className="size-full object-cover transition-transform duration-[1.6s] ease-out group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent lg:bg-gradient-to-r" />
                </div>
              </div>

              <div className="flex flex-1 flex-col justify-center gap-6 bg-card px-6 py-12 lg:px-16">
                <span className="font-mono text-sm text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-balance text-3xl font-medium leading-tight tracking-tight text-foreground lg:text-4xl">
                  {route.title}
                </h3>
                <p className="max-w-md text-pretty leading-relaxed text-muted-foreground">
                  {route.description}
                </p>

                {/* Route detail chips */}
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground/80">
                    <Clock className="size-4 text-primary" />
                    {route.duration}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm text-foreground/80">
                    <MapPin className="size-4 text-primary" />
                    {route.stops}
                  </span>
                  <span className="rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
                    {route.price}
                  </span>
                </div>
              </div>
            </article>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
