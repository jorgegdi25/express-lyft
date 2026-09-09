import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { stripe } from '@/lib/stripe'
import { createCalendarEvent, updateCalendarEvent, deleteCalendarEvent } from '@/lib/calendar'
import { calculateDistanceAmount, applyTimeSurcharge, SurchargeConfig } from '@/lib/pricing'
import { flTaxRateIds, FL_TAX_RATE_PERCENT } from '@/lib/tax'
import { createAndSendInvoice } from '@/lib/quickbooks'
import { checkDiscountCode, redeemDiscountCode } from '@/lib/discountCodes'
import { jetskiPackagePrice, jetskiMachineCount, JETSKI_TRANSPORT_PRICES, JETSKI_MAX_MACHINES_PER_SLOT, JetskiTransportOption, JETSKI_MIN_NOTICE_MINUTES, nyNowPlusMinutes, jetskiSlotSortKey } from '@/lib/jetskiPricing'
import { resend, sendOwnerNotification } from '@/lib/resend'
import { ConfirmationEmail } from '@/emails/ConfirmationEmail'

// A manually-paid reservation (Payment Source: External Platform/Cash at
// creation, or a status dropdown flipped to Paid afterward) never touches
// Stripe/QuickBooks, so their webhooks — the only place this email/owner
// notification were wired up — never fire. Mirrors fulfillPaidLead()'s
// email step, just triggered from the admin API instead of a payment
// webhook. Never throws — a failed email shouldn't fail the reservation.
async function sendManualPaidConfirmation(lead: any, amountPaid: number) {
  if (!lead?.customer_email) return
  try {
    if (resend) {
      await resend.emails.send({
        from: 'Express Lyft <book@explyft.com>',
        to: [lead.customer_email],
        subject: 'Reservation Confirmed & Paid - Express Lyft',
        react: ConfirmationEmail({
          customerName: lead.customer_name || 'Valued Guest',
          bookingId: lead.id || 'CONFIRMED',
          pickup: lead.pickup || 'N/A',
          destination: lead.destination || 'N/A',
          date: lead.date || 'N/A',
          time: lead.time || 'N/A',
          vehicleType: lead.vehicle_type || 'N/A',
          serviceType: lead.service_type,
          serviceDetail: lead.service_detail,
          amount: String(amountPaid || lead.amount_usd || 0),
          paymentType: lead.payment_type === 'deposit' ? 'deposit' : 'full',
          amountRemaining: lead.payment_type === 'deposit' ? String(lead.amount_remaining || 0) : undefined,
          airline: lead.airline,
          flightNumber: lead.flight_number,
          meetingType: lead.meeting_type,
          carSeatsRequested: lead.car_seats_requested,
          luggageCount: lead.luggage_count,
          notes: lead.notes,
          receiptUrl: null,
          tripType: lead.trip_type,
          returnDate: lead.return_date,
          returnTime: lead.return_time,
        }),
      })
    }
    await sendOwnerNotification(lead, { isDeposit: lead.payment_type === 'deposit', amountPaid, totalAmount: lead.amount_usd })
  } catch (emailErr) {
    console.error('[leads] Failed to send confirmation for manually-paid reservation', lead.id, emailErr)
  }
}

// Shared by both the public /jetski checkout and the admin "Add Reservation"
// modal (the client explicitly asked that a full hour block her manual
// entries too, not just the public site) — soft check, same trade-off as
// the Stay module's room count: a read-then-insert race is possible under
// simultaneous bookings, but overflow is meant to be handled by a phone
// call anyway, so a hard atomic lock isn't worth the added complexity.
async function jetskiSlotHasRoom(date: string, time: string, machinesRequested: number): Promise<boolean> {
  const { data: sameSlotLeads } = await supabaseAdmin
    .from('leads')
    .select('service_detail')
    .eq('service_type', 'jet_ski')
    .eq('date', date)
    .eq('time', time)
    .not('status', 'in', '(cancelled,quote_requested)')
  const machinesBooked = (sameSlotLeads || []).reduce(
    (sum, l) => sum + jetskiMachineCount(String(l.service_detail || '').split(' — ')[0]),
    0
  )
  return machinesBooked + machinesRequested <= JETSKI_MAX_MACHINES_PER_SLOT
}

export const dynamic = 'force-dynamic'

