const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function check() {
  const { data, error } = await supabaseAdmin.from('route_pricing').select('*').limit(1);
  if (error) console.error('Error:', error);
  else console.log('Data:', data);
}
check();
