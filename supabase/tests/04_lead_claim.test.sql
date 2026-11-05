begin;

\ir support/helpers.sql

select plan(151);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-closer-off@example.com', 'closer', 'Closer Off');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

update public.profiles set is_active = false where id = md5('t-closer-off@example.com')::uuid;

insert into public.contacts (id, owner_id, full_name, email, import_id) values
  ('00000000-0000-4000-8000-0000000000a1', md5('t-closer-a@example.com')::uuid, 'Contacto A', 'Own@Example.com', gen_random_uuid()),
  ('00000000-0000-4000-8000-0000000000c1', null, 'Contacto Libre', 'free@example.com', gen_random_uuid()),
  ('00000000-0000-4000-8000-0000000000f1', md5('t-closer-off@example.com')::uuid, 'Contacto Baja', 'off@example.com', gen_random_uuid());

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
  $$select public.submit_lead(p_source => 'form', p_via => 'hiring', p_full_name => 'Libre Tres', p_email => 'tres@example.com', p_message => repeat('x', 300), p_consent => true, p_ip_hash => md5('n3'))$$,
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
  $$values ('form', '[Sin verificar] Hola de nuevo', null::uuid)$$,
  'the matched lead leaves an unverified activity on the existing contact'
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
  $$values ('Match Own')$$,
  'closer A reads in full only the lead matched to them'
);

select is((select count(*) from public.list_lead_inbox()), 3::bigint, 'closer A sees three masked inbox leads, not the prefilled-contact ones');

select results_eq(
  $$select first_name, via::text, offer, extras, excerpt, locale::text from public.list_lead_inbox() where offer is not null$$,
  $$values ('Libre', 'project', 'web-negocio', array['seo', 'payments'], 'Quiero una web', null::text)$$,
  'the masked inbox shows first name, via, offer, extras and an excerpt'
);

select is(
  (select max(char_length(excerpt)) from public.list_lead_inbox()),
  140,
  'the excerpt is cut at 140 characters'
);

reset role;
select tests.login_as('t-closer-b@example.com');

select is((select count(*) from public.leads), 0::bigint, 'closer B reads no unassigned lead directly');
select is((select count(*) from public.list_lead_inbox()), 3::bigint, 'closer B sees the masked inbox');
select is(
  (select count(*) from public.leads where email is not null or message is not null),
  0::bigint,
  'no email or message of an unassigned lead is readable by a closer'
);

reset role;
select tests.login_as('t-sub-a@example.com');

select is((select count(*) from public.leads), 0::bigint, 'a subcloser does not read the lead of the parent');
select is((select count(*) from public.list_lead_inbox()), 3::bigint, 'a subcloser sees the masked inbox');

reset role;
select tests.login_as('t-closer-a@example.com', 'aal1');

select is((select count(*) from public.leads), 0::bigint, 'a closer at aal1 sees no leads');
select throws_ok($$select * from public.list_lead_inbox()$$, '42501', 'forbidden', 'a closer at aal1 cannot list the inbox');

reset role;
select tests.login_as('t-closer-off@example.com');

select is((select count(*) from public.leads), 0::bigint, 'an inactive closer sees no leads');
select throws_ok($$select * from public.list_lead_inbox()$$, '42501', 'forbidden', 'an inactive closer cannot list the inbox');

reset role;
select tests.login_as('t-freelance@example.com');

select is((select count(*) from public.leads), 0::bigint, 'freelance sees no leads');
select throws_ok($$select * from public.list_lead_inbox()$$, '42501', 'forbidden', 'freelance cannot list the inbox');

reset role;
select tests.login_as('t-client@example.com');

select is((select count(*) from public.leads), 0::bigint, 'client sees no leads');
select throws_ok($$select * from public.list_lead_inbox()$$, '42501', 'forbidden', 'client cannot list the inbox');

reset role;
select tests.logout();

select throws_ok($$select * from public.leads$$, '42501', null, 'anon cannot read leads');
select throws_ok($$select * from public.list_lead_inbox()$$, '42501', null, 'anon cannot list the inbox');
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

