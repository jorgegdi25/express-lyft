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
  isPromo?: boolean
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

export default function BookingForm({ hotelSlug, prices: serverPrices, routePrices: serverRoutePrices, isPromo }: BookingFormProps) {
  // Live data fetched client-side to bypass Next.js server cache
  const [livePrices, setLivePrices] = useState(serverPrices)
  const [liveRoutePrices, setLiveRoutePrices] = useState(serverRoutePrices)

  // Fetch fresh data from the public API every time the component mounts
  useEffect(() => {
    async function fetchFreshData() {
      try {
        const res = await fetch(`/api/public/prices?hotel_slug=${encodeURIComponent(hotelSlug)}`, {
          cache: 'no-store',
          headers: { 'Cache-Control': 'no-cache' },
        })
        if (res.ok) {
          const data = await res.json()
          if (data.prices) setLivePrices(data.prices)
          if (data.routePrices) setLiveRoutePrices(data.routePrices)
        }
      } catch (err) {
        console.error('Failed to fetch fresh prices:', err)
        // Keep using server-provided data as fallback
      }
    }
    fetchFreshData()
  }, [hotelSlug])

  const prices = livePrices
  const routePrices = liveRoutePrices

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
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedVehicleOverride, setSelectedVehicleOverride] = useState<VehicleType | null>(null)
  const [step, setStep] = useState<number>(1)
  const [paymentMode, setPaymentMode] = useState<'full' | 'deposit'>('full')

  const handleNextStep1 = () => {
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
    setStep(2)
    // Scroll smoothly to form header
    const element = document.getElementById('booking-form')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNextStep2 = () => {
    setStep(3)
    const element = document.getElementById('booking-form')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    setError(null)
    setStep((prev) => Math.max(1, prev - 1))
    const element = document.getElementById('booking-form')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }


  useEffect(() => {
    const handleSelectVehicle = (e: Event) => {
      const customEvent = e as CustomEvent<VehicleType>
      if (customEvent.detail) {
        setSelectedVehicleOverride(customEvent.detail)
        
        // Adjust passengers so that the selected vehicle class becomes the default
        const capacities: Record<VehicleType, number> = {
          sedan_suv: 2,
          suburban: 6,
          sprinter: 12,
          minibus: 24,
          coachbus: 45,
        }
        setPassengers(capacities[customEvent.detail] || 2)
      }
    }
    window.addEventListener('select-vehicle', handleSelectVehicle)
    return () => window.removeEventListener('select-vehicle', handleSelectVehicle)
  }, [])

  const vehicleCapacities: Record<VehicleType, number> = {
    sedan_suv: 4,
    suburban: 6,
    sprinter: 14,
    minibus: 31,
    coachbus: 55,
  }

  // Auto-clear the override if the user increases passengers beyond its capacity
  useEffect(() => {
    if (selectedVehicleOverride && passengers > vehicleCapacities[selectedVehicleOverride]) {
      setSelectedVehicleOverride(null)
    }
  }, [passengers, selectedVehicleOverride])

  const minVehicleType = getVehicleType(passengers)
  const vehicleType = selectedVehicleOverride || minVehicleType

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
  const depositAmount = Math.ceil(total * 0.20)
  const chargeAmount = paymentMode === 'deposit' ? depositAmount : total

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
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone.trim() || !customerCountry.trim()) {
      setError('Please provide your full contact information, including phone and country.')
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
          paymentMode,
          isPromo,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to submit reservation.')
      }

      const data = await res.json()
      if (data.url) {
        window.location.href = data.url
      } else {
        setIsSuccess(true)
      }
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

        <div className="max-w-3xl mx-auto">
          {/* ── Booking Form ──────────────────────────────────── */}
          <style dangerouslySetInnerHTML={{__html: `
              input[type="date"]::-webkit-calendar-picker-indicator {
                cursor: pointer;
                filter: invert(0.8);
                transform: scale(1.8);
                padding-left: 10px;
              }
            `}} />

          {isSuccess ? (
            <div
              className="rounded-2xl p-7 md:p-10"
              style={{
                background: '#161616',
                border: '1px solid #2a2a2a',
                boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
              }}
            >
              <div className="flex flex-col items-center justify-center text-center py-12">
                <div className="w-20 h-20 rounded-full flex items-center justify-center mb-6" style={{ background: 'rgba(184,150,12,0.1)', border: '2px solid #B8960C' }}>
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </div>
                <h3 className="text-2xl font-bold mb-4" style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  Reservation Received!
                </h3>
                <p className="text-sm mb-4 font-bold" style={{ color: '#ffbaba' }}>
                  Please check your spam/junk messages to ensure you receive your confirmation email.
                </p>
                <p className="text-base mb-2" style={{ color: '#DDDDDD' }}>
                  Your request has been successfully processed.
                </p>
                <p className="text-base" style={{ color: '#AAAAAA' }}>
                  Our concierge team will contact you shortly to confirm the details and process your payment.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSuccess(false)}
                  className="mt-8 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                  style={{ background: '#222222', color: '#FFFFFF', border: '1px solid #333333' }}
                >
                  Make Another Reservation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8">
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 max-w-md mx-auto select-none w-full">
                {[1, 2, 3].map((s) => {
                  const isCompleted = s < step
                  const isActive = s === step
                  const labels = ['Trip Details', 'Select Vehicle', 'Checkout']
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                        <button
                          type="button"
                          disabled={s > step}
                          onClick={() => s < step && handlePrevStep()}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${s < step ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{
                            background: isActive 
                              ? 'linear-gradient(135deg, #B8960C, #D4AF37)' 
                              : (isCompleted ? 'rgba(184,150,12,0.2)' : '#1e1e1e'),
                            border: `1px solid ${isActive || isCompleted ? '#B8960C' : '#333333'}`,
                            color: isActive ? '#0a0a0a' : (isCompleted ? '#D4AF37' : '#888888'),
                          }}
                        >
                          {isCompleted ? '✓' : s}
                        </button>
                        <span
                          className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300"
                          style={{ color: isActive ? '#D4AF37' : '#666666' }}
                        >
                          {labels[s - 1]}
                        </span>
                      </div>
                      {s < 3 && (
                        <div
                          className="h-[2px] flex-1 -mt-5 transition-all duration-500"
                          style={{
                            background: s < step ? 'linear-gradient(90deg, #B8960C, #D4AF37)' : '#222222'
                          }}
                        />
                      )}
                    </React.Fragment>
                  )
                })}
              </div>

              {/* Step 1: Trip Details */}
              {step === 1 && (
                <div
                  className="rounded-2xl p-7 md:p-10 flex flex-col gap-6"
                  style={{
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                    1. Trip Details
                  </h3>
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

                  {error && (
                    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                      <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={handleNextStep1}
                    className="w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                    style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                  >
                    Choose Your Vehicle →
                  </button>
                </div>
              )}

              {/* Step 2: Vehicle Selection */}
              {step === 2 && (
                <div className="flex flex-col gap-6">
                  <VehicleDisplay 
                    passengers={passengers} 
                    prices={currentPrices}
                    selectedVehicleType={vehicleType}
                    onSelectVehicle={(type) => setSelectedVehicleOverride(type)}
                  />
                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="flex-1 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:bg-[#252525] active:scale-[0.98]"
                      style={{ background: '#1e1e1e', color: '#FFFFFF', border: '1px solid #333333' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="button"
                      onClick={handleNextStep2}
                      className="flex-1 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98]"
                      style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                    >
                      Enter Contact Info →
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: Contact Info & Checkout */}
              {step === 3 && (
                <div
                  className="rounded-2xl p-7 md:p-10 flex flex-col gap-6"
                  style={{
                    background: '#161616',
                    border: '1px solid #2a2a2a',
                    boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
                  }}
                >
                  <h3 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>
                    3. Contact & Checkout
                  </h3>

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
                          placeholder="Phone *"
                          value={customerPhone}
                          onChange={(e) => setCustomerPhone(e.target.value)}
                          className={INPUT_CLASS}
                          style={{ ...INPUT_STYLE }}
                          required
                        />
                        <input
                          type="text"
                          placeholder="Country *"
                          value={customerCountry}
                          onChange={(e) => setCustomerCountry(e.target.value)}
                          className={INPUT_CLASS}
                          style={{ ...INPUT_STYLE }}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Total */}
                  {!isPromo && (
                    <>
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

                      {/* Payment Mode Selector */}
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          How would you like to pay?
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {/* Pay Full */}
                          <button
                            type="button"
                            onClick={() => setPaymentMode('full')}
                            className="rounded-xl p-4 flex flex-col gap-2 text-left transition-all duration-200"
                            style={{
                              background: paymentMode === 'full' ? 'rgba(184,150,12,0.12)' : '#0e0e0e',
                              border: paymentMode === 'full' ? '2px solid #B8960C' : '1px solid #333333',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{
                                  border: paymentMode === 'full' ? '2px solid #B8960C' : '2px solid #555',
                                }}
                              >
                                {paymentMode === 'full' && (
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4AF37' }} />
                                )}
                              </div>
                              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#FFFFFF' }}>
                                Pay Full Amount
                              </span>
                            </div>
                            <span className="text-2xl font-bold ml-7" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>
                              ${total}
                            </span>
                          </button>

                          {/* Pay Deposit */}
                          <button
                            type="button"
                            onClick={() => setPaymentMode('deposit')}
                            className="rounded-xl p-4 flex flex-col gap-2 text-left transition-all duration-200"
                            style={{
                              background: paymentMode === 'deposit' ? 'rgba(184,150,12,0.12)' : '#0e0e0e',
                              border: paymentMode === 'deposit' ? '2px solid #B8960C' : '1px solid #333333',
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div
                                className="w-5 h-5 rounded-full flex items-center justify-center"
                                style={{
                                  border: paymentMode === 'deposit' ? '2px solid #B8960C' : '2px solid #555',
                                }}
                              >
                                {paymentMode === 'deposit' && (
                                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#D4AF37' }} />
                                )}
                              </div>
                              <span className="text-sm font-bold uppercase tracking-wider" style={{ color: '#FFFFFF' }}>
                                Reserve with Deposit
                              </span>
                            </div>
                            <div className="ml-7">
                              <span className="text-2xl font-bold" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>
                                ${depositAmount}
                              </span>
                              <span className="text-xs ml-2 font-semibold" style={{ color: '#888888' }}>(20%)</span>
                            </div>
                          </button>
                        </div>

                        {paymentMode === 'deposit' && (
                          <div
                            className="mt-3 rounded-lg px-4 py-3 flex items-start gap-2"
                            style={{ background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)' }}
                          >
                            <svg className="w-4 h-4 mt-0.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2">
                              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                            </svg>
                            <p className="text-xs leading-relaxed" style={{ color: '#BBBBBB' }}>
                              Remaining <strong style={{ color: '#EF9F27' }}>${total - depositAmount}</strong> is due before your trip — payable by card or cash to your driver.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {/* Terms and Privacy Checkbox */}
                  <div className="flex items-start gap-3 mt-2">
                    <input
                      type="checkbox"
                      id="terms"
                      required
                      className="mt-1 w-5 h-5 rounded cursor-pointer accent-[#B8960C]"
                    />
                    <label htmlFor="terms" className="text-sm cursor-pointer" style={{ color: '#AAAAAA' }}>
                      I agree to the{' '}
                      <a href="/terms" target="_blank" className="underline hover:text-[#B8960C] transition-colors">Terms of Service</a>
                      {' '}and{' '}
                      <a href="/privacy" target="_blank" className="underline hover:text-[#B8960C] transition-colors">Privacy Policy</a>
                      , and I understand the cancellation policy.
                    </label>
                  </div>

                  {error && (
                    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                      <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-4 mt-2">
                    <button
                      type="button"
                      onClick={handlePrevStep}
                      className="w-full sm:w-1/3 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:bg-[#252525] active:scale-[0.98]"
                      style={{ background: '#1e1e1e', color: '#FFFFFF', border: '1px solid #333333' }}
                    >
                      ← Back
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-3 disabled:cursor-not-allowed shadow-xl shadow-[#B8960C20]"
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
                      {loading
                        ? 'Processing…'
                        : isPromo 
                          ? 'Confirm Reservation →'
                          : paymentMode === 'deposit'
                            ? `Pay $${depositAmount} Deposit →`
                            : 'Proceed to Payment →'
                      }
                    </button>
                  </div>
                  
                  {/* Secure Payment Badge */}
                  {!isPromo && (
                    <div className="flex flex-col items-center justify-center gap-1.5 mt-3 select-none">
                      <div className="flex items-center gap-1.5 text-[#888888]">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>
                        <span className="text-xs font-semibold tracking-wider uppercase">100% Secure Checkout</span>
                      </div>
                      <div className="flex items-center gap-1.5 opacity-60">
                        <span className="text-[10px] uppercase font-bold text-[#666666] tracking-widest">Powered by</span>
                        <span className="text-[#635BFF] font-bold" style={{ fontSize: '1.1rem', letterSpacing: '-0.02em', fontFamily: 'system-ui, -apple-system, sans-serif' }}>stripe</span>
                      </div>
                    </div>
                  )}

                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </section>
  )
}
