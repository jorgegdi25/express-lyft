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

  const [pricingRes, routePricingRes] = await Promise.all([
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', hotel_slug),
  ])

  const prices: Record<string, number> = {
    sedan_suv: 120,
    suburban: 150,
    sprinter: 260,
    minibus: 450,
    coachbus: 800,
  }

  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type] = row.price_usd
      }
    }
  }

  const response = NextResponse.json({
    prices,
    routePrices: routePricingRes.data || [],
  })

  // Prevent ANY caching
  response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  response.headers.set('Pragma', 'no-cache')
  response.headers.set('Expires', '0')

  return response
}
