require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseAdmin = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function getHotelData(slug) {
  const [hotelRes, pricingRes, routePricingRes] = await Promise.all([
    supabaseAdmin.from('hotels').select('slug, name').eq('slug', slug).eq('active', true).maybeSingle(),
    supabaseAdmin.from('pricing').select('vehicle_type, price_usd'),
    supabaseAdmin.from('route_pricing').select('*').eq('hotel_slug', slug),
  ])

  let hotel = hotelRes.data
  if (!hotel) {
    if (slug === 'demo' || slug === 'bocean-resort') {
      hotel = { slug: slug, name: 'B Ocean Resort' }
    } else {
      return null
    }
  }

  return hotel;
}

getHotelData('bocean-resort').then(console.log).catch(console.error);
