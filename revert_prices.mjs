import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function revertPrices() {
  await supabase.from('pricing').update({ price_usd: 120 }).eq('vehicle_type', 'sedan_suv');
  await supabase.from('pricing').update({ price_usd: 180 }).eq('vehicle_type', 'suburban');
  await supabase.from('pricing').update({ price_usd: 260 }).eq('vehicle_type', 'sprinter');
  console.log('Prices reverted in DB');
}
revertPrices();
