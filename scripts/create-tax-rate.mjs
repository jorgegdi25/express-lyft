// One-time setup: creates the Stripe Tax Rate object used to add Florida's
// 7% sales tax to checkout sessions and invoices (see lib/tax.ts). Stripe
// keeps test-mode and live-mode objects completely separate, so this needs
// to run once per mode — pass the matching secret key each time.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... node scripts/create-tax-rate.mjs   (test mode)
//   STRIPE_SECRET_KEY=sk_live_... node scripts/create-tax-rate.mjs   (live mode, only when ready to go live)
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY')
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: '2024-04-10' })

const taxRate = await stripe.taxRates.create({
  display_name: 'Florida Sales Tax',
  description: 'FL state + county sales tax',
  percentage: 7.0,
  inclusive: false,
  country: 'US',
  state: 'FL',
  jurisdiction: 'FL',
})

console.log(`Created Tax Rate (${key.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode): ${taxRate.id}`)
console.log('Set this as STRIPE_TAX_RATE_ID in the matching Vercel environment.')
