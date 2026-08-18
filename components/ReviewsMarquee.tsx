import React from 'react';

interface MarqueeReview {
  name: string
  text: string
  rating: number
}

export default function ReviewsMarquee({ reviews }: { reviews?: MarqueeReview[] }) {
  const items = reviews || []

  // No fabricated placeholder reviews — this section stays hidden until
  // there are real, approved reviews to show.
  if (items.length === 0) return null

  return (
    <section className="w-full py-16 overflow-hidden" style={{ background: 'var(--bg-deep)', borderTop: '1px solid var(--surface)', borderBottom: '1px solid var(--surface)' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: 'var(--gold)' }}>
          Client Testimonials
        </p>
        <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: 'var(--text)' }}>
          What Our Passengers Say
        </h2>
      </div>

      <div className="flex overflow-hidden group">
        <div className="animate-marquee flex shrink-0 gap-6 px-3 group-hover:[animation-play-state:paused]">
          {items.map((review, i) => (
            <ReviewCard key={`review-1-${i}`} review={review} />
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 gap-6 px-3 group-hover:[animation-play-state:paused]">
          {items.map((review, i) => (
            <ReviewCard key={`review-2-${i}`} review={review} />
          ))}
        </div>
      </div>
    </section>
  );
}

function ReviewCard({ review }: { review: { name: string; text: string; rating: number } }) {
  return (
    <div 
      className="shrink-0 w-[320px] md:w-[400px] p-6 rounded-2xl whitespace-normal"
      style={{ background: 'var(--surface-raised)', border: '1px solid var(--border-faint)' }}
    >
      <div className="flex gap-1 mb-3">
        {[...Array(review.rating)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="var(--gold-light)" stroke="var(--gold-light)" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <p className="text-[var(--text-subtle)] text-sm md:text-base leading-relaxed mb-4 font-medium italic">
        "{review.text}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[var(--border)] flex items-center justify-center border border-[var(--border-soft)]">
          <span className="text-xs font-bold text-[var(--gold-light)]">
            {review.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-white text-sm font-bold">{review.name}</p>
          <p className="text-[var(--text-faint)] text-xs font-semibold flex items-center gap-1">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Verified Passenger
          </p>
        </div>
      </div>
    </div>
  );
}
