begin;

select plan(12);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'row level security is enabled on every table in public and private'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
      and not (coalesce(c.reloptions, '{}') && array['security_invoker=true', 'security_invoker=on'])
  $$,
  'every view in public is security invoker'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%'
      )
  $$,
  'every function in public and private has a fixed search_path'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and not ('search_path=""' = any(coalesce(p.proconfig, '{}')))
  $$,
  'every security definer function pins an empty search_path'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and exists (
        select 1
        from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where a.grantee = 0 and a.privilege_type = 'EXECUTE'
      )
  $$,
  'no function in public or private is executable by PUBLIC'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'execute')
      and p.proname not in ('update_my_profile')
  $$,
  'only the allowed security definer RPCs are callable from the API'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  'no function in public is callable by anon'
);

select is_empty(
  $$
    select c.conrelid::regclass::text || '.' || c.conname
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f'
      and n.nspname in ('public', 'private')
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(c.conkey)] @> c.conkey
      )
  $$,
  'every foreign key is covered by an index'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || '.' || policyname
    from pg_policies
    where schemaname in ('public', 'private')
      and ('anon' = any(roles) or 'public' = any(roles))
  $$,
  'no policy targets anon or public'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || ' ' || cmd
    from pg_policies
    where schemaname = 'public'
      and permissive = 'PERMISSIVE'
    group by schemaname, tablename, cmd
    having count(*) > 1
  $$,
  'no table has multiple permissive policies for the same action'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || '.' || policyname
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ '(?<!SELECT )(private\.(uid|role|is_admin|is_staff|is_closer|is_aal2)\(\)|auth\.(uid|jwt|role)\(\))'
        or coalesce(with_check, '') ~ '(?<!SELECT )(private\.(uid|role|is_admin|is_staff|is_closer|is_aal2)\(\)|auth\.(uid|jwt|role)\(\))'
      )
  $$,
  'policies wrap auth helpers in a select so they are evaluated once per statement'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind = 'r'
      and has_table_privilege('authenticated', c.oid, 'select')
      and not exists (select 1 from pg_policy pol where pol.polrelid = c.oid and pol.polcmd in ('r', '*'))
  $$,
  'every table readable by authenticated has a select policy'
);

select * from finish();

rollback;
