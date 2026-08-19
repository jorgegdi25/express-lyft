import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { syncInvoicePayment, syncStayInvoicePayment } from '@/app/api/webhooks/quickbooks/route'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

// Safety net for Intuit's webhook delivery, which has been observed to
// silently not arrive for invoices that were genuinely paid — see the
// comment on syncInvoicePayment (app/api/webhooks/quickbooks/route.ts) for
// how that was diagnosed. This runs the exact same fulfillment logic the
// webhook uses, just triggered by polling instead of by Intuit calling us.
// Covers both transport leads and Stay bookings — Stay moved from Stripe to
// QuickBooks entirely (Aug 2026), so it needs the same safety net.
//
// Only looks at records still waiting on a QuickBooks invoice, created in
// the last 14 days — older unpaid invoices are presumed abandoned, not
// missed.
const LOOKBACK_DAYS = 14

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = new Date(Date.now() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000).toISOString()

  const [{ data: leadCandidates, error: leadErr }, { data: stayCandidates, error: stayErr }] = await Promise.all([
    supabaseAdmin
      .from('leads')
      .select('id, quickbooks_invoice_id')
      .not('quickbooks_invoice_id', 'is', null)
      .in('quickbooks_invoice_status', ['sent', 'partially_paid'])
      .gte('created_at', since),
    supabaseAdmin
      .from('stay_bookings')
      .select('id, quickbooks_invoice_id')
      .not('quickbooks_invoice_id', 'is', null)
      .in('quickbooks_invoice_status', ['sent', 'partially_paid'])
      .gte('created_at', since),
  ])

  if (leadErr || stayErr) {
    console.error('[cron][quickbooks-reconcile] Error fetching candidates:', leadErr || stayErr)
    return NextResponse.json({ error: 'Database error' }, { status: 500 })
  }

  const results: Array<{ invoiceId: string; type: 'lead' | 'stay'; status: string }> = []

  for (const lead of leadCandidates || []) {
    const invoiceId = lead.quickbooks_invoice_id as string
    const result = await syncInvoicePayment(invoiceId)
    results.push({ invoiceId, type: 'lead', status: result.status })
    if (result.status === 'fulfilled') {
      console.log(`[cron][quickbooks-reconcile] Recovered a missed payment for invoice ${invoiceId} (lead ${lead.id})`)
    } else if (result.status === 'error') {
      console.error(`[cron][quickbooks-reconcile] Error syncing invoice ${invoiceId}:`, result.message)
    }
  }

  for (const booking of stayCandidates || []) {
    const invoiceId = booking.quickbooks_invoice_id as string
    const result = await syncStayInvoicePayment(invoiceId)
    results.push({ invoiceId, type: 'stay', status: result.status })
    if (result.status === 'fulfilled') {
      console.log(`[cron][quickbooks-reconcile] Recovered a missed payment for invoice ${invoiceId} (stay booking ${booking.id})`)
    } else if (result.status === 'error') {
      console.error(`[cron][quickbooks-reconcile] Error syncing invoice ${invoiceId}:`, result.message)
    }
  }

  return NextResponse.json({ checked: (leadCandidates?.length || 0) + (stayCandidates?.length || 0), results })
}
