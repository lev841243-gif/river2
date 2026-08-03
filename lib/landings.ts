import type { Lang } from '@/lib/i18n'

/**
 * Контент SEO-посадочных страниц под конкретные запросы («мальчишник на катере»
 * и т.п.). Держим отдельно от основного словаря i18n: у лендингов своя
 * структура (H1, интро, выгоды, FAQ, метатеги), и так их проще добавлять,
 * не трогая большой типизированный `Dictionary`.
 *
 * Каждый лендинг — это отдельная страница `app/<slugRu>` (RU) и
 * `app/en/<slugEn>` (EN), связанные hreflang. Тексты сверяет заказчик.
 */

export interface LandingFaq {
  q: string
  a: string
}

export interface LandingBenefit {
  title: string
  text: string
}

export interface LandingContent {
  /** Метка-надзаголовок над H1 (eyebrow), в стиле остальных секций. */
  eyebrow: string
  /** H1 страницы — с ключевым запросом. */
  h1: string
  /** Подзаголовок под H1. */
  heroSubtitle: string
  /** <title> и og:title. */
  metaTitle: string
  /** meta description и og:description. */
  metaDescription: string
  /** Абзацы вводного текста (по одному <p> на элемент). */
  intro: string[]
  /** Заголовок блока выгод. */
  benefitsTitle: string
  benefits: LandingBenefit[]
  /** Заголовок блока частых вопросов. */
  faqTitle: string
  faq: LandingFaq[]
}

export interface Landing {
  /** Ключ-идентификатор посадочной. */
  key: string
  /** URL-слаг RU (страница `/<slugRu>`). */
  slugRu: string
  /** URL-слаг EN (страница `/en/<slugEn>`). */
  slugEn: string
  /** Фоновая картинка шапки (webp из public/images). */
  heroImage: string
  content: Record<Lang, LandingContent>
}

/** Абсолютные пути к страницам лендинга по языку — для canonical/hreflang/sitemap. */
export function landingPath(l: Landing, lang: Lang): string {
  return lang === 'ru' ? `/${l.slugRu}` : `/en/${l.slugEn}`
}

