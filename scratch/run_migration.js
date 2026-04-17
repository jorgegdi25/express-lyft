const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  const sql = `
    create table if not exists route_pricing (
      id uuid primary key default gen_random_uuid(),
      hotel_slug text references hotels(slug) on delete cascade,
      pickup text not null,
      destination text not null,
      suv_price integer not null,
      minivan_price integer not null,
      sprinter_price integer not null,
      updated_at timestamptz default now()
    );

    insert into hotels (slug, name) values
      ('ritz-carlton-miami', 'The Ritz-Carlton, Miami'),
      ('bocean-resort', 'Bocean Resort')
    on conflict (slug) do update set name = excluded.name;

    insert into pricing (vehicle_type, price_usd) values
      ('suv', 120),
      ('minivan', 180),
      ('sprinter', 260)
    on conflict do nothing;

    insert into route_pricing (hotel_slug, pickup, destination, suv_price, minivan_price, sprinter_price) values
      ('bocean-resort', 'The Hotel', 'Miami International Airport (MIA)', 120, 180, 260),
      ('bocean-resort', 'The Hotel', 'Fort Lauderdale Airport (FLL)', 155, 210, 290),
      ('bocean-resort', 'The Hotel', 'Port of Miami (Cruise Terminal)', 130, 190, 270)
    on conflict do nothing;

    alter table route_pricing enable row level security;

    drop policy if exists "Public read route_pricing" on route_pricing;
    create policy "Public read route_pricing" on route_pricing for select using (true);
  `;

  // Supabase JS client doesn't support raw SQL easily unless you have a function or use the REST API for simpler things.
  // However, I can try to run these as individual RPCs if I had a custom function, but I don't.
  // A better way is to use the PostgREST API only for the inserts, and assume the tables were created manually if I can't run SQL.
  // BUT, I can run SQL via the Supabase Dashboard SQL Editor which the user has open.
  
  // Wait, I can use the 'postgres' library if it's available, or just use the Supabase 'rpc' if there's a 'exec_sql' function.
  // There isn't by default.
  
  // Actually, I'll just use the Supabase REST API to perform the inserts manually and skip table creation if I can't.
  // But I WANT to create the table. I'll search if there's a way to run SQL via API.
  // Usually, no, for security reasons.
  
  // I'll ask the user to run the SQL in their dashboard as it's the safest way.
  console.log("Please run the SQL migration manually in the Supabase SQL Editor.");
}

runMigration();
