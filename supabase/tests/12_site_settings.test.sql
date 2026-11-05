begin;

\ir support/helpers.sql

select plan(38);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer@example.com', 'closer', 'Closer');

select is(
  (select count(*) from public.site_settings),
  15::bigint,
  'the migration seeds the fifteen allowed keys'
);

select results_eq(
  $$select key, value from public.site_settings where key in ('blog', 'projects', 'cv_download', 'search', 'google_sign_in', 'public_chat') order by key$$,
  $$values ('blog', 'true'::jsonb), ('cv_download', 'true'::jsonb), ('google_sign_in', 'false'::jsonb), ('projects', 'true'::jsonb), ('public_chat', 'false'::jsonb), ('search', 'false'::jsonb)$$,
  'the seeded switches keep the values the code ships with today'
);

select is(
  (select string_agg(key, ',' order by key) from public.site_settings where not public),
  'billing.vat_rate,nexo.reply_delay_min,payout.default_cadence',
  'only the internal settings are not public'
);

select throws_ok(
  $$insert into public.site_settings (key, value) values ('made.up', 'true'::jsonb)$$,
  '23514',
  null,
  'a key outside the closed list is rejected by the table'
);

select throws_ok(
  $$update public.site_settings set value = '"yes"'::jsonb where key = 'blog'$$,
  '23514',
  null,
  'a value of the wrong type is rejected by the table'
);

select throws_ok(
  $$update public.site_settings set public = false where key = 'blog'$$,
  '428C9',
  null,
  'the public flag cannot be written'
);

reset role;
select tests.logout();

select throws_ok(
  $$select count(*) from public.site_settings$$,
  '42501',
  null,
  'anon cannot read site_settings'
);

select throws_ok(
  $$select * from public.read_public_settings()$$,
  '42501',
  null,
  'anon cannot execute read_public_settings'
);

select throws_ok(
  $$select public.set_setting('blog', 'false'::jsonb)$$,
  '42501',
  null,
  'anon cannot execute set_setting'
);

reset role;
select tests.login_as('t-closer@example.com');

select is((select count(*) from public.site_settings), 0::bigint, 'a closer reads no settings');

select throws_ok(
  $$select public.set_setting('blog', 'false'::jsonb)$$,
  '42501',
  'forbidden',
  'a closer cannot change a setting'
);

select throws_ok(
  $$select * from public.read_public_settings()$$,
  '42501',
  null,
  'authenticated cannot execute read_public_settings'
);

select throws_ok(
  $$update public.site_settings set value = 'false'::jsonb where key = 'blog'$$,
  '42501',
  null,
  'a closer cannot update the table directly'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select is((select count(*) from public.site_settings), 0::bigint, 'an admin without aal2 reads no settings');

select throws_ok(
  $$select public.set_setting('blog', 'false'::jsonb)$$,
  '42501',
  'forbidden',
  'an admin without aal2 cannot change a setting'
);

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.site_settings), 15::bigint, 'an admin with aal2 reads every setting');

select throws_ok(
  $$update public.site_settings set value = 'false'::jsonb where key = 'blog'$$,
  '42501',
  null,
  'an admin cannot update the table directly'
);

select throws_ok(
  $$insert into public.site_settings (key, value) values ('blog', 'true'::jsonb)$$,
  '42501',
  null,
  'an admin cannot insert into the table directly'
);

select lives_ok(
  $$select public.set_setting('blog', 'false'::jsonb)$$,
  'the admin turns the blog off'
);

select results_eq(
  $$select value, updated_by from public.site_settings where key = 'blog'$$,
  $$values ('false'::jsonb, md5('t-admin@example.com')::uuid)$$,
  'the new value and the author are stored'
);

select throws_ok(
  $$select public.set_setting('made.up', 'true'::jsonb)$$,
  'P0001',
  'setting_key_not_allowed',
  'an unknown key fails with a typed error'
);

select throws_ok(
  $$select public.set_setting('blog', '"yes"'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a string for a switch fails with a typed error'
);

select throws_ok(
  $$select public.set_setting('blog', null)$$,
  'P0001',
  'setting_value_invalid',
  'sql null fails with a typed error'
);

select throws_ok(
  $$select public.set_setting('nexo.reply_delay_min', '-1'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a negative delay fails'
);

select throws_ok(
  $$select public.set_setting('nexo.reply_delay_min', '241'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a delay above four hours fails'
);

select throws_ok(
  $$select public.set_setting('nexo.reply_delay_min', '1.5'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a fractional delay fails'
);

select throws_ok(
  $$select public.set_setting('payout.default_cadence', '"monthly"'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a cadence outside the enum fails'
);

select throws_ok(
  $$select public.set_setting('availability.next_project_month', '"2026-13"'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a month outside 01-12 fails'
);

select throws_ok(
  $$select public.set_setting('billing.vat_rate', '101'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'a VAT rate above 100 fails'
);

select throws_ok(
  $$select public.set_setting('maintenance', '{"on": "yes"}'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'maintenance needs a boolean on'
);

select throws_ok(
  $$select public.set_setting('maintenance', '{"on": true, "extra": 1}'::jsonb)$$,
  'P0001',
  'setting_value_invalid',
  'maintenance rejects unknown fields'
);

select lives_ok(
  $$select public.set_setting('maintenance', '{"on": true, "until": "2026-11-06T08:00:00+01:00"}'::jsonb)$$,
  'maintenance accepts on with an until timestamp'
);

select lives_ok(
  $$select public.set_setting('availability.next_project_month', '"2027-01"'::jsonb)$$,
  'the next project month accepts YYYY-MM'
);

select lives_ok(
  $$select public.set_setting('billing.vat_rate', '0'::jsonb)$$,
  'the VAT rate accepts zero'
);

reset role;

select results_eq(
  $$select table_name, action, after ->> 'key', before -> 'value', after -> 'value', actor_id from private.audit_log where table_name = 'site_settings' and after ->> 'key' = 'blog'$$,
  $$values ('site_settings', 'update', 'blog', 'true'::jsonb, 'false'::jsonb, md5('t-admin@example.com')::uuid)$$,
  'changing a setting writes one audit row with before, after and actor'
);

select tests.login_as('t-admin@example.com');
select public.set_setting('blog', 'false'::jsonb);
reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'site_settings' and after ->> 'key' = 'blog'),
  1::bigint,
  'setting the same value again writes no new audit row'
);

select tests.login_service();

select is(
  (select count(*) from public.read_public_settings()),
  12::bigint,
  'service_role reads the twelve public settings'
);

select is(
  (select count(*) from public.read_public_settings() where key in ('billing.vat_rate', 'nexo.reply_delay_min', 'payout.default_cadence')),
  0::bigint,
  'internal settings never reach the public read'
);

select * from finish();

rollback;
