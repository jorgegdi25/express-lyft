import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { hotelSlug, customerName, customerEmail, pickup, destination, vehicleType } = body

    if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 })

    const { error } = await supabase.from('leads').insert({
      hotel_slug: hotelSlug,
      customer_name: customerName,
      customer_email: customerEmail,
      pickup,
      destination,
      vehicle_type: vehicleType
    })

    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[leads] error:', errorMsg)
    return NextResponse.json({ error: 'Failed to log lead' }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { data, error } = await supabase
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
