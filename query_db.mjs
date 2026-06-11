import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function test() {
  const { data: routes } = await supabase.from('route_pricing').select('*')
  console.log("ROUTES:", JSON.stringify(routes, null, 2))
  
  const { data: prices } = await supabase.from('pricing').select('*')
  console.log("PRICES:", JSON.stringify(prices, null, 2))
}
test()
