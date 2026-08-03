import { contacts, type Lang } from '@/lib/i18n'
import { SITE_URL, SITE_NAME } from '@/lib/site'

/**
 * Микроразметка LocalBusiness (Schema.org) — «карточка» организации для
 * поисковика. Данные СВЕРЕНЫ с карточкой Яндекс.Бизнес (org 18284574311),
 * чтобы NAP (название/адрес/телефон) совпадал — это ключ для локального SEO.
 *
 * Рейтинг реальный (Яндекс.Карты: 4,5 по 12 оценкам) — не выдуман. Координаты
 * взяты из привязки карты на сайте (contacts.yandexMaps).
 *
 * Серверный компонент → JSON-LD попадает в исходный HTML.
 */
export function BusinessJsonLd({ lang }: { lang: Lang }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    '@id': `${SITE_URL}/#business`,
    name: SITE_NAME,
    description:
      lang === 'ru'
        ? 'Аренда катеров и яхт с капитаном в Санкт-Петербурге. Частные прогулки по Неве, белые ночи, развод мостов, праздники и корпоративы.'
        : 'Private boat and yacht rental with a captain in Saint Petersburg. Neva River tours, White Nights, bridge openings, celebrations and corporate events.',
    url: SITE_URL,
    telephone: '+7 921 999-49-96',
    image: `${SITE_URL}/og.jpg`,
    logo: `${SITE_URL}/logotip/logo.png`,
    priceRange: '₽₽₽',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Кронверкская наб., 3, корп. 2',
      addressLocality: 'Санкт-Петербург',
      postalCode: '197046',
      addressCountry: 'RU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 59.953202,
      longitude: 30.320487,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      opens: '00:00',
      closes: '23:59',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.5',
      ratingCount: 12,
      bestRating: '5',
      worstRating: '1',
    },
    sameAs: [
      'https://www.instagram.com/dno_sydoxodnaja_kompanija_spb',
      contacts.yandexMaps,
      contacts.gis,
    ],
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
