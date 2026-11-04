create extension if not exists citext with schema extensions;

create schema if not exists private;

revoke all on schema private from public;
grant usage on schema private to authenticated, service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;
alter default privileges in schema public revoke all on functions from anon, authenticated;
alter default privileges in schema private revoke all on tables from anon, authenticated;
alter default privileges in schema private revoke all on sequences from anon, authenticated;
alter default privileges in schema private revoke all on functions from anon, authenticated;

create type public.user_role as enum ('admin', 'closer', 'freelance', 'client');
create type public.app_locale as enum ('es', 'en');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role public.user_role not null,
  full_name text not null,
  locale public.app_locale not null default 'es',
  parent_closer_id uuid references public.profiles (id) on delete restrict,
  closer_rate numeric(5, 2),
  parent_rate numeric(5, 2),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint profiles_full_name_length check (char_length(btrim(full_name)) between 1 and 200),
  constraint profiles_parent_is_not_self check (parent_closer_id is distinct from id),
  constraint profiles_closer_rate_range check (closer_rate between 0 and 100),
  constraint profiles_parent_rate_range check (parent_rate between 0 and 100),
  constraint profiles_rates_and_parent_only_for_closers check (
    role = 'closer' or (closer_rate is null and parent_rate is null and parent_closer_id is null)
  ),
  constraint profiles_parent_rate_needs_parent check (
    parent_closer_id is not null or parent_rate is null
  )
);

create index profiles_parent_closer_id_idx on public.profiles (parent_closer_id);

create table private.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid,
  table_name text not null,
  row_id uuid,
  action text not null,
  before jsonb,
  after jsonb,
  at timestamptz not null default now(),
  constraint audit_log_action_valid check (action in ('insert', 'update', 'delete'))
);

create index audit_log_table_row_idx on private.audit_log (table_name, row_id, at desc);
create index audit_log_at_idx on private.audit_log (at desc);

alter table public.profiles enable row level security;
alter table private.audit_log enable row level security;

revoke all on public.profiles from anon, authenticated;
revoke all on private.audit_log from anon, authenticated;

create function private.uid()
returns uuid
language sql
stable
set search_path = ''
as $$
  select auth.uid()
$$;

create function private.role()
returns public.user_role
language sql
stable
security definer
set search_path = ''
as $$
  select p.role
  from public.profiles p
  where p.id = auth.uid()
    and p.is_active
    and p.archived_at is null
$$;

create function private.is_aal2()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
$$;

create function private.is_admin()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.role() = 'admin', false) and private.is_aal2()
$$;

create function private.is_staff()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.role() in ('admin', 'closer', 'freelance'), false) and private.is_aal2()
$$;

create function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create function private.audit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row_id uuid;
  v_before jsonb;
  v_after jsonb;
begin
  if tg_op = 'DELETE' then
    v_row_id := old.id;
    v_before := to_jsonb(old);
  elsif tg_op = 'INSERT' then
    v_row_id := new.id;
    v_after := to_jsonb(new);
  else
    v_row_id := new.id;
    v_before := to_jsonb(old);
    v_after := to_jsonb(new);
  end if;

  insert into private.audit_log (actor_id, table_name, row_id, action, before, after)
  values (auth.uid(), tg_table_name, v_row_id, lower(tg_op), v_before, v_after);

  return null;
end;
$$;

create function private.profiles_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'profile_id_immutable' using errcode = '23514';
  end if;

  if new.parent_closer_id is not null then
    if not exists (
      select 1
      from public.profiles p
      where p.id = new.parent_closer_id
        and p.role = 'closer'
        and p.parent_closer_id is null
    ) then
      raise exception 'invalid_parent_closer' using errcode = '23514';
    end if;

    if tg_op = 'UPDATE' and exists (
      select 1 from public.profiles c where c.parent_closer_id = new.id
    ) then
      raise exception 'closer_with_subclosers_cannot_have_parent' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'UPDATE' and old.role = 'closer' and new.role <> 'closer' and exists (
    select 1 from public.profiles c where c.parent_closer_id = new.id
  ) then
    raise exception 'closer_has_subclosers' using errcode = '23514';
  end if;

  return new;
end;
$$;

create trigger profiles_guard
before insert or update on public.profiles
for each row execute function private.profiles_guard();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger profiles_audit_insert
after insert on public.profiles
for each row execute function private.audit();

create trigger profiles_audit_update
after update on public.profiles
for each row
when (
  old.role is distinct from new.role
  or old.parent_closer_id is distinct from new.parent_closer_id
  or old.closer_rate is distinct from new.closer_rate
  or old.parent_rate is distinct from new.parent_rate
  or old.is_active is distinct from new.is_active
  or old.archived_at is distinct from new.archived_at
)
execute function private.audit();

create trigger profiles_audit_delete
after delete on public.profiles
for each row execute function private.audit();

revoke all on function private.uid() from public, anon, authenticated;
revoke all on function private.role() from public, anon, authenticated;
revoke all on function private.is_aal2() from public, anon, authenticated;
revoke all on function private.is_admin() from public, anon, authenticated;
revoke all on function private.is_staff() from public, anon, authenticated;
revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.audit() from public, anon, authenticated;
revoke all on function private.profiles_guard() from public, anon, authenticated;

grant execute on function private.uid() to authenticated;
grant execute on function private.role() to authenticated;
grant execute on function private.is_aal2() to authenticated;
grant execute on function private.is_admin() to authenticated;
grant execute on function private.is_staff() to authenticated;

grant select on public.profiles to authenticated;
grant update (
  role, full_name, locale, parent_closer_id, closer_rate, parent_rate, is_active, archived_at
) on public.profiles to authenticated;

create policy profiles_select
on public.profiles
for select
to authenticated
using (
  id = (select private.uid())
  or (select private.is_admin())
  or (parent_closer_id = (select private.uid()) and (select private.is_staff()))
);

create policy profiles_update_admin
on public.profiles
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create view public.team_profiles
with (security_invoker = true)
as
select id, full_name, role
from public.profiles;

revoke all on public.team_profiles from anon, authenticated;
grant select on public.team_profiles to authenticated;

create function public.update_my_profile(
  p_full_name text default null,
  p_locale public.app_locale default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  if p_full_name is not null and char_length(btrim(p_full_name)) not between 1 and 200 then
    raise exception 'invalid_full_name' using errcode = '23514';
  end if;

  update public.profiles
  set full_name = btrim(coalesce(p_full_name, full_name)),
      locale = coalesce(p_locale, locale)
  where id = v_uid
    and is_active
    and archived_at is null;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function public.update_my_profile(text, public.app_locale) from public, anon, authenticated;
grant execute on function public.update_my_profile(text, public.app_locale) to authenticated;
