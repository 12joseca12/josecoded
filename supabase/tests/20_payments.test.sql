begin;

\ir support/helpers.sql

select plan(86);

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
  ('00000000-0000-4000-8000-0000000000a1', md5('t-sub-a@example.com')::uuid, 'Contact S1', 's1@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', md5('t-closer-a@example.com')::uuid, 'Contact A1', 'a1@example.com'),
  ('00000000-0000-4000-8000-0000000000a3', md5('t-admin@example.com')::uuid, 'Contact Admin', 'adm@example.com'),
  ('00000000-0000-4000-8000-0000000000a4', md5('t-closer-b@example.com')::uuid, 'Contact B1', 'b1@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000a3', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000a4', 'proposal', 'project'),
  ('00000000-0000-4000-8000-0000000000d5', '00000000-0000-4000-8000-0000000000a4', 'proposal', 'project');

select tests.login_as('t-admin@example.com');

select public.win_deal('00000000-0000-4000-8000-0000000000d1', 1000, 50);
select public.win_deal('00000000-0000-4000-8000-0000000000d2', 2000, 30);
select public.win_deal('00000000-0000-4000-8000-0000000000d3', 500);
select public.win_deal('00000000-0000-4000-8000-0000000000d5', 600);

select is(
  public.set_payment_schedule(
    '00000000-0000-4000-8000-0000000000d1',
    '[{"label":"Anticipo","percent":40,"amount":400,"due_at":"2026-12-01"},{"label":"Entrega intermedia","percent":40,"amount":400,"due_at":"2027-01-15"},{"label":"Entrega final","percent":20,"amount":200,"due_at":"2027-02-15"}]'::jsonb
  ),
  3,
  'the 40/40/20 template is stored as three milestones'
);

select is(
  (select array_agg(label || ':' || amount || ':' || sort order by sort) from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1'),
  array['Anticipo:400.00:1', 'Entrega intermedia:400.00:2', 'Entrega final:200.00:3'],
  'the milestones keep their order and amounts'
);

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d2', '[{"label":"Solo","amount":1900}]'::jsonb)$$,
  'P0001', 'schedule_total_mismatch', 'milestones that do not add up to the won amount fail'
);

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d2', '[{"label":"Solo","amount":0}]'::jsonb)$$,
  'P0001', 'invalid_schedule', 'a zero amount fails'
);

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d2', '{"label":"x"}'::jsonb)$$,
  'P0001', 'invalid_schedule', 'a schedule that is not an array fails'
);

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d2', '[{"label":"Solo","amount":"abc"}]'::jsonb)$$,
  'P0001', 'invalid_schedule', 'a non-numeric amount fails with a typed error'
);

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d4', '[{"label":"Solo","amount":100}]'::jsonb)$$,
  'P0001', 'deal_not_won', 'a deal that is not won has no schedule'
);

select lives_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d2', '[{"label":"Pago único","amount":2000,"due_at":"2026-11-30"},{"label":"Mes 1","kind":"recurring","amount":30,"due_at":"2026-12-30"}]'::jsonb)$$,
  'recurring items do not count against the won amount'
);

select lives_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d1', '[{"label":"Anticipo","percent":40,"amount":400,"due_at":"2026-12-02"},{"label":"Entrega intermedia","percent":40,"amount":400},{"label":"Entrega final","percent":20,"amount":200}]'::jsonb)$$,
  'a schedule that is not started can be replaced'
);

select is(
  (select count(*) from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1'),
  3::bigint,
  'replacing leaves exactly the new milestones'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  $$select public.set_payment_schedule('00000000-0000-4000-8000-0000000000d1', '[{"label":"x","amount":1000}]'::jsonb)$$,
  '42501', 'forbidden', 'a closer cannot set a schedule'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 10, '2026-01-01', 'transfer')$$,
  '42501', 'forbidden', 'a closer cannot record a payment'
);

select throws_ok(
  $$select public.issue_proforma(gen_random_uuid())$$,
  '42501', 'forbidden', 'a closer cannot issue a proforma'
);

select throws_ok(
  $$select public.record_invoice('00000000-0000-4000-8000-0000000000d1', 'F-1', '2026-01-01', 10, 21)$$,
  '42501', 'forbidden', 'a closer cannot record an invoice'
);

select throws_ok(
  $$select public.cancel_schedule_item(gen_random_uuid())$$,
  '42501', 'forbidden', 'a closer cannot cancel a milestone'
);

