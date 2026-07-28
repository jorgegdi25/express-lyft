import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

// TEMPORARY diagnostic route to figure out which Stripe account/mode the
// deployed environment is actually authenticating as. Remove after use.
export async function GET(req: NextRequest) {
  const key = process.env.STRIPE_SECRET_KEY || ''
  try {
    const taxRates = await stripe.taxRates.list({ limit: 10 }).catch((e) => ({ error: e.message }))
    return NextResponse.json({
      keyPrefix: key.slice(0, 15),
      keyMode: key.startsWith('sk_live') ? 'live' : key.startsWith('sk_test') ? 'test' : 'unknown',
      taxRates,
      envTaxRateId: process.env.STRIPE_TAX_RATE_ID || null,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message, keyPrefix: key.slice(0, 15) }, { status: 500 })
  }
}
