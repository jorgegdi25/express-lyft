import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// TEMPORARY diagnostic route (admin-gated) to confirm the live-mode Stripe
// key/tax rate are wired correctly before trusting real customer charges.
// Remove after use.
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const key = process.env.STRIPE_SECRET_KEY || ''
  try {
    const taxRates = await stripe.taxRates.list({ limit: 10 }).catch((e) => ({ error: e.message }))
    return NextResponse.json({
      keyMode: key.startsWith('sk_live') ? 'live' : key.startsWith('sk_test') ? 'test' : 'unknown',
      taxRates,
      envTaxRateId: process.env.STRIPE_TAX_RATE_ID || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
