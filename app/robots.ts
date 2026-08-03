import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site'

/**
 * robots.txt. Открываем публичную часть, закрываем служебное:
 * - /admin — панель менеджера с ПДн клиентов;
 * - /api — ручки, не страницы;
 * - /check — проверка сертификата (и так noindex), не для поиска;
 * - /media — отдача загруженных файлов.
 * Ссылка на sitemap помогает Яндексу/Google найти все страницы.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/check', '/media'],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
