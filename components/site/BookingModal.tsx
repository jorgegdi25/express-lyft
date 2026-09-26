'use client'

import { useCallback, useEffect, useState } from 'react'
import MainMapBookingForm from '@/components/MainMapBookingForm'

// Booking lightbox for the home page. Any link to "#book" on the page
// (hero button, header "Book a Ride", mobile bar, closing CTA) opens it.
// The form mounts on first open — so Google Maps only loads when a guest
// actually wants to book — and stays mounted after closing, so whatever
// the guest typed is still there if they reopen it.
export const BOOK_HASH = '#book'
// Other components open the lightbox (optionally with a pickup) with:
// window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { pickup } }))
export const OPEN_BOOKING_EVENT = 'expresslyft:open-booking'

export default function BookingModal({ prices }: { prices: Record<string, any> }) {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [wide, setWide] = useState(false)
  const [preset, setPreset] = useState<{ pickup?: string; nonce: number } | undefined>(undefined)
  const onStepChange = useCallback((step: number) => setWide(step > 1), [])

  const show = useCallback((pickup?: string) => {
    setMounted(true)
    setOpen(true)
    if (pickup) setPreset({ pickup, nonce: Date.now() })
    // Put the cursor where the guest continues: From, or To when a pickup
    // was chosen in the hero.
    window.setTimeout(() => {
      const sel = pickup ? 'input[placeholder="Where are you going?"]' : 'input[placeholder="Airport, hotel or address"]'
      const el = document.querySelector<HTMLInputElement>(`[role=dialog] ${sel}`)
      if (el && !el.value) el.focus()
    }, 450)
  }, [])

  // Intercept every "#book" link on the page.
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (a && a.getAttribute('href') === BOOK_HASH) {
        // preventDefault only: Next's Link then skips navigation, and other
        // handlers (e.g. closing the mobile menu) still run.
        e.preventDefault()
        show()
      }
    }
    const onOpen = (e: Event) => show((e as CustomEvent<{ pickup?: string }>).detail?.pickup)
    document.addEventListener('click', onClick, true)
    window.addEventListener(OPEN_BOOKING_EVENT, onOpen)
    if (window.location.hash === BOOK_HASH) show()
    return () => {
      document.removeEventListener('click', onClick, true)
      window.removeEventListener(OPEN_BOOKING_EVENT, onOpen)
    }
  }, [show])

  // Esc to close, and no page scroll behind the lightbox.
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-[70] transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      role="dialog"
      aria-modal="true"
      aria-label="Book your ride"
      aria-hidden={!open}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={() => setOpen(false)}
      />
      <div className="absolute inset-0 overflow-y-auto overscroll-contain" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
        <div className="min-h-full flex items-start sm:items-center justify-center sm:px-6 sm:pb-8 sm:pt-20 md:px-10" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div
            className={`relative w-full transition-[max-width,transform] duration-300 ${wide ? 'sm:max-w-5xl' : 'sm:max-w-[460px]'} ${open ? 'translate-y-0' : 'translate-y-4'}`}
          >
            {/* Mobile: slim top bar with close */}
            <div className="sm:hidden sticky top-0 z-10 flex items-center justify-between px-4 h-14" style={{ background: '#0b0b0b', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/icon-gold-192.webp" alt="Express Lyft" width={32} height={32} className="h-8 w-8" />
              <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="w-10 h-10 rounded-full flex items-center justify-center text-white" style={{ border: '1px solid rgba(255,255,255,0.15)' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
              </button>
            </div>
            {/* Desktop close */}
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close"
              className="hidden sm:flex absolute -top-12 right-0 w-10 h-10 rounded-full items-center justify-center text-white hover:bg-white/10"
              style={{ border: '1px solid rgba(255,255,255,0.25)' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
            <div className="min-h-[calc(100svh-56px)] sm:min-h-0 bg-[#0b0b0b] sm:bg-transparent">
              <MainMapBookingForm prices={prices} variant="hero" hideHeader onStepChange={onStepChange} preset={preset} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
