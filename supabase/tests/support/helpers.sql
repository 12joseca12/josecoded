create schema tests;

grant execute on all functions in schema extensions to anon, authenticated, service_role;

create function tests.create_user(
  p_email text,
  p_role public.user_role,
  p_name text default null,
  p_parent_email text default null
)
returns uuid
language plpgsql
as $$
declare
  v_id uuid := md5(p_email)::uuid;
  v_parent uuid := case when p_parent_email is null then null else md5(p_parent_email)::uuid end;
begin
  insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
  values (v_id, 'authenticated', 'authenticated', p_email, now(), now(), now());

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

create function tests.login_as(p_email text, p_aal text default 'aal2')
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config(
    'request.jwt.claims',
    json_build_object('sub', md5(p_email)::uuid, 'role', 'authenticated', 'aal', p_aal, 'email', p_email)::text,
    true
  );
  set local role authenticated;
end;
$$;

create function tests.login_aal1(p_email text)
returns void
language sql
as $$
  select tests.login_as(p_email, 'aal1')
$$;

create function tests.login_service()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'service_role')::text, true);
  set local role service_role;
end;
$$;

create function tests.logout()
returns void
language plpgsql
as $$
begin
  reset role;
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  set local role anon;
end;
$$;

create function tests.clean()
returns void
language plpgsql
as $$
begin
  if coalesce(current_setting('app.test_db', true), '') <> 'on' then
    raise exception 'tests.clean refuses to run outside a database flagged app.test_db = on';
  end if;
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
