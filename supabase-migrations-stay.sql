-- ============================================================
--  STAY MVP — nuevas tablas, no toca nada existente.
--  Ejecutar en el SQL Editor de Supabase (real y pruebas).
-- ============================================================

create extension if not exists pgcrypto;

-- ---------- stay_hotels ----------
-- Un hotel disponible dentro de Stay. `sort_order` decide el orden
-- (Ocean = 0, siempre primero salvo que Dennis lo cambie).
create table if not exists stay_hotels (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  photo_url         text,
  price             numeric not null,          -- precio por habitación por noche (all-in, huésped ve un solo número)
  transport_amount  numeric not null default 0, -- porción del precio que corresponde al traslado (para impuestos/CRM, no se cobra aparte)
  rooms_available   integer not null default 0, -- inventario simple: se descuenta al pagar, sube manualmente cuando Dennis recarga
  active            boolean not null default true,
  sort_order        integer not null default 100,
  created_at        timestamptz default now(),
  updated_at        timestamptz default now()
);

-- ---------- stay_bookings ----------
create table if not exists stay_bookings (
  id                  uuid primary key default gen_random_uuid(),
  stay_hotel_id       uuid references stay_hotels(id),
  hotel_name          text not null,   -- copia del nombre al momento de reservar (por si el hotel cambia de nombre después)
  room_type           text not null,   -- '1_bed' | '2_beds'
  room_qty            integer not null default 1,
  nights              integer not null default 1,
  check_in_date       text,
  guest_name          text,
  guest_email         text,
  guest_phone         text,
  guest_count         integer default 1,
  airline             text,
  flight_number       text,
  direction           text,   -- 'airport_to_hotel' | 'hotel_to_airport' | 'both'
  pickup_time         text,   -- hora del tramo airport->hotel (o único tramo)
  return_pickup_time  text,   -- hora del tramo hotel->airport (solo si direction = 'both')
  room_amount         numeric not null default 0,
  transport_amount    numeric not null default 0,
  total_amount        numeric not null default 0,
  tax_collected        numeric default 0,
  status              text not null default 'pending_payment', -- pending_payment | paid | cancelled
  stripe_session_id   text,
  lead_id             uuid,   -- transporte tramo 1 (leads.id)
  return_lead_id      uuid,   -- transporte tramo 2, solo si direction = 'both'
  notes               text,
  created_at          timestamptz default now()
);

create index if not exists stay_bookings_hotel_idx on stay_bookings(stay_hotel_id);
create index if not exists stay_bookings_status_idx on stay_bookings(status);

-- ============================================================
--  Descuento de inventario atómico: evita sobreventa por condición de
--  carrera cuando dos pagos llegan casi al mismo tiempo. `found` viene falso
--  si no había suficientes cuartos, y quien la llama debe reaccionar
--  (avisar y no marcar la reserva como confirmada).
-- ============================================================
create or replace function decrement_stay_rooms(p_hotel_id uuid, p_qty integer)
returns boolean
language plpgsql
as $$
declare
  affected integer;
begin
  update stay_hotels
    set rooms_available = rooms_available - p_qty,
        updated_at = now()
    where id = p_hotel_id and rooms_available >= p_qty;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- ============================================================
--  RLS — mismo patrón que el resto del proyecto
-- ============================================================
alter table stay_hotels   enable row level security;
alter table stay_bookings enable row level security;

drop policy if exists "Public read active stay_hotels" on stay_hotels;
create policy "Public read active stay_hotels" on stay_hotels for select using (true);

drop policy if exists "Service role only stay_hotels" on stay_hotels;
create policy "Service role only stay_hotels" on stay_hotels for all using (auth.role() = 'service_role');

drop policy if exists "Public insert stay_bookings" on stay_bookings;
create policy "Public insert stay_bookings" on stay_bookings for insert with check (true);

drop policy if exists "Service role only stay_bookings" on stay_bookings;
create policy "Service role only stay_bookings" on stay_bookings for select using (auth.role() = 'service_role');

-- ============================================================
--  Seed: Ocean (B Ocean Resort) como primer hotel, ya conocido
--  por el negocio de transporte (mismo hotel que /hotel/bocean-resort).
--  Precio/inventario son placeholders — Dennis los ajusta en el admin.
-- ============================================================
insert into stay_hotels (name, photo_url, price, transport_amount, rooms_available, active, sort_order)
values ('Ocean', '/gallery/stay/ocean-pool.jpg', 189, 45, 5, true, 0)
on conflict do nothing;

-- ============================================================
--  Stay pasa de Stripe a QuickBooks (ago 2026) — mismas columnas que
--  leads.quickbooks_invoice_id/status, para que el mismo webhook y el
--  mismo cron de reconciliación cubran ambos tipos de reserva.
-- ============================================================
alter table stay_bookings add column if not exists quickbooks_invoice_id text;
alter table stay_bookings add column if not exists quickbooks_invoice_status text;
