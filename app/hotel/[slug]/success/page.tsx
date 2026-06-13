import Link from 'next/link'
import { createClient } from '@supabase/supabase-js'

export default async function SuccessPage({ 
  params,
  searchParams,
}: { 
  params: { slug: string }
  searchParams: { lead_id?: string }
}) {
  let lead = null;
  
  if (searchParams.lead_id) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      const { data } = await supabase
        .from('leads')
        .select('*')
        .eq('id', searchParams.lead_id)
        .single();
      lead = data;
    } catch (e) {
      console.error('Failed to fetch lead for success page', e);
    }
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
                <p className="text-[#888888] text-xs mb-1">Date & Time</p>
                <p className="text-white font-medium">{lead.date} at {lead.time}</p>
              </div>
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
  )
}
