'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SuccessPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead_id')
  const sessionId = searchParams.get('session_id')

  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function confirmPayment() {
      if (!sessionId || !leadId) {
        setLoading(false)
        return
      }

      try {
        const res = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, lead_id: leadId }),
        })

        if (res.ok) {
          setConfirmed(true)
        }
      } catch (e) {
        console.error('[success] Error confirming payment:', e)
      }

      setLoading(false)
    }

    confirmPayment()
  }, [sessionId, leadId])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-[#B8960C] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
          <p className="text-lg text-white font-semibold">Confirming your payment...</p>
          <p className="text-sm text-[#888] mt-2">Please wait, this will only take a moment.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4">
      <div
        className="max-w-md w-full rounded-2xl p-8 md:p-12 text-center"
        style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-8"
          style={{ background: 'rgba(184,150,12,0.1)', border: '2px solid #B8960C' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1
          className="text-3xl md:text-4xl font-bold mb-4"
          style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          Payment Successful!
        </h1>

        <p className="text-sm mb-4 font-bold" style={{ color: '#ffbaba' }}>
          Please check your spam/junk messages to ensure you receive your confirmation email.
        </p>

        <p className="text-base mb-2" style={{ color: '#DDDDDD' }}>
          Your reservation has been fully confirmed.
        </p>
        <p className="text-sm mb-8" style={{ color: '#AAAAAA' }}>
          We have sent a confirmation email with all your trip details. Our concierge team is ready to serve you.
        </p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/promo/${params.slug}`}
            className="inline-block w-full py-4 rounded-xl text-sm font-bold uppercase tracking-wider transition-all hover:brightness-110 active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #B8960C, #D4AF37)',
              color: '#0a0a0a',
            }}
          >
            Return to Booking Page
          </Link>
        </div>
      </div>
    </div>
  )
}
