begin;

\ir support/helpers.sql

select plan(50);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Jose');
select tests.create_user('t-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');
select tests.create_user('t-client2@example.com', 'client', 'Client Two');
select tests.create_user('t-free@example.com', 'freelance', 'Freelance');

delete from private.jobs;

insert into public.visitors (id, token_hash)
values ('f2000000-0000-4000-8000-000000000001', repeat('a', 64));

insert into public.conversations (id, kind, subject_user_id)
values
  ('f0000000-0000-4000-8000-00000000000a', 'closer', md5('t-a@example.com')::uuid),
  ('f0000000-0000-4000-8000-00000000000b', 'closer', md5('t-b@example.com')::uuid);

insert into public.conversations (id, kind, visitor_id, first_page_path)
values ('f0000000-0000-4000-8000-0000000000e1', 'visitor', 'f2000000-0000-4000-8000-000000000001', '/es');

alter table public.projects disable trigger projects_room_after_insert;
insert into public.projects (id, name) values ('f3000000-0000-4000-8000-000000000001', 'Room project');
alter table public.projects enable trigger projects_room_after_insert;

insert into public.conversations (id, kind, project_id)
values ('f0000000-0000-4000-8000-0000000000c1', 'client', 'f3000000-0000-4000-8000-000000000001');

insert into public.conversation_members (conversation_id, user_id, role)
values
  ('f0000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'closer'),
  ('f0000000-0000-4000-8000-00000000000b', md5('t-b@example.com')::uuid, 'closer'),
  ('f0000000-0000-4000-8000-0000000000c1', md5('t-client@example.com')::uuid, 'client');

select is(
  (select count(*) from public.conversation_members where role = 'owner' and user_id = md5('t-admin@example.com')::uuid),
  4::bigint,
  'Jose is owner of every conversation kind at creation'
);

select throws_ok(
  $$insert into public.conversations (kind) values ('closer')$$,
  '23514',
  null,
  'a closer room without a subject user fails'
);

select throws_ok(
  $$insert into public.conversations (kind, subject_user_id) values ('closer', md5('t-a@example.com')::uuid)$$,
  '23505',
  null,
  'two closer rooms for the same user fail'
);

select throws_ok(
  $$insert into public.conversations (kind, visitor_id) values ('visitor', 'f2000000-0000-4000-8000-000000000001')$$,
  '23505',
  null,
  'a second open visitor room for the same visitor fails'
);

select throws_ok(
  $$insert into public.conversations (kind, subject_user_id, project_id) values ('freelance', md5('t-free@example.com')::uuid, gen_random_uuid())$$,
  '23514',
  null,
  'a freelance room cannot carry a project'
);

select throws_ok(
  $$insert into public.conversations (kind, subject_user_id, ai_consent_at) values ('freelance', md5('t-free@example.com')::uuid, now())$$,
  '23514',
  null,
  'consent columns are only for client rooms'
);

reset role;
select tests.login_as('t-a@example.com');

select is(
  (select count(*) from public.conversations),
  1::bigint,
  'closer A sees only their own room'
);

select is(
  (select count(*) from public.conversation_members),
  2::bigint,
  'closer A sees the members of their room'
);

select is(
  (select count(*) from public.messages where conversation_id = 'f0000000-0000-4000-8000-00000000000b'),
  0::bigint,
  'closer A reads no messages of a room they are not in'
);

select is(
  (select count(*) from public.visitors),
  0::bigint,
  'closer A cannot read visitors'
);

select lives_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Hola Jose')$$,
  'closer A writes in their room with aal2'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000b', 'human', md5('t-a@example.com')::uuid, 'Intruso')$$,
  '42501',
  null,
  'closer A cannot write in the room of closer B'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-b@example.com')::uuid, 'Suplanto')$$,
  '42501',
  null,
  'closer A cannot write as someone else'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'nexo', 'Soy Nexo')$$,
  '42501',
  null,
  'closer A cannot write as Nexo'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body, auto)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'x', true)$$,
  '42501',
  null,
  'closer A cannot set the auto column'
);

select throws_ok(
  $$update public.messages set body = 'editado'$$,
  '42501',
  null,
  'nobody edits messages'
);

