begin;

select plan(64);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Admin');
select tests.create_user('t-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-sub-a@example.com', 'closer', 'Sub A', 't-closer-a@example.com');
select tests.create_user('t-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-freelance@example.com', 'freelance', 'Freelance');
select tests.create_user('t-client@example.com', 'client', 'Client');

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', tests.user_id('t-closer-a@example.com'), 'Contacto A', 'a@example.com'),
  ('00000000-0000-4000-8000-0000000000a2', tests.user_id('t-sub-a@example.com'), 'Contacto S', 's@example.com'),
  ('00000000-0000-4000-8000-0000000000b1', tests.user_id('t-closer-b@example.com'), 'Contacto B', 'b@example.com'),
  ('00000000-0000-4000-8000-0000000000c1', null, 'Contacto Sin dueno', 'n@example.com');

insert into public.deals (id, contact_id, stage, via) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'new', 'pack'),
  ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-0000000000a2', 'new', 'hiring'),
  ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-0000000000b1', 'new', 'freelance');

insert into public.activities (contact_id, author_id, kind, body) values
  ('00000000-0000-4000-8000-0000000000a1', tests.user_id('t-closer-a@example.com'), 'note', 'nota A'),
  ('00000000-0000-4000-8000-0000000000b1', tests.user_id('t-closer-b@example.com'), 'note', 'nota B');

insert into public.leads (id, source, full_name, email, consent_at, status, assigned_to) values
  ('00000000-0000-4000-8000-0000000000e1', 'form', 'Lead A', 'la@example.com', now(), 'assigned', tests.user_id('t-closer-a@example.com')),
  ('00000000-0000-4000-8000-0000000000e2', 'form', 'Lead S', 'ls@example.com', now(), 'assigned', tests.user_id('t-sub-a@example.com')),
  ('00000000-0000-4000-8000-0000000000e3', 'form', 'Lead libre', 'll@example.com', now(), 'new', null);

select tests.logout();

select throws_ok($$select * from public.contacts$$, '42501', null, 'anon cannot read contacts');
select throws_ok($$select * from public.deals$$, '42501', null, 'anon cannot read deals');
select throws_ok($$select * from public.activities$$, '42501', null, 'anon cannot read activities');

select tests.login_as('t-closer-a@example.com');

select results_eq(
  $$select full_name from public.contacts order by full_name$$,
  $$values ('Contacto A'), ('Contacto S')$$,
  'closer sees own contacts and those of the subcloser'
);

select lives_ok($$update public.contacts set notes = 'editado' where full_name = 'Contacto A'$$, 'closer edits own contact');
select lives_ok($$update public.contacts set notes = 'editado' where full_name = 'Contacto S'$$, 'parent closer edits subcloser contact');
select lives_ok($$update public.contacts set notes = 'robado' where full_name = 'Contacto B'$$, 'update on foreign contact is filtered');

select results_eq(
  $$select count(*)::int from public.contacts where notes = 'editado'$$,
  $$values (2)$$,
  'only the two visible contacts were edited'
);

select throws_ok(
  $$update public.contacts set owner_id = tests.user_id('t-closer-b@example.com') where full_name = 'Contacto A'$$,
  '42501',
  'owner_change_admin_only',
  'closer cannot hand a contact to someone else'
);

select throws_ok(
  $$update public.contacts set owner_id = null where full_name = 'Contacto A'$$,
  '42501',
  'owner_change_admin_only',
  'closer cannot release a contact'
);

select lives_ok(
  $$insert into public.contacts (owner_id, full_name, email) values (private.uid(), 'Nuevo A', 'nuevo-a@example.com')$$,
  'closer inserts a contact for self'
);

select throws_ok(
  $$insert into public.contacts (owner_id, full_name) values (tests.user_id('t-closer-b@example.com'), 'Para B')$$,
  '42501',
  null,
  'closer cannot insert a contact for another owner'
);

select throws_ok(
  $$insert into public.contacts (owner_id, full_name) values (null, 'Sin dueno 2')$$,
  '42501',
  null,
  'closer cannot insert an ownerless contact'
);

select throws_ok(
  $$insert into public.contacts (owner_id, full_name, email) values (private.uid(), 'Duplicado', 'a@example.com')$$,
  '23505',
  null,
  'email is unique per owner'
);

select throws_ok($$delete from public.contacts$$, '42501', null, 'contacts are never deleted');

