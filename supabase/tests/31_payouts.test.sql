begin;

\ir support/helpers.sql

select plan(48);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-sub-a@example.com')::uuid, 'Contact S1', 's1@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', md5('t-closer-b@example.com')::uuid, 'Contact B1', 'b1@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'proposal', 'project');

select tests.login_as('t-admin@example.com');

select public.win_deal('00000000-0000-4000-8000-0000000000d1', 1000);
select public.win_deal('00000000-0000-4000-8000-0000000000d2', 800);

select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 400, '2026-02-01', 'transfer');
select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 300, '2026-02-20', 'transfer');
select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 300, '2026-03-05', 'transfer');
select public.record_payment('00000000-0000-4000-8000-0000000000d2', 'payment', 'project', 800, '2026-02-10', 'card');

select is(
  public.approve_commission_lines(
    (select array_agg(l.id) from public.commission_lines l join public.payments p on p.id = l.payment_id where p.received_at < '2026-03-01')
  ),
  5,
  'the admin approves the lines of February payments'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  '42501', 'forbidden', 'a closer cannot build a payout'
);

select throws_ok(
  $$select public.set_payout_status(gen_random_uuid(), 'issued')$$,
  '42501', 'forbidden', 'a closer cannot change a payout status'
);

select throws_ok(
  $$select public.delete_payout_draft(gen_random_uuid())$$,
  '42501', 'forbidden', 'a closer cannot delete a draft'
);

select throws_ok(
  $$select public.set_payout_invoice(gen_random_uuid(), null)$$,
  '42501', 'forbidden', 'a closer cannot attach a closer invoice'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  '42501', 'forbidden', 'an admin without aal2 cannot build a payout'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select public.build_payout(md5('t-client@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  'P0001', 'invalid_beneficiary', 'a payout needs a closer as beneficiary'
);

select throws_ok(
  $$select public.build_payout(md5('t-admin@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  'P0001', 'invalid_beneficiary', 'the admin has no payouts'
);

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-28', '2026-02-01')$$,
  'P0001', 'invalid_period', 'the period must be ordered'
);

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2024-01-01', '2026-02-01')$$,
  'P0001', 'invalid_period', 'the period cannot exceed a year'
);

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-01', '2026-02-28', 101)$$,
  'P0001', 'invalid_withholding', 'the withholding is a percentage'
);

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-03-01', '2026-03-31')$$,
  'P0001', 'no_lines_in_period', 'accrued lines that are not approved are not included'
);

select throws_ok(
  $$select public.build_payout(md5('t-closer-b@example.com')::uuid, '2026-04-01', '2026-04-30')$$,
  'P0001', 'no_lines_in_period', 'an empty period fails'
);

create temporary table made (name text primary key, id uuid) on commit drop;

insert into made
select 'sub', public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-01', '2026-02-28', 0, 'Febrero');

insert into made
select 'parent', public.build_payout(md5('t-closer-a@example.com')::uuid, '2026-02-01', '2026-02-28', 15);

select is(
  (select row(total, withholding_rate, net_total, status::text, cadence::text, statement_note)::text from public.payouts where id = (select id from made where name = 'sub')),
  '(70.00,0.00,70.00,draft,biweekly,Febrero)',
  'a payout sums the approved lines of the period with the default cadence'
);

select is(
  (select row(total, withholding_rate, net_total)::text from public.payouts where id = (select id from made where name = 'parent')),
  '(35.00,15.00,29.75)',
  'the withholding reduces the net total'
);

select is(
  (select count(*) from public.commission_lines where payout_id = (select id from made where name = 'sub')),
  2::bigint,
  'the lines of the period are linked to the payout'
);

select throws_ok(
  $$select public.build_payout(md5('t-sub-a@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  'P0001', 'no_lines_in_period', 'the same lines cannot be paid twice'
);

reset role;
update public.profiles set payout_cadence = 'weekly' where id = md5('t-closer-b@example.com')::uuid;
select tests.login_as('t-admin@example.com');

insert into made
select 'b', public.build_payout(md5('t-closer-b@example.com')::uuid, '2026-02-01', '2026-02-28');

select is(
  (select cadence::text from public.payouts where id = (select id from made where name = 'b')),
  'weekly',
  'the cadence of the closer overrides the global default'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is((select count(*) from public.payouts), 0::bigint, 'drafts are invisible to closers');

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'paid', '2026-03-10', 'REF')$$,
  'P0001', 'invalid_transition', 'a draft cannot jump to paid'
);

select lives_ok($$select public.set_payout_status((select id from made where name = 'sub'), 'issued')$$, 'the admin issues the subcloser payout');
select lives_ok($$select public.set_payout_status((select id from made where name = 'parent'), 'issued')$$, 'the admin issues the parent payout');

select is(
  (select issued_at is not null from public.payouts where id = (select id from made where name = 'sub')),
  true,
  'issuing stamps the date'
);

select throws_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'draft')$$,
  'P0001', 'invalid_transition', 'a payout cannot go back to draft'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is((select count(*) from public.payouts), 2::bigint, 'the parent closer reads their payout and the one of their subcloser once issued');

