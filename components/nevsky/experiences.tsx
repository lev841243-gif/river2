import { ArrowUpRight } from 'lucide-react'
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
            {/* Внутренняя обёртка отвечает за press-эффект (scale при тапе).
                Своя быстрая transition-transform не мешает reveal-анимации
                внешнего .reveal (у него transform на 1s для въезда снизу).
                Сжатие включаем только у кликабельных плиток — через group-active
                (:active всплывает от ссылки к группе-родителю, работает и на тапе). */}
            <div
              className={`relative size-full transition-transform duration-200 ease-out ${
                exp.href ? 'group-active:scale-[0.97]' : ''
              }`}
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
              {/* У тем с готовой посадочной страницей плитка — ссылка на неё
                  (растянутый оверлей-линк) + значок-стрелка как подсказка.
                  Гасим серый тап-хайлайт iOS — press-эффект даёт своё сжатие. */}
              {exp.href && (
                <>
                  <span className="absolute right-5 top-5 flex size-9 items-center justify-center rounded-full bg-background/60 text-primary opacity-0 backdrop-blur-md transition-opacity duration-500 group-hover:opacity-100">
                    <ArrowUpRight className="size-4" />
                  </span>
                  <a
                    href={exp.href}
                    aria-label={exp.title}
                    className="absolute inset-0 z-10 [-webkit-tap-highlight-color:transparent]"
                  />
                </>
              )}
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  )
}
