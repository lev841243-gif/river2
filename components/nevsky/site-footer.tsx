import { Camera, MapPin, MessageCircle, Send } from 'lucide-react'
import { contacts, dict, type Lang } from '@/lib/i18n'

export function SiteFooter({ lang = 'ru' }: { lang?: Lang }) {
  const t = dict[lang].footer
  const c = dict[lang].contact
  const nav = dict[lang].nav.links
  const brand = dict[lang].brand
  const socials = [
    { label: 'Telegram', href: contacts.telegram, icon: Send },
    { label: 'WhatsApp', href: '#', icon: MessageCircle },
    { label: 'Instagram', href: '#', icon: Camera },
    { label: 'Google Maps', href: '#', icon: MapPin },
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
              <ul className="mt-5 flex flex-col gap-3">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
                      target={social.href.startsWith('http') ? '_blank' : undefined}
                      rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                      className="group inline-flex items-center gap-3 text-sm text-foreground/70 transition-colors hover:text-foreground"
                    >
                      <span className="flex size-9 items-center justify-center rounded-full border border-border text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                        <social.icon className="size-4" />
                      </span>
                      {social.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
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
    </footer>
  )
}
