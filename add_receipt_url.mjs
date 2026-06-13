import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function addColumn() {
  const query = `ALTER TABLE leads ADD COLUMN IF NOT EXISTS receipt_url text;`
  
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
    console.log("RPC res:", res.status)
  } catch(e) {}

  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabase.from('leads').select('receipt_url').limit(1)
  if (error) {
    console.log('Error:', error.message)
    console.log(`Please run: ${query}`)
  } else {
    console.log('✅ Column receipt_url exists!')
  }
}

addColumn()
