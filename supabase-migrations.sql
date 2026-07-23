create table if not exists hotels (
  slug text primary key,
  name text not null,
  active boolean default true
);

create table if not exists pricing (
  id uuid primary key default gen_random_uuid(),
  vehicle_type text unique not null,
  price_usd integer not null,
  updated_at timestamptz default now()
);


create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text not null,
  stripe_session_id text unique,
  pickup text not null,
  destination text not null,
  date text not null,
  time text not null,
  return_date text,
  return_time text,
  passengers integer not null,
  vehicle_type text not null,
  amount_usd integer not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_country text,
  status text default 'pending',
  created_at timestamptz default now(),
  airline text,
  flight_number text,
  meeting_type text default 'curbside',
  meet_greet_fee integer default 0,
  car_seats_requested integer default 0,
  luggage_count integer default 0
);

create table if not exists route_pricing (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text references hotels(slug) on delete cascade,
  pickup text not null,
  destination text not null,
  sedan_suv_price integer not null,
  suburban_price integer not null,
  sprinter_price integer not null,
  minibus_price integer not null,
  coachbus_price integer not null,
  updated_at timestamptz default now()
);

-- Seed hotels
insert into hotels (slug, name) values
  ('ritz-carlton-miami', 'The Ritz-Carlton, Miami'),
  ('bocean-resort', 'B Ocean Resort')
on conflict (slug) do update set name = excluded.name;

-- Seed pricing
insert into pricing (vehicle_type, price_usd) values
  ('sedan_suv', 120),
  ('suburban', 150),
  ('sprinter', 260),
  ('minibus', 450),
  ('coachbus', 800)
on conflict (vehicle_type) do update set price_usd = excluded.price_usd;


-- Seed route pricing for B Ocean Resort
insert into route_pricing (hotel_slug, pickup, destination, sedan_suv_price, suburban_price, sprinter_price, minibus_price, coachbus_price) values
  ('bocean-resort', 'The Hotel', 'Miami International Airport (MIA)', 120, 150, 260, 450, 800),
  ('bocean-resort', 'The Hotel', 'Fort Lauderdale Airport (FLL)', 155, 180, 290, 500, 850),
  ('bocean-resort', 'The Hotel', 'Port of Miami (Cruise Terminal)', 130, 160, 270, 480, 820)
on conflict do nothing;

-- Row Level Security (optional but recommended)
alter table bookings enable row level security;
alter table pricing enable row level security;
alter table hotels enable row level security;
alter table route_pricing enable row level security;

-- Allow public read on hotels, pricing, and route_pricing (for landing page)
drop policy if exists "Public read hotels" on hotels;
create policy "Public read hotels" on hotels for select using (true);

drop policy if exists "Public read pricing" on pricing;
create policy "Public read pricing" on pricing for select using (true);

drop policy if exists "Public read route_pricing" on route_pricing;
create policy "Public read route_pricing" on route_pricing for select using (true);

-- Restrict bookings to service role only
drop policy if exists "Service role only bookings" on bookings;
create policy "Service role only bookings" on bookings for all using (auth.role() = 'service_role');


create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  hotel_slug text not null,
  customer_name text,
  customer_email text,
  customer_phone text,
  customer_country text,
  pickup text,
  destination text,
  vehicle_type text,
  passengers integer,
  date text,
  time text,
  return_date text,
  return_time text,
  amount_usd integer,
  trip_type text,
  status text default 'new',
  notes text,
  created_at timestamptz default now(),
  airline text,
  flight_number text,
  meeting_type text default 'curbside',
  meet_greet_fee integer default 0,
  car_seats_requested integer default 0,
  luggage_count integer default 0,
  wait_time_minutes integer default 0,
  wait_time_fee integer default 0
);

-- Allow public insert on leads (for tracking)
drop policy if exists "Public insert leads" on leads;
create policy "Public insert leads" on leads for insert with check (true);

-- Restrict read to service role
drop policy if exists "Service role only leads" on leads;
create policy "Service role only leads" on leads for select using (auth.role() = 'service_role');

-- Create clients table
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text unique not null,
  phone text,
  hotel_slug text,
  total_trips integer default 0,
  total_spent integer default 0,
  status text default 'active',
  last_trip_date text,
  notes text,
  created_at timestamptz default now()
);

-- Enable RLS on clients
alter table clients enable row level security;

-- Restrict clients to service role only
drop policy if exists "Service role only clients" on clients;
create policy "Service role only clients" on clients for all using (auth.role() = 'service_role');


-- Dynamic Pricing Update
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_per_mile_sedan_suv numeric(10,2) DEFAULT 4.00;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_per_mile_suburban numeric(10,2) DEFAULT 5.00;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_per_mile_sprinter numeric(10,2) DEFAULT 8.00;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_per_mile_minibus numeric(10,2) DEFAULT 12.00;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS price_per_mile_coachbus numeric(10,2) DEFAULT 20.00;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS distance_miles numeric(10,2) DEFAULT 0;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS duration_minutes numeric(10,2) DEFAULT 0;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS distance_miles numeric(10,2) DEFAULT 0;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS duration_minutes numeric(10,2) DEFAULT 0;

ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_event_id text;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS google_return_event_id text;

