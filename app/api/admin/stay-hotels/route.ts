import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  return authHeader.split('Bearer ')[1] === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: hotels, error: hotelsErr } = await supabaseAdmin
    .from('stay_hotels')
    .select('*')
    .order('sort_order', { ascending: true })
  if (hotelsErr) return NextResponse.json({ error: hotelsErr.message }, { status: 500 })

  const { data: bookings, error: bookingsErr } = await supabaseAdmin
    .from('stay_bookings')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200)
  if (bookingsErr) return NextResponse.json({ error: bookingsErr.message }, { status: 500 })

  return NextResponse.json({ hotels, bookings })
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { name, photo_url, price, transport_amount, rooms_available, active, sort_order } = body
  if (!name || price === undefined) return NextResponse.json({ error: 'Missing name or price' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('stay_hotels')
    .insert({
      name,
      photo_url: photo_url || null,
      price,
      transport_amount: transport_amount || 0,
      rooms_available: rooms_available ?? 0,
      active: active ?? true,
      sort_order: sort_order ?? 100,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateStay()
  return NextResponse.json({ success: true, hotel: data })
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const { id, name, photo_url, price, transport_amount, rooms_available, active, sort_order } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates: Record<string, any> = { updated_at: new Date().toISOString() }
  if (name !== undefined) updates.name = name
  if (photo_url !== undefined) updates.photo_url = photo_url
  if (price !== undefined) updates.price = price
  if (transport_amount !== undefined) updates.transport_amount = transport_amount
  if (rooms_available !== undefined) updates.rooms_available = rooms_available
  if (active !== undefined) updates.active = active
  if (sort_order !== undefined) updates.sort_order = sort_order

  const { data, error } = await supabaseAdmin
    .from('stay_hotels')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateStay()
  return NextResponse.json({ success: true, hotel: data })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const bookingId = req.nextUrl.searchParams.get('bookingId')
  if (bookingId) {
    const { error } = await supabaseAdmin.from('stay_bookings').delete().eq('id', bookingId)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabaseAdmin.from('stay_hotels').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  revalidateStay()
  return NextResponse.json({ success: true })
}

function revalidateStay() {
  try {
    revalidatePath('/stay')
  } catch (e) {
    console.error('Error revalidating /stay:', e)
  }
}
