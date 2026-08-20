import { NextRequest, NextResponse } from 'next/server'
import { syncInvoicePayment, syncStayInvoicePayment } from '@/lib/quickbooksSync'

export const dynamic = 'force-dynamic'

// Manual "check this invoice now" for the CRM — same logic the reconcile
// cron runs on a timer, just triggered on demand instead of waiting up to
// 3 minutes. Handy right after a guest says they paid.
export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { invoiceId } = await req.json()
  if (!invoiceId) return NextResponse.json({ error: 'Missing invoiceId' }, { status: 400 })

  let result = await syncInvoicePayment(invoiceId)
  let type: 'lead' | 'stay' = 'lead'
  if (result.status === 'not_ours') {
    result = await syncStayInvoicePayment(invoiceId)
    type = 'stay'
  }

  return NextResponse.json({ type, result })
}
