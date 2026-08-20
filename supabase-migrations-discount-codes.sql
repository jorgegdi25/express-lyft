-- ============================================================
--  DISCOUNT CODES — códigos por cliente (% o monto fijo), usos
--  limitados o ilimitados, expiración opcional, monto mínimo opcional.
--  Ejecutar en el SQL Editor de Supabase (real y pruebas).
-- ============================================================

create extension if not exists pgcrypto;

create table if not exists discount_codes (
  id           uuid primary key default gen_random_uuid(),
  code         text not null unique,       -- siempre guardado en mayúsculas
  type         text not null,              -- 'percent' | 'fixed'
  value        numeric not null,           -- 5 = 5% si type=percent, o $5 si type=fixed
  max_uses     integer,                    -- null = ilimitado
  uses_count   integer not null default 0,
  expires_at   timestamptz,                -- null = no expira
  min_amount   numeric,                    -- null = sin mínimo
  active       boolean not null default true,
  client_name  text,                       -- a quién pertenece (ej. "Uber Corporate")
  notes        text,
  created_at   timestamptz default now()
);

create index if not exists discount_codes_code_idx on discount_codes(code);

-- ============================================================
--  Canje atómico: evita condición de carrera si dos reservas usan el
--  mismo código casi al mismo tiempo cuando le queda 1 uso disponible.
-- ============================================================
create or replace function redeem_discount_code(p_code text)
returns boolean
language plpgsql
as $$
declare
  affected integer;
begin
  update discount_codes
    set uses_count = uses_count + 1
    where code = p_code
      and active = true
      and (max_uses is null or uses_count < max_uses);
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

-- ============================================================
--  RLS — mismo patrón que el resto del proyecto: solo el service role
--  (el backend) puede leer/escribir. Nunca se consulta directo desde
--  el navegador, siempre a través de /api/discount-codes/validate.
-- ============================================================
alter table discount_codes enable row level security;

drop policy if exists "Service role only discount_codes" on discount_codes;
create policy "Service role only discount_codes" on discount_codes for all using (auth.role() = 'service_role');

-- ============================================================
--  Registrar qué código (si alguno) se usó en cada reserva.
-- ============================================================
alter table leads add column if not exists discount_code text;
alter table leads add column if not exists discount_amount numeric default 0;

alter table stay_bookings add column if not exists discount_code text;
alter table stay_bookings add column if not exists discount_amount numeric default 0;
