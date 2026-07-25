import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendNegativeReviewAlert } from '@/lib/resend'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { token: string } }) {
  const { data: review, error } = await supabaseAdmin
    .from('reviews')
    .select('status, customer_name')
    .eq('token', params.token)
    .maybeSingle()

  if (error || !review) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ status: review.status, customer_name: review.customer_name })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const { rating, would_recommend, comment } = await req.json()

  if (typeof would_recommend !== 'boolean' || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: 'Invalid submission' }, { status: 400 })
  }

  const { data: review, error: fetchErr } = await supabaseAdmin
    .from('reviews')
    .select('*')
    .eq('token', params.token)
    .maybeSingle()

  if (fetchErr || !review) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  if (review.status !== 'requested') {
    return NextResponse.json({ error: 'This review was already submitted' }, { status: 409 })
  }

  const { error: updateErr } = await supabaseAdmin
    .from('reviews')
    .update({
      status: 'pending',
      rating,
      would_recommend,
      comment: comment || null,
      submitted_at: new Date().toISOString(),
    })
    .eq('id', review.id)

  if (updateErr) {
    console.error('[reviews][submit] Error saving review:', updateErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  if (!would_recommend) {
    await sendNegativeReviewAlert({
      id: review.id,
      customer_name: review.customer_name,
      customer_email: review.customer_email,
      hotel_slug: review.hotel_slug,
      rating,
      comment,
    })
  }

  return NextResponse.json({ success: true, would_recommend })
}
