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
  return (
    <BookingProvider lang={lang} boats={boats}>
      <SiteNav lang={lang} />
      <main>
        <Hero lang={lang} />
        <Experiences lang={lang} />
        <Fleet lang={lang} boats={boats} />
        <WhyUs lang={lang} />
        <Routes lang={lang} />
        <Expeditions lang={lang} />
        <Gallery lang={lang} />
        <Testimonials lang={lang} />
        <Faq lang={lang} />
        <Cta lang={lang} />
        {/* Баннер собственников — внизу: он перебивал первый экран синей полосой. */}
        <OwnerBanner lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </BookingProvider>
  )
}
