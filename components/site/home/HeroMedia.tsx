'use client'

import { useEffect, useRef, useState } from 'react'

// Background video on every screen: phones get a lighter 540p encode.
// Data-saver and reduced-motion visitors keep the poster image.
// Autoplaying motion gets a pause control.
export default function HeroMedia({ video, mobileVideo, poster, alt }: { video: string; mobileVideo?: string; poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  const [src, setSrc] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    const conn = (navigator as any).connection
    const saveData = conn?.saveData || /2g/.test(conn?.effectiveType || '')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (saveData || reduced) return
    setSrc(window.innerWidth < 768 && mobileVideo ? mobileVideo : video)
  }, [video, mobileVideo])

  function toggle() {
    const v = ref.current
    if (!v) return
    if (v.paused) { v.play(); setPaused(false) } else { v.pause(); setPaused(true) }
  }

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={alt} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
      {src && (
        <>
          <video
            ref={ref}
            src={src}
            poster={poster}
            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${ready ? 'opacity-100' : 'opacity-0'}`}
            autoPlay
            loop
            muted
            playsInline
            onPlaying={() => setReady(true)}
            aria-hidden
          />
          <button
            type="button"
            onClick={toggle}
            className="absolute z-20 right-4 top-[84px] md:top-auto md:right-8 md:bottom-8 w-10 h-10 rounded-full flex items-center justify-center text-white/80 hover:text-white transition-colors"
            style={{ border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(0,0,0,0.3)', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}
            aria-label={paused ? 'Play background video' : 'Pause background video'}
          >
            {paused ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M7 4l13 8-13 8z" /></svg>
            ) : (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M6 4h4v16H6zM14 4h4v16h-4z" /></svg>
            )}
          </button>
        </>
      )}
    </div>
  )
}
