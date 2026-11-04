create extension if not exists pgtap with schema extensions;

create schema if not exists tests;
grant usage on schema tests to anon, authenticated, service_role;

create or replace function tests.create_user(
  p_email text,
  p_role public.user_role,
  p_name text default null,
  p_parent_email text default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := gen_random_uuid();
  v_parent uuid;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_id, 'authenticated', 'authenticated', p_email, now(), now(), now());

  if p_parent_email is not null then
    select id into v_parent from auth.users where email = p_parent_email;
  end if;

  insert into public.profiles (id, role, full_name, parent_closer_id, closer_rate, parent_rate)
  values (
    v_id,
    p_role,
    coalesce(p_name, p_email),
    v_parent,
    case when p_role = 'closer' then 10 end,
    case when v_parent is not null then 5 end
  );

  return v_id;
end;
$$;

create or replace function tests.user_id(p_email text)
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select id from auth.users where email = p_email
$$;

create or replace function tests.login_as(p_email text, p_aal text default 'aal2')
returns void
language plpgsql
as $$
declare
  v_id uuid;
begin
  reset role;
  select id into v_id from auth.users where email = p_email;
  if v_id is null then
    raise exception 'unknown test user %', p_email;
  end if;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', v_id, 'role', 'authenticated', 'aal', p_aal, 'email', p_email)::text,
    true
  );
  set local role authenticated;
end;
$$;

create or replace function tests.login_aal1(p_email text)
returns void
language sql
as $$
  select tests.login_as(p_email, 'aal1')
$$;

create or replace function tests.login_service()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  set local role service_role;
end;
$$;

create or replace function tests.logout()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
end;
$$;

create or replace function tests.count_all(p_relation regclass)
returns bigint
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count bigint;
begin
  execute format('select count(*) from %s', p_relation) into v_count;
  return v_count;
end;
$$;

create or replace function tests.clean()
returns void
language plpgsql
as $$
begin
  reset role;
  delete from public.activities;
  delete from public.deals;
  delete from public.contacts;
  delete from public.leads;
  update public.profiles set parent_closer_id = null, parent_rate = null;
  delete from public.profiles;
  delete from auth.users;
  delete from private.form_quota;
  delete from private.audit_log;
end;
$$;

grant execute on all functions in schema tests to anon, authenticated, service_role;

begin;

select plan(6);

select is_empty(
  $$
    select table_schema || '.' || table_name
    from information_schema.role_table_grants
    where grantee = 'anon'
      and table_schema in ('public', 'private')
      and table_name not in ('public_packs', 'public_extras', 'public_settings')
  $$,
  'anon has no entries in role_table_grants outside the public views'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relname not in ('public_packs', 'public_extras', 'public_settings')
      and case
        when c.relkind in ('r', 'v', 'm', 'f', 'p') then
          has_table_privilege('anon', c.oid, 'select,insert,update,delete,truncate,references,trigger')
          or has_any_column_privilege('anon', c.oid, 'select,insert,update,references')
        else false
      end
  $$,
  'anon holds no privilege on any relation or column in public or private'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and case
        when c.relkind = 'S' then has_sequence_privilege('anon', c.oid, 'usage,select,update')
        else false
      end
  $$,
  'anon holds no privilege on any sequence'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and has_function_privilege('anon', p.oid, 'execute')
      and not exists (
        select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e'
      )
  $$,
  'anon cannot execute any function in public or private'
);

select ok(
  not has_schema_privilege('anon', 'private', 'usage'),
  'anon has no usage on schema private'
);

select ok(
  not has_schema_privilege('public', 'private', 'usage'),
  'PUBLIC has no usage on schema private'
);

select * from finish();

rollback;