async function getSurchargeConfig(): Promise<SurchargeConfig | null> {
  const { data } = await supabaseAdmin
    .from('pricing_settings')
    .select('surcharge_type, surcharge_amount, surcharge_start_hour, surcharge_end_hour')
    .eq('id', 1)
    .maybeSingle()
  return data as SurchargeConfig | null
}

// Looks up a fixed route price for one specific direction (pickup -> destination).
// Tries the exact direction first so hotel<->airport pairs priced differently per
// direction (e.g. hotel->airport $25, airport->hotel $40) are respected. Only falls
// back to the reverse direction's price when this exact direction has none loaded,
// so routes that still only have one direction configured keep working as before.
async function findExactRoutePrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string): Promise<number | null> {
  const key = `${vehicleType}_price`

  const { data: exactRoute } = await supabaseAdmin
    .from('route_pricing')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .eq('pickup', pickup)
    .eq('destination', destination)
    .maybeSingle()

  if (exactRoute && key in exactRoute && (exactRoute as any)[key]) {
    return (exactRoute as any)[key]
  }

  const { data: reversedRoute } = await supabaseAdmin
    .from('route_pricing')
    .select('*')
    .eq('hotel_slug', hotelSlug)
    .eq('pickup', destination)
    .eq('destination', pickup)
    .maybeSingle()

  if (reversedRoute && key in reversedRoute && (reversedRoute as any)[key]) {
    return (reversedRoute as any)[key]
  }

  return null
}

async function calculateDistancePrice(hotelSlug: string, vehicleType: string, distanceMiles: number, durationMinutes: number) {
  // Default fallback values
  const params = { base: 25, per_mile: 3.5, per_minute: 0.5, min_price: 90, max_price: Infinity, multiplier: 1 }

  // Fetch global prices from pricing table for the specific vehicle
  const { data: pricingData } = await supabaseAdmin.from('pricing').select('*').eq('vehicle_type', vehicleType).maybeSingle()
  if (pricingData) {
    params.base = pricingData.price_usd ?? params.base
    params.per_mile = pricingData.price_per_mile ?? params.per_mile
    params.per_minute = pricingData.price_per_minute ?? params.per_minute
    params.min_price = pricingData.min_price ?? params.min_price
    params.max_price = pricingData.max_price ?? params.max_price
    params.multiplier = pricingData.multiplier ?? params.multiplier
  }

  if (distanceMiles > 0) {
    const { data: hotel } = await supabaseAdmin.from('hotels').select('*').eq('slug', hotelSlug).maybeSingle()
    if (hotel) {
      const rateKey = `price_per_mile_${vehicleType}`
      if (rateKey in hotel && (hotel as any)[rateKey]) {
        params.per_mile = (hotel as any)[rateKey] // Override with hotel specific per-mile rate if it exists
      }
    }
  }

  return calculateDistanceAmount(params, distanceMiles, durationMinutes)
}

async function calculateLegPrice(
  hotelSlug: string,
  pickup: string,
  destination: string,
  vehicleType: string,
  distanceMiles: number,
  durationMinutes: number,
  legTime: string,
  surcharge: SurchargeConfig | null
) {
  const exactPrice = await findExactRoutePrice(hotelSlug, pickup, destination, vehicleType)
  const basePrice = exactPrice !== null ? exactPrice : await calculateDistancePrice(hotelSlug, vehicleType, distanceMiles, durationMinutes)
  return Math.ceil(applyTimeSurcharge(basePrice, legTime, surcharge))
}

async function calculatePrice(hotelSlug: string, pickup: string, destination: string, vehicleType: string, tripType: string, distanceMiles: number, durationMinutes: number, time: string, returnTime?: string, returnDestination?: string) {
  const pickupTrim = pickup.trim()
  const destinationTrim = destination.trim()
  const surcharge = await getSurchargeConfig()

  const outboundPrice = await calculateLegPrice(hotelSlug, pickupTrim, destinationTrim, vehicleType, distanceMiles, durationMinutes, time, surcharge)

  if (tripType !== 'round-trip') {
    return outboundPrice
  }

  // Round trip: price each direction independently and add them up, instead of
  // doubling the outbound price — hotel->airport and airport->hotel can (and often
  // do) cost different amounts. Each leg's own pickup time decides its own
  // time-of-day surcharge (e.g. daytime outbound, night-time return). The
  // return leg doesn't have to go back to the original pickup — a guest who
  // came from the hotel often returns to the airport instead, not the hotel
  // (see returnDestination) — so it defaults to the outbound pickup only
  // when the caller doesn't specify one.
  const returnDestinationTrim = (returnDestination || pickupTrim).trim()
  const returnPrice = await calculateLegPrice(hotelSlug, destinationTrim, returnDestinationTrim, vehicleType, distanceMiles, durationMinutes, returnTime || time, surcharge)
  return outboundPrice + returnPrice
}

