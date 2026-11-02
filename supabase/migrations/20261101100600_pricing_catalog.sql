-- Task 1.8e (plan v3.4; DATOS v1.4 §14.7 migration 7, §14.12.3; Q23/D54). The price catalogue is managed from the admin:
-- packs, options and extras with names in both languages, visibility and soft delete; the hourly and feature rates;
-- a price history written by trigger; custom quotes built only from extras; and the RPCs. Supabase is the source;
-- content_publish() writes content/pricing.json (the repo) and the published snapshot (what the gateway reads).
-- The initial load of the catalogue is data, not schema: supabase/seed/seed.sql locally, `pnpm pricing:sync-db` at the gate.
-- Nobody writes the catalogue tables directly (no insert/update/delete grant, not even the admin): only the RPCs, so
-- the price history is complete.

create type public.pack_kind as enum ('web', 'app');
create type public.extra_billing as enum ('one_off', 'monthly', 'yearly');
create type public.pricing_item as enum ('pack', 'pack_option', 'extra', 'settings');
create type public.quote_status as enum ('draft', 'sent', 'accepted', 'rejected', 'expired');

-- 1) Catalogue tables. name/description/includes/for_whom are {es, en} objects. The default of name keeps the legacy
--    sync (pricing-sync.sql) working until it is regenerated with names; the check keeps both languages present.
alter table public.packs drop constraint packs_code_check;
alter table public.packs add constraint packs_code_check check (code ~ '^[A-Z][A-Z0-9_]{1,15}$');
alter table public.packs
  add column kind       public.pack_kind not null default 'web',
  add column name       jsonb not null default '{"es": "", "en": ""}'
    check (jsonb_typeof(name -> 'es') = 'string' and jsonb_typeof(name -> 'en') = 'string'),
  add column includes   jsonb not null default '{"es": [], "en": []}'
    check (jsonb_typeof(includes -> 'es') = 'array' and jsonb_typeof(includes -> 'en') = 'array'),
  add column for_whom   jsonb,
  add column visible    boolean not null default true,
  add column deleted_at timestamptz,
  add column updated_by uuid references auth.users (id) on delete set null;
update public.packs set kind = 'app' where code = 'P5';
create index idx_packs_updated_by on public.packs (updated_by);
create index idx_packs_public on public.packs (sort) where deleted_at is null and visible;

alter table public.pack_options
  add column name       jsonb not null default '{"es": "", "en": ""}'
    check (jsonb_typeof(name -> 'es') = 'string' and jsonb_typeof(name -> 'en') = 'string'),
  add column weeks      smallint,
  add column includes   jsonb not null default '{"es": [], "en": []}'
    check (jsonb_typeof(includes -> 'es') = 'array' and jsonb_typeof(includes -> 'en') = 'array'),
  add column for_whom   jsonb,
  add column visible    boolean not null default true,
  add column deleted_at timestamptz;

alter table public.extras
  add column name        jsonb not null default '{"es": "", "en": ""}'
    check (jsonb_typeof(name -> 'es') = 'string' and jsonb_typeof(name -> 'en') = 'string'),
  add column description jsonb,
  add column billing     public.extra_billing not null default 'one_off',
  add column sort        smallint,
  add column visible     boolean not null default true,
  add column deleted_at  timestamptz,
  add column updated_by  uuid references auth.users (id) on delete set null;
alter table public.extras add constraint extras_code_check check (code ~ '^[a-z][a-z0-9_]{1,31}$');
create index idx_extras_updated_by on public.extras (updated_by);
create index idx_extras_public on public.extras (sort) where deleted_at is null and visible;

-- Everybody who may use the area reads the catalogue (the client sees its own pack even when it is hidden or deleted);
-- only a disabled staff member sees nothing.
-- Security review: hidden and deleted items are for the staff and for the client that bought them, not for any account.
create or replace function private.client_has_pack(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clients c where c.user_id = (select auth.uid()) and c.pack_code = p_code)
$$;
revoke all on function private.client_has_pack(text) from public, anon, authenticated;
grant execute on function private.client_has_pack(text) to authenticated;

create or replace function private.client_has_pack_option(p_pack_code text, p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clients c
                  where c.user_id = (select auth.uid()) and c.pack_code = p_pack_code and c.pack_option = p_code)
$$;
revoke all on function private.client_has_pack_option(text, text) from public, anon, authenticated;
grant execute on function private.client_has_pack_option(text, text) to authenticated;

create or replace function private.client_has_extra(p_code text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.client_extras e join public.clients c on c.id = e.client_id
                  where c.user_id = (select auth.uid()) and e.extra_code = p_code)
$$;
revoke all on function private.client_has_extra(text) from public, anon, authenticated;
grant execute on function private.client_has_extra(text) to authenticated;

drop policy packs_select on public.packs;
create policy packs_select on public.packs for select to authenticated
  using (not (select private.is_disabled_staff())
         and ((visible and deleted_at is null) or (select private.is_staff()) or (select private.client_has_pack(code))));
drop policy pack_options_select on public.pack_options;
create policy pack_options_select on public.pack_options for select to authenticated
  using (not (select private.is_disabled_staff())
         and ((visible and deleted_at is null) or (select private.is_staff())
              or (select private.client_has_pack_option(pack_code, code))));
drop policy extras_select on public.extras;
create policy extras_select on public.extras for select to authenticated
  using (not (select private.is_disabled_staff())
         and ((visible and deleted_at is null) or (select private.is_staff()) or (select private.client_has_extra(code))));

-- 2) Rates and publication state (one row).
create table public.pricing_settings (
  id                 boolean primary key default true check (id),
  hourly             integer not null check (hourly > 0),
  feature            integer not null check (feature > 0),
  upgrade_rule       text not null default 'list_difference',
  affiliate          jsonb not null,
  pricing_version    text not null,
  published_snapshot jsonb,
  published_hash     text,
  published_at       timestamptz,
  updated_at         timestamptz not null default now(),
  updated_by         uuid references auth.users (id) on delete set null
);
alter table public.pricing_settings enable row level security;
create index idx_pricing_settings_updated_by on public.pricing_settings (updated_by);
create trigger pricing_settings_set_updated_at before update on public.pricing_settings
  for each row execute function private.set_updated_at();
