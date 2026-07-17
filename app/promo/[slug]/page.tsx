import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase'
import BookingForm from '@/components/BookingForm'
import ReviewsMarquee from '@/components/ReviewsMarquee'

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

        <div className="flex items-center gap-2 md:gap-4 lg:gap-6">
          {/* Schedule */}
          <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#2a2a2a] bg-[#1a1a1a]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-[11px] font-semibold text-[#AAAAAA] tracking-wide uppercase">
              Daily 8:00 AM — 10:00 PM
            </span>
          </div>

          {/* Desktop Toll-Free Phone Call */}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[1px] font-semibold" style={{ color: '#888888' }}>
              Concierge Line
            </span>
            <a
              href="tel:+18889737896"
              className="text-sm font-bold hover:text-[#B8960C] transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              +1 (888) 973-7896
            </a>
          </div>

          {/* Desktop WhatsApp Contact */}
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] uppercase tracking-[1px] font-semibold text-[#22c55e] flex items-center gap-1">
              <span className="w-1 h-1 rounded-full bg-[#22c55e] animate-pulse"></span>
              WhatsApp Us
            </span>
            <a
              href="https://wa.me/19546236207"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-bold hover:text-green-400 transition-colors"
              style={{ color: '#FFFFFF' }}
            >
              954-623-6207
            </a>
          </div>

          {/* Mobile phone call icon */}
          <a
            href="tel:+18889737896"
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ border: '1px solid #2a2a2a' }}
            aria-label="Call toll-free"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </a>

          {/* Mobile WhatsApp chat icon */}
          <a
            href="https://wa.me/19546236207"
            target="_blank"
            rel="noopener noreferrer"
            className="md:hidden w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ border: '1px solid #2a2a2a' }}
            aria-label="WhatsApp us"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
          </a>

          {/* CTA button */}
          <a
            href="#booking-form"
            className="px-3.5 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Reserve Online
          </a>
        </div>
      </header>

      {/* ── Simple Promo Header ──────────────────────────────────── */}
      <section 
        className="relative w-full pt-20 pb-16 animate-fade-in flex items-center justify-center" 
        style={{ 
          backgroundImage: "url('/bocean-promo-bg.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '300px'
        }}
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"></div>
        <div className="relative z-10 max-w-3xl mx-auto px-4 md:px-6 text-center flex flex-col gap-4">
          <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#B8960C' }}>
            {hotel.name}
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
            Make your reservation here
          </h1>
          <p className="text-sm md:text-base leading-relaxed" style={{ color: '#DDDDDD' }}>
            Fill out the form below to secure your transportation with Express Lyft.
          </p>
        </div>
      </section>

      {/* ── Booking form ─────────────────────────────────────────── */}
      <BookingForm
        hotelSlug={params.slug}
        prices={{
          sedan_suv: prices.sedan_suv,
          suburban: prices.suburban,
          sprinter: prices.sprinter,
          minibus: prices.minibus,
          coachbus: prices.coachbus,
        }}
        routePrices={data.routePrices}
        isPromo={true}
      />



      {/* ── Reviews Marquee ──────────────────────────────────────────────── */}
      <ReviewsMarquee />

      {/* ── Footer ───────────────────────────────────────────────── */}
      <footer className="w-full py-16" style={{ borderTop: '1px solid #1e1e1e', background: '#0a0a0a' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 md:gap-16">
            
            {/* Column 1: Brand */}
            <div className="flex flex-col gap-4">
              <Image
                src="/logo.webp"
                alt="Express Lyft"
                width={140}
                height={36}
                className="h-9 w-auto object-contain object-left mr-auto"
              />
              <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                Premium private transportation for airport transfers, cruise ports, hotel transfers, and group charters in South Florida. Licensed and insured.
              </p>
              <p className="text-base font-bold leading-relaxed" style={{ color: '#EF9F27' }}>
                ExpLyft is an independent transportation service and is not affiliated with Lyft, Inc.
              </p>
            </div>

            {/* Column 2: Locations */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-[2px]" style={{ color: '#FFFFFF' }}>
                Our Locations
              </h4>
              <div className="flex flex-col gap-4 text-sm" style={{ color: '#888888' }}>
                <div>
                  <p className="font-bold text-white mb-1">Miami</p>
                  <p className="leading-relaxed">
                    6303 Blue Lagoon Drive, Suite 416,<br />
                    Miami, Florida 33126, United States
                  </p>
                </div>
                <div>
                  <p className="font-bold text-white mb-1">Orlando</p>
                  <p className="leading-relaxed">
                    4700 Millenia Blvd., Suite 605,<br />
                    Orlando, Florida 32839, United States
                  </p>
                </div>
              </div>
            </div>

            {/* Column 3: Contact & Links */}
            <div className="flex flex-col gap-4">
              <h4 className="text-sm font-bold uppercase tracking-[2px]" style={{ color: '#FFFFFF' }}>
                Get In Touch
              </h4>
              <div className="flex flex-col gap-3 text-sm" style={{ color: '#888888' }}>
                <a href="tel:+18889737896" className="flex items-center gap-2 hover:text-[#B8960C] transition-colors">
                  <span className="font-bold text-white">Phone:</span> +1 (888) 973-7896
                </a>
                <a href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-green-500 transition-colors">
                  <span className="font-bold text-white">WhatsApp:</span> 954-623-6207
                </a>
                <a href="mailto:info@explyft.com" className="flex items-center gap-2 hover:text-[#B8960C] transition-colors">
                  <span className="font-bold text-white">Email:</span> info@explyft.com
                </a>
                <p><span className="font-bold text-white">Hours:</span> Daily 8:00 AM — 10:00 PM</p>
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-[#1a1a1a]">
                  <a
                    href="https://www.facebook.com/explyft"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#B8960C] transition-colors flex items-center gap-1.5"
                    aria-label="Facebook"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                    </svg>
                    <span className="text-xs">Facebook</span>
                  </a>
                  <a
                    href="https://www.instagram.com/expresslyftofficial?igsh=Y3hzdDk2dzd4eWJy"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#B8960C] transition-colors flex items-center gap-1.5"
                    aria-label="Instagram"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                    </svg>
                    <span className="text-xs">Instagram</span>
                  </a>
                </div>
              </div>

              <div className="flex gap-6 mt-4 pt-4" style={{ borderTop: '1px solid #1e1e1e' }}>
                <a href="/privacy" className="text-xs font-semibold hover:text-white transition-colors" style={{ color: '#666666' }}>
                  Privacy Policy
                </a>
                <a href="/terms" className="text-xs font-semibold hover:text-white transition-colors" style={{ color: '#666666' }}>
                  Terms of Service
                </a>
              </div>
            </div>

          </div>

          <div
            className="mt-12 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs"
            style={{ borderTop: '1px solid #1e1e1e', color: '#555555' }}
          >
            <p>© 2026 Express Lyft. All rights reserved.</p>
            <p className="flex items-center gap-1.5">
              <span>Licensed & Insured</span>
              <span>·</span>
              <span>Miami, FL</span>
              <span>·</span>
              <span>Orlando, FL</span>
            </p>
          </div>
        </div>
      </footer>

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
