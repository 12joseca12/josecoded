-- Assertions for migration 20261028100000_base.sql + seed (plan 1.6 step 6; DATOS §2, §4.1, §4.2, §4.7, §6).
-- Run by supabase/test/pg/run.sh after shim + migrations + seed. Every check either raises `PASS <what>` as a notice
-- or raises an exception (which stops psql and fails the run). Each block runs in its own transaction and is rolled
-- back, so blocks do not depend on each other. Roles: `set local role` + `set local request.jwt.claims`, like PostgREST.
-- Seed ids: jose a1 (admin), ana a2, bob a3, sin a4 (unconfirmed email).

-- ---------------------------------------------------------------- seed and structure (as postgres)
do $$
declare n integer;
begin
  select count(*) into n from auth.users;
  if n <> 6 then raise exception 'FAIL seed has % auth users, expected 6', n; end if;
  raise notice 'PASS seed has the six auth users (jose, ana, bob, sin, carla, dani)';

  select count(*) into n from auth.identities;
  if n <> 6 then raise exception 'FAIL seed has % identities, expected 6', n; end if;
  raise notice 'PASS seed has one email identity per user';

  if (select email_confirmed_at from auth.users where email = 'sin@test') is not null then
    raise exception 'FAIL sin@test must be unconfirmed';
  end if;
  raise notice 'PASS sin@test is unconfirmed';

  select count(*) into n from public.staff_members;
  if n <> 3 or not exists (select 1 from public.staff_members
                           where user_id = '00000000-0000-4000-8000-0000000000a1' and role = 'admin')
     or (select string_agg(user_id::text || ':' || role || ':' || commission_rate || ':' || (disabled_at is not null),
                           ',' order by user_id)
           from public.staff_members where role = 'closer')
        <> '00000000-0000-4000-8000-0000000000a5:closer:10.00:false,00000000-0000-4000-8000-0000000000a6:closer:15.00:true' then
    raise exception 'FAIL staff_members must hold Jose (admin), carla (closer, 10, active) and dani (closer, 15, disabled)';
  end if;
  raise notice 'PASS staff_members holds Jose (admin), carla (closer 10 %%, active) and dani (closer 15 %%, disabled)';

  select count(*) into n from public.user_profiles;
  if n <> 6 then raise exception 'FAIL handle_new_user created % profiles, expected 6', n; end if;
  if (select display_name from public.user_profiles where user_id = '00000000-0000-4000-8000-0000000000a2') <> 'Ana Test'
     or (select locale from public.user_profiles where user_id = '00000000-0000-4000-8000-0000000000a3') <> 'en'
     or (select locale from public.user_profiles where user_id = '00000000-0000-4000-8000-0000000000a4') <> 'es' then
    raise exception 'FAIL handle_new_user did not copy full_name/locale from raw_user_meta_data';
  end if;
  raise notice 'PASS handle_new_user created one profile per user with name and locale';

  if (select string_agg(code || ':' || price, ',' order by code) from public.packs where code <> 'HIDDEN_PACK')
     <> 'P1:900,P2:1400,P3:2500,P4:4200,P5:4000' then
    raise exception 'FAIL packs differ from pricing.json';
  end if;
  raise notice 'PASS packs P1-P5 match pricing.json';

  if (select string_agg(pack_code || '.' || code || ':' || price, ',') from public.pack_options) <> 'P5.plus:6000' then
    raise exception 'FAIL pack_options must be exactly P5.plus 6000';
  end if;
  raise notice 'PASS pack_options is P5 plus 6000';

  if (select string_agg(code || ':' || price, ',' order by code) from public.extras)
     <> 'geo:300,maintenance_basic:49,maintenance_extended:149,security_audit:250,seo_basic:250,seo_full:600' then
    raise exception 'FAIL extras differ from pricing.json';
  end if;
  raise notice 'PASS extras match pricing.json';

  if (select string_agg(name || '|' || cron || '|' || coalesce(tz, '-'), ',' order by name) from private.scheduled_jobs)
     <> 'chat.notify_digest|*/10 * * * *|-,chat.purge_anonymous|0 4 * * *|-,content.poll_deploy|*/5 * * * *|-,crm.due_digest|0 8 * * 1-5|Europe/Madrid,outbox.drain|* * * * *|-,telegram.poll_updates|*/5 * * * *|-' then
    raise exception 'FAIL scheduled_jobs rows differ from plan 1.6 (v3.2: outbox.drain every tick)';
  end if;
  if exists (select 1 from private.scheduled_jobs where not enabled) then
    raise exception 'FAIL every seeded job starts enabled';
  end if;
  raise notice 'PASS scheduled_jobs holds the four launch rows of plan 1.6 plus content.poll_deploy and telegram.poll_updates (1.8e)';

  if exists (select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname in ('public', 'private') and c.relkind = 'r' and not c.relrowsecurity) then
    raise exception 'FAIL a table in public/private has RLS disabled';
  end if;
  raise notice 'PASS every table in public and private has RLS enabled';

  if exists (select 1 from pg_policies where schemaname = 'public' and cmd = 'ALL') then
    raise exception 'FAIL a public policy is `for all`';
  end if;
  if exists (select 1 from pg_policies where schemaname = 'public'
             group by tablename, cmd, roles having count(*) > 1) then
    raise exception 'FAIL multiple permissive policies for the same table, action and role';
  end if;
  raise notice 'PASS policies are per action, one per table/action/role';

  if exists (select 1 from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname = 'public' and c.relkind in ('v', 'm')) then
    raise exception 'FAIL public has a view';
  end if;
  raise notice 'PASS public has no views';

  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
             where s.nspname in ('public', 'private')
               and not coalesce('search_path=""' = any (p.proconfig), false)) then
    raise exception 'FAIL a function in public/private does not pin search_path to empty: %',
      (select string_agg(p.proname, ', ') from pg_proc p join pg_namespace s on s.oid = p.pronamespace
       where s.nspname in ('public', 'private') and not coalesce('search_path=""' = any (p.proconfig), false));
  end if;
  raise notice 'PASS every function in public and private pins search_path = ''''';

  if (select coalesce(string_agg(schemaname || '.' || tablename, ','), '') from pg_publication_tables
      where pubname = 'supabase_realtime') <> 'public.chat_messages' then
    raise exception 'FAIL supabase_realtime must publish public.chat_messages only (DATOS §8.6)';
  end if;
  raise notice 'PASS supabase_realtime publishes public.chat_messages only';

  if exists (select 1 from pg_extension where extname in ('pg_net', 'pg_cron')) then
    raise exception 'FAIL pg_net/pg_cron must not be installed (DATOS P9)';
  end if;
  if (select count(*) from pg_extension e join pg_namespace s on s.oid = e.extnamespace
      where e.extname in ('citext', 'unaccent', 'pgcrypto') and s.nspname = 'extensions') <> 3 then
    raise exception 'FAIL citext, unaccent and pgcrypto must live in extensions';
  end if;
  raise notice 'PASS extensions: citext, unaccent, pgcrypto in extensions; no pg_net or pg_cron';
end $$;

-- ---------------------------------------------------------------- grants (catalogue checks, DATOS P1/P5/P7)
do $$
declare r record;
begin
  if exists (select 1 from information_schema.role_table_grants
             where grantee in ('anon', 'PUBLIC') and table_schema in ('public', 'private')) then
    raise exception 'FAIL anon or PUBLIC holds a table privilege in public/private';
  end if;
  raise notice 'PASS anon holds no table-level privilege (blog_comments is a column grant, crm.test.sql)';

  for r in select p.oid, p.oid::regprocedure as sig from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname = 'public' loop
    if has_function_privilege('anon', r.oid, 'execute') then
      raise exception 'FAIL anon can execute %', r.sig;
    end if;
  end loop;
  raise notice 'PASS anon can execute no function in public';

  for r in select p.oid, p.oid::regprocedure as sig from pg_proc p join pg_namespace s on s.oid = p.pronamespace
           where s.nspname in ('public', 'private') and p.prosecdef loop
    -- Allowlist: the policy helpers and the private.*_impl bodies of the RPCs DATOS §6 and §14.4 grant to authenticated
    -- (they check the caller inside; private is not exposed by the API). No definer function in public may be executable
    -- by authenticated: that is what the security advisor flags (the public RPCs are invoker wrappers).
    if has_function_privilege('authenticated', r.oid, 'execute') and not (
         r.sig::text in (
           'private.is_admin()', 'private.is_closer()', 'private.is_staff()', 'private.is_disabled_staff()',
           'private.owns_contact(uuid)', 'private.owns_client(uuid)', 'private.owns_quote(uuid)',
           'private.quote_is_draft(uuid)', 'private.client_id_of()', 'private.comment_parent_ok(uuid,text,locale)',
           'private.staff_actor()', 'private.closer_contact_quota_hit()', 'private.client_has_pack(text)',
           'private.client_has_pack_option(text,text)', 'private.client_has_extra(text)', 'private.contact_has_deal(uuid)')
         or r.sig::text like 'private.%\_impl(%') then
      raise exception 'FAIL authenticated can execute security definer %', r.sig;
    end if;
  end loop;
  -- DATOS §10.4 (advisor 0029): no security definer lives in public; the RPCs are invoker wrappers over private impls.
  if exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
             where s.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute')) then
    raise exception 'FAIL a security definer function in public is executable by authenticated';
  end if;
  raise notice 'PASS authenticated executes only the allowlisted security definer helpers and RPCs';

  if has_schema_privilege('anon', 'private', 'usage') then raise exception 'FAIL anon has usage on private'; end if;
  if not has_schema_privilege('authenticated', 'private', 'usage') then
    raise exception 'FAIL authenticated needs usage on private for the policy helpers';
  end if;
  raise notice 'PASS private: no usage for anon, usage for authenticated';

  if exists (select 1 from information_schema.role_table_grants
             where grantee in ('authenticated', 'service_role') and table_schema = 'private') then
    raise exception 'FAIL private tables must have no grants (RPCs only)';
  end if;
  raise notice 'PASS private tables have no grants for the API roles';

  if (select string_agg(table_name || ':' || privilege_type, ',' order by table_name, privilege_type)
      from information_schema.role_table_grants where grantee = 'authenticated' and table_schema = 'public'
        and table_name in ('extras', 'pack_options', 'packs', 'staff_members', 'user_profiles'))
     <> 'extras:SELECT,pack_options:SELECT,packs:SELECT,staff_members:DELETE,staff_members:INSERT,staff_members:UPDATE,user_profiles:SELECT' then
    raise exception 'FAIL authenticated table grants differ from DATOS §4.1-4.2';
  end if;
  if (select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
      where grantee = 'authenticated' and table_schema = 'public' and table_name = 'user_profiles'
        and privilege_type = 'UPDATE') <> 'display_name,first_audience,first_audience_source,locale' then
    raise exception 'FAIL user_profiles update grant must be by column';
  end if;
  raise notice 'PASS authenticated: select on the five tables, update on four user_profiles columns';

  for r in select unnest(array['public.increment_quota(text,integer,interval)', 'public.scheduled_jobs_due(timestamptz)',
                                'public.scheduled_jobs_mark_ran(text,timestamptz,timestamptz)',
                                'public.scheduled_jobs_disable(text,text)', 'public.outbox_claim(integer,text)',
                                'public.outbox_ack(bigint[],text)', 'public.outbox_fail(bigint,text,text)',
                                'public.system_health()', 'public.test_set_email_confirmed(text,boolean)']) as f loop
    if not has_function_privilege('service_role', r.f, 'execute')
       or has_function_privilege('authenticated', r.f, 'execute')
       or has_function_privilege('anon', r.f, 'execute') then
      raise exception 'FAIL % must be service_role only', r.f;
    end if;
  end loop;
  raise notice 'PASS quota, jobs, outbox, system_health and the seed helper are service_role only';
end $$;

-- P1: something created later by postgres in public is not exposed to anon/authenticated by default.
begin;
create table public.p1_probe (id int);
create function public.p1_probe_fn() returns int language sql as $$ select 1 $$;
create function private.p1_probe_fn() returns int language sql as $$ select 1 $$;
do $$
begin
  if has_table_privilege('anon', 'public.p1_probe', 'select')
     or has_table_privilege('authenticated', 'public.p1_probe', 'select') then
    raise exception 'FAIL default privileges still grant new public tables to anon/authenticated';
  end if;
  if not has_table_privilege('service_role', 'public.p1_probe', 'select') then
    raise exception 'FAIL service_role lost its default table privileges';
  end if;
  -- has_function_privilege, not the ACL entries: EXECUTE through PUBLIC (built-in default) counts too.
  if has_function_privilege('anon', 'public.p1_probe_fn()', 'execute')
     or has_function_privilege('authenticated', 'public.p1_probe_fn()', 'execute')
     or has_function_privilege('authenticated', 'private.p1_probe_fn()', 'execute') then
    raise exception 'FAIL default privileges still let anon/authenticated execute new functions (PUBLIC?)';
  end if;
  if not has_function_privilege('service_role', 'public.p1_probe_fn()', 'execute') then
    raise exception 'FAIL service_role lost its default execute on new public functions';
  end if;
  raise notice 'PASS default privileges: new tables/functions get no anon/authenticated access (PUBLIC included)';
end $$;
rollback;

-- ---------------------------------------------------------------- anon (plan 1.6 step 6)
begin;
set local role anon;
do $$
declare t text;
begin
  foreach t in array array['packs', 'pack_options', 'extras', 'staff_members', 'user_profiles'] loop
    begin
      execute format('select 1 from public.%I', t);
      raise exception 'FAIL anon can read public.%', t;
    exception when insufficient_privilege then null;
    end;
  end loop;
  raise notice 'PASS anon: permission denied on packs, pack_options, extras, staff_members, user_profiles';

  begin
    perform private.is_admin();
    raise exception 'FAIL anon can call private.is_admin()';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.outbox_claim(10, 'anon');
    raise exception 'FAIL anon can call outbox_claim';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.system_health();
    raise exception 'FAIL anon can call system_health';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS anon: permission denied on private.is_admin, outbox_claim, system_health';
end $$;
rollback;

-- ---------------------------------------------------------------- authenticated without staff row: ana
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated","email":"ana@test"}';
do $$
declare n integer;
begin
  if private.is_admin() then raise exception 'FAIL is_admin() true for ana'; end if;
  raise notice 'PASS authenticated (ana): private.is_admin() is false';

  select count(*) into n from public.packs;
  if n <> 5 then raise exception 'FAIL ana reads % packs, expected 5 (P1-P5; hidden ones are for staff and their buyers)', n; end if;
  select count(*) into n from public.pack_options;
  if n <> 1 then raise exception 'FAIL ana reads % pack_options, expected 1', n; end if;
  select count(*) into n from public.extras;
  if n <> 6 then raise exception 'FAIL ana reads % extras, expected 6', n; end if;
  raise notice 'PASS authenticated reads the visible catalogue (5 packs, 1 option, 6 extras)';

  begin
    update public.packs set price = 1 where code = 'P1';
    raise exception 'FAIL ana can update packs';
  exception when insufficient_privilege then null;
  end;
  begin
    insert into public.extras (code, price, pricing_version) values ('x', 1, 'x');
    raise exception 'FAIL ana can insert extras';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS authenticated cannot write the catalogue';

  select count(*) into n from public.staff_members;
  if n <> 0 then raise exception 'FAIL ana sees % staff rows', n; end if;
  begin
    insert into public.staff_members (user_id) values ('00000000-0000-4000-8000-0000000000a2');
    raise exception 'FAIL ana can insert into staff_members';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS ana sees no staff row and cannot make herself staff';

  select count(*) into n from public.user_profiles;
  if n <> 1 or not exists (select 1 from public.user_profiles where user_id = '00000000-0000-4000-8000-0000000000a2') then
    raise exception 'FAIL ana must see only her own profile (sees %)', n;
  end if;
  raise notice 'PASS ana sees only her own profile';

  update public.user_profiles set display_name = 'Ana', locale = 'en', first_audience = 'client',
                                  first_audience_source = 'ref'
   where user_id = '00000000-0000-4000-8000-0000000000a2';
  get diagnostics n = row_count;
  if n <> 1 then raise exception 'FAIL ana could not update her granted columns'; end if;
  raise notice 'PASS ana updates display_name, locale, first_audience, first_audience_source';

  begin
    update public.user_profiles set first_audience = 'partner' where user_id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'FAIL first_audience was overwritten';
  exception when raise_exception then
    if sqlerrm <> 'first_audience is write-once' then raise; end if;
  end;
  raise notice 'PASS first_audience is write-once';

  begin
    update public.user_profiles set created_at = now() where user_id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'FAIL ana can update created_at';
  exception when insufficient_privilege then null;
  end;
  begin
    update public.user_profiles set user_id = '00000000-0000-4000-8000-0000000000a3'
     where user_id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'FAIL ana can update user_id';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS ana cannot update ungranted columns (user_id, created_at)';

  update public.user_profiles set display_name = 'hacked' where user_id = '00000000-0000-4000-8000-0000000000a3';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL ana updated bob''s profile'; end if;
  raise notice 'PASS ana cannot update another profile (0 rows)';

  begin
    insert into public.user_profiles (user_id) values (gen_random_uuid());
    raise exception 'FAIL ana can insert a profile';
  exception when insufficient_privilege then null;
  end;
  begin
    delete from public.user_profiles where user_id = '00000000-0000-4000-8000-0000000000a2';
    raise exception 'FAIL ana can delete her profile';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS profiles: no insert or delete for authenticated';

  begin
    perform public.outbox_claim(10, 'ana');
    raise exception 'FAIL ana can call outbox_claim';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.outbox_ack(array[1::bigint], 'ana');
    raise exception 'FAIL ana can call outbox_ack';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.outbox_fail(1, 'ana', 'x');
    raise exception 'FAIL ana can call outbox_fail';
  exception when insufficient_privilege then null;
  end;
  begin
    perform private.enqueue('x', '{}');
    raise exception 'FAIL ana can call private.enqueue';
  exception when insufficient_privilege then null;
  end;
  begin
    perform 1 from private.outbox;
    raise exception 'FAIL ana can read private.outbox';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS authenticated: permission denied on outbox RPCs, enqueue and private.outbox';

  begin
    perform public.scheduled_jobs_due(now());
    raise exception 'FAIL ana can call scheduled_jobs_due';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.increment_quota('k', 1, '1 day');
    raise exception 'FAIL ana can call increment_quota';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.system_health();
    raise exception 'FAIL ana can call system_health';
  exception when insufficient_privilege then null;
  end;
  begin
    perform public.test_set_email_confirmed('sin@test', true);
    raise exception 'FAIL ana can call test_set_email_confirmed';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS authenticated: permission denied on jobs, quota, system_health and the seed helper';
end $$;
rollback;

-- ---------------------------------------------------------------- authenticated, unconfirmed (sin) and no sub
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}';
do $$
begin
  if private.is_admin() then raise exception 'FAIL is_admin() true for sin'; end if;
  raise notice 'PASS authenticated (sin): private.is_admin() is false';
end $$;
reset request.jwt.claims;
do $$
begin
  if private.is_admin() then raise exception 'FAIL is_admin() true without a sub'; end if;
  raise notice 'PASS authenticated without claims: private.is_admin() is false';
end $$;
rollback;

-- ---------------------------------------------------------------- admin: jose
begin;
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal2","email":"jose@test"}';
do $$
declare n integer;
begin
  if not private.is_admin() then raise exception 'FAIL is_admin() false for jose'; end if;
  raise notice 'PASS authenticated (jose): private.is_admin() is true';

  select count(*) into n from public.staff_members;
  if n <> 3 then raise exception 'FAIL jose sees % staff rows, expected the three', n; end if;
  raise notice 'PASS the admin sees every staff row (jose, carla, dani)';

  select count(*) into n from public.user_profiles;
  if n <> 6 then raise exception 'FAIL admin sees % profiles, expected 6', n; end if;
  raise notice 'PASS admin reads every profile';

  update public.user_profiles set display_name = 'x' where user_id = '00000000-0000-4000-8000-0000000000a2';
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL admin updated another user''s profile'; end if;
  raise notice 'PASS admin cannot update other profiles (update policy is own-row only)';

  begin
    perform public.outbox_claim(10, 'jose');
    raise exception 'FAIL jose (authenticated) can call outbox_claim';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS admin as authenticated still cannot drain the outbox';
end $$;
rollback;

-- ---------------------------------------------------------------- assert_email_confirmed (as postgres with claims)
begin;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated"}';
do $$
begin
  begin
    perform private.assert_email_confirmed();
    raise exception 'FAIL assert_email_confirmed passed for sin@test';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS assert_email_confirmed refuses the unconfirmed sin@test';
end $$;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated"}';
do $$
begin
  perform private.assert_email_confirmed();
  raise notice 'PASS assert_email_confirmed accepts the confirmed ana@test';
end $$;
rollback;

-- ---------------------------------------------------------------- service_role: outbox lifecycle
begin;
delete from private.outbox;  -- the seed leaves comment.pending events; this block starts from an empty outbox
do $$ begin
  perform private.enqueue('lead.created', '{"id":"l1"}');
  perform private.enqueue('comment.pending', '{"id":"c1"}');
end $$;
set local role service_role;
do $$
declare
  ids bigint[];
  n integer;
  att smallint;
  evs text[];
  h jsonb;
begin
  select array_agg(c.id order by c.id), max(c.attempts) into ids, att from public.outbox_claim(50, 'test-worker') c;
  if coalesce(array_length(ids, 1), 0) <> 2 then raise exception 'FAIL claim returned % events, expected 2', ids; end if;
  if att <> 1 then raise exception 'FAIL the claim must count the attempt (attempts = %)', att; end if;
  raise notice 'PASS service_role claims the two pending events and the claim counts one attempt';

  select count(*) into n from public.outbox_claim(50, 'second-worker');
  if n <> 0 then raise exception 'FAIL claimed events were handed out twice'; end if;
  raise notice 'PASS a claimed event is not handed to a second drain';

  if public.outbox_ack(array[ids[1]], 'second-worker') <> 0 then raise exception 'FAIL ack by a worker that does not hold it'; end if;
  if public.outbox_fail(ids[2], 'second-worker', 'x') then raise exception 'FAIL fail by a worker that does not hold it'; end if;
  raise notice 'PASS outbox_ack and outbox_fail ignore events claimed by another worker';

  if public.outbox_ack(array[ids[1]], 'test-worker') <> 1 then raise exception 'FAIL ack did not mark the event'; end if;
  if public.outbox_ack(array[ids[1]], 'test-worker') <> 0 then raise exception 'FAIL ack is not idempotent'; end if;
  raise notice 'PASS outbox_ack marks once and is idempotent';

  if not public.outbox_fail(ids[2], 'test-worker', 'telegram 500') then raise exception 'FAIL fail by the holder'; end if;
  select count(*), max(c.attempts) into n, att from public.outbox_claim(50, 'retry') c;
  if n <> 1 or att <> 2 then raise exception 'FAIL a failed event must be claimable again with attempts 2 (got %, %)', n, att; end if;
  raise notice 'PASS a failed event is released for retry and fail does not double count the attempt';

  -- attempts 2 is claimed by 'retry'; fail + reclaim up to the 10th claim.
  for i in 3..10 loop
    perform public.outbox_fail(ids[2], case when i = 3 then 'retry' else 'w' || (i - 1) end, 'telegram 500');
    perform 1 from public.outbox_claim(50, 'w' || i);
  end loop;
  perform public.outbox_fail(ids[2], 'w10', 'telegram 500');
  select array_agg(c.event) into evs from public.outbox_claim(50, 'after-dead') c;
  if evs is distinct from array['system.outbox_dead'] then
    raise exception 'FAIL after 10 attempts expected only system.outbox_dead to be claimable, got %', evs;
  end if;
  raise notice 'PASS after 10 attempts the event is dead and system.outbox_dead is enqueued';

  if public.outbox_fail(ids[2], 'w10', 'again') then raise exception 'FAIL fail acted on a dead event'; end if;
  h := public.system_health();
  if (h ->> 'outbox_dead')::int <> 1 or (h ->> 'outbox_pending')::int <> 1 or h -> 'jobs_disabled' <> '[]'::jsonb then
    raise exception 'FAIL system_health returned %', h;
  end if;
  raise notice 'PASS a dead event is not failed again; system_health reports 1 pending, 1 dead, no disabled jobs';

  begin
    perform 1 from private.outbox;
    raise exception 'FAIL service_role can read private.outbox directly';
  exception when insufficient_privilege then null;
  end;
  raise notice 'PASS service_role reaches the outbox only through the RPCs';
end $$;
rollback;

-- Poison event: the Worker crashes after every claim (no outbox_fail). Abandoned claims still count, and after the 10th
-- one the event is dead-lettered once. Claims are aged by hand (as postgres) to skip the 10-minute wait.
begin;
delete from private.outbox;
do $$ begin perform private.enqueue('lead.created', '{"id":"poison"}'); end $$;
do $$
declare
  n integer;
  evs text[];
begin
  for i in 1..10 loop
    set local role service_role;
    select count(*) into n from public.outbox_claim(50, 'crash-' || i);
    if n <> 1 then raise exception 'FAIL poison claim % returned % events', i, n; end if;
    reset role;
    update private.outbox set claimed_at = now() - interval '11 minutes' where event = 'lead.created';
  end loop;
  set local role service_role;
  select array_agg(c.event) into evs from public.outbox_claim(50, 'after-crashes') c;
  if evs is distinct from array['system.outbox_dead'] then
    raise exception 'FAIL after 10 abandoned claims expected system.outbox_dead, got %', evs;
  end if;
  reset role;
  update private.outbox set claimed_at = now() - interval '11 minutes';
  set local role service_role;
  select array_agg(c.event) into evs from public.outbox_claim(50, 'again') c;
  if evs is distinct from array['system.outbox_dead'] then
    raise exception 'FAIL the poison event was dead-lettered twice or revived: %', evs;
  end if;
  reset role;
  select count(*) into n from private.outbox where event = 'system.outbox_dead';
  if n <> 1 then raise exception 'FAIL % system.outbox_dead rows, expected 1', n; end if;
  raise notice 'PASS a poison event that never reaches outbox_fail dies after 10 claims, dead-lettered once';
end $$;
rollback;

-- ---------------------------------------------------------------- service_role: jobs, quota, seed helper
begin;
set local role service_role;
do $$
declare
  n integer;
  h jsonb;
begin
  select count(*) into n from public.scheduled_jobs_due(now());
  if n <> 6 then raise exception 'FAIL % jobs due at start, expected 6', n; end if;
  raise notice 'PASS the four jobs start due';

  perform public.scheduled_jobs_mark_ran('outbox.drain', now(), now() + interval '5 minutes');
  select count(*) into n from public.scheduled_jobs_due(now());
  if n <> 5 then raise exception 'FAIL mark_ran did not move next_run_at (% due)', n; end if;
  raise notice 'PASS scheduled_jobs_mark_ran moves the job out of the due list';

  perform public.scheduled_jobs_disable('crm.due_digest', 'bad cron');
  select count(*) into n from public.scheduled_jobs_due(now() + interval '1 day');
  if n <> 5 then raise exception 'FAIL a disabled job is still due (% due)', n; end if;
  h := public.system_health();
  if h -> 'jobs_disabled' <> '["crm.due_digest"]'::jsonb then raise exception 'FAIL system_health jobs_disabled %', h; end if;
  raise notice 'PASS scheduled_jobs_disable stops the job and system_health lists it';

  if not public.increment_quota('ip:1', 2, '1 day') or not public.increment_quota('ip:1', 2, '1 day')
     or public.increment_quota('ip:1', 2, '1 day') then
    raise exception 'FAIL increment_quota must allow 2 then refuse';
  end if;
  if not public.increment_quota('ip:2', 1, '1 day') then raise exception 'FAIL quota keys must be independent'; end if;
  raise notice 'PASS increment_quota allows up to the limit per key';

  perform public.test_set_email_confirmed('sin@test', true);
  raise notice 'PASS service_role can call test_set_email_confirmed';
end $$;
rollback;
