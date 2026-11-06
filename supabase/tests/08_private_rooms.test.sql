begin;

\ir support/helpers.sql

select plan(51);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Jose');
select tests.create_user('t-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-sub@example.com', 'closer', 'Sub A', 't-a@example.com');
select tests.create_user('t-client@example.com', 'client', 'Client');
select tests.create_user('t-client2@example.com', 'client', 'Client Two');
select tests.create_user('t-free@example.com', 'freelance', 'Freelance');

delete from private.jobs;

create temp table rooms (label text primary key, id uuid);
grant all on rooms to authenticated;

select tests.login_as('t-a@example.com');

insert into rooms select 'a', public.ensure_my_conversation();

select is(
  (select c.kind::text || '/' || (c.subject_user_id = md5('t-a@example.com')::uuid)::text from public.conversations c where c.id = (select id from rooms where label = 'a')),
  'closer/true',
  'ensure_my_conversation creates the closer room'
);

select is(
  public.ensure_my_conversation(),
  (select id from rooms where label = 'a'),
  'ensure_my_conversation is idempotent'
);

select is(
  (select string_agg(m.role::text, ',' order by m.role) from public.conversation_members m where m.conversation_id = (select id from rooms where label = 'a')),
  'owner,closer',
  'the room has Jose as owner and the closer as member'
);

reset role;
select tests.login_aal1('t-b@example.com');

select throws_ok($$select public.ensure_my_conversation()$$, '42501', null, 'a closer at aal1 cannot ensure a room');

reset role;
select tests.login_as('t-client@example.com');

select throws_ok($$select public.ensure_my_conversation()$$, '42501', null, 'a client cannot ensure a room');

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok($$select public.ensure_my_conversation()$$, '42501', null, 'the admin has no room of their own');

reset role;
select tests.login_as('t-free@example.com');

insert into rooms select 'free', public.ensure_my_conversation();

select is(
  (select c.kind::text from public.conversations c where c.id = (select id from rooms where label = 'free')),
  'freelance',
  'a freelance gets a freelance room'
);

reset role;
select tests.login_as('t-a@example.com');

select is(
  (select count(*) from public.my_conversations),
  1::bigint,
  'closer A lists only their room'
);

reset role;

insert into public.messages (conversation_id, author_kind, author_id, body, created_at)
values
  ((select id from rooms where label = 'a'), 'human', md5('t-admin@example.com')::uuid, 'Escribeme a ana@example.com o llama al 600 123 456', now() - interval '1 minute'),
  ((select id from rooms where label = 'a'), 'human', md5('t-admin@example.com')::uuid, 'Mira https://example.com/privado y dime', now());

select tests.login_as('t-a@example.com');

select is(
  (select unread_count from public.my_conversations),
  2,
  'two messages from Jose are unread for the closer'
);

select is(
  (select last_message_excerpt from public.my_conversations),
  'Mira […] y dime',
  'the excerpt hides links'
);

select lives_ok(
  format($$select public.mark_read(%L)$$, (select id from rooms where label = 'a')),
  'a member marks the room as read'
);

select is((select unread_count from public.my_conversations), 0, 'unread drops to zero after mark_read');

insert into public.messages (conversation_id, author_kind, author_id, body)
values ((select id from rooms where label = 'a'), 'human', md5('t-a@example.com')::uuid, 'Mi propio mensaje');

select is((select unread_count from public.my_conversations), 0, 'own messages are not unread');

reset role;

insert into public.messages (conversation_id, author_kind, author_id, body, created_at)
values ((select id from rooms where label = 'a'), 'human', md5('t-admin@example.com')::uuid, 'Otro de Jose', clock_timestamp());

select tests.login_as('t-a@example.com');

select is((select unread_count from public.my_conversations), 1, 'a new message from Jose is unread again');

select throws_ok(
  format($$select public.mark_read(%L)$$, gen_random_uuid()),
  '42501',
  null,
  'mark_read on a room the user is not in fails'
);

reset role;
select tests.login_as('t-b@example.com');

select is((select count(*) from public.my_conversations), 0::bigint, 'closer B sees no rooms');

select throws_ok(
  format($$select public.mark_read(%L)$$, (select id from rooms where label = 'a')),
  '42501',
  null,
  'closer B cannot mark the room of closer A'
);

