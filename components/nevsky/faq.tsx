'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Reveal } from './reveal'
import { dict, type Lang } from '@/lib/i18n'

export function Faq({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].faq
  const [open, setOpen] = useState<number | null>(0)

  return (
    <section id="faq" className="border-t border-border">
      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-14 px-6 py-28 lg:grid-cols-[0.8fr_1.2fr] lg:px-10 lg:py-40">
        <Reveal>
          <p className="text-xs uppercase tracking-[0.4em] text-primary">{t.eyebrow}</p>
          <h2 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-tight tracking-tight text-foreground sm:text-5xl">
            {t.title}
          </h2>
          <p className="mt-6 max-w-sm text-pretty leading-relaxed text-muted-foreground">
            {t.subtitle}
          </p>
        </Reveal>

        <Reveal className="flex flex-col gap-4">
          {t.items.map((faq, i) => {
            const isOpen = open === i
            return (
              <div
                key={faq.q}
                className={cn(
                  'rounded-3xl border border-border bg-card transition-colors duration-300',
                  isOpen && 'bg-card',
                )}
              >
                <button
                  type="button"
                  onClick={() => setOpen(isOpen ? null : i)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-7 py-6 text-left"
                >
                  <span className="text-pretty text-lg font-medium text-foreground">
                    {faq.q}
                  </span>
                  <Plus
                    className={cn(
                      'size-5 shrink-0 text-primary transition-transform duration-300',
                      isOpen && 'rotate-45',
                    )}
                  />
                </button>
                <div
                  className={cn(
                    'grid overflow-hidden transition-all duration-500 ease-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                  )}
                >
                  <div className="overflow-hidden">
                    <p className="px-7 pb-7 text-pretty leading-relaxed text-muted-foreground">
                      {faq.a}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </Reveal>
      </div>
    </section>
  )
}
