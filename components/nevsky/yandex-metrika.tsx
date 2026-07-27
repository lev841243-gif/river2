'use client'

/**
 * Счётчик Яндекс.Метрики (№ 111074489).
 *
 * Код Яндекса подключается через next/script (strategy afterInteractive) — это
 * штатный способ для сторонней аналитики в Next.js вместо сырого <script> в
 * разметке. tag.js грузится асинхронно, поэтому данные о просмотре уходят даже
 * при быстром закрытии страницы.
 *
 * ⚠️ На /admin счётчик НЕ ставится: это внутренняя панель менеджера с телефонами
 * и именами клиентов, а webvisor записывал бы их в Яндекс. Тот же принцип, что и
 * у баннера cookie (он тоже исключает /admin).
 *
 * Грузится ТОЛЬКО в проде (как Vercel Analytics в cookie-consent.tsx) — иначе
 * localhost-переходы засоряли бы реальную статистику счётчика.
 *
 * Init-опции — ровно как выдал Яндекс (webvisor, clickmap, ecommerce и т.д.).
 * При клиентской навигации (Next — SPA) init шлёт только первый просмотр, поэтому
 * на смену пути шлём ym('hit', url) вручную.
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'

const COUNTER_ID = 111074489

declare global {
  interface Window {
    ym?: (id: number, action: string, ...rest: unknown[]) => void
  }
}

export function YandexMetrika() {
  const pathname = usePathname()
  const onAdmin = pathname?.startsWith('/admin') ?? false
  const enabled = process.env.NODE_ENV === 'production' && !onAdmin

  // init отправляет хит первого просмотра сам — считаем просмотры при
  // последующих клиентских переходах, пропуская самый первый рендер.
  const first = useRef(true)
  useEffect(() => {
    if (!enabled) return
    if (first.current) {
      first.current = false
      return
    }
    window.ym?.(COUNTER_ID, 'hit', window.location.href)
  }, [pathname, enabled])

  if (!enabled) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}', 'ym');

ym(${COUNTER_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`}
      </Script>
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${COUNTER_ID}`}
            style={{ position: 'absolute', left: '-9999px' }}
            alt=""
          />
        </div>
      </noscript>
    </>
  )
}