reset role;
select tests.login_as('t-admin@example.com');

select is(
  (select count(*) from public.my_conversations),
  2::bigint,
  'Jose lists every room'
);

select is(
  (select counterpart_name from public.my_conversations where id = (select id from rooms where label = 'a')),
  'Closer A',
  'Jose sees the closer name as counterpart'
);

select is(
  (select unread_count from public.my_conversations where id = (select id from rooms where label = 'a')),
  1,
  'the unread count of Jose is independent'
);

select lives_ok(
  format($$select public.set_conversation_ai(%L, false)$$, (select id from rooms where label = 'a')),
  'Jose switches Nexo off in a room'
);

select is(
  (select m.system_event::text from public.messages m where m.conversation_id = (select id from rooms where label = 'a') and m.author_kind = 'system' order by m.created_at desc, m.id desc limit 1),
  'ai_off',
  'switching Nexo off leaves an ai_off system message'
);

select is(
  (select ai_off_reason from public.conversations where id = (select id from rooms where label = 'a')),
  'admin',
  'the reason is admin'
);

select lives_ok(
  format($$select public.set_conversation_ai(%L, true)$$, (select id from rooms where label = 'a')),
  'Jose switches Nexo on again'
);

select is(
  (select ai_off_reason from public.conversations where id = (select id from rooms where label = 'a')),
  null,
  'switching on clears the reason'
);

reset role;
select tests.login_as('t-a@example.com');

select throws_ok(
  format($$select public.set_conversation_ai(%L, false)$$, (select id from rooms where label = 'a')),
  '42501',
  'admin_only',
  'a closer cannot switch Nexo'
);

select throws_ok(
  format($$select public.add_member(%L, %L, 'closer', true)$$, (select id from rooms where label = 'a'), md5('t-b@example.com')::uuid),
  '42501',
  'admin_only',
  'a closer cannot add members'
);

reset role;

alter table public.projects disable trigger projects_room_after_insert;
insert into public.projects (id, name) values ('f3000000-0000-4000-8000-000000000001', 'Room project');
alter table public.projects enable trigger projects_room_after_insert;

insert into public.conversations (id, kind, project_id)
values ('f0000000-0000-4000-8000-0000000000c1', 'client', 'f3000000-0000-4000-8000-000000000001');
insert into public.conversation_members (conversation_id, user_id, role)
values ('f0000000-0000-4000-8000-0000000000c1', md5('t-client@example.com')::uuid, 'client');

select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select public.add_member('f0000000-0000-4000-8000-0000000000c1', md5('t-a@example.com')::uuid, 'closer', true)$$,
  'Jose adds the closer to a client room'
);

select is(
  (select body from public.messages where conversation_id = 'f0000000-0000-4000-8000-0000000000c1' and system_event = 'member_added'),
  'Closer A',
  'adding a member leaves a member_added message with the name'
);

select throws_ok(
  $$select public.add_member('f0000000-0000-4000-8000-0000000000c1', md5('t-a@example.com')::uuid, 'closer', true)$$,
  'P0001',
  'already_member',
  'adding an active member twice fails'
);

select throws_ok(
  format($$select public.add_member(%L, %L, 'client', true)$$, (select id from rooms where label = 'a'), md5('t-client@example.com')::uuid),
  'P0001',
  'client_outside_project',
  'a client cannot be added to a non-client room'
);

select throws_ok(
  $$select public.add_member('f0000000-0000-4000-8000-0000000000c1', md5('t-b@example.com')::uuid, 'freelance', true)$$,
  'P0001',
  'role_mismatch',
  'the member role must match the profile role'
);

select throws_ok(
  $$select public.remove_member('f0000000-0000-4000-8000-0000000000c1', md5('t-admin@example.com')::uuid)$$,
  'P0001',
  'owner_cannot_leave',
  'the owner cannot be removed'
);

reset role;
select tests.login_as('t-a@example.com');

select is(
  (select count(*) from public.messages where conversation_id = 'f0000000-0000-4000-8000-0000000000c1'),
  1::bigint,
  'the added closer now reads the client room'
);

reset role;
select tests.login_as('t-admin@example.com');

