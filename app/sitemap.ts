import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * sitemap.xml. Только публичные страницы. RU и EN связаны через hreflang
 * (alternates.languages), чтобы поисковик не считал их дублями и показывал
 * версию по языку пользователя.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()
  const languages = { ru: `${SITE_URL}/`, en: `${SITE_URL}/en` }

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
    {
      url: `${SITE_URL}/privacy`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
