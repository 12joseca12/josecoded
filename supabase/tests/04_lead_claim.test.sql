begin;

\ir support/helpers.sql

select plan(96);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-closer-off@example.com', 'closer', 'Closer Off');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

update public.profiles set is_active = false where id = md5('t-closer-off@example.com')::uuid;

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-closer-a@example.com')::uuid, 'Contacto A', 'Own@Example.com'),
  ('00000000-0000-4000-8000-0000000000c1', null, 'Contacto Libre', 'free@example.com'),
  ('00000000-0000-4000-8000-0000000000f1', md5('t-closer-off@example.com')::uuid, 'Contacto Baja', 'off@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'new', 'hiring');

select is(
  (select count(*) from pg_enum where enumtypid = 'public.contact_via'::regtype and enumlabel = 'pack'),
  0::bigint,
  'contact_via no longer has the pack value'
);

select is(
  (select count(*) from pg_enum where enumtypid = 'public.contact_via'::regtype and enumlabel = 'project'),
  1::bigint,
  'contact_via has the project value'
);

reset role;
reset role;
select tests.login_service();

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'Match Own', p_email => 'OWN@example.COM', p_message => 'Hola de nuevo', p_consent => true, p_ip_hash => md5('m1'))$$,
  'a lead with the email of an owned contact is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Match Libre', p_email => 'FREE@example.com', p_consent => true, p_ip_hash => md5('m2'))$$,
  'a lead with the email of an unowned contact is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Match Baja', p_email => 'off@example.com', p_consent => true, p_ip_hash => md5('m3'))$$,
  'a lead with the email of a contact owned by an inactive closer is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_pack_id => gen_random_uuid(), p_full_name => 'Libre Uno', p_email => 'uno@example.com', p_message => 'Quiero una web', p_consent => true, p_ip_hash => md5('n1'), p_offer => 'web-negocio', p_extras => array['seo', 'payments'], p_offer_answers => '{"start":"idea","kind":"web","size":"medium","accounts":"none","management":"me","more":["seo"]}'::jsonb)$$,
  'a project lead with offer, extras and answers is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'freelance', p_full_name => 'Libre Dos', p_email => 'dos@example.com', p_consent => true, p_ip_hash => md5('n2'))$$,
  'a second unmatched lead is accepted'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'Libre Tres', p_email => 'tres@example.com', p_consent => true, p_ip_hash => md5('n3'))$$,
  'a third unmatched lead is accepted'
);

reset role;

select results_eq(
  $$select status::text, assigned_to, contact_id, assigned_by from public.leads where full_name = 'Match Own'$$,
  $$values ('assigned', md5('t-closer-a@example.com')::uuid, '00000000-0000-4000-8000-0000000000a1'::uuid, null::uuid)$$,
  'an email matching an owned contact (any case) goes to its owner, assigned and linked'
);

select results_eq(
  $$select kind::text, body, author_id from public.activities where contact_id = '00000000-0000-4000-8000-0000000000a1'$$,
  $$values ('form', 'Hola de nuevo', null::uuid)$$,
  'the matched lead leaves an activity on the existing contact'
);

select results_eq(
  $$select status::text, assigned_to, contact_id from public.leads where full_name = 'Match Libre'$$,
  $$values ('new', null::uuid, '00000000-0000-4000-8000-0000000000c1'::uuid)$$,
  'an email matching an unowned contact stays new with the contact prefilled'
);

select results_eq(
  $$select status::text, assigned_to, contact_id from public.leads where full_name = 'Match Baja'$$,
  $$values ('new', null::uuid, '00000000-0000-4000-8000-0000000000f1'::uuid)$$,
  'a contact owned by an inactive closer does not receive the lead'
);

select results_eq(
  $$select via::text, offer, extras, (offer_answers ->> 'kind') from public.leads where full_name = 'Libre Uno'$$,
  $$values ('project', 'web-negocio', array['seo', 'payments'], 'web')$$,
  'offer, extras and answers are stored'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Dos'), ('Libre Tres'), ('Libre Uno'), ('Match Own')$$,
  'closer A sees the shared inbox and the lead matched to them, not the prefilled-contact ones'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Dos'), ('Libre Tres'), ('Libre Uno')$$,
  'closer B sees the shared inbox but not the lead matched to A'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Dos'), ('Libre Tres'), ('Libre Uno')$$,
  'a subcloser does not see the lead of the parent'
);

