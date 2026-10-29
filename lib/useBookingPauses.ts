'use client'

import { useEffect, useState } from 'react'
import type { BookingPause } from '@/lib/bookingPauses'

// Active pauses for one service. Fails open (empty list) — the server
// still rejects a paused slot in /api/leads, so this is just for the UI.
export function useBookingPauses(service: 'transport' | 'jet_ski'): BookingPause[] {
  const [pauses, setPauses] = useState<BookingPause[]>([])
  useEffect(() => {
    let cancelled = false
    fetch(`/api/public/booking-pauses?service=${service}`, { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : []))
      .then(data => { if (!cancelled && Array.isArray(data)) setPauses(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [service])
  return pauses
}
