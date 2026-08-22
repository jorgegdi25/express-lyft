-- Dennis also sells Jet Ski and Boat rentals (not just transport), and
-- wants those bookable from the same manual "Add Reservation" flow in the
-- CRM, tagged by service type so revenue can be broken down in the stats
-- (e.g. "$X from Jet Ski this month" separate from transport).
--
-- Run this in the Supabase Dashboard → SQL Editor for BOTH projects:
--   1. Pruebas (elymsqzunfaovsuiqesn) first
--   2. Real/Production (xqewrfxmxhvbqtovjeio) after it checks out

alter table leads add column if not exists service_type text;
alter table leads add column if not exists service_detail text;

-- Every existing row is a transport booking — that's the only thing this
-- table has ever held until now.
update leads set service_type = 'transport' where service_type is null;

alter table leads alter column service_type set default 'transport';
alter table leads alter column service_type set not null;
