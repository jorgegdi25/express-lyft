import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.split('Bearer ')[1]
  return token === process.env.ADMIN_PASSWORD
}

// Rotating palette new agents get assigned from, in order, so each one
// reads as visually distinct without anyone having to pick a color. Once
// there are more agents than colors it wraps around and starts repeating —
// fine for this team's size, and still better than every agent sharing one
// fallback gray.
const COLOR_PALETTE = ['#fb923c', '#a78bfa', '#f472b6', '#facc15', '#22d3ee', '#94a3b8']

export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('sales_agents')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data)
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const name = String(body.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const { count } = await supabaseAdmin
    .from('sales_agents')
    .select('*', { count: 'exact', head: true })
  const color = COLOR_PALETTE[(count || 0) % COLOR_PALETTE.length]

  const { data, error } = await supabaseAdmin
    .from('sales_agents')
    .insert([{ name, color }])
    .select()
    .single()

  if (error) {
    const message = error.code === '23505' ? 'An agent with that name already exists.' : error.message
    return NextResponse.json({ error: message }, { status: 500 })
  }

  return NextResponse.json(data)
}

export async function PATCH(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json()
  const { id, active } = body
  if (!id || typeof active !== 'boolean') {
    return NextResponse.json({ error: 'Missing id or active' }, { status: 400 })
  }

  // Deactivate rather than delete — past leads still reference this name in
  // created_by, and the commissions breakdown needs the color to keep
  // resolving for them even after the agent stops taking new bookings.
  const { error } = await supabaseAdmin
    .from('sales_agents')
    .update({ active })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
