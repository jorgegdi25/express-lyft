'use client'

interface HeroSectionProps {
  hotelName: string
  vehicleType: 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'
  basePrice: number
}

const vehicleLabels: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus'
}

export default function HeroSection({ hotelName, vehicleType, basePrice }: HeroSectionProps) {
  return (
    <section className="relative w-full min-h-[60vh] md:min-h-[calc(100vh-88px)] flex items-center py-12 md:py-0">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center w-full">
        {/* Left column */}
        <div className="flex flex-col gap-5 md:gap-6">
          <span
            className="text-[10px] md:text-xs font-bold tracking-[3px] uppercase"
            style={{ color: '#D4AF37' }}
          >
            Welcome, {hotelName} Guests
          </span>

          <h1
            className="text-3xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}
          >
            Seamless luxury transportation at your fingertips.
          </h1>

          <p className="text-sm md:text-base" style={{ color: '#999999' }}>
            Book your ride. Use the form below to receive your luxury transportation or call us
            directly.
          </p>

          <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-2 md:mt-4">
            <a
              href="#booking-form"
              className="px-6 md:px-8 py-3.5 md:py-4 rounded-xl text-[10px] md:text-xs font-bold uppercase tracking-widest transition-all hover:brightness-110 active:scale-95 shadow-xl shadow-[#B8960C30]"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Start Reservation
            </a>
            
            <div className="flex flex-col">
              <span className="text-[10px] uppercase tracking-[2px]" style={{ color: '#666666' }}>
                Or Call Us
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

          <p className="text-[10px] uppercase tracking-[2px]" style={{ color: '#666666' }}>
            Available 8:00 AM — 10:00 PM
          </p>
        </div>

        {/* Right column — vehicle image + badge */}
        <div className="relative flex items-center justify-center">
          <div className="relative w-full rounded-xl bg-[#1a1a1a] overflow-hidden" style={{ aspectRatio: '16/9' }}>
            <img
              src={`/vehicles/${vehicleType}.png`}
              alt={vehicleLabels[vehicleType]}
              className="w-full h-full object-cover shadow-2xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.src =
                  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'
              }}
            />
            {/* Badge */}
            <div
              className="absolute bottom-3 left-3 md:bottom-4 md:left-4 px-3 md:px-4 py-2 rounded-lg"
              style={{ background: 'rgba(17,17,17,0.9)', border: '1px solid #B8960C' }}
            >
              <p className="text-xs md:text-sm font-bold uppercase tracking-widest" style={{ color: '#B8960C' }}>
                {vehicleLabels[vehicleType]}
              </p>
              <p className="text-[10px] md:text-xs" style={{ color: '#FFFFFF' }}>
                Estimated rates from ${basePrice}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll indicator — hidden on mobile */}
      <div className="hidden md:flex absolute bottom-8 left-1/2 -translate-x-1/2 flex-col items-center gap-2 animate-bounce-subtle">
        <span className="text-[9px] uppercase tracking-[3px]" style={{ color: '#666666' }}>
          Scroll
        </span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2">
          <path d="M12 5v14m-7-7l7 7 7-7"/>
        </svg>
      </div>
    </section>
  )
}
