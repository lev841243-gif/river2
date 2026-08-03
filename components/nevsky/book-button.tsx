'use client'

import { ArrowRight } from 'lucide-react'
import { useBooking } from './booking-context'

/**
 * Кнопка «Забронировать», открывающая модалку брони. Тонкая клиентская обёртка
 * над `useBooking()` — нужна там, где кнопка живёт в серверном компоненте
 * (например, в шапке посадочной страницы). Должна быть внутри BookingProvider.
 */
export function BookButton({ label, className }: { label: string; className?: string }) {
  const { openBooking } = useBooking()
  return (
    <button
      type="button"
      onClick={() => openBooking()}
      className={
        className ??
        'group inline-flex items-center justify-center gap-2 rounded-full bg-primary px-8 py-4 text-sm font-medium text-primary-foreground transition-transform duration-300 hover:scale-[1.03]'
      }
    >
      {label}
      <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
    </button>
  )
}
