begin;

\ir support/helpers.sql

select plan(46);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Jose');
select tests.create_user('t-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-client@example.com', 'client', 'Client');

delete from private.jobs;
delete from private.heartbeat;
delete from private.chat_quota;
update public.site_settings set value = 'true'::jsonb where key = 'public_chat';

reset role;
select tests.login_service();

select lives_ok(
  $$select * from public.visitor_send(repeat('a', 64), 'Hola, necesito una web', '/es/servicios', 'es', repeat('1', 32))$$,
  'service_role sends the first visitor message'
);

reset role;

select is(
  (select count(*) from public.visitors where token_hash = repeat('a', 64)),
  1::bigint,
  'the first send creates the visitor'
);

select is(
  (select c.kind::text || '/' || coalesce(c.first_page_path, '') from public.conversations c join public.visitors v on v.id = c.visitor_id where v.token_hash = repeat('a', 64)),
  'visitor//es/servicios',
  'the first send creates a visitor room with the first page path'
);

select is(
  (select count(*) from public.conversation_members where role = 'owner'),
  1::bigint,
  'Jose is added to the visitor room'
);

select is(
  (select count(*) from private.jobs where kind = 'chat.reply' and status = 'queued'),
  1::bigint,
  'the visitor message queues a reply for Nexo'
);

reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('a', 64), 'Otro enseguida', null, 'es', repeat('1', 32))$$,
  'P0001',
  'chat_quota_exceeded',
  'two messages less than 3 seconds apart hit the burst limit'
);

reset role;
update public.visitors set last_activity_at = now() - interval '10 seconds';
reset role;
select tests.login_service();

select lives_ok(
  $$select * from public.visitor_send(repeat('a', 64), 'Segundo mensaje', null, 'es', repeat('1', 32))$$,
  'a later message goes through'
);

reset role;

select is(
  (select count(*) from public.conversations where kind = 'visitor'),
  1::bigint,
  'the second send reuses the room'
);

reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('a', 64), '   ', null, 'es', repeat('1', 32))$$,
  'P0001',
  'empty_body',
  'a blank body is rejected'
);

select throws_ok(
  $$select * from public.visitor_send(repeat('a', 64), repeat('x', 2001), null, 'es', repeat('1', 32))$$,
  'P0001',
  'body_too_long',
  'a body over 2000 characters is rejected'
);

select throws_ok(
  $$select * from public.visitor_send('short', 'Hola', null, 'es', repeat('1', 32))$$,
  'P0001',
  'invalid_token',
  'a short token hash is rejected'
);

reset role;
update public.site_settings set value = 'false'::jsonb where key = 'public_chat';
reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('b', 64), 'Hola', null, 'es', repeat('2', 32))$$,
  'P0001',
  'public_chat_off',
  'public_chat off blocks new messages'
);

reset role;
update public.site_settings set value = 'true'::jsonb where key = 'public_chat';
delete from private.chat_quota;
reset role;
select tests.login_service();

do $$
declare
  i integer;
begin
  for i in 1..20 loop
    update public.visitors set last_activity_at = now() - interval '10 seconds' where token_hash = repeat('a', 64);
    perform * from public.visitor_send(repeat('a', 64), 'Mensaje ' || i, null, 'es', repeat('3', 32));
  end loop;
end;
$$;

reset role;
update public.visitors set last_activity_at = now() - interval '10 seconds';
reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('a', 64), 'Mensaje 21', null, 'es', repeat('3', 32))$$,
  'P0001',
  'chat_quota_exceeded',
  'the 21st message of a visitor in a day hits the visitor quota'
);

reset role;
delete from private.chat_quota where scope = 'visitor';
insert into private.chat_quota (scope, key_hash, day, count)
values ('ip', repeat('4', 32), (now() at time zone 'utc')::date, 60);
reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('c', 64), 'Hola desde otra IP saturada', null, 'es', repeat('4', 32))$$,
  'P0001',
  'chat_quota_exceeded',
  'the 61st message of an IP in a day hits the IP quota'
);

reset role;

select is(
  (select count(*) from public.visitors where token_hash = repeat('c', 64)),
  0::bigint,
  'a rejected message leaves no visitor behind'
);

reset role;
select tests.login_as('t-a@example.com');

select throws_ok(
  $$select * from public.visitor_send(repeat('d', 64), 'Hola', null, 'es', repeat('5', 32))$$,
  '42501',
  null,
  'authenticated cannot run visitor_send'
);

select throws_ok(
  $$select public.visitor_thread(repeat('a', 64))$$,
  '42501',
  null,
  'authenticated cannot run visitor_thread'
);

select throws_ok(
  $$select public.visitor_forget(repeat('a', 64))$$,
  '42501',
  null,
  'authenticated cannot run visitor_forget'
);

reset role;
select tests.logout();

select throws_ok(
  $$select * from public.visitor_send(repeat('d', 64), 'Hola', null, 'es', repeat('5', 32))$$,
  '42501',
  null,
  'anon cannot run visitor_send'
);

