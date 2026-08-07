import { ArrowRight, Crown, Gauge, Maximize2, Moon, Phone, Ruler, Users } from 'lucide-react'
import { BookingProvider } from './booking-context'
import { SiteNav } from './site-nav'
import { SiteFooter } from './site-footer'
import { Testimonials } from './testimonials'
import { Cta } from './cta'
import { BookButton } from './book-button'
import { BoatGallery } from './boat-gallery'
import { boatImg, contacts, dict, type Boat, type Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'
import { boatCopy, boatPath, boatPrice } from '@/lib/boat-seo'

/** Иконки под ТТХ — тот же порядок, что и в `specLabels`: длина, ширина, высота, скорость, вместимость. */
const specIcons = [Ruler, Maximize2, Maximize2, Gauge, Users]

/**
 * Страница одного катера. Серверный компонент: описание, ТТХ и JSON-LD попадают
 * в исходный HTML. Интерактив — только галерея и кнопка брони.
 *
 * Флот целиком сюда НЕ вставляем (в отличие от лендингов): вместо этого внизу
 * ссылки на другие катера. Так страницы перелинкованы между собой, а не тянут
 * по 16 карточек с модалкой на каждой из 32 страниц.
 */
export function BoatPage({
  lang,
  boat,
  boats,
}: {
  lang: Lang
  boat: Boat
  boats: Boat[]
}) {
  const t = dict[lang].fleet
  const contact = dict[lang].contact
  const c = boatCopy(lang)
  const homeUrl = lang === 'ru' ? '/' : '/en'
  const price = boatPrice(boat, lang)
  const priceLabel = price ? `от ${price} ${t.perHour}` : t.onRequest
  const canonical = `${SITE_URL}${boatPath(boat.id, lang)}`
  const others = boats.filter((b) => b.id !== boat.id).slice(0, 3)

  // JSON-LD: сам катер как Product. Цена в базе за час → UnitPriceSpecification
  // (HUR), как во `fleet-jsonld.tsx`. У лодок без цены offers опускаем.
  const product: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: boat.name[lang],
    description: boat.desc[lang],
    image: [boat.cover, ...boat.photos].map((f) => `${SITE_URL}${boatImg(boat.dir, f)}`),
    url: canonical,
  }
  if (boat.price != null) {
    product.offers = {
      '@type': 'Offer',
      url: canonical,
      price: boat.price,
      priceCurrency: 'RUB',
      availability: 'https://schema.org/InStock',
      priceSpecification: {
        '@type': 'UnitPriceSpecification',
        price: boat.price,
        priceCurrency: 'RUB',
        unitCode: 'HUR',
        referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'HUR' },
      },
    }
  }

  // JSON-LD: Главная → Флот → катер.
  const breadcrumb = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: c.home, item: `${SITE_URL}${homeUrl}` },
      { '@type': 'ListItem', position: 2, name: c.fleetLabel, item: `${SITE_URL}${homeUrl}#fleet` },
      { '@type': 'ListItem', position: 3, name: boat.name[lang], item: canonical },
    ],
  }

  return (
    <BookingProvider lang={lang} boats={boats}>
      <SiteNav
        lang={lang}
        linkBase={homeUrl}
        ruHref={boatPath(boat.id, 'ru')}
        enHref={boatPath(boat.id, 'en')}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(product) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }}
      />

      <main>
        <section className="border-b border-border">
          <div className="mx-auto max-w-7xl px-6 pb-16 pt-32 lg:px-10 lg:pt-36">
            <nav
              aria-label="breadcrumb"
              className="flex flex-wrap items-center gap-2 text-sm text-foreground/60"
            >
              <a href={homeUrl} className="transition-colors hover:text-foreground">
                {c.home}
              </a>
              <span className="text-foreground/30">/</span>
              <a href={`${homeUrl}#fleet`} className="transition-colors hover:text-foreground">
                {c.fleetLabel}
              </a>
              <span className="text-foreground/30">/</span>
              <span className="text-foreground/80">{boat.name[lang]}</span>
            </nav>

            <p className="mt-8 text-xs uppercase tracking-[0.4em] text-primary">{c.eyebrow}</p>
            <h1 className="mt-5 max-w-3xl text-balance font-[family-name:var(--font-display)] text-4xl font-medium leading-[1.05] tracking-tight text-foreground sm:text-5xl">
              {c.h1(boat)}
            </h1>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {boat.premium && (
                <span className="inline-flex items-center gap-2 rounded-full bg-background/70 px-3.5 py-1.5 text-sm text-foreground ring-1 ring-primary/50">
                  <Crown className="size-4 text-primary" />
                  {t.premium}
                </span>
              )}
              {boat.isNew && (
                <span className="inline-flex items-center rounded-full bg-primary px-3.5 py-1.5 text-sm font-medium uppercase tracking-wide text-primary-foreground">
                  {t.isNew}
                </span>
              )}
              {boat.badge && (
                <span className="inline-flex -rotate-3 items-center rounded-full bg-gradient-to-r from-primary to-[#e0c485] px-3.5 py-1.5 text-sm font-semibold uppercase tracking-wide text-primary-foreground shadow-lg shadow-primary/30">
                  {boat.badge[lang]}
                </span>
              )}
            </div>
          </div>
        </section>

        {/* Галерея + панель с ценой и бронью */}
        <section className="mx-auto max-w-7xl px-6 py-16 lg:px-10 lg:py-20">
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.6fr_1fr] lg:gap-12">
            <BoatGallery
              dir={boat.dir}
              cover={boat.cover}
              photos={boat.photos}
              alt={boat.name[lang]}
            />

            <aside className="lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl border border-border bg-card p-7">
                <p className="font-[family-name:var(--font-display)] text-3xl font-medium tracking-tight text-primary">
                  {priceLabel}
                </p>
                <p className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
                  <Moon className="size-4 text-primary" />
                  {t.captainOnly}
                </p>

                <div className="mt-7 flex flex-col gap-3">
                  <BookButton
                    label={t.bookThis}
                    boatId={boat.id}
                    className="group inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]"
                  />
                  <a
                    href={contacts.phoneHref}
                    aria-label={contact.callAdmin}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-border bg-foreground/5 px-7 py-3.5 text-sm font-medium text-foreground transition-colors duration-300 hover:bg-foreground/10"
                  >
                    <Phone className="size-4 text-primary" />
                    {contact.call}
                  </a>
                </div>
              </div>
            </aside>
          </div>
        </section>

        {/* Описание */}
        <section className="mx-auto max-w-7xl px-6 pb-8 lg:px-10">
          <div className="max-w-3xl space-y-5">
            <p className="text-pretty text-lg leading-relaxed text-foreground/80">
              {boat.desc[lang]}
            </p>
            <p className="text-pretty leading-relaxed text-muted-foreground">{c.intro(boat)}</p>
          </div>
        </section>

        {/* Характеристики */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            {c.specsTitle}
          </h2>
          {boat.specs ? (
            <div className="mt-7 grid grid-cols-2 gap-4 sm:grid-cols-5">
              {boat.specs[lang].map((value, idx) => {
                if (value === '—') return null
                const Icon = specIcons[idx]
                return (
                  <div
                    key={idx}
                    className="flex flex-col gap-1.5 rounded-2xl border border-border bg-background/40 p-4"
                  >
                    <Icon className="size-4 text-primary" />
                    <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
                      {t.specLabels[idx]}
                    </span>
                    <span className="text-sm font-medium text-foreground">{value}</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="mt-7 rounded-2xl border border-border bg-background/40 p-4 text-sm text-muted-foreground">
              {t.specsOnRequest}
            </p>
          )}
        </section>

        {/* Удобства на борту */}
        {boat.amenities[lang].length > 0 && (
          <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
            <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.amenitiesTitle}</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {boat.amenities[lang].map((a) => (
                <span
                  key={a}
                  className="rounded-full border border-border px-3.5 py-1.5 text-sm text-foreground/80"
                >
                  {a}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Услуги для праздника */}
        <section className="mx-auto max-w-7xl px-6 py-12 lg:px-10">
          <p className="text-xs uppercase tracking-[0.3em] text-primary">{t.extrasTitle}</p>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {t.extras.map((extra) => (
              <span
                key={extra}
                className="rounded-full bg-primary/10 px-3.5 py-1.5 text-sm text-primary"
              >
                {extra}
              </span>
            ))}
          </div>
        </section>

        {/* Перелинковка: другие катера флота */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:px-10 lg:py-24">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
                {c.othersTitle}
              </h2>
              <a
                href={`${homeUrl}#fleet`}
                className="group inline-flex items-center gap-2 text-sm text-primary transition-colors hover:text-foreground"
              >
                {c.allFleet}
                <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
              </a>
            </div>

            <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((b) => {
                const p = boatPrice(b, lang)
                return (
                  <a
                    key={b.id}
                    href={boatPath(b.id, lang)}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-transform duration-500 hover:-translate-y-2"
                  >
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <img
                        src={boatImg(b.dir, b.cover)}
                        alt={b.name[lang]}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-baseline justify-between gap-3">
                        <h3 className="font-[family-name:var(--font-display)] text-xl font-medium tracking-tight text-foreground">
                          {b.name[lang]}
                        </h3>
                        <span className="shrink-0 text-sm text-primary">
                          {p ? `от ${p} ${t.perHour}` : t.onRequest}
                        </span>
                      </div>
                    </div>
                  </a>
                )
              })}
            </div>
          </div>
        </section>

        <Testimonials lang={lang} />
        <Cta lang={lang} />
      </main>

      <SiteFooter lang={lang} />
    </BookingProvider>
  )
}
