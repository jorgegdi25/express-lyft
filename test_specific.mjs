import fetch from 'node-fetch';
import { createCalendarEvent } from './lib/calendar.js'; // Actually I can just write the test logic here

async function testCal() {
  const leadData = {
    id: '0638ba60-f6d1-48a2-bb26-6ae677d5f79b',
    customer_name: 'jorge gonzalez mejia p',
    pickup: 'B Ocean Hotel Resort',
    destination: 'Miami International Airport (MIA)',
    status: 'paid',
    date: '2026-07-23',
    time: '10:00 AM',
    trip_type: 'one-way'
  };

  try {
    const res = await fetch('https://pruebas.explyft.com/api/test-calendar');
    console.log(await res.text());
  } catch (e) {
    console.error(e);
  }
}
testCal();
