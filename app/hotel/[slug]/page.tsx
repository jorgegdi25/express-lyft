import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import BookingForm from '@/components/BookingForm'

export const dynamic = 'force-dynamic'

interface PageProps {
  params: { slug: string }
  searchParams: { success?: string }
}

async function getHotelData(slug: string) {
  const isDemoSlug = slug === 'demo'
  
  const [hotelRes, pricingRes, routePricingRes] = await Promise.all([
    supabaseAdmin.from('hotels').select('slug, name').eq('slug', slug).eq('active', true).maybeSingle(),
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', slug)
  ])

  // Default prices
  const prices = { sedan_suv: 120, suburban: 150, sprinter: 260, minibus: 450, coachbus: 800 }
  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type as keyof typeof prices] = row.price_usd
      }
    }
  }

  // Use DB data if found, otherwise use fallback only if specifically 'demo'
  let hotel = hotelRes.data
  if (!hotel) {
    if (isDemoSlug) {
      hotel = {
        slug: 'demo',
        name: 'The Grand Palace, Miami'
      }
    } else {
      return null
    }
  }

  return { 
    hotel, 
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
        className="w-full px-4 md:px-6 py-4 md:py-5 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md bg-[#111111]/80"
        style={{ borderBottom: '1px solid #222222' }}
      >
        <div className="flex items-center">
          <Image src="/logo.webp" alt="Express Lyft" width={180} height={48} className="h-8 md:h-12 w-auto object-contain" />
        </div>

        <div className="flex items-center gap-3 md:gap-8">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[2px]" style={{ color: '#666666' }}>
              Concierge line
            </span>
            <a
              href="tel:3053679944"
              className="text-base font-bold hover:text-[#B8960C] transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              305-367-9944
            </a>
          </div>
          
          {/* Mobile: phone icon, Desktop: full button */}
          <a
            href="tel:3053679944"
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: '1px solid #2a2a2a' }}
            aria-label="Call us"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
            </svg>
          </a>

          <a
            href="#booking-form"
            className="px-4 md:px-6 py-2.5 md:py-3 rounded-xl text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-lg shadow-[#B8960C20]"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Reserve Online
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
              Your reservation request has been received!
            </p>
            <p className="text-sm" style={{ color: '#999999' }}>
              Our concierge team will review your request and contact you shortly. Need changes? Call us at{' '}
              <a href="tel:3053679944" style={{ color: '#EF9F27' }}>
                305-367-9944
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Hero */}
      <HeroSection hotelName={hotel.name} vehicleType="sedan_suv" basePrice={prices.sedan_suv} />

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
            style={{ color: '#666666' }}
          >
            Why Express Lyft
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: 'Airport Transfers',
                desc: 'Discreet, on-time pickup at all major terminals.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5"><path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.5-3 3-1.5-.5c-.3-.1-.7 0-.9.2l-.5.5c-.2.3-.1.7.1.9l2.7 2 2 2.7c.2.3.6.3.9.1l.5-.5c.2-.2.3-.6.2-.9l-.5-1.5 3-3 3.5 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z"/></svg>,
              },
              {
                title: 'In-Cabin Amenities',
                desc: 'Premium water, Wi-Fi and climate control.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5"><path d="M5 12.55a11 11 0 0 1 14.08 0m-11.3 2.78a7 7 0 0 1 8.52 0M12 19l.01 0M2 8.82a15 15 0 0 1 20 0"/></svg>,
              },
              {
                title: 'Professional Drivers',
                desc: 'All chauffeurs vetted and certified.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/></svg>,
              },
              {
                title: 'Instant Request',
                desc: 'Submit your request in seconds and receive immediate assistance.',
                icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
              },
            ].map((f) => (
              <div
                key={f.title}
                className="rounded-xl p-6 flex flex-col gap-3 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg hover:shadow-[#B8960C10] hover:-translate-y-1 group"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <div className="w-12 h-12 rounded-lg flex items-center justify-center mb-1 transition-colors" style={{ background: '#111', border: '1px solid #2a2a2a' }}>
                  {f.icon}
                </div>
                <p
                  className="text-sm font-bold uppercase tracking-[2px]"
                  style={{ color: '#D4AF37' }}
                >
                  {f.title}
                </p>
                <p className="text-sm leading-relaxed" style={{ color: '#999999' }}>
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
              style={{ color: '#666666' }}
            >
              By the numbers
            </p>
            <h2
              className="text-2xl md:text-3xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}
            >
              Miami&apos;s most trusted luxury transfer service.
            </h2>
          </div>
          <div className="grid grid-cols-2 gap-4 md:gap-6">
            {[
              { stat: '4', label: 'Destinations' },
              { stat: '55', label: 'Max Passengers' },
              { stat: '5', label: 'Vehicle Classes' },
              { stat: '7', label: 'Days a Week' },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl p-4 md:p-6 text-center transition-all duration-300 hover:border-[#B8960C]"
                style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
              >
                <p className="text-3xl md:text-4xl font-bold" style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}>
                  {s.stat}
                </p>
                <p className="text-[10px] md:text-xs uppercase tracking-widest mt-1" style={{ color: '#999999' }}>
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
          <div className="flex flex-col items-center md:items-start gap-2">
            <Image src="/logo.webp" alt="Express Lyft" width={120} height={32} className="h-8 w-auto object-contain" />
            <p className="text-xs" style={{ color: '#999999' }}>
              Luxury transportation for Miami&apos;s most discerning guests.
            </p>
          </div>
          <div className="flex gap-6 text-xs uppercase tracking-widest" style={{ color: '#666666' }}>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
          <p className="text-xs" style={{ color: '#666666' }}>
            © 2026 Express Lyft. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  )
}
