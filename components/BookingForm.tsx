'use client'

import React, { useState, useEffect, useMemo } from 'react'
import VehicleDisplay from './VehicleDisplay'

interface RoutePrice {
  id: string
  pickup: string
  destination: string
  sedan_suv_price: number
  suburban_price: number
  sprinter_price: number
  minibus_price: number
  coachbus_price: number
}

interface BookingFormProps {
  hotelSlug: string

  prices: { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }
  routePrices: RoutePrice[]
}

type TripType = 'one-way' | 'round-trip'

function generateTimeSlots() {
  const slots: string[] = []
  for (let h = 8; h <= 22; h++) {
    const hStr = h > 12 ? h - 12 : h
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hDisplay = h === 12 ? 12 : hStr
    slots.push(`${hDisplay}:00 ${ampm}`)
    if (h < 22) slots.push(`${hDisplay}:30 ${ampm}`)
  }
  return slots
}

const TIME_SLOTS = generateTimeSlots()

type VehicleType = 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'

function getVehicleType(passengers: number): VehicleType {
  if (passengers <= 4) return 'sedan_suv'
  if (passengers <= 6) return 'suburban'
  if (passengers <= 14) return 'sprinter'
  if (passengers <= 31) return 'minibus'
  return 'coachbus'
}

/* ─── Shared style tokens ─────────────────────────────────────────── */
const LABEL_CLASS = 'text-sm font-semibold mb-2 block'
const LABEL_COLOR = { color: '#BBBBBB' }

const INPUT_CLASS = 'w-full rounded-xl px-4 py-3.5 text-base outline-none transition-colors focus:border-[#B8960C]'
const INPUT_STYLE = { background: '#0e0e0e', border: '1px solid #333333', color: '#FFFFFF' }

const todayStr = new Date().toISOString().split('T')[0]

