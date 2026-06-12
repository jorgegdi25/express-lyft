import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function execSql(query) {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseServiceKey,
      'Authorization': `Bearer ${supabaseServiceKey}`,
    },
    body: JSON.stringify({ query }),
  })
  
  if (!res.ok) {
    const text = await res.text();
    console.error(`Error executing query:`, text);
  } else {
    console.log(`Successfully executed query`);
  }
}

async function applyChanges() {
  const query = `
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS airline text;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS flight_number text;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'curbside';
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS meet_greet_fee numeric(10,2) DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS car_seats_requested integer DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS luggage_count integer DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS wait_time_minutes integer DEFAULT 0;
    ALTER TABLE leads ADD COLUMN IF NOT EXISTS wait_time_fee numeric(10,2) DEFAULT 0;

    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS airline text;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS flight_number text;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meeting_type text DEFAULT 'curbside';
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS meet_greet_fee numeric(10,2) DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS car_seats_requested integer DEFAULT 0;
    ALTER TABLE bookings ADD COLUMN IF NOT EXISTS luggage_count integer DEFAULT 0;
  `;
  
  await execSql(query);
}

applyChanges();
