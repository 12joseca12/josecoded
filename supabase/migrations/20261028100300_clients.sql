-- Task 1.8a (plan v3.2; DATOS v1.1 §4.4, §5, §6). Client area (A1–A6): clients, tasks, task comments, extras and
-- upgrade requests, plus request_upgrade(), claim_client_access() and area_lead_summary(). client_assets and the
-- storage bucket are in 20261028100400. One user = one client (uq user_id).

create type public.project_phase as enum ('kickoff', 'design', 'build', 'review', 'delivered', 'maintenance');
create type public.task_status as enum ('pending', 'in_progress', 'done');
create type public.asset_source as enum ('client', 'admin');
create type public.client_extra_status as enum ('included', 'requested', 'active', 'rejected');
create type public.upgrade_status as enum ('pending', 'accepted', 'rejected');

create table public.clients (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.crm_contacts (id) on delete restrict,
  lead_id        uuid references public.leads (id) on delete set null,  -- opportunity of origin
  user_id        uuid unique references auth.users (id) on delete set null,
  invite_email   extensions.citext,
  pack_code      text not null references public.packs (code),
  pack_option    text,
  project_phase  public.project_phase not null default 'kickoff',
  starts_at      date,
  delivered_at   date,
  notes_internal text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.clients enable row level security;
create index idx_clients_contact on public.clients (contact_id);
create index idx_clients_lead on public.clients (lead_id);
create index idx_clients_pack on public.clients (pack_code);
create index idx_clients_invite_email on public.clients (invite_email) where user_id is null;
create trigger clients_set_updated_at before update on public.clients
  for each row execute function private.set_updated_at();

-- Id of the current user's client (null when they have none). Used by the policies of the area and of storage.
create or replace function private.client_id_of() returns uuid
language sql stable security definer set search_path = '' as $$
  select c.id from public.clients c where c.user_id = (select auth.uid())
$$;
revoke all on function private.client_id_of() from public, anon, authenticated;
grant execute on function private.client_id_of() to authenticated;

create policy clients_select on public.clients for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy clients_insert on public.clients for insert to authenticated with check ((select private.is_admin()));
create policy clients_update on public.clients for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy clients_delete on public.clients for delete to authenticated using ((select private.is_admin()));
-- Select by column: notes_internal (and the CRM links) are never readable with a user's JWT.
grant select (id, pack_code, pack_option, project_phase, starts_at, delivered_at, created_at) on public.clients to authenticated;
grant insert, update, delete on public.clients to authenticated;

-- Admin read of every column (notes_internal, contact_id, lead_id, user_id, invite_email, updated_at), which the column
-- grant above hides from every JWT, Jose's included. The column grant stays the only gate for clients; this RPC checks
-- is_admin() inside. One client by id, or all of them (newest first) when p_client_id is null.
create or replace function public.admin_clients(p_client_id uuid default null)
returns setof public.clients
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select c.* from public.clients c
   where p_client_id is null or c.id = p_client_id
   order by c.created_at desc, c.id;
end $$;
revoke all on function public.admin_clients(uuid) from public, anon, authenticated;
grant execute on function public.admin_clients(uuid) to authenticated;

create table public.client_tasks (
  id          uuid primary key default gen_random_uuid(),
  client_id   uuid not null references public.clients (id) on delete cascade,
  title       text not null,
  description text,
  status      public.task_status not null default 'pending',
  sort        integer not null default 0,
  due_at      date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
alter table public.client_tasks enable row level security;
create index idx_client_tasks_client on public.client_tasks (client_id, sort);
create trigger client_tasks_set_updated_at before update on public.client_tasks
  for each row execute function private.set_updated_at();
create policy client_tasks_select on public.client_tasks for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()));
create policy client_tasks_insert on public.client_tasks for insert to authenticated with check ((select private.is_admin()));
create policy client_tasks_update on public.client_tasks for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy client_tasks_delete on public.client_tasks for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.client_tasks to authenticated;