reset role;
select tests.login_as('t-closer-a@example.com', 'aal1');

select is((select count(*) from public.leads), 0::bigint, 'a closer at aal1 sees no leads');

reset role;
select tests.login_as('t-closer-off@example.com');

select is((select count(*) from public.leads), 0::bigint, 'an inactive closer sees no leads');

reset role;
select tests.login_as('t-freelance@example.com');

select is((select count(*) from public.leads), 0::bigint, 'freelance sees no leads');

reset role;
select tests.login_as('t-client@example.com');

select is((select count(*) from public.leads), 0::bigint, 'client sees no leads');

reset role;
select tests.logout();

select throws_ok($$select * from public.leads$$, '42501', null, 'anon cannot read leads');
select throws_ok($$select public.claim_lead(gen_random_uuid())$$, '42501', null, 'anon cannot execute claim_lead');
select throws_ok($$select public.assign_lead(gen_random_uuid(), gen_random_uuid())$$, '42501', null, 'anon cannot execute assign_lead');
select throws_ok($$select public.discard_lead(gen_random_uuid(), 'x')$$, '42501', null, 'anon cannot execute discard_lead');
select throws_ok($$select public.touch_lead(gen_random_uuid())$$, '42501', null, 'anon cannot execute touch_lead');

reset role;
reset role;
select tests.login_service();

select throws_ok($$select public.claim_lead(gen_random_uuid())$$, '42501', null, 'service_role cannot claim');

reset role;
select set_config('tests.uno', (select id::text from public.leads where full_name = 'Libre Uno'), true);
select set_config('tests.dos', (select id::text from public.leads where full_name = 'Libre Dos'), true);
select set_config('tests.tres', (select id::text from public.leads where full_name = 'Libre Tres'), true);
select set_config('tests.match', (select id::text from public.leads where full_name = 'Match Own'), true);
select set_config('tests.libre', (select id::text from public.leads where full_name = 'Match Libre'), true);

reset role;
select tests.login_as('t-freelance@example.com');
select throws_ok(format($$select public.claim_lead(%L)$$, current_setting('tests.uno')), '42501', null, 'freelance cannot claim');

reset role;
select tests.login_as('t-client@example.com');
select throws_ok(format($$select public.claim_lead(%L)$$, current_setting('tests.uno')), '42501', null, 'client cannot claim');

reset role;
select tests.login_as('t-closer-a@example.com', 'aal1');
select throws_ok(format($$select public.claim_lead(%L)$$, current_setting('tests.uno')), '42501', null, 'a closer at aal1 cannot claim');

reset role;
select tests.login_as('t-closer-off@example.com');
select throws_ok(format($$select public.claim_lead(%L)$$, current_setting('tests.uno')), '42501', null, 'an inactive closer cannot claim');

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.match')),
  'P0001',
  'lead_already_claimed',
  'a lead matched to a contact cannot be claimed'
);

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.libre')),
  'P0001',
  'lead_already_claimed',
  'a lead with a prefilled contact cannot be claimed by a closer'
);

select lives_ok(format($$select public.claim_lead(%L)$$, current_setting('tests.uno')), 'closer A claims a shared lead');

reset role;
select tests.login_as('t-closer-b@example.com');

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.uno')),
  'P0001',
  'lead_already_claimed',
  'the second claim loses'
);

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Dos'), ('Libre Tres')$$,
  'closer B no longer sees the claimed lead'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select results_eq(
  $$select status::text, assigned_to, (contact_id is not null), (deal_id is not null) from public.leads where full_name = 'Libre Uno'$$,
  $$values ('converted', md5('t-closer-a@example.com')::uuid, true, true)$$,
  'closer A sees the lead converted with contact and deal'
);

