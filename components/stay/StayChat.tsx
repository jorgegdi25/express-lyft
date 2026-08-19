'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Image from 'next/image'
import type { StayHotel } from '@/app/stay/page'
import { STAY_LODGING_TAX_RATE_PERCENT } from '@/lib/stayTax'

const PHONE_TEL = 'tel:+18889737896'
const PHONE_DISPLAY = '+1 (888) 973-7896'
const WHATSAPP_URL = 'https://wa.me/19546236207'
const WHATSAPP_DISPLAY = '954-623-6207'
const MAX_SEDAN_SUV_GUESTS = 4

type Step = 'hotel' | 'room' | 'nights' | 'guest' | 'pickup' | 'review'
type RoomType = '1_bed' | '2_beds'

type Bubble = { from: 'bot' | 'user'; text: string }

function todayNY(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
}

// "14:30" (24h, from <input type="time">) -> "2:30 PM", the format the rest
// of the app's leads/date pipeline (and Google Calendar sync) expects.
function to12Hour(time24: string): string {
  const [hStr, mStr] = time24.split(':')
  let h = parseInt(hStr, 10)
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${ampm}`
}

// Quick presets computed in NY time so "ASAP" means something real.
function presetTime(minutesFromNow: number): { label: string; value24: string } {
  const now = new Date()
  const nyNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/New_York' }))
  nyNow.setMinutes(nyNow.getMinutes() + minutesFromNow)
  const value24 = `${String(nyNow.getHours()).padStart(2, '0')}:${String(nyNow.getMinutes()).padStart(2, '0')}`
  return { label: to12Hour(value24), value24 }
}

export default function StayChat({ hotels }: { hotels: StayHotel[] }) {
  const [step, setStep] = useState<Step>('hotel')
  const [transcript, setTranscript] = useState<Bubble[]>([])

  const [selectedHotel, setSelectedHotel] = useState<StayHotel | null>(null)

  const [roomType, setRoomType] = useState<RoomType>('1_bed')
  const [roomQty, setRoomQty] = useState(1)
  const [nights, setNights] = useState(1)

  const [guestName, setGuestName] = useState('')
  const [guestEmail, setGuestEmail] = useState('')
  const [guestPhone, setGuestPhone] = useState('')
  const [guestCount, setGuestCount] = useState(1)
  const [airline, setAirline] = useState('')
  const [flightNumber, setFlightNumber] = useState('')

  const [pickupTime, setPickupTime] = useState('')

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [discountInput, setDiscountInput] = useState('')
  const [appliedDiscount, setAppliedDiscount] = useState<{ code: string; type: 'percent' | 'fixed'; value: number } | null>(null)
  const [discountChecking, setDiscountChecking] = useState(false)
  const [discountError, setDiscountError] = useState<string | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [transcript, step])

  // ---- Booking flow ----
  function pushBubble(from: 'bot' | 'user', text: string) {
    setTranscript(t => [...t, { from, text }])
  }

  function selectHotel(hotel: StayHotel) {
    setSelectedHotel(hotel)
    pushBubble('user', `I'll take ${hotel.name}`)
    pushBubble('bot', `Great choice — $${hotel.price}/night, transportation included. What type of room do you need?`)
    setStep('room')
  }

  function confirmRoom() {
    pushBubble('user', `${roomQty}x ${roomType === '2_beds' ? '2 Beds' : '1 Bed'}`)
    pushBubble('bot', 'How many nights will you be staying?')
    setStep('nights')
  }

  function confirmNights() {
    pushBubble('user', `${nights} night${nights > 1 ? 's' : ''}`)
    pushBubble('bot', 'Can I get your details for the reservation?')
    setStep('guest')
  }

  function confirmGuest() {
    if (!guestName || !guestEmail || !guestPhone) {
      setError('Please fill in your name, email, and phone.')
      return
    }
    if (guestCount > MAX_SEDAN_SUV_GUESTS) {
      setError(`Our standard SUV seats up to ${MAX_SEDAN_SUV_GUESTS}. For larger groups, please call ${PHONE_DISPLAY} or WhatsApp ${WHATSAPP_DISPLAY} — we'll arrange a bigger vehicle.`)
      return
    }
    setError(null)
    pushBubble('user', `${guestName} · ${guestCount} guest${guestCount > 1 ? 's' : ''}`)
    pushBubble('bot', 'Last step — what time should we pick you up at the airport?')
    setStep('pickup')
  }

  function confirmPickup() {
    if (!pickupTime) {
      setError('Please select a pickup time.')
      return
    }
    setError(null)
    pushBubble('user', pickupTime)
    pushBubble('bot', 'Here is your summary — ready to confirm and pay?')
    setStep('review')
  }

  const total = selectedHotel ? selectedHotel.price * roomQty * nights : 0
  const discountAmount = appliedDiscount
    ? Math.min(appliedDiscount.type === 'percent' ? total * (appliedDiscount.value / 100) : appliedDiscount.value, total)
    : 0
  const discountedTotal = Math.round((total - discountAmount) * 100) / 100
  // Same 13% used server-side (lib/stayTax.ts) to build the QuickBooks
  // invoice — shown here so the guest sees the real charge before paying,
  // not a vague "taxes calculated at checkout".
  const lodgingTax = Math.round(discountedTotal * (STAY_LODGING_TAX_RATE_PERCENT / 100) * 100) / 100

  async function applyDiscountCode() {
    if (!discountInput.trim()) return
    setDiscountChecking(true)
    setDiscountError(null)
    try {
      const res = await fetch('/api/discount-codes/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: discountInput, amount: total }),
      })
      const data = await res.json()
      if (!data.valid) {
        setDiscountError(data.error || 'Invalid code.')
        setAppliedDiscount(null)
        return
      }
      setAppliedDiscount({ code: data.code, type: data.type, value: data.value })
    } catch {
      setDiscountError('Could not check that code right now.')
    } finally {
      setDiscountChecking(false)
    }
  }

  function removeDiscountCode() {
    setAppliedDiscount(null)
    setDiscountInput('')
    setDiscountError(null)
  }

  async function submitPayment() {
    if (!selectedHotel) return
    setSubmitting(true)
    setError(null)
    try {
      const res = await fetch('/api/stay/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stayHotelId: selectedHotel.id,
          roomType,
          roomQty,
          nights,
          checkInDate: todayNY(),
          guestName,
          guestEmail,
          guestPhone,
          guestCount,
          airline: airline || undefined,
          flightNumber: flightNumber || undefined,
          pickupTime,
          discountCode: appliedDiscount?.code,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.url) {
        setError(data.error || 'Something went wrong starting checkout.')
        setSubmitting(false)
        return
      }
      window.location.href = data.url
    } catch (e) {
      setError('Network error — please try again.')
      setSubmitting(false)
    }
  }

  const presets = useMemo(() => [presetTime(30), presetTime(60), presetTime(120)], [step])

  return (
    <div className="flex flex-col">
      <p className="text-center text-xs text-[#777] mb-4">
        Questions? <a href={PHONE_TEL} className="font-semibold" style={{ color: '#D4AF37' }}>Call {PHONE_DISPLAY}</a>
        {' '}or{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: '#4ade80' }}>WhatsApp us</a>
      </p>

      {transcript.length > 0 && (
        <div ref={scrollRef} className="flex flex-col gap-3 mb-4 max-h-64 overflow-y-auto pr-1">
          {transcript.map((b, i) => (
            <div key={i} className={`max-w-[90%] px-4 py-2.5 rounded-2xl text-sm leading-snug ${b.from === 'bot' ? 'self-start rounded-bl-sm' : 'self-end rounded-br-sm'}`}
              style={b.from === 'bot'
                ? { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#eee' }
                : { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a', fontWeight: 600 }}>
              {b.text}
            </div>
          ))}
        </div>
      )}

      {step === 'hotel' && (
        <div className="flex flex-col gap-4">
          {hotels.length === 0 && (
            <p className="text-sm text-[#888] text-center py-8">No rooms available right now — please call {PHONE_DISPLAY} and we'll help directly.</p>
          )}
          {hotels.map(h => (
            <button key={h.id} onClick={() => selectHotel(h)}
              className="text-left rounded-xl overflow-hidden transition-all hover:brightness-110 active:scale-[0.99]"
              style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
              <div className="relative w-full aspect-[16/7]" style={{ background: '#222' }}>
                {h.photo_url && <Image src={h.photo_url} alt={h.name} fill className="object-cover" unoptimized />}
                {h.rooms_available <= 3 ? (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(239,68,68,0.9)', color: '#fff' }}>
                    Only {h.rooms_available} left tonight
                  </div>
                ) : (
                  <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(74,222,128,0.9)', color: '#0a0a0a' }}>
                    Available
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-4">
                <div>
                  <p className="text-white font-bold text-lg" style={{ fontFamily: 'Georgia, serif' }}>{h.name}</p>
                  <p className="text-xs" style={{ color: '#4ade80' }}>Airport transportation included</p>
                </div>
                <p className="text-right">
                  <span className="text-[#D4AF37] font-bold text-xl">${h.price}</span>
                  <span className="block text-xs text-[#888]">/night</span>
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {step === 'room' && (
        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <div className="flex gap-3">
            {(['1_bed', '2_beds'] as RoomType[]).map(rt => (
              <button key={rt} onClick={() => setRoomType(rt)} className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={roomType === rt ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' } : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                {rt === '2_beds' ? '2 Beds' : '1 Bed'}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ccc]">Number of rooms</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setRoomQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }}>−</button>
              <span className="text-white font-bold w-4 text-center">{roomQty}</span>
              <button onClick={() => setRoomQty(q => Math.min(selectedHotel?.rooms_available || 1, q + 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }}>+</button>
            </div>
          </div>
          <button onClick={confirmRoom} className="mt-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>Continue</button>
        </div>
      )}

      {step === 'nights' && (
        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <div className="flex gap-3">
            {[1, 2, 3].map(n => (
              <button key={n} onClick={() => setNights(n)} className="flex-1 py-3 rounded-xl font-bold text-sm"
                style={nights === n ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' } : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                {n} night{n > 1 ? 's' : ''}
              </button>
            ))}
          </div>
          <button onClick={confirmNights} className="mt-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>Continue</button>
        </div>
      )}

      {step === 'guest' && (
        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full name" className="px-4 py-3 rounded-xl text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Email" type="email" className="px-4 py-3 rounded-xl text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          <input value={guestPhone} onChange={e => setGuestPhone(e.target.value)} placeholder="Phone" type="tel" className="px-4 py-3 rounded-xl text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#ccc]">Number of guests</span>
            <div className="flex items-center gap-3">
              <button onClick={() => setGuestCount(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }}>−</button>
              <span className="text-white font-bold w-4 text-center">{guestCount}</span>
              <button onClick={() => setGuestCount(q => q + 1)} className="w-8 h-8 rounded-full font-bold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }}>+</button>
            </div>
          </div>
          <div className="flex gap-3">
            <input value={airline} onChange={e => setAirline(e.target.value)} placeholder="Airline (optional)" className="flex-1 px-4 py-3 rounded-xl text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
            <input value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="Flight # (optional)" className="flex-1 px-4 py-3 rounded-xl text-sm text-white" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={confirmGuest} className="mt-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>Continue</button>
        </div>
      )}

      {step === 'pickup' && (
        <div className="flex flex-col gap-3 p-4 rounded-xl" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <p className="text-xs text-[#888]">When should we pick you up at Fort Lauderdale Airport (FLL)?</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map(p => (
              <button key={p.value24} onClick={() => setPickupTime(to12Hour(p.value24))} className="px-3 py-1.5 rounded-lg text-xs font-semibold" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>{p.label}</button>
            ))}
          </div>
          <input type="time" onChange={e => setPickupTime(to12Hour(e.target.value))} className="px-4 py-3 rounded-xl text-sm text-white w-full" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }} />
          {pickupTime && <p className="text-xs text-[#4ade80]">Selected: {pickupTime}</p>}
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={confirmPickup} className="mt-1 py-3 rounded-xl font-bold text-sm" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>Continue</button>
        </div>
      )}

      {step === 'review' && selectedHotel && (
        <div className="flex flex-col gap-3 p-5 rounded-xl" style={{ background: '#161616', border: '1px solid #2a2a2a' }}>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Hotel</span><span className="text-white font-semibold">{selectedHotel.name}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Room</span><span className="text-white font-semibold">{roomQty}x {roomType === '2_beds' ? '2 Beds' : '1 Bed'}, {nights} night{nights > 1 ? 's' : ''}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Airport pickup</span><span className="text-white font-semibold">FLL → {selectedHotel.name} · {pickupTime}</span></div>
          <div className="flex justify-between text-sm"><span className="text-[#888]">Guest</span><span className="text-white font-semibold">{guestName}</span></div>
          <hr style={{ borderColor: '#2a2a2a' }} />

          {!appliedDiscount ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={discountInput}
                onChange={(e) => { setDiscountInput(e.target.value.toUpperCase()); setDiscountError(null) }}
                placeholder="Have a discount code?"
                className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                style={{ background: '#0f0f0f', border: '1px solid #2a2a2a', color: 'white' }}
              />
              <button
                type="button"
                onClick={applyDiscountCode}
                disabled={discountChecking || !discountInput.trim()}
                className="px-4 rounded-lg text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                style={{ border: '1px solid #D4AF37', color: '#D4AF37' }}
              >
                {discountChecking ? '...' : 'Apply'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)' }}>
              <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                Code {appliedDiscount.code} applied — {appliedDiscount.type === 'percent' ? `${appliedDiscount.value}% off` : `$${appliedDiscount.value} off`}
              </span>
              <button type="button" onClick={removeDiscountCode} className="text-xs font-bold uppercase text-[#888]">Remove</button>
            </div>
          )}
          {discountError && <p className="text-xs text-red-400">{discountError}</p>}

          <div className="flex justify-between text-sm"><span className="text-[#888]">Subtotal (transportation included)</span><span className="text-white">${total.toFixed(2)}</span></div>
          {appliedDiscount && (
            <div className="flex justify-between text-sm"><span className="text-[#888]">Discount</span><span className="text-[#4ade80]">-${discountAmount.toFixed(2)}</span></div>
          )}
          <div className="flex justify-between text-sm"><span className="text-[#888]">FL Lodging Tax ({STAY_LODGING_TAX_RATE_PERCENT}%)</span><span className="text-white">${lodgingTax.toFixed(2)}</span></div>
          <div className="flex justify-between text-base"><span className="text-[#ccc]">Total</span><span className="text-[#D4AF37] font-bold">${(discountedTotal + lodgingTax).toFixed(2)}</span></div>
          <p className="text-xs text-[#666]">You'll pay on a secure QuickBooks page, then get your confirmation by email — please check spam/junk too.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}
          <button onClick={submitPayment} disabled={submitting} className="mt-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>
            {submitting ? 'Redirecting to payment...' : 'Confirm & Pay'}
          </button>
        </div>
      )}
    </div>
  )
}