select lives_ok(
  $$select public.remove_member('f0000000-0000-4000-8000-0000000000c1', md5('t-a@example.com')::uuid)$$,
  'Jose removes the closer from the client room'
);

reset role;
select tests.login_as('t-a@example.com');

select is(
  (select count(*) from public.messages where conversation_id = 'f0000000-0000-4000-8000-0000000000c1'),
  0::bigint,
  'the removed closer no longer reads the room'
);

reset role;
select tests.login_as('t-client@example.com');

select lives_ok(
  $$select public.set_ai_consent('f0000000-0000-4000-8000-0000000000c1', true)$$,
  'the client grants consent'
);

select is(
  (select consent_state from public.my_conversations),
  'granted',
  'consent_state is granted'
);

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-client@example.com')::uuid, '@Nexo ayuda');

select lives_ok(
  $$select public.set_ai_consent('f0000000-0000-4000-8000-0000000000c1', false)$$,
  'the client revokes consent'
);

reset role;

select is(
  (select count(*) filter (where status = 'cancelled' and error = 'consent_revoked') from private.jobs),
  1::bigint,
  'revoking cancels the queued replies of the room'
);

select is(
  (select string_agg(system_event::text, ',' order by system_event::text) from public.messages where conversation_id = 'f0000000-0000-4000-8000-0000000000c1' and system_event in ('consent_granted', 'consent_revoked')),
  'consent_granted,consent_revoked',
  'both consent changes leave system messages'
);

select ok(
  (select count(*) >= 2 from private.audit_log where table_name = 'conversations' and row_id = 'f0000000-0000-4000-8000-0000000000c1'),
  'consent changes are audited'
);

select tests.login_as('t-client2@example.com');

select throws_ok(
  $$select public.set_ai_consent('f0000000-0000-4000-8000-0000000000c1', true)$$,
  '42501',
  null,
  'another client cannot grant consent'
);

reset role;
select tests.login_as('t-admin@example.com');

select throws_ok(
  $$select public.set_ai_consent('f0000000-0000-4000-8000-0000000000c1', true)$$,
  '42501',
  null,
  'the admin cannot grant consent for a client'
);

select throws_ok(
  format($$select public.set_ai_consent(%L, true)$$, (select id from rooms where label = 'a')),
  '42501',
  null,
  'consent cannot be set in a closer room'
);

select lives_ok(
  format($$select public.archive_conversation(%L)$$, (select id from rooms where label = 'a')),
  'Jose archives a room'
);

reset role;

select is(
  (select status::text from public.conversations where id = (select id from rooms where label = 'a')),
  'archived',
  'the room is archived'
);

select tests.login_as('t-a@example.com');

select throws_ok(
  format(
    $$insert into public.messages (conversation_id, author_kind, author_id, body) values (%L, 'human', %L, 'tarde')$$,
    (select id from rooms where label = 'a'),
    md5('t-a@example.com')::uuid
  ),
  '42501',
  null,
  'nobody writes in an archived room'
);

reset role;

insert into auth.users (id, aud, role, email, email_confirmed_at)
values (md5('new-closer@example.com')::uuid, 'authenticated', 'authenticated', 'new-closer@example.com', now());

insert into public.invitations (email, role, token_hash, invited_by)
values ('new-closer@example.com', 'closer', private.hash_invitation_token('room-token'), md5('t-admin@example.com')::uuid);

select tests.login_as('new-closer@example.com', 'aal1');

select public.accept_invitation('room-token', 'New Closer');

reset role;

select is(
  (select count(*) from public.conversations c join public.conversation_members m on m.conversation_id = c.id where c.subject_user_id = md5('new-closer@example.com')::uuid and m.user_id = md5('new-closer@example.com')::uuid and m.role = 'closer'),
  1::bigint,
  'accepting a closer invitation creates their room'
);

update public.profiles set is_active = false where id = md5('t-free@example.com')::uuid;

select is(
  (select status::text from public.conversations where subject_user_id = md5('t-free@example.com')::uuid),
  'archived',
  'deactivating a freelance archives their room'
);

select is(
  (select count(*) from public.conversation_members where user_id = md5('t-free@example.com')::uuid and left_at is null),
  0::bigint,
  'deactivating a user closes their memberships'
);

select * from finish();

rollback;