select results_eq(
  $$select c.owner_id, c.kind::text, c.source::text, c.email::text, (c.lead_id = l.id) from public.contacts c join public.leads l on l.contact_id = c.id where l.full_name = 'Libre Uno'$$,
  $$values (md5('t-closer-a@example.com')::uuid, 'prospect', 'form', 'uno@example.com', true)$$,
  'claim creates a prospect contact owned by the closer'
);

select results_eq(
  $$select d.stage::text, d.via::text, (d.pack_id is not null), d.owner_id from public.deals d join public.leads l on l.deal_id = d.id where l.full_name = 'Libre Uno'$$,
  $$values ('new', 'project', true, md5('t-closer-a@example.com')::uuid)$$,
  'claim creates a new deal with via and pack_id'
);

select results_eq(
  $$select a.kind::text, a.author_id, a.body from public.activities a join public.leads l on l.contact_id = a.contact_id where l.full_name = 'Libre Uno'$$,
  $$values ('form', md5('t-closer-a@example.com')::uuid, E'Quiero una web\nOferta: web-negocio\nExtras: seo, payments\nRespuestas: {"kind": "web", "more": ["seo"], "size": "medium", "start": "idea", "accounts": "none", "management": "me"}')$$,
  'claim leaves an activity summarising message, offer, extras and answers'
);

reset role;
insert into public.contacts (owner_id, full_name, email)
values (md5('t-closer-b@example.com')::uuid, 'Contacto B Dos', 'dos@example.com');
reset role;
select tests.login_as('t-closer-b@example.com');

select is(
  public.claim_lead(current_setting('tests.dos')::uuid),
  (select id from public.contacts where email = 'dos@example.com'),
  'a claim links the closer own contact with the same email instead of duplicating it'
);

select is(
  (select count(*) from public.contacts where email = 'dos@example.com'),
  1::bigint,
  'no duplicate contact was created'
);

select throws_ok($$update public.leads set status = 'new'$$, '42501', null, 'closers cannot update leads');
select throws_ok($$delete from public.leads$$, '42501', null, 'closers cannot delete leads');

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok($$update public.leads set status = 'new'$$, '42501', null, 'admin cannot update leads directly');
select throws_ok($$delete from public.leads$$, '42501', null, 'admin cannot delete leads');

select is((select count(*) from public.leads), 6::bigint, 'admin sees every lead');

select throws_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.tres'), md5('t-freelance@example.com')::uuid),
  'P0001',
  'invalid_assignee',
  'a lead cannot be assigned to a freelance'
);

select throws_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.tres'), md5('t-closer-off@example.com')::uuid),
  'P0001',
  'invalid_assignee',
  'a lead cannot be assigned to an inactive closer'
);

select throws_ok(
  format($$select public.assign_lead(%L, %L)$$, gen_random_uuid(), md5('t-sub-a@example.com')::uuid),
  'P0001',
  'lead_not_found',
  'assign_lead reports a missing lead to the admin'
);

select lives_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.tres'), md5('t-sub-a@example.com')::uuid),
  'admin assigns a lead to a subcloser'
);

select results_eq(
  $$select status::text, assigned_to, assigned_by, (contact_id is not null), (deal_id is not null) from public.leads where full_name = 'Libre Tres'$$,
  $$values ('converted', md5('t-sub-a@example.com')::uuid, md5('t-admin@example.com')::uuid, true, true)$$,
  'assign_lead leaves the lead converted for the assignee with contact and deal'
);

select lives_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.match'), md5('t-closer-b@example.com')::uuid),
  'admin reassigns a matched lead to another closer'
);

select results_eq(
  $$select owner_id from public.contacts where id = '00000000-0000-4000-8000-0000000000a1'$$,
  $$values (md5('t-closer-b@example.com')::uuid)$$,
  'reassigning moves the existing contact to the new owner'
);

