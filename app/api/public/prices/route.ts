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
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd, price_per_mile'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', hotel_slug),
    supabaseAdmin.from('hotels').select('*').eq('slug', hotel_slug).maybeSingle(),
  ])

  const prices: Record<string, { base: number, per_mile: number }> = {
    sedan_suv: { base: 120, per_mile: 3.50 },
    suburban: { base: 150, per_mile: 5.00 },
    sprinter: { base: 260, per_mile: 6.00 },
    minibus: { base: 450, per_mile: 8.00 },
    coachbus: { base: 800, per_mile: 10.00 },
  }

  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type] = {
          base: row.price_usd,
          per_mile: row.price_per_mile || prices[row.vehicle_type].per_mile
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
