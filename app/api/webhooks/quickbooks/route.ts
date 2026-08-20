import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { syncInvoicePayment, syncStayInvoicePayment } from '@/lib/quickbooksSync'

export const dynamic = 'force-dynamic'
// Same reasoning as the Stripe webhook (app/api/webhooks/stripe/route.ts):
// calendar + email work can outlast Vercel's default ~15s timeout on a cold start.
export const maxDuration = 60

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
    let result = await syncInvoicePayment(invoiceId)
    if (result.status === 'not_ours') {
      result = await syncStayInvoicePayment(invoiceId)
    }
    if (result.status === 'error') {
      console.error('[quickbooks-webhook] failed to process invoice', invoiceId, result.message)
    }
  }

  return NextResponse.json({ received: true })
}