create policy pricing_settings_select on public.pricing_settings for select to authenticated
  using (not (select private.is_disabled_staff()));
-- published_snapshot is not readable with a JWT: the gateway gets it through pricing_published().
grant select (id, hourly, feature, upgrade_rule, affiliate, pricing_version, published_at, updated_at)
  on public.pricing_settings to authenticated;
insert into public.pricing_settings (id, hourly, feature, upgrade_rule, affiliate, pricing_version) values
  (true, 40, 150, 'list_difference',
   '{"client": {"maintenanceMonths": 2}, "standard": {"percent": 10}, "premium": {"percent": 20}, "base": "first_order_ex_vat"}',
   '2026-09-14')
on conflict (id) do nothing;

-- 3) Price history (admin reads; written by trigger only).
create table public.pricing_price_history (
  id         bigint generated always as identity primary key,
  item_kind  public.pricing_item not null,
  item_code  text not null,  -- pack_option: 'P5:plus'; settings: 'hourly' / 'feature'
  old_price  numeric(10, 2),
  new_price  numeric(10, 2) not null,
  changed_by uuid references auth.users (id) on delete set null,
  changed_at timestamptz not null default now(),
  note       text
);
alter table public.pricing_price_history enable row level security;
create index idx_pricing_price_history_item on public.pricing_price_history (item_kind, item_code, changed_at desc);
create index idx_pricing_price_history_changed_by on public.pricing_price_history (changed_by);
create policy pricing_price_history_select on public.pricing_price_history for select to authenticated
  using ((select private.is_admin()));
grant select on public.pricing_price_history to authenticated;

create or replace function private.pricing_price_history_log() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_old  numeric;
  v_kind public.pricing_item;
  v_code text;
begin
  if tg_op = 'UPDATE' then
    if old.price is not distinct from new.price then return null; end if;
    v_old := old.price;
  end if;
  if tg_table_name = 'packs' then
    v_kind := 'pack'; v_code := new.code;
  elsif tg_table_name = 'pack_options' then
    v_kind := 'pack_option'; v_code := new.pack_code || ':' || new.code;
  else
    v_kind := 'extra'; v_code := new.code;
  end if;
  insert into public.pricing_price_history (item_kind, item_code, old_price, new_price, changed_by)
  values (v_kind, v_code, v_old, new.price, (select auth.uid()));
  return null;
end $$;
revoke all on function private.pricing_price_history_log() from public, anon, authenticated;
create trigger packs_price_history after insert or update of price on public.packs
  for each row execute function private.pricing_price_history_log();
create trigger pack_options_price_history after insert or update of price on public.pack_options
  for each row execute function private.pricing_price_history_log();
create trigger extras_price_history after insert or update of price on public.extras
  for each row execute function private.pricing_price_history_log();

create or replace function private.pricing_settings_history_log() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.hourly is distinct from old.hourly then
    insert into public.pricing_price_history (item_kind, item_code, old_price, new_price, changed_by)
    values ('settings', 'hourly', old.hourly, new.hourly, (select auth.uid()));
  end if;
  if new.feature is distinct from old.feature then
    insert into public.pricing_price_history (item_kind, item_code, old_price, new_price, changed_by)
    values ('settings', 'feature', old.feature, new.feature, (select auth.uid()));
  end if;
  return null;
end $$;
revoke all on function private.pricing_settings_history_log() from public, anon, authenticated;
create trigger pricing_settings_price_history after update of hourly, feature on public.pricing_settings
  for each row execute function private.pricing_settings_history_log();

-- 4) Custom quotes (built only from extras).
create table public.custom_quotes (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.crm_contacts (id) on delete restrict,
  lead_id         uuid references public.leads (id) on delete set null,
  title           text not null check (char_length(title) between 1 and 140),
  status          public.quote_status not null default 'draft',
  subtotal        numeric(10, 2) not null default 0,
  discount_amount numeric(10, 2) not null default 0 check (discount_amount >= 0),
  discount_note   text,
  total           numeric(10, 2) not null default 0 check (total >= 0),
  valid_until     date,
  notes           text,
  pricing_version text,
  created_by      uuid references auth.users (id) on delete set null,
  sent_at         timestamptz,
  decided_at      timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.custom_quotes enable row level security;
create index idx_custom_quotes_contact on public.custom_quotes (contact_id, created_at desc);
create index idx_custom_quotes_lead on public.custom_quotes (lead_id);
create index idx_custom_quotes_draft on public.custom_quotes (status) where status = 'draft';
create index idx_custom_quotes_created_by on public.custom_quotes (created_by);
create trigger custom_quotes_set_updated_at before update on public.custom_quotes
  for each row execute function private.set_updated_at();

-- total = subtotal - discount (never below 0: removing lines after a discount must not fail).
create or replace function private.custom_quotes_totals() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.total := greatest(new.subtotal - new.discount_amount, 0);
  return new;
end $$;
revoke all on function private.custom_quotes_totals() from public, anon, authenticated;
create trigger custom_quotes_totals before insert or update of subtotal, discount_amount on public.custom_quotes
  for each row execute function private.custom_quotes_totals();

create table public.custom_quote_items (
  id         uuid primary key default gen_random_uuid(),
  quote_id   uuid not null references public.custom_quotes (id) on delete cascade,
  extra_code text not null references public.extras (code) on delete restrict,
  label      jsonb not null,                       -- snapshot of extras.name
  unit_price numeric(10, 2) not null,              -- snapshot of extras.price when the line was added
  quantity   numeric(6, 2) not null default 1 check (quantity > 0),
  line_total numeric(10, 2) generated always as (round(unit_price * quantity, 2)) stored,
  sort       smallint
);
alter table public.custom_quote_items enable row level security;
create index idx_custom_quote_items_quote on public.custom_quote_items (quote_id, sort);
create index idx_custom_quote_items_extra on public.custom_quote_items (extra_code);

create or replace function private.owns_quote(p_quote_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_closer()
     and exists (select 1 from public.custom_quotes q join public.crm_contacts c on c.id = q.contact_id
                 where q.id = p_quote_id and c.owner_id = (select auth.uid()))
$$;
revoke all on function private.owns_quote(uuid) from public, anon, authenticated;
grant execute on function private.owns_quote(uuid) to authenticated;

create or replace function private.quote_is_draft(p_quote_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.custom_quotes q where q.id = p_quote_id and q.status = 'draft')
$$;
revoke all on function private.quote_is_draft(uuid) from public, anon, authenticated;
grant execute on function private.quote_is_draft(uuid) to authenticated;

-- Quotes: admin or the owner closer of the contact. The discount columns are not granted for insert or update: only
-- admin_quote_set_discount() writes them. Only drafts are deleted, by the admin.
create policy custom_quotes_select on public.custom_quotes for select to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)));
create policy custom_quotes_insert on public.custom_quotes for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));
create policy custom_quotes_update on public.custom_quotes for update to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)))
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));
create policy custom_quotes_delete on public.custom_quotes for delete to authenticated
  using ((select private.is_admin()) and status = 'draft');
