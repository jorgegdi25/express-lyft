'use client'

import { useEffect, useState } from 'react'

// The hero keeps the existing Express Lyft video, but only loads it on
// larger screens without data-saver. Phones get the poster image, which
// avoids pulling a multi-MB video on cellular.
export default function HeroMedia({ video, poster, alt }: { video: string; poster: string; alt: string }) {
  const [useVideo, setUseVideo] = useState(false)

  useEffect(() => {
    const conn = (navigator as any).connection
    const saveData = conn?.saveData || /2g/.test(conn?.effectiveType || '')
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (window.innerWidth >= 768 && !saveData && !reduced) setUseVideo(true)
  }, [])

  return (
    <div className="absolute inset-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={poster} alt={alt} className="absolute inset-0 w-full h-full object-cover" fetchPriority="high" />
      {useVideo && (
        <video
          src={video}
          poster={poster}
          className="absolute inset-0 w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
          aria-hidden
        />
      )}
    </div>
  )
}
