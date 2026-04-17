import { notFound } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import BookingForm from '@/components/BookingForm'

interface PageProps {
  params: { slug: string }
  searchParams: { success?: string }
}

async function getHotelData(slug: string) {
  // Demo mode or check if slug is 'demo'
  const isDemo = slug === 'demo'
  
  const [hotelRes, pricingRes, routePricingRes] = await Promise.all([
    supabase.from('hotels').select('slug, name').eq('slug', slug).eq('active', true).single(),
    supabase.from('pricing').select('vehicle_type, price_usd'),
    supabase.from('route_pricing').select('*').eq('hotel_slug', slug)
  ])

  // Fallback to demo data if slug is demo OR if there is an error/no data
  if (isDemo || hotelRes.error || !hotelRes.data) {
    return {
      hotel: {
        slug: 'demo',
        name: isDemo ? 'The Grand Palace, Miami' : 'Express Lyft Demo'
      },
      prices: { suv: 120, minivan: 180, sprinter: 260 },
      routePrices: []
    }
  }

  const prices = { suv: 120, minivan: 180, sprinter: 260 }
  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      prices[row.vehicle_type as keyof typeof prices] = row.price_usd
    }
  }

  return { 
    hotel: hotelRes.data, 
    prices,
    routePrices: routePricingRes.data || []
  }
}

export default async function HotelPage({ params, searchParams }: PageProps) {
  const data = await getHotelData(params.slug)
  // Ensure we always have data now, but keep check just in case
  if (!data) notFound()

  const { hotel, prices } = data
  const showSuccess = searchParams.success === 'true'

  return (
    <main style={{ background: '#111111', minHeight: '100vh', color: '#FFFFFF' }}>
      {/* Header */}
      <header
        className="w-full px-6 py-5 flex items-center justify-between"
        style={{ borderBottom: '1px solid #222222' }}
      >
        <span
          className="text-xl font-bold tracking-[4px] uppercase"
          style={{ color: '#B8960C', fontFamily: 'Georgia, serif' }}
        >
          EXPRESS LYFT
        </span>
        <div className="flex flex-col items-end">
          <span className="text-xs uppercase tracking-[2px]" style={{ color: '#555555' }}>
            Concierge line
          </span>
          <a
            href="tel:3053679944"
            className="text-base font-bold"
            style={{ color: '#FFFFFF' }}
          >
            305-367-9944
          </a>
        </div>
      </header>

      {/* Success banner */}
      {showSuccess && (
        <div
          className="w-full px-6 py-5 flex items-center gap-4"
          style={{ background: '#1a1a1a', borderBottom: '1px solid #B8960C' }}
        >
          <span className="text-2xl" style={{ color: '#B8960C' }}>✓</span>
          <div>
            <p className="font-bold" style={{ color: '#B8960C' }}>
              Your ride is confirmed!
            </p>
            <p className="text-sm" style={{ color: '#555555' }}>
              Check your email for details. Need changes? Call us at{' '}
              <a href="tel:3053679944" style={{ color: '#EF9F27' }}>
                305-367-9944
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <HeroSection hotelName={hotel.name} vehicleType="suv" basePrice={prices.suv} />

      {/* Booking + Vehicle */}
      <BookingForm 
        hotelSlug={params.slug} 
        hotelName={hotel.name} 
        prices={prices} 
        routePrices={data.routePrices} 
      />

      {/* Features Strip */}
      <section className="w-full py-16" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-6">
          <p
            className="text-xs font-bold uppercase tracking-[3px] mb-10 text-center"
            style={{ color: '#555555' }}
          >
            Why Express Lyft
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {[
              {
                title: 'Airport Transfers',
                desc: 'Discreet, on-time pickup at all major terminals.',
              },
              {
                title: 'In-Cabin Amenities',
                desc: 'Premium water, Wi-Fi and climate control.',
              },
              {
                title: 'Professional Drivers',
                desc: 'All chauffeurs vetted and certified.',
              },
              {
                title: 'Instant Confirmation',
                desc: 'Secure payment via Stripe — confirmed in seconds.',
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 flex flex-col gap-2"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <p
                  className="text-sm font-bold uppercase tracking-[2px]"
                  style={{ color: '#B8960C' }}
                >
                  {f.title}
                </p>
                <p className="text-sm" style={{ color: '#555555' }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="w-full py-16" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div>
            <p
              className="text-xs font-bold uppercase tracking-[3px] mb-4"
              style={{ color: '#555555' }}
            >
              By the numbers
            </p>
            <h2
              className="text-3xl font-bold"
              style={{ fontFamily: 'Georgia, serif', color: '#FFFFFF' }}
            >
              Miami&apos;s most trusted luxury transfer service.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-6">
            {[
              { stat: '4', label: 'Destinations' },
              { stat: '14', label: 'Max Passengers' },
              { stat: '3', label: 'Vehicle Classes' },
              { stat: '7', label: 'Days a Week' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-6 text-center"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <p className="text-4xl font-bold" style={{ color: '#B8960C' }}>
                  {s.stat}
                </p>
                <p className="text-xs uppercase tracking-widest mt-1" style={{ color: '#555555' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="w-full px-6 py-10 mt-4"
        style={{ borderTop: '1px solid #222222' }}
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col gap-1">
            <span
              className="text-lg font-bold tracking-[4px] uppercase"
              style={{ color: '#B8960C', fontFamily: 'Georgia, serif' }}
            >
              EXPRESS LYFT
            </span>
            <p className="text-xs" style={{ color: '#555555' }}>
              Luxury transportation for Miami&apos;s most discerning guests.
            </p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-widest" style={{ color: '#555555' }}>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs" style={{ color: '#555555' }}>
            © 2026 Express Lyft. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
