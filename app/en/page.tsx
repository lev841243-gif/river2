import type { Metadata } from 'next'
import { SiteNav } from '@/components/nevsky/site-nav'
import { getBoats } from '@/lib/boats-db'
import { BookingProvider } from '@/components/nevsky/booking-context'
import { Hero } from '@/components/nevsky/hero'
import { OwnerBanner } from '@/components/nevsky/owner-banner'
import { Experiences } from '@/components/nevsky/experiences'
import { Fleet } from '@/components/nevsky/fleet'
import { WhyUs } from '@/components/nevsky/why-us'
import { Routes } from '@/components/nevsky/routes'
import { Expeditions } from '@/components/nevsky/expeditions'
import { Gallery } from '@/components/nevsky/gallery'
import { Testimonials } from '@/components/nevsky/testimonials'
import { Faq } from '@/components/nevsky/faq'
import { Cta } from '@/components/nevsky/cta'
import { SiteFooter } from '@/components/nevsky/site-footer'
import { CollapsibleSection } from '@/components/nevsky/collapsible-section'
import { dict } from '@/lib/i18n'

export const metadata: Metadata = {
  title: 'Dno Shipping Company — Private Boat Tours in Saint Petersburg',
  description:
    'Private luxury boat tours along the Neva River with professional captains — romantic evenings, White Nights, celebrations and corporate events in Saint Petersburg.',
}

/** ISR — см. пояснение в app/page.tsx. Обе версии читают один и тот же флот. */
export const revalidate = 300

export default async function EnPage() {
  const lang = 'en'
  const boats = await getBoats()
  const t = dict[lang]
  return (
    <BookingProvider lang={lang} boats={boats}>
      <SiteNav lang={lang} />
      <main>
        <Hero lang={lang} />
        <Experiences lang={lang} />
        <Fleet lang={lang} boats={boats} />
        {/* Разделы 4–8 — выпадающими окнами, чтобы страница не была такой длинной. */}
        <CollapsibleSection eyebrow={t.why.eyebrow} title={t.why.title}>
          <WhyUs lang={lang} />
        </CollapsibleSection>
        <CollapsibleSection id="routes" eyebrow={t.routes.eyebrow} title={t.routes.title}>
          <Routes lang={lang} />
        </CollapsibleSection>
        <CollapsibleSection
          id="trips"
          eyebrow={t.expeditions.eyebrow}
          title={t.expeditions.title}
          className="bg-[color:var(--navy)]/25"
        >
          <Expeditions lang={lang} />
        </CollapsibleSection>
        <CollapsibleSection
          id="gallery"
          eyebrow={t.gallery.eyebrow}
          title={t.gallery.title}
          className="bg-[color:var(--navy)]/25"
        >
          <Gallery lang={lang} />
        </CollapsibleSection>
        <CollapsibleSection id="reviews" eyebrow={t.testimonials.eyebrow} title={t.testimonials.title}>
          <Testimonials lang={lang} />
        </CollapsibleSection>
        <Faq lang={lang} />
        <Cta lang={lang} />
        {/* Баннер собственников — внизу: он перебивал первый экран синей полосой. */}
        <OwnerBanner lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </BookingProvider>
  )
}
