// One-time setup: creates the Stripe Tax Rate object used for Stay's room
// charges (lodging tax — sales tax + tourist development tax, ~13% in
// Miami-Dade/Broward). Separate object from the 7% transport tax rate in
// create-tax-rate.mjs because rooms and rides are taxed differently.
//
// CONFIRM THE EXACT PERCENTAGE with Dennis/accountant before running this
// in live mode — 13% is a placeholder based on published Miami-Dade/
// Broward rates, not a confirmed number for this business.
//
// Usage:
//   STRIPE_SECRET_KEY=sk_test_... STAY_TAX_PERCENT=13 node scripts/create-stay-tax-rate.mjs   (test mode)
//   STRIPE_SECRET_KEY=sk_live_... STAY_TAX_PERCENT=13 node scripts/create-stay-tax-rate.mjs   (live mode, only when confirmed)
import Stripe from 'stripe'

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error('Missing STRIPE_SECRET_KEY')
  process.exit(1)
}

const percent = parseFloat(process.env.STAY_TAX_PERCENT || '13')

const stripe = new Stripe(key, { apiVersion: '2024-04-10' })

const taxRate = await stripe.taxRates.create({
  display_name: 'FL Lodging Tax (Sales + Tourist Development)',
  description: 'Miami-Dade/Broward sales tax + tourist development tax on hotel rooms',
  percentage: percent,
  inclusive: false,
  country: 'US',
  state: 'FL',
  jurisdiction: 'FL',
})

console.log(`Created Stay Lodging Tax Rate (${key.startsWith('sk_live') ? 'LIVE' : 'TEST'} mode, ${percent}%): ${taxRate.id}`)
console.log('Set this as STAY_LODGING_TAX_RATE_ID in the matching Vercel environment.')
