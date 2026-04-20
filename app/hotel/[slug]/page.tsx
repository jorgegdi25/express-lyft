import Image from 'next/image'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import BookingForm from '@/components/BookingForm'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
interface PageProps {
  params: { slug: string }
  searchParams: { success?: string }
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
    if (slug === 'demo') {
      hotel = { slug: 'demo', name: 'The Grand Palace, Miami' }
    } else {
      return null
    }
  }

  return { hotel, prices, routePrices: routePricingRes.data || [] }
}

/* ─── Feature cards data ─────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Airport Transfers',
    desc: 'Discreet, on-time pickup at all major terminals — MIA, FLL and beyond.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.5-3 3-1.5-.5c-.3-.1-.7 0-.9.2l-.5.5c-.2.3-.1.7.1.9l2.7 2 2 2.7c.2.3.6.3.9.1l.5-.5c.2-.2.3-.6.2-.9l-.5-1.5 3-3 3.5 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      </svg>
    ),
  },
  {
    title: 'In-Cabin Amenities',
    desc: 'Premium bottled water, Wi-Fi and climate control on every ride.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M5 12.55a11 11 0 0 1 14.08 0m-11.3 2.78a7 7 0 0 1 8.52 0M12 19l.01 0M2 8.82a15 15 0 0 1 20 0" />
      </svg>
    ),
  },
  {
    title: 'Certified Chauffeurs',
    desc: 'Every driver is background-checked, licensed and professionally trained.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Fast Confirmation',
    desc: 'Submit your request in seconds. Our team confirms within minutes.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    ),
  },
]

/* ─── Stats data ─────────────────────────────────────────────────── */
const STATS = [
  { stat: '4', label: 'Pickup Destinations' },
  { stat: '55', label: 'Max Passengers' },
  { stat: '5', label: 'Vehicle Classes' },
  { stat: '7', label: 'Days a Week' },
]

