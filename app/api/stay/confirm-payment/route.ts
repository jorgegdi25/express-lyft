import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { fulfillStayBooking } from '@/lib/stayBooking'

export const dynamic = 'force-dynamic'

/**
 * Backup to the Stripe webhook, called by the /stay success screen after
 * redirect — same pattern as /api/confirm-payment for transport leads. If
 * the guest closes the tab before this runs, the webhook still processes
 * the booking on its own.
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id, booking_id } = await req.json()
    if (!session_id || !booking_id) {
      return NextResponse.json({ error: 'Missing session_id or booking_id' }, { status: 400 })
    }

    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.latest_charge'],
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }
    if (session.metadata?.stay_booking_id !== booking_id) {
      return NextResponse.json({ error: 'Session/booking mismatch' }, { status: 400 })
    }

    const result = await fulfillStayBooking(session)
    if (!result.ok) {
      return NextResponse.json({ error: 'Failed to process booking' }, { status: 500 })
    }
    return NextResponse.json({ success: true, alreadyProcessed: !!result.alreadyProcessed })
  } catch (err: any) {
    console.error('[stay/confirm-payment] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