export default function BookingForm({ hotelSlug, prices, routePrices }: BookingFormProps) {
  const normalizedRoutes = useMemo(() => routePrices.map((r) => ({
    ...r,
    pickup: r.pickup.trim(),
    destination: r.destination.trim(),
  })), [routePrices])

  const dynamicLocations = useMemo(() => Array.from(
    new Set(normalizedRoutes.flatMap((r) => [r.pickup, r.destination]))
  ).filter(Boolean), [normalizedRoutes])

  const LOCATIONS = useMemo(() => 
    dynamicLocations.length > 0
      ? dynamicLocations
      : ['The Hotel', 'Miami International Airport (MIA)', 'Port of Miami', 'Other Destination']
  , [dynamicLocations])

  const [tripType, setTripType] = useState<TripType>('one-way')
  const [pickup, setPickup] = useState<string>('')
  const [destination, setDestination] = useState<string>('')
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [returnDate, setReturnDate] = useState<string>('')
  const [returnTime, setReturnTime] = useState<string>('')
  const [passengers, setPassengers] = useState<number>(2)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')
  const [customerCountry, setCustomerCountry] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const vehicleType = getVehicleType(passengers)

  const getRoutePrices = () => {
    const p = pickup.trim()
    const d = destination.trim()
    const route = normalizedRoutes.find(
      (r) => (r.pickup === p && r.destination === d) || (r.pickup === d && r.destination === p)
    )
    if (route) {
      return {
        sedan_suv: route.sedan_suv_price || prices.sedan_suv,
        suburban: route.suburban_price || prices.suburban,
        sprinter: route.sprinter_price || prices.sprinter,
        minibus: route.minibus_price || prices.minibus,
        coachbus: route.coachbus_price || prices.coachbus,
      }
    }
    return prices
  }

  const currentPrices = getRoutePrices()
  const total = tripType === 'round-trip' ? currentPrices[vehicleType] * 2 : currentPrices[vehicleType]

  const availableDestinations = LOCATIONS.filter((l) => l !== pickup)
  const availablePickups = LOCATIONS.filter((l) => l !== destination)

  // Auto-correct invalid states if the user selects the same location for both
  useEffect(() => {
    if (pickup && destination && pickup === destination) {
      // If they match and they are not empty, we clear the one being changed
      // This is handled by the availableLocations filters below, but this is a backup
    }
  }, [pickup, destination])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!pickup || !destination) {
      setError('Please select both pickup and destination locations.')
      return
    }
    if (!date || !time) {
      setError('Please select a date and time.')
      return
    }
    if (tripType === 'round-trip' && (!returnDate || !returnTime)) {
      setError('Please select a return date and time.')
      return
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please provide your full name and email address.')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          customerName,
          customerEmail,
          customerPhone,
          customerCountry,
          pickup,
          destination,
          vehicleType,
          date,
          time,
          passengers,
          estimatedTotal: total,
          tripType,
          returnDate: tripType === 'round-trip' ? returnDate : undefined,
          returnTime: tripType === 'round-trip' ? returnTime : undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit reservation.')
      }

      window.location.href = `/hotel/${hotelSlug}?success=true`
    } catch (e: any) {
      console.error('[leads] logging error:', e)
      setError(e.message || 'Something went wrong. Please try again or call us directly.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="booking-form" className="w-full py-14 md:py-20">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section header */}
        <div className="text-center mb-10 md:mb-14">
          <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
            Online Reservation
          </p>
          <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Book Your Luxury Ride
          </h2>
          <p className="text-base mt-3" style={{ color: '#999999' }}>
            Fill in the details below and our concierge team will confirm your transfer.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* ── Booking Form ──────────────────────────────────── */}
          <div
            className="rounded-2xl p-7 md:p-10"
            style={{
              background: '#161616',
              border: '1px solid #2a2a2a',
              boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
            }}
          >
            <h3 className="text-lg font-bold mb-6" style={{ color: '#FFFFFF' }}>
              Reservation Details
            </h3>

            <style dangerouslySetInnerHTML={{__html: `
                input[type="date"]::-webkit-calendar-picker-indicator {
                  cursor: pointer;
                  filter: invert(0.8);
                  transform: scale(1.8);
                  padding-left: 10px;
                }
              `}} />

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Trip Type Toggle */}
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid #333333' }}>
                {(['one-way', 'round-trip'] as TripType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripType(type)}
                    className="flex-1 py-3.5 text-sm font-bold uppercase tracking-wider transition-all"
                    style={{
                      background:
                        tripType === type
                          ? 'linear-gradient(135deg, #B8960C, #D4AF37)'
                          : 'transparent',
                      color: tripType === type ? '#111111' : '#888888',
                    }}
                  >
                    {type === 'one-way' ? 'One Way' : 'Round Trip'}
                  </button>
                ))}
              </div>

              {/* Pickup */}
              <div>
                <label className={LABEL_CLASS} style={LABEL_COLOR}>
                  Pickup Location
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className={`${INPUT_CLASS} min-h-[60px] text-lg sm:text-base`}
                  style={INPUT_STYLE}
                >
                  <option value="">Select Pickup Location...</option>
                  {availablePickups.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === 'The Hotel' ? `The Hotel` : loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div>
                <label className={LABEL_CLASS} style={LABEL_COLOR}>
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className={`${INPUT_CLASS} min-h-[60px] text-lg sm:text-base`}
                  style={INPUT_STYLE}
                >
                  <option value="">Select Destination...</option>
                  {availableDestinations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc === 'The Hotel' ? `The Hotel` : loc}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label className={LABEL_CLASS} style={LABEL_COLOR}>
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className={`${INPUT_CLASS} min-h-[60px] text-lg px-5 py-4`}
                    style={INPUT_STYLE}
                  />
                </div>
                <div>
                  <label className={LABEL_CLASS} style={LABEL_COLOR}>
                    Pickup Time
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className={`${INPUT_CLASS} min-h-[60px] text-lg px-5 py-4`}
                    style={INPUT_STYLE}
                  >
                    <option value="">Select time</option>
                    {TIME_SLOTS.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Round Trip fields */}
              {tripType === 'round-trip' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label className={LABEL_CLASS} style={LABEL_COLOR}>
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={date || todayStr}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      className={`${INPUT_CLASS} min-h-[60px] text-lg px-5 py-4`}
                      style={INPUT_STYLE}
                    />
                  </div>
                  <div>
                    <label className={LABEL_CLASS} style={LABEL_COLOR}>
                      Return Time
                    </label>
                    <select
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      required
                      className={`${INPUT_CLASS} min-h-[60px] text-lg px-5 py-4`}
                      style={INPUT_STYLE}
                    >
                      <option value="">Select time</option>
                      {TIME_SLOTS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* Passengers counter */}
              <div>
                <label className={LABEL_CLASS} style={LABEL_COLOR}>
                  Number of Passengers
                </label>
                <div
                  className="flex items-center justify-between rounded-xl px-4 py-3"
                  style={{ background: '#0e0e0e', border: '1px solid #333333' }}
                >
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                    className="w-11 h-11 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                    style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                    aria-label="Decrease passengers"
                  >
                    −
                  </button>
                  <div className="text-center">
                    <span className="text-3xl font-bold" style={{ color: '#FFFFFF' }}>
                      {passengers}
                    </span>
                    <p className="text-xs mt-0.5" style={{ color: '#888888' }}>
                      passenger{passengers !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.min(55, p + 1))}
                    className="w-11 h-11 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                    style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                    aria-label="Increase passengers"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Passenger Details */}
              <div>
                <label className={LABEL_CLASS} style={LABEL_COLOR}>
                  Your Contact Information
                </label>
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Full Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className={INPUT_CLASS}
                    style={{ ...INPUT_STYLE }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address *"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className={INPUT_CLASS}
                    style={{ ...INPUT_STYLE }}
                  />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="tel"
                      placeholder="Phone (Optional)"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      className={INPUT_CLASS}
                      style={{ ...INPUT_STYLE }}
                    />
                    <input
                      type="text"
                      placeholder="Country (Optional)"
                      value={customerCountry}
                      onChange={(e) => setCustomerCountry(e.target.value)}
                      className={INPUT_CLASS}
                      style={{ ...INPUT_STYLE }}
                    />
                  </div>
                </div>
              </div>

              {/* Estimated Total */}
              <div
                className="rounded-xl px-5 py-4 flex items-center justify-between"
                style={{
                  background: 'rgba(184,150,12,0.08)',
                  border: '1px solid rgba(184,150,12,0.3)',
                }}
              >
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest mb-0.5" style={{ color: '#B8960C' }}>
                    Estimated Total
                  </p>
                  {tripType === 'round-trip' && (
                    <p className="text-xs" style={{ color: '#888888' }}>Round trip included</p>
                  )}
                </div>
                <span className="text-4xl font-bold" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  ${total}
                </span>
              </div>

              {error && (
                <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                  <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-xl shadow-[#B8960C20]"
                style={{
                  background: loading ? '#8a7209' : 'linear-gradient(135deg, #B8960C, #D4AF37)',
                  color: '#0a0a0a',
                  opacity: loading ? 0.85 : 1,
                }}
              >
                {loading && (
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? 'Submitting…' : 'Request Reservation →'}
              </button>

              <p className="text-xs text-center" style={{ color: '#666666' }}>
                No payment required now. Our team will contact you to confirm.
              </p>
            </form>
          </div>

          {/* ── Vehicle Display ───────────────────────────────── */}
          <VehicleDisplay passengers={passengers} prices={currentPrices} />
        </div>
      </div>
    </section>
  )
}
