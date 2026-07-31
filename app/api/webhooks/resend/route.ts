import { NextRequest, NextResponse } from 'next/server'
import { Webhook } from 'svix'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

// Resend sends every account-wide email event (sent/delivered/opened/
// bounced/etc) to this single endpoint, signed with Svix. We only act on
// the ones whose email id matches a lead's trip_reminder_email_id — events
// for other emails (confirmations, payment reminders, owner notices) just
// find no match and are ignored. Configured in the Resend dashboard under
// Webhooks, pointing at /api/webhooks/resend; the signing secret it gives
// you goes in RESEND_WEBHOOK_SECRET.
const STATUS_BY_EVENT: Record<string, string> = {
  'email.sent': 'sent',
  'email.delivered': 'delivered',
  'email.delivery_delayed': 'delivery_delayed',
  'email.opened': 'opened',
  'email.clicked': 'opened',
  'email.bounced': 'bounced',
  'email.complained': 'complained',
  'email.failed': 'failed',
}

export async function POST(req: NextRequest) {
  const secret = process.env.RESEND_WEBHOOK_SECRET
  if (!secret) {
    console.error('[webhook][resend] Missing RESEND_WEBHOOK_SECRET')
    return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  }

  const payload = await req.text()
  const svixHeaders = {
    'svix-id': req.headers.get('svix-id') || '',
    'svix-timestamp': req.headers.get('svix-timestamp') || '',
    'svix-signature': req.headers.get('svix-signature') || '',
  }

  let event: { type: string; data: { email_id?: string } }
  try {
    event = new Webhook(secret).verify(payload, svixHeaders) as typeof event
  } catch (err: any) {
    console.error('[webhook][resend] Signature verification failed:', err?.message || err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const emailId = event.data?.email_id
  const status = STATUS_BY_EVENT[event.type]

  if (!emailId || !status) {
    // Event type we don't track (e.g. email.clicked after already opened) —
    // acknowledge so Resend doesn't retry, nothing to update.
    return NextResponse.json({ received: true })
  }

  const { data, error } = await supabaseAdmin
    .from('leads')
    .update({ trip_reminder_status: status, trip_reminder_status_at: new Date().toISOString() })
    .eq('trip_reminder_email_id', emailId)
    .select('id')

  if (error) {
    console.error('[webhook][resend] Error updating lead status:', error)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (data && data.length > 0) {
    console.log(`[webhook][resend] lead ${data[0].id} trip_reminder_status -> ${status}`)
  }

  return NextResponse.json({ received: true })
}