select throws_ok(
  $$select public.void_invoice(gen_random_uuid())$$,
  '42501', 'forbidden', 'a closer cannot void an invoice'
);

reset role;
select tests.login_aal1('t-admin@example.com');

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 10, '2026-01-01', 'transfer')$$,
  '42501', 'forbidden', 'an admin without aal2 cannot record a payment'
);

reset role;
select tests.login_as('t-admin@example.com');

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 400, '2026-02-01', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1), null, 'REF-1'),
  null,
  'the admin records the first milestone payment'
);

select is(
  (select string_agg(b.full_name || ':' || l.role || ':' || l.rate || ':' || l.amount, ',' order by l.amount desc)
   from public.commission_lines l join public.profiles b on b.id = l.beneficiary_id),
  'Sub A:closer:10.00:40.00,Closer A:parent:5.00:20.00',
  'a payment accrues one line per beneficiary with the frozen rates'
);

select is(
  (select status::text from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1),
  'paid',
  'the milestone is paid when the net sum covers it'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 1, '2026-02-02', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1), null)$$,
  'P0001', 'payment_exceeds_schedule', 'paying more than the milestone fails'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'refund', 'project', 400, '2026-02-10', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1), null, 'REF-1-R'),
  null,
  'the admin records a refund'
);

select is(
  (select string_agg(l.amount::text, ',' order by l.amount) from public.commission_lines l where l.amount < 0),
  '-40.00,-20.00',
  'a refund adds negative lines with the same rates'
);

select is(
  (select status::text from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1),
  'scheduled',
  'a full refund reopens the milestone'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'refund', 'project', 1, '2026-02-11', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 1), null)$$,
  'P0001', 'refund_exceeds_paid', 'refunding more than was paid fails'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 10, (current_date + 2), 'transfer')$$,
  'P0001', 'future_date', 'a payment cannot be dated in the future'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 0, '2026-02-02', 'transfer')$$,
  'P0001', 'invalid_amount', 'a zero payment fails'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'recurring', 10, '2026-02-02', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and sort = 2), null)$$,
  'P0001', 'nature_mismatch', 'a recurring payment cannot settle a milestone'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d3', 'payment', 'recurring', 10, '2026-02-02', 'transfer')$$,
  'P0001', 'no_recurring', 'a recurring payment needs a recurring deal'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 10, '2026-02-02', 'transfer', (select id from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d2' limit 1), null)$$,
  'P0001', 'schedule_mismatch', 'a milestone of another deal is rejected'
);

select throws_ok(
  $$select public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 1001, '2026-02-02', 'transfer')$$,
  'P0001', 'payment_exceeds_deal', 'a payment without milestone cannot exceed the won amount'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'recurring', 50, '2025-01-10', 'card'),
  null,
  'the first recurring payment is recorded'
);

select is(
  (select recurring_started_at::text from public.deals where id = '00000000-0000-4000-8000-0000000000d1'),
  '2025-01-10',
  'the first recurring payment fixes the start of the twelve months'
);

select is(
  (select string_agg(l.amount::text, ',' order by l.amount) from public.commission_lines l where l.nature = 'recurring'),
  '1.00,2.00',
  'recurring lines use the lower recurring rates (4 % and 2 %)'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'recurring', 50, '2025-12-10', 'card'),
  null,
  'a recurring payment in month eleven is recorded'
);

select is(
  (select count(*) from public.commission_lines where nature = 'recurring'),
  4::bigint,
  'month eleven still accrues'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'recurring', 50, '2026-01-10', 'card'),
  null,
  'a recurring payment after twelve months is recorded'
);

select is(
  (select count(*) from public.commission_lines where nature = 'recurring'),
  4::bigint,
  'the thirteenth month does not accrue'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d2', 'payment', 'recurring', 30, '2025-03-01', 'card'),
  null,
  'a recurring payment on the second deal is recorded'
);

select is(
  (select count(*) from public.commission_lines l join public.commissions c on c.id = l.commission_id where c.deal_id = '00000000-0000-4000-8000-0000000000d2'),
  1::bigint,
  'the second deal accrues one recurring line for a closer without parent'
);

reset role;
update public.deals set recurring_cancelled_at = '2025-03-15' where id = '00000000-0000-4000-8000-0000000000d2';
select tests.login_as('t-admin@example.com');

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d2', 'payment', 'recurring', 30, '2025-04-01', 'card'),
  null,
  'a recurring payment after the cancellation is recorded'
);

