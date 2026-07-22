'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import Image from 'next/image'
import PhoneInput from 'react-phone-number-input'
import 'react-phone-number-input/style.css'
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
  for (let h = 5; h <= 23; h++) {
    const hStr = h > 12 ? h - 12 : h
    // 12 is PM, 24 would be AM but loop goes up to 23
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hDisplay = h === 12 ? 12 : hStr
    slots.push(`${hDisplay}:00 ${ampm}`)
    // Include the 30-minute slot for all hours up to 23 (11:30 PM)
    slots.push(`${hDisplay}:30 ${ampm}`)
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

// Removed global todayStr to prevent hydration mismatches

export default function BookingForm({ hotelSlug, prices: serverPrices, routePrices: serverRoutePrices, isPromo }: BookingFormProps) {
  // Live data fetched client-side to bypass Next.js server cache
  const [livePrices, setLivePrices] = useState(serverPrices)
  const [liveRoutePrices, setLiveRoutePrices] = useState(serverRoutePrices)
  const [minDateStr, setMinDateStr] = useState<string>('')

  // Calculate local date safely on the client
  useEffect(() => {
    setMinDateStr(new Date().toISOString().split('T')[0])
  }, [])

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

  const LOCATIONS = useMemo(() => {
    let locs = dynamicLocations.length > 0
      ? dynamicLocations
      : ['The Hotel', 'Miami International Airport (MIA)', 'Fort Lauderdale Airport (FLL)', 'Port of Miami', 'Other Destination']
    
    if (isPromo) {
      locs = locs.filter(loc => !loc.toLowerCase().includes('port') && !loc.toLowerCase().includes('other'))
    }
    return locs
  }, [dynamicLocations, isPromo])

  const [tripType, setTripType] = useState<TripType>(isPromo ? 'round-trip' : 'one-way')
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
  const [airline, setAirline] = useState<string>('')
  const [flightNumber, setFlightNumber] = useState<string>('')
  const [meetingType, setMeetingType] = useState<'curbside' | 'meet_greet'>('curbside')
  const [carSeatsRequested, setCarSeatsRequested] = useState<number>(0)
  const [luggageCount, setLuggageCount] = useState<number>(0)
  const [notes, setNotes] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)
  const [selectedVehicleOverride, setSelectedVehicleOverride] = useState<VehicleType | null>(null)
  const [step, setStep] = useState<number>(1)
  const [paymentMode, setPaymentMode] = useState<'full' | 'deposit'>('full')

  const getAvailableTimeSlots = (dateString: string) => {
    if (!dateString) return TIME_SLOTS;
    
    // Obtener la hora actual en la zona horaria de Florida (Miami)
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const now = new Date(nowStr);
    
    const selectedDate = new Date(`${dateString}T00:00:00`)
    const isToday =
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    
    if (!isToday) return TIME_SLOTS;

    return TIME_SLOTS.filter(t => {
      const match = t.match(/(\d+):(\d+) (AM|PM)/)
      if (!match) return true
      let hours = parseInt(match[1])
      const minutes = parseInt(match[2])
      const ampm = match[3]
      if (ampm === 'PM' && hours < 12) hours += 12
      if (ampm === 'AM' && hours === 12) hours = 0

      const slotDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      return slotDateTime > now
    })
  }

  const availableTimeSlotsList = useMemo(() => getAvailableTimeSlots(date), [date])
  const availableReturnTimeSlotsList = useMemo(() => getAvailableTimeSlots(returnDate), [returnDate])

  const isUrgentRequest = useMemo(() => {
    if (!date || !time) return false;
    
    // Obtener la hora actual en la zona horaria de Florida (Miami)
    const nowStr = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });
    const now = new Date(nowStr);
    
    const selectedDate = new Date(`${date}T00:00:00`)
    if (
      selectedDate.getFullYear() === now.getFullYear() &&
      selectedDate.getMonth() === now.getMonth() &&
      selectedDate.getDate() === now.getDate()
    ) {
      const match = time.match(/(\d+):(\d+) (AM|PM)/)
      if (match) {
        let hours = parseInt(match[1])
        const minutes = parseInt(match[2])
        const ampm = match[3]
        if (ampm === 'PM' && hours < 12) hours += 12
        if (ampm === 'AM' && hours === 12) hours = 0

        const selectedDateTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
        const diffMs = selectedDateTime.getTime() - now.getTime()
        const diffHours = diffMs / (1000 * 60 * 60)
        
        if (diffHours < 2) {
          return true;
        }
      }
    }
    return false;
  }, [date, time]);

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

    const isAirportPickup = pickup.toLowerCase().includes('airport') || pickup.toLowerCase().includes('mia') || pickup.toLowerCase().includes('fll')
    if (!isPromo && isAirportPickup && (!airline.trim() || !flightNumber.trim())) {
      setError('Airline and Flight Number are required for airport pickups.')
      return
    }

    if (isPromo) {
      setStep(3)
    } else {
      setStep(2)
    }
    // Scroll smoothly to form header
    const element = document.getElementById('booking-form')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handleNextStep2 = () => {
    setError(null)
    const maxLuggage = vehicleType === 'sedan_suv' || vehicleType === 'suburban' ? 4 : vehicleType === 'sprinter' ? 14 : vehicleType === 'minibus' ? 30 : 60;
    if (luggageCount > maxLuggage) {
      setError(`The selected vehicle allows a maximum of ${maxLuggage} bags. Please reduce your luggage or choose a larger vehicle.`)
      return
    }

    setStep(3)
    const element = document.getElementById('booking-form')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  const handlePrevStep = () => {
    setError(null)
    setStep((prev) => {
      if (isPromo && prev === 3) return 1
      return Math.max(1, prev - 1)
    })
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

  // Looks up fixed prices for one specific direction (from -> to). Tries the exact
  // direction first so hotel<->airport pairs priced differently per direction (e.g.
  // hotel->airport $25, airport->hotel $40) show the right rate. Only falls back to
  // the reverse direction's price when this exact direction has none loaded, so
  // routes that still only have one direction configured keep working as before.
  const getPricesForRoute = (from: string, to: string) => {
    const exactRoute = normalizedRoutes.find((r) => r.pickup === from && r.destination === to)
    const route = exactRoute || normalizedRoutes.find((r) => r.pickup === to && r.destination === from)
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

  const p = pickup.trim()
  const d = destination.trim()
  const currentPrices = getPricesForRoute(p, d)
  let basePrice = currentPrices[vehicleType]
  const meetGreetFee = meetingType === 'meet_greet' ? 25 : 0
  // Round trip: price each direction independently and add them up, instead of
  // doubling the outbound price — hotel->airport and airport->hotel can (and often
  // do) cost different amounts.
  const returnBasePrice = tripType === 'round-trip' ? getPricesForRoute(d, p)[vehicleType] : 0
  const total = (tripType === 'round-trip' ? basePrice + returnBasePrice : basePrice) + meetGreetFee
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
    if (!customerName.trim() || !customerEmail.trim() || !customerPhone) {
      setError('Please provide your full contact information, including phone and country.')
      return
    }

    // Final luggage check just in case
    const maxLuggage = vehicleType === 'sedan_suv' || vehicleType === 'suburban' ? 4 : vehicleType === 'sprinter' ? 14 : vehicleType === 'minibus' ? 30 : 60;
    if (luggageCount > maxLuggage) {
      setError(`The selected vehicle allows a maximum of ${maxLuggage} bags.`)
      setStep(2)
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
          estimatedTotal: isPromo ? 0 : total,
          tripType,
          returnDate: tripType === 'round-trip' ? returnDate : undefined,
          returnTime: tripType === 'round-trip' ? returnTime : undefined,
          airline,
          flightNumber,
          meetingType,
          meetGreetFee,
          carSeatsRequested,
          luggageCount,
          notes,
          paymentMode: vehicleType === 'coachbus' || vehicleType === 'minibus' ? 'quote' : paymentMode,
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

  const handleResetForm = () => {
    setTripType(isPromo ? 'round-trip' : 'one-way')
    setPickup('')
    setDestination('')
    setDate('')
    setTime('')
    setReturnDate('')
    setReturnTime('')
    setPassengers(2)
    setCustomerName('')
    setCustomerEmail('')
    setCustomerPhone('')
    setCustomerCountry('')
    setAirline('')
    setFlightNumber('')
    setMeetingType('curbside')
    setCarSeatsRequested(0)
    setLuggageCount(0)
    setNotes('')
    setPaymentMode('full')
    setSelectedVehicleOverride(null)
    setStep(1)
    setIsSuccess(false)
  }

  return (
    <section id="booking-form" className="w-full py-14 md:py-20 scroll-mt-20 md:scroll-mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section header */}
        {!isPromo && (
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
        )}

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
                  onClick={handleResetForm}
                  className="mt-8 px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                  style={{ background: '#222222', color: '#FFFFFF', border: '1px solid #333333' }}
                >
                  Make Another Reservation
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {/* Progress indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 max-w-md mx-auto select-none w-full">
                {(isPromo ? [1, 3] : [1, 2, 3]).map((s, index) => {
                  const visualStepNum = index + 1
                  const isCompleted = s < step
                  const isActive = s === step
                  const labels = {
                    1: 'Trip Details',
                    2: 'Select Vehicle',
                    3: 'Checkout'
                  }
                  return (
                    <React.Fragment key={s}>
                      <div className="flex flex-col items-center gap-1.5 flex-1 relative">
                        <button
                          type="button"
                          disabled={s > step}
                          onClick={() => {
                            if (s < step) {
                              setError(null)
                              setStep(s)
                            }
                          }}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center font-bold text-xs sm:text-sm transition-all duration-300 ${s < step ? 'cursor-pointer' : 'cursor-default'}`}
                          style={{
                            background: isActive 
                              ? 'linear-gradient(135deg, #B8960C, #D4AF37)' 
                              : (isCompleted ? 'rgba(184,150,12,0.2)' : '#1e1e1e'),
                            border: `1px solid ${isActive || isCompleted ? '#B8960C' : '#333333'}`,
                            color: isActive ? '#0a0a0a' : (isCompleted ? '#D4AF37' : '#888888'),
                          }}
                        >
                          {isCompleted ? '✓' : visualStepNum}
                        </button>
                        <span
                          className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-wider transition-colors duration-300"
                          style={{ color: isActive ? '#D4AF37' : '#666666' }}
                        >
                          {labels[s as keyof typeof labels]}
                        </span>
                      </div>
                      {visualStepNum < (isPromo ? 2 : 3) && (
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
                  className="rounded-2xl p-5 md:p-8 flex flex-col gap-4"
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
                  <p className="text-xs -mt-1" style={{ color: '#888' }}>
                    Need more than 2 stops on your trip?{' '}
                    <a href="tel:+18889737896" style={{ color: '#D4AF37' }} className="hover:underline">
                      Call us
                    </a>{' '}
                    or{' '}
                    <a
                      href="https://wa.me/19546236207"
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: '#D4AF37' }}
                      className="hover:underline"
                    >
                      WhatsApp us
                    </a>{' '}
                    and we'll arrange it directly.
                  </p>

                  {/* Pickup and Destination */}
                  {isPromo ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-2">
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          Pickup Location
                        </label>
                        <input
                          type="text"
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          className={`${INPUT_CLASS} min-h-[50px] text-base`}
                          style={INPUT_STYLE}
                          placeholder="e.g. Miami Airport or B Ocean"
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          Destination
                        </label>
                        <input
                          type="text"
                          value={destination}
                          onChange={(e) => setDestination(e.target.value)}
                          className={`${INPUT_CLASS} min-h-[50px] text-base`}
                          style={INPUT_STYLE}
                          placeholder="e.g. South Beach or FLL Airport"
                        />
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Pickup */}
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          Pickup Location
                        </label>
                        <select
                          value={pickup}
                          onChange={(e) => setPickup(e.target.value)}
                          className={`${INPUT_CLASS} min-h-[50px] text-base`}
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
                          className={`${INPUT_CLASS} min-h-[50px] text-base`}
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
                    </>
                  )}

                  {/* Date + Time */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className={LABEL_CLASS} style={LABEL_COLOR}>
                        Date
                      </label>
                      <input
                        type="date"
                        min={minDateStr}
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        className={`${INPUT_CLASS} min-h-[50px] text-base px-4 py-3`}
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
                        className={`${INPUT_CLASS} min-h-[50px] text-base px-4 py-3`}
                        style={INPUT_STYLE}
                      >
                        <option value="">Select time</option>
                        {availableTimeSlotsList.map((t) => (
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
                          min={date || minDateStr}
                          value={returnDate}
                          onChange={(e) => setReturnDate(e.target.value)}
                          required
                          className={`${INPUT_CLASS} min-h-[50px] text-base px-4 py-3`}
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
                          className={`${INPUT_CLASS} min-h-[50px] text-base px-4 py-3`}
                          style={INPUT_STYLE}
                        >
                          <option value="">Select time</option>
                          {availableReturnTimeSlotsList.map((t) => (
                            <option key={t} value={t}>
                              {t}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}

                  {/* Airport specific fields */}
                  {(pickup.toLowerCase().includes('airport') || pickup.toLowerCase().includes('mia') || pickup.toLowerCase().includes('fll')) && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 border border-[#333] p-5 rounded-xl bg-[#0a0a0a]">
                      <div className="sm:col-span-2 mb-2">
                        <p className="text-sm font-bold text-[#D4AF37] mb-1">Flight Information Needed</p>
                        <p className="text-xs text-[#888]">We track your flight to adjust for any delays (up to 30 mins free waiting time).</p>
                      </div>
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          Airline {isPromo ? '(Optional)' : '*'}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. American Airlines"
                          value={airline}
                          onChange={(e) => setAirline(e.target.value)}
                          className={INPUT_CLASS}
                          style={INPUT_STYLE}
                        />
                      </div>
                      <div>
                        <label className={LABEL_CLASS} style={LABEL_COLOR}>
                          Flight Number {isPromo ? '(Optional)' : '*'}
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. AA1234"
                          value={flightNumber}
                          onChange={(e) => setFlightNumber(e.target.value)}
                          className={INPUT_CLASS}
                          style={INPUT_STYLE}
                        />
                      </div>
                      {!isPromo && (
                        <div className="sm:col-span-2 mt-2">
                          <label className={LABEL_CLASS} style={LABEL_COLOR}>
                            Meeting Type
                          </label>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setMeetingType('curbside')}
                              className="rounded-xl p-4 flex flex-col gap-1 text-left transition-all duration-200"
                              style={{
                                background: meetingType === 'curbside' ? 'rgba(184,150,12,0.12)' : '#0e0e0e',
                                border: meetingType === 'curbside' ? '2px solid #B8960C' : '1px solid #333333',
                              }}
                            >
                              <span className="text-sm font-bold text-white">Curbside Pickup</span>
                              <span className="text-xs text-[#888]">Meet driver outside at arrivals</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setMeetingType('meet_greet')}
                              className="rounded-xl p-4 flex flex-col gap-1 text-left transition-all duration-200"
                              style={{
                                background: meetingType === 'meet_greet' ? 'rgba(184,150,12,0.12)' : '#0e0e0e',
                                border: meetingType === 'meet_greet' ? '2px solid #B8960C' : '1px solid #333333',
                              }}
                            >
                              <span className="text-sm font-bold text-white">VIP Meet & Greet (+$25)</span>
                              <span className="text-xs text-[#888]">Driver meets you inside with a sign</span>
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Counters Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    {/* Passengers counter */}
                    <div>
                      <label className={LABEL_CLASS} style={LABEL_COLOR}>
                        Passengers
                      </label>
                      <div
                        className="flex items-center justify-between rounded-xl px-4 py-2"
                        style={{ background: '#0e0e0e', border: '1px solid #333333' }}
                      >
                        <button
                          type="button"
                          onClick={() => setPassengers((p) => Math.max(1, p - 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                          aria-label="Decrease passengers"
                        >
                          −
                        </button>
                        <div className="text-center flex-1">
                          <input 
                            type="number" 
                            min="1" 
                            max="55" 
                            value={passengers} 
                            onChange={(e) => setPassengers(Math.max(1, Math.min(55, parseInt(e.target.value) || 1)))}
                            className="w-full text-center text-2xl font-bold bg-transparent outline-none" 
                            style={{ color: '#FFFFFF' }} 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setPassengers((p) => Math.min(55, p + 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                          aria-label="Increase passengers"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Luggage counter */}
                    <div>
                      <label className={LABEL_CLASS} style={LABEL_COLOR}>
                        Luggage Pieces
                      </label>
                      <div
                        className="flex items-center justify-between rounded-xl px-4 py-2"
                        style={{ background: '#0e0e0e', border: '1px solid #333333' }}
                      >
                        <button
                          type="button"
                          onClick={() => setLuggageCount((p) => Math.max(0, p - 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                        >
                          −
                        </button>
                        <div className="text-center flex-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="60" 
                            value={luggageCount} 
                            onChange={(e) => setLuggageCount(Math.max(0, Math.min(60, parseInt(e.target.value) || 0)))}
                            className="w-full text-center text-2xl font-bold bg-transparent outline-none" 
                            style={{ color: '#FFFFFF' }} 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setLuggageCount((p) => Math.min(60, p + 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                        >
                          +
                        </button>
                      </div>
                    </div>

                    {/* Car seats counter */}
                    <div>
                      <label className={LABEL_CLASS} style={LABEL_COLOR}>
                        Child Car Seats
                      </label>
                      <div
                        className="flex items-center justify-between rounded-xl px-4 py-2"
                        style={{ background: '#0e0e0e', border: '1px solid #333333' }}
                      >
                        <button
                          type="button"
                          onClick={() => setCarSeatsRequested((p) => Math.max(0, p - 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                        >
                          −
                        </button>
                        <div className="text-center flex-1">
                          <input 
                            type="number" 
                            min="0" 
                            max="4" 
                            value={carSeatsRequested} 
                            onChange={(e) => setCarSeatsRequested(Math.max(0, Math.min(4, parseInt(e.target.value) || 0)))}
                            className="w-full text-center text-2xl font-bold bg-transparent outline-none" 
                            style={{ color: '#FFFFFF' }} 
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => setCarSeatsRequested((p) => Math.min(4, p + 1))}
                          className="w-10 h-10 rounded-lg text-2xl font-light flex items-center justify-center transition-colors hover:border-[#B8960C]"
                          style={{ border: '1px solid #333333', color: '#FFFFFF', background: '#1a1a1a' }}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Notes Field */}
                  <div className="mt-2">
                    <label className={LABEL_CLASS} style={LABEL_COLOR}>
                      Special Requests / Notes (Optional)
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className={`${INPUT_CLASS} min-h-[100px] text-base resize-y`}
                      style={INPUT_STYLE}
                      placeholder="e.g. Need a wheelchair accessible vehicle, please have coffee, etc."
                    />
                  </div>
                  <p className="text-[11px] text-[#888] mt-0">
                    Sedan/Suburban: Max 4 bags. Sprinter: Max 14. Minibus: Max 30. Coach: Max 60. Complimentary car seats available.
                  </p>

                  {error && !isUrgentRequest && (
                    <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                      <p className="text-sm font-medium" style={{ color: '#f87171' }}>{error}</p>
                    </div>
                  )}

                  {isUrgentRequest && (
                    <div className="rounded-xl px-4 py-3 mb-2" style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}>
                      <p className="text-sm font-medium" style={{ color: '#f87171' }}>
                        For same-day bookings, the pickup time must be at least 2 hours in advance. Please call us to request an urgent ride.
                      </p>
                    </div>
                  )}

                  {isUrgentRequest ? (
                    <div className="flex flex-col gap-3 mt-2">
                      <a
                        href="tel:+18889737896"
                        className="w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
                        </svg>
                        CALL +1 (888) 973-7896
                      </a>
                      <div className="text-center">
                        <a
                          href="https://wa.me/19546236207"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-[#25D366] hover:underline flex items-center justify-center gap-1.5"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                          Or contact us via WhatsApp
                        </a>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleNextStep1}
                      className="w-full py-4 rounded-xl text-base font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98] flex items-center justify-center gap-2 mt-2"
                      style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                    >
                      {isPromo ? 'Enter Contact Info →' : 'Choose Your Vehicle →'}
                    </button>
                  )}
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
                    {isPromo ? '2. Contact Info' : '3. Contact & Checkout'}
                  </h3>

                  {/* Trip Summary Card */}
                  <div className="p-5 rounded-xl flex flex-col gap-3" style={{ background: 'rgba(184, 150, 12, 0.05)', border: '1px solid rgba(184, 150, 12, 0.2)' }}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[#B8960C] text-xs font-bold uppercase tracking-wider">Trip Summary</span>
                      <span className="text-white font-bold text-sm bg-[#B8960C] text-[#0a0a0a] px-2 py-0.5 rounded uppercase">{vehicleType === 'sedan_suv' ? 'Sedan & SUV' : vehicleType === 'suburban' ? 'Suburban' : vehicleType === 'sprinter' ? 'Sprinter' : vehicleType === 'minibus' ? 'Minibus' : 'Coach Bus'}</span>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-[#888888] text-xs mb-1">Pickup</p>
                        <p className="text-white font-medium truncate" title={pickup}>{pickup}</p>
                      </div>
                      <div>
                        <p className="text-[#888888] text-xs mb-1">Drop-off</p>
                        <p className="text-white font-medium truncate" title={destination}>{destination}</p>
                      </div>
                      <div>
                        <p className="text-[#888888] text-xs mb-1">
                          {tripType === 'round-trip' ? 'Pick up Date' : 'Date & Time'}
                        </p>
                        <p className="text-white font-medium">{date} at {time}</p>
                      </div>
                      {tripType === 'round-trip' && returnDate && returnTime && (
                        <div>
                          <p className="text-[#B8960C] text-xs mb-1 uppercase tracking-widest font-bold">Drop off Date</p>
                          <p className="text-white font-medium">{returnDate} at {returnTime}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-[#888888] text-xs mb-1">Passengers</p>
                        <p className="text-white font-medium">{passengers} {passengers === 1 ? 'Person' : 'People'}</p>
                      </div>
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
                      <div className="w-full">
                        <PhoneInput
                          placeholder="Phone Number *"
                          value={customerPhone}
                          onChange={(val) => setCustomerPhone(val || '')}
                          defaultCountry="US"
                          className={`${INPUT_CLASS} phone-input-override`}
                          style={INPUT_STYLE}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Estimated Total */}
                  {!isPromo && vehicleType !== 'coachbus' && vehicleType !== 'minibus' && (
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
                              Remaining <strong style={{ color: '#EF9F27' }}>${total - depositAmount}</strong> is due before your trip — payable via secure payment link.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  )}

                  {(vehicleType === 'coachbus' || vehicleType === 'minibus') && (
                    <div
                      className="rounded-xl px-5 py-6 flex flex-col items-center justify-center text-center mb-4 mt-2"
                      style={{
                        background: 'rgba(184,150,12,0.08)',
                        border: '1px solid rgba(184,150,12,0.3)',
                      }}
                    >
                      <h4 className="text-lg font-bold mb-2" style={{ color: '#D4AF37' }}>Custom Pricing Required</h4>
                      <p className="text-sm leading-relaxed max-w-md mx-auto" style={{ color: '#BBBBBB' }}>
                        Due to the custom nature of large group reservations, pricing and availability must be confirmed manually. Please submit your request below or call us directly.
                      </p>
                      <a
                        href="tel:+18889737896"
                        className="mt-4 px-6 py-3 rounded-lg text-xs font-bold uppercase tracking-widest transition-all hover:bg-[#333]"
                        style={{ background: '#111', border: '1px solid #555', color: '#fff' }}
                      >
                        Call Us: +1 (888) 973-7896
                      </a>
                    </div>
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
                        : (vehicleType === 'coachbus' || vehicleType === 'minibus')
                          ? 'Submit Request →'
                          : isPromo 
                            ? 'Confirm Reservation →'
                            : paymentMode === 'deposit'
                              ? `Pay $${depositAmount} Deposit →`
                              : 'Proceed to Payment →'
                      }
                    </button>
                  </div>
                  
                  {/* Secure Payment Badge */}
                  {!isPromo && vehicleType !== 'coachbus' && vehicleType !== 'minibus' && (
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
