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
