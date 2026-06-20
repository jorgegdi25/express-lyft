import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const hotel_slug = searchParams.get('hotel_slug')

  if (!hotel_slug) {
    return NextResponse.json({ error: 'Missing hotel_slug' }, { status: 400 })
  }

  const [pricingRes, routePricingRes, hotelRes] = await Promise.all([
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd, price_per_mile, price_per_minute, min_price, max_price, multiplier'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', hotel_slug),
    supabaseAdmin.from('hotels').select('*').eq('slug', hotel_slug).maybeSingle(),
  ])

  const prices: Record<string, { base: number, per_mile: number, per_minute: number, min_price: number, max_price: number, multiplier: number }> = {
    sedan_suv: { base: 120, per_mile: 3.50, per_minute: 0.30, min_price: 15, max_price: 120, multiplier: 1.0 },
    suburban: { base: 150, per_mile: 5.00, per_minute: 0.40, min_price: 25, max_price: 150, multiplier: 1.0 },
    sprinter: { base: 260, per_mile: 6.00, per_minute: 0.50, min_price: 50, max_price: 260, multiplier: 1.0 },
    minibus: { base: 450, per_mile: 8.00, per_minute: 0.70, min_price: 100, max_price: 450, multiplier: 1.0 },
    coachbus: { base: 800, per_mile: 10.00, per_minute: 1.00, min_price: 200, max_price: 800, multiplier: 1.0 },
  }

  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type] = {
          base: row.price_usd,
          per_mile: row.price_per_mile || prices[row.vehicle_type].per_mile,
          per_minute: row.price_per_minute || prices[row.vehicle_type].per_minute,
          min_price: row.min_price || prices[row.vehicle_type].min_price,
          max_price: row.max_price || prices[row.vehicle_type].max_price,
          multiplier: row.multiplier || prices[row.vehicle_type].multiplier,
        }
      }
    }
  }

  const response = NextResponse.json({
    prices,
    routePrices: routePricingRes.data || [],
    hotel: hotelRes.data || null,
  })

  // Prevent ANY caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
