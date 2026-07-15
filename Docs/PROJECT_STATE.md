# Состояние проекта — «Судоходная Компания Дно»

Краткий хэндовер, чтобы продолжить разработку в любом режиме без потери контекста.

## Что это
Сайт аренды катеров в Санкт-Петербурге. Next.js 16 (App Router), React 19, TypeScript, Tailwind v4.
Двуязычный: RU на `/`, EN на `/en` (словарь — `lib/i18n.ts`). Домен заказчика: prokatkaterov.ru.
Бренд в интерфейсе: «Судоходная Компания Дно».

## Стек (согласован)
- Приложение: Next.js на **Beget** (VPS/Node, PM2 + Nginx).
- БД: **PostgreSQL** (Beget Cloud) + **Prisma** ORM.
- Авторизация админки: своя (Auth.js/сессия) — этап админки.
- Фото лодок: WebP в `public/boats/<папка>` (позже — `/uploads` на сервере).
- Telegram (grammY) и Google Sheets — этапы уведомлений/отчётности.
- Хостинг и деплой — см. `Docs/DEPLOY_BEGET.md`.

## Ключевые документы
- `Docs/ТЗ — Бронирование и админ-панель.docx` — полное техзадание.
- `Docs/DEPLOY_BEGET.md` — пошаговый деплой на Beget (без SSH-клиента).
- `Docs/PROJECT_STATE.md` — этот файл.

## Готово (лендинг)
- Флот из 15 лодок с фото (WebP), ТТХ, удобствами, ценами, значками («Бомбочка!»/«Конфетка!»), гидроциклом.
- Разделы: Hero (ken-burns), баннер «Собственники флота … более 20 лет», впечатления, флот с модалкой-галереей, почему мы, маршруты, мини-экспедиции, галерея, отзывы, FAQ, CTA, футер.
- Кнопки: бронь в Telegram, звонок администратору (tel:, номер скрыт).
- Блок услуг для праздника во всех карточках лодок.

## Готово (фундамент БД — MVP, этап 1)
- `prisma/schema.prisma` — Boat, Booking (+ статусы/источники enum), BookingStatusHistory, Client. Заложены `startAt/endAt` (календарь) и `priceSnapshot`.
- `prisma/seed.ts` — переносит 15 лодок из `lib/i18n.ts` в БД.
- `lib/prisma.ts` — синглтон клиента.
- `lib/boats-db.ts` — `getBoats()`: читает из БД, **фолбэк на статику**, если нет `DATABASE_URL`.
- Флот читается из БД: `app/page.tsx` и `app/en/page.tsx` (async) → `<Fleet boats={...}>`.
- `package.json`: добавлены prisma/@prisma/client/tsx, скрипты `db:migrate`/`db:seed`, `postinstall: prisma generate`.
- `.env.example`, `.gitignore` (секреты вне git).

## Важно про сборку
`tsc`/`build` требуют сгенерированного Prisma-клиента: после `npm install` автоматически сработает `postinstall → prisma generate`, и всё соберётся. До этого 3 ошибки про `@prisma/client` — ожидаемы.

## Готово (этап 1 — форма бронирования)
- Модалка бронирования: `components/nevsky/booking-modal.tsx` — выбор лодки, дата/время, гости (слайдер), имя, телефон, telegram (необязательно), комментарий; базовая клиентская валидация обязательных полей и телефона.
- Глобальный доступ к модалке: `components/nevsky/booking-context.tsx` (`BookingProvider`/`useBooking`), подключён в `app/page.tsx` и `app/en/page.tsx`. Кнопки «Забронировать» в `Fleet` (карточка и модалка деталей) и «Забронировать катер» в `Cta` открывают форму (в `Fleet` — с предвыбором конкретной лодки).
- Захват UTM: `lib/utm.ts` + `components/nevsky/utm-capture.tsx`, подключён в `app/layout.tsx` — при заходе с `utm_source/medium/campaign` в URL сохраняет их в cookie `utm_data` на 1 год; при сабмите формы читаются и уходят вместе с заявкой.
- Тексты формы — `dict.booking` в `lib/i18n.ts` (ru/en).
- Сабмит уже стучится в `POST /api/bookings` (JSON: boatId, startAt (ISO), guests, clientName, phone, telegram?, comment?, lang, utmSource/Medium/Campaign). Пока эндпоинта нет — ожидаемо 404, форма показывает блок ошибки со ссылкой-фолбэком «Написать в Telegram». Проверено вручную в браузере на RU и EN.
- По ходу починено окружение: `prisma`/`@prisma/client` не были докачаны (`npm install` не запускался полностью) — из-за этого dev-сервер падал даже в статик-фолбэке. Прогнал `npm install`, теперь `postinstall → prisma generate` отрабатывает и `npx tsc --noEmit` чист.
- Добавлен `.claude/launch.json` (npm run dev, порт 3000) для превью через Browser-инструмент.

## Следующие шаги
1. **API** `POST /api/bookings`: валидация (Zod), запись в БД (статус NEW), запись источника/UTM. Контракт запроса уже зафиксирован формой (см. выше) — эндпоинт должен его принять.
2. **Telegram-уведомление** админу (token + chat_id) с кнопками «Подтвердить/Отменить».
3. **Админка** `/admin`: вход, список заявок (фильтры/статусы), CRUD лодок + загрузка фото, клиенты.
4. **Google Sheets**: дозапись строки при статусе CONFIRMED.

## Что нужно от заказчика (чтобы «оживить»)
- `DATABASE_URL` из панели Beget (PostgreSQL) + поддомен `new.prokatkaterov.ru`.
- Позже: Telegram bot token (@BotFather) + chat_id (@userinfobot); Google service account для Sheets.

## Открытые вопросы
- Автоответ клиенту (Telegram/email/SMS) — нужен ли и когда.
- Доступность лодок: вручную статусами (сейчас) или сразу календарь.
- Реальные ТТХ для Galeon/Princess/«Царица»/Тахо (сейчас у премиум-яхт часть значений — ориентировочные/по запросу).
- Настоящий @username Telegram для брони (сейчас плейсхолдер `t.me/prokatkaterov`).