select results_eq(
  $$select count(*)::int from public.activities$$,
  $$values (1)$$,
  'closer sees activities of own and team contacts only'
);

select lives_ok(
  $$insert into public.activities (contact_id, author_id, kind, body, occurred_at)
    values ('00000000-0000-4000-8000-0000000000a1', private.uid(), 'call', 'llamada', '2026-01-01T10:00:00Z')$$,
  'closer logs an activity on own contact'
);

select throws_ok(
  $$insert into public.activities (contact_id, author_id, kind) values ('00000000-0000-4000-8000-0000000000a1', tests.user_id('t-closer-b@example.com'), 'note')$$,
  '42501',
  null,
  'activity author must be the caller'
);

select throws_ok(
  $$insert into public.activities (contact_id, author_id, kind) values ('00000000-0000-4000-8000-0000000000a1', private.uid(), 'system')$$,
  '42501',
  null,
  'closer cannot forge system activities'
);

select throws_ok(
  $$insert into public.activities (contact_id, author_id, kind) values ('00000000-0000-4000-8000-0000000000a1', private.uid(), 'stage_change')$$,
  '42501',
  null,
  'closer cannot forge stage_change activities'
);

select throws_ok(
  $$insert into public.activities (contact_id, author_id, kind) values ('00000000-0000-4000-8000-0000000000b1', private.uid(), 'note')$$,
  '42501',
  null,
  'closer cannot log activities on a foreign contact'
);

select throws_ok(
  $$insert into public.activities (contact_id, deal_id, author_id, kind)
    values ('00000000-0000-4000-8000-0000000000a1', '00000000-0000-4000-8000-0000000000d2', private.uid(), 'note')$$,
  '23503',
  null,
  'activity deal must belong to the same contact'
);

select throws_ok($$update public.activities set body = 'x'$$, '42501', null, 'activities are not updatable');
select throws_ok($$delete from public.activities$$, '42501', null, 'activities are not deletable');

select results_eq(
  $$select count(*)::int from public.deals$$,
  $$values (2)$$,
  'closer sees deals of own and team contacts'
);

select lives_ok(
  $$insert into public.deals (id, contact_id, via, owner_id)
    values ('00000000-0000-4000-8000-0000000000d4', '00000000-0000-4000-8000-0000000000a1', 'hiring', tests.user_id('t-closer-b@example.com'))$$,
  'closer opens a deal on own contact'
);

select is(
  (select owner_id from public.deals where id = '00000000-0000-4000-8000-0000000000d4'),
  tests.user_id('t-closer-a@example.com'),
  'deal owner is copied from the contact, not from the client'
);

select throws_ok(
  $$insert into public.deals (contact_id, via) values ('00000000-0000-4000-8000-0000000000b1', 'hiring')$$,
  '42501',
  null,
  'closer cannot open a deal on a foreign contact'
);

select throws_ok(
  $$insert into public.deals (contact_id, via, stage, won_at) values ('00000000-0000-4000-8000-0000000000a1', 'hiring', 'won', now())$$,
  '42501',
  'won_requires_win_deal',
  'closer cannot insert a won deal'
);

select throws_ok(
  $$update public.deals set stage = 'won', won_at = now() where id = '00000000-0000-4000-8000-0000000000d1'$$,
  '42501',
  'won_requires_win_deal',
  'closer cannot mark a deal as won'
);

select throws_ok(
  $$update public.deals set won_amount = 1000 where id = '00000000-0000-4000-8000-0000000000d1'$$,
  '42501',
  'won_fields_require_win_deal',
  'closer cannot set the collected amount'
);

select throws_ok(
  $$update public.deals set contact_id = '00000000-0000-4000-8000-0000000000a2' where id = '00000000-0000-4000-8000-0000000000d1'$$,
  '23514',
  'deal_contact_immutable',
  'a deal cannot move to another contact'
);

select lives_ok(
  $$update public.deals set stage = 'lost', lost_reason = 'precio' where id = '00000000-0000-4000-8000-0000000000d1'$$,
  'closer marks a deal as lost'
);

select results_eq(
  $$select (lost_at is not null), stage::text from public.deals where id = '00000000-0000-4000-8000-0000000000d1'$$,
  $$values (true, 'lost')$$,
  'lost_at is set when the deal is lost'
);

select lives_ok(
  $$update public.deals set stage = 'contacted' where id = '00000000-0000-4000-8000-0000000000d1'$$,
  'closer reopens a lost deal'
);