select is((select count(*) from public.list_lead_inbox()), 2::bigint, 'closer B no longer sees the claimed lead in the inbox');

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

select throws_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.uno')),
  '42501',
  'forbidden',
  'a subcloser cannot touch a lead of the parent'
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
insert into public.leads (source, full_name, phone, assigned_to) values
  ('manual', 'Para tocar', '600000020', md5('t-closer-a@example.com')::uuid),
  ('manual', 'Para descartar', '600000021', md5('t-sub-a@example.com')::uuid);
select set_config('tests.tocar', (select id::text from public.leads where full_name = 'Para tocar'), true);
select set_config('tests.descartar', (select id::text from public.leads where full_name = 'Para descartar'), true);
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
  'the owner touches a converted lead'
);

select results_eq(
  $$select status::text, (handled_at is not null) from public.leads where full_name = 'Libre Uno'$$,
  $$values ('converted', true)$$,
  'touching a converted lead only sets handled_at'
);

select lives_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.tocar')),
  'the owner touches an assigned lead'
);

select results_eq(
  $$select status::text, (handled_at is not null) from public.leads where full_name = 'Para tocar'$$,
  $$values ('contacted', true)$$,
  'touching an assigned lead marks it contacted with handled_at'
);

select lives_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.tres')),
  'the parent closer touches a subcloser lead'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'x')$$, current_setting('tests.tres')),
  'P0001',
  'lead_not_discardable',
  'a lead with a deal cannot be discarded even by the parent closer'
);

select lives_ok(
  format($$select public.discard_lead(%L, %L)$$, current_setting('tests.tocar'), '  Presupuesto fuera de rango  '),
  'the owner discards a contacted lead without a deal'
);

select lives_ok(
  format($$select public.discard_lead(%L, 'no responde')$$, current_setting('tests.descartar')),
  'the parent closer discards a subcloser lead without a deal'
);

select results_eq(
  $$select status::text, discard_reason, discarded_by from public.leads where full_name = 'Para tocar'$$,
  $$values ('discarded', 'Presupuesto fuera de rango', md5('t-closer-a@example.com')::uuid)$$,
  'the trimmed reason and the author of the discard are stored'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'otra vez')$$, current_setting('tests.tocar')),
  'P0001',
  'lead_not_discardable',
  'a discarded lead cannot be discarded again'
);

select throws_ok(
  format($$select public.touch_lead(%L)$$, current_setting('tests.tocar')),
  'P0001',
  'lead_not_touchable',
  'a discarded lead cannot be touched'
);

select throws_ok(
  format($$select public.discard_lead(%L, 'x')$$, gen_random_uuid()),
  '42501',
  'forbidden',
  'a closer gets forbidden, not not-found, for a lead that does not exist'
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

select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Tarde Uno', p_email => 'tarde1@example.com', p_consent => true, p_ip_hash => md5('t1'))$$,
  'a late lead whose email later becomes an unowned contact'
);
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Tarde Dos', p_email => 'tarde2@example.com', p_consent => true, p_ip_hash => md5('t2'))$$,
  'a late lead whose email later becomes an owned contact'
);
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Tarde Tres', p_email => 'tarde3@example.com', p_consent => true, p_ip_hash => md5('t3'))$$,
  'a late lead for the adoption path'
);
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Tarde Cinco', p_email => 'tarde5@example.com', p_consent => true, p_ip_hash => md5('t5'))$$,
  'a late lead whose email later becomes a contact of closer A'
);
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Tarde Cuatro', p_email => 'tarde4@example.com', p_consent => true, p_ip_hash => md5('t4'))$$,
  'a late lead whose email later becomes a contact of another closer'
);

