import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function fix() {
  console.log("Fixing pricing vehicle types...");
  await supabase.from('pricing').update({ vehicle_type: 'sedan_suv' }).eq('vehicle_type', 'suv');
  await supabase.from('pricing').update({ vehicle_type: 'suburban' }).eq('vehicle_type', 'minivan');

  console.log("Fetching route_pricing...");
  const { data: routes } = await supabase.from('route_pricing').select('*').order('updated_at', { ascending: false });
  
  const seen = new Set();
  const toDelete = [];

  for (const r of routes) {
    const p1 = r.pickup.trim();
    const p2 = r.destination.trim();
    const key = r.hotel_slug + '|' + (p1 < p2 ? p1 + '|' + p2 : p2 + '|' + p1);
    
    if (seen.has(key)) {
      toDelete.push(r.id);
    } else {
      seen.add(key);
    }
  }

  if (toDelete.length > 0) {
    console.log("Deleting duplicate routes:", toDelete);
    const { error } = await supabase.from('route_pricing').delete().in('id', toDelete);
    if (error) {
      console.error("Error deleting duplicates:", error);
    } else {
      console.log("Deleted", toDelete.length, "duplicate routes.");
    }
  } else {
    console.log("No duplicate routes found.");
  }
}
fix().then(() => console.log("Done"));
