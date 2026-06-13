'use client'

import { useState } from 'react'
import Image from 'next/image'

interface GalleryItem {
  src: string
  alt: string
  category: 'sedan_suv' | 'van_coach' | 'experience'
  title: string
  subtitle: string
}

const GALLERY_ITEMS: GalleryItem[] = [
  // Sedans & SUVs
  { src: '/gallery/sedan1.webp', alt: 'Premium Sedan Front View', category: 'sedan_suv', title: 'Luxury Sedan', subtitle: 'Executive Comfort' },
  { src: '/gallery/sedan2.webp', alt: 'Premium Sedan Side View', category: 'sedan_suv', title: 'Sleek Sedan', subtitle: 'Smooth Airport Transfer' },
  { src: '/gallery/sedan3.webp', alt: 'Premium Sedan Profile', category: 'sedan_suv', title: 'Executive Sedan', subtitle: 'First-Class Experience' },
  { src: '/gallery/sedan4.webp', alt: 'Premium Sedan Rear', category: 'sedan_suv', title: 'Chauffeur Sedan', subtitle: 'Comfort & Style' },
  { src: '/gallery/suburban.webp', alt: 'Chevy Suburban Front', category: 'sedan_suv', title: 'Chevrolet Suburban', subtitle: 'Spacious Luxury SUV' },
  { src: '/gallery/suburban2.webp', alt: 'Chevy Suburban Side', category: 'sedan_suv', title: 'Chevy Suburban Black', subtitle: 'VIP Group Transport' },

  // Vans & Coaches
  { src: '/gallery/sprinter1.webp', alt: 'Mercedes Benz Sprinter', category: 'van_coach', title: 'Mercedes-Benz Sprinter', subtitle: 'Executive Shuttle' },
  { src: '/gallery/sprinter2.webp', alt: 'Mercedes Benz Sprinter Passenger', category: 'van_coach', title: 'Luxury Sprinter', subtitle: '14-Passenger Comfort' },
  { src: '/gallery/mini bus.webp', alt: 'Premium Mini Bus', category: 'van_coach', title: '31 Passenger Mini Bus', subtitle: 'Mid-Size Group Travel' },
  { src: '/gallery/minibus.webp', alt: 'Mini Bus Exterior', category: 'van_coach', title: 'Executive Minibus', subtitle: 'Corporate Charter' },
  { src: '/gallery/coach bus1.webp', alt: 'Coach Bus Side', category: 'van_coach', title: '55 Passenger Coach Bus', subtitle: 'Large Event Specialist' },
  { src: '/gallery/coach bus2.webp', alt: 'Coach Bus Front', category: 'van_coach', title: 'Luxury Coach Bus', subtitle: 'Long-Distance Travel' },

  // Experiences
  { src: '/gallery/aeropuerto.webp', alt: 'Airport Dropoff', category: 'experience', title: 'Airport Chauffeur', subtitle: 'MIA & FLL Transfer' },
  { src: '/gallery/interna.webp', alt: 'Vehicle Interior', category: 'experience', title: 'Premium Cabin', subtitle: 'Amenities & Luxury' },
  { src: '/gallery/miami.webp', alt: 'Miami Skyline Drive', category: 'experience', title: 'Miami VIP Experience', subtitle: 'Cruising in Style' },
]

const CATEGORIES = [
  { id: 'all', label: 'All Fleet & Views' },
  { id: 'sedan_suv', label: 'Sedans & SUVs' },
  { id: 'van_coach', label: 'Vans & Coaches' },
  { id: 'experience', label: 'Experiences' },
]

