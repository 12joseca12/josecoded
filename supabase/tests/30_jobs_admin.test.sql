begin;

\ir support/helpers.sql

select plan(26);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer@example.com', 'closer', 'Closer');

delete from private.jobs;

insert into private.jobs (id, kind, payload, status, attempts, error, created_at, finished_at)
values
  ('00000000-0000-4000-8000-000000000b01', 'rag.index', '{"secret": "payload"}', 'done', 1, null, now() - interval '5 hours', now() - interval '5 hours'),
  ('00000000-0000-4000-8000-000000000b02', 'radar.scan', '{}', 'failed', 3, repeat('x', 800), now() - interval '4 hours', now() - interval '4 hours'),
  ('00000000-0000-4000-8000-000000000b03', 'notify.send', '{}', 'queued', 0, null, now() - interval '3 hours', null),
  ('00000000-0000-4000-8000-000000000b04', 'chat.summary', '{}', 'cancelled', 1, 'cancelled by hand', now() - interval '2 hours', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000b05', 'radar.draft', '{}', 'running', 1, null, now() - interval '1 hour', null);

reset role;
select tests.logout();

select throws_ok(
  $$select * from public.admin_jobs()$$,
  '42501',
  null,
  'anon cannot execute admin_jobs'
);

reset role;
select tests.login_as('t-closer@example.com');

select throws_ok(
  $$select * from public.admin_jobs()$$,
  '42501',
  'forbidden',
  'a closer cannot list jobs'
);

select throws_ok(
  $$select public.retry_job('00000000-0000-4000-8000-000000000b02')$$,
  '42501',
  'forbidden',
  'a closer cannot retry a job'
);

select throws_ok(
  $$select public.cancel_job('00000000-0000-4000-8000-000000000b03')$$,
  '42501',
  'forbidden',
  'a closer cannot cancel a job'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select * from public.admin_jobs()$$,
  '42501',
  'forbidden',
  'an admin without aal2 cannot list jobs'
);

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.admin_jobs()), 5::bigint, 'the admin lists every job');

select is(
  (select string_agg(id::text, ',' order by created_at desc) from public.admin_jobs()),
  '00000000-0000-4000-8000-000000000b05,00000000-0000-4000-8000-000000000b04,00000000-0000-4000-8000-000000000b03,00000000-0000-4000-8000-000000000b02,00000000-0000-4000-8000-000000000b01',
  'the list is newest first'
);

select is(
  (select count(*) from public.admin_jobs('failed')),
  1::bigint,
  'the list filters by status'
);

select is(
  (select count(*) from public.admin_jobs(null, 2)),
  2::bigint,
  'the list respects the limit'
);

select is(
  (select char_length(error) from public.admin_jobs('failed')),
  500,
  'the error is truncated to 500 characters'
);

select is(
  (select count(*) from pg_proc where proname = 'admin_jobs' and 'payload' = any(proargnames)),
  0::bigint,
  'admin_jobs does not return the payload column'
);

select throws_ok(
  $$select * from public.admin_jobs(null, 0)$$,
  'P0001',
  'invalid_limit',
  'a limit of zero fails with a typed error'
);

select throws_ok(
  $$select * from public.admin_jobs(null, 201)$$,
  'P0001',
  'invalid_limit',
  'a limit above 200 fails with a typed error'
);

select is(
  (select public.retry_job('00000000-0000-4000-8000-000000000b02')::text),
  'queued',
  'a failed job can be retried'
);

select is(
  (select public.retry_job('00000000-0000-4000-8000-000000000b04')::text),
  'queued',
  'a cancelled job can be retried'
);

select throws_ok(
  $$select public.retry_job('00000000-0000-4000-8000-000000000b01')$$,
  'P0001',
  'job_not_retryable',
  'a done job cannot be retried'
);

select throws_ok(
  $$select public.retry_job('00000000-0000-4000-8000-000000000b05')$$,
  'P0001',
  'job_not_retryable',
  'a running job cannot be retried'
);

select throws_ok(
  $$select public.retry_job(gen_random_uuid())$$,
  'P0001',
  'job_not_found',
  'an unknown job fails with job_not_found'
);

select is(
  (select public.cancel_job('00000000-0000-4000-8000-000000000b03')::text),
  'cancelled',
  'a queued job can be cancelled'
);

select throws_ok(
  $$select public.cancel_job('00000000-0000-4000-8000-000000000b05')$$,
  'P0001',
  'job_not_cancellable',
  'a running job cannot be cancelled'
);

select throws_ok(
  $$select public.cancel_job('00000000-0000-4000-8000-000000000b01')$$,
  'P0001',
  'job_not_cancellable',
  'a done job cannot be cancelled'
);

reset role;

select results_eq(
  $$select status::text, attempts, error is null, finished_at is null, run_after <= now() from private.jobs where id = '00000000-0000-4000-8000-000000000b02'$$,
  $$values ('queued', 0, true, true, true)$$,
  'a retried job is queued again, with no attempts, no error and due now'
);

select results_eq(
  $$select status::text, finished_at is not null from private.jobs where id = '00000000-0000-4000-8000-000000000b03'$$,
  $$values ('cancelled', true)$$,
  'a cancelled job is closed with a finish time'
);

select results_eq(
  $$select action, before ->> 'status', after ->> 'status', actor_id from private.audit_log where table_name = 'jobs' and row_id = '00000000-0000-4000-8000-000000000b02'$$,
  $$values ('update', 'failed', 'queued', md5('t-admin@example.com')::uuid)$$,
  'retrying writes an audit row with before, after and actor'
);

select is(
  (select count(*) from private.audit_log where table_name = 'jobs'),
  3::bigint,
  'only successful manual changes are audited'
);

select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname in ('admin_jobs', 'retry_job', 'cancel_job') and has_function_privilege('anon', p.oid, 'execute')),
  0::bigint,
  'anon has no execute on the three job functions'
);

select * from finish();

rollback;
