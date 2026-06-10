const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // 1. Check current price for "B Ocean Hotel Resort" → "Miami International Airport (MIA)"
  const { data: before } = await supabase.from('route_pricing')
    .select('id, pickup, destination, sedan_suv_price, suburban_price, sprinter_price')
    .eq('pickup', 'B Ocean Hotel Resort')
    .eq('destination', 'Miami International Airport (MIA)')
    .single();
  
  console.log("BEFORE:", before);

  // 2. Update sedan_suv_price to 99 as a test
  const { error } = await supabase.from('route_pricing')
    .update({ sedan_suv_price: 99 })
    .eq('id', before.id);
  
  if (error) {
    console.error("Update error:", error);
    return;
  }
  console.log("Updated sedan_suv_price to $99");

  // 3. Check if the public API reflects the change
  const apiUrl = 'https://express-lyft.vercel.app/api/public/prices?hotel_slug=bocean-resort';
  console.log(`\nFetching: ${apiUrl}`);
  
  const res = await fetch(apiUrl);
  const data = await res.json();
  
  const matchingRoute = data.routePrices.find(r => 
    r.pickup === 'B Ocean Hotel Resort' && r.destination === 'Miami International Airport (MIA)'
  );
  
  if (matchingRoute) {
    console.log("API returns for this route:", {
      sedan_suv: matchingRoute.sedan_suv_price,
      suburban: matchingRoute.suburban_price,
      sprinter: matchingRoute.sprinter_price,
    });
    
    if (matchingRoute.sedan_suv_price === 99) {
      console.log("✅ API correctly returns the updated price ($99)!");
    } else {
      console.log("❌ API still shows old price:", matchingRoute.sedan_suv_price);
    }
  }

  // 4. Revert back to 150
  await supabase.from('route_pricing')
    .update({ sedan_suv_price: 150 })
    .eq('id', before.id);
  console.log("Reverted back to $150");
}
test();
