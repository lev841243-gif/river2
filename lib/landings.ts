import type { Metadata } from 'next'
import type { Lang } from '@/lib/i18n'
import { SITE_NAME, OG_IMAGES } from '@/lib/site'

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

/**
 * Метаданные страницы лендинга (title/description/canonical/hreflang/OG).
 * Общий сборщик, чтобы языковые `page.tsx` оставались тонкими. OG-картинку
 * подставляем в каждый openGraph — в Next он заменяет родительский целиком.
 */
export function buildLandingMetadata(l: Landing, lang: Lang): Metadata {
  const c = l.content[lang]
  const ruPath = landingPath(l, 'ru')
  const enPath = landingPath(l, 'en')
  const canonical = lang === 'ru' ? ruPath : enPath
  return {
    title: c.metaTitle,
    description: c.metaDescription,
    alternates: {
      canonical,
      languages: { 'ru-RU': ruPath, 'en-US': enPath, 'x-default': ruPath },
    },
    openGraph: {
      type: 'website',
      siteName: SITE_NAME,
      locale: lang === 'ru' ? 'ru_RU' : 'en_US',
      url: canonical,
      title: c.metaTitle,
      description: c.metaDescription,
      images: OG_IMAGES,
    },
  }
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

const proposal: Landing = {
  key: 'proposal',
  slugRu: 'predlozhenie-ruki-na-katere',
  slugEn: 'marriage-proposal',
  heroImage: '/images/exp-romantic.webp',
  content: {
    ru: {
      eyebrow: 'Предложение руки и сердца',
      h1: 'Предложение руки и сердца на катере в Санкт-Петербурге',
      heroSubtitle:
        'Самый важный вопрос — наедине, на воде, под огни ночного Петербурга и развод мостов. Катер с капитаном и вечер, который она запомнит навсегда.',
      metaTitle:
        'Предложение руки и сердца на катере в СПб — аренда с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Организуем предложение руки и сердца на катере в Санкт-Петербурге. Приватная прогулка по Неве, закат, развод мостов, ваш сценарий. Катер с капитаном, онлайн-бронирование.',
      intro: [
        'Предложение на катере — это интимный момент без лишних глаз: только вы двое, палуба и город, отражённый в воде. Никакого шумного ресторана — вокруг лишь Нева, мосты и небо белой ночи.',
        'Мы поможем всё подготовить: подберём время под закат или развод мостов, обсудим маршрут и детали сюрприза. От вас — только замысел, остальное на нас.',
      ],
      benefitsTitle: 'Почему предложение лучше сделать на воде',
      benefits: [
        { title: 'Только вы вдвоём', text: 'Катер целиком ваш — момент останется личным, без посторонних.' },
        { title: 'Идеальный фон', text: 'Закат, огни набережных и развод мостов — декорации, которые не повторить.' },
        { title: 'Помощь со сценарием', text: 'Подскажем, как обыграть момент, подберём время и маршрут под задумку.' },
        { title: 'Фото на память', text: 'Золотой час на воде — лучшие кадры для помолвки. Фотографа можно взять с собой.' },
        { title: 'Капитан и комфорт', text: 'Опытный капитан, тёплый салон и пледы — тепло и спокойно в любую погоду.' },
        { title: 'Бронирование онлайн', text: 'Выберите катер и дату на сайте — менеджер поможет с деталями.' },
      ],
      faqTitle: 'Частые вопросы про предложение на катере',
      faq: [
        { q: 'Можно ли всё организовать в тайне от второй половинки?', a: 'Да, детали обсуждаем только с вами. Расскажите замысел — поможем подготовить сюрприз незаметно.' },
        { q: 'Можно ли украсить катер?', a: 'Да, оформление (цветы, свечи, шары) возможно. Уточните детали у менеджера при бронировании.' },
        { q: 'Когда лучше выходить — на закат или на мосты?', a: 'Оба варианта эффектны. Закат даёт мягкий свет для фото, развод мостов — драматичный финал вечера. Поможем выбрать.' },
        { q: 'Можно ли взять фотографа?', a: 'Да, вы можете пригласить своего фотографа на борт.' },
        { q: 'Как забронировать катер для предложения?', a: 'Выберите катер и дату в разделе «Флот», оставьте заявку — менеджер свяжется и поможет с деталями.' },
      ],
    },
    en: {
      eyebrow: 'Marriage proposal in Saint Petersburg',
      h1: 'Marriage Proposal on a Boat in Saint Petersburg',
      heroSubtitle:
        'The most important question — just the two of you, on the water, under the lights of Saint Petersburg and the opening bridges. A boat with a captain and an evening she will never forget.',
      metaTitle: 'Marriage Proposal Boat Rental in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Plan a marriage proposal on a boat in Saint Petersburg. A private cruise on the Neva, sunset, opening bridges, your scenario. A boat with a captain, book online.',
      intro: [
        'A proposal on a boat is an intimate moment away from prying eyes: just the two of you, the deck and the city reflected in the water. No crowded restaurant — only the Neva, the bridges and the White Nights sky.',
        'We help you prepare everything: choosing the time for sunset or the opening bridges, the route and the details of the surprise. You bring the idea — we handle the rest.',
      ],
      benefitsTitle: 'Why the water makes the perfect proposal',
      benefits: [
        { title: 'Just the two of you', text: 'The whole boat is yours — the moment stays private, with no onlookers.' },
        { title: 'A flawless backdrop', text: 'Sunset, embankment lights and the opening bridges — scenery you cannot recreate.' },
        { title: 'Help with the scenario', text: 'We suggest how to stage the moment and pick the time and route for your idea.' },
        { title: 'Photos to keep', text: 'Golden hour on the water makes the best engagement shots. You are welcome to bring a photographer.' },
        { title: 'Captain and comfort', text: 'An experienced captain, a warm saloon and blankets — cosy in any weather.' },
        { title: 'Book online', text: 'Pick a boat and a date on the site — a manager will help with the details.' },
      ],
      faqTitle: 'Marriage proposal on a boat — frequently asked questions',
      faq: [
        { q: 'Can it be kept secret from my partner?', a: 'Yes, we discuss the details only with you. Tell us your idea and we will help prepare the surprise discreetly.' },
        { q: 'Can the boat be decorated?', a: 'Yes, decoration (flowers, candles, balloons) is possible. Please confirm the details with the manager when booking.' },
        { q: 'Which is better — sunset or the bridges?', a: 'Both are spectacular. Sunset gives soft light for photos; the opening bridges make a dramatic finale. We will help you choose.' },
        { q: 'Can I bring a photographer?', a: 'Yes, you are welcome to bring your own photographer on board.' },
        { q: 'How do I book a boat for a proposal?', a: 'Pick a boat and a date in the Fleet section and leave a request — a manager will get in touch and help with the details.' },
      ],
    },
  },
}

const corporate: Landing = {
  key: 'corporate',
  slugRu: 'korporativ-na-katere',
  slugEn: 'corporate-event',
  heroImage: '/images/exp-corporate.webp',
  content: {
    ru: {
      eyebrow: 'Корпоратив на воде',
      h1: 'Корпоратив на катере и яхте в Санкт-Петербурге',
      heroSubtitle:
        'Команда, город с воды и вечер вне офиса. Аренда катера или яхты с капитаном под корпоратив — своим составом, по вашему сценарию.',
      metaTitle:
        'Корпоратив на катере в Санкт-Петербурге — аренда яхты с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Аренда катера и яхты на корпоратив в Санкт-Петербурге с капитаном. Прогулка по Неве, кейтеринг, музыка, ваш сценарий вечера. Группы до 12 гостей. Онлайн-бронирование.',
      intro: [
        'Корпоратив на катере — это смена обстановки, которая сближает команду лучше любого ресторана. Общий вид на город с воды, свежий воздух и вечер, который запомнится не пунктами тимбилдинга, а атмосферой.',
        'Мы берём на себя судно, капитана и маршрут. Поможем с организацией: кейтеринг, музыка, тайминг под развод мостов — под формат вашего мероприятия.',
      ],
      benefitsTitle: 'Почему корпоратив на катере работает',
      benefits: [
        { title: 'Ваша команда целиком', text: 'Судно только для вас — без чужих людей и постороннего шума.' },
        { title: 'Город с лучшей точки', text: 'Нева, набережные и развод мостов — впечатление, которое обсуждают потом.' },
        { title: 'Кейтеринг и музыка', text: 'Поможем организовать угощение и звук; привезти своё тоже можно.' },
        { title: 'Гибкий формат', text: 'От спокойного фуршета до активного вечера — сценарий под вашу задачу.' },
        { title: 'Капитан и безопасность', text: 'Опытный капитан за штурвалом, спасательный жилет на каждого гостя.' },
        { title: 'Документы и бронь', text: 'Работаем с юрлицами; бронирование и детали — через менеджера.' },
      ],
      faqTitle: 'Частые вопросы про корпоратив на катере',
      faq: [
        { q: 'Сколько человек можно разместить?', a: 'В зависимости от судна — до 12 гостей на катер. Для больших групп подберём несколько судов.' },
        { q: 'Можно ли организовать кейтеринг?', a: 'Да, поможем с угощением и напитками, либо вы привозите своё. Обсудим при бронировании.' },
        { q: 'Работаете ли с юридическими лицами?', a: 'Да, оформляем аренду для компаний. Детали и документы — через менеджера.' },
        { q: 'Есть ли музыка и звук на борту?', a: 'Да, на катерах есть аудиосистема — можно подключить свой плейлист или ведущего.' },
        { q: 'Как забронировать катер на корпоратив?', a: 'Выберите судно и дату в разделе «Флот», оставьте заявку — менеджер согласует детали и формат.' },
      ],
    },
    en: {
      eyebrow: 'Corporate event on the water',
      h1: 'Corporate Event on a Boat or Yacht in Saint Petersburg',
      heroSubtitle:
        'Your team, the city from the water and an evening out of the office. Rent a boat or yacht with a captain for your corporate event — your group, your scenario.',
      metaTitle: 'Corporate Event Boat & Yacht Rental in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Rent a boat or yacht for a corporate event in Saint Petersburg with a captain. A Neva cruise, catering, music, your scenario. Groups up to 12 guests. Book online.',
      intro: [
        'A corporate event on a boat is a change of scene that brings a team together better than any restaurant. A shared view of the city from the water, fresh air and an evening remembered for its atmosphere, not its team-building agenda.',
        'We take care of the vessel, the captain and the route. We help with the arrangements: catering, music and timing around the opening bridges — to fit the format of your event.',
      ],
      benefitsTitle: 'Why a boat works for a corporate event',
      benefits: [
        { title: 'Your whole team', text: 'The vessel is yours alone — no strangers and no outside noise.' },
        { title: 'The city from the best seat', text: 'The Neva, the embankments and the opening bridges — an impression people talk about afterwards.' },
        { title: 'Catering and music', text: 'We help arrange food and sound; you are also welcome to bring your own.' },
        { title: 'A flexible format', text: 'From a relaxed reception to a lively evening — the scenario fits your goal.' },
        { title: 'Captain and safety', text: 'An experienced captain at the helm and a life vest for every guest.' },
        { title: 'Invoicing and booking', text: 'We work with companies; booking and details go through a manager.' },
      ],
      faqTitle: 'Corporate event on a boat — frequently asked questions',
      faq: [
        { q: 'How many people fit on board?', a: 'Up to 12 guests per boat, depending on the vessel. For larger groups we can arrange several boats.' },
        { q: 'Can you arrange catering?', a: 'Yes, we help with food and drinks, or you can bring your own. We will discuss it when booking.' },
        { q: 'Do you work with companies?', a: 'Yes, we arrange rentals for companies. Details and paperwork go through a manager.' },
        { q: 'Is there music and sound on board?', a: 'Yes, the boats have a sound system — you can connect a playlist or a host.' },
        { q: 'How do I book a boat for a corporate event?', a: 'Pick a vessel and a date in the Fleet section and leave a request — a manager will agree the details and format.' },
      ],
    },
  },
}

const whitenights: Landing = {
  key: 'whitenights',
  slugRu: 'belye-nochi-razvod-mostov',
  slugEn: 'white-nights',
  heroImage: '/images/exp-white-nights.webp',
  content: {
    ru: {
      eyebrow: 'Белые ночи и развод мостов',
      h1: 'Прогулка на катере в белые ночи и развод мостов',
      heroSubtitle:
        'Главное зрелище петербургского лета — с воды. Ночь, которая не темнеет, разводные мосты над Невой и катер с капитаном только для вашей компании.',
      metaTitle:
        'Белые ночи и развод мостов на катере в СПб — аренда с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Аренда катера на белые ночи и развод мостов в Санкт-Петербурге с капитаном. Ночная прогулка по Неве под разводку мостов, ваш состав. Онлайн-бронирование.',
      intro: [
        'Развод мостов — то, ради чего в Петербург едут летом. Но с набережной вы видите его в толпе и издалека, а с воды — вблизи, без спешки и чужих спин. Катер выходит к самому центру событий.',
        'Мы рассчитываем маршрут по графику разводки мостов, чтобы вы застали её в лучший момент. Белые ночи добавляют света, которого не бывает больше нигде.',
      ],
      benefitsTitle: 'Почему белые ночи стоит встречать на воде',
      benefits: [
        { title: 'Мосты вблизи', text: 'Разводку видно с воды так, как не увидеть с набережной — без толпы и почти на расстоянии вытянутой руки.' },
        { title: 'Точный тайминг', text: 'Строим маршрут по графику разводки — застанете главный момент.' },
        { title: 'Только ваша компания', text: 'Катер целиком ваш: никаких экскурсионных групп и общего расписания.' },
        { title: 'Свет белых ночей', text: 'Небо, которое не темнеет, — идеальный фон для фото и просто для вечера.' },
        { title: 'Тепло на борту', text: 'Ночью на воде свежо — тёплый салон и пледы согреют.' },
        { title: 'Капитан и бронь', text: 'Опытный капитан за штурвалом, бронирование — онлайн.' },
      ],
      faqTitle: 'Частые вопросы про белые ночи и мосты',
      faq: [
        { q: 'В какие даты разводят мосты?', a: 'Навигация обычно с конца апреля по ноябрь; белые ночи — с конца мая по середину июля. Точный график разводки подскажем.' },
        { q: 'Во сколько выходить на воду?', a: 'Разводка начинается ночью (ориентировочно с 01:00). Точное время выхода подберём под график и ваш маршрут.' },
        { q: 'Сколько длится прогулка?', a: 'Обычно 2–3 часа, чтобы спокойно застать разводку. Длительность обсудим при бронировании.' },
        { q: 'Что взять с собой?', a: 'Тёплую одежду — ночью на воде прохладно. Пледы есть на борту, напитки можно привезти свои.' },
        { q: 'Как забронировать катер на белые ночи?', a: 'Выберите катер и дату в разделе «Флот», оставьте заявку — менеджер подберёт время под разводку.' },
      ],
    },
    en: {
      eyebrow: 'White Nights & opening bridges',
      h1: 'White Nights & Bridge Opening Boat Tour in Saint Petersburg',
      heroSubtitle:
        'The highlight of the Petersburg summer — from the water. A night that never fully darkens, the drawbridges over the Neva and a boat with a captain just for your group.',
      metaTitle: 'White Nights & Bridge Opening Boat Tour in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Rent a boat for the White Nights and bridge opening in Saint Petersburg with a captain. A night cruise on the Neva timed to the drawbridges, your group. Book online.',
      intro: [
        'The opening bridges are what draws people to Saint Petersburg in summer. From the embankment you see them in a crowd and from afar; from the water you see them up close, unhurried, with no one in your way. The boat takes you to the heart of it.',
        'We plan the route around the bridge-opening schedule so you catch it at the best moment. The White Nights add a light you will not find anywhere else.',
      ],
      benefitsTitle: 'Why meet the White Nights on the water',
      benefits: [
        { title: 'Bridges up close', text: 'From the water you see the opening as you never could from the embankment — no crowd, almost within arm’s reach.' },
        { title: 'Precise timing', text: 'We build the route around the opening schedule — you catch the key moment.' },
        { title: 'Your group only', text: 'The whole boat is yours: no tour groups and no shared timetable.' },
        { title: 'The White Nights light', text: 'A sky that never darkens — a perfect backdrop for photos and for the evening itself.' },
        { title: 'Warm on board', text: 'It is fresh on the water at night — a warm saloon and blankets keep you cosy.' },
        { title: 'Captain and booking', text: 'An experienced captain at the helm; book online.' },
      ],
      faqTitle: 'White Nights & bridges — frequently asked questions',
      faq: [
        { q: 'When are the bridges raised?', a: 'The navigation season usually runs from late April to November; the White Nights from late May to mid-July. We will share the exact opening schedule.' },
        { q: 'What time do we set off?', a: 'The opening starts at night (roughly from 01:00). We will pick the departure time to fit the schedule and your route.' },
        { q: 'How long is the cruise?', a: 'Usually 2–3 hours, enough to catch the opening without rushing. We will agree the duration when booking.' },
        { q: 'What should I bring?', a: 'Warm clothes — it is chilly on the water at night. Blankets are on board and you may bring your own drinks.' },
        { q: 'How do I book a White Nights cruise?', a: 'Pick a boat and a date in the Fleet section and leave a request — a manager will set the time around the opening.' },
      ],
    },
  },
}

const birthday: Landing = {
  key: 'birthday',
  slugRu: 'den-rozhdeniya-na-katere',
  slugEn: 'birthday',
  heroImage: '/images/exp-birthday.webp',
  content: {
    ru: {
      eyebrow: 'День рождения на воде',
      h1: 'День рождения на катере в Санкт-Петербурге',
      heroSubtitle:
        'Отметить день рождения так, как не получится в кафе: своей компанией, с музыкой и видом на ночной город. Катер с капитаном — вечер по вашему сценарию.',
      metaTitle:
        'День рождения на катере в Санкт-Петербурге — аренда с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Аренда катера на день рождения в Санкт-Петербурге с капитаном. Прогулка по Неве, музыка, свой торт и напитки, ваш сценарий. Катера до 12 гостей. Онлайн-бронирование.',
      intro: [
        'День рождения на катере — это праздник, который не втиснут в столик у окна. Весь борт ваш: приглашённые, музыка, торт и город, проплывающий мимо. Никаких соседних компаний и закрытия в полночь.',
        'Мы берём на себя катер, капитана и маршрут. Свой торт, напитки и плейлист — привозите; поможем подобрать время под закат или развод мостов.',
      ],
      benefitsTitle: 'Почему день рождения на катере запомнится',
      benefits: [
        { title: 'Только ваши гости', text: 'Катер целиком в вашем распоряжении — без чужих людей и общего зала.' },
        { title: 'Свой торт и напитки', text: 'Привозите угощение и напитки с собой — стол по вашему вкусу.' },
        { title: 'Музыка на борту', text: 'Аудиосистема на катере — подключайте свой плейлист.' },
        { title: 'Город как декорация', text: 'Нева, набережные и развод мостов — фон, который не забудут гости.' },
        { title: 'Капитан и безопасность', text: 'Опытный капитан, спасательный жилет на каждого гостя.' },
        { title: 'Бронирование онлайн', text: 'Выберите катер и дату на сайте — менеджер подтвердит детали.' },
      ],
      faqTitle: 'Частые вопросы про день рождения на катере',
      faq: [
        { q: 'Сколько гостей помещается?', a: 'В зависимости от катера — от 4 до 12 человек. Вместимость указана в карточке каждого судна.' },
        { q: 'Можно ли привезти свой торт и напитки?', a: 'Да, конечно. Торт, напитки и закуски можно взять с собой.' },
        { q: 'Можно ли украсить катер?', a: 'Да, оформление возможно — уточните детали у менеджера при бронировании.' },
        { q: 'Есть ли музыка на борту?', a: 'Да, на катерах есть аудиосистема для вашего плейлиста.' },
        { q: 'Как забронировать катер на день рождения?', a: 'Выберите катер и дату в разделе «Флот», оставьте заявку — менеджер свяжется и подтвердит бронь.' },
      ],
    },
    en: {
      eyebrow: 'Birthday on the water',
      h1: 'Birthday Party on a Boat in Saint Petersburg',
      heroSubtitle:
        'Celebrate a birthday the way a café never allows: your crew, your music and a view of the night city. A boat with a captain — the evening on your terms.',
      metaTitle: 'Birthday Party Boat Rental in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Rent a boat for a birthday party in Saint Petersburg with a captain. A Neva cruise, music, your own cake and drinks, your scenario. Boats up to 12 guests. Book online.',
      intro: [
        'A birthday on a boat is a celebration that will not be squeezed into a table by the window. The whole deck is yours: your guests, the music, the cake and the city drifting past. No neighbouring parties and no midnight closing time.',
        'We take care of the boat, the captain and the route. Bring your own cake, drinks and playlist; we will help pick the time for sunset or the opening bridges.',
      ],
      benefitsTitle: 'Why a birthday on a boat is unforgettable',
      benefits: [
        { title: 'Your guests only', text: 'The whole boat is yours — no strangers and no shared hall.' },
        { title: 'Your cake and drinks', text: 'Bring your own food and drinks — a table to your taste.' },
        { title: 'Music on board', text: 'A sound system on the boat — plug in your playlist.' },
        { title: 'The city as your set', text: 'The Neva, the embankments and the opening bridges — a backdrop your guests will remember.' },
        { title: 'Captain and safety', text: 'An experienced captain and a life vest for every guest.' },
        { title: 'Book online', text: 'Pick a boat and a date on the site — a manager will confirm the details.' },
      ],
      faqTitle: 'Birthday on a boat — frequently asked questions',
      faq: [
        { q: 'How many guests fit?', a: 'Between 4 and 12 people depending on the boat. The capacity is listed on each boat card.' },
        { q: 'Can we bring our own cake and drinks?', a: 'Yes, of course. You are welcome to bring the cake, drinks and snacks.' },
        { q: 'Can the boat be decorated?', a: 'Yes, decoration is possible — please confirm the details with the manager when booking.' },
        { q: 'Is there music on board?', a: 'Yes, the boats have a sound system for your playlist.' },
        { q: 'How do I book a boat for a birthday?', a: 'Pick a boat and a date in the Fleet section and leave a request — a manager will get in touch and confirm the booking.' },
      ],
    },
  },
}

const bachelorette: Landing = {
  key: 'bachelorette',
  slugRu: 'devichnik-na-katere',
  slugEn: 'bachelorette-party',
  heroImage: '/images/exp-bachelorette.webp',
  content: {
    ru: {
      eyebrow: 'Девичник в Санкт-Петербурге',
      h1: 'Девичник на катере в Санкт-Петербурге',
      heroSubtitle:
        'Особенный вечер для своих — на воде, с музыкой, шампанским и огнями ночного города. Катер с капитаном, вечер по вашему сценарию.',
      metaTitle:
        'Девичник на катере в Санкт-Петербурге — аренда с капитаном | Судоходная компания «Дно»',
      metaDescription:
        'Аренда катера на девичник в Санкт-Петербурге с капитаном. Прогулка по Неве и каналам, музыка, свои напитки, фотосессия, ваш сценарий. Катера до 12 гостей. Онлайн-бронирование.',
      intro: [
        'Девичник на катере — это вечер только для своих, без чужих взглядов и шумного клуба. Весь борт ваш: подруги, музыка, шампанское и Петербург, проплывающий мимо на закате.',
        'Мы берём на себя катер, капитана и маршрут — вам остаётся собрать компанию и выбрать дату. Хотите спокойный вечер с видами и фотосессией, а хотите — драйв на скорости по открытой воде.',
      ],
      benefitsTitle: 'Почему девичник на катере — это то, что нужно',
      benefits: [
        { title: 'Только свои', text: 'Катер целиком ваш — никаких чужих людей и общего зала.' },
        { title: 'Фон для фото', text: 'Закат, набережные и развод мостов — идеальные кадры для вечера.' },
        { title: 'Музыка и шампанское', text: 'Аудиосистема на борту, свои напитки и угощение — привозите что хотите.' },
        { title: 'Оформление', text: 'Шары, цветы, декор под тематику вечера — поможем организовать.' },
        { title: 'Капитан и комфорт', text: 'Опытный капитан, тёплый салон и пледы — уютно в любую погоду.' },
        { title: 'Бронирование онлайн', text: 'Выберите катер и дату на сайте — менеджер подтвердит детали.' },
      ],
      faqTitle: 'Частые вопросы про девичник на катере',
      faq: [
        { q: 'Сколько человек помещается на катер?', a: 'В зависимости от судна — от 4 до 12 гостей. Вместимость указана в карточке каждого катера в разделе «Флот».' },
        { q: 'Можно ли привезти свои напитки и угощение?', a: 'Да, шампанское, напитки и закуски можно взять с собой. Детали уточните у менеджера.' },
        { q: 'Можно ли украсить катер?', a: 'Да, оформление (шары, цветы, декор) возможно — обсудите с менеджером при бронировании.' },
        { q: 'Есть ли музыка на борту?', a: 'Да, на катерах есть аудиосистема — можно подключить свой плейлист.' },
        { q: 'Как забронировать катер на девичник?', a: 'Выберите катер и дату в разделе «Флот» и оставьте заявку. Менеджер свяжется и подтвердит бронь.' },
      ],
    },
    en: {
      eyebrow: 'Bachelorette party in Saint Petersburg',
      h1: 'Bachelorette Party on a Boat in Saint Petersburg',
      heroSubtitle:
        'A special night for your closest friends — on the water, with music, champagne and the city lights. A boat with a captain, the evening on your terms.',
      metaTitle: 'Bachelorette Party Boat Rental in Saint Petersburg — With a Captain | Dno',
      metaDescription:
        'Rent a boat for a bachelorette party in Saint Petersburg with a captain. Cruise the Neva and canals, music, your own drinks, a photo session, your night. Boats for up to 12 guests. Book online.',
      intro: [
        'A bachelorette party on a boat is a night for your circle only — no strangers and no crowded club. The whole deck is yours: your friends, the music, the champagne and Saint Petersburg drifting past at sunset.',
        'We take care of the boat, the captain and the route — you gather the group and pick the date. Keep it calm with the views and a photo session, or open the throttle for a rush across the open water.',
      ],
      benefitsTitle: 'Why a boat is made for a bachelorette party',
      benefits: [
        { title: 'Your circle only', text: 'The whole boat is yours — no strangers and no shared hall.' },
        { title: 'A backdrop for photos', text: 'Sunset, embankments and the opening bridges — perfect shots for the night.' },
        { title: 'Music and champagne', text: 'A sound system on board; bring your own drinks and treats.' },
        { title: 'Decoration', text: 'Balloons, flowers and décor to match your theme — we help arrange it.' },
        { title: 'Captain and comfort', text: 'An experienced captain, a warm saloon and blankets — cosy in any weather.' },
        { title: 'Book online', text: 'Pick a boat and a date on the site — a manager will confirm the details.' },
      ],
      faqTitle: 'Bachelorette party boat — frequently asked questions',
      faq: [
        { q: 'How many people fit on a boat?', a: 'Between 4 and 12 guests depending on the boat. The exact capacity is listed on each boat card in the Fleet section.' },
        { q: 'Can we bring our own drinks and treats?', a: 'Yes, champagne, drinks and snacks are welcome on board. Please confirm the details with the manager.' },
        { q: 'Can the boat be decorated?', a: 'Yes, decoration (balloons, flowers, décor) is possible — discuss it with the manager when booking.' },
        { q: 'Is there music on board?', a: 'Yes, the boats have a sound system — you can connect your own playlist.' },
        { q: 'How do I book a boat for a bachelorette party?', a: 'Pick a boat and a date in the Fleet section and leave a request. A manager will contact you and confirm the booking.' },
      ],
    },
  },
}

/** Все посадочные страницы. Добавление новой — один объект здесь + два тонких page.tsx. */
export const landings: Landing[] = [bachelor, bachelorette, proposal, corporate, whitenights, birthday]

/** Найти лендинг по ключу (для страниц). */
export function getLanding(key: string): Landing {
  const l = landings.find((x) => x.key === key)
  if (!l) throw new Error(`Landing not found: ${key}`)
  return l
}
