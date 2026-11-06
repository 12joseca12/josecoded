begin;

\ir support/helpers.sql

select plan(25);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');

insert into public.contacts (owner_id, full_name, email, phone)
values
  (md5('t-closer-a@example.com')::uuid, 'Existing A', 'dup@example.com', null),
  (md5('t-closer-b@example.com')::uuid, 'Existing B', 'only-b@example.com', null);

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[{"full_name":"X"}]')$$,
  '42501',
  'forbidden',
  'a client cannot import'
);

reset role;
select tests.login_aal1('t-closer-a@example.com');

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[{"full_name":"X"}]')$$,
  '42501',
  'forbidden',
  'a closer without aal2 cannot import'
);

reset role;
select tests.logout();

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[{"full_name":"X"}]')$$,
  '42501',
  null,
  'anon cannot execute the import'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.import_contacts('a.csv', 'nothex', '[{"full_name":"X"}]')$$,
  '22023',
  'invalid_file_hash',
  'a malformed hash is rejected'
);

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[]')$$,
  '22023',
  'invalid_rows',
  'an empty array is rejected'
);

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '{"full_name":"X"}')$$,
  '22023',
  'invalid_rows',
  'a non array payload is rejected'
);

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), (select jsonb_agg(jsonb_build_object('full_name', 'N' || g)) from generate_series(1, 501) g))$$,
  '22023',
  'too_many_rows',
  'more than 500 rows are rejected'
);

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[{"full_name":"X"}]', 'merge')$$,
  '22023',
  'invalid_duplicate_mode',
  'an unknown duplicate mode is rejected'
);

select throws_ok(
  $$select public.import_contacts('a.csv', repeat('a', 64), '[{"full_name":"X"}]', 'skip', md5('t-closer-b@example.com')::uuid)$$,
  '42501',
  'forbidden',
  'a closer cannot import into another portfolio'
);

select is(
  (
    select public.import_contacts(
      'ok.csv',
      repeat('b', 64),
      $j$[
        {"full_name":"Ana Nueva","email":"ana@example.com","phone":"+34 600 111 222","organization":"Ana SL","kind":"client","notes":"nota"},
        {"full_name":"=HYPERLINK(\"http://evil\")","email":"evil@example.com","organization":"@acme","notes":"-10%"},
        {"full_name":"Dup","email":"dup@example.com","phone":"600"},
        {"full_name":"Bad email","email":"=cmd@example.com"},
        {"full_name":"Bad email 2","email":"no-at"},
        {"full_name":"Bad phone","phone":"=1+1"},
        {"full_name":"","email":"empty@example.com"},
        {"full_name":"Bad kind","kind":"admin"},
        "not an object"
      ]$j$::jsonb
    ) - 'import_id'
  ),
  '{"created":2,"updated":0,"skipped":1,"invalid":6}'::jsonb,
  'a mixed file creates the valid rows, skips the duplicate and counts the invalid ones'
);

select is(
  (select count(*) from public.contacts where source = 'import' and owner_id = md5('t-closer-a@example.com')::uuid),
  2::bigint,
  'imported contacts belong to the importer with source import'
);

select is(
  (select full_name || '|' || organization || '|' || notes from public.contacts where email = 'evil@example.com'),
  '''=HYPERLINK("http://evil")|''@acme|''-10%',
  'spreadsheet formula prefixes are neutralised'
);

select is(
  (select phone from public.contacts where email = 'dup@example.com'),
  null,
  'skip mode leaves the existing duplicate untouched'
);

select throws_ok(
  $$select public.import_contacts('ok.csv', repeat('b', 64), '[{"full_name":"Other"}]')$$,
  'P0001',
  'already_imported',
  'the same file cannot be imported twice by the same user'
);

select is(
  (
    select public.import_contacts(
      'update.csv',
      repeat('c', 64),
      '[{"full_name":"Renamed","email":"DUP@example.com","phone":"600 999","organization":"Org"}]',
      'update'
    ) - 'import_id'
  ),
  '{"created":0,"updated":1,"skipped":0,"invalid":0}'::jsonb,
  'update mode fills the blanks of the duplicate'
);

select is(
  (select full_name || '|' || phone || '|' || organization from public.contacts where email = 'dup@example.com' and owner_id = md5('t-closer-a@example.com')::uuid),
  'Existing A|600 999|Org',
  'update never overwrites the name and only fills empty fields'
);

select is(
  (
    select public.import_contacts(
      'again.csv',
      repeat('d', 64),
      '[{"full_name":"Renamed","email":"dup@example.com","phone":"1","organization":"Other"}]',
      'update'
    ) - 'import_id'
  ),
  '{"created":0,"updated":0,"skipped":1,"invalid":0}'::jsonb,
  'a duplicate with nothing to fill counts as skipped'
);

select is(
  (select count(*) from public.imports),
  3::bigint,
  'the closer sees only her own imports'
);

select is(
  (select count(*) from public.contacts where email = 'only-b@example.com'),
  0::bigint,
  'another portfolio stays invisible'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  (select count(*) from public.imports),
  0::bigint,
  'another closer sees none of those imports'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.imports),
  3::bigint,
  'the admin sees every import'
);

select is(
  (
    select public.import_contacts(
      'admin.csv',
      repeat('e', 64),
      '[{"full_name":"For B","email":"forb@example.com"}]',
      'skip',
      md5('t-closer-b@example.com')::uuid
    ) - 'import_id'
  ),
  '{"created":1,"updated":0,"skipped":0,"invalid":0}'::jsonb,
  'the admin can import into a closer portfolio'
);

select throws_ok(
  $$select public.import_contacts('x.csv', repeat('f', 64), '[{"full_name":"X"}]', 'skip', md5('t-client@example.com')::uuid)$$,
  '22023',
  'invalid_owner',
  'the admin cannot import into a non staff profile'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'imports' and action = 'insert'),
  4::bigint,
  'every import leaves an audit row'
);

select is_empty(
  $$select 1 from information_schema.role_table_grants where table_name = 'imports' and grantee in ('anon', 'authenticated') and privilege_type <> 'SELECT'$$,
  'imports is read only for the API roles'
);

select * from finish();
rollback;