export default async function HotelPage({ params, searchParams }: PageProps) {
  const data = await getHotelData(params.slug)
  if (!data) notFound()

  const { hotel, prices } = data
  const showSuccess = searchParams.success === 'true'

  return (
    <main style={{ background: '#111111', minHeight: '100vh', color: '#FFFFFF' }}>

      {/* ── Header ──────────────────────────────────────────────── */}
      <header
        className="w-full px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
        style={{ background: 'rgba(17,17,17,0.88)', borderBottom: '1px solid #1e1e1e' }}
      >
        <div className="flex items-center">
          <Image
            src="/logo.webp"
            alt="Express Lyft"
            width={180}
            height={48}
            className="h-9 md:h-11 w-auto object-contain"
          />
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          {/* Desktop phone */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-xs uppercase tracking-[2px] font-medium" style={{ color: '#888888' }}>
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

          {/* Mobile phone icon */}
          <a
            href="tel:3053679944"
            className="md:hidden w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ border: '1px solid #2a2a2a' }}
            aria-label="Call us"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          {/* CTA button */}
          <a
            href="#booking-form"
            className="px-4 md:px-6 py-2.5 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Reserve Online
          </a>
        </div>
      </header>

      {/* ── Success banner ───────────────────────────────────────── */}
      {showSuccess && (
        <div
          className="w-full px-6 py-5 flex items-start gap-4"
          style={{ background: 'rgba(184,150,12,0.08)', borderBottom: '1px solid rgba(184,150,12,0.4)' }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
            style={{ background: 'rgba(184,150,12,0.2)', border: '1px solid #B8960C' }}
          >
            <span style={{ color: '#B8960C', fontWeight: 'bold' }}>✓</span>
          </div>
          <div>
            <p className="font-bold text-base mb-1" style={{ color: '#D4AF37' }}>
              Your reservation request has been received!
            </p>
            <p className="text-sm" style={{ color: '#AAAAAA' }}>
              Our concierge team will review your request and contact you shortly. Need immediate help?{' '}
              <a href="tel:3053679944" className="font-semibold underline" style={{ color: '#EF9F27' }}>
                Call 305-367-9944
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <HeroSection hotelName={hotel.name} vehicleType="sedan_suv" basePrice={prices.sedan_suv} />

      {/* ── Booking form ─────────────────────────────────────────── */}
      <BookingForm
        hotelSlug={params.slug}
        hotelName={hotel.name}
        prices={prices}
        routePrices={data.routePrices}
      />

      {/* ── Features strip ───────────────────────────────────────── */}
      <section className="w-full py-20" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
              Our Promise
            </p>
            <h2
              className="text-2xl md:text-4xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Why Choose Express Lyft
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C10]"
                style={{ background: '#161616', border: '1px solid #252525' }}
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(184,150,12,0.1)', border: '1px solid rgba(184,150,12,0.2)' }}
                >
                  {f.icon}
                </div>
                <div>
                  <p className="text-base font-bold mb-2" style={{ color: '#FFFFFF' }}>
                    {f.title}
                  </p>
                  <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats section ────────────────────────────────────────── */}
      <section className="w-full py-20" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
          {/* Left copy */}
          <div className="flex flex-col gap-5">
            <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#B8960C' }}>
              By the Numbers
            </p>
            <h2
              className="text-2xl md:text-4xl font-bold leading-snug"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              Miami&apos;s most trusted luxury transfer service.
            </h2>
            <p className="text-base leading-relaxed" style={{ color: '#888888' }}>
              From the airport to the cruise terminal, we move Miami&apos;s most discerning travelers with precision and care.
            </p>
            <a
              href="#booking-form"
              className="inline-flex w-fit px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Book Now →
            </a>
          </div>

          {/* Right stats grid */}
          <div className="grid grid-cols-2 gap-4">
            {STATS.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl p-6 text-center flex flex-col gap-1 transition-all hover:border-[#B8960C]"
                style={{ background: '#161616', border: '1px solid #252525' }}
              >
                <p
                  className="text-4xl md:text-5xl font-bold"
                  style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  {s.stat}
                </p>
                <p className="text-sm font-medium mt-1" style={{ color: '#888888' }}>
                  {s.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA banner ───────────────────────────────────────────── */}
      <section className="w-full py-16" style={{ borderTop: '1px solid #1a1a1a' }}>
        <div className="max-w-3xl mx-auto px-4 md:px-6 text-center flex flex-col gap-6 items-center">
          <h2
            className="text-2xl md:text-4xl font-bold"
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
          >
            Ready to ride in style?
          </h2>
          <p className="text-base" style={{ color: '#888888' }}>
            Reserve your luxury transfer online in minutes, or speak directly with our concierge team.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <a
              href="#booking-form"
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-[#B8960C30]"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Reserve Online
            </a>
            <a
              href="tel:3053679944"
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:border-[#B8960C] hover:text-[#B8960C]"
              style={{ border: '1px solid #333333', color: '#FFFFFF' }}
            >
              305-367-9944
            </a>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="w-full py-12" style={{ borderTop: '1px solid #1e1e1e' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8">
            {/* Brand */}
            <div className="flex flex-col items-center md:items-start gap-3">
              <Image
                src="/logo.webp"
                alt="Express Lyft"
                width={140}
                height={36}
                className="h-9 w-auto object-contain"
              />
              <p className="text-sm text-center md:text-left" style={{ color: '#777777' }}>
                Luxury transportation for Miami&apos;s most discerning guests.
              </p>
            </div>

            {/* Links */}
            <div className="flex gap-8">
              {['Privacy', 'Terms', 'Contact'].map((l) => (
                <a
                  key={l}
                  href="#"
                  className="text-sm font-medium hover:text-white transition-colors"
                  style={{ color: '#666666' }}
                >
                  {l}
                </a>
              ))}
            </div>

            {/* Contact */}
            <div className="flex flex-col items-center md:items-end gap-1">
              <a
                href="tel:3053679944"
                className="text-base font-bold hover:text-[#B8960C] transition-colors"
                style={{ color: '#FFFFFF' }}
              >
                305-367-9944
              </a>
              <p className="text-xs font-medium" style={{ color: '#666666' }}>
                Available 8:00 AM — 10:00 PM
              </p>
            </div>
          </div>

          <div
            className="mt-8 pt-6 flex flex-col md:flex-row items-center justify-between gap-3"
            style={{ borderTop: '1px solid #1e1e1e' }}
          >
            <p className="text-sm" style={{ color: '#555555' }}>
              © 2026 Express Lyft. All rights reserved.
            </p>
            <p className="text-xs" style={{ color: '#444444' }}>
              Premium transportation · Miami, FL
            </p>
          </div>
        </div>
      </footer>
    </main>
  )
}
