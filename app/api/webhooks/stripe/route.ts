import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const payload = await req.text()
  const sig = req.headers.get('stripe-signature')

  if (!sig) {
    return NextResponse.json({ error: 'Missing stripe-signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
    const isPreview = process.env.NEXT_PUBLIC_BASE_URL?.includes('pruebas') || req.headers.get('host')?.includes('pruebas')
    
    if (!webhookSecret || isPreview) {
      if (process.env.NODE_ENV === 'production' && !isPreview) {
        throw new Error('STRIPE_WEBHOOK_SECRET is not configured in production.')
      }
      console.warn('⚠️ Bypassing signature verification for development or preview environment.')
      event = JSON.parse(payload) as Stripe.Event
    } else {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret)
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed.', err.message)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }


  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const leadId = session.metadata?.lead_id

    if (leadId) {
      // Determine if this was a deposit or full payment
      const paymentType = session.metadata?.payment_type || 'full'
      const totalAmount = session.metadata?.total_amount ? parseFloat(session.metadata.total_amount) : null
      const chargeAmount = session.metadata?.charge_amount ? parseFloat(session.metadata.charge_amount) : null

      const isDeposit = paymentType === 'deposit'
      const newStatus = isDeposit ? 'deposit_paid' : 'paid'

      // Build update object
      const updateFields: Record<string, any> = { status: newStatus }
      if (isDeposit && totalAmount && chargeAmount) {
        updateFields.amount_paid = chargeAmount
        updateFields.amount_remaining = totalAmount - chargeAmount
      } else if (totalAmount) {
        updateFields.amount_paid = totalAmount
        updateFields.amount_remaining = 0
      }

      // 1. Update the lead status
      const { data: leadData, error: updateError } = await supabaseAdmin
        .from('leads')
        .update(updateFields)
        .eq('id', leadId)
        .select()
        .single()

      if (updateError) {
        console.error('Error updating lead status:', updateError)
        return NextResponse.json({ error: 'Database error' }, { status: 500 })
      }

      // 1.5 Create or update Client profile
      if (leadData && leadData.customer_email) {
        try {
          const { data: existingClient } = await supabaseAdmin
            .from('clients')
            .select('*')
            .eq('email', leadData.customer_email)
            .maybeSingle()

          if (existingClient) {
            await supabaseAdmin
              .from('clients')
              .update({
                total_trips: (existingClient.total_trips || 0) + 1,
                total_spent: (existingClient.total_spent || 0) + (leadData.amount_usd || 0),
                last_trip_date: leadData.date || existingClient.last_trip_date,
                name: leadData.customer_name || existingClient.name,
                phone: leadData.customer_phone || existingClient.phone
              })
              .eq('id', existingClient.id)
          } else {
            await supabaseAdmin
              .from('clients')
              .insert({
                name: leadData.customer_name || 'Guest',
                email: leadData.customer_email,
                phone: leadData.customer_phone || '',
                hotel_slug: leadData.hotel_slug || '',
                total_trips: 1,
                total_spent: leadData.amount_usd || 0,
                status: 'active',
                last_trip_date: leadData.date || null
              })
          }
        } catch (clientErr) {
          console.error('Error updating clients table:', clientErr)
        }
      }

      // 2. Send the confirmation email now that payment is successful
      if (resend && leadData) {
        let receiptUrl: string | null = null;
        try {
          const expandedSession = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent.latest_charge']
          });
          if (expandedSession.payment_intent) {
            const pi = expandedSession.payment_intent as Stripe.PaymentIntent;
            const charge = pi.latest_charge as Stripe.Charge;
            if (charge && charge.receipt_url) {
              receiptUrl = charge.receipt_url;
            }
          }
        } catch (e) {
          console.error('Failed to get receipt URL for email', e);
        }

        try {
          const emailSubject = isDeposit
            ? 'Ride Reserved (Deposit Paid) - Express Lyft'
            : 'Reservation Confirmed & Paid - Express Lyft'

          await resend.emails.send({
            from: 'Express Lyft <book@explyft.com>',
            to: [leadData.customer_email],
            bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
            subject: emailSubject,
            react: ConfirmationEmail({
              customerName: leadData.customer_name || 'Valued Guest',
              bookingId: leadData.id || 'CONFIRMED',
              pickup: leadData.pickup || 'N/A',
              destination: leadData.destination || 'N/A',
              date: leadData.date || 'N/A',
              time: leadData.time || 'N/A',
              vehicleType: leadData.vehicle_type || 'N/A',
              amount: String(amountPaid),
              paymentType: isDeposit ? 'deposit' : 'full',
              amountRemaining: isDeposit && totalAmount ? String(totalAmount - amountPaid) : undefined,
              airline: leadData.airline,
              flightNumber: leadData.flight_number,
              meetingType: leadData.meeting_type,
              carSeatsRequested: leadData.car_seats_requested,
              receiptUrl,
              tripType: leadData.trip_type,
              returnDate: leadData.return_date,
              returnTime: leadData.return_time,
            }),
          })
          console.log(`Confirmation email sent for lead ${leadId} (${isDeposit ? 'deposit' : 'full'})`)
        } catch (emailErr) {
          console.error('[webhook] Failed to send email:', emailErr)
        }
      }

    }
  }

  return NextResponse.json({ received: true })
}
