import { google } from 'googleapis';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function getCalInfo() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/calendar'],
  });

  const calendar = google.calendar({ version: 'v3', auth });

  try {
    const res = await calendar.calendars.get({ calendarId });
    console.log('NOMBRE DEL CALENDARIO EN EL CÓDIGO:', res.data.summary);
    console.log('ID:', res.data.id);
  } catch (e) {
    console.log('Error getting calendar info:', e.message);
  }
}
getCalInfo();
