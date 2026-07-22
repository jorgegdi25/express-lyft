import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// Looks up a fixed route price for one specific direction (pickup -> destination).
// Tries the exact direction first so hotel<->airport pairs priced differently per
// direction (e.g. hotel->airport $25, airport->hotel $40) are respected. Only falls
// back to the reverse direction's price when this exact direction has none loaded,
// so routes that still only have one direction configured keep working as before.
async function findExactRoutePrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string): Promise<number | null> {
  const key = `${vehicleType}_price`

  const { data: exactRoute } = await supabaseAdmin
    .from('route_pricing')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .eq('pickup', pickup)
    .eq('destination', destination)
    .maybeSingle()

  if (exactRoute && key in exactRoute && (exactRoute as any)[key]) {
    return (exactRoute as any)[key]
  }

  const { data: reversedRoute } = await supabaseAdmin
    .from('route_pricing')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .eq('pickup', destination)
    .eq('destination', pickup)
    .maybeSingle()

  if (reversedRoute && key in reversedRoute && (reversedRoute as any)[key]) {
    return (reversedRoute as any)[key]
  }

  return null
}

async function calculateDistancePrice(hotelSlug: string, vehicleType: string, distanceMiles: number, durationMinutes: number) {
  // Default fallback values
  let basePrice = 25
  let pricePerMile = 3.5
  let pricePerMinute = 0.5
  let minPrice = 90

  // Fetch global prices from pricing table for the specific vehicle
  const { data: pricingData } = await supabaseAdmin.from('pricing').select('*').eq('vehicle_type', vehicleType).maybeSingle()
  if (pricingData) {
    basePrice = pricingData.price_usd ?? basePrice
    pricePerMile = pricingData.price_per_mile ?? pricePerMile
    pricePerMinute = pricingData.price_per_minute ?? pricePerMinute
    minPrice = pricingData.min_price ?? minPrice
  }

  let calculatedAmount = minPrice
  if (distanceMiles > 0) {
    const { data: hotel } = await supabaseAdmin.from('hotels').select('*').eq('slug', hotelSlug).maybeSingle()
    if (hotel) {
      const rateKey = `price_per_mile_${vehicleType}`
      if (rateKey in hotel && (hotel as any)[rateKey]) {
        pricePerMile = (hotel as any)[rateKey] // Override with hotel specific per-mile rate if it exists
      }
    }

    const distanceCost = distanceMiles * pricePerMile
    const timeCost = durationMinutes * pricePerMinute
    calculatedAmount = basePrice + distanceCost + timeCost
  }

  // Enforce minimum price floor
  return Math.ceil(Math.max(calculatedAmount, minPrice))
}

async function calculateLegPrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string, distanceMiles: number, durationMinutes: number) {
  const exactPrice = await findExactRoutePrice(hotelSlug, pickup, destination, vehicleType)
  if (exactPrice !== null) return exactPrice
  return calculateDistancePrice(hotelSlug, vehicleType, distanceMiles, durationMinutes)
}

