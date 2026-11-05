begin;

\ir support/helpers.sql

select plan(45);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');

update public.profiles set closer_recurring_rate = 5 where id = md5('t-closer-a@example.com')::uuid;
update public.profiles
set closer_recurring_rate = 4, parent_recurring_rate = 2
where id = md5('t-sub-a@example.com')::uuid;

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-closer-a@example.com')::uuid, 'Contact A1', 'a1@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', md5('t-sub-a@example.com')::uuid, 'Contact S1', 's1@example.com'),
  ('00000000-0000-4000-8000-0000000000a3', md5('t-admin@example.com')::uuid, 'Contact Admin', 'adm@example.com'),
  ('00000000-0000-4000-8000-0000000000a4', md5('t-closer-b@example.com')::uuid, 'Contact B1', 'b1@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000a3', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'hiring'),
  ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000a4', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d6', '00000000-0000-4000-8000-0000000000a4', 'lost', 'project'),
  ('00000000-0000-4000-8000-0000000000d7', '00000000-0000-4000-8000-0000000000a1', 'contacted', 'project');

reset role;
select tests.login_as('t-closer-a@example.com');

select isnt(
  public.win_deal('00000000-0000-4000-8000-0000000000d1', 1000, 50),
  null,
  'a closer wins their own deal and gets the commission header'
);

select is(
  (select row(stage::text, won_amount, recurring_monthly)::text from public.deals where id = '00000000-0000-4000-8000-0000000000d1'),
  '(won,1000.00,50.00)',
  'the deal is won with its amount and monthly recurring amount'
);

select is(
  (select row(closer_id = md5('t-closer-a@example.com')::uuid, closer_rate, closer_recurring_rate, subcloser_id, expected_base, expected_closer_amount, expected_subcloser_amount)::text
   from public.commissions where deal_id = '00000000-0000-4000-8000-0000000000d1'),
  '(t,10.00,5.00,,1000.00,100.00,0.00)',
  'a closer without a parent freezes their own rates'
);

select is(
  (select count(*) from public.activities where deal_id = '00000000-0000-4000-8000-0000000000d1' and kind = 'stage_change'),
  1::bigint,
  'winning leaves a stage change activity'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d1', 1000)$$,
  'P0001', 'deal_already_won', 'a won deal cannot be won again'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d7', 0)$$,
  'P0001', 'invalid_amount', 'a zero amount is invalid'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d7', 10.005)$$,
  'P0001', 'invalid_amount', 'an amount with more than two decimals is invalid'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d7', 100, -5)$$,
  'P0001', 'invalid_recurring', 'a negative recurring amount is invalid'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d5', 100)$$,
  'P0001', 'deal_not_found', 'a closer cannot win a deal of another closer'
);

select throws_ok(
  $$update public.deals set stage = 'won' where id = '00000000-0000-4000-8000-0000000000d7'$$,
  '42501', 'won_requires_win_deal', 'a direct update to won still fails'
);

select throws_ok(
  $$update public.deals set recurring_monthly = 99 where id = '00000000-0000-4000-8000-0000000000d7'$$,
  '42501', 'recurring_fields_require_rpc', 'recurring fields cannot be written directly'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select isnt(
  public.win_deal('00000000-0000-4000-8000-0000000000d2', 2000, 80),
  null,
  'a subcloser wins their deal'
);

select is(
  (select row(closer_id = md5('t-closer-a@example.com')::uuid, closer_rate, closer_recurring_rate, subcloser_id = md5('t-sub-a@example.com')::uuid, subcloser_rate, subcloser_recurring_rate, expected_closer_amount, expected_subcloser_amount)::text
   from public.commissions where deal_id = '00000000-0000-4000-8000-0000000000d2'),
  '(t,5.00,2.00,t,10.00,4.00,100.00,200.00)',
  'a subcloser deal puts the parent as closer with the parent rate and keeps the subcloser rate'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select count(*) from public.commissions),
  2::bigint,
  'the parent closer sees their own header and the subcloser header'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select is(
  (select count(*) from public.commissions),
  1::bigint,
  'the subcloser sees only their header'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  public.win_deal('00000000-0000-4000-8000-0000000000d3', 500),
  null,
  'the admin winning their own deal creates no commission (P6)'
);

select is(
  (select count(*) from public.commissions where deal_id = '00000000-0000-4000-8000-0000000000d3'),
  0::bigint,
  'no header exists for an admin-owned deal'
);

select is(
  public.win_deal('00000000-0000-4000-8000-0000000000d4', 300),
  null,
  'a hiring deal creates no commission'
);

select isnt(
  public.win_deal('00000000-0000-4000-8000-0000000000d5', 700),
  null,
  'the admin wins a deal on behalf of the owner and the owner gets the header'
);

select throws_ok(
  $$select public.win_deal('00000000-0000-4000-8000-0000000000d6', 100)$$,
  'P0001', 'deal_lost', 'a lost deal cannot be won'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  (select count(*) from public.commissions),
  1::bigint,
  'closer B sees only their own header'
);

reset role;

insert into public.commission_lines (id, commission_id, beneficiary_id, role, nature, rate, base, amount)
select '00000000-0000-4000-8000-00000000f001', c.id, md5('t-closer-a@example.com')::uuid, 'closer', 'project', 10, 400, 40
from public.commissions c where c.deal_id = '00000000-0000-4000-8000-0000000000d1';

insert into public.commission_lines (id, commission_id, beneficiary_id, role, nature, rate, base, amount)
select '00000000-0000-4000-8000-00000000f002', c.id, md5('t-sub-a@example.com')::uuid, 'closer', 'project', 10, 400, 40
from public.commissions c where c.deal_id = '00000000-0000-4000-8000-0000000000d2';

insert into public.commission_lines (id, commission_id, beneficiary_id, role, nature, rate, base, amount)
select '00000000-0000-4000-8000-00000000f003', c.id, md5('t-closer-a@example.com')::uuid, 'parent', 'project', 5, 400, 20
from public.commissions c where c.deal_id = '00000000-0000-4000-8000-0000000000d2';

insert into public.commission_lines (id, commission_id, beneficiary_id, role, nature, rate, base, amount)
select '00000000-0000-4000-8000-00000000f004', c.id, md5('t-closer-b@example.com')::uuid, 'closer', 'project', 10, 700, 70
from public.commissions c where c.deal_id = '00000000-0000-4000-8000-0000000000d5';

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select array_agg(id::text order by id) from public.commission_lines),
  array['00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000f002', '00000000-0000-4000-8000-00000000f003'],
  'the parent closer reads their lines and those of their subcloser, not those of closer B'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select is(
  (select array_agg(id::text order by id) from public.commission_lines),
  array['00000000-0000-4000-8000-00000000f002'],
  'the subcloser reads only their own line, not the parent line on their deal'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  (select array_agg(id::text order by id) from public.commission_lines),
  array['00000000-0000-4000-8000-00000000f004'],
  'closer B reads only their own line'
);

