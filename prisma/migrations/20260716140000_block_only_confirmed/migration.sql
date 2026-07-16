-- Слот держит только ПОДТВЕРЖДЁННАЯ бронь.
--
-- Было: NEW, REVIEW и CONFIRMED — необработанная заявка занимала катер и
-- отбивала следующих клиентов. Решение заказчика: пока менеджер не подтвердил,
-- катер свободен, и на один слот могут прийти несколько заявок.
--
-- Условие обязано совпадать с BLOCKING_STATUSES в lib/booking-rules.ts:
-- разъедутся — код и база будут считать занятость по-разному.

ALTER TABLE "Booking" DROP CONSTRAINT IF EXISTS "Booking_no_overlap";

ALTER TABLE "Booking"
  ADD CONSTRAINT "Booking_no_overlap"
  EXCLUDE USING gist (
    "boatId" WITH =,
    tstzrange("startAt", "endAt", '[)') WITH &&
  )
  WHERE ("status" = 'CONFIRMED');
