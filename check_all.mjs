import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkLeads() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabase
    .from('leads')
    .select('id, created_at, status, payment_type, amount_paid, amount_remaining, amount_usd, customer_name')
    .order('created_at', { ascending: false })
    .limit(10)

  console.log(data)
}

checkLeads()
