import type { ReactNode } from 'react'
import {
  BRAND_COLORS,
  GoogleMapsIcon,
  InstagramIcon,
  TelegramIcon,
  WhatsappIcon,
  YandexMapsIcon,
} from '@/components/icons/brands'
import { contacts, dict, legal, type Lang } from '@/lib/i18n'

interface Social {
  label: string
  /** null = канал ещё не заведён: кнопка не кликается и показывает «в разработке». */
  href: string | null
  icon: ReactNode
  /** Фирменный цвет; у Instagram и Google Maps знаки многоцветные — цвет не нужен. */
  color?: string
}

/** Список «значок + подпись». Общий для соцсетей и карт, чтобы они не разъезжались. */
function LinkList({ items, note }: { items: Social[]; note: string }) {
  return (
    <ul className="mt-5 flex flex-col gap-3">
      {items.map((item) =>
        item.href ? (
          <li key={item.label}>
            <a
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 text-sm text-foreground/70 transition-colors hover:text-foreground"
            >
              <span
                style={{ color: item.color }}
                className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border transition-transform group-hover:scale-110"
              >
                {item.icon}
              </span>
              {item.label}
            </a>
          </li>
        ) : (
          // Канала ещё нет — не ссылка, а подпись с подсказкой при наведении.
          <li key={item.label} className="group relative w-fit">
            <span className="inline-flex cursor-default items-center gap-3 text-sm text-foreground/40">
              <span className="flex size-9 items-center justify-center overflow-hidden rounded-full border border-border opacity-60 grayscale transition-all group-hover:opacity-100 group-hover:grayscale-0">
                {item.icon}
              </span>
              {item.label}
            </span>
            <span
              role="tooltip"
              className="pointer-events-none absolute -top-8 left-0 z-10 whitespace-nowrap rounded-lg border border-border bg-card px-2.5 py-1 text-xs text-foreground opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            >
              {note}
            </span>
          </li>
        ),
      )}
    </ul>
  )
}

export function SiteFooter({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].footer
  const c = dict[lang].contact
  const nav = dict[lang].nav.links
  const brand = dict[lang].brand

  const socials: Social[] = [
    {
      label: 'WhatsApp',
      href: contacts.whatsapp,
      icon: <WhatsappIcon className="size-4" />,
      color: BRAND_COLORS.whatsapp,
    },
    {
      label: 'Telegram',
      href: contacts.telegram,
      icon: <TelegramIcon className="size-4" />,
      color: BRAND_COLORS.telegram,
    },
    {
      label: 'Instagram',
      href: contacts.instagram,
      icon: <InstagramIcon className="size-4" gradientId="ig-footer" />,
    },
  ]

  const maps: Social[] = [
    {
      label: t.yandexMaps,
      href: contacts.yandexMaps,
      icon: <YandexMapsIcon className="size-4" />,
      color: BRAND_COLORS.yandex,
    },
    {
      label: t.googleMaps,
      href: contacts.googleMaps,
      icon: <GoogleMapsIcon className="size-4" />,
    },
  ]

  return (
    <footer id="footer" className="border-t border-border bg-[color:var(--navy)]/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex flex-col gap-14 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-[family-name:var(--font-display)] text-lg font-semibold uppercase tracking-[0.12em] text-foreground">
                {brand.wordmark}
              </span>
            </div>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              {t.tagline}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.explore}</p>
              <ul className="mt-5 flex flex-col gap-3">
                {nav.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.contact}</p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-foreground/70">
                {t.address.map((line) => (
                  <li key={line}>{line}</li>
                ))}
                <li>
                  <a
                    href={contacts.phoneHref}
                    aria-label={c.callAdmin}
                    className="text-primary transition-colors hover:text-foreground"
                  >
                    {c.callAdmin}
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:info@prokatkaterov.ru"
                    className="transition-colors hover:text-foreground"
                  >
                    info@prokatkaterov.ru
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.follow}</p>
              <LinkList items={socials} note={c.inDevelopment} />

              <p className="mt-8 text-xs uppercase tracking-[0.3em] text-primary">{t.findUs}</p>
              <LinkList items={maps} note={c.inDevelopment} />
            </div>
          </div>
        </div>

        {/* Реквизиты — скромно, отдельной строкой над копирайтом. */}
        <div className="mt-16 border-t border-border pt-8">
          <p className="text-xs leading-relaxed text-muted-foreground/70">
            ИНН {legal.inn} · ОГРНИП {legal.ogrnip}
          </p>

          <div className="mt-8 flex flex-col gap-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <p>© {new Date().getFullYear()} {brand.full}. {t.rights}</p>
            <div className="flex gap-6">
              <a href="#" className="transition-colors hover:text-foreground">
                {t.privacy}
              </a>
              <a href="#" className="transition-colors hover:text-foreground">
                {t.terms}
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