async function calculatePrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string, tripType: string, distanceMiles: number, durationMinutes: number) {
  const pickupTrim = pickup.trim()
  const destinationTrim = destination.trim()

  const outboundPrice = await calculateLegPrice(hotelSlug, pickupTrim, destinationTrim, vehicleType, distanceMiles, durationMinutes)

  if (tripType !== 'round-trip') {
    return outboundPrice
  }

  // Round trip: price each direction independently and add them up, instead of
  // doubling the outbound price — hotel->airport and airport->hotel can (and often
  // do) cost different amounts.
  const returnPrice = await calculateLegPrice(hotelSlug, destinationTrim, pickupTrim, vehicleType, distanceMiles, durationMinutes)
  return outboundPrice + returnPrice
}

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
    const { id } = body

    // Generate remaining balance payment link (for deposit customers)
    // This MUST be checked before the regular id-based checkout to avoid being unreachable
    if (body.generateRemainingLink && id) {
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !lead || lead.amount_remaining <= 0) {
        return NextResponse.json({ error: 'Lead not found or no remaining balance' }, { status: 404 })
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success?lead_id=${lead.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        invoice_creation: {
          enabled: true,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Express Lyft Remaining Balance: ${lead.pickup} to ${lead.destination}`,
                description: `${lead.date} at ${lead.time} | ${lead.vehicle_type} | ${lead.passengers} passengers`,
              },
              unit_amount: Math.round(lead.amount_remaining * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: lead.customer_email || undefined,
        metadata: {
          lead_id: lead.id,
          hotel_slug: lead.hotel_slug,
          payment_type: 'remaining',
          total_amount: String(lead.amount_usd),
          charge_amount: String(lead.amount_remaining),
        }
      })

      // We do NOT change the status here, it stays deposit_paid
      return NextResponse.json({ success: true, url: session.url })
    }

    // Generate checkout session for an existing lead (re-send payment link from CRM)
    if (id) {
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success?lead_id=${lead.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        invoice_creation: {
          enabled: true,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Express Lyft Reservation: ${lead.pickup} to ${lead.destination}`,
                description: `${lead.date} at ${lead.time} | ${lead.vehicle_type} | ${lead.passengers} passengers`,
              },
              unit_amount: Math.round(lead.amount_usd * 100),
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: lead.customer_email || undefined,
        metadata: {
          lead_id: lead.id,
          hotel_slug: lead.hotel_slug
        }
      })

      await supabaseAdmin.from('leads').update({ status: 'pending_payment' }).eq('id', lead.id)

      return NextResponse.json({ success: true, url: session.url })
    }

    const { 
      hotelSlug, 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerCountry,
      pickup, 
      destination, 
      vehicleType,
      passengers,
      date,
      time,
      returnDate,
      returnTime,
      estimatedTotal,
      amountUsd,
      tripType,
      status,
      paymentMode,
      isPromo,
      airline,
      flightNumber,
      meetingType,
      meetGreetFee,
      carSeatsRequested,
      luggageCount,
      notes,
      distanceMiles,
      durationMinutes
    } = body

    if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 })


    // Check if the request is from an authenticated admin
    const authHeader = req.headers.get('authorization')
    const isAdmin = authHeader?.startsWith('Bearer ') && authHeader.split('Bearer ')[1] === process.env.ADMIN_PASSWORD

    // Determine target price
    const inputTotal = estimatedTotal !== undefined ? estimatedTotal : amountUsd
    let finalAmount = inputTotal
    
    let leadStatus = isAdmin ? (status || 'new') : 'pending_payment'
    let isDeposit = paymentMode === 'deposit' && !isAdmin

    if (paymentMode === 'quote') {
      leadStatus = 'quote_requested'
      finalAmount = 0
      isDeposit = false
    } else if (isPromo) {
      finalAmount = 0;
      leadStatus = 'hotel_b2b'
      isDeposit = false
    } else if (!isAdmin) {
      const calculatedBaseAmount = await calculatePrice(hotelSlug, pickup || '', destination || '', vehicleType || '', tripType || '', distanceMiles || 0, durationMinutes || 0)
      let expectedFee = 0;
      if (meetingType === 'meet_greet') {
        expectedFee = 25;
      }
      const expectedAmount = calculatedBaseAmount + expectedFee;
      
      if (expectedAmount > 0 && Math.abs(expectedAmount - inputTotal) > 0.01) {
        console.warn(`[leads] Price mismatch: input=${inputTotal}, expected=${expectedAmount}. Using calculated price.`)
        finalAmount = expectedAmount
      }
    }

    // Calculate deposit amounts
    const depositAmount = isDeposit ? Math.ceil(finalAmount * 0.20) : finalAmount
    const amountRemaining = isDeposit ? finalAmount - depositAmount : 0

    const { data, error } = await supabaseAdmin.from('leads').insert({
      hotel_slug: hotelSlug,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_country: customerCountry,
      pickup,
      destination,
      vehicle_type: vehicleType,
      passengers: passengers || 1,
      date,
      time,
      return_date: returnDate,
      return_time: returnTime,
      amount_usd: finalAmount,
      trip_type: tripType,
      status: leadStatus,
      payment_type: isDeposit ? 'deposit' : 'full',
      amount_paid: 0,
      amount_remaining: isDeposit ? finalAmount : 0,
      airline,
      flight_number: flightNumber,
      meeting_type: meetingType || 'curbside',
      meet_greet_fee: meetGreetFee || 0,
      car_seats_requested: carSeatsRequested || 0,
      luggage_count: luggageCount || 0,
      notes: notes || null,
      distance_miles: distanceMiles || 0,
      duration_minutes: durationMinutes || 0
    }).select().single()

    if (error) {
      console.error('[leads] supabase insertion error:', error)
      throw error
    }

    // If request is from admin, do not create a Stripe checkout session
    if (isAdmin) {
      return NextResponse.json({ success: true, lead: data })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = isPromo ? `${origin}/promo/${hotelSlug}/success?lead_id=${data.id}&session_id={CHECKOUT_SESSION_ID}` : `${origin}/hotel/${hotelSlug}/success?lead_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = isPromo ? `${origin}/promo/${hotelSlug}` : `${origin}/hotel/${hotelSlug}`

    if (isPromo || paymentMode === 'quote') {
      // Return success without URL so the frontend shows the inline success modal instead of redirecting
      return NextResponse.json({ success: true })
    }

    const chargeAmount = isDeposit ? depositAmount : finalAmount
    const productName = isDeposit
      ? `Express Lyft Deposit (20%): ${pickup} to ${destination}`
      : `Express Lyft Reservation: ${pickup} to ${destination}`
    const productDesc = isDeposit
      ? `${date} at ${time} | ${vehicleType} | ${passengers} passengers | Deposit: $${chargeAmount} of $${finalAmount} total`
      : `${date} at ${time} | ${vehicleType} | ${passengers} passengers`

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      invoice_creation: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: Math.round(chargeAmount * 100), // Stripe expects cents
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        lead_id: data.id,
        hotel_slug: hotelSlug,
        payment_type: isDeposit ? 'deposit' : 'full',
        total_amount: String(finalAmount),
        charge_amount: String(chargeAmount),
      }
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[leads] POST error:', errorMsg, 'Body:', body || 'no-body-read')
    return NextResponse.json({ error: 'Failed to log lead: ' + errorMsg }, { status: 500 })
  }
}


export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      id, status, notes, 
      customerName, customerEmail, customerPhone,
      customer_name, customer_email, customer_phone,
      pickup, destination, vehicleType, vehicle_type,
      passengers, date, time, 
      returnDate, returnTime, return_date, return_time,
      amountUsd, tripType, assigned_driver_id,
      airline, flightNumber, flight_number,
      meetingType, meeting_type, meetGreetFee, meet_greet_fee,
      carSeatsRequested, car_seats_requested,
      luggageCount, luggage_count,
      waitTimeMinutes, wait_time_minutes,
      waitTimeFee, wait_time_fee
    } = body

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    const updates: Record<string, string | number> = {}
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (customerName !== undefined || customer_name !== undefined) updates.customer_name = customerName || customer_name
    if (customerEmail !== undefined || customer_email !== undefined) updates.customer_email = customerEmail || customer_email
    if (customerPhone !== undefined || customer_phone !== undefined) updates.customer_phone = customerPhone || customer_phone
    if (pickup !== undefined) updates.pickup = pickup
    if (destination !== undefined) updates.destination = destination
    if (vehicleType !== undefined || vehicle_type !== undefined) updates.vehicle_type = vehicleType || vehicle_type
    if (passengers !== undefined) updates.passengers = passengers
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (returnDate !== undefined || return_date !== undefined) updates.return_date = returnDate || return_date
    if (returnTime !== undefined || return_time !== undefined) updates.return_time = returnTime || return_time
    if (amountUsd !== undefined) updates.amount_usd = amountUsd
    if (tripType !== undefined) updates.trip_type = tripType
    if (assigned_driver_id !== undefined) updates.assigned_driver_id = assigned_driver_id
    if (airline !== undefined) updates.airline = airline
    if (flightNumber !== undefined || flight_number !== undefined) updates.flight_number = flightNumber || flight_number
    if (meetingType !== undefined || meeting_type !== undefined) updates.meeting_type = meetingType || meeting_type
    if (meetGreetFee !== undefined || meet_greet_fee !== undefined) updates.meet_greet_fee = meetGreetFee || meet_greet_fee
    if (carSeatsRequested !== undefined || car_seats_requested !== undefined) updates.car_seats_requested = carSeatsRequested || car_seats_requested
    if (luggageCount !== undefined || luggage_count !== undefined) updates.luggage_count = luggageCount || luggage_count
    if (waitTimeMinutes !== undefined || wait_time_minutes !== undefined) updates.wait_time_minutes = waitTimeMinutes || wait_time_minutes
    if (waitTimeFee !== undefined || wait_time_fee !== undefined) updates.wait_time_fee = waitTimeFee || wait_time_fee

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, updated: data })
  } catch (err: any) {
    const errorMsg = err?.message || (typeof err === 'string' ? err : 'Unknown error')
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200)

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  try {
    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
