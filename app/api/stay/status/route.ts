import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Public, read-only, minimal — only the payment status, nothing else about
// the booking. Used to poll for a QuickBooks payment completing in a tab the
// guest opened separately, since QuickBooks' hosted invoice page has no way
// to redirect back to our site the way Stripe Checkout's success_url does.
export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('stay_bookings')
    .select('status')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  return NextResponse.json({ status: data.status })
}
