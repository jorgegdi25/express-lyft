-- Distinguish leads created through the public website form from leads
-- entered manually by staff via the CRM's "Add Reservation" modal, and (for
-- manual ones) which sales agent entered them — needed to calculate the
-- manual-entry commission.
--
-- Run this in the Supabase Dashboard → SQL Editor for BOTH projects:
--   1. Pruebas (elymsqzunfaovsuiqesn) first — verify on pruebas.explyft.com
--   2. Real/Production (xqewrfxmxhvbqtovjeio) after it checks out
--
-- payment_source ('stripe' | 'external' | 'cash') answers a DIFFERENT
-- question — how the money was collected — and is not a reliable proxy for
-- who created the reservation, since a manual entry can still be paid via
-- Stripe. booking_source is the new, authoritative field for that.

alter table leads add column if not exists booking_source text;
alter table leads add column if not exists created_by text;

-- Backfill existing rows (best-effort — booking_source didn't exist before
-- this migration, so this is inferred from the only earlier signals that
-- correlate with "entered manually": external_platform/external_reference
-- are ONLY ever set by the admin-entry code path, and payment_source of
-- 'external' or 'cash' can only be chosen from the "Add Reservation" modal.
-- This will misclassify a handful of historical admin-entered leads that
-- were left on Stripe as the payment source — there's no way to recover
-- who created those after the fact).
update leads
set booking_source = 'manual'
where booking_source is null
  and (
    external_platform is not null
    or external_reference is not null
    or payment_source in ('external', 'cash')
  );

update leads
set booking_source = 'website'
where booking_source is null;

-- created_by stays NULL for the backfilled manual rows — we don't know
-- which agent entered them historically. New manual leads always get one
-- (the CRM form requires picking an agent), so leave the column nullable.

alter table leads alter column booking_source set default 'website';
alter table leads alter column booking_source set not null;
