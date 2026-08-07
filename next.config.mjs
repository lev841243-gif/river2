/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    /**
     * Сборка ОБЯЗАНА падать на ошибках типов.
     *
     * Раньше стояло true (осталось от скаффолда v0), и `next build` печатал
     * «Skipping validation of types» — то есть на сломанном коде бодро выдавал
     * «✓ Compiled successfully». На staging это прощалось, на боевом домене
     * такая сборка молча уехала бы к клиентам. Единственной защитой был
     * отдельный `tsc --noEmit`, про который легко забыть.
     */
    ignoreBuildErrors: false,
  },
  images: {
    unoptimized: true,
  },
  /**
   * Нативные модули не бандлить, а грузить из node_modules как есть.
   * `sharp` Next выносит сам, а `@napi-rs/canvas` (рендер бланка сертификата,
   * lib/certificate/render.ts) — нет: без этого сборка упаковала бы его .node,
   * и в рантайме привязка не находилась бы.
   */
  serverExternalPackages: ['@napi-rs/canvas'],
  experimental: {
    serverActions: {
      /**
       * Загрузка галереи идёт через server action, а у него лимит тела по
       * умолчанию 1 МБ — видео с телефона (5–15 МБ) молча не проходили бы.
       * Держать в согласии с MAX_FILE_BYTES в lib/gallery.ts.
       */
      bodySizeLimit: '64mb',
    },
  },
  /**
   * 301 со старых адресов прежнего сайта.
   *
   * Прежний сайт жил на этом же домене и оставил в индексе Яндекса, Google и
   * Дзена адреса вида `/boat/kater-zig-zag`, `/katera`, `/kontakty`. После
   * переезда они отдавали 404: по логам nginx — 455 обращений за две недели,
   * из них 275 не от ботов (переходы из поиска, с метками `search_source`).
   *
   * Ведём 1 в 1 на страницу конкретного катера, а не «всё на главную»: запрос
   * «аренда катера Formula 206» должен попадать на свой катер, иначе теряется
   * и посетитель, и накопленный вес страницы.
   *
   * Явный `statusCode: 301`, а не `permanent: true` (тот отдаёт 308): для
   * переезда страниц 301 понимают все краулеры без исключений.
   *
   * `formula-v` и `formula-34` в списке отсутствуют намеренно — их прежние
   * слаги совпадают с нынешними, и маршрут `/boat/[slug]` отдаёт их сам.
   */
  async redirects() {
    /** прежний слаг → нынешний слаг лодки в БД */
    const boats = {
      'formula-206-ls': 'formula-206ls',
      'kater-formula-280-ss': 'formula-280ss',
      'kater-formula-31pc': 'formula-31pc',
      'kater-chaparral-2835': 'chaparral-2835',
      'kater-zig-zag': 'zig-zag',
      'arenda-katera-maxum': 'maxum',
      'arenda-katera-formula-310ss-novinka': 'formula-310ss',
      'kater-bayliner-2350-nahuhol': 'bayliner-nahuhol',
      /**
       * «Похухоль» — единственный оставшийся Bayliner 2350; в прежнем слаге
       * начальная «п» потерялась. Восстановить прежний сайт уже нельзя (отдаёт
       * 404, снимков в архиве нет), но обе лодки — одна модель и одна цена,
       * поэтому даже при ошибке в паре посетитель попадёт на равнозначный катер.
       */
      'kater-bayliner-2350-ohohol': 'bayliner-pohuhol',
    }

    return [
      ...Object.entries(boats).map(([from, to]) => ({
        source: `/boat/${from}`,
        destination: `/boat/${to}`,
        statusCode: 301,
      })),
      // Разделы прежнего сайта. У галереи на нынешней главной своего якоря нет,
      // поэтому ведём на главную целиком; контакты — в блоке CTA.
      { source: '/katera', destination: '/#fleet', statusCode: 301 },
      { source: '/kontakty', destination: '/#cta', statusCode: 301 },
      { source: '/contacts', destination: '/#cta', statusCode: 301 },
      { source: '/galereya', destination: '/', statusCode: 301 },
      { source: '/about', destination: '/', statusCode: 301 },
      { source: '/about-us', destination: '/', statusCode: 301 },
      // Пользовательское соглашение прежнего сайта → наша политика.
      { source: '/agreement', destination: '/privacy', statusCode: 301 },
    ]
  },
  /**
   * Куда собирать. По умолчанию `.next`, но на боевом сервере сборка идёт в
   * отдельную папку и потом подменяется одним `mv`.
   *
   * Иначе деплой выглядит так: `rm -rf .next` удаляет файлы у РАБОТАЮЩЕГО
   * сайта, и посетители получают ошибки всё время сборки — десятки секунд, а
   * не пару секунд перезапуска. Next читает чанки с диска на каждый запрос,
   * поэтому пересборка «на месте» ломает живой процесс.
   */
  distDir: process.env.NEXT_DIST_DIR || '.next',
}

export default nextConfig
