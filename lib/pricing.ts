// Pure pricing math shared by the server (app/api/leads/route.ts) and the
// two booking forms (BookingForm.tsx, MainMapBookingForm.tsx). No supabase
// import here on purpose — this file is safe to import from client
// components so the price a guest sees matches what the server charges.

// Same 30-minute time slots (5:00 AM through 11:30 PM) used by both booking
// forms and now the admin CRM's manual reservation form, so every time
// dropdown in the app offers the exact same options in the exact "h:mm AM/PM"
// format parseHour12 (below) expects.
export function generateTimeSlots(): string[] {
  const slots: string[] = []
  for (let h = 5; h <= 23; h++) {
    const hStr = h > 12 ? h - 12 : h
    const ampm = h >= 12 ? 'PM' : 'AM'
    const hDisplay = h === 12 ? 12 : hStr
    slots.push(`${hDisplay}:00 ${ampm}`)
    slots.push(`${hDisplay}:30 ${ampm}`)
  }
  return slots
}

export const TIME_SLOTS = generateTimeSlots()

export type SurchargeType = 'fixed' | 'percentage'

export interface SurchargeConfig {
  surcharge_type: SurchargeType
  surcharge_amount: number // dollars if fixed, percentage points if percentage
  surcharge_start_hour: number // 0-23, inclusive
  surcharge_end_hour: number // 0-23, exclusive
}

// Hotel slug the corporate site's booking form books under.
export const MAIN_SITE_SLUG = 'main-site'

// Where a guest goes back to after cancelling checkout: their hotel's page,
// or the corporate site's home for website bookings (main-site has no page).
export function bookingPagePath(hotelSlug: string): string {
  return hotelSlug === MAIN_SITE_SLUG ? '/' : `/hotel/${hotelSlug}`
}

// Mileage-tier pricing for the corporate site, edited in the CRM: a trip up
// to `up_to` miles costs `price`; past the last tier each extra mile adds
// `extra_per_mile`. Guests only ever see the resulting price.
export interface MileTier {
  up_to: number
  price: number
}

export interface MileTierConfig {
  enabled: boolean
  tiers: MileTier[]
  extra_per_mile: number
}

export interface VehicleRateParams {
  base: number
  per_mile: number
  per_minute?: number
  min_price?: number
  max_price?: number
  multiplier?: number
  mile_tiers?: MileTierConfig | null
}

// Drops empty/invalid rows and sorts by distance so the CRM can save tiers in
// any order. Returns null when there is nothing usable to price with.
export function normalizeMileTiers(config: unknown): MileTierConfig | null {
  if (!config || typeof config !== 'object') return null
  const c = config as Partial<MileTierConfig>
  const tiers = (Array.isArray(c.tiers) ? c.tiers : [])
    .map((t) => ({ up_to: Number(t?.up_to), price: Number(t?.price) }))
    .filter((t) => Number.isFinite(t.up_to) && t.up_to > 0 && Number.isFinite(t.price) && t.price >= 0)
    .sort((a, b) => a.up_to - b.up_to)
  const extra = Number(c.extra_per_mile)
  return { enabled: Boolean(c.enabled) && tiers.length > 0, tiers, extra_per_mile: Number.isFinite(extra) && extra > 0 ? extra : 0 }
}

// Price for a distance under the tier table, or null when tiers are off.
// Miles are rounded to 0.1 first so the client and the server agree on
// which side of a tier boundary a trip falls.
export function calculateTierAmount(config: MileTierConfig | null | undefined, distanceMiles: number): number | null {
  const c = normalizeMileTiers(config)
  if (!c || !c.enabled) return null
  const miles = Math.round(Math.max(0, distanceMiles) * 10) / 10
  const tier = c.tiers.find((t) => miles <= t.up_to)
  if (tier) return Math.ceil(tier.price)
  const last = c.tiers[c.tiers.length - 1]
  return Math.ceil(last.price + Math.ceil(miles - last.up_to) * c.extra_per_mile)
}

// Lowest price a guest can see for a vehicle ("from $X" on the site).
export function startingPrice(params: Pick<VehicleRateParams, 'base' | 'mile_tiers'>): number {
  const c = normalizeMileTiers(params.mile_tiers)
  return c?.enabled ? Math.ceil(c.tiers[0].price) : params.base
}

// Parses "6:00 PM" / "11:30 AM" into a 0-23 local hour. Times are always
// stored as Florida wall-clock, so no timezone conversion is needed here —
// the surcharge window is defined in the same local hours.
export function parseHour12(timeStr?: string | null): number | null {
  if (!timeStr) return null
  const [time, ampm] = timeStr.split(' ')
  if (!time || !ampm) return null
  let hours = parseInt(time.split(':')[0], 10)
  if (Number.isNaN(hours)) return null
  if (ampm.toUpperCase() === 'PM' && hours < 12) hours += 12
  if (ampm.toUpperCase() === 'AM' && hours === 12) hours = 0
  return hours
}

// True if `hour` falls in [start, end). Handles overnight windows where the
// range wraps past midnight (e.g. start=17, end=2 means 5pm through 2am).
export function isSurchargeHour(hour: number, config: SurchargeConfig): boolean {
  const { surcharge_start_hour: start, surcharge_end_hour: end } = config
  if (start === end) return false
  if (start < end) return hour >= start && hour < end
  return hour >= start || hour < end
}

// Applies the configured time-of-day surcharge to an already-finalized leg
// amount (whether it came from a fixed route lookup or the distance
// formula), based on that leg's own pickup time.
export function applyTimeSurcharge(
  baseAmount: number,
  timeStr: string | undefined | null,
  config: SurchargeConfig | null | undefined
): number {
  if (!config || !baseAmount) return baseAmount
  const hour = parseHour12(timeStr)
  if (hour === null || !isSurchargeHour(hour, config)) return baseAmount
  if (config.surcharge_type === 'percentage') {
    return baseAmount * (1 + config.surcharge_amount / 100)
  }
  return baseAmount + config.surcharge_amount
}

// Mileage tiers win when the vehicle has them switched on; otherwise the
// base + per-mile + per-minute formula, with multiplier and min/max
// clamp applied consistently — previously the server ignored `multiplier`
// and never applied `max_price`, while the client applied both.
export function calculateDistanceAmount(
  params: VehicleRateParams,
  distanceMiles: number,
  durationMinutes: number
): number {
  const tierAmount = distanceMiles > 0 ? calculateTierAmount(params.mile_tiers, distanceMiles) : null
  if (tierAmount !== null) return tierAmount
  if (distanceMiles <= 0) return Math.ceil(params.base || 0)

  const perMinute = params.per_minute || 0
  const minPrice = params.min_price || 0
  const maxPrice = params.max_price || Infinity
  const multiplier = params.multiplier || 1.0

  const raw = ((params.base || 0) + (params.per_mile || 0) * distanceMiles + perMinute * durationMinutes) * multiplier
  return Math.ceil(Math.max(minPrice, Math.min(maxPrice, raw)))
}
