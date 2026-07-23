import { google, calendar_v3 } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];

function getCalendarClient() {
  const serviceAccountKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountKey) {
    throw new Error('Missing GOOGLE_SERVICE_ACCOUNT_KEY');
  }

  const credentials = JSON.parse(serviceAccountKey);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.calendar({ version: 'v3', auth });
}

function getStartAndEndISOStrings(dateStr: string, timeStr: string) {
  const [time, ampm] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  
  if (ampm === 'PM' && hours < 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;

  // Parse as UTC just to easily do date math for the end time
  const d = new Date(`${dateStr}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00Z`);
  const endD = new Date(d.getTime() + 60 * 60 * 1000); // 1 hour duration
  
  // Extract back to string without timezone indicator so Google handles timezone
  const startStr = d.toISOString().replace('Z', '');
  const endStr = endD.toISOString().replace('Z', '');
  
  return { startStr, endStr };
}

export async function createCalendarEvent(lead: any, isReturnTrip = false) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId) return null;

  try {
    const calendar = getCalendarClient();
    
    let summary = `Pickup: ${lead.customer_name} - ${lead.pickup} → ${lead.destination}`;
    let description = `
Reservation ID: ${lead.id}
Customer: ${lead.customer_name}
Email: ${lead.customer_email || 'N/A'}
Phone: ${lead.customer_phone || 'N/A'}
Vehicle: ${lead.vehicle_type}
Passengers: ${lead.passengers}
Luggage: ${lead.luggage_count}
Car Seats: ${lead.car_seats_requested}
Meeting Type: ${lead.meeting_type}
Flight: ${lead.airline || 'N/A'} ${lead.flight_number || ''}
Status: ${lead.status}
Notes: ${lead.notes || 'None'}
    `.trim();

    let eventDate = lead.date;
    let eventTime = lead.time;

    if (isReturnTrip) {
      summary = `Return: ${lead.customer_name} - ${lead.destination} → ${lead.pickup}`;
      eventDate = lead.return_date;
      eventTime = lead.return_time;
      description = "** RETURN TRIP **\n\n" + description;
    }

    if (!eventDate || !eventTime) return null;

    const { startStr, endStr } = getStartAndEndISOStrings(eventDate, eventTime);

    const event: calendar_v3.Schema$Event = {
      summary,
      description,
      start: {
        dateTime: startStr,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endStr,
        timeZone: 'America/New_York',
      },
      // 10 = Green (paid), 5 = Yellow (deposit_paid), 1 = Blue (other)
      colorId: lead.status === 'paid' ? '10' : (lead.status === 'deposit_paid' ? '5' : '1'),
    };

    const res = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    return res.data.id;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

export async function updateCalendarEvent(eventId: string, lead: any, isReturnTrip = false) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId || !eventId) return null;

  try {
    const calendar = getCalendarClient();
    
    let summary = `Pickup: ${lead.customer_name} - ${lead.pickup} → ${lead.destination}`;
    let description = `
Reservation ID: ${lead.id}
Customer: ${lead.customer_name}
Email: ${lead.customer_email || 'N/A'}
Phone: ${lead.customer_phone || 'N/A'}
Vehicle: ${lead.vehicle_type}
Passengers: ${lead.passengers}
Luggage: ${lead.luggage_count}
Car Seats: ${lead.car_seats_requested}
Meeting Type: ${lead.meeting_type}
Flight: ${lead.airline || 'N/A'} ${lead.flight_number || ''}
Status: ${lead.status}
Notes: ${lead.notes || 'None'}
    `.trim();

    let eventDate = lead.date;
    let eventTime = lead.time;

    if (isReturnTrip) {
      summary = `Return: ${lead.customer_name} - ${lead.destination} → ${lead.pickup}`;
      eventDate = lead.return_date;
      eventTime = lead.return_time;
      description = "** RETURN TRIP **\n\n" + description;
    }

    if (!eventDate || !eventTime) return null;

    const { startStr, endStr } = getStartAndEndISOStrings(eventDate, eventTime);

    if (lead.status === 'cancelled') {
      summary = `[CANCELLED] ${summary}`;
    }

    const event: calendar_v3.Schema$Event = {
      summary,
      description,
      start: {
        dateTime: startStr,
        timeZone: 'America/New_York',
      },
      end: {
        dateTime: endStr,
        timeZone: 'America/New_York',
      },
      colorId: lead.status === 'paid' ? '10' : (lead.status === 'deposit_paid' ? '5' : (lead.status === 'cancelled' ? '11' : '1')),
    };

    const res = await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    return res.data.id;
  } catch (error) {
    console.error('Error updating Google Calendar event:', error);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string) {
  const calendarId = process.env.GOOGLE_CALENDAR_ID;
  if (!calendarId || !eventId) return;

  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({
      calendarId,
      eventId,
    });
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
  }
}
