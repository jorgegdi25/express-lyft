import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
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
      tripType
    } = body

    if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 })

    const { error } = await supabaseAdmin.from('leads').insert({
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
      amount_usd: estimatedTotal,
      trip_type: tripType
    })

    if (error) {
      console.error('[leads] supabase insertion error:', error)
      throw error
    }

    return NextResponse.json({ success: true })
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
      amountUsd, tripType
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
      .limit(100)

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
