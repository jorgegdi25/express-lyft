import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Public lookup by booking id, used by the /stay success screen to show a
// trip summary after Stripe redirects back — same shape as how the hotel
// success screen looks up its own lead by id.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('stay_bookings')
    .select('id, hotel_name, room_type, room_qty, nights, check_in_date, direction, pickup_time, return_pickup_time, room_amount, transport_amount, status')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ booking: data })
}
