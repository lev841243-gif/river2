import { Phone } from 'lucide-react'
import { BookingProvider } from './booking-context'
import { SiteNav } from './site-nav'
import { SiteFooter } from './site-footer'
import { Fleet } from './fleet'
import { Testimonials } from './testimonials'
import { Cta } from './cta'
import { BookButton } from './book-button'
import { FleetJsonLd } from './fleet-jsonld'
import { contacts, dict, type Boat, type Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { landingPath, type Landing } from '@/lib/landings'

/**
 * Общий каркас SEO-посадочной страницы. Серверный компонент: весь текст и
 * JSON-LD (хлебные крошки, FAQ, Product/Offer флота) попадают в исходный HTML.
 * Интерактив (бронирование, флот, отзывы) переиспользуется с главной и живёт
 * внутри BookingProvider. Оба языковых `page.tsx` — тонкие обёртки над этим.
 */
export function LandingPage({
  lang,
  landing,
  boats,
}: {
  lang: Lang
  landing: Landing
  boats: Boat[]
}) {
  const c = landing.content[lang]
  const contact = dict[lang].contact
  const homeUrl = lang === 'ru' ? '/' : '/en'
  const homeLabel = lang === 'ru' ? 'Главная' : 'Home'

  // JSON-LD: хлебные крошки Главная → страница.
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: homeLabel, item: `${SITE_URL}${homeUrl}` },
      { '@type': 'ListItem', position: 2, name: c.h1, item: `${SITE_URL}${landingPath(landing, lang)}` },
    ],
  }

  // JSON-LD: FAQ этой страницы (отдельный от главного FAQ).
  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: c.faq.map((it) => ({
      '@type': 'Question',
      name: it.q,
      acceptedAnswer: { '@type': 'Answer', text: it.a },
    })),
  }

  return (
    <BookingProvider lang={lang} boats={boats}>
      <SiteNav lang={lang} linkBase="/" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <FleetJsonLd lang={lang} boats={boats} />

      <main>
        {/* Шапка */}
        <section className="relative flex min-h-[92svh] items-center overflow-hidden">
          <div className="absolute inset-0 -z-10">
            <img src={landing.heroImage} alt={c.h1} className="size-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/45 to-background/60" />
            <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-background/10 to-transparent" />
          </div>

          <div className="mx-auto w-full max-w-7xl px-6 pb-20 pt-36 lg:px-10">
            {/* Хлебные крошки */}
            <nav aria-label="breadcrumb" className="mb-6 flex items-center gap-2 text-sm text-foreground/60">
              <a href={homeUrl} className="transition-colors hover:text-foreground">
                {homeLabel}
              </a>
              <span className="text-foreground/30">/</span>
              <span className="text-foreground/80">{c.eyebrow}</span>
            </nav>

            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.4em] text-primary">{c.eyebrow}</p>
              <h1 className="mt-5 text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl lg:text-6xl">
                {c.h1}
              </h1>
              <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-foreground/75">
                {c.heroSubtitle}
              </p>

              <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-center">
                <BookButton label={dict[lang].fleet.book} />
                <a
                  href={contacts.phoneHref}
                  aria-label={contact.callAdmin}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-8 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-colors duration-300 hover:bg-foreground/10"
                >
                  <Phone className="size-4 text-primary" />
                  {contact.call}
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Вводный текст + выгоды */}
        <section className="mx-auto max-w-7xl px-6 py-24 lg:px-10 lg:py-32">
          <div className="max-w-3xl space-y-6">
            {c.intro.map((p) => (
              <p key={p} className="text-pretty text-lg leading-relaxed text-muted-foreground">
                {p}
              </p>
            ))}
          </div>

          <h2 className="mt-16 text-balance font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
            {c.benefitsTitle}
          </h2>
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {c.benefits.map((b) => (
              <div key={b.title} className="rounded-3xl border border-border bg-card p-7">
                <h3 className="text-lg font-medium text-foreground">{b.title}</h3>
                <p className="mt-3 text-pretty leading-relaxed text-muted-foreground">{b.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Флот — переиспользуем с главной */}
        <Fleet lang={lang} boats={boats} />

        {/* Отзывы — переиспользуем */}
        <Testimonials lang={lang} />

        {/* FAQ этой страницы — серверный аккордеон на <details>, работает без JS */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-3xl px-6 py-24 lg:px-10 lg:py-32">
            <h2 className="text-balance font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-foreground sm:text-4xl">
              {c.faqTitle}
            </h2>
            <div className="mt-10 flex flex-col gap-4">
              {c.faq.map((it) => (
                <details
                  key={it.q}
                  className="group rounded-3xl border border-border bg-card px-7 py-6 [&_summary::-webkit-details-marker]:hidden"
                >
                  <summary className="flex cursor-pointer items-center justify-between gap-4 text-lg font-medium text-foreground">
                    {it.q}
                    <span className="shrink-0 text-2xl leading-none text-primary transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="mt-4 text-pretty leading-relaxed text-muted-foreground">{it.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA — переиспользуем */}
        <Cta lang={lang} />
      </main>

      <SiteFooter lang={lang} />
    </BookingProvider>
  )
}
