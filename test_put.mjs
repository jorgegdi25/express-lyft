import fetch from 'node-fetch';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function test() {
  // Step 1: Get a real lead ID from the pruebas Supabase
  // We need the pruebas Supabase URL. Let's try via the API directly.
  
  console.log('=== PROBANDO PUT CONTRA pruebas.explyft.com ===\n');
  
  // First, get leads from the admin
  const getRes = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: {
      'authorization': 'Bearer japtof-micgYg-6behsa',
    },
  });
  
  const getResult = await getRes.json();
  
  if (!getRes.ok) {
    console.log('❌ Error al obtener leads:', JSON.stringify(getResult));
    return;
  }
  
  if (!Array.isArray(getResult) || getResult.length === 0) {
    console.log('❌ No hay leads en la base de datos de pruebas');
    return;
  }
  
  const lead = getResult[0];
  console.log('Lead encontrado:', lead.id, '| Estado actual:', lead.status, '| google_event_id:', lead.google_event_id);
  
  // Step 2: Try to update this lead to "paid" status
  console.log('\nCambiando estado a "paid"...');
  const putRes = await fetch('https://pruebas.explyft.com/api/leads', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'authorization': 'Bearer japtof-micgYg-6behsa',
    },
    body: JSON.stringify({
      id: lead.id,
      status: 'paid',
    }),
  });
  
  const putResult = await putRes.json();
  console.log('Respuesta PUT:', JSON.stringify(putResult, null, 2));
  
  if (putRes.ok) {
    console.log('\n✅ PUT exitoso. Revisa tu calendario!');
  } else {
    console.log('\n❌ PUT falló');
  }
}

test().catch(e => console.error(e));
