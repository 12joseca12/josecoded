-- Task 1.8e (plan v3.4; DATOS v1.4 §14.0–§14.4, §14.7 migration 2, §14.12.1–§14.12.2). Closers in the CRM: staff
-- members that can be disabled, invitations with a mandatory commission rate, one owner per contact, the sharing model
-- (policies replaced one per role and action, P2), CSV imports with the conflict queue (Q22), staff invitations,
-- reassignment, close requests, team counters and the Telegram link codes.
--
-- Security notes:
--   * TOTP is enforced in the database (coordinator addendum, Q24): private.is_admin(), is_closer() and is_staff() also
--     require the aal2 claim of the JWT. An aal1 token stolen from a cookie reads nothing through PostgREST.
--     service_role bypasses RLS and is not affected; the claim and enrolment calls (claim_staff_access) do not use them.
--   * Every public RPC is a security invoker wrapper over a private.*_impl definer function (see 20261029100000), so the
--     security advisor stays at zero. The impls check authorisation themselves.
--   * The same drop policy / create policy name rule as DATOS §14.7: a policy replaced keeps its name.

-- 1) Enums.
create type public.import_status as enum ('done', 'failed');
create type public.conflict_status as enum ('pending', 'resolved');
create type public.conflict_resolution as enum ('assign_existing', 'assign_importer', 'merge', 'discard');

-- 1b) staff_members columns first: the SQL helpers below are validated when they are created.
alter table public.staff_members
  add column disabled_at     timestamptz,
  add column invited_by      uuid references auth.users (id) on delete set null,
  add column commission_rate numeric(5, 2) not null default 0 check (commission_rate between 0 and 100),
  add column notes           text;
create index idx_staff_members_invited_by on public.staff_members (invited_by);

-- crm_contacts.owner_id: the only key of the sharing model. null = Jose's own portfolio.
alter table public.crm_contacts
  add column owner_id uuid references public.staff_members (user_id) on delete set null;
create index idx_crm_contacts_owner on public.crm_contacts (owner_id) where archived_at is null;
create index idx_crm_contacts_owner_next on public.crm_contacts (owner_id, next_action_at) where archived_at is null;

-- 2) Helpers (DATOS §14.3). The aal2 check is one function so the three roles share it.
create or replace function private.is_aal2() returns boolean
language sql stable set search_path = '' as $$
  select coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
$$;
revoke all on function private.is_aal2() from public, anon, authenticated;
grant execute on function private.is_aal2() to authenticated, service_role;

-- Same signature as in the base migration; adds the aal2 claim and respects disabled_at.
create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_aal2()
     and exists (select 1 from public.staff_members s
                 where s.user_id = (select auth.uid()) and s.role = 'admin' and s.disabled_at is null)
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

create or replace function private.is_closer() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_aal2()
     and exists (select 1 from public.staff_members s
                 where s.user_id = (select auth.uid()) and s.role = 'closer' and s.disabled_at is null)
$$;
revoke all on function private.is_closer() from public, anon, authenticated;
grant execute on function private.is_closer() to authenticated;

create or replace function private.is_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_admin() or private.is_closer()
$$;
revoke all on function private.is_staff() from public, anon, authenticated;
grant execute on function private.is_staff() to authenticated;

-- True for a staff member that was switched off: the policies of the catalogue use it to give a disabled closer 0 rows
-- in everything, as the matrix of DATOS §14.3 says.
create or replace function private.is_disabled_staff() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members s
                 where s.user_id = (select auth.uid()) and s.disabled_at is not null)
$$;
revoke all on function private.is_disabled_staff() from public, anon, authenticated;
grant execute on function private.is_disabled_staff() to authenticated;

