import { boatImg, type Boat, type Lang } from '@/lib/i18n'
import { SITE_URL } from '@/lib/site'

/**
 * Микроразметка флота — список Product с Offer (цена за час аренды). Даёт
 * поисковику структурированные данные о катерах и ценах: в выдаче возможен
 * расширенный сниппет с ценой. Серверный компонент — JSON-LD попадает в
 * исходный HTML. Данные берутся из того же массива лодок, что и видимый флот.
 *
 * Цена в базе — за час; выражаем через UnitPriceSpecification (unitCode HUR).
 * У лодок без цены (price === null) блок offers опускаем — цену не выдумываем.
 */
export function FleetJsonLd({ lang, boats }: { lang: Lang; boats: Boat[] }) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    itemListElement: boats.map((b, i) => {
      const product: Record<string, unknown> = {
        '@type': 'Product',
        name: b.name[lang],
        description: b.desc[lang],
        image: `${SITE_URL}${boatImg(b.dir, b.cover)}`,
      }
      if (b.price != null) {
        product.offers = {
          '@type': 'Offer',
          price: b.price,
          priceCurrency: 'RUB',
          availability: 'https://schema.org/InStock',
          priceSpecification: {
            '@type': 'UnitPriceSpecification',
            price: b.price,
            priceCurrency: 'RUB',
            unitCode: 'HUR',
            referenceQuantity: { '@type': 'QuantitativeValue', value: 1, unitCode: 'HUR' },
          },
        }
      }
      return { '@type': 'ListItem', position: i + 1, item: product }
    }),
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