select throws_ok(
  $$delete from public.messages$$,
  '42501',
  null,
  'nobody deletes messages'
);

reset role;
select tests.login_aal1('t-a@example.com');

select is(
  (select count(*) from public.conversations),
  0::bigint,
  'closer A with aal1 sees no rooms'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'sin aal2')$$,
  '42501',
  null,
  'closer A with aal1 cannot write'
);

reset role;
select tests.login_as('t-client@example.com');

select lives_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-client@example.com')::uuid, 'Hola')$$,
  'the client writes in their room'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-client@example.com')::uuid, 'Hola')$$,
  '42501',
  null,
  'the client cannot write in another room'
);

reset role;
select tests.login_as('t-client2@example.com');

select is(
  (select count(*) from public.messages),
  0::bigint,
  'another client reads no messages'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.conversations),
  4::bigint,
  'Jose sees every room'
);

select is(
  (select count(*) from public.visitors),
  1::bigint,
  'Jose reads visitors'
);

select throws_ok(
  $$delete from public.messages$$,
  '42501',
  null,
  'Jose cannot delete messages either'
);

select throws_ok(
  $$insert into public.conversations (kind, subject_user_id) values ('freelance', md5('t-free@example.com')::uuid)$$,
  '42501',
  null,
  'Jose cannot create rooms straight from the API'
);

reset role;

update public.conversation_members
set left_at = now()
where conversation_id = 'f0000000-0000-4000-8000-00000000000b'
  and user_id = md5('t-b@example.com')::uuid;

reset role;
select tests.login_as('t-b@example.com');

select is(
  (select count(*) from public.messages where conversation_id = 'f0000000-0000-4000-8000-00000000000b'),
  0::bigint,
  'a member with left_at reads nothing'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000b', 'human', md5('t-b@example.com')::uuid, 'sigo aqui')$$,
  '42501',
  null,
  'a member with left_at cannot write'
);

reset role;

update public.conversation_members
set can_write = false
where conversation_id = 'f0000000-0000-4000-8000-00000000000a'
  and user_id = md5('t-a@example.com')::uuid;

reset role;
select tests.login_as('t-a@example.com');

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'solo lectura')$$,
  '42501',
  null,
  'a member without can_write cannot write'
);

reset role;

update public.conversation_members set can_write = true
where conversation_id = 'f0000000-0000-4000-8000-00000000000a';

update public.conversations set status = 'archived', archived_at = now()
where id = 'f0000000-0000-4000-8000-00000000000a';

reset role;
select tests.login_as('t-a@example.com');

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'sala cerrada')$$,
  '42501',
  null,
  'nobody writes in an archived room'
);

reset role;

update public.conversations set status = 'open', archived_at = null
where id = 'f0000000-0000-4000-8000-00000000000a';

delete from private.jobs;

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'system', 'sin evento')$$,
  '23514',
  null,
  'a system message needs a system_event'
);

select throws_ok(
  $$insert into public.messages (conversation_id, author_kind, author_id, body)
    values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, '   ')$$,
  '23514',
  null,
  'a human message cannot be blank'
);

insert into public.messages (id, conversation_id, author_kind, author_id, body)
values ('f1000000-0000-4000-8000-000000000001', 'f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Hola @Nexo, ayuda');

select ok(
  (select mentions_nexo from public.messages where id = 'f1000000-0000-4000-8000-000000000001'),
  '@Nexo sets mentions_nexo'
);

select ok(
  (select last_activity_at >= now() - interval '1 minute' from public.conversations where id = 'f0000000-0000-4000-8000-00000000000a'),
  'a message refreshes last_activity_at'
);

select is(
  (select count(*) from private.jobs where kind = 'chat.reply' and payload ->> 'conversation_id' = 'f0000000-0000-4000-8000-00000000000a' and run_after <= now() + interval '1 minute'),
  1::bigint,
  'a mention in a private room queues chat.reply right away'
);

select ok(
  (select (payload ->> 'delayed')::boolean = false and (payload ->> 'mention')::boolean from private.jobs where kind = 'chat.reply' limit 1),
  'the payload marks mention and no delay'
);

delete from private.jobs;

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Sin mencion');

