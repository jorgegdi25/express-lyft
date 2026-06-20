import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { headers } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabase'
import HeroSection from '@/components/HeroSection'
import MainMapBookingForm from '@/components/MainMapBookingForm'
import ImageGallery from '@/components/ImageGallery'
import Testimonials from '@/components/Testimonials'
import ReviewsMarquee from '@/components/ReviewsMarquee'
export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'
interface PageProps {
  params: { slug: string }
  searchParams: { success?: string; tab?: string }
}


async function getBasePrices() {
  const pricingRes = await supabaseAdmin.from('pricing').select('vehicle_type, price_usd')
  const prices = { sedan_suv: 120, suburban: 150, sprinter: 260, minibus: 450, coachbus: 800 }
  if (pricingRes.data) {
    for (const row of pricingRes.data) {
      if (row.vehicle_type in prices) {
        prices[row.vehicle_type as keyof typeof prices] = row.price_usd
      }
    }
  }
  return prices
}

/* ─── Feature cards data ─────────────────────────────────────────── */
const FEATURES = [
  {
    title: 'Airport Transfers & Shuttle Services',
    desc: 'From Miami International Airport to hotels, beaches, cruise ports, and private destinations, our transportation service helps you arrive safely and on time.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.5-3 3-1.5-.5c-.3-.1-.7 0-.9.2l-.5.5c-.2.3-.1.7.1.9l2.7 2 2 2.7c.2.3.6.3.9.1l.5-.5c.2-.2.3-.6.2-.9l-.5-1.5 3-3 3.5 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      </svg>
    ),
  },
  {
    title: 'Comfort',
    desc: 'Our vehicles are clean, well-maintained, and selected to give you a comfortable ride from pickup to dropoff.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M5 12.55a11 11 0 0 1 14.08 0m-11.3 2.78a7 7 0 0 1 8.52 0M12 19l.01 0M2 8.82a15 15 0 0 1 20 0" />
      </svg>
    ),
  },
  {
    title: 'Reliability',
    desc: 'We focus on punctual pickups, clear communication, and professional service for every reservation.',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
  {
    title: 'Transparent Pricing',
    desc: 'Enjoy competitive starting rates with clear quotes before you book. Final pricing may vary by pickup location, destination, vehicle type, time, and availability.',
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
  { stat: '37', label: 'Pickup Destinations' },
  { stat: '100+', label: 'Max Passengers' },
  { stat: '5', label: 'Vehicle Classes' },
  { stat: '7', label: 'Days a Week' },
]

export default async function HomePage({ searchParams }: { searchParams: { success?: string; tab?: string } }) {
  const headersList = headers()
  const host = headersList.get('host') || ''
  const xForwardedHost = headersList.get('x-forwarded-host') || ''
  const host = headersList.get('host') || ''
  const xForwardedHost = headersList.get('x-forwarded-host') || ''
  const isPruebas = host.includes('pruebas') || xForwardedHost.includes('pruebas')

  const prices = await getBasePrices()
  const startingPrices = prices // Same for main page without routes
  const showSuccess = searchParams.success === 'true'
  const activeTab = searchParams.tab || 'services'

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
          <a href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer" className="px-3.5 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95" style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}>WhatsApp Us</a>
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
              Our team will review your request and contact you shortly. Need immediate help?{' '}
              <a href="tel:+18889737896" className="font-semibold underline" style={{ color: '#EF9F27' }}>
                Call +1 (888) 973-7896
              </a>{' '}
              or{' '}
              <a href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer" className="font-semibold underline text-green-400">
                WhatsApp 954-623-6207
              </a>
            </p>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <HeroSection vehicleType="sedan_suv" basePrice={prices.sedan_suv} />

      {/* ── Map Booking Form (Only for pruebas.explyft.com) ─────── */}
      {isPruebas && (
        <MainMapBookingForm prices={prices} />
      )}

      {/* ── Official Partner Banner ──────────────────────────────── */}
      

      {/* ── Fixed Pricing Section ─────────────────────────────────────────── */}
      <section className="w-full py-16" style={{ background: '#0d0d0d', borderRadius: '1rem', border: '1px solid #252525' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                      Transparent Rates
                    </p>
                    <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Our Fleet Pricing
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
                    {/* Premium Ride */}
                    <div className="rounded-2xl p-8 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C08]" style={{ background: '#161616', border: '1px solid #252525' }}>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium Ride</h3>
                        <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Sedan & SUV</p>
                      </div>
                      <div className="my-6">
                        <span className="text-xs uppercase tracking-wider text-[#888888]">Starting at</span>
                        <p className="text-5xl font-bold mt-1" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>${startingPrices.sedan_suv}</p>
                      </div>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        data-vehicle-select="sedan_suv"
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 animate-pulse-subtle text-center"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >Contact Us</a>
                    </div>

                    {/* Premium SUV */}
                    <div className="rounded-2xl p-8 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C08]" style={{ background: '#161616', border: '1px solid #252525' }}>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium SUV</h3>
                        <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Chevy Suburban</p>
                      </div>
                      <div className="my-6">
                        <span className="text-xs uppercase tracking-wider text-[#888888]">Starting at</span>
                        <p className="text-5xl font-bold mt-1" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>${startingPrices.suburban}</p>
                      </div>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        data-vehicle-select="suburban"
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 text-center"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >Contact Us</a>
                    </div>

                    {/* Premium Sprinter */}
                    <div className="rounded-2xl p-8 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C08]" style={{ background: '#161616', border: '1px solid #252525' }}>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Premium Sprinter</h3>
                        <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Mercedes Sprinter</p>
                      </div>
                      <div className="my-6">
                        <span className="text-xs uppercase tracking-wider text-[#888888]">Starting at</span>
                        <p className="text-5xl font-bold mt-1" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>${startingPrices.sprinter}</p>
                      </div>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        data-vehicle-select="sprinter"
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 text-center"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >Contact Us</a>
                    </div>

                    {/* Group Transfers */}
                    <div className="rounded-2xl p-8 flex flex-col items-center justify-between text-center transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C08]" style={{ background: '#161616', border: '1px solid #252525' }}>
                      <div>
                        <h3 className="text-xl font-bold text-white mb-2">Group Transfers</h3>
                        <p className="text-xs uppercase tracking-widest text-[#888888] mb-4">Minibus & Coach Bus</p>
                      </div>
                      <div className="my-6">
                        <span className="text-xs uppercase tracking-wider text-[#888888]">Rate</span>
                        <p className="text-3xl font-bold mt-1 leading-tight" style={{ color: '#EF9F27', fontFamily: "'Playfair Display', Georgia, serif" }}>Custom<br/>Quote</p>
                      </div>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        data-vehicle-select="coachbus"
                        className="w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 text-center"
                        style={{ background: 'transparent', border: '1px solid #B8960C', color: '#B8960C' }}
                      >Contact Us</a>
                    </div>
                  </div>

                  <p className="text-center text-lg mt-8 max-w-2xl mx-auto leading-relaxed font-bold" style={{ color: '#D4AF37' }}>
                    Prices are starting rates. Final price depends on trip details, vehicle availability, pickup location, destination, and service time.
                  </p>
                </div>
              </section>

      {/* ── Reviews Marquee ──────────────────────────────────────────────── */}
      <ReviewsMarquee />

      {/* ── Fixed FAQ Section ────────────────────────────────────────────── */}
      <section className="w-full py-16" style={{ background: '#0d0d0d', borderRadius: '1rem', border: '1px solid #252525' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="text-center mb-16">
                    <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                      Questions & Answers
                    </p>
                    <h2 className="text-3xl md:text-5xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Frequently Asked Questions
                    </h2>
                  </div>

                  <div className="max-w-3xl mx-auto flex flex-col gap-4">
                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>How far in advance can I make a reservation?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        We recommend booking as early as possible, especially for airport transfers, cruise transfers, group transportation, and special events. Same-day availability may be limited.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>Can I make a reservation over the phone?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Yes. You can call us directly at <a href="tel:+18889737896" className="text-[#B8960C] font-semibold hover:underline">+1 (888) 973-7896</a> or message us on WhatsApp at <a href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer" className="text-green-500 font-semibold hover:underline">954-623-6207</a> to check availability, ask questions, or book your ride.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>When do I have to pay?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        A deposit may be required to secure certain reservations. Full payment terms will be provided with your quote or booking confirmation.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>What confirmation do I get for my reservation?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        After your reservation is confirmed, we will provide your trip details, including pickup date, pickup time, pickup location, destination, vehicle/service type, and contact information.
                      </div>
                    </details>

                    <details className="group mt-2 overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="w-full py-4 text-center cursor-pointer select-none font-bold text-sm uppercase tracking-wider text-[#B8960C] hover:text-[#D4AF37] transition-all border border-[#252525] rounded-xl bg-[#161616] list-none hover:border-[#B8960C]">
                        Show More Questions
                      </summary>
                      <div className="flex flex-col gap-4 mt-4">

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>What is my reservation or contract number?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        If your booking includes a contract or reservation number, it will appear on the confirmation we send you. Please keep it available if you contact us about your trip.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>Can I change my booking?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Yes. Contact us as soon as possible if you need to change your pickup time, pickup location, destination, passenger count, or vehicle type. Changes may affect the final price and availability.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>Can I cancel my booking?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Cancellation terms may vary depending on the type of service and timing of the cancellation. Please contact us as soon as possible so we can review your reservation and explain any applicable charges.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>How do I book group transportation?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Send us your trip date, pickup time, pickup location, destination, passenger count, luggage count, and any special requirements. We will review availability and provide a quote.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>What happens if my flight is delayed? Is there a wait time fee?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        We offer a complimentary 30-minute grace period for airport pickups. If your delay exceeds 30 minutes from the scheduled pickup time, a wait time fee of $20 per hour will apply.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>Where do I meet my driver at the airport?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Our standard pickup is Curbside, meaning the driver will meet you outside the arrivals terminal. We also offer a VIP Meet & Greet service where the driver meets you inside at baggage claim with a sign, available for an additional $25 fee.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>Do you provide car seats for children?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Yes, we provide up to 4 car seats free of charge. You must request them in advance when filling out your booking form to ensure availability.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>How much luggage can I bring?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        Sedans and Suburbans can comfortably accommodate up to 4 standard pieces of luggage. For larger groups, our Sprinter Vans, Minibuses, and Coach Buses can hold up to 20 pieces.
                      </div>
                    </details>

                    <details name="faq-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
                      <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base md:text-lg text-white hover:text-[#D4AF37] list-none">
                        <span>What forms of payment do you accept?</span>
                        <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0 ml-4" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                      </summary>
                      <div className="px-6 pb-6 text-sm md:text-base leading-relaxed text-[#AAAAAA] border-t border-[#1f1f1f] pt-4">
                        We accept major credit cards and other approved payment methods. Payment options will be confirmed when you book.
                      </div>
                    </details>

                      </div>
                    </details>

                  </div>
                </div>
              </section>


            {/* ── Explore Tabs Section ─────────────────────────────────── */}
      <section id="explore" className="w-full py-12 animate-fade-in scroll-mt-20 md:scroll-mt-24" style={{ borderTop: '1px solid #1a1a1a', background: '#111111' }}>
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="text-center mb-8">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-2" style={{ color: '#B8960C' }}>
              Discover More
            </p>
            <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
              Explore Express Lyft
            </h2>
          </div>

          <style dangerouslySetInnerHTML={{ __html: `
            .no-scrollbar::-webkit-scrollbar {
              display: none;
            }
            .no-scrollbar {
              -ms-overflow-style: none;
              scrollbar-width: none;
            }
          `}} />

          {/* Tab selector */}
          <div className="hidden md:flex overflow-x-auto pb-4 mb-10 gap-3 no-scrollbar scroll-smooth w-full md:w-max md:mx-auto px-4 md:px-0">
            {[
              
              { id: 'services', label: 'Our Services', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
              ) },
              { id: 'fleet', label: 'Our Fleet', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
              ) },
              { id: 'why', label: 'Why Choose Us', icon: (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
              ) },
              ].map((tab) => {
              const isActive = activeTab === tab.id
              return (
                <Link
                  key={tab.id}
                  href={`?tab=${tab.id}#explore`}
                  scroll={false}
                  className="flex items-center gap-2 px-5 py-3.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap border active:scale-95 shrink-0"
                  style={{
                    background: isActive ? 'linear-gradient(135deg, #B8960C, #D4AF37)' : '#161616',
                    borderColor: isActive ? '#B8960C' : '#2a2a2a',
                    color: isActive ? '#0a0a0a' : '#888888',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                </Link>
              )
            })}
          </div>

          
          {/* Mobile Accordion */}
          <div className="flex flex-col gap-4 md:hidden px-4">
            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                  Our Services
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                <section className="w-full py-16" style={{ background: '#161616', borderRadius: '1rem', border: '1px solid #252525' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                      What We Do
                    </p>
                    <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Our Services
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Hotel Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Hotel Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        We provide private transfers from Miami International Airport to hotels and resorts throughout Miami and South Florida. Starting rates are available by quote.
                      </p>
                    </div>

                    {/* Airport Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Airport Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        We provide airport transportation to and from Miami International Airport and Orlando-area airports, available 7 days a week.
                      </p>
                    </div>

                    {/* Corporate Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Corporate Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Professional transportation for business travel, private meetings, events, and group transportation throughout South Florida.
                      </p>
                    </div>

                    {/* Beach & Downtown Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Beach & Downtown Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Private transportation to Miami Beach, downtown Miami, hotels, restaurants, events, and popular South Florida destinations.
                      </p>
                    </div>

                    {/* Minibus Hire */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Minibus Hire</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Group transportation available for airports, cruises, private events, corporate events, and special occasions.
                      </p>
                    </div>

                    {/* Wedding Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Wedding Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        If you are looking for elegant transportation for your wedding day, we can help arrange private vehicles and group transportation for your guests.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
              </div>
            </details>

            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="22" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                  Our Fleet
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                <ImageGallery />
              </div>
            </details>

            <details name="explore-accordion" className="group rounded-2xl border border-[#252525] bg-[#161616] overflow-hidden transition-all duration-300 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex items-center justify-between p-6 cursor-pointer select-none font-bold text-base text-white hover:text-[#D4AF37] list-none">
                <div className="flex items-center gap-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                  Why Choose Us
                </div>
                <svg className="w-5 h-5 stroke-[#B8960C] transition-transform duration-300 group-open:rotate-180 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>
              </summary>
              <div className="px-4 pb-6 border-t border-[#1f1f1f] pt-4">
                <div className="flex flex-col gap-12">
                <section className="w-full py-16" style={{ background: '#161616', borderRadius: '1rem', border: '1px solid #252525' }}>
                  <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                      <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                        Our Promise
                      </p>
                      <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Why Choose Express Lyft
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {FEATURES.map((f) => (
                        <div
                          key={f.title}
                          className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C10]"
                          style={{ background: '#0d0d0d', border: '1px solid #252525' }}
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

                {/* Stats section */}
                <section className="w-full py-16" style={{ background: '#0d0d0d', borderRadius: '1rem', border: '1px solid #252525' }}>
                  <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                    <div className="flex flex-col gap-5">
                      <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#B8960C' }}>
                        By the Numbers
                      </p>
                      <h2 className="text-2xl md:text-4xl font-bold leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Florida&apos;s most trusted luxury transfer service.
                      </h2>
                      <p className="text-base leading-relaxed" style={{ color: '#888888' }}>
                        From the airport to the cruise terminal, we move Florida&apos;s most discerning travelers with precision and care.
                      </p>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        className="inline-flex w-fit px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >
                        Book Now →
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {STATS.map((s) => (
                        <div
                          key={s.label}
                          className="rounded-2xl p-6 text-center flex flex-col gap-1 transition-all hover:border-[#B8960C]"
                          style={{ background: '#161616', border: '1px solid #252525' }}
                        >
                          <p className="text-4xl md:text-5xl font-bold" style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}>
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

                <Testimonials />
              </div>
              </div>
            </details>
          </div>


          {/* Tab content */}
          <div className="transition-all duration-300 hidden md:block">
            

            {activeTab === 'fleet' && (
              <ImageGallery />
            )}

            {activeTab === 'services' && (
              <section className="w-full py-16" style={{ background: '#161616', borderRadius: '1rem', border: '1px solid #252525' }}>
                <div className="max-w-7xl mx-auto px-4 md:px-6">
                  <div className="text-center mb-12">
                    <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                      What We Do
                    </p>
                    <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                      Our Services
                    </h2>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Hotel Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Hotel Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        We provide private transfers from Miami International Airport to hotels and resorts throughout Miami and South Florida. Starting rates are available by quote.
                      </p>
                    </div>

                    {/* Airport Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Airport Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        We provide airport transportation to and from Miami International Airport and Orlando-area airports, available 7 days a week.
                      </p>
                    </div>

                    {/* Corporate Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Corporate Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Professional transportation for business travel, private meetings, events, and group transportation throughout South Florida.
                      </p>
                    </div>

                    {/* Beach & Downtown Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Beach & Downtown Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Private transportation to Miami Beach, downtown Miami, hotels, restaurants, events, and popular South Florida destinations.
                      </p>
                    </div>

                    {/* Minibus Hire */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Minibus Hire</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        Group transportation available for airports, cruises, private events, corporate events, and special occasions.
                      </p>
                    </div>

                    {/* Wedding Transfers */}
                    <div className="rounded-2xl p-6 transition-all duration-300 hover:border-[#B8960C] hover:shadow-lg" style={{ background: '#0d0d0d', border: '1px solid #252525' }}>
                      <h3 className="text-lg font-bold text-white mb-2">Wedding Transfers</h3>
                      <p className="text-sm leading-relaxed" style={{ color: '#888888' }}>
                        If you are looking for elegant transportation for your wedding day, we can help arrange private vehicles and group transportation for your guests.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            )}

            {activeTab === 'why' && (
              <div className="flex flex-col gap-12">
                <section className="w-full py-16" style={{ background: '#161616', borderRadius: '1rem', border: '1px solid #252525' }}>
                  <div className="max-w-7xl mx-auto px-4 md:px-6">
                    <div className="text-center mb-12">
                      <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
                        Our Promise
                      </p>
                      <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Why Choose Express Lyft
                      </h2>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                      {FEATURES.map((f) => (
                        <div
                          key={f.title}
                          className="rounded-2xl p-6 flex flex-col gap-4 transition-all duration-300 hover:border-[#B8960C] hover:-translate-y-1 hover:shadow-lg hover:shadow-[#B8960C10]"
                          style={{ background: '#0d0d0d', border: '1px solid #252525' }}
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

                {/* Stats section */}
                <section className="w-full py-16" style={{ background: '#0d0d0d', borderRadius: '1rem', border: '1px solid #252525' }}>
                  <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-20 items-center">
                    <div className="flex flex-col gap-5">
                      <p className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#B8960C' }}>
                        By the Numbers
                      </p>
                      <h2 className="text-2xl md:text-4xl font-bold leading-snug" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>
                        Florida&apos;s most trusted luxury transfer service.
                      </h2>
                      <p className="text-base leading-relaxed" style={{ color: '#888888' }}>
                        From the airport to the cruise terminal, we move Florida&apos;s most discerning travelers with precision and care.
                      </p>
                      <a
                        href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
                        className="inline-flex w-fit px-6 py-3.5 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
                      >
                        Book Now →
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      {STATS.map((s) => (
                        <div
                          key={s.label}
                          className="rounded-2xl p-6 text-center flex flex-col gap-1 transition-all hover:border-[#B8960C]"
                          style={{ background: '#161616', border: '1px solid #252525' }}
                        >
                          <p className="text-4xl md:text-5xl font-bold" style={{ color: '#B8960C', fontFamily: "'Playfair Display', Georgia, serif" }}>
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

                <Testimonials />
              </div>
            )}

            
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
              href="https://wa.me/19546236207" target="_blank" rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-[#B8960C30]"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Reserve Online
            </a>
            <a
              href="tel:+18889737896"
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:border-[#B8960C] hover:text-[#B8960C] text-center"
              style={{ border: '1px solid #333333', color: '#FFFFFF' }}
            >
              Call +1 (888) 973-7896
            </a>
            <a
              href="https://wa.me/19546236207"
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:border-green-500 hover:text-green-500 text-center flex items-center justify-center gap-2"
              style={{ border: '1px solid #333333', color: '#FFFFFF' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
              WhatsApp Us
            </a>
          </div>
        </div>
      </section>

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
