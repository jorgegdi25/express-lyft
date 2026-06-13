'use client'
import { useState, useEffect } from 'react'

interface HeroSectionProps {
  vehicleType: 'sedan_suv' | 'suburban' | 'sprinter' | 'minibus' | 'coachbus'
  basePrice: number
  hotelSlug?: string
}

const vehicleLabels: Record<string, string> = {
  sedan_suv: 'Sedan & SUV',
  suburban: 'Chevy Suburban',
  sprinter: 'Mercedes-Benz Sprinter',
  minibus: '31 Passenger Mini Bus',
  coachbus: '55 Passenger Bus',
}

export default function HeroSection({ vehicleType, basePrice, hotelSlug }: HeroSectionProps) {
  const [livePrice, setLivePrice] = useState(basePrice)

  useEffect(() => {
    if (!hotelSlug) return
    async function fetchPrice() {
      try {
        const res = await fetch(`/api/public/prices?hotel_slug=${encodeURIComponent(hotelSlug!)}`, {
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (data.prices && data.prices[vehicleType]) {
            setLivePrice(data.prices[vehicleType])
          }
        }
      } catch {}
    }
    fetchPrice()
  }, [hotelSlug, vehicleType])
  return (
    <section className="relative w-full min-h-[85vh] md:min-h-screen flex items-center justify-center py-20 md:py-0 overflow-hidden">
      {/* ── Background Video ─────────────────────────────────────── */}
      <div className="absolute inset-0 w-full h-full z-0">
        <video
          src="/hero-video-final3.mp4"
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        />
        {/* Dark overlay to ensure text is legible */}
        <div className="absolute inset-0 bg-black/60 z-10" />
      </div>

      {/* ── Content ─────────────────────────────────────── */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 md:px-6 flex flex-col items-center text-center w-full">
        <div className="flex flex-col gap-6 md:gap-8 items-center max-w-4xl">

          {/* Overline tag */}
          <span
            className="text-sm font-bold tracking-[4px] uppercase"
            style={{ color: '#D4AF37', textShadow: '0 2px 4px rgba(0,0,0,0.8)' }}
          >
            WELCOME GUESTS
          </span>

          {/* H1 */}
          <h1
            className="text-4xl md:text-5xl lg:text-7xl font-bold leading-[1.15]"
            style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF', textShadow: '0 4px 12px rgba(0,0,0,0.6)' }}
          >
            Exclusive private transportation South Florida
          </h1>

          {/* Subtext */}
          <p 
            className="text-base md:text-xl leading-relaxed max-w-3xl text-gray-200 font-medium" 
            style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}
          >
            Book airport transfers, cruise port rides, hotel transportation, beach transfers, corporate travel, and private shuttle service with professional drivers and clear starting prices.
          </p>

          {/* CTA row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-4 w-full">
            <a
              href="#booking-form"
              className="px-10 py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-95 shadow-2xl text-center w-full sm:w-auto"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              Book Now
            </a>
          </div>

        </div>
      </div>

      {/* Scroll indicator */}
      <div className="hidden md:flex absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
        <div className="flex flex-col items-center gap-2 animate-bounce">
          <span className="text-xs font-bold uppercase tracking-[3px]" style={{ color: '#FFFFFF', textShadow: '0 2px 8px rgba(0,0,0,0.9)' }}>
            Scroll
          </span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2.5" style={{ filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.9))' }}>
            <path d="M12 5v14m-7-7l7 7 7-7" />
          </svg>
        </div>
      </div>
    </section>
  )
}
