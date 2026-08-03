import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'
import { landings, landingPath } from '@/lib/landings'

/**
 * sitemap.xml. Только публичные страницы. RU и EN связаны через hreflang
 * (alternates.languages), чтобы поисковик не считал их дублями и показывал
 * версию по языку пользователя.
 */
export default function sitemap(): MetadataRoute.Sitemap {
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
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
