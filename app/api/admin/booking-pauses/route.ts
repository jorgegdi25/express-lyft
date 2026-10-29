import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nyNowPlusMinutes } from '@/lib/jetskiPricing'
import { normalizePauseTimestamp } from '@/lib/bookingPauses'

export const dynamic = 'force-dynamic'

async function isAuthorized(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ')) return false
  const token = authHeader.split('Bearer ')[1]
  return token === process.env.ADMIN_PASSWORD
}

const SERVICES = ['transport', 'jet_ski', 'all']
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}$/

// Upcoming and ongoing pauses, plus the last 14 days of past ones for context.
export async function GET(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabaseAdmin
    .from('booking_pauses')
    .select('*')
    .gt('end_at', nyNowPlusMinutes(-14 * 24 * 60).replace(' ', 'T'))
    .order('start_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json((data || []).map(p => ({
    ...p,
    start_at: normalizePauseTimestamp(p.start_at),
    end_at: normalizePauseTimestamp(p.end_at),
  })))
}

export async function POST(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { service_type, start_at, end_at, reason } = await req.json()

  if (!SERVICES.includes(service_type)) {
    return NextResponse.json({ error: 'service_type must be transport, jet_ski or all' }, { status: 400 })
  }
  if (!TIMESTAMP_RE.test(String(start_at || '')) || !TIMESTAMP_RE.test(String(end_at || ''))) {
    return NextResponse.json({ error: 'Start and end must be "YYYY-MM-DD HH:mm"' }, { status: 400 })
  }
  const start = normalizePauseTimestamp(start_at)
  const end = normalizePauseTimestamp(end_at)
  if (end <= start) {
    return NextResponse.json({ error: 'End time must be after start time.' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('booking_pauses')
    .insert([{ service_type, start_at: start.replace(' ', 'T'), end_at: end.replace(' ', 'T'), reason: reason ? String(reason).trim() : null }])
    .select()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json(data[0])
}

export async function DELETE(req: NextRequest) {
  if (!(await isAuthorized(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  const { error } = await supabaseAdmin.from('booking_pauses').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ success: true })
}
