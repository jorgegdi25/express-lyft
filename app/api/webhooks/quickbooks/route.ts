import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getInvoice } from '@/lib/quickbooks'
import { createCalendarEvent } from '@/lib/calendar'
import { resend, sendOwnerNotification } from '@/lib/resend'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'

export const dynamic = 'force-dynamic'
// Same reasoning as the Stripe webhook (app/api/webhooks/stripe/route.ts):
// calendar + email work can outlast Vercel's default ~15s timeout on a cold start.
export const maxDuration = 60

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const verifierToken = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN
  if (!verifierToken || !signature) return false

  const expected = crypto.createHmac('sha256', verifierToken).update(rawBody).digest('base64')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)
  if (expectedBuf.length !== signatureBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, signatureBuf)
}

// Runs once, the first time an invoice's balance hits 0 — mirrors what the
// Stripe webhook does on checkout.session.completed, since a QuickBooks-paid
// customer never lands back on our /success page to trigger that path.
async function fulfillPaidLead(leadData: any, amountPaid: number, taxAmount: number) {
  try {
    const googleEventId = await createCalendarEvent(leadData)
    let googleReturnEventId = null
    if (leadData.trip_type === 'round-trip') {
      googleReturnEventId = await createCalendarEvent(leadData, true)
    }
    if (googleEventId || googleReturnEventId) {
      await supabaseAdmin
        .from('leads')
        .update({ google_event_id: googleEventId, google_return_event_id: googleReturnEventId })
        .eq('id', leadData.id)
    }
  } catch (e) {
    console.error('[quickbooks-webhook][calendar] error creating event for lead', leadData.id, e)
  }

  const clientProfileTask = async () => {
    if (!leadData?.customer_email) return
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
            phone: leadData.customer_phone || existingClient.phone,
          })
          .eq('id', existingClient.id)
      } else {
        await supabaseAdmin.from('clients').insert({
          name: leadData.customer_name || 'Guest',
          email: leadData.customer_email,
          phone: leadData.customer_phone || '',
          hotel_slug: leadData.hotel_slug || '',
          total_trips: 1,
          total_spent: leadData.amount_usd || 0,
          status: 'active',
          last_trip_date: leadData.date || null,
        })
      }
    } catch (clientErr) {
      console.error('[quickbooks-webhook] Error updating clients table:', clientErr)
    }
  }

  const emailTask = async () => {
    if (!resend || !leadData?.customer_email) return
    try {
      await resend.emails.send({
        from: 'Express Lyft <book@explyft.com>',
        to: [leadData.customer_email],
        subject: 'Reservation Confirmed & Paid - Express Lyft',
        react: ConfirmationEmail({
          customerName: leadData.customer_name || 'Valued Guest',
          bookingId: leadData.id || 'CONFIRMED',
          pickup: leadData.pickup || 'N/A',
          destination: leadData.destination || 'N/A',
          date: leadData.date || 'N/A',
          time: leadData.time || 'N/A',
          vehicleType: leadData.vehicle_type || 'N/A',
          amount: String(amountPaid),
          taxAmount: String(taxAmount),
          paymentType: 'full',
          airline: leadData.airline,
          flightNumber: leadData.flight_number,
          meetingType: leadData.meeting_type,
          carSeatsRequested: leadData.car_seats_requested,
          luggageCount: leadData.luggage_count,
          notes: leadData.notes,
          receiptUrl: null,
          tripType: leadData.trip_type,
          returnDate: leadData.return_date,
          returnTime: leadData.return_time,
        }),
      })
    } catch (emailErr) {
      console.error('[quickbooks-webhook] Failed to send confirmation email:', emailErr)
    }

    await sendOwnerNotification(leadData, { isDeposit: false, amountPaid, totalAmount: amountPaid })
  }

  await Promise.allSettled([clientProfileTask(), emailTask()])
}

export type InvoiceSyncResult =
  | { status: 'not_ours' }
  | { status: 'no_change'; paid: boolean }
  | { status: 'fulfilled' }
  | { status: 'error'; message: string }

/**
 * Looks up one QuickBooks invoice and, if it's fully paid and the matching
 * lead hasn't been fulfilled yet, marks it paid and runs the same
 * fulfillment as a Stripe checkout completion (calendar event, client
 * profile, confirmation email, owner notification).
 *
 * Shared by the webhook handler below and the reconcile cron
 * (app/api/cron/quickbooks-reconcile/route.ts) — the cron exists because
 * Intuit's webhook delivery has proven unreliable in practice (invoices
 * observed fully paid on Intuit's side with no webhook ever received), so
 * this same logic also runs on a timer as a safety net rather than only in
 * response to a webhook we can't fully trust.
 */
export async function syncInvoicePayment(invoiceId: string): Promise<InvoiceSyncResult> {
  try {
    const invoice = await getInvoice(invoiceId)
    const totalAmt = invoice.TotalAmt ?? 0
    // QuickBooks omits the Balance field entirely once an invoice is fully
    // paid, instead of returning 0 — so a MISSING Balance means paid, not
    // "unknown, assume the full amount is still owed".
    const balance = invoice.Balance ?? 0
    const isPaid = balance === 0
    const isPartiallyPaid = balance > 0 && balance < totalAmt

    const { data: existingLead } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('quickbooks_invoice_id', invoiceId)
      .maybeSingle()

    // Not one of ours (or the lead was deleted) — nothing to sync.
    if (!existingLead) return { status: 'not_ours' }

    const alreadyFulfilled = existingLead.status === 'paid'

    // We add tax as a plain second line (see lib/quickbooks.ts) instead of
    // using QuickBooks' own tax fields, so recover the amount by matching
    // that line's description rather than reading invoice.TotalTax.
    const taxLine = (invoice.Line || []).find(
      (l: any) => l.Description === 'Florida Sales Tax (7%)'
    )
    const taxAmount = taxLine?.Amount ?? 0

    const updateFields: Record<string, any> = {
      quickbooks_invoice_status: isPaid ? 'paid' : isPartiallyPaid ? 'partially_paid' : 'sent',
    }
    if (isPaid && !alreadyFulfilled) {
      updateFields.status = 'paid'
      updateFields.amount_paid = totalAmt - taxAmount
      updateFields.amount_remaining = 0
      updateFields.tax_collected = (existingLead.tax_collected || 0) + taxAmount
    }

    const { data: leadData, error } = await supabaseAdmin
      .from('leads')
      .update(updateFields)
      .eq('id', existingLead.id)
      .select()
      .single()

    if (error) {
      return { status: 'error', message: error.message }
    }

    if (isPaid && !alreadyFulfilled) {
      await fulfillPaidLead(leadData, totalAmt - taxAmount, taxAmount)
      return { status: 'fulfilled' }
    }

    return { status: 'no_change', paid: isPaid }
  } catch (err) {
    return { status: 'error', message: err instanceof Error ? err.message : String(err) }
  }
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('intuit-signature')

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const invoiceIds = new Set<string>()
  for (const notification of payload.eventNotifications || []) {
    for (const entity of notification.dataChangeEvent?.entities || []) {
      if (entity.name === 'Invoice') invoiceIds.add(entity.id)
    }
  }

  for (const invoiceId of Array.from(invoiceIds)) {
    const result = await syncInvoicePayment(invoiceId)
    if (result.status === 'error') {
      console.error('[quickbooks-webhook] failed to process invoice', invoiceId, result.message)
    }
  }

  return NextResponse.json({ received: true })
}
