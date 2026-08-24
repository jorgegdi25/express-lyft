'use client'

import React, { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
import { Check } from 'lucide-react'
import type { StayHotel } from '@/app/stay/page'
import { STAY_LODGING_TAX_RATE_PERCENT } from '@/lib/stayTax'

const PHONE_TEL = 'tel:+18889737896'
const PHONE_DISPLAY = '+1 (888) 973-7896'
const WHATSAPP_URL = 'https://wa.me/19546236207'
const WHATSAPP_DISPLAY = '954-623-6207'
const MAX_SEDAN_SUV_GUESTS = 4

type Step = 'details' | 'checkout' | 'waiting' | 'confirmed'
type RoomType = '1_bed' | '2_beds'

const STEP_NUM: Record<Step, number> = { details: 1, checkout: 2, waiting: 2, confirmed: 2 }
const STEP_LABELS: Record<number, string> = { 1: 'Stay Details', 2: 'Checkout' }

const LABEL_CLASS = 'text-sm font-semibold mb-2 block'
const LABEL_COLOR = { color: '#BBBBBB' }
const INPUT_CLASS = 'w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors'
const INPUT_STYLE = { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#fff' }
const CARD_STYLE = { background: '#161616', border: '1px solid #2a2a2a' }

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
  const [step, setStep] = useState<Step>('details')

  const [selectedHotel, setSelectedHotel] = useState<StayHotel | null>(hotels[0] || null)

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
  const [qbWaitingBookingId, setQbWaitingBookingId] = useState<string | null>(null)

  // QuickBooks' hosted invoice page has no "return to merchant" redirect,
  // so payment opens in a separate tab and we poll here — the guest never
  // loses this page.
  //
  // Confirmation is a bonus, not the point: payment is currently only picked
  // up by the reconcile cron (every 3 min), so this can take minutes to flip.
  // The 'waiting' step is written to be useful immediately without it.
  useEffect(() => {
    if (!qbWaitingBookingId) return
    const deadline = Date.now() + 10 * 60 * 1000
    const interval = setInterval(async () => {
      // Stop after 10 minutes — the emailed receipt is the real confirmation.
      if (Date.now() > deadline) {
        clearInterval(interval)
        return
      }
      try {
        const res = await fetch(`/api/stay/status?id=${qbWaitingBookingId}`, { cache: 'no-store' })
        if (!res.ok) return
        const data = await res.json()
        if (data.status === 'paid') {
          setStep('confirmed')
          setQbWaitingBookingId(null)
        }
      } catch {
        // Keep polling — a transient network error shouldn't stop it
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [qbWaitingBookingId])

  function confirmDetails() {
    if (!selectedHotel) {
      setError('Please select a hotel.')
      return
    }
    if (guestCount > MAX_SEDAN_SUV_GUESTS) {
      setError(`Our standard SUV seats up to ${MAX_SEDAN_SUV_GUESTS}. For larger groups, please call ${PHONE_DISPLAY} or WhatsApp ${WHATSAPP_DISPLAY} — we'll arrange a bigger vehicle.`)
      return
    }
    if (!pickupTime) {
      setError('Please select an airport pickup time.')
      return
    }
    setError(null)
    setStep('checkout')
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

  async function submitPayment(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedHotel) return
    if (!guestName.trim() || !guestEmail.trim() || !guestPhone) {
      setError('Please provide your full name, email, and phone.')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setError('Please enter a valid email address (e.g. name@example.com).')
      return
    }
    setSubmitting(true)
    setError(null)
    // Must open synchronously on the click, before the await below —
    // browsers block window.open() called after an async gap.
    const qbWindow = window.open('', '_blank')
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
        qbWindow?.close()
        setError(data.error || 'Something went wrong starting checkout.')
        setSubmitting(false)
        return
      }
      if (qbWindow && !qbWindow.closed) {
        qbWindow.location.href = data.url
        setQbWaitingBookingId(data.bookingId)
        setStep('waiting')
        setSubmitting(false)
      } else {
        // Popup blocked — fall back to a same-tab redirect.
        window.location.href = data.url
      }
    } catch (e) {
      qbWindow?.close()
      setError('Network error — please try again.')
      setSubmitting(false)
    }
  }

  const presets = useMemo(() => [presetTime(30), presetTime(60), presetTime(120)], [])
  const stepNum = STEP_NUM[step]
  const showProgress = step === 'details' || step === 'checkout'

  return (
    <div className="flex flex-col gap-6">
      <p className="text-center text-xs text-[#777]">
        Questions? <a href={PHONE_TEL} className="font-semibold" style={{ color: '#D4AF37' }}>Call {PHONE_DISPLAY}</a>
        {' '}or{' '}
        <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="font-semibold" style={{ color: '#4ade80' }}>WhatsApp us</a>
      </p>

      {showProgress && (
        <div className="flex items-center justify-center gap-2 max-w-xs mx-auto select-none w-full">
          {[1, 2].map((s) => {
            const isCompleted = s < stepNum
            const isActive = s === stepNum
            return (
              <React.Fragment key={s}>
                <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                  <button
                    type="button"
                    disabled={s > stepNum}
                    onClick={() => { if (s < stepNum) { setError(null); setStep('details') } }}
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-300 ${s < stepNum ? 'cursor-pointer' : 'cursor-default'}`}
                    style={{
                      background: isActive ? 'linear-gradient(135deg, #B8960C, #D4AF37)' : (isCompleted ? 'rgba(184,150,12,0.2)' : '#1a1a1a'),
                      border: `1px solid ${isActive || isCompleted ? '#D4AF37' : '#2a2a2a'}`,
                      color: isActive ? '#0a0a0a' : (isCompleted ? '#D4AF37' : '#888'),
                    }}
                  >
                    {isCompleted ? <Check size={14} strokeWidth={3} /> : s}
                  </button>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-center" style={{ color: isActive ? '#D4AF37' : '#666' }}>
                    {STEP_LABELS[s]}
                  </span>
                </div>
                {s < 2 && (
                  <div className="h-[2px] flex-1 -mt-5" style={{ background: s < stepNum ? 'linear-gradient(90deg, #B8960C, #D4AF37)' : '#222' }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      )}

      {step === 'details' && (
        <div className="rounded-2xl p-5 flex flex-col gap-5" style={CARD_STYLE}>
          <div>
            <label className={LABEL_CLASS} style={LABEL_COLOR}>Hotel</label>
            {hotels.length === 0 ? (
              <p className="text-sm text-[#888] text-center py-8">No rooms available right now — please call {PHONE_DISPLAY} and we'll help directly.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {hotels.map((h, i) => (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => { setSelectedHotel(h); setRoomQty(1) }}
                    className="text-left rounded-xl overflow-hidden transition-all hover:brightness-110 active:scale-[0.99]"
                    style={selectedHotel?.id === h.id ? { background: '#161616', border: '2px solid #D4AF37' } : { background: '#161616', border: '1px solid #2a2a2a' }}
                  >
                    <div className="relative w-full aspect-[16/7]" style={{ background: '#222' }}>
                      {h.photo_url && <Image src={h.photo_url} alt={h.name} fill className="object-cover" unoptimized />}
                      {i === 0 && (
                        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider" style={{ background: 'rgba(212,175,55,0.95)', color: '#0a0a0a' }}>
                          Featured
                        </div>
                      )}
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
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Room Type</label>
              <div className="flex gap-2">
                {(['1_bed', '2_beds'] as RoomType[]).map(rt => (
                  <button key={rt} type="button" onClick={() => setRoomType(rt)} className="flex-1 py-3 rounded-xl font-bold text-sm"
                    style={roomType === rt ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' } : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                    {rt === '2_beds' ? '2 Beds' : '1 Bed'}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Nights</label>
              <div className="flex gap-2">
                {[1, 2, 3].map(n => (
                  <button key={n} type="button" onClick={() => setNights(n)} className="flex-1 py-3 rounded-xl font-bold text-sm"
                    style={nights === n ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' } : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Rooms</label>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <button type="button" onClick={() => setRoomQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#222', color: '#fff' }}>−</button>
                <span className="text-white font-bold flex-1 text-center">{roomQty}</span>
                <button type="button" onClick={() => setRoomQty(q => Math.min(selectedHotel?.rooms_available || 1, q + 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#222', color: '#fff' }}>+</button>
              </div>
            </div>
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Guests</label>
              <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}>
                <button type="button" onClick={() => setGuestCount(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-full font-bold" style={{ background: '#222', color: '#fff' }}>−</button>
                <span className="text-white font-bold flex-1 text-center">{guestCount}</span>
                <button type="button" onClick={() => setGuestCount(q => q + 1)} className="w-8 h-8 rounded-full font-bold" style={{ background: '#222', color: '#fff' }}>+</button>
              </div>
            </div>
          </div>

          <div>
            <label className={LABEL_CLASS} style={LABEL_COLOR}>Airport Pickup Time (FLL)</label>
            <div className="flex gap-2 flex-wrap mb-2">
              {presets.map(p => (
                <button key={p.value24} type="button" onClick={() => setPickupTime(to12Hour(p.value24))} className="px-3 py-1.5 rounded-lg text-xs font-semibold"
                  style={pickupTime === to12Hour(p.value24) ? { background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' } : { background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
                  {p.label}
                </button>
              ))}
            </div>
            <input type="time" onChange={e => setPickupTime(to12Hour(e.target.value))} className={INPUT_CLASS} style={INPUT_STYLE} />
            {pickupTime && <p className="text-xs mt-1.5" style={{ color: '#4ade80' }}>Selected: {pickupTime}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Airline (Optional)</label>
              <input value={airline} onChange={e => setAirline(e.target.value)} placeholder="e.g. American Airlines" className={INPUT_CLASS} style={INPUT_STYLE} />
            </div>
            <div>
              <label className={LABEL_CLASS} style={LABEL_COLOR}>Flight # (Optional)</label>
              <input value={flightNumber} onChange={e => setFlightNumber(e.target.value)} placeholder="e.g. AA1234" className={INPUT_CLASS} style={INPUT_STYLE} />
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button type="button" onClick={confirmDetails} disabled={hotels.length === 0}
            className="py-4 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>
            Continue to Checkout →
          </button>
        </div>
      )}

      {step === 'checkout' && selectedHotel && (
        <form onSubmit={submitPayment} className="rounded-2xl p-5 flex flex-col gap-5" style={CARD_STYLE}>
          <div className="flex flex-col gap-2 p-4 rounded-xl" style={{ background: '#0f0f0f', border: '1px solid #2a2a2a' }}>
            <div className="flex justify-between text-sm"><span className="text-[#888]">Hotel</span><span className="text-white font-semibold">{selectedHotel.name}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#888]">Room</span><span className="text-white font-semibold">{roomQty}x {roomType === '2_beds' ? '2 Beds' : '1 Bed'}, {nights} night{nights > 1 ? 's' : ''}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#888]">Airport pickup</span><span className="text-white font-semibold">FLL → {selectedHotel.name} · {pickupTime}</span></div>
            <div className="flex justify-between text-sm"><span className="text-[#888]">Guests</span><span className="text-white font-semibold">{guestCount}</span></div>
          </div>

          <div>
            <label className={LABEL_CLASS} style={LABEL_COLOR}>Your Contact Information</label>
            <div className="flex flex-col gap-3">
              <input value={guestName} onChange={e => setGuestName(e.target.value)} placeholder="Full Name *" className={INPUT_CLASS} style={INPUT_STYLE} required />
              <input value={guestEmail} onChange={e => setGuestEmail(e.target.value)} placeholder="Email Address *" type="email" className={INPUT_CLASS} style={INPUT_STYLE} required />
              <div className="w-full">
                <PhoneInput
                  placeholder="Phone Number *"
                  value={guestPhone}
                  onChange={(val) => setGuestPhone(val || '')}
                  defaultCountry="US"
                  className={`${INPUT_CLASS} phone-input-override`}
                  style={INPUT_STYLE}
                  required
                />
              </div>
            </div>
          </div>

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

          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between text-sm"><span className="text-[#888]">Subtotal (transportation included)</span><span className="text-white">${total.toFixed(2)}</span></div>
            {appliedDiscount && (
              <div className="flex justify-between text-sm"><span className="text-[#888]">Discount</span><span className="text-[#4ade80]">-${discountAmount.toFixed(2)}</span></div>
            )}
            <div className="flex justify-between text-sm"><span className="text-[#888]">FL Lodging Tax ({STAY_LODGING_TAX_RATE_PERCENT}%)</span><span className="text-white">${lodgingTax.toFixed(2)}</span></div>
            <div className="flex justify-between text-base pt-1"><span className="text-[#ccc]">Total</span><span className="text-[#D4AF37] font-bold">${(discountedTotal + lodgingTax).toFixed(2)}</span></div>
          </div>
          <p className="text-xs text-[#666]">You'll pay on a secure QuickBooks page, then get your confirmation by email — please check spam/junk too.</p>
          {error && <p className="text-xs text-red-400">{error}</p>}

          <div className="flex gap-3">
            <button type="button" onClick={() => { setError(null); setStep('details') }} className="px-6 py-4 rounded-xl font-bold text-sm uppercase tracking-wider" style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#ccc' }}>
              ← Back
            </button>
            <button type="submit" disabled={submitting} className="flex-1 py-4 rounded-xl font-bold text-sm uppercase tracking-wider disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>
              {submitting ? 'Redirecting to payment...' : 'Confirm & Pay'}
            </button>
          </div>
        </form>
      )}

      {step === 'waiting' && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl text-center" style={CARD_STYLE}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(212,175,55,0.1)', border: '2px solid #D4AF37' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-bold text-white">Booking registered!</p>
          <p className="text-sm text-[#999]">We opened your secure QuickBooks payment page in a new tab — just finish paying there to lock in your room and airport pickup.</p>
          <p className="text-xs text-[#666]">Already paid? Your emailed receipt is your confirmation — please check spam/junk too. It can take a couple of minutes to show up here.</p>
        </div>
      )}

      {step === 'confirmed' && (
        <div className="flex flex-col items-center gap-3 p-6 rounded-xl text-center" style={CARD_STYLE}>
          <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'rgba(74,222,128,0.1)', border: '2px solid #4ade80' }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <p className="text-base font-bold text-white">Payment Confirmed!</p>
          <p className="text-sm text-[#999]">Your stay and airport transportation are booked. You'll get a confirmation by email — please check spam/junk too.</p>
        </div>
      )}
    </div>
  )
}