reset role;
select tests.login_service();

select is(
  (public.visitor_thread(repeat('a', 64)) ->> 'nexo_online')::boolean,
  false,
  'visitor_thread reports Nexo offline without a heartbeat'
);

select ok(
  (public.visitor_thread(repeat('a', 64)) ->> 'pending_reply')::boolean,
  'visitor_thread reports a pending reply while the job is queued'
);

select is(
  jsonb_array_length(public.visitor_thread(repeat('a', 64)) -> 'messages'),
  22,
  'visitor_thread returns the messages of the room'
);

select is(
  jsonb_array_length(public.visitor_thread(repeat('a', 64), now() + interval '1 hour') -> 'messages'),
  0,
  'visitor_thread with a future cursor returns nothing'
);

select is(
  public.visitor_thread(repeat('z', 64)) -> 'messages',
  '[]'::jsonb,
  'visitor_thread for an unknown token returns an empty list'
);

reset role;
insert into private.heartbeat (service, seen_at) values ('omen', now());
reset role;
select tests.login_service();

select ok(
  (public.visitor_thread(repeat('a', 64)) ->> 'nexo_online')::boolean,
  'visitor_thread reports Nexo online with a fresh heartbeat'
);

select throws_ok(
  $$select public.visitor_handoff(repeat('a', 64), 'ada@example.com', null, 'Ada', false)$$,
  'P0001',
  'consent_required',
  'handoff without consent fails'
);

select throws_ok(
  $$select public.visitor_handoff(repeat('a', 64), null, '  ', 'Ada', true)$$,
  'P0001',
  'contact_required',
  'handoff without email or phone fails'
);

select throws_ok(
  $$select public.visitor_handoff(repeat('y', 64), 'ada@example.com', null, 'Ada', true)$$,
  'P0001',
  'chat_not_found',
  'handoff for an unknown visitor fails'
);

create temp table handoff_result as
select public.visitor_handoff(repeat('a', 64), 'ada@example.com', null, 'Ada', true) as lead_id;
grant select on handoff_result to service_role, authenticated;

reset role;

select is(
  (select l.source::text || '/' || (l.consent_at is not null)::text || '/' || (l.conversation_id is not null)::text from public.leads l where l.id = (select lead_id from handoff_result)),
  'nexo/true/true',
  'handoff creates a nexo lead with consent and its conversation'
);

select is(
  (select (v.lead_id = (select lead_id from handoff_result))::text || '/' || (v.consent_at is not null)::text from public.visitors v where v.token_hash = repeat('a', 64)),
  'true/true',
  'handoff fills lead_id and consent_at on the visitor'
);

select is(
  (select count(*) from public.conversations where lead_id = (select lead_id from handoff_result)),
  1::bigint,
  'handoff fills lead_id on the conversation'
);

select is(
  (select count(*) from public.messages where system_event = 'handoff_done'),
  1::bigint,
  'handoff leaves a handoff_done system message'
);

reset role;
select tests.login_service();

select is(
  public.visitor_handoff(repeat('a', 64), 'otro@example.com', null, null, true),
  (select lead_id from handoff_result),
  'a second handoff returns the same lead'
);

select ok(
  (public.visitor_thread(repeat('a', 64)) ->> 'handoff_done')::boolean,
  'visitor_thread reports the handoff as done'
);

reset role;
select tests.login_as('t-a@example.com');

select is(
  (select public.claim_lead((select lead_id from handoff_result))::text is not null),
  true,
  'a closer claims the handoff lead'
);

reset role;

select ok(
  (select a.body like '%Conversación:%Visitante: Hola, necesito una web%' and a.kind = 'chat' from public.activities a order by a.created_at desc limit 1),
  'the claim leaves a chat activity with the thread extract'
);

select ok(
  (select c.contact_id is not null from public.conversations c where c.lead_id = (select lead_id from handoff_result)),
  'the claim links the contact to the room'
);

update public.conversations set status = 'archived', archived_at = now() where kind = 'visitor';
reset role;
select tests.login_service();

select throws_ok(
  $$select * from public.visitor_send(repeat('a', 64), 'Sigo aqui', null, 'es', repeat('6', 32))$$,
  'P0001',
  'chat_closed',
  'a visitor whose room is archived gets chat_closed'
);

select is(
  public.visitor_forget(repeat('a', 64)),
  1,
  'visitor_forget deletes the visitor'
);

reset role;

select is(
  (select count(*) from public.conversations where kind = 'visitor'),
  0::bigint,
  'visitor_forget cascades to the room'
);

select ok(
  (select conversation_id is null from public.leads where id = (select lead_id from handoff_result)),
  'the lead survives with no conversation'
);

delete from private.chat_quota;
delete from public.conversations;
delete from public.visitors;