select is(
  (select lost_at from public.deals where id = '00000000-0000-4000-8000-0000000000d1'),
  null,
  'lost_at is cleared when the deal reopens'
);

select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e1')), true, 'closer owns own lead');
select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e2')), true, 'closer owns the lead of a subcloser');
select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e3')), false, 'closer does not own an unassigned lead');
select is((select private.is_closer()), true, 'is_closer true for closer with aal2');

select tests.login_aal1('t-closer-a@example.com');

select is((select count(*) from public.contacts), 0::bigint, 'closer with aal1 sees no contacts');
select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e1')), false, 'owns_lead is false with aal1');
select throws_ok(
  $$insert into public.contacts (owner_id, full_name) values (private.uid(), 'Sin aal2')$$,
  '42501',
  null,
  'closer with aal1 cannot insert contacts'
);

select tests.login_as('t-sub-a@example.com');

select results_eq(
  $$select full_name from public.contacts order by full_name$$,
  $$values ('Contacto S')$$,
  'subcloser sees only own contacts'
);

select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e1')), false, 'subcloser does not own the lead of the parent');
select is((select private.owns_lead('00000000-0000-4000-8000-0000000000e2')), true, 'subcloser owns own lead');

select tests.login_as('t-closer-b@example.com');

select results_eq(
  $$select full_name from public.contacts order by full_name$$,
  $$values ('Contacto B')$$,
  'other closer sees only own contacts'
);

select is((select count(*) from public.deals), 1::bigint, 'other closer sees only own deals');
select is((select count(*) from public.activities), 1::bigint, 'other closer sees only own activities');

select tests.login_as('t-freelance@example.com');

select is((select count(*) from public.contacts), 0::bigint, 'freelance sees no contacts');
select throws_ok(
  $$insert into public.contacts (owner_id, full_name) values (private.uid(), 'Freelance')$$,
  '42501',
  null,
  'freelance cannot insert contacts'
);

select tests.login_as('t-client@example.com');

select is((select count(*) from public.contacts) + (select count(*) from public.deals) + (select count(*) from public.activities), 0::bigint, 'client sees no CRM data');

select tests.login_as('t-admin@example.com');

select is((select count(*) from public.contacts), 5::bigint, 'admin sees every contact');
select is((select count(*) from public.deals), 4::bigint, 'admin sees every deal');

select lives_ok(
  $$insert into public.contacts (owner_id, full_name, email) values (null, 'Admin sin dueno', 'admin-n@example.com')$$,
  'admin inserts an ownerless contact'
);

select throws_ok(
  $$insert into public.contacts (owner_id, full_name, email) values (null, 'Duplicado sin dueno', 'n@example.com')$$,
  '23505',
  null,
  'email is unique among ownerless contacts'
);

select throws_ok(
  $$update public.deals set stage = 'won', won_at = now(), won_amount = 100 where id = '00000000-0000-4000-8000-0000000000d3'$$,
  '42501',
  'won_requires_win_deal',
  'not even the admin marks a deal as won from the client'
);

select lives_ok(
  $$update public.contacts set owner_id = tests.user_id('t-closer-b@example.com') where full_name = 'Contacto A'$$,
  'admin reassigns a contact'
);

select lives_ok(
  $$update public.deals set stage = 'proposal' where id = '00000000-0000-4000-8000-0000000000d3'$$,
  'admin moves a deal'
);

select throws_ok($$delete from public.deals$$, '42501', null, 'deals are never deleted');

reset role;

select is(
  (select count(*) from private.audit_log
   where table_name = 'contacts' and action = 'update' and row_id = '00000000-0000-4000-8000-0000000000a1'
     and actor_id = tests.user_id('t-admin@example.com')),
  1::bigint,
  'owner change on a contact is audited with the actor'
);

select is(
  (select count(*) from private.audit_log where table_name = 'deals' and action = 'update'),
  3::bigint,
  'every stage change on deals is audited'
);

select is(
  (select last_activity_at from public.contacts where id = '00000000-0000-4000-8000-0000000000a1'),
  now(),
  'last_activity_at keeps the newest activity and ignores older ones'
);

select lives_ok(
  $$update public.deals set stage = 'won', won_at = now(), won_amount = 500 where id = '00000000-0000-4000-8000-0000000000d3'$$,
  'a privileged function (non client role) can mark a deal as won'
);

select * from finish();

rollback;