reset role;
select tests.login_as('t-client@example.com');

select is((select count(*) from public.commission_lines), 0::bigint, 'a client reads no lines');
select is((select count(*) from public.commissions), 0::bigint, 'a client reads no headers');

reset role;
select tests.logout();

select throws_ok($$select * from public.commission_lines$$, '42501', null, 'anon cannot read lines');
select throws_ok($$select * from public.commissions$$, '42501', null, 'anon cannot read headers');

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.approve_commission_lines(array['00000000-0000-4000-8000-00000000f001']::uuid[])$$,
  '42501', 'forbidden', 'a closer cannot approve lines'
);

select throws_ok(
  $$select public.reject_commission_line('00000000-0000-4000-8000-00000000f001', 'no')$$,
  '42501', 'forbidden', 'a closer cannot reject a line'
);

select throws_ok(
  $$select public.cancel_recurring('00000000-0000-4000-8000-0000000000d1')$$,
  '42501', 'forbidden', 'a closer cannot cancel a recurring commission'
);

select throws_ok(
  $$update public.commission_lines set status = 'approved' where id = '00000000-0000-4000-8000-00000000f001'$$,
  '42501', null, 'lines cannot be updated directly'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select public.approve_commission_lines(array['00000000-0000-4000-8000-00000000f001']::uuid[])$$,
  '42501', 'forbidden', 'an admin without aal2 cannot approve'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  public.approve_commission_lines(array['00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000f002']::uuid[]),
  2,
  'the admin approves a selection'
);

select throws_ok(
  $$select public.approve_commission_lines(array['00000000-0000-4000-8000-00000000f001', '00000000-0000-4000-8000-00000000f003']::uuid[])$$,
  'P0001', 'line_not_accrued', 'approving a selection with an already approved line fails as a whole'
);

select is(
  (select status::text from public.commission_lines where id = '00000000-0000-4000-8000-00000000f003'),
  'accrued',
  'a failed selection leaves the other lines untouched'
);

select throws_ok($$select public.approve_commission_lines('{}'::uuid[])$$, 'P0001', 'invalid_selection', 'an empty selection is invalid');
select throws_ok($$select public.reject_commission_line('00000000-0000-4000-8000-00000000f003', '  ')$$, 'P0001', 'reason_required', 'rejecting needs a reason');

select lives_ok(
  $$select public.reject_commission_line('00000000-0000-4000-8000-00000000f003', 'Cobro devuelto')$$,
  'the admin rejects a line with a reason'
);

select throws_ok(
  $$select public.reject_commission_line('00000000-0000-4000-8000-00000000f003', 'otra vez')$$,
  'P0001', 'line_not_accrued', 'a rejected line cannot be rejected again'
);

select throws_ok(
  $$select public.reject_commission_line(gen_random_uuid(), 'x')$$,
  'P0001', 'line_not_found', 'an unknown line fails'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'commission_lines' and action = 'update' and after ->> 'status' in ('approved', 'rejected')),
  3::bigint,
  'every status change is audited'
);

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select public.cancel_recurring('00000000-0000-4000-8000-0000000000d1')$$,
  'the admin cancels the recurring commission'
);

select throws_ok(
  $$select public.cancel_recurring('00000000-0000-4000-8000-0000000000d1')$$,
  'P0001', 'recurring_already_cancelled', 'cancelling twice fails'
);

select throws_ok(
  $$select public.cancel_recurring('00000000-0000-4000-8000-0000000000d3')$$,
  'P0001', 'no_recurring', 'a deal without recurring amount cannot be cancelled'
);

select * from finish();

rollback;