-- The active closer owns the contact. Primary key lookup: cheap per row.
create or replace function private.owns_contact(p_contact_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_closer()
     and exists (select 1 from public.crm_contacts c
                 where c.id = p_contact_id and c.owner_id = (select auth.uid()))
$$;
revoke all on function private.owns_contact(uuid) from public, anon, authenticated;
grant execute on function private.owns_contact(uuid) to authenticated;

create or replace function private.owns_client(p_client_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select private.is_closer()
     and exists (select 1 from public.clients cl join public.crm_contacts c on c.id = cl.contact_id
                 where cl.id = p_client_id and c.owner_id = (select auth.uid()))
$$;
revoke all on function private.owns_client(uuid) from public, anon, authenticated;
grant execute on function private.owns_client(uuid) to authenticated;

-- Statuses a closer cannot set by hand: «Cerrar cobrado» (admin) sets them.
create or replace function private.closer_status_allowed(p_status text) returns boolean
language sql immutable set search_path = '' as $$ select p_status not in ('won', 'active_client') $$;
revoke all on function private.closer_status_allowed(text) from public, anon, authenticated;
grant execute on function private.closer_status_allowed(text) to authenticated, service_role;

-- LinkedIn URLs are compared lower-cased, without query string, fragment or trailing slash (DATOS §14.4).
create or replace function private.normalize_linkedin(p_url text) returns text
language sql immutable set search_path = '' as $$
  select nullif(rtrim(regexp_replace(lower(btrim(p_url)), '[?#].*$', ''), '/'), '')
$$;
revoke all on function private.normalize_linkedin(text) from public, anon, authenticated;
grant execute on function private.normalize_linkedin(text) to authenticated, service_role;

-- 3) staff_members: disabled_at, invited_by, commission_rate (Q21), notes. The select policy is replaced (own row or
--    admin); the admin writes. notes is the admin's private note about the person: not readable with the own-row policy
--    (column grant); the admin reads it through admin_staff_list().

-- Name kept from the base migration (rule: a replaced policy keeps its name); it now means own row or admin.
drop policy staff_members_select_own on public.staff_members;
create policy staff_members_select_own on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy staff_members_insert on public.staff_members for insert to authenticated
  with check ((select private.is_admin()));
create policy staff_members_update on public.staff_members for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy staff_members_delete on public.staff_members for delete to authenticated
  using ((select private.is_admin()));
revoke select on public.staff_members from authenticated;
grant select (user_id, role, display_name, telegram_chat_id, disabled_at, invited_by, commission_rate, created_at, updated_at)
  on public.staff_members to authenticated;
grant insert, update, delete on public.staff_members to authenticated;

-- 4) Invitations (Q21: the rate is mandatory; 0 for a role without commission).
create table public.staff_invites (
  id              uuid primary key default gen_random_uuid(),
  email           extensions.citext not null check (btrim(email::text) <> ''),
  role            public.staff_role not null,
  commission_rate numeric(5, 2) not null check (commission_rate between 0 and 100),
  invited_by      uuid references auth.users (id) on delete set null,
  expires_at      timestamptz not null default now() + interval '14 days',
  claimed_at      timestamptz,
  claimed_user_id uuid references auth.users (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.staff_invites enable row level security;
create unique index uq_staff_invites_open on public.staff_invites (email) where claimed_at is null;
create index idx_staff_invites_invited_by on public.staff_invites (invited_by);
create index idx_staff_invites_claimed_user on public.staff_invites (claimed_user_id);
create trigger staff_invites_set_updated_at before update on public.staff_invites
  for each row execute function private.set_updated_at();
create policy staff_invites_select on public.staff_invites for select to authenticated using ((select private.is_admin()));
create policy staff_invites_insert on public.staff_invites for insert to authenticated with check ((select private.is_admin()));
create policy staff_invites_update on public.staff_invites for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy staff_invites_delete on public.staff_invites for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.staff_invites to authenticated;

-- 5) Guards and the LinkedIn index.
create index idx_crm_contacts_linkedin on public.crm_contacts (private.normalize_linkedin(linkedin_url)) where archived_at is null;

-- A closer never links a contact to an auth user (user_id feeds the client area through admin_close_lead_paid) and
-- never touches the affiliate, money or ownership of a lead. Guards run for the API role only: the definer RPCs
-- (claim_client_access, create_lead, the admin ones) run as the function owner and pass.
create or replace function private.crm_contacts_closer_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Nested on purpose: private.is_admin() is only executable by authenticated, so it must not be evaluated for other roles.
  if current_user = 'authenticated' then
    if (tg_op = 'INSERT' and new.user_id is not null)
       or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
      if not private.is_admin() then
        raise exception 'closers cannot link a contact to a user' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.crm_contacts_closer_guard() from public, anon, authenticated;
create trigger crm_contacts_closer_guard before insert or update on public.crm_contacts
  for each row execute function private.crm_contacts_closer_guard();

create or replace function private.leads_closer_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if new.affiliate_code is distinct from old.affiliate_code or new.amount is distinct from old.amount
       or new.paid_at is distinct from old.paid_at or new.user_id is distinct from old.user_id
       or new.contact_id is distinct from old.contact_id or new.idempotency_key is distinct from old.idempotency_key
       or (new.status = 'won' and old.status is distinct from 'won') then
      if not private.is_admin() then
        raise exception 'closers cannot change amount, affiliate, owner link or win a lead' using errcode = '42501';
      end if;
    end if;
  end if;
  return new;
end $$;
revoke all on function private.leads_closer_guard() from public, anon, authenticated;
create trigger leads_closer_guard before update on public.leads
  for each row execute function private.leads_closer_guard();

-- 6) Policies replaced (P2: one per role and action; P3: (select …)).
drop policy crm_contacts_select on public.crm_contacts;
create policy crm_contacts_select on public.crm_contacts for select to authenticated
  using ((select private.is_admin()) or (owner_id = (select auth.uid()) and (select private.is_closer())));
drop policy crm_contacts_insert on public.crm_contacts;
create policy crm_contacts_insert on public.crm_contacts for insert to authenticated
  with check ((select private.is_admin()) or (owner_id = (select auth.uid()) and (select private.is_closer())));
drop policy crm_contacts_update on public.crm_contacts;
create policy crm_contacts_update on public.crm_contacts for update to authenticated
  using ((select private.is_admin()) or (owner_id = (select auth.uid()) and (select private.is_closer())))
  with check ((select private.is_admin())
              or (owner_id = (select auth.uid()) and (select private.is_closer()) and private.closer_status_allowed(status)));
-- crm_contacts_delete (admin only) is unchanged.

drop policy leads_select on public.leads;
create policy leads_select on public.leads for select to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy leads_insert on public.leads;
create policy leads_insert on public.leads for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy leads_update on public.leads;
create policy leads_update on public.leads for update to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)))
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));

drop policy crm_interactions_select on public.crm_interactions;
create policy crm_interactions_select on public.crm_interactions for select to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy crm_interactions_insert on public.crm_interactions;
create policy crm_interactions_insert on public.crm_interactions for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy crm_interactions_update on public.crm_interactions;
create policy crm_interactions_update on public.crm_interactions for update to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)))
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));

