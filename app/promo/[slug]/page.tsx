import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import BookingForm from '@/components/BookingForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
interface PageProps {
  params: { slug: string }
  searchParams: { success?: string; tab?: string }
}

async function getHotelData(slug: string) {
  const [hotelRes, pricingRes, routePricingRes] = await Promise.all([
    supabaseAdmin.from('hotels').select('slug, name').eq('slug', slug).eq('active', true).maybeSingle(),
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', slug),
  ])

  const prices = { sedan_suv: 120, suburban: 150, sprinter: 260, minibus: 450, coachbus: 800 }
  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type as keyof typeof prices] = row.price_usd
      }
    }
  }

  let hotel = hotelRes.data
  if (!hotel) {
    if (slug === 'demo' || slug === 'bocean-resort') {
      hotel = { slug: slug, name: 'B Ocean Resort' }
    } else {
      return null
    }
  }

  return { hotel, prices, routePrices: routePricingRes.data || [] }
}


export default async function HotelPage({ params, searchParams }: PageProps) {
  const data = await getHotelData(params.slug)
  if (!data) notFound()

  const { hotel, prices } = data

  return (
    <main style={{ background: '#111111', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ── Booking form ─────────────────────────────────────────── */}

      {/* ── Booking form ─────────────────────────────────────────── */}
      <BookingForm
        hotelSlug={params.slug}
        prices={prices}
        routePrices={data.routePrices}
        isPromo={true}
      />





      {/* ── Social / Selection Scripts ───────────────────────────── */}
      <script dangerouslySetInnerHTML={{ __html: `
        (function() {
          window.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-vehicle-select]');
            if (btn) {
              var vehicle = btn.getAttribute('data-vehicle-select');
              window.dispatchEvent(new CustomEvent('select-vehicle', { detail: vehicle }));
            }
          });
        })();
      ` }} />
    </main>
  )
}
