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
import { getGalleryItems } from '@/lib/gallery'

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
  const gallery = await getGalleryItems()
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
          {/* Баннер собственников — первым внутри «Почему Дно»: это тот же довод. */}
          <OwnerBanner lang={lang} />
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
        {/* Пусто — раздела нет: плашка без содержимого выглядела бы поломкой. */}
        {gallery.length > 0 && (
          <CollapsibleSection
            id="gallery"
            eyebrow={t.gallery.eyebrow}
            title={t.gallery.title}
            className="bg-[color:var(--navy)]/25"
          >
            <Gallery lang={lang} items={gallery} />
          </CollapsibleSection>
        )}
        <CollapsibleSection id="reviews" eyebrow={t.testimonials.eyebrow} title={t.testimonials.title}>
          <Testimonials lang={lang} />
        </CollapsibleSection>
        <Faq lang={lang} />
        <Cta lang={lang} />
      </main>
      <SiteFooter lang={lang} />
    </BookingProvider>
  )
}
