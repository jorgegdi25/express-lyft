import Image from 'next/image'
import { supabaseAdmin } from '@/lib/supabase'
import StayChat from '@/components/stay/StayChat'
import ReviewsMarquee from '@/components/ReviewsMarquee'
import { getApprovedReviews, toMarqueeReviews } from '@/lib/reviews'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const fetchCache = 'force-no-store'

export const metadata = {
  title: 'Express Lyft Stay — Hotel Tonight with Airport Transportation Included',
  description: 'Need a hotel tonight near Fort Lauderdale Airport? One price covers your room and the ride from FLL. Book in minutes.',
}

export interface StayHotel {
  id: string
  name: string
  photo_url: string | null
  price: number
  rooms_available: number
  sort_order: number
}

async function getStayHotels(): Promise<StayHotel[]> {
  const { data } = await supabaseAdmin
    .from('stay_hotels')
    .select('id, name, photo_url, price, rooms_available, sort_order')
    .eq('active', true)
    .gt('rooms_available', 0)
    .order('sort_order', { ascending: true })

  return data || []
}

const FEATURES = [
  {
    title: 'One All-In Price',
    desc: 'The price you see is the price you pay — airport transportation is already included, never an extra line item.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v12M9 9.5a2.5 2.5 0 0 1 3-2.5c1.5 0 2.5.8 2.5 2s-1 1.8-2.5 2c-1.5.2-2.5 1-2.5 2s1 2.2 2.5 2.2A2.5 2.5 0 0 0 15 14.5" />
      </svg>
    ),
  },
  {
    title: 'FLL Airport Pickup',
    desc: 'A private SUV takes you straight from Fort Lauderdale Airport to your hotel — no rideshare app, no waiting curbside.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.5-3 3-1.5-.5c-.3-.1-.7 0-.9.2l-.5.5c-.2.3-.1.7.1.9l2.7 2 2 2.7c.2.3.6.3.9.1l.5-.5c.2-.2.3-.6.2-.9l-.5-1.5 3-3 3.5 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      </svg>
    ),
  },
  {
    title: 'Instant Confirmation',
    desc: 'Book and pay securely online in a couple of minutes. Your room and ride are confirmed immediately — no phone tag.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
]

export default async function StayPage() {
  const hotels = await getStayHotels()
  // Site-wide (no hotelSlug filter) — Stay is brand new, so it borrows trust
  // from any approved Express Lyft review rather than waiting on reviews
  // scoped to this exact product.
  const approvedReviews = await getApprovedReviews()
  const marqueeReviews = toMarqueeReviews(approvedReviews)

  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* ── Header — same as the hotel pages, so Stay doesn't feel like a
          separate, unbranded site (logo + concierge line + WhatsApp) ──── */}
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
            href="#book"
            className="px-3.5 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Book a Room
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center py-24 overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <Image src="/gallery/miami.webp" alt="" fill priority className="object-cover" />
          <div className="absolute inset-0 bg-black/70 z-10" />
        </div>

        <div className="relative z-20 max-w-3xl mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-6">
          <span className="text-sm font-bold tracking-[4px] uppercase" style={{ color: '#D4AF37', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            FLIGHT CANCELLED OR DELAYED?
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.15]" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF', textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
            Hotel Tonight — Airport Transportation Included
          </h1>
          <p className="text-base md:text-xl leading-relaxed text-gray-200 font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            One price covers your room and the private ride from Fort Lauderdale Airport. Book in minutes, pay securely, done.
          </p>
          <a
            href="#book"
            className="px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-2xl mt-2"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Book a Room
          </a>
        </div>
      </section>

      {/* ── Trust strip ──────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-8">
        {FEATURES.map(f => (
          <div key={f.title} className="flex flex-col items-center text-center gap-3">
            <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: 'rgba(184,150,12,0.1)', border: '1px solid rgba(184,150,12,0.3)' }}>
              {f.icon}
            </div>
            <h3 className="text-white font-bold" style={{ fontFamily: 'Georgia, serif' }}>{f.title}</h3>
            <p className="text-sm text-[#999] leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>

      {/* ── Social proof ─────────────────────────────────────── */}
      <ReviewsMarquee reviews={marqueeReviews} />

      {/* ── Booking ──────────────────────────────────────────── */}
      <section id="book" className="max-w-5xl mx-auto px-4 md:px-6 pb-24 scroll-mt-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}>Reserve Your Room</h2>
          <p className="text-sm text-[#888]">Pick a hotel below — transportation from FLL is already included in the price.</p>
        </div>
        <div className="rounded-2xl p-4 md:p-6" style={{ background: '#111111', border: '1px solid #1a1a1a', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
          <StayChat hotels={hotels} />
        </div>
      </section>
    </main>
  )
}
