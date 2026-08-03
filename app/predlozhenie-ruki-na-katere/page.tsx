import { LandingPage } from '@/components/nevsky/landing-page'
import { getBoats } from '@/lib/boats-db'
import { getLanding, buildLandingMetadata } from '@/lib/landings'

const landing = getLanding('proposal')
export const metadata = buildLandingMetadata(landing, 'ru')

export const revalidate = 300

export default async function Page() {
  const boats = await getBoats()
  return <LandingPage lang="ru" landing={landing} boats={boats} />
}
