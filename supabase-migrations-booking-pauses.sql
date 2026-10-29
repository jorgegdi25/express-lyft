-- ============================================================
--  BOOKING PAUSES — el equipo pausa las reservas online en una franja
--  (ej. 30 oct, 9:00–10:00 AM) cuando está saturado. Bloquea la HORA DE
--  RECOGIDA (y la de regreso del round trip) en el sitio principal, las
--  páginas de hotel y /jetski. Las reservas manuales del CRM no se bloquean.
--
--  start_at / end_at son hora de pared de Miami (America/New_York), sin
--  zona horaria — igual que leads.date + leads.time. La franja es
--  [start_at, end_at): 9:00–10:00 bloquea 9:00…9:45, deja libre 10:00.
--
--  Ejecutar en el SQL Editor de Supabase:
--    1. Pruebas (elymsqzunfaovsuiqesn) primero
--    2. Producción (xqewrfxmxhvbqtovjeio) solo con el OK de Jorge
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists booking_pauses (
  id           uuid primary key default gen_random_uuid(),
  service_type text not null default 'all' check (service_type in ('transport', 'jet_ski', 'all')),
  start_at     timestamp not null,
  end_at       timestamp not null,
  reason       text,
  created_at   timestamptz default now(),
  check (end_at > start_at)
);

create index if not exists booking_pauses_end_at_idx on booking_pauses(end_at);

-- Solo el backend (service role); el sitio las lee vía /api/public/booking-pauses.
alter table booking_pauses enable row level security;

drop policy if exists "Service role only booking_pauses" on booking_pauses;
create policy "Service role only booking_pauses" on booking_pauses for all using (auth.role() = 'service_role');
