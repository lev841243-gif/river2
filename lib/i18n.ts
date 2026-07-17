export type Lang = 'ru' | 'en'

/** Build a public URL for a boat photo, encoding the Cyrillic folder name. */
export const boatImg = (dir: string, file: string) => `/boats/${encodeURI(dir)}/${file}`

/**
 * Каналы связи с менеджером. Бронирование идёт формой на сайте — эти ссылки
 * нужны только для живого контакта (вопросы, нестандартные запросы).
 */
export const contacts = {
  /** Номер администратора для звонка. На сайте не отображается — только набирается при клике. */
  phoneHref: 'tel:+79219994996',
  /** ЗАГЛУШКА: подтвердить/заменить на реальный @username Telegram менеджера. */
  telegram: 'https://t.me/prokatkaterov',
  /** Номер администратора — тот же, что и для звонка. */
  whatsapp: 'https://wa.me/79219994996',
  /** Instagram ещё не заведён — кнопка не кликается, показывает «в разработке». */
  instagram: null as string | null,
  /** MAX: нужен адрес канала (логотип уже есть). */
  max: null as string | null,
  /** Организация на Яндекс.Картах — «Причал 3». */
  yandexMaps:
    'https://yandex.ru/maps/org/prichal_3/236930914911/?ll=30.321620%2C59.952951&z=17',
  /** Google Maps ещё не заведён — кнопка не кликается. */
  googleMaps: null as string | null,
}

/**
 * Реквизиты для подвала.
 * TODO: заказчик пришлёт ИНН и ОГРН — до этого вместо цифр стоит прочерк.
 * Заполнить обязательно до переключения основного домена.
 */
export const legal = {
  companyName: 'Судоходная Компания «Дно»',
  inn: null as string | null,
  ogrn: null as string | null,
}

export interface Boat {
  id: string
  dir: string
  cover: string
  photos: string[]
  price: number | null
  isNew?: boolean
  /** Флагман флота: вместо кричащего ярлыка — сдержанная золотая корона. */
  premium?: boolean
  badge?: Record<Lang, string>
  name: Record<Lang, string>
  desc: Record<Lang, string>
  /** [length, beam, height, speed, capacity] — localized display strings */
  specs: Record<Lang, [string, string, string, string, string]> | null
  amenities: Record<Lang, string[]>
}

