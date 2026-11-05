create type public.catalog_platform as enum ('web', 'app');
create type public.extra_billing as enum ('once', 'monthly', 'yearly', 'per_unit');

create table public.offers (
  slug text primary key,
  platform public.catalog_platform not null,
  name_es text not null,
  name_en text not null,
  price numeric(10, 2),
  weeks_min integer not null,
  weeks_max integer not null,
  includes_es text[] not null default '{}',
  includes_en text[] not null default '{}',
  visible boolean not null default true,
  sort integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint offers_slug_closed check (
    slug in ('web-presencia', 'web-negocio', 'web-plataforma', 'app-primera-version', 'app-producto')
  ),
  constraint offers_slug_matches_platform check (slug like platform::text || '-%'),
  constraint offers_names_length check (
    char_length(btrim(name_es)) between 1 and 120 and char_length(btrim(name_en)) between 1 and 120
  ),
  constraint offers_price_range check (price is null or (price >= 0 and price < 10000000)),
  constraint offers_weeks_range check (weeks_min > 0 and weeks_max >= weeks_min and weeks_max <= 104),
  constraint offers_includes_size check (
    cardinality(includes_es) <= 12 and cardinality(includes_en) <= 12
  )
);

create table public.extras (
  slug text primary key,
  name_es text not null,
  name_en text not null,
  price numeric(10, 2),
  billing public.extra_billing not null default 'once',
  visible boolean not null default true,
  sort integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint extras_slug_shape check (slug ~ '^[a-z][a-z0-9-]*$' and char_length(slug) <= 40),
  constraint extras_names_length check (
    char_length(btrim(name_es)) between 1 and 120 and char_length(btrim(name_en)) between 1 and 120
  ),
  constraint extras_price_range check (price is null or (price >= 0 and price < 10000000))
);

create table public.rates (
  code text primary key,
  label_es text not null,
  label_en text not null,
  price numeric(10, 2),
  visible boolean not null default true,
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rates_code_closed check (code in ('hourly', 'task_min')),
  constraint rates_labels_length check (
    char_length(btrim(label_es)) between 1 and 120 and char_length(btrim(label_en)) between 1 and 120
  ),
  constraint rates_price_range check (price is null or (price >= 0 and price < 10000000))
);

create table public.maintenance_plans (
  slug text primary key,
  name_es text not null,
  name_en text not null,
  price_monthly numeric(10, 2),
  includes_es text[] not null default '{}',
  includes_en text[] not null default '{}',
  visible boolean not null default true,
  sort integer not null default 0,
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint maintenance_plans_slug_shape check (slug ~ '^[a-z][a-z0-9-]*$' and char_length(slug) <= 40),
  constraint maintenance_plans_names_length check (
    char_length(btrim(name_es)) between 1 and 120 and char_length(btrim(name_en)) between 1 and 120
  ),
  constraint maintenance_plans_price_range check (
    price_monthly is null or (price_monthly >= 0 and price_monthly < 10000000)
  ),
  constraint maintenance_plans_includes_size check (
    cardinality(includes_es) <= 12 and cardinality(includes_en) <= 12
  )
);

create table public.price_changes (
  id bigint generated always as identity primary key,
  table_name text not null,
  row_id text not null,
  field text not null,
  before text,
  after text,
  changed_by uuid,
  changed_at timestamptz not null default now()
);

create index price_changes_row_idx on public.price_changes (table_name, row_id, changed_at desc);

alter table public.offers enable row level security;
alter table public.extras enable row level security;
alter table public.rates enable row level security;
alter table public.maintenance_plans enable row level security;
alter table public.price_changes enable row level security;

revoke all on public.offers from anon, authenticated;
revoke all on public.extras from anon, authenticated;
revoke all on public.rates from anon, authenticated;
revoke all on public.maintenance_plans from anon, authenticated;
revoke all on public.price_changes from anon, authenticated;

create function private.track_price_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_field text;
  v_old jsonb := to_jsonb(old);
  v_new jsonb := to_jsonb(new);
  v_row_id text := coalesce(v_new ->> 'slug', v_new ->> 'code');
begin
  foreach v_field in array tg_argv loop
    if v_old ->> v_field is distinct from v_new ->> v_field then
      insert into public.price_changes (table_name, row_id, field, before, after, changed_by)
      values (tg_table_name, v_row_id, v_field, v_old ->> v_field, v_new ->> v_field, auth.uid());
    end if;
  end loop;
  return null;
