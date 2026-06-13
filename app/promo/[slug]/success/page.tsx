import Link from 'next/link'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

export default async function SuccessPage({ 
  params,
  searchParams,
}: { 
  params: { slug: string }
  searchParams: { lead_id?: string; session_id?: string }
}) {
  let receiptUrl: string | null = null;
  if (searchParams?.session_id) {
    try {
      const session = await stripe.checkout.sessions.retrieve(searchParams.session_id, {
        expand: ['payment_intent.latest_charge']
      });
      if (session.payment_intent) {
        const pi = session.payment_intent as Stripe.PaymentIntent;
        const charge = pi.latest_charge as Stripe.Charge;
        if (charge && charge.receipt_url) {
          receiptUrl = charge.receipt_url;
        }
      }
    } catch (e) {
      console.error('Failed to fetch stripe session for receipt', e);
    }
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
