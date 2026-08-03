import type { Metadata } from 'next'
import { LandingPage } from '@/components/nevsky/landing-page'
import { getBoats } from '@/lib/boats-db'
import { getLanding, landingPath } from '@/lib/landings'
import { SITE_NAME, OG_IMAGES } from '@/lib/site'

const landing = getLanding('bachelor')
const c = landing.content.en
const ruPath = landingPath(landing, 'ru')
const enPath = landingPath(landing, 'en')

export const metadata: Metadata = {
  title: c.metaTitle,
  description: c.metaDescription,
  alternates: {
    canonical: enPath,
    languages: { 'ru-RU': ruPath, 'en-US': enPath, 'x-default': ruPath },
  },
  openGraph: {
    type: 'website',
    siteName: SITE_NAME,
    locale: 'en_US',
    url: enPath,
    title: c.metaTitle,
    description: c.metaDescription,
    images: OG_IMAGES,
  },
}

// ISR: как на главной — флот из БД не «замерзает» на момент сборки.
export const revalidate = 300

export default async function Page() {
  const boats = await getBoats()
  return <LandingPage lang="en" landing={landing} boats={boats} />
}