drop policy crm_message_drafts_select on public.crm_message_drafts;
create policy crm_message_drafts_select on public.crm_message_drafts for select to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy crm_message_drafts_insert on public.crm_message_drafts;
create policy crm_message_drafts_insert on public.crm_message_drafts for insert to authenticated
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));
drop policy crm_message_drafts_update on public.crm_message_drafts;
create policy crm_message_drafts_update on public.crm_message_drafts for update to authenticated
  using ((select private.is_admin()) or (select private.owns_contact(contact_id)))
  with check ((select private.is_admin()) or (select private.owns_contact(contact_id)));

-- Global data: organisations (select and insert for the team) and templates (select).
drop policy crm_organizations_select on public.crm_organizations;
create policy crm_organizations_select on public.crm_organizations for select to authenticated
  using ((select private.is_staff()));
drop policy crm_organizations_insert on public.crm_organizations;
create policy crm_organizations_insert on public.crm_organizations for insert to authenticated
  with check ((select private.is_staff()));
drop policy crm_message_templates_select on public.crm_message_templates;
create policy crm_message_templates_select on public.crm_message_templates for select to authenticated
  using ((select private.is_staff()));

-- 7) Imports (DATOS §14.2, §14.12.2).
create table public.crm_imports (
  id              uuid primary key default gen_random_uuid(),
  owner_id        uuid not null references public.staff_members (user_id) on delete cascade,
  file_name       text,
  checksum        text not null check (btrim(checksum) <> ''),
  row_count       integer not null default 0,
  created_count   integer not null default 0,
  updated_count   integer not null default 0,
  skipped_count   integer not null default 0,
  conflicts_count integer not null default 0,
  errors          jsonb not null default '[]',
  status          public.import_status not null default 'done',
  created_at      timestamptz not null default now()
);
alter table public.crm_imports enable row level security;
-- Idempotency: the same file twice for the same importer returns the first result. Also serves owner_id (P4).
create unique index uq_crm_imports_owner_checksum on public.crm_imports (owner_id, checksum);
create index idx_crm_imports_owner_created on public.crm_imports (owner_id, created_at desc);
create policy crm_imports_select on public.crm_imports for select to authenticated
  using ((owner_id = (select auth.uid()) and (select private.is_closer())) or (select private.is_admin()));
grant select on public.crm_imports to authenticated;

create table public.crm_import_conflicts (
  id                  uuid primary key default gen_random_uuid(),
  import_id           uuid not null references public.crm_imports (id) on delete cascade,
  owner_id            uuid not null references public.staff_members (user_id) on delete cascade,
  row_index           integer not null,
  "row"               jsonb not null,
  existing_contact_id uuid not null references public.crm_contacts (id) on delete restrict,
  existing_owner_id   uuid,
  status              public.conflict_status not null default 'pending',
  resolution          public.conflict_resolution,
  resolved_by         uuid references auth.users (id) on delete set null,
  resolved_at         timestamptz,
  resolution_note     text,
  created_at          timestamptz not null default now(),
  constraint crm_import_conflicts_resolved check ((status = 'resolved') = (resolution is not null))
);
alter table public.crm_import_conflicts enable row level security;
create unique index uq_crm_import_conflicts_row on public.crm_import_conflicts (import_id, row_index);
create index idx_crm_import_conflicts_pending on public.crm_import_conflicts (status) where status = 'pending';
create index idx_crm_import_conflicts_owner on public.crm_import_conflicts (owner_id, status);
create index idx_crm_import_conflicts_existing on public.crm_import_conflicts (existing_contact_id);
create index idx_crm_import_conflicts_resolved_by on public.crm_import_conflicts (resolved_by);
create policy crm_import_conflicts_select on public.crm_import_conflicts for select to authenticated
  using ((owner_id = (select auth.uid()) and (select private.is_closer())) or (select private.is_admin()));
-- The importer never receives who owns the other side: existing_contact_id, existing_owner_id and resolution_note are
-- not granted to any JWT (the admin reads them through admin_import_conflicts()).
grant select (id, import_id, owner_id, row_index, "row", status, resolution, resolved_at, created_at)
  on public.crm_import_conflicts to authenticated;

-- 8) Internal helpers of the import (plain functions: only the definer RPCs below call them).
create or replace function private.crm_org_ensure(p_name text, p_kind public.contact_kind, p_city text) returns uuid
language plpgsql set search_path = '' as $$
declare
  v_norm text;
  v_id   uuid;
begin
  if nullif(btrim(p_name), '') is null then return null; end if;
  v_norm := private.normalize_name(p_name);
  select o.id into v_id from public.crm_organizations o where o.name_normalized = v_norm;
  if v_id is not null then return v_id; end if;
  insert into public.crm_organizations (name, name_normalized, kind, city, source)
  values (btrim(p_name), v_norm,
          case p_kind when 'agency' then 'agency' when 'recruiter' then 'recruiter_firm' else 'other' end::public.org_kind,
          nullif(btrim(p_city), ''), 'import_csv')
  on conflict (name_normalized) do nothing
  returning id into v_id;
  if v_id is null then
    select o.id into v_id from public.crm_organizations o where o.name_normalized = v_norm;
  end if;
  return v_id;
end $$;
revoke all on function private.crm_org_ensure(text, public.contact_kind, text) from public, anon, authenticated;

-- Fills the empty columns of a contact from a normalised import row and merges the tags (coalesce(old, new)).
create or replace function private.crm_contact_fill(p_contact_id uuid, p_row jsonb) returns void
language plpgsql set search_path = '' as $$
declare
  v_tags text[] := case when jsonb_typeof(p_row -> 'tags') = 'array'
                        then array(select jsonb_array_elements_text(p_row -> 'tags')) else '{}'::text[] end;
