import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function testUpdate() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  
  // Try to update the lead to deposit_paid
  console.log('Attempting to update lead to deposit_paid...')
  const { data, error } = await supabase
    .from('leads')
    .update({ status: 'deposit_paid' })
    .eq('id', '70b6fbf1-e39d-44d3-9b72-0964eb4e07e1')
    .select()
    
  if (error) {
    console.log('UPDATE FAILED:', error)
  } else {
    console.log('UPDATE SUCCEEDED:', data)
  }
}

testUpdate()
