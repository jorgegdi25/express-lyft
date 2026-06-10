import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import Stripe from 'stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-04-10' as any,
    })
    
    body = await req.json()
    const { leadId } = body

    if (!leadId) return NextResponse.json({ error: 'Missing leadId' }, { status: 400 })

    // 1. Fetch the lead from Supabase
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

    // 2. Find or create a Stripe Customer
    let customerId = ''
    const existingCustomers = await stripe.customers.list({
      email: lead.customer_email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
    } else {
      const newCustomer = await stripe.customers.create({
        email: lead.customer_email,
        name: lead.customer_name,
        phone: lead.customer_phone,
      })
      customerId = newCustomer.id
    }

    // 3. Create an Invoice Item
    await stripe.invoiceItems.create({
      customer: customerId,
      amount: Math.round(lead.amount_usd * 100), // Convert to cents
      currency: 'usd',
      description: `Express Lyft Reservation: ${lead.pickup} to ${lead.destination} (${lead.date} at ${lead.time}) | ${lead.vehicle_type} | ${lead.passengers} passengers`,
    })

    // 4. Create the Invoice
    const invoice = await stripe.invoices.create({
      customer: customerId,
      collection_method: 'send_invoice',
      days_until_due: 3, // Due in 3 days
      metadata: {
        lead_id: lead.id,
      }
    })

    if (!invoice.id) {
      throw new Error('Failed to create invoice')
    }

    // 5. Finalize and Send the Invoice
    await stripe.invoices.sendInvoice(invoice.id)

    // 6. Update the lead status in Supabase
    const { error: updateError } = await supabaseAdmin
      .from('leads')
      .update({ status: 'invoice_sent' })
      .eq('id', lead.id)

    if (updateError) {
      console.error('[invoices] Failed to update lead status:', updateError)
    }

    return NextResponse.json({ success: true, invoiceUrl: invoice.hosted_invoice_url })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    console.error('[invoices] POST error:', errorMsg)
    return NextResponse.json({ error: 'Failed to send invoice: ' + errorMsg }, { status: 500 })
  }
}