begin
  update public.crm_contacts c set
    organization_id = coalesce(c.organization_id, private.crm_org_ensure(p_row ->> 'organization', c.kind, p_row ->> 'city')),
    role            = coalesce(c.role, nullif(btrim(p_row ->> 'role'), '')),
    email           = coalesce(c.email, nullif(btrim(p_row ->> 'email'), '')::extensions.citext),
    phone           = coalesce(c.phone, nullif(btrim(p_row ->> 'phone'), '')),
    linkedin_url    = coalesce(c.linkedin_url, nullif(btrim(p_row ->> 'linkedin_url'), '')),
    owner_note      = coalesce(c.owner_note, nullif(btrim(p_row ->> 'notes'), '')),
    tags            = (select coalesce(array_agg(distinct x order by x), '{}'::text[]) from unnest(c.tags || v_tags) x)
  where c.id = p_contact_id;
end $$;
revoke all on function private.crm_contact_fill(uuid, jsonb) from public, anon, authenticated;

-- 9) crm_import_contacts_csv (DATOS §14.4, Q22). Closer (active) or admin; ≤ 500 rows already validated by zod.
create or replace function private.crm_import_contacts_csv_impl(p_rows jsonb, p_file_name text, p_checksum text)
returns jsonb
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_uid       uuid := (select auth.uid());
  v_admin     boolean := private.is_admin();
  v_owner     uuid;
  v_import    public.crm_imports;
  v_import_id uuid;
  r           jsonb;
  v_idx       integer := 0;
  v_created   integer := 0;
  v_updated   integer := 0;
  v_skipped   integer := 0;
  v_conflicts integer := 0;
  v_errors    jsonb := '[]'::jsonb;
  v_name      text;
  v_email     text;
  v_phone     text;
  v_linkedin  text;
  v_kind      public.contact_kind;
  v_locale    public.locale;
  v_norm      jsonb;
  v_existing  public.crm_contacts;
  v_new_id    uuid;
  v_tags      text[];
begin
  if not (v_admin or private.is_closer()) then raise exception 'forbidden' using errcode = '42501'; end if;
  if nullif(btrim(p_checksum), '') is null then raise exception 'checksum_required' using errcode = '22023'; end if;
  if jsonb_typeof(p_rows) is distinct from 'array' then raise exception 'rows_must_be_an_array' using errcode = '22023'; end if;
  if jsonb_array_length(p_rows) > 500 then raise exception 'too_many_rows' using errcode = '22023'; end if;
  v_owner := case when v_admin then null else v_uid end;  -- the admin's contacts have owner_id null

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm_import:' || v_uid::text, 0));

  select * into v_import from public.crm_imports i where i.owner_id = v_uid and i.checksum = p_checksum;
  if v_import.id is not null then
    return jsonb_build_object('import_id', v_import.id, 'created', v_import.created_count, 'updated', v_import.updated_count,
                              'skipped', v_import.skipped_count, 'conflicts', v_import.conflicts_count,
                              'errors', v_import.errors, 'replayed', true);
  end if;

  insert into public.crm_imports (owner_id, file_name, checksum, row_count)
  values (v_uid, left(p_file_name, 255), p_checksum, jsonb_array_length(p_rows))
  returning id into v_import_id;

  for r in select value from jsonb_array_elements(p_rows) loop
    v_idx := v_idx + 1;
    v_name := nullif(btrim(r ->> 'display_name'), '');
    v_email := lower(nullif(btrim(r ->> 'email'), ''));
    v_phone := nullif(btrim(r ->> 'phone'), '');
    v_linkedin := nullif(btrim(r ->> 'linkedin_url'), '');
    v_kind := case coalesce(nullif(btrim(r ->> 'kind'), ''), 'lead')
                when 'lead' then 'lead' when 'agency' then 'agency' when 'recruiter' then 'recruiter'
                when 'other' then 'other' else null end::public.contact_kind;
    v_locale := case r ->> 'locale' when 'en' then 'en' else 'es' end::public.locale;
    v_tags := case when jsonb_typeof(r -> 'tags') = 'array'
                   then array(select jsonb_array_elements_text(r -> 'tags')) else '{}'::text[] end;

    if jsonb_typeof(r) is distinct from 'object' or v_name is null or v_kind is null
       or (v_email is null and v_phone is null and v_linkedin is null) then
      v_skipped := v_skipped + 1;
      v_errors := v_errors || jsonb_build_array(jsonb_build_object('row', v_idx, 'reason', 'invalid'));
      continue;
    end if;

    v_norm := jsonb_build_object(
      'display_name', v_name, 'email', v_email, 'phone', v_phone, 'linkedin_url', v_linkedin, 'kind', v_kind,
      'organization', nullif(btrim(r ->> 'organization'), ''), 'role', nullif(btrim(r ->> 'role'), ''),
      'city', nullif(btrim(r ->> 'city'), ''), 'notes', nullif(btrim(r ->> 'notes'), ''),
      'tags', to_jsonb(v_tags), 'locale', v_locale);

    v_existing := null;
    if v_email is not null then
      select c.* into v_existing from public.crm_contacts c
       where c.archived_at is null and c.email operator(extensions.=) v_email::extensions.citext
       order by c.created_at, c.id limit 1;
    end if;
    if v_existing.id is null and private.normalize_linkedin(v_linkedin) is not null then
      select c.* into v_existing from public.crm_contacts c
       where c.archived_at is null and private.normalize_linkedin(c.linkedin_url) = private.normalize_linkedin(v_linkedin)
       order by c.created_at, c.id limit 1;
    end if;

    if v_existing.id is null then
      -- (a) new contact for the importer.
      insert into public.crm_contacts (kind, status, display_name, role, email, phone, linkedin_url, locale, owner_note,
                                       source, tags, owner_id, organization_id)
      values (v_kind, case v_kind when 'agency' then 'pending' else 'new' end, v_name, nullif(btrim(r ->> 'role'), ''),
              v_email::extensions.citext, v_phone, v_linkedin, v_locale, nullif(btrim(r ->> 'notes'), ''),
              'import_csv', v_tags, v_owner,
              private.crm_org_ensure(r ->> 'organization', v_kind, r ->> 'city'))
      returning id into v_new_id;
      insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
      values (v_new_id, 'import', 'internal', 'system', jsonb_build_object('import_id', v_import_id, 'row', v_idx));
      v_created := v_created + 1;
    elsif v_admin or v_existing.owner_id is not distinct from v_owner then
      -- (b) mine (or the admin merging): fill the empty columns.
      perform private.crm_contact_fill(v_existing.id, v_norm);
      insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
      values (v_existing.id, 'import', 'internal', 'system', jsonb_build_object('import_id', v_import_id, 'row', v_idx));
      v_updated := v_updated + 1;
    else
      -- (c) someone else's contact: the row waits for the admin; nothing is read back to the importer.
      insert into public.crm_import_conflicts (import_id, owner_id, row_index, "row", existing_contact_id, existing_owner_id)
      values (v_import_id, v_uid, v_idx, v_norm, v_existing.id, v_existing.owner_id);
      v_conflicts := v_conflicts + 1;
    end if;
  end loop;

  update public.crm_imports set created_count = v_created, updated_count = v_updated, skipped_count = v_skipped,
         conflicts_count = v_conflicts, errors = v_errors
   where id = v_import_id;

  perform private.enqueue('crm.import_done', jsonb_build_object(
    'import_id', v_import_id, 'owner_id', v_uid, 'created', v_created, 'updated', v_updated,
    'skipped', v_skipped, 'conflicts', v_conflicts));
  if v_conflicts > 0 then
    perform private.enqueue('crm.import_conflicts', jsonb_build_object(
      'import_id', v_import_id, 'owner_id', v_uid, 'conflicts', v_conflicts));
  end if;

  return jsonb_build_object('import_id', v_import_id, 'created', v_created, 'updated', v_updated,
                            'skipped', v_skipped, 'conflicts', v_conflicts, 'errors', v_errors);
