'use client'

import { useState } from 'react'
import type { Testimonial } from '@/components/Testimonials'

// Real, approved reviews from the `reviews` table (lib/reviews.ts).
// Shows the most substantial ones first, 3 at a time, instead of the old
// infinite marquee.
export default function ReviewsGrid({ reviews }: { reviews: Testimonial[] }) {
  const [count, setCount] = useState(3)
  if (reviews.length === 0) return null

  const sorted = [...reviews].sort((a, b) => b.text.length - a.text.length)
  const visible = sorted.slice(0, count)

  return (
    <div>
      <ul className="grid md:grid-cols-3 gap-4 md:gap-6">
        {visible.map((r, i) => (
          <li
            key={r.name + i}
            className="rounded-2xl p-6 md:p-7 flex flex-col animate-[fadein_.5s_ease]"
            style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}
          >
            <div className="flex gap-1" aria-label={`${r.rating} out of 5 stars`}>
              {Array.from({ length: r.rating }).map((_, s) => (
                <svg key={s} width="14" height="14" viewBox="0 0 24 24" fill="var(--gold-light)" aria-hidden><path d="M12 2l3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 17.8 5.8 21l1.2-6.8-5-4.9 6.9-1z" /></svg>
              ))}
            </div>
            <blockquote className="mt-4 text-[17px] leading-relaxed font-display" style={{ color: 'var(--text-subtle)' }}>
              “{r.text}”
            </blockquote>
            <div className="mt-auto pt-6 flex items-center gap-3 text-sm">
              <span
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: 'rgba(184,150,12,0.14)', color: 'var(--gold-light)', border: '1px solid rgba(184,150,12,0.35)' }}
                aria-hidden
              >
                {r.avatarText}
              </span>
              <div>
                <p className="font-semibold text-[var(--text)] capitalize">{r.name.toLowerCase()}</p>
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{r.role}{r.date ? ` · ${r.date}` : ''}</p>
              </div>
            </div>
          </li>
        ))}
      </ul>
      {sorted.length > count && (
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setCount((c) => c + 6)}
            className="px-6 py-3 rounded-xl text-[14px] font-semibold text-[var(--text)] hover:border-[var(--gold-light)] hover:text-[var(--gold-light)] transition"
            style={{ border: '1px solid var(--border-soft)' }}
          >
            More reviews ({sorted.length - count})
          </button>
        </div>
      )}
    </div>
  )
}
