import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  // 1. Verificar si las columnas de calendario existen
  const { data, error } = await supabase.from('leads').select('id, status, google_event_id, google_return_event_id').limit(1);
  
  if (error) {
    console.log('❌ ERROR - Las columnas de calendario NO existen en la base de datos:', error.message);
    console.log('>> Necesitas correr el SQL en Supabase para agregarlas.');
  } else {
    console.log('✅ Columnas existen. Datos:', JSON.stringify(data, null, 2));
  }
}
test();