insert into public.contacts (id, owner_id, full_name, email)
values ('f4000000-0000-4000-8000-000000000001', md5('t-a@example.com')::uuid, 'Con trato', 'trato@example.com');
insert into public.deals (id, contact_id, stage, via, won_at, won_amount)
values ('f5000000-0000-4000-8000-000000000001', 'f4000000-0000-4000-8000-000000000001', 'won', 'project', now(), 1000);
insert into public.leads (id, source, full_name, email, consent_at, status)
values
  ('f6000000-0000-4000-8000-000000000001', 'nexo', 'Lead sesenta', 'l60@example.com', now(), 'new'),
  ('f6000000-0000-4000-8000-000000000002', 'nexo', 'Lead ganado', 'l61@example.com', now(), 'new'),
  ('f6000000-0000-4000-8000-000000000003', 'nexo', 'Lead ocho', 'l8@example.com', now(), 'new');

insert into public.visitors (id, token_hash, last_activity_at, lead_id)
values
  ('f2000000-0000-4000-8000-000000000001', repeat('1', 64), now() - interval '8 days', null),
  ('f2000000-0000-4000-8000-000000000002', repeat('2', 64), now() - interval '8 days', 'f6000000-0000-4000-8000-000000000003'),
  ('f2000000-0000-4000-8000-000000000003', repeat('3', 64), now() - interval '61 days', 'f6000000-0000-4000-8000-000000000001'),
  ('f2000000-0000-4000-8000-000000000004', repeat('4', 64), now() - interval '61 days', 'f6000000-0000-4000-8000-000000000002'),
  ('f2000000-0000-4000-8000-000000000005', repeat('5', 64), now() - interval '91 days', 'f6000000-0000-4000-8000-000000000002'),
  ('f2000000-0000-4000-8000-000000000006', repeat('6', 64), now() - interval '9 days', null),
  ('f2000000-0000-4000-8000-000000000007', repeat('7', 64), now() - interval '1 day', null);

insert into public.conversations (id, kind, visitor_id, lead_id, contact_id, last_activity_at)
values
  ('f0000000-0000-4000-8000-000000000001', 'visitor', 'f2000000-0000-4000-8000-000000000001', null, null, now() - interval '8 days'),
  ('f0000000-0000-4000-8000-000000000002', 'visitor', 'f2000000-0000-4000-8000-000000000002', 'f6000000-0000-4000-8000-000000000003', null, now() - interval '8 days'),
  ('f0000000-0000-4000-8000-000000000003', 'visitor', 'f2000000-0000-4000-8000-000000000003', 'f6000000-0000-4000-8000-000000000001', null, now() - interval '61 days'),
  ('f0000000-0000-4000-8000-000000000004', 'visitor', 'f2000000-0000-4000-8000-000000000004', 'f6000000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', now() - interval '61 days'),
  ('f0000000-0000-4000-8000-000000000005', 'visitor', 'f2000000-0000-4000-8000-000000000005', 'f6000000-0000-4000-8000-000000000002', 'f4000000-0000-4000-8000-000000000001', now() - interval '91 days');

update public.leads set conversation_id = 'f0000000-0000-4000-8000-000000000003' where id = 'f6000000-0000-4000-8000-000000000001';

insert into public.conversations (id, kind, subject_user_id, status, archived_at)
values ('f0000000-0000-4000-8000-000000000006', 'closer', md5('t-a@example.com')::uuid, 'archived', now() - interval '91 days');

insert into public.conversations (id, kind, subject_user_id, last_activity_at)
values ('f0000000-0000-4000-8000-000000000007', 'freelance', md5('t-client@example.com')::uuid, now() - interval '400 days');

insert into private.chat_quota (scope, key_hash, day, count)
values
  ('ip', repeat('9', 32), (now() at time zone 'utc')::date - 3, 5),
  ('ip', repeat('8', 32), (now() at time zone 'utc')::date, 5);

select private.purge_conversations();

select is(
  (select string_agg(right(id::text, 1), ',' order by id) from public.conversations),
  '2,4,7',
  'purge keeps 8d with lead, 61d won contact and the open room; drops the rest'
);

select is(
  (select string_agg(right(id::text, 1), ',' order by id) from public.visitors),
  '2,4,7',
  'purge drops orphan visitors older than 7 days'
);

select is(
  (select conversation_id is null from public.leads where id = 'f6000000-0000-4000-8000-000000000001'),
  true,
  'purge leaves the lead with a null conversation'
);

select is(
  (select count(*) from private.chat_quota),
  1::bigint,
  'purge drops quota rows older than two days'
);

select case
  when exists (select 1 from pg_extension where extname = 'pg_cron') then ok(
    (xpath('/row/c/text()', query_to_xml('select count(*) as c from cron.job where jobname = ''purge-conversations''', false, true, '')))[1]::text = '1',
    'purge-conversations is scheduled'
  )
  else skip('pg_cron is not available in the local cluster', 1)
end;

select * from finish();

rollback;
