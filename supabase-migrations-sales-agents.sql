-- Sales agents are now managed from the CRM ("Sales Agent" picker on the
-- "Add Reservation" modal → "+ Add Agent") instead of being a hardcoded
-- list in the code, so adding/retiring an agent doesn't need a deploy.
--
-- Run this in the Supabase Dashboard → SQL Editor for BOTH projects (same
-- order as supabase-migrations-booking-source.sql):
--   1. Pruebas (elymsqzunfaovsuiqesn) first
--   2. Real/Production (xqewrfxmxhvbqtovjeio) after it checks out

create table if not exists sales_agents (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Seed the two agents already in use so existing leads.created_by values
-- ('Dennis Rivera', 'Karen Hernandez') have a matching row with the same
-- colors already shown in the CRM.
insert into sales_agents (name, color)
values
  ('Dennis Rivera', '#fb923c'),
  ('Karen Hernandez', '#a78bfa')
on conflict (name) do nothing;
