import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { supabaseAdmin } from '@/lib/supabase'
import { getInvoice } from '@/lib/quickbooks'

export const dynamic = 'force-dynamic'

function isValidSignature(rawBody: string, signature: string | null): boolean {
  const verifierToken = process.env.QUICKBOOKS_WEBHOOK_VERIFIER_TOKEN
  if (!verifierToken || !signature) return false

  const expected = crypto.createHmac('sha256', verifierToken).update(rawBody).digest('base64')
  const expectedBuf = Buffer.from(expected)
  const signatureBuf = Buffer.from(signature)
  if (expectedBuf.length !== signatureBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, signatureBuf)
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text()
  const signature = req.headers.get('intuit-signature')

  if (!isValidSignature(rawBody, signature)) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const invoiceIds = new Set<string>()
  for (const notification of payload.eventNotifications || []) {
    for (const entity of notification.dataChangeEvent?.entities || []) {
      if (entity.name === 'Invoice') invoiceIds.add(entity.id)
    }
  }

  for (const invoiceId of Array.from(invoiceIds)) {
    try {
      const invoice = await getInvoice(invoiceId)
      const totalAmt = invoice.TotalAmt ?? 0
      const balance = invoice.Balance ?? totalAmt
      const isPaid = balance === 0
      const isPartiallyPaid = balance > 0 && balance < totalAmt

      const { error } = await supabaseAdmin
        .from('leads')
        .update({
          quickbooks_invoice_status: isPaid ? 'paid' : isPartiallyPaid ? 'partially_paid' : 'sent',
          ...(isPaid ? { status: 'paid', amount_paid: totalAmt, amount_remaining: 0 } : {}),
        })
        .eq('quickbooks_invoice_id', invoiceId)

      if (error) {
        console.error('[quickbooks-webhook] failed to update lead for invoice', invoiceId, error)
      }
    } catch (err) {
      console.error('[quickbooks-webhook] failed to process invoice', invoiceId, err instanceof Error ? err.message : err)
    }
  }

  return NextResponse.json({ received: true })
}
