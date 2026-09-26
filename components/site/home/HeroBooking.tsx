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
    <div className={`grid gap-8 lg:gap-12 items-center ${expanded ? '' : 'lg:grid-cols-[1fr_440px]'}`}>
      <div className={expanded ? 'hidden' : ''}>{intro}</div>
      <div className={expanded ? 'w-full' : ''}>
        <MainMapBookingForm prices={prices} variant="hero" hideHeader onStepChange={onStepChange} />
      </div>
    </div>
  )
}