create table public.client_task_comments (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  task_id        uuid references public.client_tasks (id) on delete cascade,
  author_user_id uuid references auth.users (id) on delete set null,
  body           text not null check (char_length(body) between 1 and 4000),
  internal       boolean not null default false,
  created_at     timestamptz not null default now()
);
alter table public.client_task_comments enable row level security;
create index idx_client_task_comments_task on public.client_task_comments (task_id, created_at);
create index idx_client_task_comments_client on public.client_task_comments (client_id);
create index idx_client_task_comments_author on public.client_task_comments (author_user_id);
create policy client_task_comments_select on public.client_task_comments for select to authenticated
  using ((client_id = (select private.client_id_of()) and not internal) or (select private.is_admin()));
-- A client comments as themselves, never internally, and only on a task of their own client.
create policy client_task_comments_insert on public.client_task_comments for insert to authenticated
  with check (
    (client_id = (select private.client_id_of()) and not internal and author_user_id = (select auth.uid())
     and (task_id is null or exists (select 1 from public.client_tasks t
                                     where t.id = client_task_comments.task_id and t.client_id = client_task_comments.client_id)))
    or (select private.is_admin())
  );
create policy client_task_comments_update on public.client_task_comments for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy client_task_comments_delete on public.client_task_comments for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.client_task_comments to authenticated;

create table public.client_extras (
  id             uuid primary key default gen_random_uuid(),
  client_id      uuid not null references public.clients (id) on delete cascade,
  extra_code     text not null references public.extras (code) on delete restrict,
  free           boolean not null default false,
  amount         numeric(10, 2) check (amount >= 0),
  status         public.client_extra_status not null,
  source_lead_id uuid references public.leads (id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.client_extras enable row level security;
create index idx_client_extras_client on public.client_extras (client_id);
create index idx_client_extras_extra on public.client_extras (extra_code);
create index idx_client_extras_source_lead on public.client_extras (source_lead_id);
create unique index uq_client_extras_live on public.client_extras (client_id, extra_code)
  where status in ('included', 'active');
create trigger client_extras_set_updated_at before update on public.client_extras
  for each row execute function private.set_updated_at();
create policy client_extras_select on public.client_extras for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()));
create policy client_extras_insert on public.client_extras for insert to authenticated with check ((select private.is_admin()));
create policy client_extras_update on public.client_extras for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy client_extras_delete on public.client_extras for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.client_extras to authenticated;

-- Created ONLY through request_upgrade() by clients (no insert policy for them), so the price is computed by the DB.
create table public.upgrade_requests (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid not null references public.clients (id) on delete cascade,
  from_pack_code  text references public.packs (code),
  to_pack_code    text references public.packs (code),
  extras          text[] not null default '{}',
  computed_price  integer not null check (computed_price >= 0),
  pricing_version text not null,
  status          public.upgrade_status not null default 'pending',
  admin_note      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint upgrade_requests_something check (to_pack_code is not null or cardinality(extras) > 0)
);
alter table public.upgrade_requests enable row level security;
create index idx_upgrade_requests_client on public.upgrade_requests (client_id, created_at desc);
create index idx_upgrade_requests_to_pack on public.upgrade_requests (to_pack_code);
create index idx_upgrade_requests_from_pack on public.upgrade_requests (from_pack_code);
create trigger upgrade_requests_set_updated_at before update on public.upgrade_requests
  for each row execute function private.set_updated_at();
create policy upgrade_requests_select on public.upgrade_requests for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()));
create policy upgrade_requests_insert on public.upgrade_requests for insert to authenticated
  with check ((select private.is_admin()));
create policy upgrade_requests_update on public.upgrade_requests for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy upgrade_requests_delete on public.upgrade_requests for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.upgrade_requests to authenticated;

-- Recycled from 20260917100500_upgrade_requests.sql (mirror of computeUpgrade() in packages/pricing): list-price
-- difference between packs plus extras at list price, deduplicated. client_id and from_pack_code come from the session.
create or replace function public.request_upgrade(p_to_pack_code text, p_extras text[] default '{}')
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_client       uuid;
  v_from         public.packs;
  v_to           public.packs;
  v_extras       text[] := coalesce((select array_agg(distinct e order by e) from unnest(coalesce(p_extras, '{}')) e), '{}');
  v_found        integer;
  v_diff         integer := 0;
  v_extras_price integer := 0;
  v_version      text;
  v_id           uuid;
