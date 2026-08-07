import type { Metadata } from 'next'
import type { Boat, Lang } from '@/lib/i18n'
import { SITE_NAME, OG_IMAGES } from '@/lib/site'

/**
 * Тексты и метаданные страниц катеров (`/boat/<slug>`, `/en/boat/<slug>`).
 *
 * Отличие от `landings.ts`: там контент написан руками под каждый запрос, а
 * здесь страниц 16 и они генерируются из данных лодки в БД (название, описание,
 * цена, ТТХ). Поэтому копирайт — шаблоны, а не готовые строки: добавили лодку
 * в админку — страница появилась сама, без правок кода.
 *
 * Зачем эти страницы вообще: у прежнего сайта были адреса вида
 * `/boat/kater-zig-zag`, они до сих пор в индексе Яндекса и Google и после
 * переезда отдавали 404 (~275 живых заходов за две недели логов). Редиректы
 * из `next.config.mjs` ведут сюда — 1 в 1, а не «всё на главную».
 */

/** Путь страницы катера по языку — для canonical/hreflang/sitemap/ссылок. */
export function boatPath(slug: string, lang: Lang): string {
  return lang === 'ru' ? `/boat/${slug}` : `/en/boat/${slug}`
}

/** Цена за час, отформатированная по локали. null — если цена не задана. */
export function boatPrice(boat: Boat, lang: Lang): string | null {
  if (boat.price == null) return null
  return boat.price.toLocaleString(lang === 'ru' ? 'ru-RU' : 'en-US')
}

/** Вместимость из ТТХ (5-е поле). '—' в данных означает «не указано». */
function capacity(boat: Boat, lang: Lang): string | null {
  const value = boat.specs?.[lang][4]
  return value && value !== '—' ? value : null
}

/**
 * Микрокопия страницы. Бренд в EN — «Dno», как в EN-лендингах: полное русское
 * название в англоязычном сниппете выглядело бы мусором.
 */
const copy = {
  ru: {
    brand: SITE_NAME,
    home: 'Главная',
    fleetLabel: 'Флот',
    eyebrow: 'Аренда катера',
    h1: (b: Boat) => `Аренда катера ${b.name.ru} в Санкт-Петербурге`,
    priceShort: (p: string) => `от ${p} ₽/час`,
    onRequest: 'цена по запросу',
    intro: (b: Boat) =>
      `${b.name.ru} — катер нашего флота в Санкт-Петербурге. Аренда только с капитаном: маршрут по Неве, рекам и каналам подбираем под вас. Стоимость указана за час, минимальное время аренды — 1 час.`,
    othersTitle: 'Другие катера флота',
    allFleet: 'Весь флот',
    specsTitle: 'Характеристики',
  },
  en: {
    brand: 'Dno',
    home: 'Home',
    fleetLabel: 'Fleet',
    eyebrow: 'Boat rental',
    h1: (b: Boat) => `${b.name.en} boat rental in Saint Petersburg`,
    priceShort: (p: string) => `from ${p} ₽/hour`,
    onRequest: 'price on request',
    intro: (b: Boat) =>
      `${b.name.en} is part of our fleet in Saint Petersburg. Available with a captain only: we plan the route along the Neva, the rivers and the canals around you. The rate is per hour, with a one-hour minimum.`,
    othersTitle: 'Other boats in the fleet',
    allFleet: 'See the whole fleet',
    specsTitle: 'Specifications',
  },
} as const

/** Тексты страницы на нужном языке. */
export function boatCopy(lang: Lang) {
  return copy[lang]
}

/** Заголовок <title> и og:title. */
function metaTitle(boat: Boat, lang: Lang): string {
  const c = copy[lang]
  const p = boatPrice(boat, lang)
  const price = p ? c.priceShort(p) : c.onRequest
  return lang === 'ru'
    ? `Аренда катера ${boat.name.ru} в Санкт-Петербурге — ${price} | ${c.brand}`
    : `${boat.name.en} boat rental in Saint Petersburg — ${price} | ${c.brand}`
}

/**
 * meta description. Начинаем с описания самой лодки — оно у каждой своё, и
 * сниппеты страниц не выглядят как 16 копий одного текста.
 */
function metaDescription(boat: Boat, lang: Lang): string {
  const p = boatPrice(boat, lang)
  const cap = capacity(boat, lang)
  if (lang === 'ru') {
    const parts = ['Катер с капитаном']
    if (cap) parts.push(cap)
    if (p) parts.push(`от ${p} ₽ за час`)
    return `${boat.desc.ru} ${parts.join(', ')}. Онлайн-бронирование в Санкт-Петербурге.`
  }
  const parts = ['Boat with a captain']
  if (cap) parts.push(cap)
  if (p) parts.push(`from ${p} ₽ per hour`)
  return `${boat.desc.en} ${parts.join(', ')}. Book online in Saint Petersburg.`
}

/**
 * Метаданные страницы катера. OG-картинку берём общую (`/og.jpg`), а не обложку
 * лодки: обложки в webp, и превью ссылки в Telegram/VK на нём разворачивается
 * не везде. Отдельные OG под катера — в долгах, вместе с такими же для лендингов.
 */
export function buildBoatMetadata(boat: Boat, lang: Lang): Metadata {
  const ruPath = boatPath(boat.id, 'ru')
  const enPath = boatPath(boat.id, 'en')
  const canonical = lang === 'ru' ? ruPath : enPath
  const title = metaTitle(boat, lang)
  const description = metaDescription(boat, lang)

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { 'ru-RU': ruPath, 'en-US': enPath, 'x-default': ruPath },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: lang === 'ru' ? 'ru_RU' : 'en_US',
      url: canonical,
      title,
      description,
      images: OG_IMAGES,
    },
  }
}