export default function ImageGallery() {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  const filteredItems = activeCategory === 'all'
    ? GALLERY_ITEMS
    : GALLERY_ITEMS.filter(item => item.category === activeCategory)

  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : filteredItems.length - 1))
    }
  }

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((prev) => (prev !== null && prev < filteredItems.length - 1 ? prev + 1 : 0))
    }
  }

  return (
    <div className="w-full mt-24 flex flex-col items-center">
      {/* Section Header */}
      <div className="text-center mb-12">
        <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
          Our Fleet
        </p>
        <h2
          className="text-2xl md:text-3xl font-bold"
          style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#FFFFFF' }}
        >
          A curated selection of premium vehicles designed for absolute comfort.
        </h2>
      </div>

      {/* Category selector */}
      <div className="flex flex-wrap gap-2 justify-center mb-10">
        {CATEGORIES.map((cat) => {
          const isActive = cat.id === activeCategory
          return (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className="px-4 py-2 rounded-xl text-xs md:text-sm font-semibold transition-all"
              style={{
                background: isActive ? 'rgba(184,150,12,0.15)' : '#161616',
                border: `1px solid ${isActive ? '#B8960C' : '#252525'}`,
                color: isActive ? '#D4AF37' : '#888888',
                cursor: 'pointer',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Grid / Mobile Slider */}
      <div className="flex overflow-x-auto sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full snap-x snap-mandatory pb-6 no-scrollbar" style={{ scrollPaddingLeft: '1rem' }}>
        {filteredItems.map((item, index) => (
          <div
            key={item.src}
            onClick={() => setLightboxIndex(index)}
            className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 hover:shadow-xl hover:shadow-[#B8960C08] shrink-0 w-[85vw] sm:w-auto snap-center"
            style={{
              aspectRatio: '4/3',
              background: '#161616',
              border: '1px solid #252525',
            }}
          >
            <Image
              src={item.src}
              alt={item.alt}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            {/* Dark overlay & detail text */}
            <div
              className="absolute inset-0 flex flex-col justify-end p-6 transition-opacity duration-300 opacity-0 group-hover:opacity-100"
              style={{
                background: 'linear-gradient(to top, rgba(10,10,10,0.95), rgba(10,10,10,0.4), transparent)',
              }}
            >
              <span className="text-xs uppercase tracking-widest font-bold mb-1" style={{ color: '#B8960C' }}>
                {item.category === 'sedan_suv' ? 'Sedan & SUV' : item.category === 'van_coach' ? 'Vans & Coaches' : 'Miami Experience'}
              </span>
              <h3 className="text-lg font-bold text-white mb-0.5">
                {item.title}
              </h3>
              <p className="text-xs" style={{ color: '#AAAAAA' }}>
                {item.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {lightboxIndex !== null && (
        <div
          onClick={() => setLightboxIndex(null)}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md"
          style={{ background: 'rgba(10, 10, 10, 0.92)' }}
        >
          {/* Close button */}
          <button
            onClick={() => setLightboxIndex(null)}
            className="absolute top-6 right-6 text-white text-3xl font-light hover:text-[#B8960C] transition-colors"
            aria-label="Close lightbox"
          >
            ✕
          </button>

          {/* Navigation arrows */}
          <button
            onClick={handlePrev}
            className="absolute left-4 md:left-8 w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-white hover:border-[#B8960C] hover:text-[#B8960C] transition-all bg-black/40"
            aria-label="Previous image"
          >
            ❮
          </button>
          
          <button
            onClick={handleNext}
            className="absolute right-4 md:right-8 w-12 h-12 rounded-full border border-neutral-800 flex items-center justify-center text-white hover:border-[#B8960C] hover:text-[#B8960C] transition-all bg-black/40"
            aria-label="Next image"
          >
            ❯
          </button>

          {/* Image display */}
          <div className="relative max-w-5xl max-h-[80vh] w-full h-full flex flex-col items-center justify-center">
            <div className="relative w-full h-[70vh]">
              <Image
                src={filteredItems[lightboxIndex].src}
                alt={filteredItems[lightboxIndex].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            
            {/* Caption text */}
            <div className="text-center mt-4 max-w-md">
              <h3 className="text-xl font-bold text-white mb-1">
                {filteredItems[lightboxIndex].title}
              </h3>
              <p className="text-sm" style={{ color: '#888888' }}>
                {filteredItems[lightboxIndex].subtitle}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
