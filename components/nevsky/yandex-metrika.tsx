'use client'

/**
 * Счётчики Яндекс.Метрики + отслеживание целей по контактным ссылкам.
 *
 * Счётчиков два (см. lib/metrika.ts): основной 111074489 и счётчик прежнего
 * сайта 43111299, к которому привязана кампания Директа. tag.js — общая
 * библиотека, грузим её ОДИН раз и просто вызываем init на каждый счётчик; это
 * штатный способ Яндекса для нескольких счётчиков на странице.
 *
 * ⚠️ webvisor включён ТОЛЬКО в основном счётчике. Запись сессий — это телефоны
 * и имена, которые клиенты вводят в форме брони; во второй счётчик (доступ к
 * нему не наш) их слать не нужно. Тот же принцип, что и с исключением /admin.
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
 *
 * Цели phone_click / telegram_click / whatsapp_click ловим ОДНИМ делегированным
 * обработчиком клика на document: он смотрит href ближайшей ссылки. Так все
 * контактные ссылки (шапка, футер, CTA, экспедиции, соц-ряд, экран успеха брони)
 * покрыты в одном месте, без правок в каждом компоненте. Цели booking_* живут
 * в booking-context (клик по кнопке) и booking-modal (открытие/успех формы).
 */

import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Script from 'next/script'
import { METRIKA_COUNTER_ID, METRIKA_COUNTER_IDS, reachGoal } from '@/lib/metrika'

/** Init-опции — ровно как выдал Яндекс; webvisor только в основном счётчике. */
const initCalls = METRIKA_COUNTER_IDS.map(
  (id) =>
    `ym(${id}, 'init', {ssr:true, webvisor:${id === METRIKA_COUNTER_ID}, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});`,
).join('\n')

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
    for (const id of METRIKA_COUNTER_IDS) window.ym?.(id, 'hit', window.location.href)
  }, [pathname, enabled])

  // Делегированный клик по контактным ссылкам → одна цель на клик.
  // closest('a') ловит клик и по вложенным в ссылку иконкам/тексту.
  // tel: / wa.me / t.me не пересекаются, поэтому цель ровно одна.
  useEffect(() => {
    if (!enabled) return
    const onClick = (e: MouseEvent) => {
      const el = e.target as HTMLElement | null
      const a = el?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a) return
      const href = a.getAttribute('href') ?? ''
      if (href.startsWith('tel:')) reachGoal('phone_click')
      else if (href.includes('wa.me')) reachGoal('whatsapp_click')
      else if (href.includes('t.me')) reachGoal('telegram_click')
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [enabled])

  if (!enabled) return null

  return (
    <>
      <Script id="yandex-metrika" strategy="afterInteractive">
        {`(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${METRIKA_COUNTER_ID}', 'ym');

${initCalls}`}
      </Script>
      <noscript>
        <div>
          {METRIKA_COUNTER_IDS.map((id) => (
            <img
              key={id}
              src={`https://mc.yandex.ru/watch/${id}`}
              style={{ position: 'absolute', left: '-9999px' }}
              alt=""
            />
          ))}
        </div>
      </noscript>
    </>
  )
}