select is(
  (select count(*) from public.commission_lines l join public.commissions c on c.id = l.commission_id where c.deal_id = '00000000-0000-4000-8000-0000000000d2'),
  1::bigint,
  'a recurring payment after the cancellation does not accrue'
);

select is(
  (select count(*) from public.commission_lines l join public.commissions c on c.id = l.commission_id where c.deal_id = '00000000-0000-4000-8000-0000000000d3'),
  0::bigint,
  'a deal without header accrues nothing'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d3', 'payment', 'project', 500, '2026-03-01', 'other'),
  null,
  'a payment on an admin-owned deal is recorded'
);

select is(
  (select count(*) from public.commission_lines l join public.commissions c on c.id = l.commission_id where c.deal_id = '00000000-0000-4000-8000-0000000000d3'),
  0::bigint,
  'an admin-owned deal still accrues nothing'
);

create temporary table sched on commit drop as
select id, sort from public.payment_schedule where deal_id = '00000000-0000-4000-8000-0000000000d1' and kind = 'milestone';

select is(
  (select to_char(now() at time zone 'Europe/Madrid', 'YYYY')),
  to_char(current_date, 'YYYY'),
  'the proforma year is the current year'
);

select isnt(public.issue_proforma((select id from sched where sort = 2)), null, 'the admin issues a proforma with the default VAT');
select isnt(public.issue_proforma((select id from sched where sort = 3), 0), null, 'the admin issues a proforma with VAT zero');

select is(
  (select array_agg(number order by number) from public.invoices where kind = 'proforma'),
  array['PF-' || to_char(now() at time zone 'Europe/Madrid', 'YYYY') || '-001', 'PF-' || to_char(now() at time zone 'Europe/Madrid', 'YYYY') || '-002'],
  'proformas are numbered PF-AAAA-NNN in sequence'
);

select is(
  (select row(vat_rate, vat_amount, amount_gross, kind::text, status::text)::text from public.invoices where number like '%-001'),
  '(21.00,84.00,484.00,proforma,sent)',
  'the proforma takes the default VAT and computes gross from net'
);

select is(
  (select row(vat_rate, vat_amount, amount_gross)::text from public.invoices where number like '%-002'),
  '(0.00,0.00,200.00)',
  'the VAT is editable per document and can be zero'
);

select is(
  (select status::text from public.payment_schedule where id = (select id from sched where sort = 2)),
  'proforma_sent',
  'issuing a proforma moves the milestone to proforma_sent'
);

select throws_ok(
  $$select public.issue_proforma((select id from sched where sort = 2))$$,
  'P0001', 'proforma_already_issued', 'a milestone has one proforma'
);

select throws_ok(
  $$select public.issue_proforma((select id from sched where sort = 1), 150)$$,
  'P0001', 'invalid_vat', 'a VAT rate above 100 fails'
);

select throws_ok(
  $$select public.record_invoice('00000000-0000-4000-8000-0000000000d1', 'pf-9', '2026-03-01', 100, 21)$$,
  'P0001', 'invoice_number_reserved', 'the CRM numbering prefix is reserved for proformas'
);

reset role;

select throws_ok(
  $$insert into public.invoices (deal_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross) values ('00000000-0000-4000-8000-0000000000d1', 'invoice', 'PF-2026-009', current_date, 10, 0, 0, 10)$$,
  '23514', null, 'a fiscal invoice can never carry a proforma number'
);

select throws_ok(
  $$insert into public.invoices (deal_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross) values ('00000000-0000-4000-8000-0000000000d1', 'proforma', 'F-2026-009', current_date, 10, 0, 0, 10)$$,
  '23514', null, 'a proforma can never carry a fiscal number'
);

select tests.login_as('t-admin@example.com');

select isnt(
  public.record_invoice('00000000-0000-4000-8000-0000000000d1', 'F-2026/0001', '2026-03-01', 400, 21, (select id from sched where sort = 1), '00000000-0000-4000-8000-0000000000d1/10000000-0000-4000-8000-000000000001.pdf'),
  null,
  'the admin registers an external invoice with its PDF path'
);

select is(
  (select row(amount_gross, status::text, kind::text)::text from public.invoices where number = 'F-2026/0001'),
  '(484.00,sent,invoice)',
  'the external invoice keeps its number and totals'
);

