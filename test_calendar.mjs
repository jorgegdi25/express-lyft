import { google } from 'googleapis';
import fs from 'fs';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

async function test() {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
    const calendarId = process.env.GOOGLE_CALENDAR_ID;

    console.log('Calendar ID:', calendarId);
    console.log('Service Account Email:', credentials.client_email);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/calendar.events'],
    });

    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: {
        summary: 'PRUEBA DESDE TERMINAL',
        description: 'Esto es una prueba para ver si funciona la conexion.',
        start: {
          dateTime: new Date(Date.now() + 3600000).toISOString(),
          timeZone: 'America/New_York',
        },
        end: {
          dateTime: new Date(Date.now() + 7200000).toISOString(),
          timeZone: 'America/New_York',
        },
      },
    });

    console.log('✅ EXITO! Evento creado con ID:', res.data.id);
  } catch (err) {
    console.error('❌ ERROR AL CREAR EVENTO:');
    console.error(err.message);
  }
}

test();