reset role;
insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000e1', null, 'Tarde Libre', 'tarde1@example.com'),
  ('00000000-0000-4000-8000-0000000000e2', md5('t-closer-a@example.com')::uuid, 'Tarde de A', 'tarde2@example.com'),
  ('00000000-0000-4000-8000-0000000000e3', null, 'Tarde Adoptable', 'tarde3@example.com'),
  ('00000000-0000-4000-8000-0000000000e5', md5('t-closer-a@example.com')::uuid, 'Tarde de A Dos', 'tarde4@example.com'),
  ('00000000-0000-4000-8000-0000000000e6', md5('t-closer-a@example.com')::uuid, 'Tarde de A Tres', 'tarde5@example.com');
insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000e4', '00000000-0000-4000-8000-0000000000e3', 'new', 'hiring');
select set_config('tests.t1', (select id::text from public.leads where full_name = 'Tarde Uno'), true);
select set_config('tests.t2', (select id::text from public.leads where full_name = 'Tarde Dos'), true);
select set_config('tests.t3', (select id::text from public.leads where full_name = 'Tarde Tres'), true);
select set_config('tests.t4', (select id::text from public.leads where full_name = 'Tarde Cuatro'), true);
select set_config('tests.t5', (select id::text from public.leads where full_name = 'Tarde Cinco'), true);
select tests.login_as('t-closer-b@example.com');

select is(
  public.claim_lead(current_setting('tests.t1')::uuid),
  null::uuid,
  'a claim does not adopt an unowned contact and answers without revealing it'
);

select is(
  public.claim_lead(current_setting('tests.t5')::uuid),
  null::uuid,
  'a claim does not duplicate a contact owned by someone else and answers without revealing it'
);

select is(
  (select count(*) from public.leads where id in (current_setting('tests.t1')::uuid, current_setting('tests.t5')::uuid)),
  0::bigint,
  'the closer cannot read the leads after the blocked claims'
);

select is(
  (select count(*) from public.list_lead_inbox() where id in (current_setting('tests.t1')::uuid, current_setting('tests.t5')::uuid)),
  0::bigint,
  'blocked leads leave the inbox'
);

select throws_ok(
  format($$select public.claim_lead(%L)$$, current_setting('tests.t5')),
  'P0001',
  'lead_already_claimed',
  'a blocked lead cannot be claimed again'
);

reset role;
select results_eq(
  format($$select status::text, assigned_to, assigned_by, contact_id from public.leads where id = %L$$, current_setting('tests.t5')),
  $$values ('assigned', md5('t-admin@example.com')::uuid, md5('t-admin@example.com')::uuid, null::uuid)$$,
  'a blocked claim hands the lead to the admin to decide'
);

select tests.login_as('t-closer-a@example.com');

select is(
  public.claim_lead(current_setting('tests.t2')::uuid),
  '00000000-0000-4000-8000-0000000000e2'::uuid,
  'the owner of the contact claims the lead and links their own contact'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.t4'), md5('t-closer-b@example.com')::uuid),
  'P0001',
  'contact_conflict',
  'assigning does not duplicate or steal a contact owned by another closer'
);

select lives_ok(
  format($$select public.assign_lead(%L, %L)$$, current_setting('tests.t3'), md5('t-closer-b@example.com')::uuid),
  'admin assigns a lead whose email is an unowned contact'
);

select results_eq(
  $$select c.owner_id, d.owner_id from public.contacts c join public.deals d on d.contact_id = c.id where c.id = '00000000-0000-4000-8000-0000000000e3' and d.id = '00000000-0000-4000-8000-0000000000e4'$$,
  $$values (md5('t-closer-b@example.com')::uuid, md5('t-closer-b@example.com')::uuid)$$,
  'adopting an unowned contact moves its existing deals to the new owner'
);

reset role;
update public.leads set status = 'contacted' where id = current_setting('tests.t2')::uuid;
select tests.login_as('t-closer-a@example.com');

select throws_ok(
  format($$select public.discard_lead(%L, 'x')$$, current_setting('tests.t2')),
  'P0001',
  'lead_not_discardable',
  'a lead with a deal cannot be discarded whatever its status'
);

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'leads' and row_id = current_setting('tests.tocar')::uuid and action = 'update'),
  2::bigint,
  'status changes of a lead are audited'
);

