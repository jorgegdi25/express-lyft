import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function run() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS drivers (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      phone text NOT NULL,
      vehicle_type text NOT NULL,
      license_plate text NOT NULL,
      status text DEFAULT 'available',
      created_at timestamp with time zone DEFAULT now()
    );`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES drivers(id);`
  ]

  for (const query of queries) {
    try {
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
        console.error('Failed to run query via exec_sql:', query)
      }
    } catch(e) {
      console.error(e)
    }
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabase.from('drivers').select('id').limit(1)
  
  if (error) {
    console.log('❌ Failed to verify drivers table.')
    console.log('Go to Supabase Dashboard -> SQL Editor and run:')
    console.log(`
CREATE TABLE IF NOT EXISTS drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text NOT NULL,
  license_plate text NOT NULL,
  status text DEFAULT 'available',
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE leads ADD COLUMN IF NOT EXISTS assigned_driver_id uuid REFERENCES drivers(id);
    `)
  } else {
    console.log('✅ Drivers table created and assigned_driver_id column added to leads!')
  }
}

run()
