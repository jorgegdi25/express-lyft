import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { render } from '@react-email/render'
import ConfirmationEmail from '@/emails/ConfirmationEmail'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Webhook error'
    console.error('[webhook] signature verification failed:', message)
    return NextResponse.json({ error: `Webhook Error: ${message}` }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const meta = session.metadata ?? {}

    const amountUsd = Math.round(parseInt(meta.amount, 10) / 100)

    // 1. Insert into Supabase
    const { data: booking, error: bookingErr } = await supabaseAdmin.from('bookings').insert({
      hotel_slug: meta.hotelSlug,
      stripe_session_id: session.id,
      pickup: meta.pickup,
      destination: meta.destination,
      date: meta.date,
      time: meta.time,
      return_date: meta.returnDate || null,
      return_time: meta.returnTime || null,
      passengers: parseInt(meta.passengers, 10),
      vehicle_type: meta.vehicleType,
      amount_usd: amountUsd,
      customer_name: meta.customerName,
      customer_email: meta.customerEmail,
      customer_phone: meta.customerPhone || null,
      customer_country: meta.customerCountry || null,
      status: 'paid',
    }).select().single()

    if (bookingErr) {
      console.error('[webhook] supabase error:', bookingErr.message)
    }

    // 2. Fetch Hotel Name for the email
    const { data: hotel } = await supabaseAdmin
      .from('hotels')
      .select('name')
      .eq('slug', meta.hotelSlug)
      .single()

    const hotelName = hotel?.name || 'Express Lyft Partner'

    // 3. Send Confirmation Email
    if (resend && meta.customerEmail && booking) {
      try {
        const emailHtml = await render(
          ConfirmationEmail({
            customerName: meta.customerName || 'Valued Guest',
            bookingId: booking.id,
            hotelName: hotelName,
            pickup: meta.pickup,
            destination: meta.destination,
            date: meta.date,
            time: meta.time,
            vehicleType: meta.vehicleType,
            amount: String(amountUsd),
          })
        )

        await resend.emails.send({
          from: 'Express Lyft <bookings@expresslyft.com>', // Note: Needs domain verification in Resend dashboard
          to: meta.customerEmail,
          subject: `Booking Confirmed: ${hotelName} — Express Lyft`,
          html: emailHtml,
        })
        console.log('[webhook] confirmation email sent to:', meta.customerEmail)
      } catch (emailErr) {
        console.error('[webhook] email error:', emailErr)
      }
    } else {
      console.warn('[webhook] resend not configured or missing customer email')
    }
  }

  return NextResponse.json({ received: true })
}