export const boats: Boat[] = [
  {
    id: 'princess-68',
    dir: 'princess 68',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp'],
    price: 55000,
    name: { ru: 'Princess 68', en: 'Princess 68' },
    premium: true,
    desc: {
      ru: 'Двухпалубная премиум-яхта длиной 23 метра для по-настоящему грандиозного вечера. Караоке, простор для вечеринки и даже возможность подать гидроцикл — устройте феерию на воде для компании до 10 человек.',
      en: 'A 23-metre two-deck premium yacht for a truly grand evening. Karaoke, room to party and even the option to bring a jet-ski — an unforgettable celebration on the water for up to 10 guests.',
    },
    specs: {
      ru: ['23 м', '5,3 м', '5,5 м', 'до 55 км/ч', 'до 10 гостей'],
      en: ['23 m', '5.3 m', '5.5 m', 'up to 55 km/h', 'up to 10 guests'],
    },
    amenities: {
      ru: ['Караоке', 'Две палубы', 'Место под гидроцикл', 'Премиум-салон'],
      en: ['Karaoke', 'Two decks', 'Jet-ski option', 'Premium saloon'],
    },
  },
  {
    id: 'galeon-640',
    dir: 'GALEON 640',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp', '06.webp', '07.webp', '08.webp', '09.webp', '10.webp', '11.webp', '12.webp', '13.webp', '14.webp'],
    price: 50000,
    name: { ru: 'Galeon 640', en: 'Galeon 640' },
    premium: true,
    desc: {
      ru: 'Премиальная двухпалубная супер-яхта — вершина нашего флота. Кожаный салон и дорогие материалы, отдельные каюты, камбуз, душ и санузел. Максимум простора и статуса для особого события.',
      en: 'A premium two-deck super-yacht — the pinnacle of our fleet. A leather saloon and fine materials, private cabins, a galley, shower and washroom. Ultimate space and prestige for a special occasion.',
    },
    specs: {
      ru: ['20 м', '5,3 м', '5,5 м', 'до 55 км/ч', 'до 12 гостей'],
      en: ['20 m', '5.3 m', '5.5 m', 'up to 55 km/h', 'up to 12 guests'],
    },
    amenities: {
      ru: ['Две палубы', 'Кожаный салон', 'Каюты', 'Камбуз', 'Душ', 'Санузел', 'Место под гидроцикл'],
      en: ['Two decks', 'Leather saloon', 'Cabins', 'Galley', 'Shower', 'Washroom', 'Jet-ski option'],
    },
  },
  {
    id: 'formula-34',
    dir: 'АРЕНДА КАТЕРА FORMULA 34',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp', '06.webp', '07.webp'],
    price: 25000,
    name: { ru: 'Formula 34', en: 'Formula 34' },
    desc: {
      ru: 'Скоростной 12-метровый катер с просторным кожаным салоном и большой кроватью — для тех, кто привык к лучшему. Дойдёт до Петергофа, фортов и Ладоги.',
      en: 'A 12-metre speedster with a spacious leather saloon and a full-size bed — for those used to the best. It reaches Peterhof, the forts and Lake Ladoga.',
    },
    specs: {
      ru: ['12 м', '3,4 м', '2,6 м', 'до 90 км/ч', 'до 10 гостей'],
      en: ['12 m', '3.4 m', '2.6 m', 'up to 90 km/h', 'up to 10 guests'],
    },
    amenities: {
      ru: ['Большая кровать', 'Кожаный салон', 'Мобильный стол', 'Мощная аудиосистема с USB', 'Туалет', 'Холодильник'],
      en: ['Full-size bed', 'Leather saloon', 'Portable table', 'Powerful USB sound system', 'Toilet', 'Fridge'],
    },
  },
  {
    id: 'formula-310ss',
    dir: 'АРЕНДА КАТЕРА Formula 310ss (НОВИНКА!)',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp'],
    price: 20000,
    isNew: true,
    name: { ru: 'Formula 310 SS', en: 'Formula 310 SS' },
    desc: {
      ru: 'Новинка сезона — быстрый, мощный и совершенно новый. Эксклюзивное предложение на рынке Петербурга для тех, кто ценит безупречный комфорт.',
      en: 'New this season — fast, powerful and brand-new. An exclusive on the St. Petersburg market for those who value flawless comfort.',
    },
    specs: {
      ru: ['10,7 м', '3,3 м', '4 м', 'до 100 км/ч', 'до 11 гостей'],
      en: ['10.7 m', '3.3 m', '4 m', 'up to 100 km/h', 'up to 11 guests'],
    },
    amenities: {
      ru: ['Аудио/видео аппаратура', 'Кожаный салон', 'Мощная аудиосистема с USB', 'Санузел', 'Холодильник'],
      en: ['Audio / video system', 'Leather saloon', 'Powerful USB sound system', 'Washroom', 'Fridge'],
    },
  },
  {
    id: 'formula-31pc',
    dir: 'Аренда катера «Formula 31PC»',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp', '06.webp', '07.webp'],
    price: 19000,
    name: { ru: 'Formula 31 PC', en: 'Formula 31 PC' },
    desc: {
      ru: 'Премиум-уровень: климат-контроль, кофемашина, телевизор и два холодильника. Эксклюзивное предложение на рынке Петербурга.',
      en: 'Premium through and through: climate control, coffee machine, TV and two fridges. An exclusive on the St. Petersburg market.',
    },
    specs: {
      ru: ['11 м', '3,4 м', '2,4 м', 'до 85 км/ч', 'до 11 гостей'],
      en: ['11 m', '3.4 m', '2.4 m', 'up to 85 km/h', 'up to 11 guests'],
    },
    amenities: {
      ru: ['2 холодильника', 'Душ', 'Климат-контроль', 'Кофемашина', 'Мощная аудиосистема с USB', 'Розетка 220В', 'Телевизор', 'Тент (на случай дождя)', 'Туалет'],
      en: ['Two fridges', 'Shower', 'Climate control', 'Coffee machine', 'Powerful USB sound system', '220V socket', 'TV', 'Rain canopy', 'Toilet'],
    },
  },
  {
    id: 'formula-v',
    dir: 'АРЕНДА КАТЕРА Formula V',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp'],
    price: 16000,
    name: { ru: 'Formula V', en: 'Formula V' },
    desc: {
      ru: 'Быстрый, стильный и очень комфортный. Прокатитесь один раз — и точно захотите вернуться.',
      en: 'Fast, stylish and seriously comfortable. One ride and you will already be planning the next.',
    },
    specs: {
      ru: ['10 м', '3 м', '4 м', 'до 75 км/ч', 'до 13 гостей'],
      en: ['10 m', '3 m', '4 m', 'up to 75 km/h', 'up to 13 guests'],
    },
    amenities: {
      ru: ['Мощная аудиосистема с USB', 'Музыкальная подготовка', 'Пледы', 'Туалет'],
      en: ['Powerful USB sound system', 'Aux / music input', 'Blankets', 'Toilet'],
    },
  },
  {
    id: 'maxum',
    dir: 'АРЕНДА КАТЕРА MAXUM',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp'],
    price: 16000,
    name: { ru: 'Maxum', en: 'Maxum' },
    desc: {
      ru: 'Комфортабельный скоростной катер для прогулок по Неве и каналам города — и для дальних маршрутов по Ленинградской области. Просторно, тепло и уютно для компании до 10 человек.',
      en: 'A comfortable, fast cruiser for trips along the Neva and the city canals — and for longer runs across the Leningrad region. Spacious and cosy for a group of up to 10.',
    },
    specs: {
      ru: ['10 м', '3,4 м', '3 м', 'до 80 км/ч', 'до 10 гостей'],
      en: ['10 m', '3.4 m', '3 m', 'up to 80 km/h', 'up to 10 guests'],
    },
    amenities: {
      ru: ['Каюта', 'Музыкальная подготовка', 'Пледы', 'Рукомойник', 'Стол', 'Туалет'],
      en: ['Cabin', 'Music setup', 'Blankets', 'Washbasin', 'Table', 'Toilet'],
    },
  },
  {
    id: 'formula-280ss',
    dir: 'Аренда катера «Formula 280 SS»',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp', '06.webp'],
    price: 13000,
    name: { ru: 'Formula 280 SS', en: 'Formula 280 SS' },
    desc: {
      ru: 'Скоростной катер с кожаным салоном и ходовым тентом. Отличный выбор для яркого отдыха с друзьями или семьёй.',
      en: 'A speedboat with a leather saloon and a rain canopy. A great pick for a lively evening with friends or family.',
    },
    specs: {
      ru: ['9 м', '3 м', '1,5 м', 'до 110 км/ч', 'до 10 гостей'],
      en: ['9 m', '3 m', '1.5 m', 'up to 110 km/h', 'up to 10 guests'],
    },
    amenities: {
      ru: ['Кожаный салон', 'Мобильный стол', 'Мощная аудиосистема с USB', 'Спасательный жилет на каждого', 'Тент (на случай дождя)', 'Тёплые пледы'],
      en: ['Leather saloon', 'Portable table', 'Powerful USB sound system', 'Life vest for every guest', 'Rain canopy', 'Warm blankets'],
    },
  },
  {
    id: 'chaparral-2835',
    dir: 'Аренда катера «Chaparral 2835»',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp'],
    price: 13000,
    name: { ru: 'Chaparral 2835', en: 'Chaparral 2835' },
    desc: {
      ru: 'Круизный катер для любой погоды. Душ, холодильник, тёплые пледы и каюта, которая превращается в спальное место для двоих.',
      en: 'A cruiser built for any weather. Shower, fridge, warm blankets — and a cabin that converts into a berth for two.',
    },
    specs: {
      ru: ['9,2 м', '3 м', '2 м', 'до 90 км/ч', 'до 10 гостей'],
      en: ['9.2 m', '3 m', '2 m', 'up to 90 km/h', 'up to 10 guests'],
    },
    amenities: {
      ru: ['Два мобильных стола', 'Два рукомойника', 'Душ', 'Кожаный салон', 'Мощная аудиосистема с USB', 'Санузел', 'Спасательный жилет на каждого', 'Тент (на случай дождя)', 'Тёплые пледы', 'Холодильник'],
      en: ['Two portable tables', 'Two washbasins', 'Shower', 'Leather saloon', 'Powerful USB sound system', 'Washroom', 'Life vest for every guest', 'Rain canopy', 'Warm blankets', 'Fridge'],
    },
  },
  {
    id: 'tsaritsa',
    dir: 'Царица',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp'],
    price: 12000,
    name: { ru: '«Царица»', en: 'Tsaritsa' },
    desc: {
      ru: 'Уютный катер с кожаным салоном, тёплыми пледами и хорошей музыкой — приятная прогулка по рекам и каналам Петербурга в любой компании.',
      en: 'A cosy boat with a leather saloon, warm blankets and good music — a pleasant cruise along the rivers and canals of St. Petersburg in any company.',
    },
    specs: null,
    amenities: {
      ru: ['Кожаный салон', 'Пледы', 'Музыкальная подготовка'],
      en: ['Leather saloon', 'Blankets', 'Music setup'],
    },
  },
  {
    id: 'formula-206ls',
    dir: 'Аренда катера Formula 206 LS',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp'],
    price: 11000,
    name: { ru: 'Formula 206 LS', en: 'Formula 206 LS' },
    desc: {
      ru: 'Компактный и манёвренный. Хотите — спокойно любуйтесь городом, хотите — на полной скорости ловите драйв. Всё в ваших руках.',
      en: 'Compact and nimble. Cruise gently and take in the city, or open the throttle for a rush of adrenaline — the evening is yours.',
    },
    specs: {
      ru: ['6,5 м', '2,6 м', '2 м', 'до 80 км/ч', 'до 4 гостей'],
      en: ['6.5 m', '2.6 m', '2 m', 'up to 80 km/h', 'up to 4 guests'],
    },
    amenities: {
      ru: ['Музыкальная подготовка', 'Пледы'],
      en: ['Aux / music input', 'Blankets'],
    },
  },
  {
    id: 'bayliner-nahuhol',
    dir: 'Аренда катера «BAYLINER 2350» (Нахухоль)',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp'],
    price: 9000,
    name: { ru: 'Bayliner 2350 «Нахухоль»', en: 'Bayliner 2350 “Nakhukhol”' },
    desc: {
      ru: 'Проверенный катер для прогулок по рекам и каналам. Ходовой тент на случай дождя, кожаный салон и тёплые пледы — комфорт в любую погоду.',
      en: 'A proven boat for river and canal cruises. A rain canopy, leather saloon and warm blankets keep you comfortable in any weather.',
    },
    specs: {
      ru: ['8 м', '2,5 м', '1,2 м', 'до 100 км/ч', 'до 12 гостей'],
      en: ['8 m', '2.5 m', '1.2 m', 'up to 100 km/h', 'up to 12 guests'],
    },
    amenities: {
      ru: ['Кожаный салон', 'Мобильный стол', 'Мощная аудиосистема с USB', 'Спасательный жилет на каждого', 'Тент (на случай дождя)', 'Тёплые пледы'],
      en: ['Leather saloon', 'Portable table', 'Powerful USB sound system', 'Life vest for every guest', 'Rain canopy', 'Warm blankets'],
    },
  },
  {
    id: 'bayliner-pohuhol',
    dir: 'Аренда катера «BayLiner 2350» (Похухоль)',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp'],
    price: 9000,
    name: { ru: 'Bayliner 2350 «Похухоль»', en: 'Bayliner 2350 “Pokhukhol”' },
    desc: {
      ru: 'Уютный катер с открытыми носом и кормой — максимум воздуха, солнца и видов. Современная аудиосистема и тёплый салон для идеального вечера.',
      en: 'A cosy boat with an open bow and stern — all the air, sun and views you want. A modern sound system and warm saloon round off the perfect evening.',
    },
    specs: {
      ru: ['8 м', '2,5 м', '1,2 м', 'до 80 км/ч', 'до 12 гостей'],
      en: ['8 m', '2.5 m', '1.2 m', 'up to 80 km/h', 'up to 12 guests'],
    },
    amenities: {
      ru: ['Кожаный салон', 'Мобильный стол', 'Мощная аудиосистема с USB', 'Открытая корма', 'Открытый нос', 'Спасательный жилет на каждого', 'Тёплые пледы'],
      en: ['Leather saloon', 'Portable table', 'Powerful USB sound system', 'Open stern', 'Open bow', 'Life vest for every guest', 'Warm blankets'],
    },
  },
  {
    id: 'taho-52',
    dir: 'Тахо 52',
    cover: 'cover.webp',
    photos: ['01.webp'],
    price: 8000,
    name: { ru: 'Тахо 52', en: 'Taho 52' },
    desc: {
      ru: 'Компактный катер для уютной прогулки небольшой компанией до 6 человек. Кожаный салон, тёплые пледы и любимая музыка — всё для комфортного вечера на воде.',
      en: 'A compact boat for a cosy trip with a small group of up to 6. A leather saloon, warm blankets and your favourite music — everything for a comfortable evening on the water.',
    },
    specs: {
      ru: ['—', '—', '—', '—', 'до 6 гостей'],
      en: ['—', '—', '—', '—', 'up to 6 guests'],
    },
    amenities: {
      ru: ['Кожаный салон', 'Пледы', 'Музыкальная подготовка'],
      en: ['Leather saloon', 'Blankets', 'Music setup'],
    },
  },
  {
    id: 'zig-zag',
    dir: 'Аренда Катера «Зиг Заг»',
    cover: 'cover.webp',
    photos: ['01.webp', '02.webp', '03.webp', '04.webp', '05.webp'],
    price: 7000,
    name: { ru: '«Зиг Заг»', en: 'Zig Zag' },
    desc: {
      ru: 'Самый доступный вход в мир прогулок по воде. Уютный закрытый салон и тёплые пледы — комфортно даже прохладным вечером, от каналов до Финского залива.',
      en: 'The easiest way into life on the water. A cosy enclosed saloon and warm blankets stay comfortable even on a cool evening — from the canals to the Gulf of Finland.',
    },
    specs: {
      ru: ['8,5 м', '3 м', '2,2 м', 'до 35 км/ч', 'до 11 гостей'],
      en: ['8.5 m', '3 m', '2.2 m', 'up to 35 km/h', 'up to 11 guests'],
    },
    amenities: {
      ru: ['Закрытый салон', 'Музыкальная подготовка', 'Рукомойники', 'Санузел', 'Стол', 'Тёплые пледы'],
      en: ['Enclosed saloon', 'Aux / music input', 'Washbasins', 'Washroom', 'Table', 'Warm blankets'],
    },
  },
]