grant select, delete on public.custom_quotes to authenticated;
-- status and lead_id are not granted either: the state machine and the lead of a quote move only through the RPCs
-- (quote_create checks that the lead belongs to the contact; quote_mark_sent and quote_decide own the transitions).
grant insert (contact_id, title, valid_until, notes) on public.custom_quotes to authenticated;
grant update (title, valid_until, notes) on public.custom_quotes to authenticated;

-- Defence in depth for the grant above: a status change through the API role is refused whatever the grants become.
create or replace function private.custom_quotes_status_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' and (new.status is distinct from old.status or new.lead_id is distinct from old.lead_id) then
    raise exception 'quote status and lead change only through the quote RPCs' using errcode = '42501';
  end if;
  return new;
end $$;
revoke all on function private.custom_quotes_status_guard() from public, anon, authenticated;
create trigger custom_quotes_status_guard before update on public.custom_quotes
  for each row execute function private.custom_quotes_status_guard();

create policy custom_quote_items_select on public.custom_quote_items for select to authenticated
  using ((select private.is_admin()) or (select private.owns_quote(quote_id)));
create policy custom_quote_items_insert on public.custom_quote_items for insert to authenticated
  with check ((select private.quote_is_draft(quote_id)) and ((select private.is_admin()) or (select private.owns_quote(quote_id))));
create policy custom_quote_items_update on public.custom_quote_items for update to authenticated
  using ((select private.quote_is_draft(quote_id)) and ((select private.is_admin()) or (select private.owns_quote(quote_id))))
  with check ((select private.quote_is_draft(quote_id)) and ((select private.is_admin()) or (select private.owns_quote(quote_id))));
create policy custom_quote_items_delete on public.custom_quote_items for delete to authenticated
  using ((select private.quote_is_draft(quote_id)) and ((select private.is_admin()) or (select private.owns_quote(quote_id))));
grant select, delete on public.custom_quote_items to authenticated;
grant insert (quote_id, extra_code, quantity, sort) on public.custom_quote_items to authenticated;
grant update (quantity, sort) on public.custom_quote_items to authenticated;

-- The line snapshots name and price of the extra whoever inserts it (label and unit_price are not granted).
create or replace function private.custom_quote_items_fill() returns trigger
language plpgsql set search_path = '' as $$
declare x public.extras;
begin
  select * into x from public.extras e where e.code = new.extra_code;
  if x.code is null then
    new.label := '{"es": "", "en": ""}'::jsonb;  -- the foreign key reports the unknown code
    new.unit_price := 0;
  else
    if not x.active or x.deleted_at is not null then raise exception 'extra_not_available' using errcode = '22023'; end if;
    new.label := x.name;
    new.unit_price := x.price;
  end if;
  return new;
end $$;
revoke all on function private.custom_quote_items_fill() from public, anon, authenticated;
create trigger custom_quote_items_fill before insert on public.custom_quote_items
  for each row execute function private.custom_quote_items_fill();

-- subtotal follows the lines (definer: the closer has no update grant on the column).
create or replace function private.custom_quote_recalc() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_id uuid := case when tg_op = 'DELETE' then old.quote_id else new.quote_id end;
begin
  update public.custom_quotes q
     set subtotal = coalesce((select sum(i.line_total) from public.custom_quote_items i where i.quote_id = q.id), 0)
   where q.id = v_id;
  return null;
end $$;
revoke all on function private.custom_quote_recalc() from public, anon, authenticated;
create trigger custom_quote_items_recalc after insert or update or delete on public.custom_quote_items
  for each row execute function private.custom_quote_recalc();

