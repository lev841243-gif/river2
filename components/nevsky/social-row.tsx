'use client'

import { BRAND_COLORS, InstagramIcon, MaxIcon, TelegramIcon, WhatsappIcon } from '@/components/icons/brands'
import { cn } from '@/lib/utils'
import { contacts, dict, type Lang } from '@/lib/i18n'

export interface SocialItem {
  label: string
  /** null = канал не заведён: не ссылка, показывает «в разработке». */
  href: string | null
  /** `idPrefix` разводит id градиентов: в SVG они глобальные и не должны совпадать. */
  icon: (idPrefix: string) => React.ReactNode
  /** Фирменный цвет фона кружка; у Instagram и MAX знаки сами градиентные. */
  color?: string
}

/**
 * Каналы связи — единый список для шапки, футера и CTA, чтобы они не разъезжались.
 * Порядок = порядок волны, поэтому он осмысленный: сначала рабочие каналы.
 */
export function socialItems(): SocialItem[] {
  return [
    {
      label: 'WhatsApp',
      href: contacts.whatsapp,
      icon: () => <WhatsappIcon className="size-full" />,
      color: BRAND_COLORS.whatsapp,
    },
    {
      label: 'Telegram',
      href: contacts.telegram,
      icon: () => <TelegramIcon className="size-full" />,
      color: BRAND_COLORS.telegram,
    },
    {
      label: 'MAX',
      href: contacts.max,
      icon: (p) => <MaxIcon className="size-full" gradientId={`${p}-max`} />,
    },
    {
      label: 'Instagram',
      href: contacts.instagram,
      icon: (p) => <InstagramIcon className="size-full" gradientId={`${p}-ig`} />,
    },
  ]
}

/**
 * Ряд значков с волной. Задержка (--wave-delay) сдвигает фазу у соседей —
 * из-за неё расцветание бежит по ряду, а не вспыхивает разом.
 */
export function SocialRow({
  lang,
  idPrefix,
  size = 'sm',
  className,
}: {
  lang: Lang
  /** Уникальная приставка: id градиента в SVG глобальные и не должны совпадать. */
  idPrefix: string
  size?: 'sm' | 'md'
  className?: string
}) {
  const c = dict[lang].contact
  const items = socialItems()
  const box = size === 'sm' ? 'size-8' : 'size-9'
  const glyph = size === 'sm' ? 'size-4' : 'size-[18px]'

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      {items.map((item, i) => {
        const inner = (
          <>
            <span
              className={cn(
                'flex items-center justify-center overflow-hidden rounded-full border border-border transition-colors',
                box,
              )}
              style={{ color: item.color }}
            >
              <span className={glyph}>{item.icon(idPrefix)}</span>
            </span>
            {!item.href && (
              <span
                role="tooltip"
                className="pointer-events-none absolute -bottom-7 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-border bg-card px-2 py-0.5 text-[10px] text-foreground opacity-0 shadow-lg transition-opacity group-hover/s:opacity-100"
              >
                {c.inDevelopment}
              </span>
            )}
          </>
        )

        // Шаг 0.45s: волна успевает пройти по ряду и не выглядит вспышкой.
        const style = { '--wave-delay': `${i * 0.45}s` } as React.CSSProperties

        return item.href ? (
          <a
            key={item.label}
            href={item.href}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={item.label}
            title={item.label}
            style={style}
            className="brand-wave group/s relative"
          >
            {inner}
          </a>
        ) : (
          <span
            key={item.label}
            aria-label={`${item.label} — ${c.inDevelopment}`}
            style={style}
            className="brand-wave group/s relative cursor-default"
          >
            {inner}
          </span>
        )
      })}
    </div>
  )
}
