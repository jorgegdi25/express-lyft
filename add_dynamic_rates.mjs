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
    ALTER TABLE pricing ADD COLUMN IF NOT EXISTS price_per_mile numeric(10,2) DEFAULT 0.00;
    
    UPDATE pricing SET price_per_mile = 3.50 WHERE vehicle_type = 'sedan_suv';
    UPDATE pricing SET price_per_mile = 5.00 WHERE vehicle_type = 'suburban';
    UPDATE pricing SET price_per_mile = 6.00 WHERE vehicle_type = 'sprinter';
    UPDATE pricing SET price_per_mile = 8.00 WHERE vehicle_type = 'minibus';
    UPDATE pricing SET price_per_mile = 10.00 WHERE vehicle_type = 'coachbus';
  `;
  
  await execSql(query);
}

applyChanges();
