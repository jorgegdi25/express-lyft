import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Use the PostgREST SQL endpoint directly
async function addColumns() {
  const queries = [
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full'`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0`,
    `ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_remaining numeric DEFAULT 0`,
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
        // Try the pg_query approach
        const res2 = await fetch(`${supabaseUrl}/pg`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': supabaseServiceKey,
            'Authorization': `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ query }),
        })
        if (!res2.ok) {
          console.log(`⚠️ Could not run SQL automatically.`)
        }
      }
    } catch(e) {
      // continue
    }
  }

  // Verify columns exist
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabase
    .from('leads')
    .select('payment_type, amount_paid, amount_remaining')
    .limit(1)

  if (error) {
    console.log('❌ Columns still missing. You need to add them manually.')
    console.log('')
    console.log('Go to Supabase Dashboard → SQL Editor and run:')
    console.log('')
    console.log(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS payment_type text DEFAULT 'full';`)
    console.log(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_paid numeric DEFAULT 0;`)
    console.log(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS amount_remaining numeric DEFAULT 0;`)
    console.log('')
    console.log('Error:', error.message)
  } else {
    console.log('✅ All 3 columns exist and are working!')
  }
}

addColumns()
