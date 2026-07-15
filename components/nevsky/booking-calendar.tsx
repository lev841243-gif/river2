'use client'

import { useMemo } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Interval } from '@/lib/booking-rules'
import { dayHasFreeSlot } from '@/lib/booking-slots'
import { fromSpbParts, spbDayKey, spbTodayKey } from '@/lib/spb-time'
import type { Lang } from '@/lib/i18n'

const MONTHS: Record<Lang, string[]> = {
  ru: ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
}

/** Неделя начинается с понедельника — европейская подача для обеих версий. */
const WEEKDAYS: Record<Lang, string[]> = {
  ru: ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
}

export interface MonthCursor {
  year: number
  month: number // 1–12
}

export function BookingCalendar({
  lang,
  cursor,
  onCursorChange,
  selected,
  onSelect,
  busy,
  loading,
  now,
}: {
  lang: Lang
  cursor: MonthCursor
  onCursorChange: (c: MonthCursor) => void
  selected: string | null
  onSelect: (dayKey: string) => void
  busy: Interval[]
  loading: boolean
  now: Date
}) {
  const todayKey = spbTodayKey(now)

  const days = useMemo(() => {
    const first = fromSpbParts({ year: cursor.year, month: cursor.month, day: 1 })
    // getUTCDay: 0=Вс. Приводим к понедельнику как первому дню недели.
    const leading = (new Date(first.getTime() + 3 * 3_600_000).getUTCDay() + 6) % 7
    const daysInMonth = new Date(Date.UTC(cursor.year, cursor.month, 0)).getUTCDate()

    const cells: ({ key: string; day: number; free: boolean; past: boolean } | null)[] = []
    for (let i = 0; i < leading; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) {
      const key = spbDayKey(fromSpbParts({ year: cursor.year, month: cursor.month, day: d }))
      const past = key < todayKey
      cells.push({ key, day: d, past, free: past ? false : dayHasFreeSlot(key, busy, now) })
    }
    return cells
  }, [cursor, busy, now, todayKey])

  const canGoBack = `${cursor.year}-${String(cursor.month).padStart(2, '0')}` > todayKey.slice(0, 7)

  function shift(delta: number) {
    const m = cursor.month + delta
    if (m < 1) onCursorChange({ year: cursor.year - 1, month: 12 })
    else if (m > 12) onCursorChange({ year: cursor.year + 1, month: 1 })
    else onCursorChange({ year: cursor.year, month: m })
  }

  return (
    <div className="rounded-2xl border border-border bg-background/40 p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => shift(-1)}
          disabled={!canGoBack}
          aria-label={lang === 'ru' ? 'Предыдущий месяц' : 'Previous month'}
          className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5 disabled:pointer-events-none disabled:opacity-30"
        >
          <ChevronLeft className="size-4" />
        </button>
        <span className="text-sm font-medium text-foreground">
          {MONTHS[lang][cursor.month - 1]} {cursor.year}
        </span>
        <button
          type="button"
          onClick={() => shift(1)}
          aria-label={lang === 'ru' ? 'Следующий месяц' : 'Next month'}
          className="flex size-8 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-foreground/5"
        >
          <ChevronRight className="size-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 gap-1">
        {WEEKDAYS[lang].map((w) => (
          <span key={w} className="py-1 text-center text-[10px] uppercase tracking-wide text-muted-foreground">
            {w}
          </span>
        ))}
      </div>

      <div className={cn('mt-1 grid grid-cols-7 gap-1 transition-opacity', loading && 'opacity-40')}>
        {days.map((cell, i) =>
          cell === null ? (
            <span key={`pad-${i}`} />
          ) : (
            <button
              key={cell.key}
              type="button"
              disabled={!cell.free}
              onClick={() => onSelect(cell.key)}
              aria-label={cell.key}
              aria-pressed={selected === cell.key}
              className={cn(
                'relative flex aspect-square items-center justify-center rounded-xl text-sm transition-colors',
                selected === cell.key && 'bg-primary font-medium text-primary-foreground',
                selected !== cell.key && cell.free && 'text-foreground hover:bg-foreground/10',
                !cell.free && 'cursor-not-allowed text-foreground/25',
                cell.key === todayKey && selected !== cell.key && 'ring-1 ring-primary/40',
              )}
            >
              {cell.day}
              {!cell.free && !cell.past && (
                <span className="absolute bottom-1 h-1 w-1 rounded-full bg-destructive/70" />
              )}
            </button>
          ),
        )}
      </div>

      <p className="mt-3 flex items-center gap-2 text-[11px] text-muted-foreground">
        <span className="inline-block size-1.5 rounded-full bg-destructive/70" />
        {lang === 'ru' ? 'Катер занят' : 'Boat is booked'}
      </p>
    </div>
  )
}
