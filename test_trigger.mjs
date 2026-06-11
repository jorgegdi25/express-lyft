import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkSQL() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  // we can use a standard RPC if available, but if not we can't run raw SQL.
  // Instead, let's just insert a test lead, and update it, to see what happens.
  const { data: lead } = await supabase.from('leads').insert({
    hotel_slug: 'bocean-resort',
    customer_name: 'Test Trigger',
    customer_email: 'test@test.com',
    status: 'pending_payment',
    amount_usd: 100
  }).select().single()
  
  if (!lead) return console.log('failed to insert')
  
  console.log('Inserted:', lead.status)
  
  const { data: updated } = await supabase.from('leads').update({
    status: 'deposit_paid',
    amount_paid: 20,
    amount_remaining: 80
  }).eq('id', lead.id).select().single()
  
  console.log('Updated:', updated)
  
  await supabase.from('leads').delete().eq('id', lead.id)
}

checkSQL()
