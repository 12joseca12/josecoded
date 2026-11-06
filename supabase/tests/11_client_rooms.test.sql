begin;

\ir support/helpers.sql

select plan(43);

select tests.clean();
select tests.create_user('c-admin@example.com', 'admin', 'Jose');
select tests.create_user('c-closer-a@example.com', 'closer', 'Closer A');
select tests.create_user('c-closer-b@example.com', 'closer', 'Closer B');
select tests.create_user('c-client@example.com', 'client', 'Client');
select tests.create_user('c-client2@example.com', 'client', 'Client Two');
select tests.create_user('c-free@example.com', 'freelance', 'Freelance');

delete from private.jobs;

insert into public.contacts (id, owner_id, full_name, email) values
  ('00000000-0000-4000-8000-0000000000a1', md5('c-closer-a@example.com')::uuid, 'Contact A1', 'a1@example.com');

insert into public.deals (id, contact_id, stage, via, won_at) values
  ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'won', 'project', now());

insert into public.projects (id, name, client_id, deal_id, contact_id, brief, freelance_id) values
  ('00000000-0000-4000-8000-0000000000b1', 'Project One', md5('c-client@example.com')::uuid, '00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-0000000000a1', 'Secret brief', md5('c-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000b2', 'Project Two', null, null, null, null, null);

create temp table ids (k text primary key, v uuid);
grant all on ids to authenticated, service_role;
insert into ids select 'room1', c.id from public.conversations c where c.project_id = '00000000-0000-4000-8000-0000000000b1';
insert into ids select 'room2', c.id from public.conversations c where c.project_id = '00000000-0000-4000-8000-0000000000b2';

select is((select count(*) from public.conversations where kind = 'client'), 2::bigint, 'every project gets a client room');
select is(
  (select array_agg(role::text order by role::text) from public.conversation_members where conversation_id = (select v from ids where k = 'room1') and left_at is null),
  array['client', 'closer', 'owner'],
  'the room holds Jose, the client and the closer who closed the deal'
);
select is(
  (select array_agg(role::text) from public.conversation_members where conversation_id = (select v from ids where k = 'room2') and left_at is null),
  array['owner'],
  'a project without client or deal starts with Jose alone'
);
select is(
  (select count(*) from public.conversation_members m where m.conversation_id = (select v from ids where k = 'room1') and m.user_id = md5('c-free@example.com')::uuid),
  0::bigint,
  'the freelance never joins the client room'
);

select tests.login_as('c-closer-b@example.com');
select is((select count(*) from public.conversations where kind = 'client'), 0::bigint, 'a closer who did not close the deal sees no client room');

reset role;
select tests.login_as('c-closer-a@example.com');
select is((select count(*) from public.conversations where kind = 'client'), 1::bigint, 'the closer who closed it sees the room');

reset role;
select tests.login_as('c-client2@example.com');
select is((select count(*) from public.conversations where kind = 'client'), 0::bigint, 'another client sees no room');

reset role;
update public.projects set client_id = md5('c-client2@example.com')::uuid where id = '00000000-0000-4000-8000-0000000000b2';

select is(
  (select count(*) from public.conversation_members where conversation_id = (select v from ids where k = 'room2') and user_id = md5('c-client2@example.com')::uuid and left_at is null),
  1::bigint,
  'assigning a client lets them into the room'
);
select is(
  (select count(*) from public.messages where conversation_id = (select v from ids where k = 'room2') and system_event = 'member_added' and body = 'Client Two'),
  1::bigint,
  'the arrival is visible as a system message'
);

update public.projects set client_id = md5('c-client@example.com')::uuid where id = '00000000-0000-4000-8000-0000000000b2';

select is(
  (select left_at is not null from public.conversation_members where conversation_id = (select v from ids where k = 'room2') and user_id = md5('c-client2@example.com')::uuid),
  true,
  'replacing the client closes the previous membership'
);
select is(
  (select count(*) from public.messages where conversation_id = (select v from ids where k = 'room2') and system_event = 'member_left' and body = 'Client Two'),
  1::bigint,
  'the departure is visible as a system message'
);

update public.deals set owner_id = md5('c-closer-b@example.com')::uuid where id = '00000000-0000-4000-8000-0000000000d1';

select is(
  (select array_agg(user_id::text order by user_id::text) from public.conversation_members where conversation_id = (select v from ids where k = 'room1') and role = 'closer' and left_at is null),
  array[md5('c-closer-b@example.com')::uuid::text],
  'reassigning the opportunity swaps the closer in the room'
);
select is(
  (select count(*) from public.messages where conversation_id = (select v from ids where k = 'room1') and ((system_event = 'member_left' and body = 'Closer A') or (system_event = 'member_added' and body = 'Closer B'))),
  2::bigint,
  'the swap leaves a departure and an arrival as system messages'
);

reset role;
select tests.login_as('c-closer-a@example.com');
select is((select count(*) from public.conversations where kind = 'client'), 0::bigint, 'the previous closer stops seeing the room');

reset role;
select tests.login_as('c-admin@example.com');
select throws_ok($$select public.ensure_project_conversation(gen_random_uuid())$$, 'P0001', 'project_not_found', 'an unknown project fails');
select is(public.ensure_project_conversation('00000000-0000-4000-8000-0000000000b1'), (select v from ids where k = 'room1'), 'ensure_project_conversation is idempotent');

reset role;
select tests.login_as('c-closer-b@example.com');
select throws_ok($$select public.ensure_project_conversation('00000000-0000-4000-8000-0000000000b1')$$, '42501', 'forbidden', 'only the admin can ensure a project room');

reset role;
select tests.login_as('c-admin@example.com');
select lives_ok($$select public.archive_project('00000000-0000-4000-8000-0000000000b2')$$, 'the admin archives a project');
select is(
  (select status::text from public.conversations where id = (select v from ids where k = 'room2')),
  'archived',
  'archiving the project archives its room'
);
select lives_ok($$select public.archive_project('00000000-0000-4000-8000-0000000000b2', false)$$, 'the admin restores the project');
select is(
  (select status::text from public.conversations where id = (select v from ids where k = 'room2')),
  'open',
  'restoring the project reopens its room'
);

reset role;
select throws_ok(
  $$insert into public.conversations (kind, project_id) values ('client', gen_random_uuid())$$,
  '23503', null, 'a client room needs a real project'
);

reset role;
delete from public.projects where id = '00000000-0000-4000-8000-0000000000b2';
select is((select count(*) from public.conversations where project_id = '00000000-0000-4000-8000-0000000000b2'), 0::bigint, 'deleting a project deletes its room');

insert into auth.users (id, aud, role, email, email_confirmed_at, created_at, updated_at)
values (md5('invited@example.com')::uuid, 'authenticated', 'authenticated', 'invited@example.com', now(), now(), now());

insert into public.projects (id, name) values ('00000000-0000-4000-8000-0000000000b3', 'Project Three');

create temp table tokens (label text primary key, token text);
grant all on tokens to authenticated;

select tests.login_as('c-admin@example.com');
insert into tokens
select 'client', r.token
from public.invite_user('invited@example.com', 'client', null, null, null, null, null, null, '00000000-0000-4000-8000-0000000000b3', null, md5('invited@example.com')::uuid) r;

reset role;
select tests.login_as('invited@example.com');
select is(public.accept_invitation((select token from tokens where label = 'client'), 'Invited Client')::text, 'client', 'the invited client accepts');

reset role;
select is((select client_id from public.projects where id = '00000000-0000-4000-8000-0000000000b3'), md5('invited@example.com')::uuid, 'accepting fixes the client of the project');
select is(
  (select count(*) from public.conversation_members m join public.conversations c on c.id = m.conversation_id where c.project_id = '00000000-0000-4000-8000-0000000000b3' and m.user_id = md5('invited@example.com')::uuid and m.left_at is null),
  1::bigint,
  'and puts them in the room'
);

select tests.login_as('invited@example.com');
select is((select count(*) from public.conversations where kind = 'client'), 1::bigint, 'the new client sees only their room');

reset role;
select tests.login_as('c-client@example.com');
select throws_ok($$select public.omen_conversation_context(gen_random_uuid())$$, '42501', null, 'authenticated cannot read the Omen context');
select throws_ok($$select public.omen_post_reply(gen_random_uuid(), 'x', '{}', 'local:test')$$, '42501', null, 'authenticated cannot post as Nexo');

reset role;
create temp table jobs (k text primary key, v uuid);
grant all on jobs to service_role;

insert into public.messages (conversation_id, author_kind, author_id, body, created_at)
values ((select v from ids where k = 'room1'), 'human', md5('c-client@example.com')::uuid, 'Hello Nexo', now() - interval '1 minute');

with m as (select id from public.messages where body = 'Hello Nexo'),
j as (
  insert into private.jobs (kind, payload, status, run_after, locked_by, locked_at)
  select 'chat.reply',
    jsonb_build_object('conversation_id', (select v from ids where k = 'room1'), 'message_id', m.id, 'kind', 'client', 'locale', 'es', 'page_path', null, 'project_id', '00000000-0000-4000-8000-0000000000b1', 'mention', true, 'delayed', false),
    'running', now(), 'omen', now()
  from m
  returning id
)
insert into jobs select 'first', id from j;

select tests.login_service();
select is(
  (public.omen_conversation_context((select v from jobs where k = 'first')) -> 'conversation' ->> 'consent_state'),
  'pending',
  'without consent the context says so'
);
select is(
  public.omen_conversation_context((select v from jobs where k = 'first')) ? 'project',
  false,
  'without consent the context carries no project'
);
select is(
  jsonb_array_length(public.omen_conversation_context((select v from jobs where k = 'first')) -> 'messages'),
  0,
  'and no messages'
);
select is(
  public.omen_post_reply((select v from jobs where k = 'first'), 'Hi', '{}', 'local:test', null, 0.8),
  null::uuid,
  'Nexo cannot reply in a room without consent'
);
reset role;
select is(
  (select result ->> 'skipped' from private.jobs where id = (select v from jobs where k = 'first')),
  'ai_inactive',
  'the job is closed with the skip reason'
);

reset role;
update public.conversations set ai_consent_at = now(), ai_consent_by = md5('c-client@example.com')::uuid where id = (select v from ids where k = 'room1');

with m as (select id from public.messages where body = 'Hello Nexo'),
j as (
  insert into private.jobs (kind, payload, status, run_after, locked_by, locked_at)
  select 'chat.reply',
    jsonb_build_object('conversation_id', (select v from ids where k = 'room1'), 'message_id', m.id, 'kind', 'client', 'locale', 'es', 'page_path', null, 'project_id', '00000000-0000-4000-8000-0000000000b1', 'mention', true, 'delayed', true),
    'running', now(), 'omen', now()
  from m
  returning id
)
insert into jobs select 'second', id from j;

select tests.login_service();
select is(
  public.omen_conversation_context((select v from jobs where k = 'second')) -> 'project' ->> 'brief',
  'Secret brief',
  'with consent the project brief is shared'
);
select is(
  public.omen_conversation_context((select v from jobs where k = 'second')) -> 'messages' -> 0 ->> 'role',
  'client',
  'messages carry the author role'
);
select is(
  (select jsonb_array_length(public.omen_conversation_context((select v from jobs where k = 'second')) -> 'members')),
  3,
  'the context lists the members with their roles'
);

select isnt(
  public.omen_post_reply((select v from jobs where k = 'second'), 'Hola, soy Nexo', array['faq:1'], 'groq:test', null, 0.9),
  null::uuid,
  'Nexo replies once consent is granted'
);
reset role;
select is(
  (select row(author_kind::text, auto, model)::text from public.messages where body = 'Hola, soy Nexo'),
  '(nexo,t,groq:test)',
  'the reply is a Nexo message flagged auto when it was delayed'
);
select is((select status::text from private.jobs where id = (select v from jobs where k = 'second')), 'done', 'the job is done');

select tests.login_service();
select throws_ok(
  $$select public.omen_post_reply((select v from jobs where k = 'second'), 'again', '{}', 'groq:test')$$,
  'P0001', 'job_not_running', 'a finished job cannot reply again'
);

reset role;
insert into public.messages (conversation_id, author_kind, author_id, body, created_at)
values
  ((select v from ids where k = 'room1'), 'human', md5('c-client@example.com')::uuid, 'Second question', now() - interval '3 minutes');

with m as (select id from public.messages where body = 'Second question'),
j as (
  insert into private.jobs (kind, payload, status, run_after, locked_by, locked_at)
  select 'chat.reply',
    jsonb_build_object('conversation_id', (select v from ids where k = 'room1'), 'message_id', m.id, 'kind', 'client', 'locale', 'es', 'page_path', null, 'project_id', '00000000-0000-4000-8000-0000000000b1', 'mention', true, 'delayed', false),
    'running', now(), 'omen', now()
  from m
  returning id
)
insert into jobs select 'third', id from j;

select is(
  (select public.omen_post_reply((select v from jobs where k = 'third'), 'late answer', '{}', 'groq:test')),
  null::uuid,
  'a reply is skipped when a human wrote after the question'
) from (select tests.login_service()) s;
reset role;
select is((select result ->> 'skipped' from private.jobs where id = (select v from jobs where k = 'third')), 'human_replied', 'the skip reason is human_replied');

select * from finish();

rollback;