interface NavLink { label: string; href: string }
interface ExperienceItem { title: string; caption: string; image: string; span: string }
interface Reason { title: string; text: string }
interface RouteItem { title: string; description: string; image: string; duration: string; price: string; stops: string }
interface Review { quote: string; name: string; context: string; photo: string }
interface FaqItem { q: string; a: string }

export interface Dict {
  brand: { wordmark: string; tagline: string; full: string }
  contact: { call: string; callAdmin: string; telegram: string; whatsapp: string; managerNote: string; inDevelopment: string }
  nav: { links: NavLink[]; cta: string; city: string }
  owner: { highlight: string; line: string; points: string[] }
  hero: { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string }
  experiences: { eyebrow: string; title: string; subtitle: string; items: ExperienceItem[] }
  fleet: {
    eyebrow: string; title: string; subtitle: string
    perHour: string; onRequest: string; book: string; details: string
    isNew: string; premium: string; captainOnly: string
    specLabels: [string, string, string, string, string]
    amenitiesTitle: string; bookThis: string; specsOnRequest: string; close: string
    extrasTitle: string; extras: string[]
  }
  why: { eyebrow: string; title: string; reasons: Reason[]; rating: string; ratingText: string }
  routes: { eyebrow: string; title: string; items: RouteItem[] }
  expeditions: { eyebrow: string; title: string; subtitle: string; items: string[]; note: string; cta: string }
  gallery: { eyebrow: string; title: string }
  testimonials: { eyebrow: string; title: string; reviews: Review[] }
  faq: { eyebrow: string; title: string; subtitle: string; items: FaqItem[] }
  cta: { eyebrow: string; title: string; subtitle: string; primary: string; secondary: string }
  footer: { tagline: string; explore: string; contact: string; follow: string; address: string[]; rights: string; privacy: string; terms: string; findUs: string; yandexMaps: string; googleMaps: string }
  booking: {
    title: string; subtitle: string
    boatLabel: string; boatPlaceholder: string
    dateLabel: string; timeFromLabel: string; timeToLabel: string
    durationSelectLabel: string
    guestsLabel: string
    nameLabel: string; namePlaceholder: string
    phoneLabel: string; phonePlaceholder: string
    telegramLabel: string; telegramPlaceholder: string
    commentLabel: string; commentPlaceholder: string
    next: string; back: string; submit: string; submitting: string; close: string
    requiredError: string; phoneError: string; nameError: string
    pickDateFirst: string; pickTimeFirst: string
    loadingSlots: string; noSlots: string
    durationLabel: string; hoursShort: string
    priceLabel: string; priceOnRequest: string
    timeNote: string
    successTitle: string; successText: string; successNote: string
    errorTitle: string; errorText: string; contactManager: string
    busyTitle: string; busyText: string
    rejection: { PAST: string; TOO_SHORT: string; TOO_LONG: string; TOO_FAR: string; BOAT_BUSY: string }
  }
}

