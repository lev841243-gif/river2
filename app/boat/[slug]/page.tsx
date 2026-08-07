import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { BoatPage } from '@/components/nevsky/boat-page'
import { getBoat, getBoats } from '@/lib/boats-db'
import { buildBoatMetadata } from '@/lib/boat-seo'

// ISR: как на главной — правки лодки в админке доезжают без пересборки.
export const revalidate = 300

/**
 * Пререндерим страницы всех видимых лодок. Лодку, добавленную позже, Next
 * отрисует по запросу (dynamicParams включён по умолчанию) и закэширует.
 */
export async function generateStaticParams() {
  const boats = await getBoats()
  return boats.map((b) => ({ slug: b.id }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const boat = await getBoat(slug)
  return boat ? buildBoatMetadata(boat, 'ru') : {}
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  // Один запрос флота: он же нужен форме брони и блоку «другие катера».
  const boats = await getBoats()
  const boat = boats.find((b) => b.id === slug)
  if (!boat) notFound()
  return <BoatPage lang="ru" boat={boat} boats={boats} />
}