end $$;
revoke all on function private.crm_import_contacts_csv_impl(jsonb, text, text) from public, anon, authenticated;
grant execute on function private.crm_import_contacts_csv_impl(jsonb, text, text) to authenticated, service_role;

create or replace function public.crm_import_contacts_csv(p_rows jsonb, p_file_name text, p_checksum text)
returns jsonb language sql security invoker set search_path = '' as $$
  select private.crm_import_contacts_csv_impl(p_rows, p_file_name, p_checksum)
$$;
revoke all on function public.crm_import_contacts_csv(jsonb, text, text) from public, anon, authenticated;
grant execute on function public.crm_import_contacts_csv(jsonb, text, text) to authenticated;

-- 10) Conflict queue for the admin (Q22): the full reading the column grants hide, and the four resolutions.
create or replace function private.admin_import_conflicts_impl(p_status public.conflict_status)
returns table (id uuid, import_id uuid, importer_user_id uuid, importer_name text, "row" jsonb,
               existing_contact_id uuid, existing_display_name text, existing_kind public.contact_kind,
               existing_status text, existing_owner_id uuid, existing_owner_name text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select k.id, k.import_id, k.owner_id, coalesce(si.display_name, ui.email::text), k."row",
         k.existing_contact_id, c.display_name, c.kind, c.status, c.owner_id, coalesce(so.display_name, 'Jose'),
         k.created_at
    from public.crm_import_conflicts k
    join public.crm_contacts c on c.id = k.existing_contact_id
    left join public.staff_members si on si.user_id = k.owner_id
    left join auth.users ui on ui.id = k.owner_id
    left join public.staff_members so on so.user_id = c.owner_id
   where p_status is null or k.status = p_status
   order by k.created_at, k.id;
end $$;
revoke all on function private.admin_import_conflicts_impl(public.conflict_status) from public, anon, authenticated;
grant execute on function private.admin_import_conflicts_impl(public.conflict_status) to authenticated, service_role;

create or replace function public.admin_import_conflicts(p_status public.conflict_status default 'pending')
returns table (id uuid, import_id uuid, importer_user_id uuid, importer_name text, "row" jsonb,
               existing_contact_id uuid, existing_display_name text, existing_kind public.contact_kind,
               existing_status text, existing_owner_id uuid, existing_owner_name text, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from private.admin_import_conflicts_impl(p_status)
$$;
revoke all on function public.admin_import_conflicts(public.conflict_status) from public, anon, authenticated;
grant execute on function public.admin_import_conflicts(public.conflict_status) to authenticated;

create or replace function private.admin_import_conflict_resolve_impl(
  p_id uuid, p_resolution public.conflict_resolution, p_note text)
returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_uid      uuid := (select auth.uid());
  k          public.crm_import_conflicts;
  v_contact  public.crm_contacts;
  v_effective public.conflict_resolution := p_resolution;
  v_new_id   uuid;
  v_kind     public.contact_kind;
  v_tags     text[];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_resolution is null then raise exception 'resolution_required' using errcode = '22023'; end if;
  select * into k from public.crm_import_conflicts x where x.id = p_id for update;
  if k.id is null then raise exception 'conflict_not_found' using errcode = 'P0002'; end if;
  if k.status <> 'pending' then raise exception 'conflict_not_pending' using errcode = '22023'; end if;

  select * into v_contact from public.crm_contacts c where c.id = k.existing_contact_id for update;
  -- The contact was archived meanwhile (it cannot be deleted: the foreign key restricts it): the importer gets a new one.
  if v_contact.id is null or v_contact.archived_at is not null then
    v_effective := 'assign_importer';
    v_kind := coalesce((k."row" ->> 'kind')::public.contact_kind, 'lead');
    v_tags := case when jsonb_typeof(k."row" -> 'tags') = 'array'
                   then array(select jsonb_array_elements_text(k."row" -> 'tags')) else '{}'::text[] end;
    insert into public.crm_contacts (kind, status, display_name, role, email, phone, linkedin_url, locale, owner_note,
                                     source, tags, owner_id, organization_id)
    values (v_kind, case v_kind when 'agency' then 'pending' else 'new' end, k."row" ->> 'display_name',
            k."row" ->> 'role', (k."row" ->> 'email')::extensions.citext, k."row" ->> 'phone', k."row" ->> 'linkedin_url',
            coalesce((k."row" ->> 'locale')::public.locale, 'es'), k."row" ->> 'notes', 'import_csv', v_tags,
            k.owner_id, private.crm_org_ensure(k."row" ->> 'organization', v_kind, k."row" ->> 'city'))
    returning id into v_new_id;
    insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
    values (v_new_id, 'import', 'internal', 'system', 'conflicto de importacion: contacto nuevo para el importador',
            jsonb_build_object('conflict_id', k.id));
  elsif p_resolution = 'assign_existing' then
    insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
    values (v_contact.id, 'note', 'internal', 'jose', 'conflicto de importacion: se mantiene', jsonb_build_object('conflict_id', k.id));
  elsif p_resolution = 'assign_importer' then
    update public.crm_contacts set owner_id = k.owner_id where id = v_contact.id;
    perform private.crm_contact_fill(v_contact.id, k."row");
    insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
    values (v_contact.id, 'note', 'internal', 'jose', 'reasignado por conflicto de importacion', jsonb_build_object('conflict_id', k.id));
  elsif p_resolution = 'merge' then
    perform private.crm_contact_fill(v_contact.id, k."row");
    insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
    values (v_contact.id, 'import', 'internal', 'jose', jsonb_build_object('conflict_id', k.id));
  end if;  -- discard: nothing changes

  update public.crm_import_conflicts set status = 'resolved', resolution = v_effective, resolved_by = v_uid,
         resolved_at = now(), resolution_note = p_note
   where id = k.id;
  perform private.enqueue('crm.import_conflict_resolved', jsonb_build_object(
    'conflict_id', k.id, 'owner_id', k.owner_id,
    'outcome', case when v_effective = 'assign_importer' then 'assigned' else 'not_assigned' end));
end $$;
revoke all on function private.admin_import_conflict_resolve_impl(uuid, public.conflict_resolution, text) from public, anon, authenticated;
grant execute on function private.admin_import_conflict_resolve_impl(uuid, public.conflict_resolution, text) to authenticated, service_role;

create or replace function public.admin_import_conflict_resolve(
  p_id uuid, p_resolution public.conflict_resolution, p_note text default null)
returns void language sql security invoker set search_path = '' as $$
  select private.admin_import_conflict_resolve_impl(p_id, p_resolution, p_note)
$$;
revoke all on function public.admin_import_conflict_resolve(uuid, public.conflict_resolution, text) from public, anon, authenticated;
grant execute on function public.admin_import_conflict_resolve(uuid, public.conflict_resolution, text) to authenticated;

-- 11) Staff: invitation, claim, switch on/off, reassignment.
create or replace function private.admin_staff_invite_impl(
  p_email extensions.citext, p_role public.staff_role, p_commission_rate numeric)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid    uuid := (select auth.uid());
  v_email  extensions.citext := nullif(btrim(p_email::text), '')::extensions.citext;
  v_id     uuid;
  v_locale public.locale;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_email is null or position('@' in v_email::text) = 0 then raise exception 'invalid_email' using errcode = '22023'; end if;
  if p_role is null then raise exception 'role_required' using errcode = '22023'; end if;
  if p_commission_rate is null or p_commission_rate < 0 or p_commission_rate > 100 then
    raise exception 'invalid_commission_rate' using errcode = '22023';
  end if;
  if exists (select 1 from auth.users u join public.staff_members s on s.user_id = u.id
              where u.email::extensions.citext operator(extensions.=) v_email) then
    raise exception 'already_staff' using errcode = '22023';
  end if;

  insert into public.staff_invites as i (email, role, commission_rate, invited_by)
  values (v_email, p_role, round(p_commission_rate, 2), v_uid)
  on conflict (email) where claimed_at is null do update set
    role = excluded.role, commission_rate = excluded.commission_rate, invited_by = excluded.invited_by,
    expires_at = now() + interval '14 days'
  returning i.id into v_id;

  select p.locale into v_locale from auth.users u join public.user_profiles p on p.user_id = u.id
   where u.email::extensions.citext operator(extensions.=) v_email;
  perform private.enqueue('staff.invited', jsonb_build_object(
    'email', v_email::text, 'role', p_role, 'locale', coalesce(v_locale, 'es'::public.locale)));
  return v_id;
end $$;
revoke all on function private.admin_staff_invite_impl(extensions.citext, public.staff_role, numeric) from public, anon, authenticated;
grant execute on function private.admin_staff_invite_impl(extensions.citext, public.staff_role, numeric) to authenticated, service_role;

create or replace function public.admin_staff_invite(p_email extensions.citext, p_role public.staff_role, p_commission_rate numeric)
returns uuid language sql security invoker set search_path = '' as $$
  select private.admin_staff_invite_impl(p_email, p_role, p_commission_rate)
$$;
revoke all on function public.admin_staff_invite(extensions.citext, public.staff_role, numeric) from public, anon, authenticated;
grant execute on function public.admin_staff_invite(extensions.citext, public.staff_role, numeric) to authenticated;

-- Called after the login (and before the TOTP enrolment, so it does not need aal2). The confirmed email picks the
-- invitation; a closer without an invitation gets null. Idempotent: a staff member gets the current role back.
create or replace function private.claim_staff_access_impl() returns public.staff_role
language plpgsql security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_role  public.staff_role;
  v_email extensions.citext;
  v_inv   public.staff_invites;
begin
  perform private.assert_email_confirmed();
  select s.role into v_role from public.staff_members s where s.user_id = v_uid;
  if v_role is not null then return v_role; end if;

  select u.email::extensions.citext into v_email from auth.users u where u.id = v_uid;
  if v_email is null then return null; end if;
  select * into v_inv from public.staff_invites i
   where i.email operator(extensions.=) v_email and i.claimed_at is null and i.expires_at > now()
   for update skip locked;
  if v_inv.id is null then return null; end if;

  insert into public.staff_members (user_id, role, display_name, invited_by, commission_rate)
  values (v_uid, v_inv.role,
          coalesce((select p.display_name from public.user_profiles p where p.user_id = v_uid), split_part(v_email::text, '@', 1)),
          v_inv.invited_by, v_inv.commission_rate);
  update public.staff_invites set claimed_at = now(), claimed_user_id = v_uid where id = v_inv.id;
  perform private.enqueue('staff.claimed', jsonb_build_object('user_id', v_uid, 'role', v_inv.role));
  return v_inv.role;
end $$;
revoke all on function private.claim_staff_access_impl() from public, anon, authenticated;
grant execute on function private.claim_staff_access_impl() to authenticated, service_role;

create or replace function public.claim_staff_access() returns public.staff_role
language sql security invoker set search_path = '' as $$
  select private.claim_staff_access_impl()
$$;
revoke all on function public.claim_staff_access() from public, anon, authenticated;
grant execute on function public.claim_staff_access() to authenticated;

-- Switch on/off, rate and notes. A null argument keeps the current value. Disabling deletes nothing.
create or replace function private.admin_staff_set_impl(
  p_user_id uuid, p_disabled boolean, p_commission_rate numeric, p_notes text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_commission_rate is not null and (p_commission_rate < 0 or p_commission_rate > 100) then
    raise exception 'invalid_commission_rate' using errcode = '22023';
  end if;
  if p_disabled is true and p_user_id = (select auth.uid()) then
    raise exception 'cannot_disable_self' using errcode = '22023';
  end if;
  update public.staff_members set
    disabled_at     = case when p_disabled is null then disabled_at when p_disabled then coalesce(disabled_at, now()) else null end,
    commission_rate = coalesce(round(p_commission_rate, 2), commission_rate),
    notes           = coalesce(p_notes, notes)
   where user_id = p_user_id;
  if not found then raise exception 'staff_not_found' using errcode = 'P0002'; end if;
end $$;
revoke all on function private.admin_staff_set_impl(uuid, boolean, numeric, text) from public, anon, authenticated;
grant execute on function private.admin_staff_set_impl(uuid, boolean, numeric, text) to authenticated, service_role;

create or replace function public.admin_staff_set(p_user_id uuid, p_disabled boolean, p_commission_rate numeric, p_notes text)
returns void language sql security invoker set search_path = '' as $$
  select private.admin_staff_set_impl(p_user_id, p_disabled, p_commission_rate, p_notes)
$$;
revoke all on function public.admin_staff_set(uuid, boolean, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_staff_set(uuid, boolean, numeric, text) to authenticated;

-- Moves a whole portfolio. p_from null = Jose's portfolio; p_to null (or an admin) = Jose. Returns how many contacts moved.
create or replace function private.admin_reassign_contacts_impl(p_from uuid, p_to uuid) returns integer
language plpgsql security definer set search_path = '' as $$
declare
  v_to    uuid := p_to;
  v_count integer;
  v_ids   uuid[];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_to is not null then
    if not exists (select 1 from public.staff_members s where s.user_id = v_to) then
      raise exception 'staff_not_found' using errcode = 'P0002';
    end if;
    if exists (select 1 from public.staff_members s where s.user_id = v_to and s.role = 'admin') then v_to := null; end if;
  end if;
  if p_from is not distinct from v_to then return 0; end if;

  with moved as (
    update public.crm_contacts set owner_id = v_to
     where owner_id is not distinct from p_from
    returning id
  )
  select coalesce(array_agg(m.id), '{}'::uuid[]) into v_ids from moved m;
  v_count := cardinality(v_ids);
  insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
  select i, 'note', 'internal', 'jose', 'reasignado', jsonb_build_object('from', p_from, 'to', v_to)
    from unnest(v_ids) i;
  return v_count;
end $$;
revoke all on function private.admin_reassign_contacts_impl(uuid, uuid) from public, anon, authenticated;
grant execute on function private.admin_reassign_contacts_impl(uuid, uuid) to authenticated, service_role;

create or replace function public.admin_reassign_contacts(p_from uuid, p_to uuid) returns integer
language sql security invoker set search_path = '' as $$
  select private.admin_reassign_contacts_impl(p_from, p_to)
$$;
revoke all on function public.admin_reassign_contacts(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_reassign_contacts(uuid, uuid) to authenticated;

-- 12) crm_request_close: a closer asks Jose to close an opportunity as paid (K3 «Pedir cierre»).
create or replace function private.crm_request_close_impl(p_lead_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_lead public.leads;
  v_owner uuid;
begin
  select * into v_lead from public.leads l where l.id = p_lead_id;
  if v_lead.id is null then raise exception 'lead_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_contact(v_lead.contact_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  if v_lead.status <> 'open' then raise exception 'lead_not_open' using errcode = '22023'; end if;

  update public.crm_contacts set next_action = 'Jose: cerrar cobrado', next_action_at = now()
   where id = v_lead.contact_id
  returning owner_id into v_owner;
  insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, body)
  values (v_lead.contact_id, 'note', 'internal', 'jose', v_lead.id, 'cierre solicitado');
  perform private.enqueue('lead.close_requested', jsonb_build_object(
    'lead_id', v_lead.id, 'contact_id', v_lead.contact_id, 'owner_id', v_owner));
end $$;
revoke all on function private.crm_request_close_impl(uuid) from public, anon, authenticated;
grant execute on function private.crm_request_close_impl(uuid) to authenticated, service_role;

create or replace function public.crm_request_close(p_lead_id uuid) returns void
language sql security invoker set search_path = '' as $$
  select private.crm_request_close_impl(p_lead_id)
$$;
revoke all on function public.crm_request_close(uuid) from public, anon, authenticated;
grant execute on function public.crm_request_close(uuid) to authenticated;

-- 13) Team counters (global data of DATOS §14.0): numbers only, no names.
create or replace function private.crm_team_counters_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'team_contacts',        (select count(*) from public.crm_contacts c where c.archived_at is null),
    'team_leads_won_month', (select count(*) from public.leads l
                              where l.status = 'won' and coalesce(l.paid_at, l.updated_at) >= date_trunc('month', now())),
    'team_leads_open',      (select count(*) from public.leads l where l.status = 'open'));
end $$;
revoke all on function private.crm_team_counters_impl() from public, anon, authenticated;
grant execute on function private.crm_team_counters_impl() to authenticated, service_role;

create or replace function public.crm_team_counters() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.crm_team_counters_impl()
$$;
revoke all on function public.crm_team_counters() from public, anon, authenticated;
grant execute on function public.crm_team_counters() to authenticated;

-- 14) Telegram link codes (K7): the closer asks for a code, sends /start <code> to the bot, and the gateway links the chat.
create table public.staff_telegram_codes (
  user_id    uuid primary key references public.staff_members (user_id) on delete cascade,
  code       text not null unique check (char_length(code) = 8),
  expires_at timestamptz not null
);
alter table public.staff_telegram_codes enable row level security;
create policy staff_telegram_codes_select on public.staff_telegram_codes for select to authenticated
  using ((user_id = (select auth.uid()) and (select private.is_aal2())) or (select private.is_admin()));
