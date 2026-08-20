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

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { code, type, value, max_uses, expires_at, min_amount, client_name, notes } = body

  if (!code || !type || value === undefined || value === null) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }
  if (type !== 'percent' && type !== 'fixed') {
    return NextResponse.json({ error: 'type must be percent or fixed' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('discount_codes')
    .insert([{
      code: String(code).trim().toUpperCase(),
      type,
      value,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      min_amount: min_amount || null,
      client_name: client_name || null,
      notes: notes || null,
    }])
    .select()

  if (error) {
    const message = error.code === '23505' ? 'That code already exists.' : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(data[0])
}

export async function PUT(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, code, type, value, max_uses, expires_at, min_amount, client_name, notes, active } = body

  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  const { error } = await supabaseAdmin
    .from('discount_codes')
    .update({
      code: code ? String(code).trim().toUpperCase() : undefined,
      type,
      value,
      max_uses: max_uses || null,
      expires_at: expires_at || null,
      min_amount: min_amount || null,
      client_name: client_name || null,
      notes: notes || null,
      active,
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
    .from('discount_codes')
    .delete()
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
