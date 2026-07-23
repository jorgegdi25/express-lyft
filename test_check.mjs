import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: { 'authorization': 'Bearer japtof-micgYg-6behsa' },
  });
  const leads = await res.json();
  
  console.log('=== ÚLTIMAS RESERVAS EN PRUEBAS ===\n');
  leads.forEach((lead, i) => {
    console.log(`#${i+1} | ${lead.customer_name} | Estado: ${lead.status} | Fecha: ${lead.date} ${lead.time}`);
    console.log(`     google_event_id: ${lead.google_event_id || '❌ NULL'}`);
    console.log(`     Creado: ${lead.created_at}`);
    console.log('');
  });
}
test();
