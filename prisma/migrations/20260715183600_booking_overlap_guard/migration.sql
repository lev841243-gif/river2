-- Защита от двойного бронирования на уровне БД.
--
-- Проверка «сначала посмотрели занятость, потом вставили» не спасает от гонки:
-- две одновременные заявки на один слот обе увидят «свободно» и обе вставятся.
-- Exclusion-констрейнт делает пересечение физически невозможным — Postgres
-- отвергает вторую вставку с кодом 23P01, который ловит lib/bookings-db.ts.
--
-- Требует timestamptz на startAt/endAt: от timestamp без таймзоны tstzrange
-- зависит от сессионной TimeZone и не может попасть в индексное выражение.
--
-- Условие WHERE повторяет BLOCKING_STATUSES из lib/booking-rules.ts:
-- отменённые и завершённые брони слот не держат.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist (
    "boatId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" IN ('NEW', 'REVIEW', 'CONFIRMED'));
