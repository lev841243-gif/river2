/**
 * Единый helper отправки целей (reachGoal) в Янд.Метрику.
 *
 * Один источник правды для всех целей: и код счётчика (yandex-metrika.tsx), и
 * места, где цели вызываются, берут id и функцию отсюда — чтобы не дублировать
 * ни номера счётчиков, ни проверку наличия window.ym.
 *
 * Счётчики грузятся только в проде и не на /admin (см. yandex-metrika.tsx),
 * поэтому в dev и на админке window.ym нет — reachGoal просто молча ничего не
 * делает. Никакой цели без загруженного счётчика не отправится.
 */

/**
 * Основной счётчик сайта — источник правды. В нём история с 15.07.2026, записи
 * вебвизора и шесть целей, заведённых в этапе 7.
 */
export const METRIKA_COUNTER_ID = 111074489

/**
 * Счётчик прежнего сайта. К нему привязана кампания Яндекс.Директа, и агентство
 * попросило оставить привязку как есть — поэтому сайт шлёт данные и сюда, чтобы
 * кампания видела трафик и цели. Основным он НЕ является: в нём смешана
 * статистика прежнего сайта, и доступ к нему не наш.
 *
 * ⚠️ Цели должны быть заведены в этом счётчике руками, с теми же
 * идентификаторами (MetrikaGoal). Без этого сюда уходят только просмотры.
 */
export const METRIKA_ADS_COUNTER_ID = 43111299

/** Все счётчики сайта: хиты и цели уходят в каждый. Порядок = приоритет. */
export const METRIKA_COUNTER_IDS = [METRIKA_COUNTER_ID, METRIKA_ADS_COUNTER_ID] as const

/** Идентификаторы целей — ровно как заведены в интерфейсе Метрики. */
export type MetrikaGoal =
  | 'booking_click'
  | 'booking_open'
  | 'booking_submit'
  | 'phone_click'
  | 'telegram_click'
  | 'whatsapp_click'

declare global {
  interface Window {
    ym?: (id: number, action: string, ...rest: unknown[]) => void
  }
}

/**
 * Отправить цель во все счётчики. Безопасно на сервере (нет window) и до
 * загрузки счётчика (нет window.ym) — в обоих случаях no-op.
 */
export function reachGoal(goal: MetrikaGoal): void {
  if (typeof window === 'undefined') return
  for (const id of METRIKA_COUNTER_IDS) window.ym?.(id, 'reachGoal', goal)
}
