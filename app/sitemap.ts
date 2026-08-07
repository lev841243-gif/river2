import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { landings, landingPath } from '@/lib/landings'
import { getBoats } from '@/lib/boats-db'
import { boatPath } from '@/lib/boat-seo'

/**
 * sitemap.xml. Только публичные страницы. RU и EN связаны через hreflang
 * (alternates.languages), чтобы поисковик не считал их дублями и показывал
 * версию по языку пользователя.
 *
 * Руками не редактируется: лендинги берутся из массива `landings`, страницы
 * катеров — из флота в БД. Добавили лодку в админке — она в карте сайта.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date()
  const languages = { ru: `${SITE_URL}/`, en: `${SITE_URL}/en` }

  // SEO-посадочные: каждая — пара RU/EN, связанная hreflang.
  const landingEntries: MetadataRoute.Sitemap = landings.flatMap((l) => {
    const langs = { ru: `${SITE_URL}${landingPath(l, 'ru')}`, en: `${SITE_URL}${landingPath(l, 'en')}` }
    return [
      {
        url: langs.ru,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.8,
        alternates: { languages: langs },
      },
      {
        url: langs.en,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: { languages: langs },
      },
    ]
  })

  // Страницы катеров: пара RU/EN на каждую видимую лодку из БД.
  const boats = await getBoats()
  const boatEntries: MetadataRoute.Sitemap = boats.flatMap((b) => {
    const langs = { ru: `${SITE_URL}${boatPath(b.id, 'ru')}`, en: `${SITE_URL}${boatPath(b.id, 'en')}` }
    return [
      {
        url: langs.ru,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.7,
        alternates: { languages: langs },
      },
      {
        url: langs.en,
        lastModified: now,
        changeFrequency: 'monthly' as const,
        priority: 0.6,
        alternates: { languages: langs },
      },
    ]
  })

  return [
    {
      url: `${SITE_URL}/`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
      alternates: { languages },
    },
    {
      url: `${SITE_URL}/en`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
      alternates: { languages },
    },
    ...landingEntries,
    ...boatEntries,
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
