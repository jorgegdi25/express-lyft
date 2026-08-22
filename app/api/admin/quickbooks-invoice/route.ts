import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendInvoice } from '@/lib/quickbooks'
import { FL_TAX_RATE_PERCENT } from '@/lib/tax'
import { leadInvoiceDescription } from '@/lib/leadDescription'

export const dynamic = 'force-dynamic'

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

    if (!lead.customer_email) {
      return NextResponse.json({ error: 'Lead does not have an email address' }, { status: 400 })
    }

    const invoice = await createAndSendInvoice({
      customerName: lead.customer_name || lead.customer_email,
      customerEmail: lead.customer_email,
      customerPhone: lead.customer_phone,
      amount: lead.amount_usd,
      description: leadInvoiceDescription(lead),
      // Was missing entirely — every invoice sent from here had no FL sales
      // tax line, unlike the public booking flow (app/api/leads/route.ts)
      // which always computes this. Stripe doesn't need this treatment
      // since its own tax_rates handles it automatically at checkout.
      taxAmount: lead.amount_usd * (FL_TAX_RATE_PERCENT / 100),
    })

    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({
        status: 'invoice_sent',
        quickbooks_invoice_id: invoice.Id,
        quickbooks_invoice_status: invoice.emailSent ? 'sent' : 'created_email_failed',
      })
      .eq('id', lead.id)

    if (updateError) {
      console.error('[quickbooks-invoice] Failed to update lead status:', updateError)
    }

    return NextResponse.json({
      success: true,
      invoiceId: invoice.Id,
      emailSent: invoice.emailSent,
      invoiceLink: invoice.invoiceLink,
    })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[quickbooks-invoice] POST error:', errorMsg)
    return NextResponse.json({ error: 'Failed to send QuickBooks invoice: ' + errorMsg }, { status: 500 })
  }
}