end;
$$;

revoke all on function private.track_price_change() from public, anon, authenticated;

create trigger offers_set_updated_at
before update on public.offers
for each row execute function private.set_updated_at();

create trigger extras_set_updated_at
before update on public.extras
for each row execute function private.set_updated_at();

create trigger rates_set_updated_at
before update on public.rates
for each row execute function private.set_updated_at();

create trigger maintenance_plans_set_updated_at
before update on public.maintenance_plans
for each row execute function private.set_updated_at();

create trigger offers_track_price_change
after update on public.offers
for each row
when (
  old.price is distinct from new.price
  or old.visible is distinct from new.visible
  or old.archived_at is distinct from new.archived_at
)
execute function private.track_price_change('price', 'visible', 'archived_at');

create trigger extras_track_price_change
after update on public.extras
for each row
when (
  old.price is distinct from new.price
  or old.visible is distinct from new.visible
  or old.archived_at is distinct from new.archived_at
)
execute function private.track_price_change('price', 'visible', 'archived_at');

create trigger rates_track_price_change
after update on public.rates
for each row
when (old.price is distinct from new.price or old.visible is distinct from new.visible)
execute function private.track_price_change('price', 'visible');

create trigger maintenance_plans_track_price_change
after update on public.maintenance_plans
for each row
when (
  old.price_monthly is distinct from new.price_monthly
  or old.visible is distinct from new.visible
  or old.archived_at is distinct from new.archived_at
)
execute function private.track_price_change('price_monthly', 'visible', 'archived_at');

grant select on public.offers, public.extras, public.rates, public.maintenance_plans, public.price_changes
to authenticated;

grant update (
  name_es, name_en, price, weeks_min, weeks_max, includes_es, includes_en, visible, sort, archived_at
) on public.offers to authenticated;

grant insert (slug, name_es, name_en, price, billing, visible, sort) on public.extras to authenticated;
grant update (name_es, name_en, price, billing, visible, sort, archived_at) on public.extras to authenticated;

grant update (label_es, label_en, price, visible, sort) on public.rates to authenticated;

grant insert (slug, name_es, name_en, price_monthly, includes_es, includes_en, visible, sort)
on public.maintenance_plans to authenticated;
grant update (
  name_es, name_en, price_monthly, includes_es, includes_en, visible, sort, archived_at
) on public.maintenance_plans to authenticated;

create policy offers_select_admin on public.offers for select to authenticated
using ((select private.is_admin()));
create policy offers_update_admin on public.offers for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy extras_select_admin on public.extras for select to authenticated
using ((select private.is_admin()));
create policy extras_insert_admin on public.extras for insert to authenticated
with check ((select private.is_admin()));
create policy extras_update_admin on public.extras for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy rates_select_admin on public.rates for select to authenticated
using ((select private.is_admin()));
create policy rates_update_admin on public.rates for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy maintenance_plans_select_admin on public.maintenance_plans for select to authenticated
using ((select private.is_admin()));
create policy maintenance_plans_insert_admin on public.maintenance_plans for insert to authenticated
with check ((select private.is_admin()));
create policy maintenance_plans_update_admin on public.maintenance_plans for update to authenticated
using ((select private.is_admin())) with check ((select private.is_admin()));

create policy price_changes_select_admin on public.price_changes for select to authenticated
using ((select private.is_admin()));

create view public.public_offers
with (security_invoker = true)
as
select slug, platform, name_es, name_en, price, weeks_min, weeks_max, includes_es, includes_en, sort
from public.offers
where visible and archived_at is null;

create view public.public_extras
with (security_invoker = true)
as
select slug, name_es, name_en, price, billing, sort
from public.extras
where visible and archived_at is null;

create view public.public_rates
with (security_invoker = true)
as
select code, label_es, label_en, price, sort
from public.rates
where visible;

create view public.public_maintenance_plans
with (security_invoker = true)
as
select slug, name_es, name_en, price_monthly, includes_es, includes_en, sort
from public.maintenance_plans
where visible and archived_at is null;

revoke all on public.public_offers from anon, authenticated;
revoke all on public.public_extras from anon, authenticated;
revoke all on public.public_rates from anon, authenticated;
revoke all on public.public_maintenance_plans from anon, authenticated;

grant select on public.offers, public.extras, public.rates, public.maintenance_plans to service_role;
grant select on public.public_offers, public.public_extras, public.public_rates,
  public.public_maintenance_plans to service_role;

