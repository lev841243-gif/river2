'use client'

import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { contacts, dict, type Lang } from '@/lib/i18n'

function LangSwitch({ lang, className }: { lang: Lang; className?: string }) {
  return (
    <div className={cn('flex items-center gap-1 text-xs font-medium tracking-wide', className)}>
      <a
        href="/"
        aria-current={lang === 'ru' ? 'page' : undefined}
        className={cn(
          'rounded-full px-2.5 py-1 transition-colors',
          lang === 'ru' ? 'bg-primary/15 text-primary' : 'text-foreground/50 hover:text-foreground',
        )}
      >
        RU
      </a>
      <span className="text-foreground/20">/</span>
      <a
        href="/en"
        aria-current={lang === 'en' ? 'page' : undefined}
        className={cn(
          'rounded-full px-2.5 py-1 transition-colors',
          lang === 'en' ? 'bg-primary/15 text-primary' : 'text-foreground/50 hover:text-foreground',
        )}
      >
        EN
      </a>
    </div>
  )
}

export function SiteNav({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].nav
  const c = dict[lang].contact
  const brand = dict[lang].brand
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-all duration-500',
        scrolled
          ? 'border-b border-border bg-background/70 backdrop-blur-xl'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <a href="#top" className="flex items-baseline gap-2">
          <span className="font-[family-name:var(--font-display)] text-sm font-semibold uppercase tracking-[0.12em] text-foreground sm:text-base">
            {brand.wordmark}
          </span>
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-primary sm:inline">
            {brand.tagline}
          </span>
        </a>

        <div className="hidden items-center gap-9 lg:flex">
          {t.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 lg:flex">
          <LangSwitch lang={lang} />
          <a
            href={contacts.phoneHref}
            aria-label={c.callAdmin}
            title={c.callAdmin}
            className="flex size-10 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-foreground/5"
          >
            <Phone className="size-4" />
          </a>
          <a
            href="#fleet"
            className="rounded-full bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
          >
            {t.cta}
          </a>
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LangSwitch lang={lang} />
          <a
            href={contacts.phoneHref}
            aria-label={c.callAdmin}
            className="flex size-10 items-center justify-center rounded-full border border-border text-primary transition-colors hover:bg-foreground/5"
          >
            <Phone className="size-4" />
          </a>
          <button
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="relative flex size-10 items-center justify-center rounded-full border border-border text-foreground"
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-border bg-background/95 backdrop-blur-xl transition-[max-height,opacity] duration-500 lg:hidden',
          open ? 'max-h-96 border-t opacity-100' : 'max-h-0 opacity-0',
        )}
      >
        <div className="flex flex-col gap-1 px-6 py-4">
          {t.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="rounded-xl px-3 py-3 text-base text-foreground/80 transition-colors hover:bg-muted hover:text-foreground"
            >
              {link.label}
            </a>
          ))}
          <a
            href="#fleet"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-primary px-6 py-3 text-center text-sm font-medium text-primary-foreground"
          >
            {t.cta}
          </a>
        </div>
      </div>
    </header>
  )
}
