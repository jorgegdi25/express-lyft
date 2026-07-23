import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function check() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  const res = await calendar.events.list({
    calendarId,
    timeMin: new Date('2026-07-22').toISOString(),
    timeMax: new Date('2026-08-10').toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
  });

  console.log('=== EVENTOS EN GOOGLE CALENDAR ===\n');
  console.log('Calendar ID:', calendarId);
  console.log('Total eventos:', res.data.items?.length || 0);
  console.log('');
  
  res.data.items?.forEach(event => {
    console.log(`📅 ${event.summary}`);
    console.log(`   Fecha: ${event.start?.dateTime || event.start?.date}`);
    console.log(`   ID: ${event.id}`);
    console.log('');
  });
}
check();
