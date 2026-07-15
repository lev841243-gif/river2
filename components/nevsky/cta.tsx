'use client'

import { ArrowRight, MessageCircle, Phone, Send } from 'lucide-react'
import { Reveal } from './reveal'
import { useBooking } from './booking-context'
import { contacts, dict, type Lang } from '@/lib/i18n'

export function Cta({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].cta
  const c = dict[lang].contact
  const { openBooking } = useBooking()

  return (
    <section id="cta" className="relative flex min-h-[80svh] items-center overflow-hidden">
      <div className="absolute inset-0 -z-10">
        <img
          src="/images/cta-evening.png"
          alt="Пара любуется закатом с палубы катера на Неве"
          className="size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/40" />
      </div>

      <div className="mx-auto w-full max-w-7xl px-6 py-28 lg:px-10">
        <Reveal className="max-w-3xl">
          <p className="text-xs uppercase tracking-[0.4em] text-primary">{t.eyebrow}</p>
          <h2 className="mt-6 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            {t.title}
          </h2>
          <p className="mt-7 max-w-xl text-pretty text-lg leading-relaxed text-foreground/75">
            {t.subtitle}
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => openBooking()}
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
            >
              <Send className="size-4" />
              {t.primary}
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </button>
            <a
              href={contacts.phoneHref}
              aria-label={c.callAdmin}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-8 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              <Phone className="size-4 text-primary" />
              {c.call}
            </a>
          </div>

          {/* Связь с менеджером — не канал брони, а живой контакт для вопросов. */}
          <p className="mt-8 text-sm text-foreground/60">{c.managerNote}</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <a
              href={contacts.telegram}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-5 py-2.5 text-sm text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              <Send className="size-4 text-primary" />
              {c.telegram}
            </a>
            <a
              href={contacts.whatsapp}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-foreground/5 px-5 py-2.5 text-sm text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
            >
              <MessageCircle className="size-4 text-primary" />
              {c.whatsapp}
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  )
}
