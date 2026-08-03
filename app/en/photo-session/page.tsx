import { LandingPage } from '@/components/nevsky/landing-page'
import { getBoats } from '@/lib/boats-db'
import { getLanding, buildLandingMetadata } from '@/lib/landings'

const landing = getLanding('photo')
export const metadata = buildLandingMetadata(landing, 'en')

export const revalidate = 300

export default async function Page() {
  const boats = await getBoats()
  return <LandingPage lang="en" landing={landing} boats={boats} />
}