select is(
  (select count(*) from private.audit_log where table_name = 'leads' and row_id = current_setting('tests.uno')::uuid and action = 'update'),
  1::bigint,
  'the claim is audited and a handled_at-only touch is not'
);

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

reset role;
select tests.create_user('t-closer-c@example.com', 'closer', 'Closer C');

select tests.login_as('t-closer-b@example.com');
insert into public.contacts (owner_id, full_name, email)
values (md5('t-closer-b@example.com')::uuid, 'Captura B', 'victim@example.com');

reset role;
select tests.login_service();
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Victima Uno', p_email => 'victim@example.com', p_consent => true, p_ip_hash => md5('v1'))$$,
  'a lead arrives with the email of a contact a closer made up'
);
select lives_ok(
  $$select public.submit_lead(p_source => 'form', p_full_name => 'Victima Dos', p_email => 'victim2@example.com', p_consent => true, p_ip_hash => md5('v2'))$$,
  'a lead arrives before a closer creates a contact with its email'
);

reset role;
select results_eq(
  $$select status::text, assigned_to, contact_id from public.leads where full_name = 'Victima Uno'$$,
  $$values ('new', null::uuid, null::uuid)$$,
  'a contact without real relation does not capture the lead, which enters the inbox'
);

select is(
  (select count(*) from private.audit_log where action = 'contact_email_matches_lead' and row_id = (select id from public.contacts where full_name = 'Captura B')),
  0::bigint,
  'no alert when no open lead had the email'
);

select tests.login_as('t-closer-b@example.com');
insert into public.contacts (owner_id, full_name, email)
values (md5('t-closer-b@example.com')::uuid, 'Captura B Dos', 'victim2@example.com');
reset role;

select results_eq(
  $$select actor_id, row_id, (after ->> 'lead_id')::uuid from private.audit_log where action = 'contact_email_matches_lead' and (after ->> 'lead_id')::uuid = (select id from public.leads where full_name = 'Victima Dos')$$,
  $$select md5('t-closer-b@example.com')::uuid, id, (select id from public.leads where full_name = 'Victima Dos') from public.contacts where full_name = 'Captura B Dos'$$,
  'a new contact matching an open lead by email alerts the admin through the audit log'
);

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000b3', md5('t-closer-b@example.com')::uuid, 'Con Deal', 'rel-deal@example.com'),
  ('00000000-0000-4000-8000-0000000000b4', md5('t-closer-b@example.com')::uuid, 'Con Nota Auto', 'rel-auto@example.com'),
  ('00000000-0000-4000-8000-0000000000b5', md5('t-closer-b@example.com')::uuid, 'Con Nota Humana', 'rel-human@example.com');
insert into public.deals (contact_id, stage, via) values ('00000000-0000-4000-8000-0000000000b3', 'new', 'hiring');
insert into public.activities (contact_id, author_id, kind, body) values
  ('00000000-0000-4000-8000-0000000000b4', null, 'form', 'auto'),
  ('00000000-0000-4000-8000-0000000000b5', md5('t-closer-b@example.com')::uuid, 'note', 'humana');

select tests.login_as('t-admin@example.com');
insert into public.contacts (owner_id, full_name, email)
values (md5('t-closer-a@example.com')::uuid, 'Alta Admin', 'rel-admin@example.com');
reset role;

select is(
  (select created_by_admin from public.contacts where full_name = 'Alta Admin'),
  true,
  'a contact created by the admin is marked as such'
);

select tests.login_as('t-closer-b@example.com');
select is(
  (select created_by_admin from public.contacts where full_name = 'Captura B Dos'),
  false,
  'a contact created by a closer is not marked as admin-created'
);
reset role;

