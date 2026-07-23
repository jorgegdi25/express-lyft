import fetch from 'node-fetch';

async function test() {
  const res = await fetch('https://pruebas.explyft.com/api/leads', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'japtof-micgYg-6behsa'
    },
    body: JSON.stringify({
      id: 'ecd4b46d-0bd6-44bb-b480-be60899fb439',
      status: 'paid'
    })
  });
  console.log(await res.text());
}
test();
