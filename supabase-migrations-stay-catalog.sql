-- ============================================================
--  STAY — catálogo ampliado (zona + tipo para filtrar en el admin).
--  Ejecutar en el SQL Editor de Supabase (real y pruebas) ANTES
--  de correr el script de carga de los 127 hoteles de Fort Lauderdale.
-- ============================================================

alter table stay_hotels add column if not exists zone text;
alter table stay_hotels add column if not exists category text;

create index if not exists stay_hotels_zone_idx on stay_hotels(zone);
create index if not exists stay_hotels_category_idx on stay_hotels(category);
