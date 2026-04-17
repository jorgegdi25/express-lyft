import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.split('Bearer ')[1]
  return token === process.env.ADMIN_PASSWORD
}

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const hotel_slug = searchParams.get('hotel_slug')

  let query = supabaseAdmin.from('route_pricing').select('*')
  if (hotel_slug) {
    query = query.eq('hotel_slug', hotel_slug)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { hotel_slug, pickup, destination, suv_price, minivan_price, sprinter_price } = body

  if (!hotel_slug || !pickup || !destination) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('route_pricing')
    .insert([{
      hotel_slug,
      pickup,
      destination,
      suv_price,
      minivan_price,
      sprinter_price
    }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data[0])
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, suv_price, minivan_price, sprinter_price } = body

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('route_pricing')
    .update({
      suv_price,
      minivan_price,
      sprinter_price,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('route_pricing')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
