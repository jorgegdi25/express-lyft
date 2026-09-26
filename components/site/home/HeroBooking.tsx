'use client'

import { useCallback, useState, type ReactNode } from 'react'
import MainMapBookingForm from '@/components/MainMapBookingForm'

// Hero layout in the 515 Miami style: intro on the left, booking card on
// the right. Once the guest moves to vehicle/checkout, the card takes the
// full width (the intro steps aside) — the form stays mounted, so nothing
// the guest entered is lost.
export default function HeroBooking({ prices, intro }: { prices: Record<string, any>; intro: ReactNode }) {
  const [expanded, setExpanded] = useState(false)
  const onStepChange = useCallback((step: number) => setExpanded(step > 1), [])

  return (
    <div className={`grid grid-cols-1 gap-8 lg:gap-12 items-center ${expanded ? '' : 'lg:grid-cols-[minmax(0,1fr)_440px]'}`}>
      <div className={`min-w-0 ${expanded ? 'hidden' : ''}`}>{intro}</div>
      <div className="min-w-0">
        <MainMapBookingForm prices={prices} variant="hero" hideHeader onStepChange={onStepChange} />
      </div>
    </div>
  )
}