select results_eq(
  $$select owner_id from public.deals where contact_id = '00000000-0000-4000-8000-0000000000a1' order by created_at$$,
  $$values (md5('t-closer-b@example.com')::uuid), (md5('t-closer-b@example.com')::uuid)$$,
  'reassigning moves the deals of that contact'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'contacts' and row_id = '00000000-0000-4000-8000-0000000000a1' and action = 'update'),
  1::bigint,
  'the owner change is audited'
);

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.libre'), md5('t-closer-a@example.com')::uuid),
  'admin assigns a lead with an unowned prefilled contact'
);

select results_eq(
  $$select owner_id from public.contacts where id = '00000000-0000-4000-8000-0000000000c1'$$,
  $$values (md5('t-closer-a@example.com')::uuid)$$,
  'the unowned contact is adopted by the assignee'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.dos'), md5('t-closer-a@example.com')::uuid),
  '42501',
  'admin_only',
  'a closer cannot assign leads'
);

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Tres'), ('Libre Uno'), ('Match Libre')$$,
  'the parent sees the subcloser lead and their own, not the ones reassigned away'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select results_eq(
  $$select full_name from public.leads order by full_name$$,
  $$values ('Libre Tres')$$,
  'the subcloser sees only their own lead'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'no es mio')$$, current_setting('tests.uno')),
  '42501',
  'forbidden',
  'a subcloser cannot discard a lead of the parent'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select throws_ok(
  format($$select public.discard_lead(%L, 'ajeno')$$, current_setting('tests.tres')),
  '42501',
  'forbidden',
  'a closer cannot discard a lead of another team'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  format($$select public.discard_lead(%L, '   ')$$, current_setting('tests.tres')),
  'P0001',
  'reason_required',
  'discard needs a reason'
);

select throws_ok(
  format($$select public.discard_lead(%L, %L)$$, current_setting('tests.tres'), repeat('x', 501)),
  'P0001',
  'reason_too_long',
  'the reason is limited to 500 characters'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'x')$$, current_setting('tests.uno')),
  'P0001',
  'lead_not_discardable',
  'a converted lead cannot be discarded'
);

select lives_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.uno')),
  'the owner touches a lead'
);

select results_eq(
  $$select status::text, (handled_at is not null) from public.leads where full_name = 'Libre Uno'$$,
  $$values ('contacted', true)$$,
  'touch marks the lead contacted with handled_at'
);

select lives_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.tres')),
  'the parent closer touches a subcloser lead'
);

select lives_ok(
  format($$select public.discard_lead(%L, %L)$$, current_setting('tests.uno'), '  Presupuesto fuera de rango  '),
  'the owner discards a contacted lead with a reason'
);

select results_eq(
  $$select status::text, discard_reason from public.leads where full_name = 'Libre Uno'$$,
  $$values ('discarded', 'Presupuesto fuera de rango')$$,
  'the trimmed reason is stored'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'otra vez')$$, current_setting('tests.uno')),
  'P0001',
  'lead_not_discardable',
  'a discarded lead cannot be discarded again'
);

select throws_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.uno')),
  'P0001',
  'lead_not_touchable',
  'a discarded lead cannot be touched'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select throws_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.tres')),
  '42501',
  'forbidden',
  'a closer cannot touch a lead of another team'
);

reset role;
reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$insert into public.leads (source, full_name, phone) values ('manual', 'Libre Cuatro', '600000010')$$,
  'admin inserts an unassigned manual lead'
);

select lives_ok(
  $$select public.discard_lead(id, 'duplicado') from public.leads where full_name = 'Libre Cuatro'$$,
  'admin discards an inbox lead'
);

reset role;
select tests.login_as('t-closer-a@example.com');

select lives_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('whatsapp', 'Por WhatsApp', '600000011', md5('t-closer-a@example.com')::uuid)$$,
  'a closer inserts a whatsapp lead for themselves'
);

select results_eq(
  $$select status::text, assigned_by from public.leads where full_name = 'Por WhatsApp'$$,
  $$values ('assigned', md5('t-closer-a@example.com')::uuid)$$,
  'the manual lead of a closer is born assigned'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Para otro', '600000012', md5('t-closer-b@example.com')::uuid)$$,
  '42501',
  null,
  'a closer cannot insert a lead for another closer'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone) values ('manual', 'Sin dueno', '600000013')$$,
  '42501',
  null,
  'a closer cannot insert an unassigned lead'
);

