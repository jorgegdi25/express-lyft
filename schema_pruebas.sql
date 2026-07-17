-- ============================================================
--  ESQUEMA COMPLETO PARA LA BASE DE PRUEBAS (Express Lyft)
--  Generado desde la estructura REAL actual (17 jul 2026).
-- ============================================================
--
--  #############################################################
--  ##  !!! ADVERTENCIA - LEER ANTES DE DARLE "RUN" !!!        ##
--  ##                                                         ##
--  ##  Este script BORRA y recrea las 7 tablas.              ##
--  ##  CORRERLO SOLO EN EL PROYECTO "Express Lyft Pruebas".  ##
--  ##  NUNCA en "Express Lyft" (el real que cobra dinero).   ##
--  ##                                                         ##
--  ##  Antes de darle Run, mira arriba a la izquierda del    ##
--  ##  dashboard: DEBE decir "Express Lyft Pruebas".         ##
--  #############################################################
--
--  Uso: pegar TODO esto en el SQL Editor del proyecto de
--       PRUEBAS y darle "Run". Crea la estructura vacia y
--       correcta. No copia datos de clientes.
-- ============================================================

-- Borra las tablas viejas/mal hechas del intento anterior
-- (seguro en PRUEBAS porque ahi no hay datos reales)
drop table if exists route_pricing cascade;
drop table if exists bookings      cascade;
drop table if exists leads         cascade;
drop table if exists clients       cascade;
drop table if exists drivers       cascade;
drop table if exists pricing       cascade;
drop table if exists hotels        cascade;

-- Extension para generar los IDs (uuid)
create extension if not exists pgcrypto;

-- ---------- 1. hotels ----------
create table if not exists hotels (
  slug   text primary key,
  name   text not null,
  active boolean default true
);

-- ---------- 2. pricing (precios por vehiculo + precio dinamico) ----------
create table if not exists pricing (
  id              uuid primary key default gen_random_uuid(),
  vehicle_type    text unique not null,
  price_usd       integer not null,
  updated_at      timestamptz default now(),
  price_per_mile  numeric,
  price_per_minute numeric,
  min_price       numeric,
  max_price       numeric,
  multiplier      numeric
);

-- ---------- 3. route_pricing (precios por ruta) ----------
create table if not exists route_pricing (
  id             uuid primary key default gen_random_uuid(),
  hotel_slug     text references hotels(slug) on delete cascade,
  pickup         text not null,
  destination    text not null,
  sedan_suv_price integer not null,
  suburban_price  integer not null,
  sprinter_price  integer not null,
  minibus_price   integer not null,
  coachbus_price  integer not null,
  updated_at      timestamptz default now()
);

-- ---------- 4. drivers (choferes) ----------
create table if not exists drivers (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  phone         text,
  vehicle_type  text,
  license_plate text,
  status        text default 'active',
  created_at    timestamptz default now()
);

-- ---------- 5. bookings (reservas pagadas) ----------
create table if not exists bookings (
  id                uuid primary key default gen_random_uuid(),
  hotel_slug        text not null,
  stripe_session_id text,
  pickup            text,
  destination       text,
  date              text,
  time              text,
  return_date       text,
  return_time       text,
  passengers        integer,
  vehicle_type      text,
  amount_usd        integer,
  status            text default 'pending',
  created_at        timestamptz default now(),
  customer_name     text,
  customer_email    text,
  customer_phone    text,
  customer_country  text,
  airline           text,
  flight_number     text,
  meeting_type      text default 'curbside',
  meet_greet_fee    integer default 0,
  car_seats_requested integer default 0,
  luggage_count     integer default 0,
  distance_miles    numeric,
  duration_minutes  numeric
);

-- ---------- 6. leads (cotizaciones / solicitudes) ----------
create table if not exists leads (
  id                uuid primary key default gen_random_uuid(),
  hotel_slug        text not null,
  customer_name     text,
  customer_email    text,
  customer_phone    text,
  pickup            text,
  destination       text,
  vehicle_type      text,
  status            text default 'new',
  notes             text,
  created_at        timestamptz default now(),
  date              text,
  time              text,
  return_date       text,
  return_time       text,
  passengers        integer,
  amount_usd        integer,
  trip_type         text,
  customer_country  text,
  payment_type      text,
  amount_paid       numeric,
  amount_remaining  numeric,
  airline           text,
  flight_number     text,
  meeting_type      text default 'curbside',
  meet_greet_fee    integer default 0,
  car_seats_requested integer default 0,
  luggage_count     integer default 0,
  wait_time_minutes integer default 0,
  wait_time_fee     integer default 0,
  assigned_driver_id uuid,
  distance_miles    numeric,
  duration_minutes  numeric
);

-- ---------- 7. clients (clientes recurrentes) ----------
create table if not exists clients (
  id             uuid primary key default gen_random_uuid(),
  name           text not null,
  email          text unique not null,
  phone          text,
  hotel_slug     text,
  total_trips    integer default 0,
  total_spent    numeric default 0,
  status         text default 'active',
  last_trip_date text,
  notes          text,
  created_at     timestamptz default now()
);

-- ============================================================
--  SEGURIDAD (RLS) - igual que en la base real
-- ============================================================
alter table hotels        enable row level security;
alter table pricing       enable row level security;
alter table route_pricing enable row level security;
alter table bookings      enable row level security;
alter table leads         enable row level security;
alter table clients       enable row level security;
alter table drivers       enable row level security;

-- Lectura publica (lo que ve el cliente en el sitio)
drop policy if exists "Public read hotels"        on hotels;
create policy "Public read hotels"        on hotels        for select using (true);
drop policy if exists "Public read pricing"       on pricing;
create policy "Public read pricing"       on pricing       for select using (true);
drop policy if exists "Public read route_pricing" on route_pricing;
create policy "Public read route_pricing" on route_pricing for select using (true);

-- El cliente puede crear una solicitud (lead)
drop policy if exists "Public insert leads" on leads;
create policy "Public insert leads" on leads for insert with check (true);

-- Solo el servidor (service_role) ve/gestiona datos sensibles
drop policy if exists "Service role only bookings" on bookings;
create policy "Service role only bookings" on bookings for all    using (auth.role() = 'service_role');
drop policy if exists "Service role only leads"    on leads;
create policy "Service role only leads"    on leads    for select using (auth.role() = 'service_role');
drop policy if exists "Service role only clients"  on clients;
create policy "Service role only clients"  on clients  for all    using (auth.role() = 'service_role');
drop policy if exists "Service role only drivers"  on drivers;
create policy "Service role only drivers"  on drivers  for all    using (auth.role() = 'service_role');

-- ============================================================
--  LISTO. Estructura creada, vacia y segura.
-- ============================================================