begin
  perform private.assert_email_confirmed();
  v_client := private.client_id_of();
  if v_client is null then raise exception 'not_a_client' using errcode = '42501'; end if;
  if p_to_pack_code is null and cardinality(v_extras) = 0 then raise exception 'nothing_requested' using errcode = '22023'; end if;

  select p.* into v_from from public.clients c join public.packs p on p.code = c.pack_code where c.id = v_client;
  v_version := v_from.pricing_version;

  if p_to_pack_code is not null then
    select p.* into v_to from public.packs p where p.code = p_to_pack_code and p.active;
    if v_to.code is null then raise exception 'unknown_pack' using errcode = '22023'; end if;
    if v_to.price <= v_from.price then raise exception 'not_an_upgrade' using errcode = '22023'; end if;
    v_diff := v_to.price - v_from.price;
    v_version := v_to.pricing_version;
  end if;

  if cardinality(v_extras) > 0 then
    select count(*), coalesce(sum(x.price), 0) into v_found, v_extras_price
      from public.extras x where x.code = any (v_extras) and x.active;
    if v_found <> cardinality(v_extras) then raise exception 'unknown_extra' using errcode = '22023'; end if;
  end if;

  insert into public.upgrade_requests (client_id, from_pack_code, to_pack_code, extras, computed_price, pricing_version)
  values (v_client, v_from.code, p_to_pack_code, v_extras, v_diff + v_extras_price, v_version)
  returning id into v_id;

  perform private.enqueue('upgrade.requested', jsonb_build_object(
    'id', v_id, 'client_id', v_client, 'from_pack_code', v_from.code, 'to_pack_code', p_to_pack_code,
    'extras', to_jsonb(v_extras), 'computed_price', v_diff + v_extras_price));
  return v_id;
end $$;
revoke all on function public.request_upgrade(text, text[]) from public, anon, authenticated;
grant execute on function public.request_upgrade(text, text[]) to authenticated;

-- Recycled from 20260917100600_client_access_claim.sql. The admin puts an email on the client; whoever registers AND
-- confirms that email is linked by calling this after the auth callback (D35). The email is read from auth.users, not
-- from the JWT. Also links the CRM contact. Returns the client id, or null when there is nothing to claim.
create or replace function public.claim_client_access() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  v_email   extensions.citext;
  v_id      uuid;
  v_contact uuid;
begin
  perform private.assert_email_confirmed();
  select c.id into v_id from public.clients c where c.user_id = v_uid;
  if v_id is not null then return v_id; end if;  -- already linked: idempotent

  select u.email::extensions.citext into v_email from auth.users u where u.id = v_uid;
  if v_email is null then return null; end if;
  -- skip locked: two concurrent sessions never claim the same row.
  select c.id, c.contact_id into v_id, v_contact from public.clients c
   where c.user_id is null and c.invite_email operator(extensions.=) v_email
   order by c.created_at, c.id
   limit 1
   for update skip locked;
  if v_id is null then return null; end if;
  update public.clients set user_id = v_uid where id = v_id;
  update public.crm_contacts set user_id = v_uid where id = v_contact and user_id is null;
  return v_id;
end $$;
revoke all on function public.claim_client_access() from public, anon, authenticated;
grant execute on function public.claim_client_access() to authenticated;

-- Recycled from 20260929100000_user_profiles.sql. Most recent lead of the current user (by user_id, or by a contact
-- with their confirmed email). Five fields: never the whole ai_proposal nor the amount.
create or replace function public.area_lead_summary()
returns table (pack_code text, pack_option text, price_from integer, status public.lead_status, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_uid   uuid := (select auth.uid());
  v_email extensions.citext;
begin
  perform private.assert_email_confirmed();
  select u.email::extensions.citext into v_email from auth.users u where u.id = v_uid;
  return query
  select l.pack_code, l.pack_option,
         coalesce((l.ai_proposal ->> 'priceFrom')::integer, o.price, p.price),
         l.status, l.created_at
    from public.leads l
    join public.crm_contacts c on c.id = l.contact_id
    left join public.packs p on p.code = l.pack_code
    left join public.pack_options o on o.pack_code = l.pack_code and o.code = l.pack_option
   where l.user_id = v_uid or (v_email is not null and c.email operator(extensions.=) v_email)
   order by l.created_at desc, l.id
   limit 1;
end $$;
revoke all on function public.area_lead_summary() from public, anon, authenticated;
grant execute on function public.area_lead_summary() to authenticated;
