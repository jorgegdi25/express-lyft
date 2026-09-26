'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

// Step 1 "lite": captures the essentials and hands off to /book, where the
// real booking engine (MainMapBookingForm) takes over with the map, pricing
// and checkout. It does not submit anything by itself.

const QUICK_PLACES = [
  { label: 'MIA', value: 'Miami International Airport (MIA)' },
  { label: 'FLL', value: 'Fort Lauderdale-Hollywood International Airport (FLL)' },
  { label: 'PortMiami', value: 'PortMiami, Miami, FL' },
]

export default function TripStarter({
  variant = 'bar',
  defaultPickup = '',
  defaultDestination = '',
  service,
}: {
  variant?: 'bar' | 'card'
  defaultPickup?: string
  defaultDestination?: string
  service?: string
}) {
  const router = useRouter()
  const [pickup, setPickup] = useState(defaultPickup)
  const [destination, setDestination] = useState(defaultDestination)
  const [date, setDate] = useState('')
  const [passengers, setPassengers] = useState(2)
  const [minDate, setMinDate] = useState('')

  useEffect(() => {
    const now = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/New_York' }))
    setMinDate(`${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`)
  }, [])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams()
    if (pickup.trim()) params.set('pickup', pickup.trim())
    if (destination.trim()) params.set('dropoff', destination.trim())
    if (date) params.set('date', date)
    params.set('pax', String(passengers))
    if (service) params.set('service', service)
    router.push(`/book?${params.toString()}`)
  }

  const isBar = variant === 'bar'
  const field = 'w-full h-[52px] rounded-xl px-4 text-[16px] outline-none transition-colors focus:border-[var(--gold)] placeholder:text-white/40'
  const fieldStyle = { background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.16)', color: '#fff' }
  const label = 'block text-[10px] font-bold uppercase tracking-[0.16em] mb-1.5 text-white/60'
  const wide = isBar ? 'col-span-2 lg:col-span-1' : 'col-span-2'

  return (
    <form
      onSubmit={submit}
      className={`rounded-2xl p-4 md:p-5 ${isBar ? 'lg:p-3 lg:pl-5' : ''}`}
      style={{
        background: 'rgba(16,16,16,0.72)',
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        boxShadow: '0 30px 80px -20px rgba(0,0,0,0.7)',
      }}
      aria-label="Start your booking"
    >
      <div className={`grid gap-3 ${isBar ? 'grid-cols-2 lg:grid-cols-[1.35fr_1.35fr_1fr_0.7fr_auto] lg:items-end' : 'grid-cols-2'}`}>
        <div className={wide}>
          <label htmlFor="ts-pickup" className={label}>Pickup</label>
          <input id="ts-pickup" value={pickup} onChange={(e) => setPickup(e.target.value)} placeholder="Airport, hotel or address" className={field} style={fieldStyle} autoComplete="off" />
        </div>
        <div className={wide}>
          <label htmlFor="ts-dropoff" className={label}>Destination</label>
          <input id="ts-dropoff" value={destination} onChange={(e) => setDestination(e.target.value)} placeholder="Hotel, port or address" className={field} style={fieldStyle} autoComplete="off" />
        </div>
        <div>
          <label htmlFor="ts-date" className={label}>Date</label>
          <input id="ts-date" type="date" min={minDate} value={date} onChange={(e) => setDate(e.target.value)} className={`${field} [color-scheme:dark]`} style={fieldStyle} />
        </div>
        <div>
          <label htmlFor="ts-pax" className={label}>Passengers</label>
          <select id="ts-pax" value={passengers} onChange={(e) => setPassengers(Number(e.target.value))} className={field} style={fieldStyle}>
            {Array.from({ length: 14 }, (_, i) => i + 1).map((n) => <option key={n} value={n}>{n}</option>)}
            <option value={20}>15–31</option>
            <option value={40}>32+</option>
          </select>
        </div>
        <button
          type="submit"
          className={`${wide} h-[52px] px-6 rounded-xl text-[14px] font-semibold hover:brightness-110 transition whitespace-nowrap`}
          style={{ background: 'var(--brand-gold-gradient)', color: 'var(--bg-deep)' }}
        >
          See vehicles & prices
        </button>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-white/55">
        <span>Popular:</span>
        {QUICK_PLACES.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => (pickup ? setDestination(p.value) : setPickup(p.value))}
            className="px-2.5 py-1 rounded-full border border-white/15 hover:border-[var(--gold-light)] hover:text-white transition-colors"
          >
            {p.label}
          </button>
        ))}
      </div>
    </form>
  )
}
