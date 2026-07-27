/**
 * Единый helper отправки целей (reachGoal) в Янд.Метрику (№ 111074489).
 *
 * Один источник правды для всех целей: и код счётчика (yandex-metrika.tsx), и
 * места, где цели вызываются, берут id и функцию отсюда — чтобы не дублировать
 * ни номер счётчика, ни проверку наличия window.ym.
 *
 * Счётчик грузится только в проде и не на /admin (см. yandex-metrika.tsx),
 * поэтому в dev и на админке window.ym нет — reachGoal просто молча ничего не
 * делает. Никакой цели без загруженного счётчика не отправится.
 */

export const METRIKA_COUNTER_ID = 111074489

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
 * Отправить цель. Безопасно на сервере (нет window) и до загрузки счётчика
 * (нет window.ym) — в обоих случаях no-op.
 */
export function reachGoal(goal: MetrikaGoal): void {
  if (typeof window === 'undefined') return
  window.ym?.(METRIKA_COUNTER_ID, 'reachGoal', goal)
}