-- 5) Snapshot of the catalogue with the exact shape of pricingSchema (@josecoded/types): only visible, not deleted
--    items, ordered by sort and code so that md5() works as a hash. The mobile app of the old file (APP_MVP / APP_PLUS)
--    is derived from the packs of kind app (P5 -> APP_MVP, P5:plus -> APP_PLUS).
create or replace function private.pricing_snapshot_build() returns jsonb
language sql stable set search_path = '' as $$
  select jsonb_build_object(
    'version', s.pricing_version,
    'hourly',  s.hourly,
    'feature', s.feature,
    'packs',   coalesce((select jsonb_agg(jsonb_build_object(
                    'code', p.code, 'name', p.name, 'price', p.price, 'weeks', p.weeks, 'includes', p.includes,
                    'forWhom', p.for_whom, 'active', p.active) order by p.sort, p.code)
                  from public.packs p where p.kind = 'web' and p.deleted_at is null and p.visible), '[]'::jsonb),
    'apps',    coalesce((select jsonb_agg(a.obj order by a.sort, a.ord, a.code)
                  from (
                    select p.sort, 0 as ord, p.code,
                           jsonb_build_object('code', case p.code when 'P5' then 'APP_MVP' else p.code end,
                                              'name', p.name, 'price', p.price, 'weeks', p.weeks, 'includes', p.includes,
                                              'forWhom', p.for_whom, 'active', p.active) as obj
                      from public.packs p where p.kind = 'app' and p.deleted_at is null and p.visible
                    union all
                    select p.sort, 1, p.code || ':' || o.code,
                           jsonb_build_object('code', case when p.code = 'P5' and o.code = 'plus' then 'APP_PLUS'
                                                           else p.code || '_' || upper(o.code) end,
                                              'name', o.name, 'price', o.price, 'weeks', o.weeks, 'includes', o.includes,
                                              'forWhom', o.for_whom, 'active', p.active)
                      from public.pack_options o join public.packs p on p.code = o.pack_code
                     where p.kind = 'app' and p.deleted_at is null and p.visible and o.deleted_at is null and o.visible
                  ) a), '[]'::jsonb),
    'extras',  coalesce((select jsonb_agg(jsonb_build_object(
                    'code', e.code, 'label', e.name, 'description', e.description, 'price', e.price,
                    'billing', e.billing, 'active', e.active) order by e.sort, e.code)
                  from public.extras e where e.deleted_at is null and e.visible), '[]'::jsonb),
    'upgradeRule', s.upgrade_rule,
    'affiliate',   s.affiliate)
  from public.pricing_settings s
$$;
revoke all on function private.pricing_snapshot_build() from public, anon, authenticated;

create or replace function private.pricing_catalog_snapshot_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not (private.is_staff() or (select auth.role()) = 'service_role') then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return private.pricing_snapshot_build();
end $$;
revoke all on function private.pricing_catalog_snapshot_impl() from public, anon, authenticated;
grant execute on function private.pricing_catalog_snapshot_impl() to authenticated, service_role;

create or replace function public.pricing_catalog_snapshot() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.pricing_catalog_snapshot_impl()
$$;
revoke all on function public.pricing_catalog_snapshot() from public, anon, authenticated;
grant execute on function public.pricing_catalog_snapshot() to authenticated, service_role;

-- What is live in production (null before the first publication). Gateway only.
create or replace function public.pricing_published() returns jsonb
language sql stable security definer set search_path = '' as $$
  select s.published_snapshot from public.pricing_settings s
$$;
revoke all on function public.pricing_published() from public, anon, authenticated;
grant execute on function public.pricing_published() to service_role;

-- True when the catalogue differs from what was published.
create or replace function private.pricing_pending() returns boolean
language sql stable set search_path = '' as $$
  select s.published_hash is distinct from md5(private.pricing_snapshot_build()::text) from public.pricing_settings s
$$;
revoke all on function private.pricing_pending() from public, anon, authenticated;

