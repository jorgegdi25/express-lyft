import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { createAndSendStayInvoice } from '@/lib/quickbooks'
import { STAY_LODGING_TAX_RATE_PERCENT } from '@/lib/stayTax'

export const dynamic = 'force-dynamic'

const MAX_SEDAN_SUV_GUESTS = 4

export async function POST(req: NextRequest) {
  let body: any
  try {
    body = await req.json()
    const {
      stayHotelId,
      roomType,
      roomQty,
      nights,
      checkInDate,
      guestName,
      guestEmail,
      guestPhone,
      guestCount,
      airline,
      flightNumber,
      pickupTime,
    } = body

    if (!stayHotelId || !roomType || !roomQty || !nights || !checkInDate) {
      return NextResponse.json({ error: 'Missing booking details' }, { status: 400 })
    }
    if (!guestName || !guestEmail || !guestPhone) {
      return NextResponse.json({ error: 'Missing guest details' }, { status: 400 })
    }
    if (!pickupTime) {
      return NextResponse.json({ error: 'Missing pickup time' }, { status: 400 })
    }
    if ((guestCount || 1) > MAX_SEDAN_SUV_GUESTS) {
      return NextResponse.json({ error: 'Party too large for standard SUV — please call or WhatsApp us directly.' }, { status: 400 })
    }

    const { data: hotel, error: hotelErr } = await supabaseAdmin
      .from('stay_hotels')
      .select('*')
      .eq('id', stayHotelId)
      .eq('active', true)
      .maybeSingle()

    if (hotelErr || !hotel) {
      return NextResponse.json({ error: 'Hotel not found or unavailable' }, { status: 404 })
    }
    if (hotel.rooms_available < roomQty) {
      return NextResponse.json({ error: 'Not enough rooms available at this hotel right now' }, { status: 409 })
    }

    // hotel.price is the single all-in price the guest sees and pays — one
    // number, transportation included, never itemized separately, not in
    // the chat and not on the QuickBooks invoice either (deliberately one
    // combined line — see createAndSendStayInvoice). room_amount /
    // transport_amount below is purely an internal split for our own
    // revenue reports; the guest never sees it broken out anywhere.
    const total = Math.round(hotel.price * roomQty * nights * 100) / 100
    const transportAmount = Math.min(Math.round(hotel.transport_amount * 100) / 100, total)
    const roomAmount = Math.round((total - transportAmount) * 100) / 100
    const taxAmount = Math.round(total * (STAY_LODGING_TAX_RATE_PERCENT / 100) * 100) / 100

    const { data: booking, error: insertErr } = await supabaseAdmin
      .from('stay_bookings')
      .insert({
        stay_hotel_id: hotel.id,
        hotel_name: hotel.name,
        room_type: roomType,
        room_qty: roomQty,
        nights,
        check_in_date: checkInDate,
        guest_name: guestName,
        guest_email: guestEmail,
        guest_phone: guestPhone,
        guest_count: guestCount || 1,
        airline: airline || null,
        flight_number: flightNumber || null,
        direction: 'airport_to_hotel',
        pickup_time: pickupTime,
        room_amount: roomAmount,
        transport_amount: transportAmount,
        total_amount: total,
        status: 'pending_payment',
      })
      .select()
      .single()

    if (insertErr || !booking) {
      console.error('[stay/checkout] insert error:', insertErr)
      return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 })
    }

    const roomLabel = roomType === '2_beds' ? '2 Beds' : '1 Bed'

    try {
      // One combined line, deliberately not split into room vs. transport —
      // see the comment on createAndSendStayInvoice for why.
      const invoice = await createAndSendStayInvoice({
        guestName,
        guestEmail,
        guestPhone,
        amount: total,
        taxAmount,
        description: `${hotel.name} — ${roomQty}x ${roomLabel} (${nights} night${nights > 1 ? 's' : ''}), airport transportation included — Check-in ${checkInDate}, pickup ${pickupTime}`,
      })

      await supabaseAdmin
        .from('stay_bookings')
        .update({ quickbooks_invoice_id: invoice.Id, quickbooks_invoice_status: 'sent' })
        .eq('id', booking.id)

      if (!invoice.invoiceLink) {
        console.error('[stay/checkout] QuickBooks invoice created but no payment link returned for booking', booking.id)
        return NextResponse.json({ error: 'Failed to generate a QuickBooks payment link' }, { status: 500 })
      }

      return NextResponse.json({ success: true, url: invoice.invoiceLink })
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
      console.error('[stay/checkout] QuickBooks invoice creation failed for booking', booking.id, errorMsg)
      return NextResponse.json({ error: 'Failed to create QuickBooks invoice: ' + errorMsg }, { status: 500 })
    }
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[stay/checkout] POST error:', errorMsg, 'Body:', body || 'no-body-read')
    return NextResponse.json({ error: 'Failed to start checkout: ' + errorMsg }, { status: 500 })
  }
}
