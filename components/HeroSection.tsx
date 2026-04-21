'use client'
import Image from 'next/image'

interface HeroSectionProps {

  vehicleType: 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'
  basePrice: number
}

const vehicleLabels: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus',
}

export default function HeroSection({ vehicleType, basePrice }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[70vh] md:min-h-[calc(100vh-80px)] flex items-center py-16 md:py-0">
      <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center w-full">

        {/* ── Left column ─────────────────────────────────────── */}
        <div className="flex flex-col gap-5 md:gap-7">

          {/* Overline tag */}
          <span
            className="text-xs font-bold tracking-[3px] uppercase"
            style={{ color: '#D4AF37' }}
          >
            WELCOME GUESTS
          </span>

          {/* H1 */}
          <h1
            className="text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}
          >
            Seamless luxury transportation at your fingertips.
          </h1>

          {/* Subtext */}
          <p className="text-base md:text-lg leading-relaxed" style={{ color: '#AAAAAA' }}>
            Book your private transfer directly from the hotel.
          </p>

          {/* CTA row */}
          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2">
            <a
              href="#booking-form"
              className="px-7 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-[#B8960C30]"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Start Reservation
            </a>

            <div className="flex flex-col gap-0.5">
              <span className="text-xs uppercase tracking-[2px]" style={{ color: '#888888' }}>
                Or call us directly
              </span>
              <a
                href="tel:3053679944"
                className="text-xl md:text-2xl font-bold tracking-wide hover:text-[#B8960C] transition-colors"
                style={{ color: '#FFFFFF' }}
              >
                305-367-9944
              </a>
            </div>
          </div>

          {/* Hours badge */}
          <div
            className="inline-flex items-center gap-2 w-fit px-4 py-2.5 rounded-lg"
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="text-sm font-medium" style={{ color: '#CCCCCC' }}>
              Available daily 8:00 AM — 10:00 PM
            </span>
          </div>
        </div>

        {/* ── Right column — vehicle image ─────────────────────── */}
        <div className="relative flex items-center justify-center">
          <div
            className="relative w-full rounded-2xl overflow-hidden"
            style={{ aspectRatio: '16/10', background: '#1a1a1a' }}
          >
            <Image
              src={`/vehicles/${vehicleType}.png`}
              alt={vehicleLabels[vehicleType]}
              fill
              className="object-cover"
              priority
            />

            {/* Price badge */}
            <div
              className="absolute bottom-4 left-4 px-4 py-3 rounded-xl"
              style={{
                background: 'rgba(14,14,14,0.92)',
                border: '1px solid rgba(184,150,12,0.6)',
                backdropFilter: 'blur(8px)',
              }}
            >
              <p className="text-xs font-bold uppercase tracking-widest mb-0.5" style={{ color: '#B8960C' }}>
                {vehicleLabels[vehicleType]}
              </p>
              <p className="text-sm font-semibold" style={{ color: '#FFFFFF' }}>
                Rates from{' '}
                <span style={{ color: '#EF9F27' }}>${basePrice}</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-bounce-subtle">
        <span className="text-xs uppercase tracking-[3px]" style={{ color: '#555555' }}>
          Scroll
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2">
          <path d="M12 5v14m-7-7l7 7 7-7" />
        </svg>
      </div>
    </section>
  )
}