export const dict: Record<Lang, Dict> = {
  ru: {
    brand: { wordmark: 'Судоходная Компания Дно', tagline: 'Санкт-Петербург', full: 'Судоходная Компания Дно' },
    contact: {
      call: 'Позвонить',
      callAdmin: 'Позвонить администратору',
      telegram: 'Написать в Telegram',
      whatsapp: 'Написать в WhatsApp',
      managerNote: 'Есть вопрос? Напишите менеджеру — ответим в рабочее время.',
      inDevelopment: 'В разработке',
    },
    nav: {
      links: [
        { label: 'Впечатления', href: '#experiences' },
        { label: 'Флот', href: '#fleet' },
        { label: 'Маршруты', href: '#routes' },
        { label: 'Галерея', href: '#gallery' },
        { label: 'Отзывы', href: '#reviews' },
        { label: 'Вопросы', href: '#faq' },
      ],
      cta: 'Выбрать катер',
      city: 'Санкт-Петербург',
    },
    owner: {
      highlight: 'Собственники флота.',
      line: 'Работаем с вами напрямую, без посредников — и предлагаем эксклюзивные условия на рынке Петербурга уже более 20 лет.',
      points: ['Собственный флот', 'Без посредников', 'Эксклюзив на рынке'],
    },
    hero: {
      eyebrow: 'Частные прогулки по Неве',
      title: 'Петербург с воды — таким, каким его стоит увидеть',
      subtitle: 'Частные прогулки на катере с профессиональным капитаном. Вечер на реке, который останется с вами надолго.',
      primary: 'Выбрать катер',
      secondary: 'Смотреть флот',
    },
    experiences: {
      eyebrow: 'Впечатления',
      title: 'Какой вечер вы хотите провести?',
      subtitle: 'Вы выбираете не катер, а настроение — а мы выстроим вокруг него весь вечер.',
      items: [
        { title: 'Романтический вечер', caption: 'Только вы вдвоём', image: '/images/exp-romantic.png', span: 'lg:col-span-2 lg:row-span-2' },
        { title: 'Белые ночи и развод мостов', caption: 'Город, который не спит', image: '/images/exp-white-nights.png', span: 'lg:col-span-2' },
        { title: 'День рождения', caption: 'Вечер, который запомнится', image: '/images/exp-birthday.png', span: '' },
        { title: 'Корпоратив', caption: 'Впечатлите каждого гостя', image: '/images/exp-corporate.png', span: '' },
        { title: 'Фотосессия', caption: 'Золотой час на воде', image: '/images/exp-photo.png', span: '' },
        { title: 'Семейная прогулка', caption: 'Вместе и без спешки', image: '/images/exp-family.png', span: '' },
      ],
    },
    fleet: {
      eyebrow: 'Наш флот',
      title: 'Катера, выбранные с душой',
      subtitle: 'Каждый катер под профессиональным управлением, безупречно обслужен и готов подарить идеальный вечер на Неве.',
      perHour: 'руб / час',
      onRequest: 'Цена по запросу',
      book: 'Забронировать',
      details: 'Подробнее',
      isNew: 'Новинка',
      premium: 'Флагман флота',
      captainOnly: 'Только с капитаном',
      specLabels: ['Длина', 'Ширина', 'Высота', 'Скорость', 'Вместимость'],
      amenitiesTitle: 'Удобства на борту',
      bookThis: 'Забронировать этот катер',
      specsOnRequest: 'Характеристики и стоимость — по запросу',
      close: 'Закрыть',
      extrasTitle: 'Организуем праздник под ключ',
      extras: ['Украшение шарами', 'Гендер-пати', 'Девичник', 'Мальчишник', 'Кейтеринг', 'Профессиональный фотограф', 'Музыкант'],
    },
    why: {
      eyebrow: 'Почему «Дно»',
      title: 'Детали, которые чувствуешь',
      reasons: [
        { title: 'Профессиональные капитаны', text: 'Опытные и лицензированные — знают каждое течение и каждый вид.' },
        { title: 'Современный флот', text: 'Безупречно обслуженные катера, обновляем каждый сезон для комфорта и безопасности.' },
        { title: 'Лицензированная компания', text: 'Полностью сертифицированы и застрахованы — вам остаётся только закат.' },
        { title: 'Более 20 лет опыта', text: 'Тысячи незабываемых вечеров, созданных на Неве.' },
        { title: 'Премиальный сервис', text: 'Шампанское, цветы, музыка, кейтеринг — всё готово ещё до вашего прихода.' },
      ],
      rating: '4,9',
      ratingText: 'Средняя оценка гостей за 1200+ частных прогулок.',
    },
    routes: {
      eyebrow: 'Популярные маршруты',
      title: 'Каждый маршрут — своя история',
      items: [
        { title: 'Императорские набережные', description: 'Пройдите мимо Зимнего дворца и Эрмитажа, когда фасады загораются золотом. Город открывается таким, каким его задумывали — с воды.', image: '/images/route-hermitage.png', duration: '2 часа', price: 'от 24 000 ₽', stops: 'Дворцовая набережная · Эрмитаж · Стрелка' },
        { title: 'Белые ночи и разводные мосты', description: 'Ночная прогулка, выверенная под развод мостов. Стойте на палубе под небом, которое не темнеет, и смотрите, как Нева расступается перед вами.', image: '/images/route-bridges.png', duration: '3 часа', price: 'от 36 000 ₽', stops: 'Дворцовый мост · Троицкий мост · Нева' },
        { title: 'Тайные каналы старого города', description: 'Скользите по тихим внутренним каналам к куполам Спаса на Крови — камерный, неспешный маршрут, который мало кто видел.', image: '/images/route-canals.png', duration: '1,5 часа', price: 'от 18 000 ₽', stops: 'Мойка · Грибоедова · Фонтанка' },
      ],
    },
    expeditions: {
      eyebrow: 'Поездки-приключения',
      title: 'Экспедиции',
      subtitle: 'Уходим за черту города — к старинным крепостям и морским фортам. Полный день на воде, живописные острова и история Балтики.',
      items: ['Крепость Орешек', 'Петрокрепость', 'Шлиссельбург', 'Кронштадт', 'Форты Кронштадта', 'Форт Тотлебен', 'Петергоф'],
      note: 'Стоимость оговаривается индивидуально',
      cta: 'Обсудить маршрут',
    },
    gallery: { eyebrow: 'Моменты', title: 'Галерея вечеров' },
    testimonials: {
      eyebrow: 'Отзывы',
      title: 'Вечера, которые не забыть',
      reviews: [
        { quote: 'Он сделал мне предложение на закате, когда за нами поднимались мосты. команда «Дно» продумала каждую деталь — это был самый идеальный вечер в нашей жизни.', name: 'Анастасия К.', context: 'Романтический вечер', photo: '/images/person-1.png' },
        { quote: 'Мы пригласили 25 клиентов на прогулку в белые ночи. Безупречный сервис, потрясающий капитан и вид на город, который не сравнить ни с одним рестораном.', name: 'Даниил Р.', context: 'Корпоратив', photo: '/images/person-2.png' },
        { quote: 'Мой день рождения на катере был как из фильма. Шампанское, музыка, разводные мосты — друзья вспоминают его до сих пор.', name: 'София М.', context: 'День рождения', photo: '/images/person-3.png' },
      ],
    },
    faq: {
      eyebrow: 'Полезно знать',
      title: 'Частые вопросы',
      subtitle: 'Остался вопрос? Напишите нам в любое время — в сезон отвечаем за пару минут.',
      items: [
        { q: 'За сколько лучше бронировать?', a: 'На белые ночи и вечера выходных советуем бронировать за две-три недели. По срочным запросам пишите в Telegram или WhatsApp — всегда постараемся помочь.' },
        { q: 'Что входит в частную прогулку?', a: 'В каждую прогулку входит профессиональный лицензированный капитан, топливо и весь катер в вашем распоряжении. Шампанское, цветы, кейтеринг, музыку и фотосъёмку можно добавить заранее.' },
        { q: 'Можно взять свои еду и напитки?', a: 'Конечно. Берите с собой что угодно или доверьте нашему консьержу премиальный кейтеринг и винную карту.' },
        { q: 'Что если погода испортится?', a: 'Ваша безопасность и комфорт — на первом месте. Если условия неподходящие, перенесём прогулку без доплат или вернём деньги полностью.' },
        { q: 'Гарантирован ли развод мостов?', a: 'Развод мостов проходит по официальному расписанию в период навигации. Капитаны выстраивают маршрут так, чтобы вы оказались в идеальной точке в нужный момент.' },
      ],
    },
    cta: {
      eyebrow: 'Ваш вечер уже ждёт',
      title: 'Готовы к незабываемому вечеру?',
      subtitle: 'Расскажите, какое настроение вы хотите. Обо всём остальном позаботимся мы — от первого бокала шампанского до последнего разведённого моста.',
      primary: 'Забронировать катер',
      secondary: 'Связаться с нами',
    },
    footer: {
      tagline: 'Частные прогулки на катере по Неве. Незабываемые вечера в сердце Санкт-Петербурга.',
      explore: 'Разделы',
      contact: 'Контакты',
      follow: 'Мы в сети',
      address: ['Английская набережная, 4', 'Санкт-Петербург, Россия'],
      rights: 'Все права защищены.',
      privacy: 'Конфиденциальность',
      terms: 'Условия',
      findUs: 'Как нас найти',
      yandexMaps: 'Яндекс.Карты',
      googleMaps: 'Google Maps',
    },
    booking: {
      title: 'Забронировать катер',
      subtitle: 'Выберите дату и время — свободные слоты показаны в календаре.',
      boatLabel: 'Катер',
      boatPlaceholder: 'Выберите катер',
      dateLabel: 'Дата прогулки',
      timeFromLabel: 'Время начала',
      timeToLabel: 'Время до',
      durationSelectLabel: 'На сколько',
      guestsLabel: 'Гостей',
      nameLabel: 'Ваше имя',
      namePlaceholder: 'Как к вам обращаться',
      phoneLabel: 'Телефон',
      phonePlaceholder: '+7 (___) ___-__-__',
      telegramLabel: 'Telegram (необязательно)',
      telegramPlaceholder: '@username',
      commentLabel: 'Комментарий',
      commentPlaceholder: 'Повод, пожелания, дополнительные услуги',
      next: 'Далее',
      back: 'Назад',
      submit: 'Отправить заявку',
      submitting: 'Отправляем...',
      close: 'Закрыть',
      requiredError: 'Заполните это поле',
      phoneError: 'Введите корректный номер телефона',
      nameError: 'Укажите имя полностью',
      pickDateFirst: 'Сначала выберите дату',
      pickTimeFirst: 'Выберите время начала и окончания',
      loadingSlots: 'Загружаем занятость...',
      noSlots: 'На этот день свободных слотов нет — выберите другую дату.',
      durationLabel: 'Длительность',
      hoursShort: 'ч',
      priceLabel: 'Стоимость',
      priceOnRequest: 'По запросу',
      timeNote: 'Время московское (МСК)',
      successTitle: 'Ожидайте подтверждения брони',
      successText: 'Заявка принята, катер на это время придержан за вами. Менеджер свяжется с вами и подтвердит бронь.',
      successNote: 'Бронь считается подтверждённой только после ответа менеджера.',
      errorTitle: 'Не удалось отправить заявку',
      errorText: 'Попробуйте ещё раз чуть позже или свяжитесь с менеджером.',
      contactManager: 'Связаться с менеджером',
      busyTitle: 'Катер уже занят',
      busyText: 'Этот интервал только что заняли. Выберите другое время или дату.',
      rejection: {
        PAST: 'Это время уже прошло — выберите другое.',
        TOO_SHORT: 'Минимальная аренда — 1 час.',
        TOO_LONG: 'Максимум за одну заявку — 7 суток. Дольше — напишите менеджеру.',
        TOO_FAR: 'Бронирование открыто на 180 дней вперёд.',
        BOAT_BUSY: 'Катер уже забронирован на это время — выберите другой интервал.',
      },
    },
  },
  en: {
    brand: { wordmark: 'Dno Shipping Company', tagline: 'St. Petersburg', full: 'Dno Shipping Company' },
    contact: {
      call: 'Call',
      callAdmin: 'Call the manager',
      telegram: 'Message on Telegram',
      whatsapp: 'Message on WhatsApp',
      managerNote: 'Got a question? Message our manager — we reply during working hours.',
      inDevelopment: 'Coming soon',
    },
    nav: {
      links: [
        { label: 'Experiences', href: '#experiences' },
        { label: 'Fleet', href: '#fleet' },
        { label: 'Routes', href: '#routes' },
        { label: 'Gallery', href: '#gallery' },
        { label: 'Reviews', href: '#reviews' },
        { label: 'FAQ', href: '#faq' },
      ],
      cta: 'Choose Your Boat',
      city: 'St. Petersburg',
    },
    owner: {
      highlight: 'We own our fleet.',
      line: 'You deal with us directly — no intermediaries, and we have offered exclusive terms on the St. Petersburg market for over 20 years.',
      points: ['Fleet owners', 'No middlemen', 'Exclusive on the market'],
    },
    hero: {
      eyebrow: 'Private cruises on the Neva',
      title: 'Experience Saint Petersburg from the Water',
      subtitle: 'Private luxury boat tours with professional captains. An evening on the river that stays with you long after you step ashore.',
      primary: 'Choose Your Boat',
      secondary: 'View Fleet',
    },
    experiences: {
      eyebrow: 'The experience',
      title: 'What experience are you looking for?',
      subtitle: 'You are not booking a boat. You are choosing a feeling — and we will craft the entire evening around it.',
      items: [
        { title: 'Romantic Evening', caption: 'Just the two of you', image: '/images/exp-romantic.png', span: 'lg:col-span-2 lg:row-span-2' },
        { title: 'White Nights & Bridge Opening', caption: 'The city that never sleeps', image: '/images/exp-white-nights.png', span: 'lg:col-span-2' },
        { title: 'Birthday Celebration', caption: 'A night to remember', image: '/images/exp-birthday.png', span: '' },
        { title: 'Corporate Event', caption: 'Impress every guest', image: '/images/exp-corporate.png', span: '' },
        { title: 'Photo Session', caption: 'Golden-hour on the water', image: '/images/exp-photo.png', span: '' },
        { title: 'Family Cruise', caption: 'Together, unhurried', image: '/images/exp-family.png', span: '' },
      ],
    },
    fleet: {
      eyebrow: 'The fleet',
      title: 'Vessels chosen for their soul',
      subtitle: 'Every boat in our collection is privately maintained, discreetly crewed and ready for a flawless night on the Neva.',
      perHour: '₽ / hour',
      onRequest: 'Price on request',
      book: 'Book Now',
      details: 'View Details',
      isNew: 'New',
      premium: 'Flagship of the fleet',
      captainOnly: 'With captain only',
      specLabels: ['Length', 'Beam', 'Height', 'Speed', 'Capacity'],
      amenitiesTitle: 'On-board amenities',
      bookThis: 'Book this boat',
      specsOnRequest: 'Specs and pricing on request',
      close: 'Close',
      extrasTitle: 'We arrange the whole celebration',
      extras: ['Balloon decoration', 'Gender-reveal party', 'Hen party', 'Stag party', 'Catering', 'Professional photographer', 'Musician'],
    },
    why: {
      eyebrow: 'Why Dno',
      title: 'Details you feel, never see',
      reasons: [
        { title: 'Professional Captains', text: 'Licensed, seasoned and quietly attentive — they know every current and every view.' },
        { title: 'Modern Fleet', text: 'Impeccably maintained yachts, refreshed each season for comfort and safety.' },
        { title: 'Licensed Company', text: 'Fully certified and insured, so your only concern is the sunset.' },
        { title: '20+ Years Experience', text: 'Thousands of unforgettable evenings crafted along the Neva River.' },
        { title: 'Premium Service', text: 'Champagne, flowers, music, catering — every detail arranged before you arrive.' },
      ],
      rating: '4.9',
      ratingText: 'Average guest rating across 1,200+ private cruises.',
    },
    routes: {
      eyebrow: 'Popular routes',
      title: 'Every route tells a different story',
      items: [
        { title: 'The Imperial Embankments', description: 'Drift past the Winter Palace and the Hermitage as the façades turn gold. The city reveals itself the way it was always meant to be seen — from the water.', image: '/images/route-hermitage.png', duration: '2 hours', price: 'from ₽24,000', stops: 'Palace Embankment · Hermitage · Spit' },
        { title: 'White Nights & Open Bridges', description: 'A midnight cruise timed to the raising of the drawbridges. Stand on deck beneath a sky that never fully darkens and watch the Neva part before you.', image: '/images/route-bridges.png', duration: '3 hours', price: 'from ₽36,000', stops: 'Palace Bridge · Trinity Bridge · Neva' },
        { title: 'Hidden Canals of the Old City', description: 'Slip through the quiet inner canals toward the domes of the Savior on Spilled Blood — an intimate, unhurried route few ever experience.', image: '/images/route-canals.png', duration: '1.5 hours', price: 'from ₽18,000', stops: 'Moyka · Griboyedov · Fontanka' },
      ],
    },
    expeditions: {
      eyebrow: 'Adventure trips',
      title: 'Mini-expeditions',
      subtitle: 'We head beyond the city — to ancient fortresses and sea forts. A full day on the water, scenic islands and the history of the Baltic.',
      items: ['Oreshek Fortress', 'Petrokrepost', 'Shlisselburg', 'Kronstadt', 'Kronstadt Forts', 'Fort Totleben', 'Peterhof'],
      note: 'Price agreed individually',
      cta: 'Discuss the route',
    },
    gallery: { eyebrow: 'Moments', title: 'A gallery of evenings' },
    testimonials: {
      eyebrow: 'In their words',
      title: 'Evenings they never forgot',
      reviews: [
        { quote: 'I proposed on the water at sunset with the bridges rising behind us. the Dno team arranged every detail — it was the most perfect night of our lives.', name: 'Anastasia K.', context: 'Romantic evening', photo: '/images/person-1.png' },
        { quote: 'We hosted 25 clients for a White Nights cruise. Flawless service, an incredible captain and a view of the city no restaurant could ever match.', name: 'Daniel R.', context: 'Corporate event', photo: '/images/person-2.png' },
        { quote: 'My birthday on board felt like something out of a film. Champagne, music, the open bridges — my friends still talk about it months later.', name: 'Sofia M.', context: 'Birthday celebration', photo: '/images/person-3.png' },
      ],
    },
    faq: {
      eyebrow: 'Good to know',
      title: 'Frequently asked',
      subtitle: 'Still have a question? Message us any time — we reply within minutes during the season.',
      items: [
        { q: 'How far in advance should I book?', a: 'For White Nights and weekend evenings we recommend booking two to three weeks ahead. For last-minute requests, reach out on Telegram or WhatsApp — we will always try to make it happen.' },
        { q: 'What is included in a private cruise?', a: 'Every cruise includes a professional licensed captain, fuel, and full use of the boat. Champagne, flowers, catering, music and photography can be arranged as add-ons before your evening.' },
        { q: 'Can we bring our own food and drinks?', a: 'Absolutely. You are welcome to bring your own refreshments, or let our concierge arrange premium catering and a sommelier-selected wine list for you.' },
        { q: 'Are the bridge openings guaranteed?', a: 'Bridge openings follow the official city schedule during the navigation season. Our captains time the route precisely so you are in the perfect spot as the bridges rise.' },
      ],
    },
    cta: {
      eyebrow: 'Your evening awaits',
      title: 'Ready for an unforgettable evening?',
      subtitle: 'Tell us the feeling you are after. We will take care of everything else — from the first pour of champagne to the last raised bridge.',
      primary: 'Book a Boat',
      secondary: 'Contact Us',
    },
    footer: {
      tagline: 'Private luxury boat tours along the Neva River. Unforgettable evenings in the heart of Saint Petersburg.',
      explore: 'Explore',
      contact: 'Contact',
      follow: 'Follow',
      address: ['English Embankment, 4', 'Saint Petersburg, Russia'],
      rights: 'All rights reserved.',
      privacy: 'Privacy',
      terms: 'Terms',
      findUs: 'How to find us',
      yandexMaps: 'Yandex Maps',
      googleMaps: 'Google Maps',
    },
    booking: {
      title: 'Book a Boat',
      subtitle: 'Pick a date and time — available slots are shown in the calendar.',
      boatLabel: 'Boat',
      boatPlaceholder: 'Choose a boat',
      dateLabel: 'Cruise date',
      timeFromLabel: 'Start time',
      timeToLabel: 'To',
      durationSelectLabel: 'Duration',
      guestsLabel: 'Guests',
      nameLabel: 'Your name',
      namePlaceholder: 'How should we address you',
      phoneLabel: 'Phone',
      phonePlaceholder: '+1 (___) ___-____',
      telegramLabel: 'Telegram (optional)',
      telegramPlaceholder: '@username',
      commentLabel: 'Comment',
      commentPlaceholder: 'Occasion, wishes, extra services',
      next: 'Next',
      back: 'Back',
      submit: 'Send Request',
      submitting: 'Sending...',
      close: 'Close',
      requiredError: 'Please fill in this field',
      phoneError: 'Enter a valid phone number',
      nameError: 'Please enter your full name',
      pickDateFirst: 'Choose a date first',
      pickTimeFirst: 'Choose start and end time',
      loadingSlots: 'Loading availability...',
      noSlots: 'No free slots on this day — please pick another date.',
      durationLabel: 'Duration',
      hoursShort: 'h',
      priceLabel: 'Price',
      priceOnRequest: 'On request',
      timeNote: 'All times are Moscow time (MSK)',
      successTitle: 'Awaiting booking confirmation',
      successText: 'Your request is in. The boat is held for that time. Our manager will contact you to confirm the booking.',
      successNote: 'The booking counts as confirmed only once the manager replies.',
      errorTitle: 'Could not send the request',
      errorText: 'Please try again shortly or reach out to our manager.',
      contactManager: 'Contact the manager',
      busyTitle: 'Boat is already booked',
      busyText: 'This slot has just been taken. Please pick another time or date.',
      rejection: {
        PAST: 'That time has already passed — please pick another.',
        TOO_SHORT: 'Minimum rental is 1 hour.',
        TOO_LONG: 'Maximum per request is 7 days. For longer, message our manager.',
        TOO_FAR: 'Bookings open 180 days ahead.',
        BOAT_BUSY: 'The boat is already booked for that time — please pick another slot.',
      },
    },
  },
}
