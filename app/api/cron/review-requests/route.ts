import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { ReviewRequestEmail } from '@/emails/ReviewRequestEmail'
import { leadPickupToUTC } from '@/lib/tripTime'

export const dynamic = 'force-dynamic'

// "1 day after the trip", widened to a 2-hour window so an hourly cron
// always catches a lead at least once before it ages out of the window.
const WINDOW_MIN_HOURS = 24
const WINDOW_MAX_HOURS = 26

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: candidates, error } = await supabaseAdmin
    .from('leads')
    .select('id, hotel_slug, customer_name, customer_email, date, time, trip_type, return_date, return_time')
    .in('status', ['paid', 'deposit_paid', 'on_trip'])
    .not('customer_email', 'is', null)

  if (error) {
    console.error('[cron][review-requests] Error fetching leads:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const now = Date.now()
  const dueLeads = (candidates || []).filter(lead => {
    // Round trips wait until the return leg is done, not the outbound one.
    const endUTC = lead.trip_type === 'round-trip' && lead.return_date && lead.return_time
      ? leadPickupToUTC(lead.return_date, lead.return_time)
      : leadPickupToUTC(lead.date, lead.time)
    if (!endUTC) return false
    const hoursSince = (now - endUTC.getTime()) / (1000 * 60 * 60)
    return hoursSince >= WINDOW_MIN_HOURS && hoursSince <= WINDOW_MAX_HOURS
  })

  if (dueLeads.length === 0) {
    return NextResponse.json({ checked: candidates?.length || 0, due: 0, results: [] })
  }

  // A lead that already has any review row — requested, pending, approved,
  // or rejected — was already asked (manually or by an earlier cron run).
  // Never ask twice.
  const { data: existingReviews, error: reviewsErr } = await supabaseAdmin
    .from('reviews')
    .select('lead_id')
    .in('lead_id', dueLeads.map(l => l.id))

  if (reviewsErr) {
    console.error('[cron][review-requests] Error fetching existing reviews:', reviewsErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const alreadyAsked = new Set((existingReviews || []).map(r => r.lead_id))
  const freshLeads = dueLeads.filter(lead => !alreadyAsked.has(lead.id))

  const results: Array<{ id: string; status: string }> = []

  for (const lead of freshLeads) {
    try {
      const token = randomBytes(16).toString('hex')

      const { error: insertErr } = await supabaseAdmin.from('reviews').insert({
        lead_id: lead.id,
        hotel_slug: lead.hotel_slug,
        customer_name: lead.customer_name,
        customer_email: lead.customer_email,
        token,
        status: 'requested',
      })

      if (insertErr) throw new Error(insertErr.message)

      const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.explyft.com'
      const reviewUrl = `${origin}/review/${token}`

      if (resend) {
        await resend.emails.send({
          from: 'Express Lyft <book@explyft.com>',
          to: [lead.customer_email as string],
          subject: 'How was your ride with Express Lyft?',
          react: ReviewRequestEmail({ customerName: lead.customer_name || 'Valued Guest', reviewUrl }),
        })
      }

      console.log(`[cron][review-requests] Solicitud de review enviada para lead ${lead.id}`)
      results.push({ id: lead.id, status: 'sent' })
    } catch (err: any) {
      console.error(`[cron][review-requests] Error procesando lead ${lead.id}:`, err?.message || err)
      results.push({ id: lead.id, status: 'error' })
    }
  }

  return NextResponse.json({ checked: candidates?.length || 0, due: dueLeads.length, sent: freshLeads.length, results })
}
