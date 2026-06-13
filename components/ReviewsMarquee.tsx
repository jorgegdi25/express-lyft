import React from 'react';

const REVIEWS = [
  {
    name: "Michael T.",
    text: "Impeccable service. The driver was waiting for us at FLL baggage claim. The SUV was pristine.",
    rating: 5,
  },
  {
    name: "Sarah L.",
    text: "Used them for a transfer to B Ocean Resort. Very professional and the ride was incredibly smooth.",
    rating: 5,
  },
  {
    name: "David R.",
    text: "Highly recommend for anyone needing luxury transport in Miami. Punctual and courteous.",
    rating: 5,
  },
  {
    name: "Elena G.",
    text: "The best way to start our vacation! The Mercedes Sprinter was perfect for our large group.",
    rating: 5,
  },
  {
    name: "James H.",
    text: "Excellent communication from booking to drop-off. Will definitely be using ExpLyft again.",
    rating: 5,
  },
  {
    name: "Victoria M.",
    text: "Five-star experience. The chauffeur was sharply dressed and handled all our heavy luggage.",
    rating: 5,
  },
];

export default function ReviewsMarquee() {
  return (
    <section className="w-full py-16 overflow-hidden" style={{ background: '#0a0a0a', borderTop: '1px solid #1a1a1a', borderBottom: '1px solid #1a1a1a' }}>
      <div className="max-w-7xl mx-auto px-4 md:px-6 mb-10 text-center">
        <p className="text-xs font-bold uppercase tracking-[3px] mb-3" style={{ color: '#B8960C' }}>
          Client Testimonials
        </p>
        <h2 className="text-2xl md:text-4xl font-bold" style={{ fontFamily: "'Playfair Display', Georgia, serif", color: '#ffffff' }}>
          What Our Passengers Say
        </h2>
      </div>

      <div className="flex overflow-hidden group">
        <div className="animate-marquee flex shrink-0 gap-6 px-3 group-hover:[animation-play-state:paused]">
          {REVIEWS.map((review, i) => (
            <ReviewCard key={`review-1-${i}`} review={review} />
          ))}
        </div>
        <div className="animate-marquee flex shrink-0 gap-6 px-3 group-hover:[animation-play-state:paused]">
          {REVIEWS.map((review, i) => (
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
      style={{ background: '#161616', border: '1px solid #252525' }}
    >
      <div className="flex gap-1 mb-3">
        {[...Array(review.rating)].map((_, i) => (
          <svg key={i} width="16" height="16" viewBox="0 0 24 24" fill="#D4AF37" stroke="#D4AF37" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        ))}
      </div>
      <p className="text-[#AAAAAA] text-sm md:text-base leading-relaxed mb-4 font-medium italic">
        "{review.text}"
      </p>
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-[#2a2a2a] flex items-center justify-center border border-[#333]">
          <span className="text-xs font-bold text-[#D4AF37]">
            {review.name.charAt(0)}
          </span>
        </div>
        <div>
          <p className="text-white text-sm font-bold">{review.name}</p>
          <p className="text-[#666666] text-xs font-semibold flex items-center gap-1">
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
