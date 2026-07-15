'use client'

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { BookingModal } from './booking-modal'
import type { Boat, Lang } from '@/lib/i18n'

interface BookingContextValue {
  openBooking: (boatId?: string) => void
}

const BookingContext = createContext<BookingContextValue | null>(null)

export function BookingProvider({
  lang,
  boats,
  children,
}: {
  lang: Lang
  boats: Boat[]
  children: ReactNode
}) {
  const [open, setOpen] = useState(false)
  const [boatId, setBoatId] = useState<string | null>(null)

  const openBooking = useCallback((id?: string) => {
    setBoatId(id ?? null)
    setOpen(true)
  }, [])

  const close = useCallback(() => setOpen(false), [])

  const value = useMemo(() => ({ openBooking }), [openBooking])

  return (
    <BookingContext.Provider value={value}>
      {children}
      {open && <BookingModal lang={lang} boats={boats} initialBoatId={boatId} onClose={close} />}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within BookingProvider')
  return ctx
}