select tests.login_service();
select public.submit_lead(p_source => 'form', p_full_name => 'Rel Deal', p_email => 'rel-deal@example.com', p_consent => true, p_ip_hash => md5('r1'));
select public.submit_lead(p_source => 'form', p_full_name => 'Rel Auto', p_email => 'rel-auto@example.com', p_consent => true, p_ip_hash => md5('r2'));
select public.submit_lead(p_source => 'form', p_full_name => 'Rel Human', p_email => 'rel-human@example.com', p_consent => true, p_ip_hash => md5('r3'));
select public.submit_lead(p_source => 'form', p_full_name => 'Rel Admin', p_email => 'rel-admin@example.com', p_consent => true, p_ip_hash => md5('r4'));
reset role;

select results_eq(
  $$select full_name, assigned_to is not null from public.leads where full_name like 'Rel %' order by full_name$$,
  $$values ('Rel Admin', true), ('Rel Auto', false), ('Rel Deal', true), ('Rel Human', true)$$,
  'only contacts with a deal, a human activity or admin creation capture a lead by email'
);

insert into public.leads (source, full_name, message, phone) values
  ('manual', 'Saneo', 'Escribeme a ana.perez+x@correo.example.com o visita https://ejemplo.com/a?b=1 o www.otro.es/x o llama al +34 600 12 34 56 / 600.123.456 / 600-123-456 gracias', '600000099'),
  ('manual', 'Corto', 'Pedido 123456 y 12 34, hola', '600000098');

select tests.login_as('t-closer-c@example.com');

select is(
  (select excerpt from public.list_lead_inbox() where first_name = 'Saneo'),
  'Escribeme a […] o visita […] o […] o llama al […] / […] / […] gracias',
  'the inbox excerpt hides emails, links and phone numbers'
);

select is(
  (select excerpt from public.list_lead_inbox() where first_name = 'Corto'),
  'Pedido 123456 y 12 34, hola',
  'short digit runs are kept'
);

reset role;
insert into public.leads (source, full_name, phone)
select 'manual', 'Cuota ' || g, '6100000' || lpad(g::text, 2, '0')
from generate_series(1, 52) as g;

select tests.login_as('t-closer-c@example.com');

select lives_ok(
  $t$do $do$ declare r record; begin for r in select id from public.list_lead_inbox() where first_name = 'Cuota' limit 25 loop perform public.claim_lead(r.id); end loop; end $do$$t$,
  'a closer can claim up to the daily limit'
);

select throws_ok(
  $$select public.claim_lead((select id from public.list_lead_inbox() where first_name = 'Cuota' limit 1))$$,
  'P0001',
  'claim_quota_exceeded',
  'the claim over the daily limit is refused'
);

reset role;
select is(
  (select count(*) from private.audit_log where action = 'claim_quota_reached' and row_id = md5('t-closer-c@example.com')::uuid),
  1::bigint,
  'reaching the daily limit alerts the admin once'
);

select tests.login_as('t-admin@example.com');
select lives_ok(
  $t$do $do$ declare r record; begin for r in select id from public.leads where full_name like 'Cuota %' and status = 'new' loop perform public.claim_lead(r.id); end loop; end $do$$t$,
  'the admin has no daily limit'
);
select is(
  (select count(*) from public.leads where full_name like 'Cuota %' and status = 'converted'),
  52::bigint,
  'the admin claimed every remaining lead'
);
reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'deals' and row_id = '00000000-0000-4000-8000-0000000000e4' and action = 'update'),
  1::bigint,
  'a deal owner change is audited'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Mal Asignado', '600000097', md5('t-freelance@example.com')::uuid)$$,
  'P0001',
  'invalid_assignee',
  'a lead cannot be created assigned to a freelance'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Mal Asignado', '600000097', gen_random_uuid())$$,
  'P0001',
  'invalid_assignee',
  'a lead cannot be created assigned to an unknown profile'
);

select throws_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Mal Asignado', '600000097', md5('t-closer-off@example.com')::uuid)$$,
  'P0001',
  'invalid_assignee',
  'a lead cannot be created assigned to an inactive closer'
);

select lives_ok(
  $$insert into public.leads (source, full_name, phone, assigned_to) values ('manual', 'Bien Asignado', '600000096', md5('t-sub-a@example.com')::uuid)$$,
  'a lead can be created assigned to a subcloser'
);

select * from finish();

rollback;
