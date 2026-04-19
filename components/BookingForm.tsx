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

// LOCATIONS will be dynamically generated from routePrices


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
  // Derive LOCATIONS dynamically from the routes saved in the DB
  const dynamicLocations = Array.from(
    new Set(routePrices.flatMap((r) => [r.pickup, r.destination]))
  )
  const LOCATIONS = dynamicLocations.length > 0 
    ? dynamicLocations 
    : [`The Hotel — ${hotelName}`, 'Miami International Airport (MIA)', 'Port of Miami', 'Other Destination']

  const [tripType, setTripType] = useState<TripType>('one-way')
  const [pickup, setPickup] = useState<string>(LOCATIONS[0])
  const [destination, setDestination] = useState<string>(LOCATIONS[1] || LOCATIONS[0])
  const [date, setDate] = useState<string>('')
  const [time, setTime] = useState<string>('')
  const [returnDate, setReturnDate] = useState<string>('')
  const [returnTime, setReturnTime] = useState<string>('')
  const [passengers, setPassengers] = useState<number>(2)
  const [customerName, setCustomerName] = useState<string>('')
  const [customerEmail, setCustomerEmail] = useState<string>('')
  const [customerPhone, setCustomerPhone] = useState<string>('')

  // Helper to format MM/DD/YYYY while typing
  const handleDateChange = (val: string, setter: (v: string) => void) => {
    const digits = val.replace(/\D/g, '').slice(0, 8)
    let formatted = digits
    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}/${digits.slice(2)}`
    }
    setter(formatted)
  }
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
        sedan_suv: route.sedan_suv_price || prices.sedan_suv,
        suburban: route.suburban_price || prices.suburban,
        sprinter: route.sprinter_price || prices.sprinter,
        minibus: route.minibus_price || prices.minibus,
        coachbus: route.coachbus_price || prices.coachbus
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

    // Convert MM/DD/YYYY to YYYY-MM-DD for the database
    const usToISO = (usDate: string) => {
      const parts = usDate.split('/')
      if (parts.length !== 3) return usDate
      return `${parts[2]}-${parts[0]}-${parts[1]}`
    }

    // Log the lead for tracking/analytics and act as the primary booking mechanism
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hotelSlug,
          customerName,
          customerEmail,
          customerPhone,
          pickup,
          destination,
          vehicleType,
          // Sending additional fields for the robust leads system
          date: usToISO(date),
          time,
          passengers,
          estimatedTotal: total,
          tripType,
          returnDate: tripType === 'round-trip' ? usToISO(returnDate) : undefined,
          returnTime: tripType === 'round-trip' ? returnTime : undefined
        }),
      })

      if (!res.ok) {
        throw new Error('Failed to submit reservation.')
      }
      
      // Redirect to success state without Stripe
      window.location.href = `/hotel/${hotelSlug}?success=true`
    } catch (e) {
      console.error('[leads] logging error:', e)
      setError('Something went wrong submitting your request. Please try again or call us.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="booking-form" className="w-full py-12">
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
              style={{ color: '#999999' }}
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
                      color: tripType === type ? '#111111' : '#999999',
                    }}
                  >
                    {type === 'one-way' ? 'One Way' : 'Round Trip'}
                  </button>
                ))}
              </div>

              {/* Pickup */}
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>
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
                      {loc.includes('The Hotel') ? loc : loc.replace('The Hotel', `The Hotel — ${hotelName}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination */}
              <div className="flex flex-col gap-1">
                <label className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>
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
                      {loc.includes('The Hotel') ? loc : loc.replace('The Hotel', `The Hotel — ${hotelName}`)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date + Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>
                    Date (MM/DD/YYYY)
                  </label>
                  <input
                    type="text"
                    placeholder="MM/DD/YYYY"
                    value={date}
                    onChange={(e) => handleDateChange(e.target.value, setDate)}
                    required
                    maxLength={10}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none"
                    style={{ background: '#111111', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1">
                    <label
                      className="text-xs uppercase tracking-widest"
                      style={{ color: '#999999' }}
                    >
                      Return Date (MM/DD/YYYY)
                    </label>
                    <input
                      type="text"
                      placeholder="MM/DD/YYYY"
                      value={returnDate}
                      onChange={(e) => handleDateChange(e.target.value, setReturnDate)}
                      required
                      maxLength={10}
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
                      style={{ color: '#999999' }}
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
                <label className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>
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
                <p className="text-xs uppercase tracking-widest" style={{ color: '#999999' }}>Passenger Details</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#999999]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="email"
                    placeholder="Email Address"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    required
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#999999]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="tel"
                    placeholder="Phone Number (Optional)"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#999999]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                  <input
                    type="text"
                    placeholder="Country (Optional)"
                    value={customerCountry}
                    onChange={(e) => setCustomerCountry(e.target.value)}
                    className="w-full rounded-lg px-4 py-3 text-sm outline-none placeholder-[#999999]"
                    style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', color: '#FFFFFF' }}
                  />
                </div>
              </div>
              {/* Estimated Total */}
              <div
                className="flex items-center justify-between px-4 py-3 rounded-lg"
                style={{ background: '#111111', border: '1px solid #2a2a2a' }}
              >
                <span className="text-sm uppercase tracking-widest" style={{ color: '#999999' }}>
                  Estimated Total
                </span>
                <span className="text-2xl font-bold" style={{ color: '#EF9F27' }}>
                  ${total}
                  {tripType === 'round-trip' && (
                    <span className="text-xs ml-1" style={{ color: '#999999' }}>
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
                className="w-full py-4 rounded-xl text-sm font-bold uppercase tracking-[3px] transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed"
                style={{
                  background: loading ? '#8a7209' : 'linear-gradient(135deg, #B8960C, #D4AF37)',
                  color: '#0a0a0a',
                  opacity: loading ? 0.85 : 1,
                }}
              >
                {loading && (
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                  </svg>
                )}
                {loading ? 'Processing...' : 'Request Reservation →'}
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
