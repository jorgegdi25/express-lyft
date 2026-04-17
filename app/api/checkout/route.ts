import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      hotelSlug,
      pickup,
      destination,
      date,
      time,
      returnDate,
      returnTime,
      passengers,
      vehicleType,
      amount,
      customerName,
      customerEmail,
      customerPhone,
      customerCountry
    } = body

    if (!hotelSlug || !pickup || !destination || !date || !time || !passengers || !vehicleType || !amount || !customerName || !customerEmail) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'

    const vehicleLabels: Record<string, string> = {
      sedan_suv: 'Sedan & SUV',
      suburban: 'Chevy Suburban',
      sprinter: 'Mercedes-Benz Sprinter',
      minibus: '31 Passenger Mini Bus',
      coachbus: '55 Passenger Bus'
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'usd',
            unit_amount: amount,
            product_data: {
              name: `Express Lyft — ${vehicleLabels[vehicleType] ?? vehicleType}`,
              description: `${pickup} → ${destination} on ${date} at ${time}`,
            },
          },
          quantity: 1,
        },
      ],
      success_url: `${origin}/hotel/${hotelSlug}?success=true`,
      cancel_url: `${origin}/hotel/${hotelSlug}`,
      metadata: {
        hotelSlug,
        pickup,
        destination,
        date,
        time,
        returnDate: returnDate ?? '',
        returnTime: returnTime ?? '',
        passengers: String(passengers),
        vehicleType,
        amount: String(amount),
        customerName,
        customerEmail,
        customerPhone: customerPhone ?? '',
        customerCountry: customerCountry ?? ''
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: unknown) {
    console.error('[checkout]', err)
    const message = err instanceof Error ? err.message : 'Internal server error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
