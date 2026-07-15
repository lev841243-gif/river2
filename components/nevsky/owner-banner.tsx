import { BadgeCheck } from 'lucide-react'
import { dict, type Lang } from '@/lib/i18n'

export function OwnerBanner({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].owner

  return (
    <section className="border-y border-primary/25 bg-[color:var(--navy)]/40">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-6 py-8 text-center lg:flex-row lg:justify-between lg:gap-10 lg:px-10 lg:text-left">
        <p className="max-w-2xl text-pretty text-lg leading-relaxed text-foreground">
          <span className="font-[family-name:var(--font-display)] font-semibold text-primary">
            {t.highlight}
          </span>{' '}
          {t.line}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {t.points.map((point) => (
            <span
              key={point}
              className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-medium text-primary"
            >
              <BadgeCheck className="size-4" />
              {point}
            </span>
          ))}
        </div>
      </div>
    </section>
  )
}
