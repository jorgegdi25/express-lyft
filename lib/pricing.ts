// Pure pricing math shared by the server (app/api/leads/route.ts) and the
// two booking forms (BookingForm.tsx, MainMapBookingForm.tsx). No supabase
// import here on purpose — this file is safe to import from client
// components so the price a guest sees matches what the server charges.

export type SurchargeType = 'fixed' | 'percentage'

export interface SurchargeConfig {
  surcharge_type: SurchargeType
  surcharge_amount: number // dollars if fixed, percentage points if percentage
  surcharge_start_hour: number // 0-23, inclusive
  surcharge_end_hour: number // 0-23, exclusive
}

export interface VehicleRateParams {
  base: number
  per_mile: number
  per_minute?: number
  min_price?: number
  max_price?: number
  multiplier?: number
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

// The base + per-mile + per-minute formula, with multiplier and min/max
// clamp applied consistently — previously the server ignored `multiplier`
// and never applied `max_price`, while the client applied both.
export function calculateDistanceAmount(
  params: VehicleRateParams,
  distanceMiles: number,
  durationMinutes: number
): number {
  if (distanceMiles <= 0) return Math.ceil(params.base || 0)

  const perMinute = params.per_minute || 0
  const minPrice = params.min_price || 0
  const maxPrice = params.max_price || Infinity
  const multiplier = params.multiplier || 1.0

  const raw = ((params.base || 0) + (params.per_mile || 0) * distanceMiles + perMinute * durationMinutes) * multiplier
  return Math.ceil(Math.max(minPrice, Math.min(maxPrice, raw)))
}