select is(
  (select status::text from public.payment_schedule where id = (select id from sched where sort = 1)),
  'invoiced',
  'registering an invoice moves the milestone to invoiced'
);

select throws_ok(
  $$select public.record_invoice('00000000-0000-4000-8000-0000000000d1', 'F-2026/0001', '2026-03-01', 100, 21)$$,
  'P0001', 'invoice_number_taken', 'a duplicated invoice number fails'
);

select throws_ok(
  $$select public.record_invoice('00000000-0000-4000-8000-0000000000d1', 'F-2026/0002', '2026-03-01', 100, 21, null, '../etc/passwd')$$,
  'P0001', 'invalid_invoice', 'a PDF path outside the deal folder shape fails'
);

select isnt(
  public.record_payment('00000000-0000-4000-8000-0000000000d1', 'payment', 'project', 400, '2026-03-05', 'transfer', (select id from sched where sort = 1), (select id from public.invoices where number = 'F-2026/0001')),
  null,
  'a payment linked to the invoice is recorded'
);

select is(
  (select status::text from public.invoices where number = 'F-2026/0001'),
  'paid',
  'the invoice is paid when its payments cover it'
);

select throws_ok(
  $$select public.void_invoice((select id from public.invoices where number = 'F-2026/0001'))$$,
  'P0001', 'invoice_not_voidable', 'a paid invoice cannot be voided'
);

select throws_ok(
  $$select public.cancel_schedule_item((select id from sched where sort = 1))$$,
  'P0001', 'schedule_has_payments', 'a milestone with payments cannot be cancelled'
);

select lives_ok(
  $$select public.cancel_schedule_item((select id from sched where sort = 2))$$,
  'a milestone with only a proforma can be cancelled'
);

select is(
  (select status::text from public.invoices where number like '%-001'),
  'void',
  'cancelling a milestone voids its proforma'
);

select lives_ok(
  $$select public.void_invoice((select id from public.invoices where number like '%-002'))$$,
  'the admin voids a proforma'
);

select is(
  (select status::text from public.payment_schedule where id = (select id from sched where sort = 3)),
  'scheduled',
  'voiding the only document reopens the milestone'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select is(
  (select count(*) from public.payment_schedule),
  5::bigint,
  'the parent closer reads the schedule of the deals in their portfolio (subcloser deal and own deal)'
);

select is((select count(*) from public.payments), 0::bigint, 'a closer cannot read payments directly');
select is((select count(*) from public.invoices), 0::bigint, 'a closer cannot read invoices');

select is(
  (select count(*) from public.deal_payments('00000000-0000-4000-8000-0000000000d1')),
  6::bigint,
  'the parent closer reads the payments of the subcloser deal through the RPC'
);

select is(
  (select count(*) from public.deal_payments('00000000-0000-4000-8000-0000000000d1') where method is not null or reference is not null),
  0::bigint,
  'the RPC hides method and reference from closers'
);

select throws_ok(
  $$select * from public.deal_payments('00000000-0000-4000-8000-0000000000d4')$$,
  'P0001', 'deal_not_found', 'a closer cannot read payments of another portfolio'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is((select count(*) from public.payment_schedule), 0::bigint, 'another closer reads no schedule of this portfolio');

reset role;
select tests.login_as('t-client@example.com');

select throws_ok(
  $$select * from public.deal_payments('00000000-0000-4000-8000-0000000000d1')$$,
  '42501', 'forbidden', 'a client cannot read payments'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.deal_payments('00000000-0000-4000-8000-0000000000d1') where method is not null),
  6::bigint,
  'the admin sees the method of every payment'
);

select is((select count(*) from public.invoices), 3::bigint, 'the admin reads every invoice');

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'payments' and action = 'insert'),
  9::bigint,
  'every payment is audited'
);

select is(
  (select public from storage.buckets where id = 'billing'),
  false,
  'the billing bucket is private'
);

select is(
  (select allowed_mime_types from storage.buckets where id = 'billing'),
  array['application/pdf'],
  'the billing bucket only accepts PDF'
);

select tests.logout();

select throws_ok($$select * from public.payments$$, '42501', null, 'anon cannot read payments');
select throws_ok($$select * from public.invoices$$, '42501', null, 'anon cannot read invoices');
select throws_ok($$select * from public.payment_schedule$$, '42501', null, 'anon cannot read the schedule');

select * from finish();

rollback;
