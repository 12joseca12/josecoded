begin;

\ir support/helpers.sql

select plan(17);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer@example.com', 'closer', 'Closer');
select tests.create_user('t-client@example.com', 'client', 'Client');
select tests.create_user('t-other@example.com', 'client', 'Other');

delete from private.jobs;

reset role;
select tests.logout();

select throws_ok(
  $$select public.request_account_deletion()$$,
  '42501',
  null,
  'anon cannot request a deletion'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select public.request_account_deletion()$$,
  '42501',
  'forbidden',
  'the admin cannot request a deletion'
);

reset role;
select tests.login_aal1('t-closer@example.com');

select throws_ok(
  $$select public.request_account_deletion()$$,
  '42501',
  'forbidden',
  'a closer without the second factor cannot request a deletion'
);

reset role;
select tests.login_as('t-client@example.com', 'aal1');

select is(public.my_account_deletion(), null::timestamptz, 'no request yet');

select cmp_ok(
  public.request_account_deletion(),
  '<=',
  now(),
  'a client requests the deletion of the own account'
);

select isnt(public.my_account_deletion(), null::timestamptz, 'the request is visible to its owner');

select is(
  public.request_account_deletion(),
  public.my_account_deletion(),
  'asking twice returns the same request'
);

reset role;

select results_eq(
  $$select kind::text, status::text, payload ->> 'user_id', payload ->> 'review', max_attempts from private.jobs$$,
  $$values ('account.delete', 'queued', md5('t-client@example.com')::uuid::text, 'admin', 1)$$,
  'one queued job waits for the admin'
);

select is(
  (select count(*) from private.audit_log where table_name = 'profiles' and after ->> 'account_deletion_requested' = 'true'),
  1::bigint,
  'the request is audited once'
);

select tests.login_as('t-other@example.com', 'aal1');

select is(public.my_account_deletion(), null::timestamptz, 'another user does not see it');

select throws_ok(
  $$select public.cancel_account_deletion()$$,
  'P0001',
  'request_not_found',
  'another user cannot cancel it'
);

reset role;
select tests.login_as('t-client@example.com', 'aal1');

select lives_ok($$select public.cancel_account_deletion()$$, 'the owner withdraws the request');

select is(public.my_account_deletion(), null::timestamptz, 'a withdrawn request is gone');

reset role;

select is(
  (select status::text from private.jobs where kind = 'account.delete'),
  'cancelled',
  'the job is cancelled'
);

select tests.login_as('t-client@example.com', 'aal1');

select throws_ok(
  $$select public.cancel_account_deletion()$$,
  'P0001',
  'request_not_found',
  'nothing is left to withdraw'
);

reset role;
select tests.login_as('t-closer@example.com');

select cmp_ok(public.request_account_deletion(), '<=', now(), 'a closer with the second factor can request it');

select throws_ok(
  $$select * from private.jobs$$,
  '42501',
  null,
  'authenticated still cannot read the jobs'
);

select * from finish();
rollback;
