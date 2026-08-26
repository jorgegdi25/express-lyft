import Image from 'next/image'
import JetskiBookingWidget from '@/components/jetski/JetskiBookingWidget'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Jet Ski Rentals — Book Online | Express Lyft',
  description: 'Hourly jet ski rentals in Miami. Pick a time slot, add hotel transportation, and reserve online in minutes.',
}

const HERO_IMAGE_URL =
  'https://images.unsplash.com/photo-1554132267-d06483b00adc?auto=format&fit=crop&w=1800&q=80'

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM']

const MEETING_ADDRESS = '919 N Birch Rd, Fort Lauderdale, FL 33304'
const MEETING_ADDRESS_MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(MEETING_ADDRESS)}`

// TODO: replace with the real jet ski business phone/WhatsApp number once
// the client provides one — this currently reuses the main Express Lyft line.
const WHATSAPP_NUMBER = '19546236207'
const PHONE_DISPLAY = '954-623-6207'

const FEATURES = [
  {
    title: 'Hourly Time Slots',
    desc: `Pick any hour between 10 AM and 4 PM. Each slot fits up to 4 jet skis — book online or call us to check a busy hour.`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 6v6l4 2" />
      </svg>
    ),
  },
  {
    title: 'Optional Hotel Transportation',
    desc: 'Add a one-way ride ($10) or a round trip ($20) between your hotel and the marina — no rental car needed.',
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M17.8 19.2L16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.4-.1.9.3 1.1l5.5 3.5-3 3-1.5-.5c-.3-.1-.7 0-.9.2l-.5.5c-.2.3-.1.7.1.9l2.7 2 2 2.7c.2.3.6.3.9.1l.5-.5c.2-.2.3-.6.2-.9l-.5-1.5 3-3 3.5 5.5c.2.4.7.5 1.1.3l.5-.3c.4-.2.6-.6.5-1.1z" />
      </svg>
    ),
  },
  {
    title: 'Boater Safety Course (if applicable)',
    desc: `Florida law requires drivers born on or after Jan 1, 1988 to pass a short boater safety test first. It's $13.95, paid directly on the course provider's site — not part of your rental payment.`,
    icon: (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="1.5">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
  },
]

export default function JetskiPage({ searchParams }: { searchParams: { success?: string } }) {
  const showSuccess = searchParams.success === 'true'
  return (
    <main className="min-h-screen" style={{ background: '#0a0a0a' }}>
      {/* ── Header ───────────────────────────────────────────── */}
      <header
        className="w-full px-4 md:px-8 py-4 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md"
        style={{ background: 'rgba(10,10,10,0.88)', borderBottom: '1px solid #1a1a1a' }}
      >
        <a href="/">
          <Image src="/logo.webp" alt="Express Lyft" width={180} height={48} className="h-9 md:h-11 w-auto object-contain" />
        </a>

        <div className="flex items-center gap-3">
          <a
            href="tel:+19546236207"
            className="hidden sm:block text-sm font-semibold hover:text-[#D4AF37] transition-colors"
            style={{ color: '#ccc' }}
          >
            {PHONE_DISPLAY}
          </a>
          <a
            href={`https://wa.me/${WHATSAPP_NUMBER}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            WhatsApp Us
          </a>
        </div>
      </header>

      {/* ── Hero ─────────────────────────────────────────────── */}
      <section className="relative w-full min-h-[70vh] flex items-center justify-center py-24 overflow-hidden">
        <div className="absolute inset-0 w-full h-full z-0">
          <Image src={HERO_IMAGE_URL} alt="Jet ski rider on the water" fill priority unoptimized className="object-cover" />
          <div className="absolute inset-0 bg-black/70 z-10" />
        </div>

        <div className="relative z-20 max-w-3xl mx-auto px-4 md:px-6 flex flex-col items-center text-center gap-6">
          <span className="text-sm font-bold tracking-[4px] uppercase" style={{ color: '#D4AF37', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}>
            MIAMI WATERSPORTS
          </span>
          <h1 className="text-4xl md:text-6xl font-bold leading-[1.15]" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF', textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}>
            Jet Ski Rentals — Book Your Ride in Minutes
          </h1>
          <p className="text-base md:text-xl leading-relaxed text-gray-200 font-medium" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
            Pick an hourly time slot, add hotel transportation if you need it, and reserve online — no waiting at the marina.
          </p>
          <a
            href="#book"
            className="px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-2xl mt-2"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Check Availability
          </a>
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────── */}
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

      {/* ── Schedule strip ───────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-2xl p-6 md:p-8 text-center" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <h2 className="text-xl md:text-2xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}>
            Today&apos;s Time Slots
          </h2>
          <p className="text-sm text-[#888] mb-6">Each slot fits up to 4 jet skis. Larger groups or a fully booked hour? Call us and we&apos;ll check availability directly.</p>
          <div className="flex flex-wrap justify-center gap-3">
            {TIME_SLOTS.map(slot => (
              <span
                key={slot}
                className="px-4 py-2 rounded-full text-sm font-semibold"
                style={{ background: 'rgba(184,150,12,0.08)', border: '1px solid rgba(184,150,12,0.3)', color: '#D4AF37' }}
              >
                {slot}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Meeting location ─────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-4 md:px-6 pb-16">
        <div className="rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-4" style={{ background: '#111111', border: '1px solid #1a1a1a' }}>
          <div className="text-center md:text-left">
            <h2 className="text-xl md:text-2xl font-bold mb-1" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}>
              Where to Meet Us
            </h2>
            <p className="text-sm text-[#888]">Head to this address and wait there for your time slot:</p>
            <p className="text-base font-semibold mt-1" style={{ color: '#D4AF37' }}>{MEETING_ADDRESS}</p>
          </div>
          <a
            href={MEETING_ADDRESS_MAPS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110"
            style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
          >
            Get Directions
          </a>
        </div>
      </section>

      {/* ── Booking ──────────────────────────────────────────── */}
      <section id="book" className="max-w-5xl mx-auto px-4 md:px-6 pb-24 scroll-mt-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}>Reserve Your Jet Ski</h2>
          <p className="text-sm text-[#888]">Pick a date, time, and whether you need a ride — we&apos;ll confirm the rest with you directly.</p>
        </div>
        <div className="rounded-2xl p-4 md:p-6" style={{ background: '#111111', border: '1px solid #1a1a1a', boxShadow: '0 24px 60px rgba(0,0,0,0.4)' }}>
          {showSuccess ? (
            <div className="text-center py-12 px-4">
              <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: 'rgba(184,150,12,0.15)', border: '1px solid rgba(184,150,12,0.4)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-white mb-2" style={{ fontFamily: "'Playfair Display', Georgia, serif" }}>You&apos;re Booked!</h3>
              <p className="text-sm text-[#999] max-w-md mx-auto">
                A confirmation email is on its way. See you at {MEETING_ADDRESS} for your time slot.
              </p>
            </div>
          ) : (
            <JetskiBookingWidget timeSlots={TIME_SLOTS} meetingAddress={MEETING_ADDRESS} />
          )}
        </div>
      </section>
    </main>
  )
}
