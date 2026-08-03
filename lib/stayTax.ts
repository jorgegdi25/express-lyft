// Impuesto de alojamiento (sales tax + tourist development tax de
// Miami-Dade/Broward, ~13%) — distinto del 7% de transporte en lib/tax.ts.
// Mismo patrón: un Stripe Tax Rate creado una vez por modo (test/live) vía
// scripts/create-stay-tax-rate.mjs, scopeado por entorno de Vercel igual
// que STRIPE_TAX_RATE_ID.
export function stayLodgingTaxRateIds(): string[] {
  const id = process.env.STAY_LODGING_TAX_RATE_ID
  return id ? [id] : []
}

// Solo informativo para mostrar un estimado en el chat antes de pagar —
// el monto real que se cobra siempre sale de Stripe (session.total_details),
// nunca se recalcula localmente.
export const STAY_LODGING_TAX_RATE_PERCENT = 13