reset role;
select tests.login_as('t-sub-a@example.com');

select is((select count(*) from public.payouts), 1::bigint, 'the subcloser reads only their payout');

reset role;
select tests.login_as('t-closer-b@example.com');

select is((select count(*) from public.payouts), 0::bigint, 'closer B reads no payout of others and has no issued one');

reset role;
select tests.login_as('t-client@example.com');

select is((select count(*) from public.payouts), 0::bigint, 'a client reads no payouts');

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'paid', null, 'REF')$$,
  'P0001', 'paid_at_required', 'marking paid needs the date'
);

select throws_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'paid', '2026-03-10', ' ')$$,
  'P0001', 'reference_required', 'marking paid needs a reference'
);

select throws_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'paid', current_date + 3, 'REF')$$,
  'P0001', 'future_date', 'the payment date cannot be in the future'
);

select lives_ok(
  $$select public.set_payout_status((select id from made where name = 'sub'), 'paid', '2026-03-10', 'TRF-0310')$$,
  'the admin records the payment of the payout'
);

select is(
  (select row(status::text, paid_at::text, paid_reference)::text from public.payouts where id = (select id from made where name = 'sub')),
  '(paid,2026-03-10,TRF-0310)',
  'the payment date and reference are stored'
);

select is(
  (select count(*) from public.commission_lines where payout_id = (select id from made where name = 'sub') and status = 'paid'),
  2::bigint,
  'paying a payout marks its lines as paid'
);

select throws_ok(
  $$select public.approve_commission_lines((select array_agg(id) from public.commission_lines where payout_id = (select id from made where name = 'sub')))$$,
  'P0001', 'line_not_accrued', 'paid lines cannot be approved again'
);

select throws_ok(
  $$select public.delete_payout_draft((select id from made where name = 'parent'))$$,
  'P0001', 'payout_not_draft', 'an issued payout cannot be deleted'
);

select lives_ok(
  $$select public.delete_payout_draft((select id from made where name = 'b'))$$,
  'the admin deletes a draft'
);

select is(
  (select count(*) from public.payouts where id = (select id from made where name = 'b')),
  0::bigint,
  'the draft is gone'
);

select is(
  (select count(*) from public.commission_lines l where l.beneficiary_id = md5('t-closer-b@example.com')::uuid and l.status = 'approved' and l.payout_id is null),
  1::bigint,
  'deleting a draft releases its lines'
);

select lives_ok(
  $$select public.build_payout(md5('t-closer-b@example.com')::uuid, '2026-02-01', '2026-02-28')$$,
  'a released period can be built again'
);

select lives_ok(
  $$select public.set_payout_invoice((select id from made where name = 'sub'), 'payouts/10000000-0000-4000-8000-000000000001/20000000-0000-4000-8000-000000000001.pdf')$$,
  'the admin attaches the closer invoice'
);

select throws_ok(
  $$select public.set_payout_invoice((select id from made where name = 'sub'), '../x.pdf')$$,
  'P0001', 'invalid_path', 'a closer invoice path outside the payouts folder fails'
);

select throws_ok(
  $$select public.set_payout_invoice(gen_random_uuid(), null)$$,
  'P0001', 'payout_not_found', 'an unknown payout fails'
);

select ok(
  public.admin_counters() @> '{"accrued_pending_count": 2, "accrued_pending_amount": 45, "payments_overdue": 0, "proformas_unpaid": 0, "payouts_draft": 1}'::jsonb
  and jsonb_typeof(public.admin_counters() -> 'jobs_failed') = 'number',
  'admin_counters v2 reports the money counters'
);

select is(
  (select accrued_pending from public.admin_users() where id = md5('t-sub-a@example.com')::uuid),
  30::numeric,
  'admin_users v2 reports the accrued pending amount'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'payouts' and action = 'delete'),
  1::bigint,
  'deleting a draft is audited'
);

select is(
  (select count(*) from private.audit_log where table_name = 'payouts' and action = 'update' and after ->> 'status' in ('issued', 'paid')),
  4::bigint,
  'every update of an issued or paid payout is audited'
);

select tests.logout();

select throws_ok($$select * from public.payouts$$, '42501', null, 'anon cannot read payouts');

select * from finish();

rollback;
