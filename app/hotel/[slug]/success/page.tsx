'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

export default function SuccessPage({ params }: { params: { slug: string } }) {
  const searchParams = useSearchParams()
  const leadId = searchParams.get('lead_id')
  const sessionId = searchParams.get('session_id')

  const [lead, setLead] = useState<any>(null)
  const [receiptUrl, setReceiptUrl] = useState<string | null>(null)
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function confirmPayment() {
      if (!sessionId || !leadId) {
        setLoading(false)
        return
      }

      try {
        // Call our confirm-payment endpoint which verifies with Stripe,
        // updates the lead to paid, and sends the confirmation email
        const res = await fetch('/api/confirm-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id: sessionId, lead_id: leadId }),
        })

        if (res.ok) {
          const data = await res.json()
          setConfirmed(true)
          console.log('[success] Payment confirmed:', data)
        } else {
          console.error('[success] Failed to confirm payment')
        }
      } catch (e) {
        console.error('[success] Error confirming payment:', e)
      }

      // Fetch the updated lead data for display
      try {
        const leadRes = await fetch(`/api/leads?id=${leadId}`, {
          method: 'GET',
        })
        if (leadRes.ok) {
          const leadData = await leadRes.json()
          if (leadData.lead) {
            setLead(leadData.lead)
          }
        }
      } catch (e) {
        console.error('[success] Error fetching lead:', e)
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
        className="max-w-md w-full rounded-2xl p-8 md:p-10 text-center"
        style={{
          background: '#161616',
          border: '1px solid #2a2a2a',
          boxShadow: '0 24px 60px rgba(0,0,0,0.5)',
        }}
      >
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(184,150,12,0.1)', border: '2px solid #B8960C' }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#B8960C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>

        <h1
          className="text-3xl font-bold mb-3"
          style={{ color: '#FFFFFF', fontFamily: "'Playfair Display', Georgia, serif" }}
        >
          {lead?.status === 'quote_requested' ? 'Quote Requested!' : 'Payment Successful!'}
        </h1>

        <p className="text-sm mb-4 font-bold" style={{ color: '#ffbaba' }}>
          Please check your spam/junk messages to ensure you receive your confirmation email.
        </p>

        {lead && (
          <div className="mt-6 mb-8 text-left bg-black/40 p-5 rounded-xl border border-[#2a2a2a]">
            <h3 className="text-[#B8960C] text-xs font-bold uppercase tracking-wider mb-3">Trip Summary</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="col-span-2">
                <p className="text-[#888888] text-xs mb-1">Route</p>
                <p className="text-white font-medium">{lead.pickup} → {lead.destination}</p>
              </div>
              <div>
                <p className="text-[#888888] text-xs mb-1">Outbound Date</p>
                <p className="text-white font-medium">{lead.date} at {lead.time}</p>
              </div>
              {lead.trip_type === 'round-trip' && lead.return_date && lead.return_time && (
                <div>
                  <p className="text-[#888888] text-xs mb-1">Return Date</p>
                  <p className="text-white font-medium">{lead.return_date} at {lead.return_time}</p>
                </div>
              )}
              <div>
                <p className="text-[#888888] text-xs mb-1">Vehicle</p>
                <p className="text-white font-medium capitalize">{lead.vehicle_type?.replace('_', ' & ')}</p>
              </div>
            </div>
          </div>
        )}

        {!lead && (
          <>
            <p className="text-base mb-2 mt-4" style={{ color: '#DDDDDD' }}>
              Your reservation has been fully confirmed.
            </p>
            <p className="text-sm mb-8" style={{ color: '#AAAAAA' }}>
              We have sent a confirmation email with all your trip details. Our concierge team is ready to serve you.
            </p>
          </>
        )}

        <div className="flex flex-col gap-3">
          {receiptUrl && (
            <a
              href={receiptUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block w-full py-4 rounded-xl text-sm font-bold tracking-wider transition-all hover:bg-white/10 active:scale-[0.98] border border-white/20"
              style={{ color: '#FFFFFF' }}
            >
              📄 Download PDF Invoice / Receipt
            </a>
          )}
          <Link
            href={`/hotel/${params.slug}`}
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
