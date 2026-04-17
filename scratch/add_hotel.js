const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addHotel() {
  const { data, error } = await supabase
    .from('hotels')
    .upsert({ slug: 'bocean-resort', name: 'Bocean Resort', active: true })
    .select();

  if (error) {
    console.error('Error adding hotel:', error);
    process.exit(1);
  }

  console.log('Hotel added successfully:', data);
}

addHotel();