-- 6) Admin RPCs for the catalogue. A key that is absent keeps the current value (upsert by code).
create or replace function private.admin_pricing_set_pack_impl(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := p ->> 'code';
  o      public.packs;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_code is null or v_code !~ '^[A-Z][A-Z0-9_]{1,15}$' then raise exception 'invalid_code' using errcode = '22023'; end if;
  select * into o from public.packs x where x.code = v_code for update;
  if o.code is null then
    if p -> 'name' is null or p ->> 'price' is null then raise exception 'name_and_price_required' using errcode = '22023'; end if;
    insert into public.packs (code, kind, slug, name, includes, for_whom, price, weeks, sort, active, visible, pricing_version, updated_by)
    values (v_code, coalesce((p ->> 'kind')::public.pack_kind, 'web'), p ->> 'slug', p -> 'name',
            coalesce(p -> 'includes', '{"es": [], "en": []}'::jsonb), p -> 'for_whom', (p ->> 'price')::integer,
            (p ->> 'weeks')::smallint, (p ->> 'sort')::smallint, coalesce((p ->> 'active')::boolean, true),
            coalesce((p ->> 'visible')::boolean, true), (select s.pricing_version from public.pricing_settings s),
            (select auth.uid()));
  else
    if o.deleted_at is not null then raise exception 'pack_deleted' using errcode = '22023'; end if;
    update public.packs set
      kind     = coalesce((p ->> 'kind')::public.pack_kind, kind),
      slug     = coalesce(p ->> 'slug', slug),
      name     = coalesce(p -> 'name', name),
      includes = coalesce(p -> 'includes', includes),
      for_whom = coalesce(p -> 'for_whom', for_whom),
      price    = coalesce((p ->> 'price')::integer, price),
      weeks    = coalesce((p ->> 'weeks')::smallint, weeks),
      sort     = coalesce((p ->> 'sort')::smallint, sort),
      active   = coalesce((p ->> 'active')::boolean, active),
      visible  = coalesce((p ->> 'visible')::boolean, visible),
      updated_by = (select auth.uid())
     where code = v_code;
  end if;
  return v_code;
end $$;
revoke all on function private.admin_pricing_set_pack_impl(jsonb) from public, anon, authenticated;
grant execute on function private.admin_pricing_set_pack_impl(jsonb) to authenticated, service_role;

create or replace function private.admin_pricing_set_option_impl(p_pack_code text, p jsonb) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := p ->> 'code';
  o      public.pack_options;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_code is null or v_code !~ '^[a-z][a-z0-9_]{0,31}$' then raise exception 'invalid_code' using errcode = '22023'; end if;
  if not exists (select 1 from public.packs k where k.code = p_pack_code) then raise exception 'pack_not_found' using errcode = 'P0002'; end if;
  select * into o from public.pack_options x where x.pack_code = p_pack_code and x.code = v_code for update;
  if o.code is null then
    if p -> 'name' is null or p ->> 'price' is null then raise exception 'name_and_price_required' using errcode = '22023'; end if;
    insert into public.pack_options (pack_code, code, name, price, weeks, includes, for_whom, visible, pricing_version)
    values (p_pack_code, v_code, p -> 'name', (p ->> 'price')::integer, (p ->> 'weeks')::smallint,
            coalesce(p -> 'includes', '{"es": [], "en": []}'::jsonb), p -> 'for_whom',
            coalesce((p ->> 'visible')::boolean, true), (select s.pricing_version from public.pricing_settings s));
  else
    if o.deleted_at is not null then raise exception 'option_deleted' using errcode = '22023'; end if;
    update public.pack_options set
      name     = coalesce(p -> 'name', name),
      price    = coalesce((p ->> 'price')::integer, price),
      weeks    = coalesce((p ->> 'weeks')::smallint, weeks),
      includes = coalesce(p -> 'includes', includes),
      for_whom = coalesce(p -> 'for_whom', for_whom),
      visible  = coalesce((p ->> 'visible')::boolean, visible)
     where pack_code = p_pack_code and code = v_code;
  end if;
end $$;
revoke all on function private.admin_pricing_set_option_impl(text, jsonb) from public, anon, authenticated;
grant execute on function private.admin_pricing_set_option_impl(text, jsonb) to authenticated, service_role;

create or replace function private.admin_pricing_set_extra_impl(p jsonb) returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_code text := p ->> 'code';
  o      public.extras;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_code is null or v_code !~ '^[a-z][a-z0-9_]{1,31}$' then raise exception 'invalid_code' using errcode = '22023'; end if;
  select * into o from public.extras x where x.code = v_code for update;
  if o.code is null then
    if p -> 'name' is null or p ->> 'price' is null then raise exception 'name_and_price_required' using errcode = '22023'; end if;
    insert into public.extras (code, name, description, price, billing, sort, active, visible, pricing_version, updated_by)
    values (v_code, p -> 'name', p -> 'description', (p ->> 'price')::integer,
            coalesce((p ->> 'billing')::public.extra_billing, 'one_off'), (p ->> 'sort')::smallint,
            coalesce((p ->> 'active')::boolean, true), coalesce((p ->> 'visible')::boolean, true),
            (select s.pricing_version from public.pricing_settings s), (select auth.uid()));
  else
    if o.deleted_at is not null then raise exception 'extra_deleted' using errcode = '22023'; end if;
    update public.extras set
      name        = coalesce(p -> 'name', name),
      description = coalesce(p -> 'description', description),
      price       = coalesce((p ->> 'price')::integer, price),
      billing     = coalesce((p ->> 'billing')::public.extra_billing, billing),
      sort        = coalesce((p ->> 'sort')::smallint, sort),
      active      = coalesce((p ->> 'active')::boolean, active),
      visible     = coalesce((p ->> 'visible')::boolean, visible),
      updated_by  = (select auth.uid())
     where code = v_code;
  end if;
  return v_code;
end $$;
revoke all on function private.admin_pricing_set_extra_impl(jsonb) from public, anon, authenticated;
grant execute on function private.admin_pricing_set_extra_impl(jsonb) to authenticated, service_role;

-- Soft delete: nothing is removed (clients, leads, client extras and quote lines keep pointing at the code).
create or replace function private.admin_pricing_delete_impl(p_kind public.pricing_item, p_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_found boolean;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_kind = 'pack' then
    update public.packs set deleted_at = coalesce(deleted_at, now()), visible = false, active = false, updated_by = (select auth.uid())
     where code = p_code;
  elsif p_kind = 'pack_option' then
    update public.pack_options set deleted_at = coalesce(deleted_at, now()), visible = false
     where pack_code = split_part(p_code, ':', 1) and code = split_part(p_code, ':', 2);
  elsif p_kind = 'extra' then
    update public.extras set deleted_at = coalesce(deleted_at, now()), visible = false, active = false, updated_by = (select auth.uid())
     where code = p_code;
  else
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  get diagnostics v_found = row_count;
  if not v_found then raise exception 'item_not_found' using errcode = 'P0002'; end if;
end $$;
revoke all on function private.admin_pricing_delete_impl(public.pricing_item, text) from public, anon, authenticated;
grant execute on function private.admin_pricing_delete_impl(public.pricing_item, text) to authenticated, service_role;

create or replace function private.admin_pricing_restore_impl(p_kind public.pricing_item, p_code text) returns void
language plpgsql security definer set search_path = '' as $$
declare v_found boolean;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_kind = 'pack' then
    update public.packs set deleted_at = null, updated_by = (select auth.uid()) where code = p_code;
  elsif p_kind = 'pack_option' then
    update public.pack_options set deleted_at = null where pack_code = split_part(p_code, ':', 1) and code = split_part(p_code, ':', 2);
  elsif p_kind = 'extra' then
    update public.extras set deleted_at = null, updated_by = (select auth.uid()) where code = p_code;
  else
    raise exception 'invalid_kind' using errcode = '22023';
  end if;
  get diagnostics v_found = row_count;
  if not v_found then raise exception 'item_not_found' using errcode = 'P0002'; end if;
end $$;
revoke all on function private.admin_pricing_restore_impl(public.pricing_item, text) from public, anon, authenticated;
grant execute on function private.admin_pricing_restore_impl(public.pricing_item, text) to authenticated, service_role;

create or replace function private.admin_pricing_set_settings_impl(p_hourly integer, p_feature integer) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_hourly is null or p_hourly <= 0 or p_feature is null or p_feature <= 0 then raise exception 'invalid_rate' using errcode = '22023'; end if;
  update public.pricing_settings set hourly = p_hourly, feature = p_feature, updated_by = (select auth.uid());
end $$;
revoke all on function private.admin_pricing_set_settings_impl(integer, integer) from public, anon, authenticated;
grant execute on function private.admin_pricing_set_settings_impl(integer, integer) to authenticated, service_role;

create or replace function public.admin_pricing_set_pack(p jsonb) returns text
language sql security invoker set search_path = '' as $$ select private.admin_pricing_set_pack_impl(p) $$;
create or replace function public.admin_pricing_set_option(p_pack_code text, p jsonb) returns void
language sql security invoker set search_path = '' as $$ select private.admin_pricing_set_option_impl(p_pack_code, p) $$;
create or replace function public.admin_pricing_set_extra(p jsonb) returns text
language sql security invoker set search_path = '' as $$ select private.admin_pricing_set_extra_impl(p) $$;
create or replace function public.admin_pricing_delete(p_kind public.pricing_item, p_code text) returns void
language sql security invoker set search_path = '' as $$ select private.admin_pricing_delete_impl(p_kind, p_code) $$;
create or replace function public.admin_pricing_restore(p_kind public.pricing_item, p_code text) returns void
language sql security invoker set search_path = '' as $$ select private.admin_pricing_restore_impl(p_kind, p_code) $$;
create or replace function public.admin_pricing_set_settings(p_hourly integer, p_feature integer) returns void
language sql security invoker set search_path = '' as $$ select private.admin_pricing_set_settings_impl(p_hourly, p_feature) $$;
revoke all on function public.admin_pricing_set_pack(jsonb) from public, anon, authenticated;
revoke all on function public.admin_pricing_set_option(text, jsonb) from public, anon, authenticated;
revoke all on function public.admin_pricing_set_extra(jsonb) from public, anon, authenticated;
revoke all on function public.admin_pricing_delete(public.pricing_item, text) from public, anon, authenticated;
revoke all on function public.admin_pricing_restore(public.pricing_item, text) from public, anon, authenticated;
revoke all on function public.admin_pricing_set_settings(integer, integer) from public, anon, authenticated;
grant execute on function public.admin_pricing_set_pack(jsonb) to authenticated;
grant execute on function public.admin_pricing_set_option(text, jsonb) to authenticated;
grant execute on function public.admin_pricing_set_extra(jsonb) to authenticated;
grant execute on function public.admin_pricing_delete(public.pricing_item, text) to authenticated;
grant execute on function public.admin_pricing_restore(public.pricing_item, text) to authenticated;
grant execute on function public.admin_pricing_set_settings(integer, integer) to authenticated;

-- 7) Quote RPCs (admin or the closer who owns the contact).
create or replace function private.quote_create_impl(p_contact_id uuid, p_title text, p_lead_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_id uuid;
begin
  if not (private.is_admin() or private.owns_contact(p_contact_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_lead_id is not null and not exists (select 1 from public.leads l where l.id = p_lead_id and l.contact_id = p_contact_id) then
    raise exception 'lead_not_of_contact' using errcode = '22023';
  end if;
  insert into public.custom_quotes (contact_id, lead_id, title, pricing_version, created_by)
  values (p_contact_id, p_lead_id, btrim(p_title), (select s.pricing_version from public.pricing_settings s), (select auth.uid()))
  returning id into v_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, body, payload)
  values (p_contact_id, 'note', 'internal', private.staff_actor(), p_lead_id, 'presupuesto creado', jsonb_build_object('quote_id', v_id));
  return v_id;
end $$;
revoke all on function private.quote_create_impl(uuid, text, uuid) from public, anon, authenticated;
grant execute on function private.quote_create_impl(uuid, text, uuid) to authenticated, service_role;

-- Loads a quote the caller may edit (draft only); raises otherwise.
create or replace function private.quote_load_editable(p_quote_id uuid) returns public.custom_quotes
language plpgsql set search_path = '' as $$
declare q public.custom_quotes;
begin
  select * into q from public.custom_quotes x where x.id = p_quote_id for update;
  if q.id is null then raise exception 'quote_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_contact(q.contact_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if q.status <> 'draft' then raise exception 'quote_not_draft' using errcode = '22023'; end if;
  return q;
end $$;
revoke all on function private.quote_load_editable(uuid) from public, anon, authenticated;

create or replace function private.quote_add_item_impl(p_quote_id uuid, p_extra_code text, p_quantity numeric) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  q    public.custom_quotes;
  x    public.extras;
  v_id uuid;
begin
  q := private.quote_load_editable(p_quote_id);
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid_quantity' using errcode = '22023'; end if;
  select * into x from public.extras e where e.code = p_extra_code and e.active and e.deleted_at is null;
  if x.code is null then raise exception 'unknown_extra' using errcode = '22023'; end if;
  insert into public.custom_quote_items (quote_id, extra_code, label, unit_price, quantity, sort)
  values (q.id, x.code, x.name, x.price, p_quantity,
          coalesce((select max(i.sort) from public.custom_quote_items i where i.quote_id = q.id), 0) + 1)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function private.quote_add_item_impl(uuid, text, numeric) from public, anon, authenticated;
grant execute on function private.quote_add_item_impl(uuid, text, numeric) to authenticated, service_role;

create or replace function private.quote_remove_item_impl(p_item_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare v_quote uuid;
begin
  select i.quote_id into v_quote from public.custom_quote_items i where i.id = p_item_id;
  if v_quote is null then raise exception 'item_not_found' using errcode = 'P0002'; end if;
  perform private.quote_load_editable(v_quote);
  delete from public.custom_quote_items where id = p_item_id;
end $$;
revoke all on function private.quote_remove_item_impl(uuid) from public, anon, authenticated;
grant execute on function private.quote_remove_item_impl(uuid) to authenticated, service_role;

create or replace function private.quote_set_quantity_impl(p_item_id uuid, p_quantity numeric) returns void
language plpgsql security definer set search_path = '' as $$
declare v_quote uuid;
begin
  select i.quote_id into v_quote from public.custom_quote_items i where i.id = p_item_id;
  if v_quote is null then raise exception 'item_not_found' using errcode = 'P0002'; end if;
  perform private.quote_load_editable(v_quote);
  if p_quantity is null or p_quantity <= 0 then raise exception 'invalid_quantity' using errcode = '22023'; end if;
  update public.custom_quote_items set quantity = p_quantity where id = p_item_id;
end $$;
revoke all on function private.quote_set_quantity_impl(uuid, numeric) from public, anon, authenticated;
grant execute on function private.quote_set_quantity_impl(uuid, numeric) to authenticated, service_role;

-- The discount is the admin's alone.
create or replace function private.admin_quote_set_discount_impl(p_quote_id uuid, p_amount numeric, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare q public.custom_quotes;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select * into q from public.custom_quotes x where x.id = p_quote_id for update;
  if q.id is null then raise exception 'quote_not_found' using errcode = 'P0002'; end if;
  if p_amount is null or p_amount < 0 or p_amount > q.subtotal then raise exception 'invalid_discount' using errcode = '22023'; end if;
  update public.custom_quotes set discount_amount = p_amount, discount_note = nullif(btrim(p_note), '') where id = q.id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
  values (q.contact_id, 'note', 'internal', 'jose', 'descuento de presupuesto', jsonb_build_object('quote_id', q.id, 'discount', p_amount));
end $$;
revoke all on function private.admin_quote_set_discount_impl(uuid, numeric, text) from public, anon, authenticated;
grant execute on function private.admin_quote_set_discount_impl(uuid, numeric, text) to authenticated, service_role;

create or replace function private.quote_mark_sent_impl(p_quote_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  q       public.custom_quotes;
  v_owner uuid;
begin
  q := private.quote_load_editable(p_quote_id);
  if not exists (select 1 from public.custom_quote_items i where i.quote_id = q.id) then
    raise exception 'quote_without_items' using errcode = '22023';
  end if;
  update public.custom_quotes set status = 'sent', sent_at = now() where id = q.id;
  select c.owner_id into v_owner from public.crm_contacts c where c.id = q.contact_id;
  insert into public.crm_interactions (contact_id, kind, channel, direction, actor, lead_id, payload)
  values (q.contact_id, 'message_sent', 'other', 'out', private.staff_actor(), q.lead_id, jsonb_build_object('quote_id', q.id, 'total', q.total));
  perform private.enqueue('quote.sent', jsonb_build_object(
    'quote_id', q.id, 'contact_id', q.contact_id, 'owner_id', v_owner, 'total', q.total));
end $$;
revoke all on function private.quote_mark_sent_impl(uuid) from public, anon, authenticated;
grant execute on function private.quote_mark_sent_impl(uuid) to authenticated, service_role;

create or replace function private.quote_decide_impl(p_quote_id uuid, p_status public.quote_status) returns void
language plpgsql security definer set search_path = '' as $$
declare q public.custom_quotes;
begin
  select * into q from public.custom_quotes x where x.id = p_quote_id for update;
  if q.id is null then raise exception 'quote_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_contact(q.contact_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if q.status <> 'sent' or p_status not in ('accepted', 'rejected', 'expired') then
    raise exception 'invalid_transition' using errcode = '22023';
  end if;
  update public.custom_quotes set status = p_status, decided_at = now() where id = q.id;
end $$;
revoke all on function private.quote_decide_impl(uuid, public.quote_status) from public, anon, authenticated;
grant execute on function private.quote_decide_impl(uuid, public.quote_status) to authenticated, service_role;

create or replace function public.quote_create(p_contact_id uuid, p_title text, p_lead_id uuid default null) returns uuid
language sql security invoker set search_path = '' as $$ select private.quote_create_impl(p_contact_id, p_title, p_lead_id) $$;
create or replace function public.quote_add_item(p_quote_id uuid, p_extra_code text, p_quantity numeric default 1) returns uuid
language sql security invoker set search_path = '' as $$ select private.quote_add_item_impl(p_quote_id, p_extra_code, p_quantity) $$;
create or replace function public.quote_remove_item(p_item_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.quote_remove_item_impl(p_item_id) $$;
create or replace function public.quote_set_quantity(p_item_id uuid, p_quantity numeric) returns void
language sql security invoker set search_path = '' as $$ select private.quote_set_quantity_impl(p_item_id, p_quantity) $$;
create or replace function public.admin_quote_set_discount(p_quote_id uuid, p_amount numeric, p_note text) returns void
language sql security invoker set search_path = '' as $$ select private.admin_quote_set_discount_impl(p_quote_id, p_amount, p_note) $$;
create or replace function public.quote_mark_sent(p_quote_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.quote_mark_sent_impl(p_quote_id) $$;
create or replace function public.quote_decide(p_quote_id uuid, p_status public.quote_status) returns void
language sql security invoker set search_path = '' as $$ select private.quote_decide_impl(p_quote_id, p_status) $$;
revoke all on function public.quote_create(uuid, text, uuid) from public, anon, authenticated;
revoke all on function public.quote_add_item(uuid, text, numeric) from public, anon, authenticated;
revoke all on function public.quote_remove_item(uuid) from public, anon, authenticated;
revoke all on function public.quote_set_quantity(uuid, numeric) from public, anon, authenticated;
revoke all on function public.admin_quote_set_discount(uuid, numeric, text) from public, anon, authenticated;
revoke all on function public.quote_mark_sent(uuid) from public, anon, authenticated;
revoke all on function public.quote_decide(uuid, public.quote_status) from public, anon, authenticated;
grant execute on function public.quote_create(uuid, text, uuid) to authenticated;
grant execute on function public.quote_add_item(uuid, text, numeric) to authenticated;
grant execute on function public.quote_remove_item(uuid) to authenticated;
grant execute on function public.quote_set_quantity(uuid, numeric) to authenticated;
grant execute on function public.admin_quote_set_discount(uuid, numeric, text) to authenticated;
grant execute on function public.quote_mark_sent(uuid) to authenticated;
grant execute on function public.quote_decide(uuid, public.quote_status) to authenticated;

-- 8) content_publish now also publishes the catalogue (replaces the impl of 20261101100400). The prices go to
--    content/pricing.json and to pricing_settings.published_snapshot in the same transaction; a new version
--    'YYYY-MM-DD.n' is stamped when the catalogue changed since the last publication.
create or replace function private.content_publish_impl(p_entry_ids uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  e         public.site_content_entries;
  v_pub     uuid := gen_random_uuid();
  v_count   integer := 0;
  v_version integer;
  v_price_pending boolean;
  v_pricing jsonb;
  v_ver     text;
  v_editable constant text[] := array['home', 'services', 'partners', 'about', 'projects', 'contact', 'blog', 'lab', 'seo', 'common'];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('content_publish', 0));

  for e in select x.* from public.site_content_entries x
            where x.draft is distinct from x.published and (p_entry_ids is null or x.id = any (p_entry_ids))
            order by x.kind, x.key for update loop
    if e.draft is null then continue; end if;
    if jsonb_typeof(e.draft) <> 'object' then raise exception 'invalid_content: %', e.key using errcode = '22023'; end if;
    if e.draft::text like '%{{DATO%' then raise exception 'placeholder_in_content: %', e.key using errcode = '22023'; end if;
    if e.kind = 'message_override' then
      if not (split_part(e.key, '.', 1) = any (v_editable)) then
        raise exception 'namespace_not_editable: %', e.key using errcode = '22023';
      end if;
      if jsonb_typeof(e.draft -> 'value') <> 'string' then raise exception 'invalid_content: %', e.key using errcode = '22023'; end if;
    elsif e.kind = 'faq' then
      if jsonb_typeof(e.draft -> 'question') <> 'string' or jsonb_typeof(e.draft -> 'answer') <> 'string' then
        raise exception 'invalid_content: %', e.key using errcode = '22023';
      end if;
    elsif e.kind = 'blog_post' then
      if jsonb_typeof(e.draft -> 'title') <> 'string' or jsonb_typeof(e.draft -> 'body_md') <> 'string' then
        raise exception 'invalid_content: %', e.key using errcode = '22023';
      end if;
    end if;
  end loop;

  v_price_pending := private.pricing_pending();
  insert into public.site_content_publications (id, snapshot, created_by) values (v_pub, '{}'::jsonb, v_uid);
  -- The snapshot always carries the whole state, so an older publication still waiting is obsolete: it must never be
  -- committed over this one (the gateway also checks before committing).
  update public.site_content_publications set status = 'failed', error = 'superseded' where status = 'queued' and id <> v_pub;

  for e in select x.* from public.site_content_entries x
            where x.draft is distinct from x.published and x.draft is not null
              and (p_entry_ids is null or x.id = any (p_entry_ids))
            order by x.kind, x.key loop
    v_version := e.published_version + 1;
    update public.site_content_entries set published = draft, published_version = v_version, published_at = now(), published_by = v_uid
     where id = e.id;
    insert into public.site_content_versions (entry_id, version, content, published_by, publication_id)
    values (e.id, v_version, e.draft, v_uid, v_pub);
    v_count := v_count + 1;
  end loop;
  if v_count = 0 and not (v_price_pending and p_entry_ids is null) then
    raise exception 'nothing_to_publish' using errcode = '22023';
  end if;

  if v_price_pending and p_entry_ids is null then
    v_ver := to_char(now(), 'YYYY-MM-DD') || '.'
             || (select count(*) from public.site_content_publications p where p.created_at >= date_trunc('day', now()))::text;
    update public.pricing_settings set pricing_version = v_ver;
    update public.packs set pricing_version = v_ver where visible and deleted_at is null and pricing_version <> v_ver;
    update public.pack_options set pricing_version = v_ver where visible and deleted_at is null and pricing_version <> v_ver;
    update public.extras set pricing_version = v_ver where visible and deleted_at is null and pricing_version <> v_ver;
    v_pricing := private.pricing_snapshot_build();
    update public.pricing_settings set published_snapshot = v_pricing, published_hash = md5(v_pricing::text), published_at = now();
  end if;
  select s.published_snapshot into v_pricing from public.pricing_settings s;

  update public.site_content_publications
     set snapshot = jsonb_build_object('files',
           private.content_files_build() || jsonb_build_object('content/pricing.json', coalesce(v_pricing, private.pricing_snapshot_build())))
   where id = v_pub;
  perform private.enqueue('content.publish_requested', jsonb_build_object('publication_id', v_pub));
  return v_pub;
end $$;
revoke all on function private.content_publish_impl(uuid[]) from public, anon, authenticated;
grant execute on function private.content_publish_impl(uuid[]) to authenticated, service_role;

-- C1 counters, final shape (content_pending also counts unpublished catalogue changes; quotes_draft is new).
create or replace function private.admin_counters_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'leads_open',       (select count(*) from public.leads l where l.status = 'open'),
    'contacts_due',     (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.next_action_at <= now()),
    'chat_unread',      (select count(*) from public.chat_threads t where t.unread_for_admin),
    'agencies_replied', (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.kind = 'agency' and c.status = 'replied'),
    'comments_pending', (select count(*) from public.blog_comments b where b.status = 'pending'),
    'upgrades_pending', (select count(*) from public.upgrade_requests u where u.status = 'pending'),
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending'),
    'commissions_pending',       (select count(*) from public.closer_commissions k where k.status = 'pending'),
    'imports_failed_24h',        (select count(*) from public.crm_imports i
                                   where i.status = 'failed' and i.created_at > now() - interval '24 hours'),
    'import_conflicts_pending',  (select count(*) from public.crm_import_conflicts k where k.status = 'pending'),
    'stories_proposed',          (select count(*) from public.client_user_stories s where s.status = 'proposed'),
    'content_pending',           (select count(*) from public.site_content_entries e where e.draft is distinct from e.published)
                                 + case when private.pricing_pending() then 1 else 0 end,
    'quotes_draft',              (select count(*) from public.custom_quotes q where q.status = 'draft')
  );
end $$;
revoke all on function private.admin_counters_impl() from public, anon, authenticated;
grant execute on function private.admin_counters_impl() to authenticated, service_role;
