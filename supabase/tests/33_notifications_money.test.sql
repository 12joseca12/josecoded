begin;

\ir support/helpers.sql

select plan(21);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-client@example.com', 'client', 'Client');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-sub-a@example.com')::uuid, 'Contact S1', 's1@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project');

reset role;
select tests.login_as('t-admin@example.com');

select public.win_deal('00000000-0000-4000-8000-0000000000d1', 1000);
select public.set_payment_schedule(
  '00000000-0000-4000-8000-0000000000d1',
  '[{"label":"Anticipo","amount":400,"due_at":"2026-01-10"},{"label":"Final","amount":600,"due_at":"2999-01-10"}]'::jsonb
);

select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 400, '2026-01-12', 'transfer');

reset role;

select is(
  (select count(*) from public.notifications where user_id = md5('t-sub-a@example.com')::uuid and event = 'commission_accrued'),
  1::bigint,
  'the subcloser is told about their accrued line'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-closer-a@example.com')::uuid and event = 'commission_accrued'),
  1::bigint,
  'the parent closer is told about theirs'
);

select is(
  (select body from public.notifications where user_id = md5('t-sub-a@example.com')::uuid and event = 'commission_accrued'),
  'EUR 40.00',
  'the notification carries the line amount as data'
);

select is(
  (select title from public.notifications where user_id = md5('t-sub-a@example.com')::uuid and event = 'commission_accrued'),
  'Contact S1',
  'and the contact as the title'
);

select is(
  (select body from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'commission_accrued'),
  'EUR 60.00',
  'the admin gets one notification per payment with the total to approve'
);

select is(
  (select count(*) from private.outbox where template = 'notification' and payload ->> 'event' = 'commission_accrued'),
  3::bigint,
  'every notification also queues its email'
);

reset role;
select tests.login_as('t-admin@example.com');

select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'refund', 'project', 100, '2026-01-13', 'transfer');

reset role;

select is(
  (select count(*) from public.notifications where event = 'commission_accrued'),
  3::bigint,
  'a refund creates negative lines and notifies no one'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.payments_notify_overdue()$$,
  '42501', null, 'a closer cannot run the overdue check'
);

reset role;
select tests.logout();

select throws_ok(
  $$select public.payments_notify_overdue()$$,
  '42501', null, 'anon cannot run the overdue check'
);

reset role;
select tests.login_service();

select is(public.payments_notify_overdue(), 1, 'the service role finds the one overdue milestone');

reset role;

select is(
  (select row(title, body, href)::text from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'payment_overdue'),
  '("Contact S1","Anticipo · EUR 400.00",/admin/cobros)',
  'the admin is told which milestone is overdue'
);

select is(
  (select overdue_notified_at is not null from public.payment_schedule where label = 'Anticipo'),
  true,
  'the milestone is marked as notified'
);

reset role;
select tests.login_service();

select is(public.payments_notify_overdue(), 0, 'a second run does not notify again');

reset role;

select is(
  (select overdue_notified_at is null from public.payment_schedule where label = 'Final'),
  true,
  'a milestone that is not due is left alone'
);

reset role;
update public.payment_schedule set due_at = '2026-01-01', status = 'paid' where label = 'Final';
reset role;
select tests.login_service();

select is(public.payments_notify_overdue(), 0, 'a paid milestone is never reported as overdue');

reset role;
update public.payment_schedule set status = 'cancelled', overdue_notified_at = null where label = 'Final';
reset role;
select tests.login_service();

select is(public.payments_notify_overdue(), 0, 'a cancelled milestone is never reported as overdue');

reset role;

select tests.login_as('t-admin@example.com');

select public.approve_commission_lines(
  (select array_agg(l.id) from public.commission_lines l where l.beneficiary_id = md5('t-sub-a@example.com')::uuid and l.amount > 0)
);

reset role;

select is(
  (select count(*) from public.notifications where event = 'payout_paid'),
  0::bigint,
  'no payout notification before a payout is paid'
);

reset role;
select tests.login_as('t-admin@example.com');

select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-01-01', '2026-01-31');
select public.set_payout_status((select id from public.payouts limit 1), 'issued');

reset role;

select is(
  (select count(*) from public.notifications where event = 'payout_paid'),
  0::bigint,
  'issuing a payout does not notify yet'
);

reset role;
select tests.login_as('t-admin@example.com');

select public.set_payout_status((select id from public.payouts limit 1), 'paid', '2026-02-01', 'TRF-1');

reset role;

select is(
  (select count(*) from public.notifications where event = 'payout_paid' and user_id = md5('t-sub-a@example.com')::uuid),
  1::bigint,
  'marking the payout paid notifies the beneficiary'
);

select is(
  (select row(title, body)::text from public.notifications where event = 'payout_paid'),
  '("2026-01-01 / 2026-01-31","EUR 40.00")',
  'with the period and the net amount as data'
);

select is(
  (select count(*) from public.notifications where event = 'payout_paid' and user_id <> md5('t-sub-a@example.com')::uuid),
  0::bigint,
  'nobody else is notified'
);

select * from finish();

rollback;