create policy staff_telegram_codes_insert on public.staff_telegram_codes for insert to authenticated
  with check ((user_id = (select auth.uid()) and (select private.is_aal2())) or (select private.is_admin()));
create policy staff_telegram_codes_delete on public.staff_telegram_codes for delete to authenticated
  using ((user_id = (select auth.uid()) and (select private.is_aal2())) or (select private.is_admin()));
grant select, insert, delete on public.staff_telegram_codes to authenticated;

create or replace function private.staff_telegram_begin_impl() returns text
language plpgsql security definer set search_path = '' as $$
declare
  v_uid  uuid := (select auth.uid());
  v_code text;
begin
  if not private.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  loop
    v_code := upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 8));
    exit when not exists (select 1 from public.staff_telegram_codes c where c.code = v_code);
  end loop;
  insert into public.staff_telegram_codes (user_id, code, expires_at)
  values (v_uid, v_code, now() + interval '15 minutes')
  on conflict (user_id) do update set code = excluded.code, expires_at = excluded.expires_at;
  return v_code;
end $$;
revoke all on function private.staff_telegram_begin_impl() from public, anon, authenticated;
grant execute on function private.staff_telegram_begin_impl() to authenticated, service_role;

create or replace function public.staff_telegram_begin() returns text
language sql security invoker set search_path = '' as $$
  select private.staff_telegram_begin_impl()
$$;
revoke all on function public.staff_telegram_begin() from public, anon, authenticated;
grant execute on function public.staff_telegram_begin() to authenticated;

-- Gateway only (service role): links the chat of whoever holds the code and burns it. Callable by service_role alone,
-- so it stays a plain definer function (the advisor only flags the ones an authenticated user can execute).
create or replace function public.staff_telegram_link(p_code text, p_chat_id text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare v_user uuid;
begin
  select c.user_id into v_user from public.staff_telegram_codes c
   where c.code = upper(btrim(p_code)) and c.expires_at > now() for update;
  if v_user is null or nullif(btrim(p_chat_id), '') is null then return false; end if;
  update public.staff_members set telegram_chat_id = btrim(p_chat_id) where user_id = v_user;
  delete from public.staff_telegram_codes where user_id = v_user;
  return true;
end $$;
revoke all on function public.staff_telegram_link(text, text) from public, anon, authenticated;
grant execute on function public.staff_telegram_link(text, text) to service_role;
