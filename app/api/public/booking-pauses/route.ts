import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { nyNowPlusMinutes } from '@/lib/jetskiPricing'
import { normalizePauseTimestamp } from '@/lib/bookingPauses'

export const dynamic = 'force-dynamic'
export const revalidate = 0

// Read-only list of pauses that haven't ended yet, so the public forms can
// grey out paused pickup times. ?service=transport|jet_ski also includes 'all'.
export async function GET(req: NextRequest) {
  const service = new URL(req.url).searchParams.get('service')

  let query = supabaseAdmin
    .from('booking_pauses')
    .select('id, service_type, start_at, end_at')
    .gt('end_at', nyNowPlusMinutes(0).replace(' ', 'T'))
    .order('start_at', { ascending: true })
  if (service === 'transport' || service === 'jet_ski') {
    query = query.in('service_type', [service, 'all'])
  }

  const { data, error } = await query
  // A missing table or a DB hiccup must never break the booking forms.
  if (error) return NextResponse.json([])

  return NextResponse.json((data || []).map(p => ({
    ...p,
    start_at: normalizePauseTimestamp(p.start_at),
    end_at: normalizePauseTimestamp(p.end_at),
  })))
}
