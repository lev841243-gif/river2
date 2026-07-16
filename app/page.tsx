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

/**
 * ISR (ТЗ, п. 7). Без него страница собиралась бы полностью статически, флот
 * замерзал бы на момент сборки, и правка лодки в админке не появлялась бы на
 * сайте до следующего деплоя. Админка дополнительно бьёт revalidatePath('/')
 * при сохранении — эта цифра лишь потолок на случай правки мимо неё (например,
 * прямо в базе).
 */
export const revalidate = 300

export default async function Page() {
  const lang = 'ru'
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
