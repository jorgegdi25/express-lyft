'use client'

import { useEffect, useState } from 'react'

type ViewState = 'loading' | 'not_found' | 'already_submitted' | 'form' | 'thanks'

export default function ReviewPage({ params }: { params: { token: string } }) {
  const [view, setView] = useState<ViewState>('loading')
  const [customerName, setCustomerName] = useState('')
  const [rating, setRating] = useState(0)
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null)
  const [comment, setComment] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [recommended, setRecommended] = useState(false)

  useEffect(() => {
    fetch(`/api/reviews/${params.token}`)
      .then(async (res) => {
        if (!res.ok) {
          setView('not_found')
          return
        }
        const data = await res.json()
        setCustomerName(data.customer_name || '')
        setView(data.status === 'requested' ? 'form' : 'already_submitted')
      })
      .catch(() => setView('not_found'))
  }, [params.token])

  async function handleSubmit() {
    if (rating < 1 || wouldRecommend === null) {
      setError('Please select a rating and answer whether you recommend us.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const res = await fetch(`/api/reviews/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, would_recommend: wouldRecommend, comment: comment.trim() || undefined }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Something went wrong. Please try again.')
        setSubmitting(false)
        return
      }
      const data = await res.json()
      setRecommended(!!data.would_recommend)
      setView('thanks')
    } catch {
      setError('Something went wrong. Please try again.')
      setSubmitting(false)
    }
  }

  const facebookUrl = process.env.NEXT_PUBLIC_FACEBOOK_REVIEW_URL

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-16" style={{ background: '#0a0a0a' }}>
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{ background: '#111', border: '1px solid #1e1e1e' }}
      >
        {view === 'loading' && (
          <p className="text-center text-sm" style={{ color: '#888' }}>Loading...</p>
        )}

        {view === 'not_found' && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Review link not found
            </h1>
            <p className="text-sm" style={{ color: '#888' }}>
              This link may be invalid. Please contact us if you believe this is a mistake.
            </p>
          </div>
        )}

        {view === 'already_submitted' && (
          <div className="text-center">
            <h1 className="text-xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              You&apos;ve already submitted this review
            </h1>
            <p className="text-sm" style={{ color: '#888' }}>
              Thank you for your feedback — we already have it on file.
            </p>
          </div>
        )}

        {view === 'form' && (
          <>
            <h1 className="text-2xl font-bold text-white mb-2 text-center" style={{ fontFamily: 'Georgia, serif' }}>
              How was your ride?
            </h1>
            <p className="text-sm text-center mb-8" style={{ color: '#888' }}>
              {customerName ? `Hi ${customerName}, ` : ''}we&apos;d love your feedback.
            </p>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-bold mb-3 text-center" style={{ color: '#888' }}>
                How was your experience?
              </p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    aria-label={`${n} stars`}
                    className="text-4xl leading-none transition-transform hover:scale-110"
                    style={{ color: n <= rating ? '#D4AF37' : '#333' }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-bold mb-3 text-center" style={{ color: '#888' }}>
                Do you recommend Express Lyft?
              </p>
              <div className="flex justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setWouldRecommend(true)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                  style={{
                    background: wouldRecommend === true ? '#B8960C' : 'transparent',
                    color: wouldRecommend === true ? '#0a0a0a' : '#ccc',
                    border: '1px solid #B8960C',
                  }}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() => setWouldRecommend(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-sm uppercase tracking-wider transition-all"
                  style={{
                    background: wouldRecommend === false ? '#333' : 'transparent',
                    color: wouldRecommend === false ? '#fff' : '#ccc',
                    border: '1px solid #444',
                  }}
                >
                  No
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-xs uppercase tracking-wider font-bold mb-3" style={{ color: '#888' }}>
                Comments (optional)
              </p>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                placeholder="Tell us more..."
                className="w-full rounded-xl px-4 py-3 text-sm text-white outline-none resize-none"
                style={{ background: '#0a0a0a', border: '1px solid #1e1e1e' }}
              />
            </div>

            {error && <p className="text-sm text-red-400 mb-4 text-center">{error}</p>}

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #B8960C, #D4AF37)', color: '#0a0a0a' }}
            >
              {submitting ? 'Submitting...' : 'Submit Review'}
            </button>
          </>
        )}

        {view === 'thanks' && (
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: 'Georgia, serif' }}>
              Thank you!
            </h1>
            <p className="text-sm mb-6" style={{ color: '#888' }}>
              We appreciate you taking the time to share your feedback.
            </p>
            {recommended && facebookUrl && (
              <a
                href={facebookUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block w-full py-3.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all"
                style={{ background: '#1877F2', color: '#fff' }}
              >
                Share on Facebook
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
