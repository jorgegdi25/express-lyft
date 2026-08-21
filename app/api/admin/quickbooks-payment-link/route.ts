import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendInvoice, getInvoicePaymentLink } from '@/lib/quickbooks'
import { FL_TAX_RATE_PERCENT } from '@/lib/tax'

export const dynamic = 'force-dynamic'

// QuickBooks counterpart to the Stripe "Generate Payment Link" button — a
// link to copy/text the customer without triggering QuickBooks' own
// invoice email. Unlike Stripe Checkout sessions (cheap to regenerate),
// a QuickBooks invoice is a real accounting document, so this never
// creates a second one for the same lead: if quickbooks_invoice_id is
// already set (from this button or from "Send via QuickBooks"), it just
// re-fetches that invoice's link instead of creating a duplicate.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { leadId } = body
    if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

    const { data: lead, error: leadError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    if (lead.quickbooks_invoice_id) {
      const url = await getInvoicePaymentLink(lead.quickbooks_invoice_id)
      if (!url) return NextResponse.json({ error: 'QuickBooks did not return a payment link for this invoice' }, { status: 500 })
      return NextResponse.json({ success: true, url })
    }

    if (!lead.customer_email) {
      return NextResponse.json({ error: 'Lead does not have an email address' }, { status: 400 })
    }

    const invoice = await createAndSendInvoice({
      customerName: lead.customer_name || lead.customer_email,
      customerEmail: lead.customer_email,
      customerPhone: lead.customer_phone,
      amount: lead.amount_usd,
      description: `Express Lyft Reservation: ${lead.pickup} to ${lead.destination} (${lead.date} at ${lead.time}) | ${lead.vehicle_type} | ${lead.passengers} passengers`,
      taxAmount: lead.amount_usd * (FL_TAX_RATE_PERCENT / 100),
      send: false,
    })

    if (!invoice.invoiceLink) {
      return NextResponse.json({ error: 'QuickBooks did not return a payment link for this invoice' }, { status: 500 })
    }

    await supabaseAdmin
      .from('leads')
      .update({
        status: 'pending_payment',
        quickbooks_invoice_id: invoice.Id,
        quickbooks_invoice_status: 'created',
      })
      .eq('id', lead.id)

    return NextResponse.json({ success: true, url: invoice.invoiceLink })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quickbooks-payment-link] POST error:', errorMsg)
    return NextResponse.json({ error: 'Failed to generate QuickBooks payment link: ' + errorMsg }, { status: 500 })
  }
}
