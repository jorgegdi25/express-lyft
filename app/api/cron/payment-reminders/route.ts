import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { resend, sendReminderSentNotification } from '@/lib/resend'
import { PaymentReminderEmail } from '@/emails/PaymentReminderEmail'
import { flTaxRateIds } from '@/lib/tax'
import { leadPickupToUTC } from '@/lib/tripTime'

export const dynamic = 'force-dynamic'

const REMINDER_WINDOW_MIN_HOURS = 11
const REMINDER_WINDOW_MAX_HOURS = 13

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: candidates, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .eq('status', 'deposit_paid')
    .is('reminder_sent_at', null)
    .gt('amount_remaining', 0)

  if (error) {
    console.error('[cron][payment-reminders] Error fetching leads:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const now = Date.now()
  const dueLeads = (candidates || []).filter(lead => {
    const pickupUTC = leadPickupToUTC(lead.date, lead.time)
    if (!pickupUTC) return false
    const hoursUntil = (pickupUTC.getTime() - now) / (1000 * 60 * 60)
    return hoursUntil >= REMINDER_WINDOW_MIN_HOURS && hoursUntil <= REMINDER_WINDOW_MAX_HOURS
  })

  const results: Array<{ id: string; status: string }> = []

  for (const lead of dueLeads) {
    try {
      const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.explyft.com'
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success?lead_id=${lead.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        invoice_creation: { enabled: true },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Express Lyft Remaining Balance: ${lead.pickup} to ${lead.destination}`,
                description: `${lead.date} at ${lead.time} | ${lead.vehicle_type} | ${lead.passengers} passengers`,
              },
              unit_amount: Math.round(lead.amount_remaining * 100),
            },
            quantity: 1,
            tax_rates: flTaxRateIds(),
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: lead.customer_email || undefined,
        metadata: {
          lead_id: lead.id,
          hotel_slug: lead.hotel_slug,
          payment_type: 'remaining',
          total_amount: String(lead.amount_usd),
          charge_amount: String(lead.amount_remaining),
        },
      })

      if (resend && lead.customer_email && session.url) {
        await resend.emails.send({
          from: 'Express Lyft <book@explyft.com>',
          to: [lead.customer_email],
          subject: 'Reminder: Remaining Balance Due — Express Lyft',
          react: PaymentReminderEmail({
            customerName: lead.customer_name || 'Valued Guest',
            bookingId: lead.id,
            pickup: lead.pickup || 'N/A',
            destination: lead.destination || 'N/A',
            date: lead.date || 'N/A',
            time: lead.time || 'N/A',
            vehicleType: lead.vehicle_type || 'N/A',
            amountRemaining: String(lead.amount_remaining),
            paymentUrl: session.url,
          }),
        })
      }

      await sendReminderSentNotification(lead, lead.amount_remaining)

      const { error: markErr } = await supabaseAdmin
        .from('leads')
        .update({ reminder_sent_at: new Date().toISOString() })
        .eq('id', lead.id)

      if (markErr) {
        console.error(`[cron][payment-reminders] Recordatorio enviado para ${lead.id} pero falló marcar reminder_sent_at:`, markErr)
      } else {
        console.log(`[cron][payment-reminders] Recordatorio enviado para lead ${lead.id}`)
      }
      results.push({ id: lead.id, status: 'sent' })
    } catch (err: any) {
      console.error(`[cron][payment-reminders] Error procesando lead ${lead.id}:`, err?.message || err)
      results.push({ id: lead.id, status: 'error' })
    }
  }

  return NextResponse.json({ checked: candidates?.length || 0, due: dueLeads.length, results })
}
