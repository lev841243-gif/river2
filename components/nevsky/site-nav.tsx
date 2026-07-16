'use client'

import { useEffect, useState } from 'react'
import { Menu, Phone, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { SocialRow } from './social-row'
import { contacts, dict, type Lang } from '@/lib/i18n'

/**
 * Кнопка звонка. Заметно крупнее соседей и «звонит»: от неё расходятся два
 * круга, а трубка периодически вздрагивает. Цикл 2 секунды — полторы паузы
 * и короткая тряска, как у настоящего звонка.
 */
function CallButton({ label }: { label: string }) {
  return (
    <a
      href={contacts.phoneHref}
      aria-label={label}
      title={label}
      // touch-manipulation убирает задержку 300мс на тап в мобильных браузерах.
      className="phone-shake group relative flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-full bg-primary/15 text-primary ring-1 ring-primary/40 transition-colors duration-300 hover:bg-primary hover:text-primary-foreground"
    >
      {/* Круги-волны: pointer-events-none, иначе перехватывали бы тап по трубке. */}
      <span
        aria-hidden="true"
        className="phone-pulse pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/60"
      />
      <span
        aria-hidden="true"
        style={{ '--pulse-delay': '0.7s' } as React.CSSProperties}
        className="phone-pulse pointer-events-none absolute inset-0 -z-10 rounded-full bg-primary/60"
      />
      <Phone className="phone-ring relative size-5" />
    </a>
  )
}

/**
 * Главная кнопка шапки. Блик и «дыхание» тени делают её зовущей, но без
 * мигания — оно удешевило бы премиальную подачу. Сам блик лежит отдельным
 * слоем поверх золота и обрезается overflow-hidden.
 */
function CtaButton({ label, className }: { label: string; className?: string }) {
  return (
    <a
      href="#fleet"
      className={cn(
        'cta-alive group relative overflow-hidden rounded-full bg-primary text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.04]',
        className,
      )}
    >
      <span
        aria-hidden="true"
        className="cta-sheen pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 bg-gradient-to-r from-transparent via-white/50 to-transparent"
      />
      <span className="relative">{label}</span>
    </a>
  )
}

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
          {/* Только на самых широких: на 1280 место уже занимают меню и соцсети. */}
          <span className="hidden text-[10px] uppercase tracking-[0.3em] text-primary 2xl:inline">
            {brand.tagline}
          </span>
        </a>

        {/* Зазор был 36px — на шести пунктах это 180px, из-за них шапка и не влезала. */}
        <div className="hidden items-center gap-5 lg:flex xl:gap-6">
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

        <div className="hidden items-center gap-3 lg:flex">
          <LangSwitch lang={lang} />
          {/* Соцсети — только с xl. На 1024–1280 они не влезали: шапке нужно было
              1201px при 944 доступных, и строка разъезжалась. В футере они есть всегда. */}
          <div className="hidden items-center gap-3 xl:flex">
            <SocialRow lang={lang} idPrefix="nav" />
            <span className="h-5 w-px bg-border" />
          </div>
          <CallButton label={c.callAdmin} />
          <CtaButton label={t.cta} className="px-6 py-2.5" />
        </div>

        <div className="flex items-center gap-3 lg:hidden">
          <LangSwitch lang={lang} />
          <CallButton label={c.callAdmin} />
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
          {/* В шапку телефона ряд не влезает — живёт в раскрытом меню. */}
          <SocialRow lang={lang} idPrefix="mobile" size="md" className="mt-3 px-3" />
          <CtaButton label={t.cta} className="mt-3 px-6 py-3 text-center" />
        </div>
      </div>
    </header>
  )
}
