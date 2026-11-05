begin;

\ir support/helpers.sql

select plan(33);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer@example.com', 'closer', 'Closer');
select tests.create_user('t-client@example.com', 'client', 'Client');

delete from private.jobs;
delete from private.heartbeat;

select is(
  (select count(*) from pg_enum where enumtypid = 'public.job_kind'::regtype),
  9::bigint,
  'job_kind has the nine kinds of the plan'
);

select is(
  (select string_agg(enumlabel, ',' order by enumsortorder) from pg_enum where enumtypid = 'public.job_status'::regtype),
  'queued,running,done,failed,cancelled',
  'job_status has the five states of the plan'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select count(*) from private.jobs$$,
  '42501',
  null,
  'an admin session cannot read private.jobs directly'
);

select throws_ok(
  $$select count(*) from private.heartbeat$$,
  '42501',
  null,
  'an admin session cannot read private.heartbeat directly'
);

select throws_ok(
  $$select private.enqueue_job('notify.send')$$,
  '42501',
  null,
  'an admin session cannot enqueue through the private function'
);

select is(
  (select public.omen_status() -> 'seen_at'),
  'null'::jsonb,
  'omen_status reports a null seen_at before the first heartbeat'
);

select is(
  (select public.omen_status() - 'seen_at'),
  '{"version": null, "models": [], "queued": 0, "running": 0, "failed": 0}'::jsonb,
  'omen_status starts with empty counters'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select public.omen_status()$$,
  '42501',
  'forbidden',
  'omen_status fails for an admin without aal2'
);

reset role;
select tests.login_as('t-closer@example.com');

select throws_ok(
  $$select public.omen_status()$$,
  '42501',
  'forbidden',
  'omen_status fails for a closer'
);

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select public.omen_status()$$,
  '42501',
  'forbidden',
  'omen_status fails for a client'
);

reset role;
select tests.logout();

select throws_ok(
  $$select public.omen_status()$$,
  '42501',
  null,
  'anon cannot execute omen_status'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select * from public.omen_claim_jobs('x', 1)$$,
  '42501',
  null,
  'authenticated cannot execute omen_claim_jobs'
);

select throws_ok(
  $$select public.omen_heartbeat('1.0.0', '[]'::jsonb)$$,
  '42501',
  null,
  'authenticated cannot execute omen_heartbeat'
);

select throws_ok(
  $$select public.omen_finish_job(gen_random_uuid())$$,
  '42501',
  null,
  'authenticated cannot execute omen_finish_job'
);

reset role;

select private.enqueue_job('rag.index', '{"doc": 1}'::jsonb);
select private.enqueue_job('notify.send', '{"doc": 2}'::jsonb);
select private.enqueue_job('radar.scan', '{}'::jsonb);
select private.enqueue_job('chat.reply', '{}'::jsonb, now() + interval '1 hour');

update private.jobs set created_at = now() - interval '4 minutes', run_after = now() - interval '4 minutes' where kind = 'rag.index';
update private.jobs set created_at = now() - interval '3 minutes', run_after = now() - interval '3 minutes' where kind = 'notify.send';
update private.jobs set created_at = now() - interval '2 minutes', run_after = now() - interval '2 minutes' where kind = 'radar.scan';

reset role;
select tests.login_service();

create temporary table claimed_first on commit drop as
select * from public.omen_claim_jobs('omen-test', 2);

create temporary table claimed_second on commit drop as
select * from public.omen_claim_jobs('omen-test', 2);

select is((select count(*) from claimed_first), 2::bigint, 'the first claim returns the two oldest jobs');

select is((select count(*) from claimed_second), 1::bigint, 'the second claim returns only the remaining due job');

select is(
  (select count(*) from claimed_first f join claimed_second s on s.id = f.id),
  0::bigint,
  'no job is delivered twice across two claims'
);

select is(
  (select count(*) from public.omen_claim_jobs('omen-test', 5)),
  0::bigint,
  'a job scheduled in the future is not claimed'
);

select is(
  (select string_agg(kind::text, ',' order by kind::text) from claimed_first) || '|' || (select kind::text from claimed_second),
  'notify.send,rag.index|radar.scan',
  'the claim follows run_after order among due jobs'
);

select throws_ok(
  $$select * from public.omen_claim_jobs('omen-test', 0)$$,
  'P0001',
  'invalid_limit',
  'claiming zero jobs fails with a typed error'
);

select throws_ok(
  $$select * from public.omen_claim_jobs('   ', 1)$$,
  'P0001',
  'invalid_worker',
  'an empty worker name fails with a typed error'
);

select lives_ok(
  $$select public.omen_heartbeat('1.2.3', '["qwen", "llama"]'::jsonb)$$,
  'service_role records a heartbeat'
);

select throws_ok(
  $$select public.omen_heartbeat('1.2.3', '{"a": 1}'::jsonb)$$,
  'P0001',
  'invalid_models',
  'a heartbeat whose models are not an array fails'
);

select is(
  (select public.omen_finish_job((select id from claimed_first where kind = 'rag.index'), '{"ok": true}'::jsonb)::text),
  'done',
  'finishing without error marks the job done'
);

select is(
  (select public.omen_finish_job((select id from claimed_first where kind = 'notify.send'), null, 'boom')::text),
  'queued',
  'a failure with attempts left puts the job back in the queue'
);

select throws_ok(
  format($$select public.omen_finish_job(%L)$$, (select id from claimed_first where kind = 'rag.index')),
  'P0001',
  'job_not_running',
  'finishing a job that is not running fails'
);

reset role;

select ok(
  (select run_after > now() + interval '20 seconds' and finished_at is null and error = 'boom' and locked_by is null
   from private.jobs where kind = 'notify.send'),
  'a retried job waits for a backoff and keeps the error'
);

update private.jobs set status = 'running', attempts = max_attempts, locked_by = 'omen-test', locked_at = now()
where kind = 'notify.send';

reset role;
select tests.login_service();

select is(
  (select public.omen_finish_job((select id from claimed_first where kind = 'notify.send'), null, 'again')::text),
  'failed',
  'a failure without attempts left marks the job failed'
);

reset role;

update private.jobs set status = 'running', attempts = 1, locked_by = 'ghost', locked_at = now() - interval '20 minutes'
where kind = 'radar.scan';

reset role;
select tests.login_service();

select is(
  (select count(*) from public.omen_claim_jobs('omen-test', 5) where kind = 'radar.scan'),
  1::bigint,
  'a job locked for more than fifteen minutes is reclaimed'
);

reset role;

select is(
  (select attempts from private.jobs where kind = 'radar.scan'),
  2,
  'the reclaimed job counts the extra attempt'
);

update private.jobs set status = 'running', attempts = max_attempts, locked_by = 'ghost', locked_at = now() - interval '20 minutes'
where kind = 'radar.scan';

reset role;
select tests.login_service();

select is(
  (select count(*) from public.omen_claim_jobs('omen-test', 5) where kind = 'radar.scan'),
  0::bigint,
  'a stale job without attempts left is not handed out again'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select public.omen_status() - 'seen_at'),
  '{"version": "1.2.3", "models": ["qwen", "llama"], "queued": 1, "running": 0, "failed": 2}'::jsonb,
  'omen_status reports version, models and counters for the admin'
);

select ok(
  (select (public.omen_status() ->> 'seen_at')::timestamptz > now() - interval '1 minute'),
  'omen_status reports a recent seen_at after the heartbeat'
);

select * from finish();

rollback;
