import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: { 'authorization': 'Bearer japtof-micgYg-6behsa' },
  });
  const leads = await res.json();
  
  // Get the juan andres lead
  const lead = leads.find(l => l.customer_name.includes('juan'));
  if (!lead) { console.log('No encontrado'); return; }
  
  console.log('ID:', lead.id);
  console.log('Status:', lead.status);
  console.log('Date:', lead.date, lead.time);
  console.log('google_event_id:', lead.google_event_id);
  
  // Now try PUT with correct ID
  console.log('\n--- Cambiando a pending ---');
  await fetch('https://pruebas.explyft.com/api/leads', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer japtof-micgYg-6behsa' },
    body: JSON.stringify({ id: lead.id, status: 'pending' }),
  });
  
  await new Promise(r => setTimeout(r, 500));
  
  console.log('--- Cambiando a paid ---');
  const putRes = await fetch('https://pruebas.explyft.com/api/leads', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer japtof-micgYg-6behsa' },
    body: JSON.stringify({ id: lead.id, status: 'paid' }),
  });
  const putResult = await putRes.json();
  console.log('PUT Response updated google_event_id:', putResult.updated?.[0]?.google_event_id);
  
  // Wait and re-check from DB
  await new Promise(r => setTimeout(r, 3000));
  const res2 = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: { 'authorization': 'Bearer japtof-micgYg-6behsa' },
  });
  const leads2 = await res2.json();
  const lead2 = leads2.find(l => l.id === lead.id);
  console.log('\nDespués de 3 seg - google_event_id:', lead2?.google_event_id || '❌ STILL NULL');
}
test();
