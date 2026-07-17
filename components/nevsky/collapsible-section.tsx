'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CollapsibleSectionProps {
  /** Якорь для меню (#routes, #gallery, #reviews). */
  id?: string
  eyebrow: string
  title: string
  /** Доп. классы на <section> — например, фон раздела. */
  className?: string
  children: ReactNode
}

/**
 * «Выпадающее окно» раздела: плашка с заголовком и стрелкой вниз, по клику
 * разворачивает содержимое. Заголовок раздела живёт на плашке, поэтому внутри
 * children его дублировать не нужно.
 *
 * Анимация — через max-height между 0 и измеренной высотой контента (её держит
 * ResizeObserver, поэтому поздняя загрузка картинок и ресайз не обрезают блок).
 * Grid-приём `0fr → 1fr` из FAQ здесь не годится: закрытие требует scroll-
 * контейнера на содержимом, а он же схлопывает дорожку `1fr` в ноль на сложном
 * контенте (сетки, `.reveal`), и раздел не открывался бы.
 *
 * Если на страницу пришли по якорю из меню (#routes и т.п.) — раздел сам
 * раскрывается, иначе ссылка вела бы к свёрнутой плашке.
 */
export function CollapsibleSection({
  id,
  eyebrow,
  title,
  className,
  children,
}: CollapsibleSectionProps) {
  const [open, setOpen] = useState(false)
  const [contentHeight, setContentHeight] = useState(0)
  const sectionRef = useRef<HTMLElement | null>(null)
  const contentRef = useRef<HTMLDivElement | null>(null)

  // Держим актуальную высоту контента (ресайз, поздняя загрузка картинок).
  useEffect(() => {
    const el = contentRef.current
    if (!el) return
    const measure = () => setContentHeight(el.offsetHeight)
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // Пришли по якорю из меню — раскрываем и доводим до плашки.
  useEffect(() => {
    if (!id) return
    const openIfTargeted = () => {
      if (window.location.hash === `#${id}`) {
        setOpen(true)
        requestAnimationFrame(() => sectionRef.current?.scrollIntoView({ behavior: 'smooth' }))
      }
    }
    openIfTargeted()
    window.addEventListener('hashchange', openIfTargeted)
    return () => window.removeEventListener('hashchange', openIfTargeted)
  }, [id])

  return (
    <section ref={sectionRef} id={id} className={cn('border-t border-border', className)}>
      <div className="mx-auto max-w-7xl px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="group flex w-full items-center justify-between gap-6 py-10 text-left lg:py-14"
        >
          <span className="min-w-0">
            <span className="block text-xs uppercase tracking-[0.4em] text-primary">
              {eyebrow}
            </span>
            <span className="mt-4 block text-balance font-[family-name:var(--font-display)] text-3xl font-medium leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
            </span>
          </span>
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full border border-border text-primary transition-colors duration-300 group-hover:border-primary/50 group-hover:bg-primary/10 lg:size-14">
            <ChevronDown
              className={cn('size-6 transition-transform duration-500', open && 'rotate-180')}
            />
          </span>
        </button>
      </div>

      <div
        aria-hidden={!open}
        style={{ maxHeight: open ? contentHeight : 0, opacity: open ? 1 : 0 }}
        className="overflow-hidden transition-[max-height,opacity] duration-500 ease-out"
      >
        <div ref={contentRef}>{children}</div>
      </div>
    </section>
  )
}
