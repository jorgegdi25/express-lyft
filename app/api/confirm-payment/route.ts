import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { resend } from '@/lib/resend'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

/**
 * This endpoint is called by the success page after Stripe redirects.
 * It verifies the payment with Stripe directly, then updates the lead
 * and sends the confirmation email. This is a BACKUP to the webhook
 * so payments are confirmed even if the webhook fails.
 */
export async function POST(req: NextRequest) {
  try {
    const { session_id, lead_id } = await req.json()

    if (!session_id || !lead_id) {
      return NextResponse.json({ error: 'Missing session_id or lead_id' }, { status: 400 })
    }

    // 1. Verify with Stripe that this session is actually paid
    const session = await stripe.checkout.sessions.retrieve(session_id, {
      expand: ['payment_intent.latest_charge']
    })

    if (session.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Payment not completed' }, { status: 400 })
    }

    // 2. Check if lead is already updated (webhook may have already handled it)
    const { data: lead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', lead_id)
      .single()

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    // If already paid/deposit_paid, don't process again
    if (lead.status === 'paid' || lead.status === 'deposit_paid') {
      return NextResponse.json({ success: true, already_processed: true })
    }

    // 3. Determine payment type from session metadata
    const paymentType = session.metadata?.payment_type || 'full'
    const totalAmount = session.metadata?.total_amount ? parseFloat(session.metadata.total_amount) : null
    const chargeAmount = session.metadata?.charge_amount ? parseFloat(session.metadata.charge_amount) : null

    const isDeposit = paymentType === 'deposit'
    const newStatus = isDeposit ? 'deposit_paid' : 'paid'

    // 4. Build update object
    const updateFields: Record<string, any> = { status: newStatus }
    if (isDeposit && totalAmount && chargeAmount) {
      updateFields.amount_paid = chargeAmount
      updateFields.amount_remaining = totalAmount - chargeAmount
    } else if (totalAmount) {
      updateFields.amount_paid = totalAmount
      updateFields.amount_remaining = 0
    }

    // 5. Update the lead
    const { data: updatedLead, error: updateError } = await supabaseAdmin
      .from('leads')
      .update(updateFields)
      .eq('id', lead_id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating lead:', updateError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    // 6. Create or update Client profile
    if (updatedLead && updatedLead.customer_email) {
      try {
        const { data: existingClient } = await supabaseAdmin
          .from('clients')
          .select('*')
          .eq('email', updatedLead.customer_email)
          .maybeSingle()

        if (existingClient) {
          await supabaseAdmin
            .from('clients')
            .update({
              total_trips: (existingClient.total_trips || 0) + 1,
              total_spent: (existingClient.total_spent || 0) + (updatedLead.amount_usd || 0),
              last_trip_date: updatedLead.date || existingClient.last_trip_date,
              name: updatedLead.customer_name || existingClient.name,
              phone: updatedLead.customer_phone || existingClient.phone
            })
            .eq('id', existingClient.id)
        } else {
          await supabaseAdmin
            .from('clients')
            .insert({
              name: updatedLead.customer_name || 'Guest',
              email: updatedLead.customer_email,
              phone: updatedLead.customer_phone || '',
              hotel_slug: updatedLead.hotel_slug || '',
              total_trips: 1,
              total_spent: updatedLead.amount_usd || 0,
              status: 'active',
              last_trip_date: updatedLead.date || null
            })
        }
      } catch (clientErr) {
        console.error('Error updating clients table:', clientErr)
      }
    }

    // 7. Send confirmation email
    if (resend && updatedLead) {
      let receiptUrl: string | null = null
      try {
        if (session.payment_intent) {
          const pi = session.payment_intent as Stripe.PaymentIntent
          const charge = pi.latest_charge as Stripe.Charge
          if (charge && charge.receipt_url) {
            receiptUrl = charge.receipt_url
          }
        }
      } catch (e) {
        console.error('Failed to get receipt URL', e)
      }

      try {
        const emailSubject = isDeposit
          ? 'Ride Reserved (Deposit Paid) - Express Lyft'
          : 'Reservation Confirmed & Paid - Express Lyft'

        await resend.emails.send({
          from: 'Express Lyft <book@explyft.com>',
          to: [updatedLead.customer_email],
          bcc: process.env.ADMIN_EMAIL ? [process.env.ADMIN_EMAIL] : undefined,
          subject: emailSubject,
          react: ConfirmationEmail({
            customerName: updatedLead.customer_name || 'Valued Guest',
            bookingId: updatedLead.id || 'CONFIRMED',
            pickup: updatedLead.pickup || 'N/A',
            destination: updatedLead.destination || 'N/A',
            date: updatedLead.date || 'N/A',
            time: updatedLead.time || 'N/A',
            vehicleType: updatedLead.vehicle_type || 'N/A',
            amount: isDeposit && chargeAmount ? chargeAmount.toString() : (updatedLead.amount_usd?.toString() || 'TBD'),
            paymentType: isDeposit ? 'deposit' : 'full',
            amountRemaining: isDeposit && totalAmount && chargeAmount ? (totalAmount - chargeAmount).toString() : undefined,
            airline: updatedLead.airline,
            flightNumber: updatedLead.flight_number,
            meetingType: updatedLead.meeting_type,
            carSeatsRequested: updatedLead.car_seats_requested,
            receiptUrl,
            tripType: updatedLead.trip_type,
            returnDate: updatedLead.return_date,
            returnTime: updatedLead.return_time,
          }),
        })
        console.log(`[confirm-payment] Email sent for lead ${lead_id}`)
      } catch (emailErr) {
        console.error('[confirm-payment] Failed to send email:', emailErr)
      }
    }

    return NextResponse.json({ success: true, status: newStatus })
  } catch (err: any) {
    console.error('[confirm-payment] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