select throws_ok(
  $$insert into public.leads (source, full_name, email, assigned_to) values ('form', 'Falso', 'f@example.com', md5('t-closer-a@example.com')::uuid)$$,
  '42501',
  null,
  'a closer cannot insert a form lead'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to, status) values ('manual', 'Con estado', '600000014', md5('t-closer-a@example.com')::uuid, 'converted')$$,
  '42501',
  null,
  'a closer cannot choose the status on insert'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to, contact_id) values ('manual', 'Con contacto', '600000015', md5('t-closer-a@example.com')::uuid, '00000000-0000-4000-8000-0000000000c1')$$,
  '42501',
  null,
  'a closer cannot choose the contact on insert'
);

reset role;
reset role;
insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Raro', '600000016', md5('t-closer-a@example.com')::uuid);
update public.leads set status = 'new' where full_name = 'Raro';
select set_config('tests.raro', (select id::text from public.leads where full_name = 'Raro'), true);
select set_config('tests.cuatro', (select id::text from public.leads where full_name = 'Libre Cuatro'), true);
select set_config('tests.whatsapp', (select id::text from public.leads where full_name = 'Por WhatsApp'), true);
select tests.login_as('t-closer-b@example.com');

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.whatsapp')),
  'P0001',
  'lead_already_claimed',
  'an assigned lead cannot be claimed by another closer'
);

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.raro')),
  'P0001',
  'lead_already_claimed',
  'a lead with an owner cannot be claimed even if its status says new'
);

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.cuatro')),
  'P0001',
  'lead_already_claimed',
  'a discarded lead cannot be claimed'
);

reset role;
select tests.login_service();

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'X', p_email => 'x@example.com', p_offer => 'web-negocio', p_consent => true, p_ip_hash => md5('c1'))$$,
  '23514',
  null,
  'an offer needs the project via'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_offer => 'Web Negocio', p_consent => true, p_ip_hash => md5('c2'))$$,
  '23514',
  null,
  'an offer must be slugs'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_offer => 'a,b,c', p_consent => true, p_ip_hash => md5('c3'))$$,
  '23514',
  null,
  'at most two offers'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_extras => array_fill('seo'::text, array[13]), p_consent => true, p_ip_hash => md5('c4'))$$,
  '23514',
  null,
  'at most twelve extras'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_extras => array['Not A Slug'], p_consent => true, p_ip_hash => md5('c5'))$$,
  '23514',
  null,
  'extras must be slugs'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_offer_answers => '{"start":"idea","kind":"nope","size":"small","accounts":"none","management":"me","more":[]}'::jsonb, p_consent => true, p_ip_hash => md5('c6'))$$,
  '23514',
  null,
  'answers must follow the contract values'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'project', p_full_name => 'X', p_email => 'x@example.com', p_offer_answers => '{"start":"existing","extra":1}'::jsonb, p_consent => true, p_ip_hash => md5('c7'))$$,
  '23514',
  null,
  'answers cannot carry unknown keys'
);

select throws_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'X', p_email => 'x@example.com', p_offer_answers => '{"start":"existing"}'::jsonb, p_consent => true, p_ip_hash => md5('c8'))$$,
  '23514',
  null,
  'answers are only for project and freelance leads'
);

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_via => 'freelance', p_full_name => 'X', p_email => 'x@example.com', p_offer_answers => '{"start":"existing"}'::jsonb, p_consent => true, p_ip_hash => md5('c9'))$$,
  'an existing-project answer is accepted for a freelance lead'
);

select ok(
  not has_function_privilege('authenticated', 'public.submit_lead(public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text, text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb)', 'execute')
  and not has_function_privilege('anon', 'public.submit_lead(public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text, text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb)', 'execute')
  and has_function_privilege('service_role', 'public.submit_lead(public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text, text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb)', 'execute'),
  'submit_lead stays executable by service_role only'
);

select is(
  (select count(*) from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'submit_lead'),
  1::bigint,
  'only one submit_lead signature remains'
);

select * from finish();

rollback;
