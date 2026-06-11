const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkDuplicates() {
  const { data: routes } = await supabase.from('route_pricing').select('*').eq('hotel_slug', 'bocean-resort');
  
  console.log(`Found ${routes.length} total routes for bocean-resort.\n`);

  const seenPaths = new Set();
  const redundancies = [];

  for (const r of routes) {
    const p1 = r.pickup.trim();
    const p2 = r.destination.trim();
    
    // Create a normalized path key (alphabetical order)
    const normalizedKey = p1 < p2 ? `${p1} <-> ${p2}` : `${p2} <-> ${p1}`;
    
    if (seenPaths.has(normalizedKey)) {
      redundancies.push({
        id: r.id,
        pickup: p1,
        destination: p2,
        redundantWith: normalizedKey
      });
    } else {
      seenPaths.add(normalizedKey);
    }
  }

  if (redundancies.length > 0) {
    console.log("Found REDUNDANT routes (e.g. you have both A->B and B->A):");
    redundancies.forEach(r => {
      console.log(`- Route: "${r.pickup}" to "${r.destination}"`);
    });
  } else {
    console.log("No redundant routes found. All routes are unique.");
  }
}
checkDuplicates();
