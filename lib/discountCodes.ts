import { supabaseAdmin } from '@/lib/supabase'

export type DiscountCheckResult =
  | { valid: true; code: string; type: 'percent' | 'fixed'; value: number; discountAmount: number; finalAmount: number }
  | { valid: false; error: string }

// Looks up a code and computes what it would discount off `baseAmount`,
// without consuming a use. Called both from the public "check my code" UI
// endpoint and from the server-side pricing path right before charging —
// the pricing path is the one that actually matters, since a client can
// never be trusted to report its own discounted total.
export async function checkDiscountCode(rawCode: string, baseAmount: number): Promise<DiscountCheckResult> {
  const code = rawCode.trim().toUpperCase()
  if (!code) return { valid: false, error: 'Enter a code.' }

  const { data: dc } = await supabaseAdmin
    .from('discount_codes')
    .select('*')
    .eq('code', code)
    .maybeSingle()

  if (!dc || !dc.active) return { valid: false, error: 'Invalid code.' }
  if (dc.expires_at && new Date(dc.expires_at) < new Date()) return { valid: false, error: 'This code has expired.' }
  if (dc.max_uses != null && dc.uses_count >= dc.max_uses) return { valid: false, error: 'This code has already been used.' }
  if (dc.min_amount != null && baseAmount < dc.min_amount) {
    return { valid: false, error: `This code requires a minimum of $${dc.min_amount}.` }
  }

  const rawDiscount = dc.type === 'percent' ? baseAmount * (dc.value / 100) : dc.value
  const discountAmount = Math.round(Math.min(rawDiscount, baseAmount) * 100) / 100
  const finalAmount = Math.round((baseAmount - discountAmount) * 100) / 100

  return { valid: true, code: dc.code, type: dc.type, value: dc.value, discountAmount, finalAmount }
}

// Consumes one use. Call only after the lead/booking has actually been
// created — never before, so an abandoned checkout doesn't burn a use.
export async function redeemDiscountCode(code: string): Promise<void> {
  const { error } = await supabaseAdmin.rpc('redeem_discount_code', { p_code: code.trim().toUpperCase() })
  if (error) console.error('[discountCodes] redeem failed:', error)
}
