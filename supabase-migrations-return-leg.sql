-- Round-trip bookings only ever stored one pickup/destination pair, with
-- the return leg assumed to be the exact reverse (e.g. Hotel→Airport out,
-- Airport→Hotel back). Karen needs to enter an asymmetric return leg from
-- the admin CRM (e.g. Hotel→Stadium out, Stadium→Airport back) — nullable,
-- additive columns: null means "same as outbound, reversed" (today's
-- behavior, unchanged for every existing row).
--
-- Run this in the Supabase Dashboard → SQL Editor for BOTH projects:
--   1. Pruebas (elymsqzunfaovsuiqesn) first
--   2. Real/Production (xqewrfxmxhvbqtovjeio) after it checks out

alter table leads add column if not exists return_pickup text;
alter table leads add column if not exists return_destination text;
