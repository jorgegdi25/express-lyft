import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function allowed(req: NextRequest) {
  return process.env.NODE_ENV === 'development' && Boolean(process.env.ADMIN_PASSWORD)
    && req.headers.get('authorization') === `Bearer ${process.env.ADMIN_PASSWORD}`;
}

export async function GET(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const results: Record<string, string> = {};

  // 1. Check env vars exist
  results.GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ? '✅ Exists' : '❌ MISSING';
  results.GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Exists' : '❌ MISSING';

  // 2. Try to parse the service account key
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      results.KEY_PARSE = '✅ Valid JSON';
    } catch {
      results.KEY_PARSE = '❌ INVALID JSON';
    }
  }

  return NextResponse.json(results, { headers: { 'Cache-Control': 'no-store' } });
}

// Creating a diagnostic event is an explicit, authenticated development
// action. Visiting a link must never write to the business calendar.
export async function POST(req: NextRequest) {
  if (!allowed(req)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const results: Record<string, string> = {};

  // 3. Try to create a test event
  try {
    const { createCalendarEvent } = await import('@/lib/calendar');
    const fakeLeadData = {
      id: 'test-diagnostic',
      customer_name: 'DIAGNOSTICO PRUEBA',
      customer_email: 'test@test.com',
      customer_phone: '555-0000',
      pickup: 'Test Airport',
      destination: 'Test Hotel',
      vehicle_type: 'sedan',
      passengers: 1,
      luggage_count: 0,
      car_seats_requested: 0,
      meeting_type: 'curbside',
      airline: 'Test',
      flight_number: '000',
      status: 'paid',
      notes: 'Evento de diagnostico - borrar',
      date: new Date().toISOString().split('T')[0],
      time: '12:00 PM',
      trip_type: 'one-way',
    };
    const eventId = await createCalendarEvent(fakeLeadData);
    results.CALENDAR_EVENT = eventId ? `✅ CREATED! Event ID: ${eventId}` : '❌ Returned null (check logs)';
  } catch (e: unknown) {
    console.error('Calendar diagnostic failed', e);
    results.CALENDAR_EVENT = '❌ ERROR: Check server logs';
  }

  return NextResponse.json(results, { status: 200 });
}