export async function POST(req: NextRequest) {
  let body
  try {
    body = await req.json()
    const { id } = body

    // Generate remaining balance payment link (for deposit customers)
    // This MUST be checked before the regular id-based checkout to avoid being unreachable
    if (body.generateRemainingLink && id) {
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !lead || lead.amount_remaining <= 0) {
        return NextResponse.json({ error: 'Lead not found or no remaining balance' }, { status: 404 })
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success?lead_id=${lead.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        invoice_creation: {
          enabled: true,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: `Express Lyft Remaining Balance: ${lead.pickup} to ${lead.destination}`,
                description: `${lead.date} at ${lead.time} | ${lead.vehicle_type} | ${lead.passengers} passengers`,
              },
              unit_amount: Math.round(lead.amount_remaining * 100),
            },
            quantity: 1,
            tax_rates: flTaxRateIds(),
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: lead.customer_email || undefined,
        metadata: {
          lead_id: lead.id,
          hotel_slug: lead.hotel_slug,
          payment_type: 'remaining',
          total_amount: String(lead.amount_usd),
          charge_amount: String(lead.amount_remaining),
        }
      })

      // We do NOT change the status here, it stays deposit_paid
      return NextResponse.json({ success: true, url: session.url })
    }

    // Generate checkout session for an existing lead (re-send payment link from CRM)
    if (id) {
      const { data: lead, error: fetchError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', id)
        .single()

      if (fetchError || !lead) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }

      const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
      const successUrl = `${origin}/hotel/${lead.hotel_slug}/success?lead_id=${lead.id}&session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${origin}/hotel/${lead.hotel_slug}`

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        invoice_creation: {
          enabled: true,
        },
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: lead.service_type && lead.service_type !== 'transport'
                ? {
                    name: `Express Lyft ${lead.service_type === 'jet_ski' ? 'Jet Ski Rental' : 'Boat Rental'}: ${lead.service_detail || lead.service_type}`,
                    description: `${lead.date} at ${lead.time} | ${lead.passengers} passengers`,
                  }
                : {
                    name: `Express Lyft Reservation: ${lead.pickup} to ${lead.destination}`,
                    description: `${lead.date} at ${lead.time} | ${lead.vehicle_type} | ${lead.passengers} passengers`,
                  },
              unit_amount: Math.round(lead.amount_usd * 100),
            },
            quantity: 1,
            tax_rates: flTaxRateIds(),
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: lead.customer_email || undefined,
        metadata: {
          lead_id: lead.id,
          hotel_slug: lead.hotel_slug
        }
      })

      await supabaseAdmin.from('leads').update({ status: 'pending_payment' }).eq('id', lead.id)

      return NextResponse.json({ success: true, url: session.url })
    }

    const { 
      hotelSlug, 
      customerName, 
      customerEmail, 
      customerPhone, 
      customerCountry,
      pickup, 
      destination, 
      vehicleType,
      passengers,
      date,
      time,
      returnDate,
      returnTime,
      returnDestination,
      estimatedTotal,
      amountUsd,
      tripType,
      status,
      paymentMode,
      isPromo,
      airline,
      flightNumber,
      meetingType,
      meetGreetFee,
      carSeatsRequested,
      luggageCount,
      notes,
      distanceMiles,
      durationMinutes,
      paymentSource,
      externalPlatform,
      externalReference,
      amountPaid: manualAmountPaid,
      amountRemaining: manualAmountRemaining,
      discountCode,
      agentName,
      serviceType,
      serviceDetail,
      watercraftPackage,
      watercraftDuration,
      jetskiTransport,
    } = body

    if (!hotelSlug) return NextResponse.json({ error: 'Missing hotelSlug' }, { status: 400 })

    // Check if the request is from an authenticated admin
    const authHeader = req.headers.get('authorization')
    const isAdmin = authHeader?.startsWith('Bearer ') && authHeader.split('Bearer ')[1] === process.env.ADMIN_PASSWORD

    // Public jet ski bookings from /jetski — the only non-admin path that's
    // allowed to set service_type to something other than 'transport'. Price
    // is always recomputed from the real catalog below (§ "Determine target
    // price"), never trusted from the client, same as transport pricing.
    const isPublicJetski = !isAdmin && serviceType === 'jet_ski'

    // The CRM's "Add Reservation" modal already disables submit without a
    // date/time, but enforce it here too — a reservation with no date/time
    // slips through silently (no calendar event gets created, and it's
    // unclear when the driver is supposed to show up).
    if (isAdmin) {
      if (!date || !time) {
        return NextResponse.json({ error: 'Missing date or time' }, { status: 400 })
      }
      if (tripType === 'round-trip' && (!returnDate || !returnTime)) {
        return NextResponse.json({ error: 'Missing return date or time for round trip' }, { status: 400 })
      }
      // Client asked (27 ago 2026) that the 4-machine hourly cap block her
      // own manual entries too, not just the public site — no 2-hour notice
      // requirement here though, staff can still fit in a last-minute call.
      if (serviceType === 'jet_ski' && watercraftPackage) {
        const hasRoom = await jetskiSlotHasRoom(date, time, jetskiMachineCount(watercraftPackage))
        if (!hasRoom) {
          return NextResponse.json({ error: `That time slot is fully booked (4 jet skis already reserved for ${time}) — pick another hour.` }, { status: 409 })
        }
      }
    }
    if (isPublicJetski && (!date || !time || !watercraftPackage || !watercraftDuration)) {
      return NextResponse.json({ error: 'Missing date, time, or jet ski package' }, { status: 400 })
    }
    if (isPublicJetski && jetskiSlotSortKey(date, time) < nyNowPlusMinutes(JETSKI_MIN_NOTICE_MINUTES)) {
      return NextResponse.json({ error: `Online bookings need at least ${JETSKI_MIN_NOTICE_MINUTES / 60} hours' notice — please call or WhatsApp us for a sooner slot.` }, { status: 400 })
    }

    // Determine target price
    const inputTotal = estimatedTotal !== undefined ? estimatedTotal : amountUsd
    let finalAmount = inputTotal
    let appliedDiscountCode: string | null = null
    let appliedDiscountAmount = 0

    let leadStatus = isAdmin ? (status || 'new') : 'pending_payment'
    let isDeposit = paymentMode === 'deposit' && !isAdmin

    // Single read of the global settings row — used below both to re-check
    // the deposits toggle server-side (so a stale client, or a direct API
    // call, can't request a deposit while the owner has it turned off) and
    // to know which processor actually handles public checkout, so
    // payment_source reflects reality instead of being hardcoded.
    const { data: settings } = await supabaseAdmin
      .from('pricing_settings')
      .select('*')
      .eq('id', 1)
      .maybeSingle()
    if (isDeposit && settings?.deposits_enabled === false) {
      isDeposit = false
    }

    if (paymentMode === 'quote') {
      leadStatus = 'quote_requested'
      finalAmount = 0
      isDeposit = false
    } else if (isPromo) {
      finalAmount = 0;
      leadStatus = 'hotel_b2b'
      isDeposit = false
    } else if (isPublicJetski) {
      // Price always comes from the real catalog server-side — the client's
      // total is display-only and never trusted, same principle as the
      // transport branch below, just against a flat package lookup instead
      // of calculatePrice().
      const packagePrice = jetskiPackagePrice(watercraftPackage, watercraftDuration)
      if (packagePrice === null) {
        return NextResponse.json({ error: 'Unknown jet ski package or duration' }, { status: 400 })
      }
      const transportOption: JetskiTransportOption = jetskiTransport in JETSKI_TRANSPORT_PRICES ? jetskiTransport : 'none'
      const transportAddon = JETSKI_TRANSPORT_PRICES[transportOption]
      finalAmount = packagePrice + transportAddon
      isDeposit = false

      const hasRoom = await jetskiSlotHasRoom(date, time, jetskiMachineCount(watercraftPackage))
      if (!hasRoom) {
        return NextResponse.json({ error: 'That time slot is fully booked online — please call or WhatsApp us to check availability.' }, { status: 409 })
      }
    } else if (!isAdmin) {
      const calculatedBaseAmount = await calculatePrice(hotelSlug, pickup || '', destination || '', vehicleType || '', tripType || '', distanceMiles || 0, durationMinutes || 0, time || '', returnTime, returnDestination)
      let expectedFee = 0;
      if (meetingType === 'meet_greet') {
        expectedFee = 25;
      }
      let expectedAmount = calculatedBaseAmount + expectedFee;

      // Discount codes don't apply to deposits — always re-validated
      // server-side, never trusting a discounted total the client sends.
      if (discountCode && !isDeposit) {
        const check = await checkDiscountCode(discountCode, expectedAmount)
        if (check.valid) {
          appliedDiscountCode = check.code
          appliedDiscountAmount = check.discountAmount
          expectedAmount = check.finalAmount
        }
      }

      if (expectedAmount > 0 && Math.abs(expectedAmount - inputTotal) > 0.01) {
        console.warn(`[leads] Price mismatch: input=${inputTotal}, expected=${expectedAmount}. Using calculated price.`)
        finalAmount = expectedAmount
      }
    }

    // Calculate deposit amounts (online Stripe checkout path)
    const depositAmount = isDeposit ? Math.ceil(finalAmount * 0.20) : finalAmount
    const amountRemaining = isDeposit ? finalAmount - depositAmount : 0

    // For reservations entered manually by the admin (CRM "Add Reservation"),
    // how much is already collected comes straight from the admin's input
    // instead of the online-deposit math above — e.g. a reservation booked
    // and paid on an external platform, or in cash.
    const finalAmountPaid = isAdmin && manualAmountPaid !== undefined ? manualAmountPaid : 0
    const finalAmountRemaining = isAdmin && manualAmountRemaining !== undefined ? manualAmountRemaining : amountRemaining
    // For public bookings this must mirror the processor that will actually
    // handle checkout below (same `settings.payment_provider` read) — it
    // used to be hardcoded to 'stripe' even while payment_provider was
    // 'quickbooks', which mislabeled every real QuickBooks booking as
    // Stripe revenue everywhere payment_source gets summed.
    const resolvedPaymentSource = isAdmin
      ? (paymentSource || 'quickbooks')
      : (settings?.payment_provider === 'quickbooks' ? 'quickbooks' : 'stripe')
    const isPaidNow = leadStatus === 'paid' || leadStatus === 'deposit_paid' || leadStatus === 'hotel_b2b'

    // Built server-side (not trusted from the client) so the machine-count
    // parsing in the capacity check above always matches what's actually
    // stored — the "PackageName — Duration" prefix must stay exactly in
    // that shape, extra info goes after a different separator.
    const jetskiServiceDetail = isPublicJetski
      ? `${watercraftPackage} — ${watercraftDuration}` +
        (jetskiTransport === 'one_way' ? ' | One-way transport ($10)' : jetskiTransport === 'round_trip' ? ' | Round trip transport ($20)' : '') +
        (body.bornAfterCutoff === 'yes' ? ' | Boater safety course required (driver born 1988+)' : '')
      : null

    const { data, error } = await supabaseAdmin.from('leads').insert({
      hotel_slug: hotelSlug,
      customer_name: customerName,
      customer_email: customerEmail,
      customer_phone: customerPhone,
      customer_country: customerCountry,
      pickup: isPublicJetski ? '' : pickup,
      destination: isPublicJetski ? '' : destination,
      vehicle_type: vehicleType,
      passengers: passengers || 1,
      date,
      time,
      return_date: returnDate,
      return_time: returnTime,
      return_destination: tripType === 'round-trip' ? (returnDestination || pickup || null) : null,
      amount_usd: finalAmount,
      trip_type: tripType,
      status: leadStatus,
      payment_type: isDeposit ? 'deposit' : 'full',
      amount_paid: finalAmountPaid,
      amount_remaining: finalAmountRemaining,
      payment_source: resolvedPaymentSource,
      external_platform: isAdmin ? (externalPlatform || null) : null,
      external_reference: isAdmin ? (externalReference || null) : null,
      paid_at: isAdmin && isPaidNow ? new Date().toISOString() : null,
      // Set once, at creation, from who actually made this HTTP request —
      // never trust a client-sent "source" field, since a public request
      // could just claim to be manual. isAdmin is the same Bearer-token
      // check that already gates external_platform/paid_at above.
      booking_source: isAdmin ? 'manual' : 'website',
      created_by: isAdmin ? (agentName || null) : null,
      // Only admin "Add Reservation" and the public /jetski page can pick a
      // service other than transport — every other public submission still
      // always defaults to 'transport'.
      service_type: isAdmin && serviceType ? serviceType : isPublicJetski ? 'jet_ski' : 'transport',
      service_detail: isAdmin ? (serviceDetail || null) : jetskiServiceDetail,
      airline,
      flight_number: flightNumber,
      meeting_type: meetingType || 'curbside',
      meet_greet_fee: meetGreetFee || 0,
      car_seats_requested: carSeatsRequested || 0,
      luggage_count: luggageCount || 0,
      notes: notes || null,
      distance_miles: distanceMiles || 0,
      duration_minutes: durationMinutes || 0,
      discount_code: appliedDiscountCode,
      discount_amount: appliedDiscountAmount
    }).select().single()

    if (error) {
      console.error('[leads] supabase insertion error:', error)
      throw error
    }

    // Consumed on lead creation (not on payment) so it lines up with the
    // rest of this route's trust boundary — the same point calendar events
    // and QuickBooks invoices already get created from.
    if (appliedDiscountCode) {
      await redeemDiscountCode(appliedDiscountCode)
    }

    // Create Calendar Event if status warrants it. Admin-entered reservations
    // (CRM "Add Reservation") always get an event immediately, even while
    // still pending payment ('new') — the admin already committed to a real
    // date/time for dispatch, and shouldn't have to wait for the guest to pay
    // online before a driver can see the trip. Public/online leads keep the
    // old behavior (event only once actually paid) so abandoned carts don't
    // clutter the calendar.
    if (isAdmin || data.status === 'hotel_b2b' || data.status === 'paid' || data.status === 'deposit_paid') {
      try {
        let googleEventId = await createCalendarEvent(data);
        let googleReturnEventId = null;
        if (data.trip_type === 'round-trip') {
          googleReturnEventId = await createCalendarEvent(data, true);
        }
        if (googleEventId || googleReturnEventId) {
          await supabaseAdmin
            .from('leads')
            .update({ google_event_id: googleEventId, google_return_event_id: googleReturnEventId })
            .eq('id', data.id);
        }
      } catch(e) { console.error('Calendar err', e) }
    }

    if (isAdmin && isPaidNow && data?.customer_email) {
      await sendManualPaidConfirmation(data, finalAmountPaid)
    }

    // If request is from admin, do not create a Stripe checkout session
    if (isAdmin) {
      return NextResponse.json({ success: true, lead: data })
    }

    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const successUrl = isPublicJetski
      ? `${origin}/jetski?success=true&lead_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`
      : isPromo ? `${origin}/promo/${hotelSlug}/success?lead_id=${data.id}&session_id={CHECKOUT_SESSION_ID}` : `${origin}/hotel/${hotelSlug}/success?lead_id=${data.id}&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = isPublicJetski
      ? `${origin}/jetski#book`
      : isPromo ? `${origin}/promo/${hotelSlug}` : `${origin}/hotel/${hotelSlug}`

    if (isPromo || paymentMode === 'quote') {
      // Return success without URL so the frontend shows the inline success modal instead of redirecting
      return NextResponse.json({ success: true })
    }

    const chargeAmount = isDeposit ? depositAmount : finalAmount
    const productName = isPublicJetski
      ? `Express Lyft Jet Ski Rental: ${watercraftPackage}`
      : isDeposit
        ? `Express Lyft Deposit (20%): ${pickup} to ${destination}`
        : `Express Lyft Reservation: ${pickup} to ${destination}`
    const productDesc = isPublicJetski
      ? `${jetskiServiceDetail} — ${date} at ${time}`
      : isDeposit
        ? `${date} at ${time} | ${vehicleType} | ${passengers} passengers | Deposit: $${chargeAmount} of $${finalAmount} total`
        : `${date} at ${time} | ${vehicleType} | ${passengers} passengers`

    if (settings?.payment_provider === 'quickbooks') {
      try {
        const invoice = await createAndSendInvoice({
          customerName: customerName || customerEmail,
          customerEmail,
          customerPhone,
          amount: chargeAmount,
          description: `${productName} | ${productDesc}`,
          taxAmount: chargeAmount * (FL_TAX_RATE_PERCENT / 100),
        })

        await supabaseAdmin
          .from('leads')
          .update({ quickbooks_invoice_id: invoice.Id, quickbooks_invoice_status: 'sent' })
          .eq('id', data.id)

        if (!invoice.invoiceLink) {
          console.error('[leads] QuickBooks invoice created but no payment link returned for lead', data.id)
          return NextResponse.json({ error: 'Failed to generate a QuickBooks payment link' }, { status: 500 })
        }

        return NextResponse.json({ success: true, url: invoice.invoiceLink, leadId: data.id })
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
        console.error('[leads] QuickBooks invoice creation failed for lead', data.id, errorMsg)
        // The raw QuickBooks API error is logged above for us — it's not
        // something a guest should see (it's often just JSON from Intuit's API).
        const friendlyError = errorMsg.includes('Invalid Email Address')
          ? 'That email address looks invalid — please double check it and try again.'
          : 'We could not start checkout. Please try again, or contact us and we will complete your booking manually.'
        return NextResponse.json({ error: friendlyError }, { status: 500 })
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      invoice_creation: {
        enabled: true,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: Math.round(chargeAmount * 100), // Stripe expects cents
          },
          quantity: 1,
          tax_rates: flTaxRateIds(),
        },
      ],
      mode: 'payment',
      success_url: successUrl,
      cancel_url: cancelUrl,
      customer_email: customerEmail,
      metadata: {
        lead_id: data.id,
        hotel_slug: hotelSlug,
        payment_type: isDeposit ? 'deposit' : 'full',
        total_amount: String(finalAmount),
        charge_amount: String(chargeAmount),
      }
    })

    return NextResponse.json({ success: true, url: session.url })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : JSON.stringify(err)
    console.error('[leads] POST error:', errorMsg, 'Body:', body || 'no-body-read')
    return NextResponse.json({ error: 'Failed to log lead: ' + errorMsg }, { status: 500 })
  }
}


