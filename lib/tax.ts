// Florida sales tax (7% — decided by the client instead of using Stripe Tax's
// automatic calculation, which needed a registration number nobody had on
// hand). This is a plain Stripe Tax Rate object, a much older/simpler Stripe
// feature than "Stripe Tax": it just adds a fixed-percentage tax line to a
// checkout, with no account-level activation or registration required.
// STRIPE_TAX_RATE_ID must be created once per Stripe mode (test/live) — see
// scripts/create-tax-rate.mjs — and is scoped per Vercel environment the same
// way SUPABASE_URL is (Preview → test mode id, Production → live mode id).
export function flTaxRateIds(): string[] {
  const id = process.env.STRIPE_TAX_RATE_ID
  return id ? [id] : []
}
