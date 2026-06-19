import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function updatePrices() {
  await supabase.from('pricing').update({ price_usd: 35 }).eq('vehicle_type', 'sedan_suv');
  await supabase.from('pricing').update({ price_usd: 65 }).eq('vehicle_type', 'suburban');
  await supabase.from('pricing').update({ price_usd: 250 }).eq('vehicle_type', 'sprinter');
  console.log('Prices updated in DB');
}
updatePrices();
