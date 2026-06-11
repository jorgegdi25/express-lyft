import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

async function checkLeads() {
  const supabase = createClient(supabaseUrl, supabaseServiceKey)
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('id', '70b6fbf1-e39d-44d3-9b72-0964eb4e07e1')

  if (error) {
    console.error('Error fetching leads:', error)
  } else {
    console.log('Lead Details:', data)
  }
}

checkLeads()
