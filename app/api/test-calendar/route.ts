import { NextResponse } from 'next/server';
import { createCalendarEvent } from '@/lib/calendar';

export const dynamic = 'force-dynamic';

export async function GET() {
  const results: Record<string, string> = {};

  // 1. Check env vars exist
  results.GOOGLE_CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ? '✅ Exists' : '❌ MISSING';
  results.GOOGLE_SERVICE_ACCOUNT_KEY = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ? '✅ Exists' : '❌ MISSING';

  // 2. Try to parse the service account key
  if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
      results.KEY_PARSE = '✅ Valid JSON';
      results.CLIENT_EMAIL = parsed.client_email || '❌ No client_email';
    } catch (e: any) {
      results.KEY_PARSE = '❌ INVALID JSON: ' + e.message;
    }
  }

  // 3. Try to create a test event
  try {
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
  } catch (e: any) {
    results.CALENDAR_EVENT = '❌ ERROR: ' + e.message;
  }

  return NextResponse.json(results, { status: 200 });
}
