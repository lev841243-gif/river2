'use client'

/**
 * Ненавязчивый баннер согласия на cookie + гейт аналитики.
 *
 * «Отклонить» имеет смысл: Vercel Analytics грузится ТОЛЬКО после «Принять»
 * (и только в проде). Иначе кнопка «Отклонить» была бы бутафорией. Выбор
 * хранится в cookie `cookie_consent` на год. Язык берём из пути (/en → en).
 *
 * Баннер появляется после монтирования (выбор читаем в useEffect) — так нет
 * рассинхрона гидратации и мигания на первом рендере. На /admin не показываем:
 * это внутренний интерфейс менеджера, не публичная страница.
 */

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Analytics } from '@vercel/analytics/next'
import { dict, type Lang } from '@/lib/i18n'

const COOKIE = 'cookie_consent'
const MAX_AGE = 60 * 60 * 24 * 365 // год

type Choice = 'accepted' | 'declined'

function readChoice(): Choice | null {
  if (typeof document === 'undefined') return null
  const m = document.cookie.match(/(?:^|;\s*)cookie_consent=(accepted|declined)/)
  return (m?.[1] as Choice) ?? null
}

function writeChoice(v: Choice): void {
  document.cookie = `${COOKIE}=${v}; path=/; max-age=${MAX_AGE}; SameSite=Lax`
}

export function CookieConsent() {
  const pathname = usePathname()
  const lang: Lang = pathname?.startsWith('/en') ? 'en' : 'ru'
  const t = dict[lang].cookie

  // undefined = ещё не читали (SSR/до монтирования), null = выбора нет → баннер.
  const [choice, setChoice] = useState<Choice | null | undefined>(undefined)

  useEffect(() => {
    setChoice(readChoice())
  }, [])

  const decide = (v: Choice) => {
    writeChoice(v)
    setChoice(v)
  }

  const isProd = process.env.NODE_ENV === 'production'
  const onAdmin = pathname?.startsWith('/admin') ?? false

  return (
    <>
      {isProd && choice === 'accepted' && <Analytics />}

      {choice === null && !onAdmin && (
        <div
          role="dialog"
          aria-label={t.text}
          className="fixed inset-x-0 bottom-0 z-[60] p-4 sm:inset-x-auto sm:bottom-4 sm:left-4 sm:max-w-sm"
        >
          <div className="rounded-2xl border border-border bg-card/95 p-4 shadow-xl backdrop-blur">
            <p className="text-sm leading-relaxed text-card-foreground">
              {t.text}{' '}
              <a href="/privacy" className="underline underline-offset-2 hover:text-primary">
                {t.policy}
              </a>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => decide('accepted')}
                className="flex-1 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition hover:opacity-90"
              >
                {t.accept}
              </button>
              <button
                type="button"
                onClick={() => decide('declined')}
                className="flex-1 rounded-full border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-foreground/5"
              >
                {t.decline}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
