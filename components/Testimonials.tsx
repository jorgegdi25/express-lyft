'use client'

import { useState } from 'react'

export interface Testimonial {
  name: string
  role: string
  rating: number
  text: string
  date: string
  avatarText: string
}

export default function Testimonials({ reviews }: { reviews?: Testimonial[] }) {
  const [startIndex, setStartIndex] = useState(0)
  const items = reviews || []

  // No fabricated placeholder testimonials — this section stays hidden
  // until there are real, approved reviews to show.
  if (items.length === 0) return null

  const handlePrev = () => {
    setStartIndex((prev) => (prev === 0 ? items.length - 1 : prev - 1))
  }

  const handleNext = () => {
    setStartIndex((prev) => (prev === items.length - 1 ? 0 : prev + 1))
  }

  // Get current visible testimonials (up to 3, looping around)
  const getVisibleTestimonials = () => {
    const visible = []
    for (let i = 0; i < 3; i++) {
      visible.push(items[(startIndex + i) % items.length])
    }
    return visible
  }

  const visibleItems = getVisibleTestimonials()

  return (
    <section className="w-full py-24" style={{ borderTop: '1px solid #1a1a1a', background: '#0d0d0d' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row items-center md:items-end justify-between mb-16">
          <div className="text-center md:text-left mb-6 md:mb-0">
            <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
              Testimonials
            </p>
            <h2
              className="text-3xl md:text-5xl font-bold"
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            >
              What Our Clients Say
            </h2>
          </div>
          
          {/* Custom Slider Navigation */}
          <div className="flex gap-3">
            <button
              onClick={handlePrev}
              className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-white hover:border-[#B8960C] hover:text-[#B8960C] transition-all bg-neutral-900/50"
              aria-label="Previous reviews"
            >
              ❮
            </button>
            <button
              onClick={handleNext}
              className="w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-white hover:border-[#B8960C] hover:text-[#B8960C] transition-all bg-neutral-900/50"
              aria-label="Next reviews"
            >
              ❯
            </button>
          </div>
        </div>

        {/* Carousel / Grid container */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 transition-all duration-500">
          {visibleItems.map((t, idx) => (
            <div
              key={t.name + idx}
              className={`rounded-2xl p-8 flex flex-col justify-between transition-all duration-500 hover:-translate-y-1 hover:border-[#B8960C] hover:shadow-lg hover:shadow-[#B8960C08] ${
                // hide the third card on tablets/medium screens
                idx === 2 ? 'hidden lg:flex' : ''
              } ${
                // hide the second card on mobile screens
                idx === 1 ? 'hidden md:flex' : ''
              }`}
              style={{
                background: '#161616',
                border: '1px solid #252525',
                minHeight: '260px'
              }}
            >
              {/* Review Text */}
              <div>
                {/* Stars */}
                <div className="flex gap-1 mb-4">
                  {[...Array(t.rating)].map((_, i) => (
                    <span key={i} className="text-sm" style={{ color: '#D4AF37' }}>★</span>
                  ))}
                </div>
                <p className="text-base italic leading-relaxed mb-6" style={{ color: '#CCCCCC' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-4 pt-4" style={{ borderTop: '1px solid #222222' }}>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, #B8960C, #D4AF37)',
                    color: '#0a0a0a',
                  }}
                >
                  {t.avatarText}
                </div>
                <div>
                  <h4 className="font-bold text-sm text-white">{t.name}</h4>
                  <p className="text-xs" style={{ color: '#777777' }}>{t.role}</p>
                </div>
                <span className="ml-auto text-xs font-semibold uppercase tracking-wider" style={{ color: '#444444' }}>
                  {t.date}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Carousel indicators/dots */}
        <div className="flex justify-center gap-2 mt-10">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => setStartIndex(index)}
              className="w-2.5 h-2.5 rounded-full transition-all"
              style={{
                background: index === startIndex ? '#B8960C' : '#2a2a2a',
                cursor: 'pointer',
              }}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
        
      </div>
    </section>
  )
}