insert into public.offers (slug, platform, name_es, name_en, weeks_min, weeks_max, includes_es, includes_en, sort)
values
  ('web-presencia', 'web', 'Presencia', 'Presence', 2, 3, array['Hasta 5 páginas con diseño a medida', 'Formulario de contacto con antispam', 'Rendimiento, accesibilidad y SEO técnico de serie', 'Dominio, alojamiento y correo configurados'], array['Up to 5 pages with a tailored design', 'Contact form with spam protection', 'Performance, accessibility and technical SEO as standard', 'Domain, hosting and email set up'], 10),
  ('web-negocio', 'web', 'Negocio', 'Business', 4, 6, array['Hasta 12 páginas con diseño a medida', 'Panel para editar textos, imágenes y novedades', 'Rendimiento, accesibilidad y SEO técnico de serie', 'Dominio, alojamiento y correo configurados'], array['Up to 12 pages with a tailored design', 'A panel to edit texts, images and news', 'Performance, accessibility and technical SEO as standard', 'Domain, hosting and email set up'], 20),
  ('web-plataforma', 'web', 'Plataforma', 'Platform', 8, 14, array['Cuentas de usuario con tipos y permisos', 'Base de datos y panel de gestión incluidos', 'Diseño de los flujos y pantallas del producto', 'Métricas de uso desde el primer día'], array['User accounts with roles and permissions', 'Database and management panel included', 'Design of the product flows and screens', 'Usage metrics from day one'], 30),
  ('app-primera-version', 'app', 'Primera versión', 'First version', 6, 10, array['Hasta 10 pantallas diseñadas a medida', 'App para iOS y Android con React Native', 'Cuentas de usuario, base de datos y almacenamiento', 'Publicación en App Store y Google Play con tus cuentas'], array['Up to 10 screens designed for you', 'iOS and Android app with React Native', 'User accounts, database and storage', 'Publishing on the App Store and Google Play with your accounts'], 40),
  ('app-producto', 'app', 'Producto', 'Product', 10, 16, array['Hasta 25 pantallas diseñadas a medida', 'Tipos de usuario con permisos y panel de gestión', 'Notificaciones push y métricas de uso', 'Publicación en las dos tiendas con tus cuentas'], array['Up to 25 screens designed for you', 'User roles with permissions and a management panel', 'Push notifications and usage metrics', 'Publishing on both stores with your accounts'], 50);

insert into public.extras (slug, name_es, name_en, billing, sort)
values
  ('accounts', 'Cuentas y permisos', 'Accounts and permissions', 'once', 10),
  ('admin', 'Panel de gestión', 'Management panel', 'once', 20),
  ('payments', 'Cobros con Stripe', 'Payments with Stripe', 'once', 30),
  ('languages', 'Varios idiomas', 'Several languages', 'per_unit', 40),
  ('seo', 'Posicionamiento (SEO y GEO)', 'Search visibility (SEO and GEO)', 'once', 50),
  ('analytics', 'Métricas de uso', 'Usage metrics', 'once', 60),
  ('ai', 'Asistente con IA', 'AI assistant', 'once', 70),
  ('push', 'Notificaciones push', 'Push notifications', 'once', 80),
  ('offline', 'Uso sin conexión', 'Offline use', 'once', 90),
  ('stores', 'Alta en tiendas gestionada', 'Managed store setup', 'once', 100),
  ('brand', 'Identidad y sistema de diseño', 'Identity and design system', 'once', 110);

insert into public.rates (code, label_es, label_en, sort)
values
  ('hourly', 'Por hora', 'Per hour', 10),
  ('task_min', 'Por tarea', 'Per task', 20);

insert into public.maintenance_plans (slug, name_es, name_en, includes_es, includes_en, sort)
values
  ('s', 'Plan S', 'Plan S', array['2 h al mes', 'Actualizaciones, copias y vigilancia de errores. Para webs que casi no cambian.'], array['2 h a month', 'Updates, backups and error monitoring. For sites that hardly change.'], 10),
  ('m', 'Plan M', 'Plan M', array['5 h al mes', 'Lo anterior más una bolsa de horas para cambios pequeños. Para productos con uso diario.'], array['5 h a month', 'The above plus a bank of hours for small changes. For products used every day.'], 20),
  ('l', 'Plan L', 'Plan L', array['10 h al mes', 'Bolsa amplia y respuesta prioritaria. Para productos que están creciendo.'], array['10 h a month', 'A large bank of hours and priority response. For products that are growing.'], 30);
