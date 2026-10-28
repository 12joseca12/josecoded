-- Task 1.8 (DT §6.2, plan v2.1). Upgrade requests are created ONLY through request_upgrade(): there is no direct
-- insert (no policy, no grant), so the price is always computed by the database.
create table public.upgrade_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients(id) on delete cascade,
  from_pack_code  text check (from_pack_code ~ '^P[1-4]$'),
  to_pack_code    text check (to_pack_code ~ '^P[1-4]$'),
  extras          text[] not null default '{}',
  computed_price  numeric(10,2) not null check (computed_price >= 0),
  pricing_version text not null,
  note            text check (char_length(note) <= 1000),
  status          text not null default 'pending' check (status in ('pending','approved','rejected')),
  admin_note      text,
  created_at      timestamptz not null default now(),
  resolved_at     timestamptz,
  check (to_pack_code is not null or cardinality(extras) > 0)
);
create index idx_upgrade_requests_client on public.upgrade_requests (client_id, created_at desc);
create index idx_upgrade_requests_pending on public.upgrade_requests (created_at) where status = 'pending';
alter table public.upgrade_requests enable row level security;
grant select, update on public.upgrade_requests to authenticated;
create policy "upgrades read own or admin" on public.upgrade_requests for select to authenticated
  using (client_id = private.client_id_of((select auth.uid())) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "upgrades admin update" on public.upgrade_requests for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');

-- Mirror of computeUpgrade() (packages/pricing/src/upgrade.ts): list-price difference between packs plus extras at
-- list price, deduplicated, no extra discount. client_id and from_pack_code come from the session, never the caller.
create or replace function public.request_upgrade(p_to_pack_code text, p_extras text[] default '{}', p_note text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare
  v_client   uuid;
  v_from_id  uuid;
  v_from     public.pack_templates;
  v_to       public.pack_templates;
  v_extras   text[] := coalesce((select array_agg(distinct e order by e) from unnest(coalesce(p_extras, '{}')) e), '{}');
  v_found    int;
  v_diff     numeric := 0;
  v_extras_price numeric := 0;
  v_version  text;
  v_id       uuid;
begin
  if (select auth.uid()) is null then raise exception 'forbidden'; end if;
  v_client := private.client_id_of((select auth.uid()));
  if v_client is null then raise exception 'not_a_client'; end if;
  if p_to_pack_code is null and cardinality(v_extras) = 0 then raise exception 'nothing_requested'; end if;

  select pack_template_id into v_from_id from public.clients where id = v_client;
  select * into v_from from public.pack_templates where id = v_from_id;
  v_version := v_from.pricing_version;

  if p_to_pack_code is not null then
    select * into v_to from public.pack_templates where code = p_to_pack_code;
    if v_to.id is null then raise exception 'unknown_pack'; end if;
    if v_from.code is null or v_from.price is null or v_to.price is null then raise exception 'pack_not_priced'; end if;
    if v_to.price <= v_from.price then raise exception 'not_an_upgrade'; end if;
    v_diff := v_to.price - v_from.price;
    v_version := v_to.pricing_version;
  end if;

  if cardinality(v_extras) > 0 then
    select count(*), coalesce(sum(precio), 0) into v_found, v_extras_price
      from public.pack_extras where code = any (v_extras) and activo and precio is not null;
    if v_found <> cardinality(v_extras) then raise exception 'unknown_extra'; end if;
  end if;

  if v_version is null then raise exception 'pack_not_priced'; end if;
  insert into public.upgrade_requests (client_id, from_pack_code, to_pack_code, extras, computed_price, pricing_version, note)
    values (v_client, v_from.code, p_to_pack_code, v_extras, v_diff + v_extras_price, v_version, p_note)
    returning id into v_id;
  return v_id;
end $$;
revoke all on function public.request_upgrade(text, text[], text) from public, anon;
grant execute on function public.request_upgrade(text, text[], text) to authenticated;
