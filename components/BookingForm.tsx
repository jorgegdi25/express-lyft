'use client'

import { useState } from 'react'
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
  hotelName: string
  prices: { sedan_suv: number; suburban: number; sprinter: number; minibus: number; coachbus: number }
  routePrices: RoutePrice[]
}

type TripType = 'one-way' | 'round-trip'

const LOCATIONS = [
  'The Hotel',
  'Miami International Airport (MIA)',
  'Fort Lauderdale Airport (FLL)',
  'Port of Miami (Cruise Terminal)',
  'Port Everglades — Fort Lauderdale',
]

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

const todayStr = new Date().toISOString().split('T')[0]

export default function BookingForm({ hotelSlug, hotelName, prices, routePrices }: BookingFormProps) {
  const [tripType, setTripType] = useState<TripType>('one-way')
  const [pickup, setPickup] = useState<string>(`The Hotel`)
  const [destination, setDestination] = useState<string>('Miami International Airport (MIA)')
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

  // Compute prices for all vehicle types for the selected route
  const getRoutePrices = () => {
    const route = routePrices.find(
      (r) => 
        (r.pickup === pickup && r.destination === destination) ||
        (r.pickup === destination && r.destination === pickup)
    )

    if (route) {
      return {
        sedan_suv: route.sedan_suv_price,
        suburban: route.suburban_price,
        sprinter: route.sprinter_price,
        minibus: route.minibus_price,
        coachbus: route.coachbus_price
      }
    }

    // Fallback to global vehicle prices
    return prices
  }

  const currentPrices = getRoutePrices()
  const total = tripType === 'round-trip' ? currentPrices[vehicleType] * 2 : currentPrices[vehicleType]

  const availableDestinations = LOCATIONS.filter((l) => l !== pickup)
  const availablePickups = LOCATIONS.filter((l) => l !== destination)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    if (!date || !time) {
      setError('Please select a date and time.')
      return
    }
    if (tripType === 'round-trip' && (!returnDate || !returnTime)) {
      setError('Please select a return date and time.')
      return
    }
    if (!customerName.trim() || !customerEmail.trim()) {
      setError('Please provide your name and email.')
      return
    }

    setLoading(true)

    // Log the lead for tracking/analytics
    try {
      fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          customerName,
          customerEmail,
          pickup,
          destination,
          vehicleType
        }),
      }).catch(e => console.error('[leads] logging failed:', e))
    } catch (e) {
      console.error('[leads] logging error:', e)
    }

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          pickup,
          destination,
          date,
          time,
          returnDate: tripType === 'round-trip' ? returnDate : undefined,
          returnTime: tripType === 'round-trip' ? returnTime : undefined,
          passengers,
          vehicleType,
          amount: total * 100, // cents
          customerName,
          customerEmail,
          customerPhone,
          customerCountry
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Checkout failed')
      window.location.href = data.url
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="w-full py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Booking Form */}
          <div
            className="rounded-2xl p-6 md:p-10 backdrop-blur-xl"
            style={{ 
              background: 'rgba(26, 26, 26, 0.8)', 
              border: '1px solid rgba(184, 150, 12, 0.1)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)'
            }}
          >
            <p
              className="text-[10px] font-bold uppercase tracking-[4px] mb-8"
              style={{ color: '#555555' }}
            >
              Reservation Details
            </p>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Trip Type Toggle */}
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid #2a2a2a' }}>
                {(['one-way', 'round-trip'] as TripType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setTripType(type)}
                    className="flex-1 py-3 text-sm font-bold uppercase tracking-widest transition-colors"
                    style={{
                      background: tripType === type ? '#B8960C' : 'transparent',
                      color: tripType === type ? '#111111' : '#555555',
                    }}
                  >
                    {type === 'one-way' ? 'One Way' : 'Round Trip'}
                  </button>
                ))}
              </div>

              {/* Pickup */}
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
                  Pickup Location
                </label>
                <select
                  value={pickup}
                  onChange={(e) => setPickup(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                >
                  {availablePickups.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.replace('The Hotel', `The Hotel — ${hotelName}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
                  Destination
                </label>
                <select
                  value={destination}
                  onChange={(e) => setDestination(e.target.value)}
                  className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                  style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                >
                  {availableDestinations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc.replace('The Hotel', `The Hotel — ${hotelName}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
                    Date
                  </label>
                  <input
                    type="date"
                    min={todayStr}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                    style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
                    Time
                  </label>
                  <select
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                    style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
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
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs uppercase tracking-widest"
                      style={{ color: '#555555' }}
                    >
                      Return Date
                    </label>
                    <input
                      type="date"
                      min={date || todayStr}
                      value={returnDate}
                      onChange={(e) => setReturnDate(e.target.value)}
                      required
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                      style={{
                        background: '#111111',
                        border: '1px solid #2a2a2a',
                        color: '#FFFFFF',
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs uppercase tracking-widest"
                      style={{ color: '#555555' }}
                    >
                      Return Time
                    </label>
                    <select
                      value={returnTime}
                      onChange={(e) => setReturnTime(e.target.value)}
                      required
                      className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                      style={{
                        background: '#111111',
                        border: '1px solid #2a2a2a',
                        color: '#FFFFFF',
                      }}
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
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
                  Passengers
                </label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                    className="w-10 h-10 rounded-lg text-xl font-bold flex items-center justify-center transition-colors"
                    style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  >
                    −
                  </button>
                  <span className="text-xl font-bold w-8 text-center" style={{ color: '#FFFFFF' }}>
                    {passengers}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPassengers((p) => Math.min(55, p + 1))}
                    className="w-10 h-10 rounded-lg text-xl font-bold flex items-center justify-center transition-colors"
                    style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Passenger Details */}
              <div className="flex flex-col gap-4 mt-2 mb-2 p-4 rounded-lg" style={{ background: '#111111', border: '1px solid #2a2a2a' }}>
                <p className="text-xs uppercase tracking-widest" style={{ color: '#555555' }}>Passenger Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#555555]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#555555]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#555555]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="text"
                    placeholder="Country (Optional)"
                    value={customerCountry}
                    onChange={(e) => setCustomerCountry(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#555555]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                </div>
              </div>
              {/* Estimated Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: '#111111', border: '1px solid #2a2a2a' }}
              >
                <span className="text-sm uppercase tracking-widest" style={{ color: '#555555' }}>
                  Estimated Total
                </span>
                <span className="text-2xl font-bold" style={{ color: '#EF9F27' }}>
                  ${total}
                  {tripType === 'round-trip' && (
                    <span className="text-xs ml-1" style={{ color: '#555555' }}>
                      (round trip)
                    </span>
                  )}
                </span>
              </div>

              {error && (
                <p className="text-sm text-red-400">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-lg text-sm font-bold uppercase tracking-[3px] transition-opacity"
                style={{
                  background: '#B8960C',
                  color: '#111111',
                  opacity: loading ? 0.7 : 1,
                }}
              >
                {loading ? 'Redirecting...' : 'Pay Now →'}
              </button>
            </form>
          </div>

          {/* Vehicle Display */}
          <VehicleDisplay passengers={passengers} prices={currentPrices} />
        </div>
      </div>
    </section>
  )
}
