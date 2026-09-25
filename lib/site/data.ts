import { supabaseAdmin } from '@/lib/supabase'
import type { FleetType } from './fleet'

// Server-only helpers for the corporate site. Starting prices come from the
// same `pricing` table the booking engine and the CRM use — the site never
// hardcodes a price.

export type StartingPrices = Partial<Record<FleetType, number>>

export async function getStartingPrices(): Promise<StartingPrices> {
  const { data } = await supabaseAdmin.from('pricing').select('vehicle_type, price_usd')
  const out: StartingPrices = {}
  for (const row of data || []) {
    if (typeof row.price_usd === 'number') out[row.vehicle_type as FleetType] = row.price_usd
  }
  return out
}

// Full rate params for the home's popular-routes estimate — same shape the
// booking form feeds into calculateDistanceAmount.
export async function getPricingParams() {
  const { data } = await supabaseAdmin
    .from('pricing')
    .select('vehicle_type, price_usd, price_per_mile, price_per_minute, min_price, max_price, multiplier')
  const out: Record<string, { base: number; per_mile: number; per_minute?: number; min_price?: number; max_price?: number; multiplier?: number }> = {}
  for (const r of data || []) {
    out[r.vehicle_type] = {
      base: r.price_usd,
      per_mile: r.price_per_mile || 0,
      per_minute: r.price_per_minute || 0,
      min_price: r.min_price || 0,
      max_price: r.max_price || undefined,
      multiplier: r.multiplier || 1,
    }
  }
  return out
}

export async function getPartnerHotels(): Promise<{ slug: string; name: string }[]> {
  const { data } = await supabaseAdmin.from('hotels').select('slug, name, active').eq('active', true)
  return (data || []).filter((h) => h.slug !== 'main-site').map((h) => ({ slug: h.slug, name: h.name }))
}