const bachelor: Landing = {
  key: 'bachelor',
  slugRu: 'malchishnik-na-katere',
  slugEn: 'bachelor-party',
  heroImage: '/images/exp-bachelor.webp',
  content: {
    ru: {
      eyebrow: 'Мальчишник в Санкт-Петербурге',
      h1: 'Мальчишник на катере в Санкт-Петербурге',
      heroSubtitle:
        'Проводы холостой жизни на воде — своей компанией, с музыкой, огнями ночного города и разводом мостов. Катер с капитаном, вечер по вашему сценарию.',
      metaTitle:
        'Мальчишник на катере в Санкт-Петербурге — аренда с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Аренда катера на мальчишник в Санкт-Петербурге с капитаном. Прогулка по Неве и каналам, музыка, свои напитки, ваш сценарий вечера. Катера до 12 гостей. Онлайн-бронирование.',
      intro: [
        'Мальчишник на катере — это свобода, которой не найти в баре или клубе. Весь борт в распоряжении вашей компании: никаких чужих людей, очередей и расписаний. Только вы, друзья и Петербург, открывающийся с воды.',
        'Мы берём на себя катер, капитана и маршрут — вам остаётся собрать компанию и выбрать дату. Вечер можно провести спокойно, любуясь набережными на закате, а можно поймать драйв на скорости по открытой воде.',
      ],
      benefitsTitle: 'Почему мальчишник на катере — это стоящая идея',
      benefits: [
        {
          title: 'Только ваша компания',
          text: 'Катер целиком в вашем распоряжении — никаких посторонних и общего расписания.',
        },
        {
          title: 'Ночной город и мосты',
          text: 'Маршрут под белые ночи и развод мостов — главное зрелище Петербурга с лучшей точки.',
        },
        {
          title: 'Музыка и свои напитки',
          text: 'На борту аудиосистема — подключайте свой плейлист. Напитки и закуски можно привезти с собой.',
        },
        {
          title: 'Капитан и безопасность',
          text: 'За штурвалом опытный капитан, спасательный жилет — на каждого гостя.',
        },
        {
          title: 'Ваш сценарий вечера',
          text: 'От неспешной прогулки до драйва на скорости — темп и маршрут выбираете вы.',
        },
        {
          title: 'Бронирование онлайн',
          text: 'Выберите катер и дату на сайте — менеджер свяжется и подтвердит детали.',
        },
      ],
      faqTitle: 'Частые вопросы про мальчишник на катере',
      faq: [
        {
          q: 'Сколько человек помещается на катер?',
          a: 'В зависимости от судна — от 4 до 12 гостей. Точная вместимость указана в карточке каждого катера в разделе «Флот».',
        },
        {
          q: 'Можно ли привезти свои напитки и еду?',
          a: 'Да, вы можете взять с собой напитки и закуски. Детали уточните у менеджера при бронировании.',
        },
        {
          q: 'Когда лучше выходить на воду?',
          a: 'Самое зрелищное время — вечер и ночь: закат, белые ночи и развод мостов. Поможем подобрать время под ваш сценарий.',
        },
        {
          q: 'Есть ли музыка на борту?',
          a: 'Да, на катерах есть аудиосистема — можно подключить свой плейлист.',
        },
        {
          q: 'Как забронировать катер на мальчишник?',
          a: 'Выберите катер и дату в разделе «Флот» и оставьте заявку. Менеджер свяжется с вами и подтвердит бронь.',
        },
      ],
    },
    en: {
      eyebrow: 'Bachelor party in Saint Petersburg',
      h1: 'Bachelor Party on a Boat in Saint Petersburg',
      heroSubtitle:
        'A send-off on the water — your crew, your music, the city lights and the opening bridges. A private boat with a captain, the evening on your terms.',
      metaTitle: 'Bachelor Party Boat Rental in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Rent a boat for a bachelor party in Saint Petersburg with a captain. Cruise the Neva and canals, your own music and drinks, your night. Boats for up to 12 guests. Book online.',
      intro: [
        'A bachelor party on a boat is the kind of freedom you will not find in a bar or a club. The whole deck is yours: no strangers, no queues, no schedules — just you, your friends and Saint Petersburg seen from the water.',
        'We take care of the boat, the captain and the route — you gather the crew and pick the date. Keep it calm and take in the embankments at sunset, or open the throttle for a rush across the open water.',
      ],
      benefitsTitle: 'Why a boat makes the perfect bachelor party',
      benefits: [
        {
          title: 'Your crew only',
          text: 'The whole boat is yours — no strangers and no shared timetable.',
        },
        {
          title: 'The night city and bridges',
          text: 'A route timed to the White Nights and the opening bridges — the best of Saint Petersburg from the best seat.',
        },
        {
          title: 'Your music and drinks',
          text: 'A sound system on board — plug in your playlist. You are welcome to bring your own drinks and snacks.',
        },
        {
          title: 'Captain and safety',
          text: 'An experienced captain at the helm and a life vest for every guest.',
        },
        {
          title: 'Your own scenario',
          text: 'From an unhurried cruise to a high-speed run — you choose the pace and the route.',
        },
        {
          title: 'Book online',
          text: 'Pick a boat and a date on the site — a manager will get in touch and confirm the details.',
        },
      ],
      faqTitle: 'Bachelor party boat — frequently asked questions',
      faq: [
        {
          q: 'How many people fit on a boat?',
          a: 'Between 4 and 12 guests depending on the boat. The exact capacity is listed on each boat card in the Fleet section.',
        },
        {
          q: 'Can we bring our own drinks and food?',
          a: 'Yes, you are welcome to bring drinks and snacks. Please confirm the details with the manager when booking.',
        },
        {
          q: 'When is the best time to go out?',
          a: 'Evening and night are the most spectacular — sunset, the White Nights and the opening bridges. We will help you pick the time for your plan.',
        },
        {
          q: 'Is there music on board?',
          a: 'Yes, the boats have a sound system — you can connect your own playlist.',
        },
        {
          q: 'How do I book a boat for a bachelor party?',
          a: 'Pick a boat and a date in the Fleet section and leave a request. A manager will contact you and confirm the booking.',
        },
      ],
    },
  },
}

/** Все посадочные страницы. Добавление новой — один объект здесь + два тонких page.tsx. */
export const landings: Landing[] = [bachelor]

/** Найти лендинг по ключу (для страниц). */
export function getLanding(key: string): Landing {
  const l = landings.find((x) => x.key === key)
  if (!l) throw new Error(`Landing not found: ${key}`)
  return l
}
