import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

async function calculatePrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string, tripType: string) {
  // Fetch route-specific pricing from route_pricing table
  const { data: route } = await supabaseAdmin
    .from('route_pricing')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .or(`and(pickup.eq."${pickup.trim()}",destination.eq."${destination.trim()}"),and(pickup.eq."${destination.trim()}",destination.eq."${pickup.trim()}")`)
    .maybeSingle()

  const defaultPrices: Record<string, number> = { sedan_suv: 120, suburban: 150, sprinter: 260, minibus: 450, coachbus: 800 }

  // Fetch global prices from pricing table to override defaults if present
  const { data: pricingData } = await supabaseAdmin.from('pricing').select('vehicle_type, price_usd')
  if (pricingData) {
    for (const row of pricingData) {
      if (row.vehicle_type in defaultPrices) {
        defaultPrices[row.vehicle_type] = row.price_usd
      }
    }
  }

  let basePrice = defaultPrices[vehicleType] || 0
  if (route) {
    const key = `${vehicleType}_price`
    if (key in route) {
      basePrice = (route as any)[key] || basePrice
    }
  }

  return tripType === 'round-trip' ? basePrice * 2 : basePrice
}

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
    const { id } = body

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
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success`
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
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
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
      paymentMode
    } = body

    if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 })


    // Check if the request is from an authenticated admin
    const authHeader = req.headers.get('authorization')
    const isAdmin = authHeader?.startsWith('Bearer ') && authHeader.split('Bearer ')[1] === process.env.ADMIN_PASSWORD

    // Determine target price
    const inputTotal = estimatedTotal !== undefined ? estimatedTotal : amountUsd
    let finalAmount = inputTotal

    // If it's a customer reservation, validate the price server-side
    if (!isAdmin) {
      const calculatedAmount = await calculatePrice(hotelSlug, pickup || '', destination || '', vehicleType || '', tripType || '')
      if (calculatedAmount > 0 && Math.abs(calculatedAmount - inputTotal) > 0.01) {
        console.warn(`[leads] Price mismatch: input=${inputTotal}, calculated=${calculatedAmount}. Using calculated price.`)
        finalAmount = calculatedAmount
      }
    }

    const leadStatus = isAdmin ? (status || 'new') : 'pending_payment'

    // Calculate deposit amounts
    const isDeposit = paymentMode === 'deposit' && !isAdmin
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
    }).select().single()

    if (error) {
      console.error('[leads] supabase insertion error:', error)
      throw error
    }

    // If request is from admin, do not create a Stripe checkout session
    if (isAdmin) {
      return NextResponse.json({ success: true, lead: data })
    }

    // Create Stripe Checkout Session
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = `${origin}/hotel/${hotelSlug}/success`
    const cancelUrl = `${origin}/hotel/${hotelSlug}`

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
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
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
      amountUsd, tripType, assigned_driver_id
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

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    return NextResponse.json({ success: true, updated: data })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
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
