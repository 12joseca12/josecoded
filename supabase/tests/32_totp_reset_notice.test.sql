begin;

\ir support/helpers.sql

select plan(8);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.log_totp_reset(md5('t-closer-a@example.com')::uuid)$$,
  '42501',
  'forbidden',
  'a closer cannot log a TOTP reset'
);

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select public.log_totp_reset(md5('t-closer-a@example.com')::uuid)$$,
  'the admin logs a TOTP reset'
);

select throws_ok(
  $$select public.log_totp_reset(gen_random_uuid())$$,
  'P0001',
  'user_not_found',
  'an unknown user fails and queues nothing'
);

reset role;

select is(
  (select count(*) from private.outbox where template = 'totp_reset' and recipient = 't-closer-a@example.com'),
  1::bigint,
  'the reset queues one email to the affected user'
);

select is(
  (select payload ->> 'locale' from private.outbox where template = 'totp_reset'),
  'es',
  'the email carries the locale of the user'
);

select is(
  (select count(*) from private.audit_log where table_name = 'profiles' and after ->> 'totp_reset' = 'true'),
  1::bigint,
  'the reset is still audited'
);

select is(
  (select count(*) from private.outbox where template = 'totp_reset' and recipient = 't-admin@example.com'),
  0::bigint,
  'nobody else is emailed'
);

select ok(
  has_function_privilege('authenticated', 'public.log_totp_reset(uuid)', 'execute')
    and not has_function_privilege('anon', 'public.log_totp_reset(uuid)', 'execute'),
  'the grants survive the replacement'
);

select * from finish();

rollback;
