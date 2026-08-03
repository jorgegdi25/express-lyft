import Stripe from 'stripe'
import { supabaseAdmin } from './supabase'
import { stripe } from './stripe'
import { createCalendarEvent } from './calendar'
import { sessionTaxAmount } from './tax'
import { resend, sendStayOwnerNotification } from './resend'
import { StayConfirmationEmail } from '@/emails/StayConfirmationEmail'

// Only FLL-area hotels for now (per business decision) — no airport
// selection step in the chat.
export const STAY_AIRPORT_NAME = 'Fort Lauderdale Airport (FLL)'

// Shared by both the Stripe webhook and the /success-page backup
// (app/api/stay/confirm-payment), the same way lib's `createCalendarEvent`
// is shared across leads/route.ts, webhooks/stripe/route.ts and
// confirm-payment/route.ts. Keeping this in one place avoids the drift that
// once caused the `amountPaid` bug in the transport webhook.
export async function fulfillStayBooking(session: Stripe.Checkout.Session) {
  const bookingId = session.metadata?.stay_booking_id
  if (!bookingId) return { ok: false, reason: 'no_booking_id' as const }

  const taxAmount = sessionTaxAmount(session)

  // Atomic claim: the webhook and the /success-page backup can both call
  // this for the same session (that's the whole point of having a backup),
  // and in dev, React Strict Mode double-fires effects too. The claim UPDATE
  // must flip `status` away from 'pending_payment' AS PART OF the same
  // compare-and-swap write — that's what makes the `.eq('status',
  // 'pending_payment')` filter actually exclude a concurrent second caller.
  // (An earlier version of this function updated stripe_session_id/tax here
  // but left status untouched until a later write, so the guard never
  // actually blocked anything — verified locally: two concurrent calls both
  // passed it and double-created transport leads and double-decremented
  // inventory.) We optimistically set status to 'paid' here; if the
  // inventory decrement below finds no rooms left, we correct it to
  // 'paid_overbooked' in a second, unconditional update.
  const { data: claimedRows, error: claimErr } = await supabaseAdmin
    .from('stay_bookings')
    .update({ status: 'paid', stripe_session_id: session.id, tax_collected: taxAmount })
    .eq('id', bookingId)
    .eq('status', 'pending_payment')
    .select()

  if (claimErr) {
    console.error('[stay] Error claiming booking:', claimErr)
    return { ok: false, reason: 'db_error' as const }
  }
  if (!claimedRows || claimedRows.length === 0) {
    // Either already fulfilled by a concurrent call, or the booking id is
    // bogus. Distinguish the two only for logging purposes.
    const { data: existing } = await supabaseAdmin.from('stay_bookings').select('id').eq('id', bookingId).maybeSingle()
    return existing ? { ok: true, alreadyProcessed: true } : { ok: false, reason: 'not_found' as const }
  }
  const booking = claimedRows[0]

  // Atomic inventory decrement — see decrement_stay_rooms() in
  // supabase-migrations-stay.sql. If it returns false, someone else booked
  // the last room between checkout and payment; the guest still paid, so we
  // flag it for a manual refund/reassign instead of silently overbooking.
  const { data: hadRoom, error: rpcErr } = await supabaseAdmin.rpc('decrement_stay_rooms', {
    p_hotel_id: booking.stay_hotel_id,
    p_qty: booking.room_qty,
  })
  if (rpcErr) console.error('[stay] decrement_stay_rooms error:', rpcErr)
  const overbooked = rpcErr ? false : hadRoom === false

  let updatedBooking = booking
  if (overbooked) {
    const { data, error: updateErr } = await supabaseAdmin
      .from('stay_bookings')
      .update({
        status: 'paid_overbooked',
        notes: [booking.notes, '⚠️ PAID BUT NO ROOMS LEFT — contact guest to confirm or refund.'].filter(Boolean).join('\n'),
      })
      .eq('id', bookingId)
      .select()
      .single()
    if (updateErr || !data) {
      console.error('[stay] Error marking booking overbooked:', updateErr)
    } else {
      updatedBooking = data
    }
  }

  // Build the transport leg as a regular `leads` row so the existing
  // Dispatch/Calendar/reminders pipeline picks it up automatically — no
  // separate transport booking flow needed. Stay only ever books the
  // airport → hotel leg (per business decision — no return leg, no hotel
  // pickup option).
  let leadId: string | null = null
  try {
    const { data: leadData, error: leadErr } = await supabaseAdmin
      .from('leads')
      .insert({
        hotel_slug: `stay-${updatedBooking.stay_hotel_id}`,
        customer_name: updatedBooking.guest_name,
        customer_email: updatedBooking.guest_email,
        customer_phone: updatedBooking.guest_phone,
        pickup: STAY_AIRPORT_NAME,
        destination: updatedBooking.hotel_name,
        vehicle_type: 'sedan_suv',
        passengers: updatedBooking.guest_count || 1,
        date: updatedBooking.check_in_date,
        time: updatedBooking.pickup_time,
        trip_type: 'one-way',
        status: 'paid',
        payment_type: 'full',
        amount_usd: updatedBooking.transport_amount,
        amount_paid: updatedBooking.transport_amount,
        amount_remaining: 0,
        payment_source: 'stripe',
        paid_at: new Date().toISOString(),
        airline: updatedBooking.airline,
        flight_number: updatedBooking.flight_number,
        meeting_type: 'curbside',
        notes: `Express Lyft Stay booking — ${updatedBooking.room_qty}x ${updatedBooking.room_type === '2_beds' ? '2 Beds' : '1 Bed'}, ${updatedBooking.nights} night(s) at ${updatedBooking.hotel_name}.`,
      })
      .select()
      .single()

    if (leadErr || !leadData) {
      console.error('[stay] Error creating transport lead:', leadErr)
    } else {
      leadId = leadData.id
      try {
        const googleEventId = await createCalendarEvent(leadData)
        if (googleEventId) {
          await supabaseAdmin.from('leads').update({ google_event_id: googleEventId }).eq('id', leadData.id)
        }
      } catch (calErr) {
        console.error('[stay] Calendar error for lead', leadData.id, calErr)
      }
    }
  } catch (e) {
    console.error('[stay] Unexpected error creating transport lead:', e)
  }

  await supabaseAdmin
    .from('stay_bookings')
    .update({ lead_id: leadId })
    .eq('id', bookingId)

  // Guest confirmation + owner alert — never throw, same as the rest of the
  // notification helpers in this codebase.
  if (resend && updatedBooking.guest_email) {
    let receiptUrl: string | null = null
    try {
      const expanded = await stripe.checkout.sessions.retrieve(session.id, { expand: ['payment_intent.latest_charge'] })
      const pi = expanded.payment_intent as Stripe.PaymentIntent | null
      const charge = pi?.latest_charge as Stripe.Charge | undefined
      if (charge?.receipt_url) receiptUrl = charge.receipt_url
    } catch (e) {
      console.error('[stay] Failed to get receipt URL', e)
    }

    try {
      await resend.emails.send({
        from: 'Express Lyft <book@explyft.com>',
        to: [updatedBooking.guest_email],
        subject: 'Hotel & Transportation Confirmed — Express Lyft Stay',
        react: StayConfirmationEmail({
          guestName: updatedBooking.guest_name || 'Valued Guest',
          bookingId: updatedBooking.id,
          hotelName: updatedBooking.hotel_name,
          roomType: updatedBooking.room_type,
          roomQty: updatedBooking.room_qty,
          nights: updatedBooking.nights,
          checkInDate: updatedBooking.check_in_date,
          pickupTime: updatedBooking.pickup_time,
          airline: updatedBooking.airline,
          flightNumber: updatedBooking.flight_number,
          subtotal: updatedBooking.room_amount + updatedBooking.transport_amount,
          taxAmount,
          totalCharged: updatedBooking.room_amount + updatedBooking.transport_amount + taxAmount,
          receiptUrl,
        }),
      })
    } catch (emailErr) {
      console.error('[stay] Failed to send guest confirmation email:', emailErr)
    }

    await sendStayOwnerNotification(updatedBooking, { overbooked })
  }

  return { ok: true, overbooked }
}
