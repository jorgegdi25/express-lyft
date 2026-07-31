import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { resend, sendTripReminderSentNotification } from '@/lib/resend'
import { PickupReminderEmail } from '@/emails/PickupReminderEmail'
import { leadPickupToUTC } from '@/lib/tripTime'
import { VEHICLE_LABELS } from '@/lib/vehicles'

export const dynamic = 'force-dynamic'

// Wide enough that an hourly cron always catches a lead at least once
// before it ages out of the window, narrow enough that "24 hours before"
// stays true to what the guest is told.
const REMINDER_WINDOW_MIN_HOURS = 23
const REMINDER_WINDOW_MAX_HOURS = 25

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: candidates, error } = await supabaseAdmin
    .from('leads')
    .select('*')
    .in('status', ['paid', 'deposit_paid', 'hotel_b2b'])
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
    return hoursUntil >= REMINDER_WINDOW_MIN_HOURS && hoursUntil <= REMINDER_WINDOW_MAX_HOURS
  })

  const results: Array<{ id: string; status: string }> = []

  for (const lead of dueLeads) {
    try {
      if (resend && lead.customer_email) {
        await resend.emails.send({
          from: 'Express Lyft <book@explyft.com>',
          to: [lead.customer_email],
          subject: 'Your Express Lyft Pickup Is Tomorrow — Instructions Inside',
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
          }),
        })
      }

      await sendTripReminderSentNotification(lead)

      const { error: markErr } = await supabaseAdmin
        .from('leads')
        .update({ trip_reminder_sent_at: new Date().toISOString() })
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