export async function PUT(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { 
      id, status, notes, 
      customerName, customerEmail, customerPhone,
      customer_name, customer_email, customer_phone,
      pickup, destination, vehicleType, vehicle_type,
      passengers, date, time, 
      returnDate, returnTime, return_date, return_time,
      returnDestination, return_destination,
      amountUsd, tripType, assigned_driver_id,
      airline, flightNumber, flight_number,
      meetingType, meeting_type, meetGreetFee, meet_greet_fee,
      carSeatsRequested, car_seats_requested,
      luggageCount, luggage_count,
      waitTimeMinutes, wait_time_minutes,
      waitTimeFee, wait_time_fee,
      trip_completed,
      created_by, booking_source
    } = body

    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

    // Needed to detect a genuine transition INTO a paid state below (e.g.
    // the status dropdown flipped from 'new' to 'paid') — without this we
    // can't tell that apart from an edit to an already-paid lead, which
    // would otherwise re-send the confirmation email on every save.
    const PAID_STATUSES = ['paid', 'deposit_paid', 'hotel_b2b']
    let previousStatus: string | null = null
    if (status !== undefined) {
      const { data: existing } = await supabaseAdmin.from('leads').select('status').eq('id', id).maybeSingle()
      previousStatus = existing?.status ?? null
    }

    const updates: Record<string, string | number | boolean | null> = {}
    if (status !== undefined) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (customerName !== undefined || customer_name !== undefined) updates.customer_name = customerName || customer_name
    if (customerEmail !== undefined || customer_email !== undefined) updates.customer_email = customerEmail || customer_email
    if (customerPhone !== undefined || customer_phone !== undefined) updates.customer_phone = customerPhone || customer_phone
    if (pickup !== undefined) updates.pickup = pickup
    if (destination !== undefined) updates.destination = destination
    if (vehicleType !== undefined || vehicle_type !== undefined) updates.vehicle_type = vehicleType || vehicle_type
    if (passengers !== undefined) updates.passengers = passengers
    if (date !== undefined) updates.date = date
    if (time !== undefined) updates.time = time
    if (returnDate !== undefined || return_date !== undefined) updates.return_date = returnDate || return_date
    if (returnTime !== undefined || return_time !== undefined) updates.return_time = returnTime || return_time
    if (returnDestination !== undefined || return_destination !== undefined) updates.return_destination = returnDestination || return_destination
    if (amountUsd !== undefined) updates.amount_usd = amountUsd
    if (tripType !== undefined) updates.trip_type = tripType
    if (assigned_driver_id !== undefined) updates.assigned_driver_id = assigned_driver_id
    if (airline !== undefined) updates.airline = airline
    if (flightNumber !== undefined || flight_number !== undefined) updates.flight_number = flightNumber || flight_number
    if (meetingType !== undefined || meeting_type !== undefined) updates.meeting_type = meetingType || meeting_type
    if (meetGreetFee !== undefined || meet_greet_fee !== undefined) updates.meet_greet_fee = meetGreetFee || meet_greet_fee
    if (carSeatsRequested !== undefined || car_seats_requested !== undefined) updates.car_seats_requested = carSeatsRequested || car_seats_requested
    if (luggageCount !== undefined || luggage_count !== undefined) updates.luggage_count = luggageCount || luggage_count
    if (waitTimeMinutes !== undefined || wait_time_minutes !== undefined) updates.wait_time_minutes = waitTimeMinutes || wait_time_minutes
    if (waitTimeFee !== undefined || wait_time_fee !== undefined) updates.wait_time_fee = waitTimeFee || wait_time_fee
    if (trip_completed !== undefined) updates.trip_completed = trip_completed
    // Lets the CRM retroactively fix the origin/agent on a lead that predates
    // those fields (e.g. July, before booking_source existed) or correct a
    // wrong pick — see the Edit modal's "Booking Origin" section. Setting the
    // origin back to 'website' is what un-hides those rows from / re-files
    // them in the Commissions "Manual Bookings by Agent" breakdown.
    if (booking_source !== undefined) updates.booking_source = booking_source
    if (created_by !== undefined) updates.created_by = created_by

    const { data, error } = await supabaseAdmin
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select()

    if (error) throw error
    const updatedLead = data?.[0];

    // Calendar sync
    if (updatedLead) {
      try {
        if (updatedLead.google_event_id) {
          await updateCalendarEvent(updatedLead.google_event_id, updatedLead);
        } else if (updatedLead.status === 'paid' || updatedLead.status === 'deposit_paid' || updatedLead.status === 'hotel_b2b') {
          const googleEventId = await createCalendarEvent(updatedLead);
          if (googleEventId) {
            await supabaseAdmin.from('leads').update({ google_event_id: googleEventId }).eq('id', updatedLead.id);
          }
        }

        if (updatedLead.trip_type === 'round-trip') {
          if (updatedLead.google_return_event_id) {
            await updateCalendarEvent(updatedLead.google_return_event_id, updatedLead, true);
          } else if (updatedLead.status === 'paid' || updatedLead.status === 'deposit_paid' || updatedLead.status === 'hotel_b2b') {
            const googleReturnEventId = await createCalendarEvent(updatedLead, true);
            if (googleReturnEventId) {
              await supabaseAdmin.from('leads').update({ google_return_event_id: googleReturnEventId }).eq('id', updatedLead.id);
            }
          }
        }
      } catch (e) {
        console.error('Error syncing calendar on update:', e);
      }

      // Fresh transition into a paid state (e.g. the status dropdown flipped
      // from 'new' to 'paid') — same gap as the creation-time "mark as
      // already paid" path: this never touches Stripe/QuickBooks, so their
      // webhooks never fire. Guarded by previousStatus so re-saving an
      // already-paid lead doesn't re-send the email every time.
      if (
        PAID_STATUSES.includes(updatedLead.status) &&
        !PAID_STATUSES.includes(previousStatus || '')
      ) {
        await sendManualPaidConfirmation(updatedLead, updatedLead.amount_paid ?? updatedLead.amount_usd)
      }
    }

    return NextResponse.json({ success: true, updated: data })
  } catch (err: any) {
    const errorMsg = err?.message || (typeof err === 'string' ? err : 'Unknown error')
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Default: the 200 most recent leads (keeps the main CRM payload small).
    // With ?from=&to= (ISO dates), return everything created in that window
    // instead — the Commissions / calendar views need a full month even when
    // it's older than the last 200 rows, otherwise past months read as $0.
    const from = req.nextUrl.searchParams.get('from')
    const to = req.nextUrl.searchParams.get('to')

    let query = supabaseAdmin
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })

    if (from && to) {
      query = query.gte('created_at', from).lt('created_at', to).limit(5000)
    } else {
      query = query.limit(200)
    }

    const { data, error } = await query

    if (error) throw error
    return NextResponse.json(data)
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  if (!authHeader?.startsWith('Bearer ') || authHeader.split('Bearer ')[1] !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 })

  try {
    const { data: lead } = await supabaseAdmin.from('leads').select('google_event_id, google_return_event_id').eq('id', id).maybeSingle()

    const { error } = await supabaseAdmin
      .from('leads')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (lead?.google_event_id) await deleteCalendarEvent(lead.google_event_id)
    if (lead?.google_return_event_id) await deleteCalendarEvent(lead.google_return_event_id)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: errorMsg }, { status: 500 })
  }
}