select ok(
  (select run_after between now() + interval '9 minutes' and now() + interval '11 minutes' from private.jobs where kind = 'chat.reply' and status = 'queued'),
  'a message without a mention queues chat.reply about 10 minutes ahead'
);

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-admin@example.com')::uuid, 'Contesto yo');

select is(
  (select count(*) filter (where status = 'cancelled') || '/' || count(*) filter (where status = 'queued') from private.jobs where kind = 'chat.reply'),
  '1/0',
  'a later human message cancels the queued reply'
);

delete from private.jobs;

reset role;
select tests.login_as('t-admin@example.com');
select public.set_setting('nexo.reply_delay_min', '3'::jsonb);
reset role;

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Con otro retardo');

select ok(
  (select run_after between now() + interval '2 minutes' and now() + interval '4 minutes' from private.jobs where kind = 'chat.reply' and status = 'queued'),
  'set_setting nexo.reply_delay_min changes the delay'
);

delete from private.jobs;

update public.conversations set ai_enabled = false where id = 'f0000000-0000-4000-8000-00000000000a';

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Nexo apagado @Nexo');

select is((select count(*) from private.jobs), 0::bigint, 'with ai_enabled false nothing is queued');

update public.conversations set ai_enabled = true where id = 'f0000000-0000-4000-8000-00000000000a';

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-client@example.com')::uuid, 'Sin consentimiento @Nexo');

select is((select count(*) from private.jobs), 0::bigint, 'a client room without consent never queues, even with a mention');

update public.conversations set ai_consent_at = now() where id = 'f0000000-0000-4000-8000-0000000000c1';

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-client@example.com')::uuid, 'Con consentimiento @Nexo');

select is(
  (select payload ->> 'project_id' from private.jobs where kind = 'chat.reply'),
  'f3000000-0000-4000-8000-000000000001',
  'a client room with consent queues with its project id'
);

delete from private.jobs;

insert into public.messages (id, conversation_id, author_kind, body, page_path)
values ('f1000000-0000-4000-8000-000000000009', 'f0000000-0000-4000-8000-0000000000e1', 'human', 'Hola desde la web', '/es/servicios');

select ok(
  (select run_after <= now() and payload ->> 'page_path' = '/es/servicios' and payload ->> 'kind' = 'visitor' from private.jobs where kind = 'chat.reply'),
  'a visitor message queues chat.reply for now with the page path'
);

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', md5('t-admin@example.com')::uuid, 'Soy Jose');

select is(
  (select ai_enabled::text || '/' || coalesce(ai_off_reason, '') from public.conversations where id = 'f0000000-0000-4000-8000-0000000000e1'),
  'false/takeover',
  'Jose writing in a visitor room switches Nexo off for takeover'
);

select is(
  (select count(*) from public.messages where conversation_id = 'f0000000-0000-4000-8000-0000000000e1' and system_event = 'ai_off'),
  1::bigint,
  'the takeover leaves one ai_off system message'
);

select is(
  (select status::text from private.jobs where kind = 'chat.reply'),
  'cancelled',
  'the takeover cancels the pending reply'
);

select is(
  (select count(*) from pg_publication_tables where pubname = 'supabase_realtime' and tablename in ('messages', 'conversation_members')),
  2::bigint,
  'messages and conversation_members are in the realtime publication'
);

select ok(
  (select payload ?& array['conversation_id', 'message_id', 'kind', 'locale', 'page_path', 'project_id', 'mention', 'delayed'] from (select payload from private.jobs where kind = 'chat.reply' limit 1) j),
  'the job payload carries every key of contracts/jobs/chat.reply.json'
);

insert into realtime.messages (topic) values ('conversation:f0000000-0000-4000-8000-00000000000a');

reset role;
select tests.login_as('t-a@example.com');
select set_config('realtime.topic', 'conversation:f0000000-0000-4000-8000-00000000000a', true);

select is(
  (select count(*) from realtime.messages),
  1::bigint,
  'a member can use the broadcast channel of their conversation'
);

select set_config('realtime.topic', 'conversation:f0000000-0000-4000-8000-00000000000b', true);

select is(
  (select count(*) from realtime.messages),
  0::bigint,
  'a non-member gets nothing from another conversation channel'
);

select * from finish();

rollback;
