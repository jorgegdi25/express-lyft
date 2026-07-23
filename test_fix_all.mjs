import fetch from 'node-fetch';

async function fix() {
  const res = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: { 'authorization': 'Bearer japtof-micgYg-6behsa' },
  });
  const leads = await res.json();
  
  for (const lead of leads) {
    if (lead.status === 'paid' && !lead.google_event_id) {
      console.log(`Arreglando: ${lead.customer_name} (${lead.id})...`);
      
      // pending -> paid para disparar el calendario
      await fetch('https://pruebas.explyft.com/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer japtof-micgYg-6behsa' },
        body: JSON.stringify({ id: lead.id, status: 'pending' }),
      });
      await new Promise(r => setTimeout(r, 500));
      await fetch('https://pruebas.explyft.com/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'authorization': 'Bearer japtof-micgYg-6behsa' },
        body: JSON.stringify({ id: lead.id, status: 'paid' }),
      });
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  
  // Verificar
  const res2 = await fetch('https://pruebas.explyft.com/api/leads?t=' + Date.now(), {
    headers: { 'authorization': 'Bearer japtof-micgYg-6behsa' },
  });
  const leads2 = await res2.json();
  leads2.forEach(l => {
    console.log(`${l.customer_name} | google_event_id: ${l.google_event_id || '❌ NULL'}`);
  });
}
fix();
