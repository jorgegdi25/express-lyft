import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend, sendTripReminderSentNotification } from '@/lib/resend'
import { PickupReminderEmail } from '@/emails/PickupReminderEmail'
import { leadPickupToUTC } from '@/lib/tripTime'
import { VEHICLE_LABELS } from '@/lib/vehicles'

export const dynamic = 'force-dynamic'

// Any live trip whose pickup is 25h away or less and hasn't been reminded
// yet gets the email on the next hourly run. This used to be a 23–25h slot,
// which silently skipped every trip booked (or paid / switched from
// 'Manual (New)') less than 23h ahead — the guest never heard from us.
const REMINDER_WINDOW_MAX_HOURS = 25
// Reservations that are actually going ahead: paid web bookings plus manual
// ones an agent entered (they stay 'new' / 'invoice_sent' until marked paid).
const REMINDER_STATUSES = ['paid', 'deposit_paid', 'hotel_b2b', 'new', 'invoice_sent']

// "Today" / "Tomorrow" / weekday, judged in Florida time.
function pickupDayLabel(dateStr: string, now: Date): string {
  const nyDay = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: 'America/New_York' })
  const today = nyDay(now)
  const tomorrow = nyDay(new Date(now.getTime() + 24 * 60 * 60 * 1000))
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  return 'Coming Up'
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: candidates, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .in('status', REMINDER_STATUSES)
    .is('trip_reminder_sent_at', null)
    .not('customer_email', 'is', null)

  if (error) {
    console.error('[cron][trip-reminders] Error fetching leads:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const now = Date.now()
  const dueLeads = (candidates || []).filter(lead => {
    const pickupUTC = leadPickupToUTC(lead.date, lead.time)
    if (!pickupUTC) return false
    const hoursUntil = (pickupUTC.getTime() - now) / (1000 * 60 * 60)
    return hoursUntil > 0 && hoursUntil <= REMINDER_WINDOW_MAX_HOURS
  })

  const results: Array<{ id: string; status: string }> = []

  for (const lead of dueLeads) {
    try {
      let emailId: string | null = null
      if (resend && lead.customer_email) {
        const { data, error: sendError } = await resend.emails.send({
          from: 'Express Lyft <book@explyft.com>',
          to: [lead.customer_email],
          subject: `Your Express Lyft Pickup Is ${pickupDayLabel(lead.date, new Date(now))} — Instructions Inside`,
          react: PickupReminderEmail({
            customerName: lead.customer_name || 'Valued Guest',
            pickup: lead.pickup || 'N/A',
            destination: lead.destination || 'N/A',
            date: lead.date || 'N/A',
            time: lead.time || 'N/A',
            vehicleLabel: VEHICLE_LABELS[lead.vehicle_type] || lead.vehicle_type || 'N/A',
            passengers: lead.passengers || 1,
            airline: lead.airline,
            flightNumber: lead.flight_number,
            meetingType: lead.meeting_type,
            carSeatsRequested: lead.car_seats_requested,
            notes: lead.notes,
            tripType: lead.trip_type,
            returnDate: lead.return_date,
            returnTime: lead.return_time,
            dayLabel: pickupDayLabel(lead.date, new Date(now)),
          }),
        })
        if (sendError) throw new Error(sendError.message)
        emailId = data?.id || null
      }

      await sendTripReminderSentNotification(lead)

      // The Resend message id lets the /api/webhooks/resend endpoint match
      // delivered/opened/bounced events back to this lead later.
      const { error: markErr } = await supabaseAdmin
        .from('leads')
        .update({
          trip_reminder_sent_at: new Date().toISOString(),
          trip_reminder_email_id: emailId,
          trip_reminder_status: emailId ? 'sent' : null,
          trip_reminder_status_at: emailId ? new Date().toISOString() : null,
        })
        .eq('id', lead.id)

      if (markErr) {
        console.error(`[cron][trip-reminders] Recordatorio enviado para ${lead.id} pero falló marcar trip_reminder_sent_at:`, markErr)
      } else {
        console.log(`[cron][trip-reminders] Recordatorio de pickup enviado para lead ${lead.id}`)
      }
      results.push({ id: lead.id, status: 'sent' })
    } catch (err: any) {
      console.error(`[cron][trip-reminders] Error procesando lead ${lead.id}:`, err?.message || err)
      results.push({ id: lead.id, status: 'error' })
    }
  }

  return NextResponse.json({ checked: candidates?.length || 0, due: dueLeads.length, results })
}
