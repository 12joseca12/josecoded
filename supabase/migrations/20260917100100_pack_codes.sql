-- Task 1.8 (DT §0b, plan v2.1). Codes, list prices and weeks live in this migration, by slug.
-- The inherited packs were cumulative modules; ordering 1..4 <-> P1..P4 holds because P2-P4 of tarifas are cumulative too.
-- `pricing:sync-db` only generates supabase/generated/pricing-sync.sql (UPDATE by code), applied by the controller.
alter table public.pack_templates
  add column code text unique check (code ~ '^P[1-4]$'),
  add column price numeric,
  add column weeks int,
  -- Version of pricing.json the price comes from; request_upgrade() stamps it on the request.
  add column pricing_version text;
alter table public.pack_extras add column code text unique;

update public.pack_templates set code = 'P1', price = 900,  weeks = 1, nombre = 'Web básica',                 pricing_version = '2026-09-14' where slug = 'landing';
update public.pack_templates set code = 'P2', price = 1400, weeks = 2, nombre = 'Pedidos / reservas',         pricing_version = '2026-09-14' where slug = 'gestion-logica';
update public.pack_templates set code = 'P3', price = 2500, weeks = 2, nombre = 'Gestión',                    pricing_version = '2026-09-14' where slug = 'crm-cms';
update public.pack_templates set code = 'P4', price = 4200, weeks = 3, nombre = 'Gestión + automatizaciones', pricing_version = '2026-09-14' where slug = 'automatizaciones';
