'use client'

import { useEffect } from 'react'
import { captureUtmFromLocation } from '@/lib/utm'

/** Ничего не рендерит — на маунте один раз сохраняет UTM-метки из URL в cookie. */
export function UtmCapture() {
  useEffect(() => {
    captureUtmFromLocation()
  }, [])
  return null
}
