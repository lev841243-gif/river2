import { Camera, MapPin, MessageCircle, Send } from 'lucide-react'


const nav = [
  { label: 'Experiences', href: '#experiences' },
  { label: 'Fleet', href: '#fleet' },
  { label: 'Routes', href: '#routes' },
  { label: 'Gallery', href: '#gallery' },
  { label: 'Reviews', href: '#reviews' },
  { label: 'FAQ', href: '#faq' },
]

const socials = [
  { label: 'Telegram', href: '#', icon: Send },
  { label: 'WhatsApp', href: '#', icon: MessageCircle },
  { label: 'Instagram', href: '#', icon: Camera },
  { label: 'Google Maps', href: '#', icon: MapPin },
]

export function SiteFooter() {
  return (
    <footer id="footer" className="border-t border-border bg-[color:var(--navy)]/30">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10">
        <div className="flex flex-col gap-14 lg:flex-row lg:justify-between">
          <div className="max-w-sm">
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-xl font-medium tracking-[0.35em] text-foreground">
                NEVSKY
              </span>
            </div>
            <p className="mt-5 text-pretty leading-relaxed text-muted-foreground">
              Private luxury boat tours along the Neva River. Unforgettable
              evenings in the heart of Saint Petersburg.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Explore</p>
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
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Contact</p>
              <ul className="mt-5 flex flex-col gap-3 text-sm text-foreground/70">
                <li>English Embankment, 4</li>
                <li>Saint Petersburg, Russia</li>
                <li>
                  <a href="tel:+78120000000" className="transition-colors hover:text-foreground">
                    +7 (812) 000-00-00
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@nevsky.boats"
                    className="transition-colors hover:text-foreground"
                  >
                    hello@nevsky.boats
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-2 sm:col-span-1">
              <p className="text-xs uppercase tracking-[0.3em] text-primary">Follow</p>
              <ul className="mt-5 flex flex-col gap-3">
                {socials.map((social) => (
                  <li key={social.label}>
                    <a
                      href={social.href}
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
          <p>© {new Date().getFullYear()} Nevsky Boats. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-foreground">
              Privacy
            </a>
            <a href="#" className="transition-colors hover:text-foreground">
              Terms
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
