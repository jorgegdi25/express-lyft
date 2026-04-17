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
    <section className="w-full py-16 md:py-24">
      <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <span
            className="text-xs font-bold tracking-[3px] uppercase"
            style={{ color: '#B8960C' }}
          >
            Welcome, {hotelName} Guests
          </span>

          <h1
            className="text-4xl md:text-5xl font-bold leading-tight"
            style={{ fontFamily: 'Georgia, serif', color: '#FFFFFF' }}
          >
            Seamless luxury transportation at your fingertips.
          </h1>

          <p className="text-base" style={{ color: '#555555' }}>
            Book your ride. Use the form below to receive your luxury transportation or call us
            directly.
          </p>

          <a
            href="tel:3053679944"
            className="text-3xl font-bold tracking-wide"
            style={{ color: '#EF9F27' }}
          >
            305-367-9944
          </a>

          <p className="text-sm uppercase tracking-[2px]" style={{ color: '#555555' }}>
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
                // Fallback placeholder if image missing
                const target = e.target as HTMLImageElement
                target.src =
                  'https://images.unsplash.com/photo-1563720223185-11003d516935?w=800&q=80'
              }}
            />
            {/* Badge */}
            <div
              className="absolute bottom-4 left-4 px-4 py-2 rounded-lg"
              style={{ background: 'rgba(17,17,17,0.85)', border: '1px solid #B8960C' }}
            >
              <p className="text-sm font-bold uppercase tracking-widest" style={{ color: '#B8960C' }}>
                {vehicleLabels[vehicleType]}
              </p>
              <p className="text-xs" style={{ color: '#FFFFFF' }}>
                Rates from ${basePrice}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
