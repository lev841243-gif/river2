# Клиентский бот — заявки в Telegram

Публичный бот **@neva10_booking_bot**: клиент сам смотрит катера и оставляет
заявку, без сайта. Заявка ложится как обычный лид (`NEW`/`SOCIAL`) и
подтверждается менеджером в рабочей группе — **как с сайта**. Ничего не платит и
не подтверждает сам.

**Секретов здесь нет** — файл в git.

---

## Где он в архитектуре

Бот — **не отдельный сервис**, а часть того же Next.js-приложения (тот же
процесс PM2, та же БД, тот же домен). Отдельные у него только вход и транспорт.
Три «фасада» над одним доменным ядром: сайт, менеджерский бот, клиентский бот.

```
                 Telegram
   ┌────────────────┼────────────────────┐
   │ (личка)                  (группа)    │
   ▼                                      ▼
КЛИЕНТСКИЙ БОТ                       МЕНЕДЖЕРСКИЙ БОТ
CLIENT_BOT_TOKEN                    TELEGRAM_BOT_TOKEN
   │ прод: вебхук                        │ вебхук
app/api/telegram/client-webhook    app/api/telegram/webhook
   │  (локально: scripts/client-bot-dev.ts — polling)
   ▼
lib/client-bot/*  (core · booking-flow · draft · telegram)
   │ переиспользует, не дублирует
   ▼
ОБЩЕЕ ЯДРО: booking-rules · bookings-db(createBooking) · spb-time
   ▼
Prisma → PostgreSQL  (Boat, Booking, ClientBotDraft)
   │
   └─ лид NEW/SOCIAL → sendBookingNotification (менеджерский транспорт) → группа
```

Два бота **не общаются напрямую** — связывает их БД. Клиентский создаёт
`Booking`, затем зовёт менеджерский `sendBookingNotification`, и карточка падает
в группу. Для менеджера заявка из бота неотличима от заявки с сайта.

## Как устроено

Два бота, раздельный транспорт, **общее доменное ядро** (не дублируется):

- **менеджерский** (`lib/telegram.ts`) — заперт на группу, шлёт карточки заявок;
- **клиентский** (`lib/client-bot/*`) — публичный, отвечает каждому в личке.

Заявка из клиентского бота идёт через тот же `createBooking` и падает той же
карточкой в ту же группу (`sendBookingNotification`), что и заявки с сайта.
Источник — `SOCIAL` (через `utmSource: 'telegram'`, ловит `detectSource`),
статус — `NEW`.

### Файлы

| Файл | Что |
|---|---|
| `lib/client-bot/telegram.ts` | транспорт: токен `CLIENT_BOT_TOKEN`, вызовы API, `sendPhoto` файлом |
| `lib/client-bot/core.ts` | ядро: разбор апдейта, галерея лодок, флуд-лимит, роутинг |
| `lib/client-bot/booking-flow.ts` | мастер брони по шагам → `createBooking` → уведомление менеджеру |
| `lib/client-bot/draft.ts` | черновик диалога в БД (`ClientBotDraft`) |
| `app/api/telegram/client-webhook/route.ts` | приём апдейтов на боевом (вебхук) |
| `scripts/client-bot-dev.ts` | локальная отладка через long-polling, без деплоя |
| `scripts/client-bot-setup.ts` | разово: меню команд (`/start`, `/help`) |
| `scripts/client-bot-getme.ts` | диагностика токена |

### Сценарий

`/start` → «Наши лодки» → лента карточек (обложка + цена) → «Забронировать» →
день → час → минуты → длительность → гости → имя → телефон (кнопка «Поделиться
номером») → комментарий/пропустить → заявка. `/start` доступен всегда через
кнопку «Menu» (`setMyCommands`).

---

## Грабли — читать перед правками

1. **Обложки лодок в webp — `sendPhoto` их принимает как есть.** Проверено
   экспериментом (фаза 0): конвертация не нужна. Если какой-то клиент Telegram
   покажет webp криво — запасной путь webp→jpg через `sharp` в одну строку.
2. **Файлы лодок — `public/boats/<dir>/<cover>`**, статические, в git; путь один
   локально и на боевом. Это не «Моменты» (те вне git, в `uploads/`).
3. **Своя таблица `ClientBotDraft`, а не общий `BotDraft`.** Разные продукты —
   не связывать через один тип черновика. В личке `chat.id === user.id`.
4. **Локально нет вебхука — есть polling** (`client-bot-dev.ts`). Вебхук и
   `getUpdates` взаимоисключающи: пока крутишь поллинг, вебхук у бота стоять не
   должен (иначе 409). Ядро `handleClientUpdate` общее для обоих входов.
5. **`CLIENT_BOT_DEV_MANAGER_CHAT`** — только для локального теста: карточка
   менеджера уходит в этот личный чат, а не в реальную группу. **На боевом
   пусто.**

---

## Локальная разработка

```bash
# 1. В .env: CLIENT_BOT_TOKEN=...  (значение в переписку не вставлять)
# 2. Меню команд (разово):
npx tsx scripts/client-bot-setup.ts
# 3. Поллинг (Ctrl+C — стоп). Тестовые уведомления — себе в личку:
CLIENT_BOT_DEV_MANAGER_CHAT=<свой_id> npx tsx scripts/client-bot-dev.ts
```

ffmpeg тут ни при чём — бот шлёт только фото лодок.

---

## Выкатка на боевой (запускает заказчик — SSH Клода отозван)

Порядок важен: миграция БД до сборки.

```bash
# на сервере, в .env добавить:
#   CLIENT_BOT_TOKEN=...          (новый бот, свой токен)
#   CLIENT_BOT_WEBHOOK_SECRET=... (свой, не равен менеджерскому)
#   CLIENT_BOT_DEV_MANAGER_CHAT   — НЕ задавать

ssh root@85.198.68.244 'cd /root/dno && git fetch origin && git reset --hard origin/main \
  && npx prisma generate && npx prisma migrate deploy'        # создаст ClientBotDraft
ssh root@85.198.68.244 'bash /root/dno/scripts/deploy.sh'      # сборка + подмена

# зарегистрировать вебхук и меню команд (один раз):
curl -s "https://api.telegram.org/bot<CLIENT_BOT_TOKEN>/setWebhook" \
  -d "url=https://new.prokatkaterov.ru/api/telegram/client-webhook" \
  -d "secret_token=<CLIENT_BOT_WEBHOOK_SECRET>"
npx tsx scripts/client-bot-setup.ts   # на сервере, с CLIENT_BOT_TOKEN в .env
```

После этого polling локально больше не запускать одновременно с боевым вебхуком
на том же боте.

---

## Не сделано (осознанно вне v1)

- английский язык (бот только на русском);
- оплата/предоплата (клиент оставляет лид, платит по договорённости с менеджером);
- показ занятости заранее (занятый слот отклоняется на финале, как и на сайте
  через тот же `validateInterval` + exclusion-констрейнт).
