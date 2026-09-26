'use client'

import { OPEN_BOOKING_EVENT } from '../BookingModal'

// Sixt-style start in the hero: it looks like the first field of the form,
// so the guest's first action is already booking. It opens the booking
// lightbox — with the cursor in "From", or with a popular pickup filled in.
const QUICK_PICKS = [
  { label: 'MIA', pickup: 'Miami International Airport (MIA)' },
  { label: 'FLL', pickup: 'Fort Lauderdale-Hollywood International Airport (FLL)' },
  { label: 'PortMiami', pickup: 'PortMiami, Miami, FL' },
]

function open(pickup?: string) {
  window.dispatchEvent(new CustomEvent(OPEN_BOOKING_EVENT, { detail: { pickup } }))
}

export default function HeroQuickStart() {
  return (
    <div className="w-full max-w-xl">
      <div
        className="flex items-center gap-2 p-2 rounded-2xl"
        style={{ background: 'rgba(12,12,12,0.55)', border: '1px solid rgba(255,255,255,0.18)', backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)' }}
      >
        <button
          type="button"
          onClick={() => open()}
          className="flex-1 min-w-0 flex items-center gap-3 h-12 px-3 rounded-xl text-left hover:bg-white/5 transition-colors"
          aria-label="Start booking: enter your pickup location"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--gold-light)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden className="shrink-0">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
          </svg>
          <span className="truncate text-[15px] text-white/70">Where should we pick you up?</span>
        </button>
        <button
          type="button"
          onClick={() => open()}
          className="shrink-0 h-12 px-5 rounded-xl text-[15px] font-semibold flex items-center gap-2 hover:brightness-105 transition"
          style={{ background: 'var(--brand-gold-gradient)', color: '#0b0b0b' }}
        >
          <span className="hidden sm:inline">See prices</span>
          <span className="sm:hidden">Go</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-[13px] text-white/70">
        <span>From</span>
        {QUICK_PICKS.map((q) => (
          <button
            key={q.label}
            type="button"
            onClick={() => open(q.pickup)}
            className="px-3 py-1.5 rounded-full text-white/90 hover:text-white hover:border-[var(--gold-light)] transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.22)', background: 'rgba(0,0,0,0.25)' }}
          >
            {q.label}
          </button>
        ))}
      </div>
    </div>
  )
}
