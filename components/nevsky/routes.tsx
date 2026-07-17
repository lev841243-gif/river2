import { Clock, MapPin } from 'lucide-react'
import { Reveal } from './reveal'
import { dict, type Lang } from '@/lib/i18n'

export function Routes({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].routes

  return (
    <div className="flex flex-col">
        {t.items.map((route, i) => (
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
                <span className="font-[family-name:var(--font-display)] text-sm text-primary">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="text-balance font-[family-name:var(--font-display)] text-3xl font-medium leading-tight tracking-tight text-foreground lg:text-4xl">
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
  )
}
