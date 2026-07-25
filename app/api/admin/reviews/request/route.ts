import { NextRequest, NextResponse } from 'next/server'
import { randomBytes } from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { resend } from '@/lib/resend'
import { ReviewRequestEmail } from '@/emails/ReviewRequestEmail'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { lead_id } = await req.json()
  if (!lead_id) {
    return NextResponse.json({ error: 'Missing lead_id' }, { status: 400 })
  }

  const { data: lead, error: leadErr } = await supabaseAdmin
    .from('leads')
    .select('id, customer_name, customer_email, hotel_slug')
    .eq('id', lead_id)
    .maybeSingle()

  if (leadErr || !lead) {
    return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
  }
  if (!lead.customer_email) {
    return NextResponse.json({ error: 'Lead has no email on file' }, { status: 400 })
  }

  // Reuse an existing review request instead of creating duplicates: if one
  // was already answered, don't let it be re-triggered from the CRM by
  // accident; if it's still just "requested", resend the same link.
  const { data: existing } = await supabaseAdmin
    .from('reviews')
    .select('id, token, status')
    .eq('lead_id', lead_id)
    .maybeSingle()

  if (existing && existing.status !== 'requested') {
    return NextResponse.json({ error: 'This customer already responded to a review request' }, { status: 409 })
  }

  const token = existing?.token || randomBytes(16).toString('hex')

  if (existing) {
    await supabaseAdmin.from('reviews').update({ requested_at: new Date().toISOString() }).eq('id', existing.id)
  } else {
    const { error: insertErr } = await supabaseAdmin.from('reviews').insert({
      lead_id: lead.id,
      hotel_slug: lead.hotel_slug,
      customer_name: lead.customer_name,
      customer_email: lead.customer_email,
      token,
      status: 'requested',
    })
    if (insertErr) {
      console.error('[reviews][request] Error creating review row:', insertErr)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }
  }

  const origin = process.env.NEXT_PUBLIC_BASE_URL || 'https://booking.explyft.com'
  const reviewUrl = `${origin}/review/${token}`

  if (resend) {
    try {
      await resend.emails.send({
        from: 'Express Lyft <book@explyft.com>',
        to: [lead.customer_email],
        subject: 'How was your ride with Express Lyft?',
        react: ReviewRequestEmail({ customerName: lead.customer_name || 'Valued Guest', reviewUrl }),
      })
    } catch (emailErr) {
      console.error('[reviews][request] Failed to send email:', emailErr)
      return NextResponse.json({ error: 'Failed to send email' }, { status: 500 })
    }
  }

  return NextResponse.json({ success: true })
}
