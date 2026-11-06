begin;

\ir support/helpers.sql

select plan(24);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Jose');
select tests.create_user('t-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-b@example.com', 'closer', 'Closer B');
select tests.create_user('t-client@example.com', 'client', 'Client');

delete from private.jobs;
delete from private.heartbeat;
delete from private.outbox;
delete from public.notifications;

insert into private.telegram_links (user_id, chat_id)
values (md5('t-admin@example.com')::uuid, 111), (md5('t-a@example.com')::uuid, 222);

insert into public.conversations (id, kind, subject_user_id)
values ('f0000000-0000-4000-8000-00000000000a', 'closer', md5('t-a@example.com')::uuid);
insert into public.conversation_members (conversation_id, user_id, role)
values ('f0000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'closer');

insert into public.visitors (id, token_hash) values ('f2000000-0000-4000-8000-000000000001', repeat('a', 64));
insert into public.conversations (id, kind, visitor_id)
values ('f0000000-0000-4000-8000-0000000000e1', 'visitor', 'f2000000-0000-4000-8000-000000000001');

insert into public.projects (id, name) values ('f3000000-0000-4000-8000-000000000001', 'Notification project');
delete from public.conversations where project_id = 'f3000000-0000-4000-8000-000000000001';

insert into public.conversations (id, kind, project_id, ai_consent_at)
values ('f0000000-0000-4000-8000-0000000000c1', 'client', 'f3000000-0000-4000-8000-000000000001', now());
insert into public.conversation_members (conversation_id, user_id, role)
values ('f0000000-0000-4000-8000-0000000000c1', md5('t-client@example.com')::uuid, 'client');

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Hola Jose, mira esto');

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'message_new'),
  1::bigint,
  'a closer message notifies Jose'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-a@example.com')::uuid),
  0::bigint,
  'a closer message does not notify the closer'
);

select is(
  (select href || '|' || title from public.notifications where user_id = md5('t-admin@example.com')::uuid),
  '/admin/chat/f0000000-0000-4000-8000-00000000000a|Closer A',
  'the notification for Jose links to the admin room and carries the author'
);

select is(
  (select count(*) from private.outbox where channel = 'telegram' and recipient = '111'),
  1::bigint,
  'a private room message always reaches Jose on Telegram'
);

select is(
  (select count(*) from private.outbox where channel = 'email'),
  0::bigint,
  'chat messages queue no email'
);

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-admin@example.com')::uuid, 'Te escribo a ana@example.com');

select is(
  (select href || '|' || body from public.notifications where user_id = md5('t-a@example.com')::uuid),
  '/crm/chat?sala=f0000000-0000-4000-8000-00000000000a|Te escribo a […]',
  'a message from Jose notifies the closer with a masked excerpt'
);

select is(
  (select count(*) from private.outbox where channel = 'telegram' and recipient = '222'),
  1::bigint,
  'the closer also gets Telegram'
);

insert into public.messages (conversation_id, author_kind, body, auto)
values ('f0000000-0000-4000-8000-00000000000a', 'nexo', 'Respondo yo, Nexo', true);

insert into public.messages (conversation_id, author_kind, system_event, body)
values ('f0000000-0000-4000-8000-00000000000a', 'system', 'member_added', 'x');

select is(
  (select count(*) from public.notifications),
  2::bigint,
  'Nexo and system messages notify nobody'
);

delete from public.notifications;
delete from private.outbox;
insert into private.heartbeat (service, seen_at) values ('omen', now());

insert into public.messages (conversation_id, author_kind, body, page_path)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', 'Hola desde la web', '/es');

select is(
  (select count(*) || '/' || (select count(*) from private.outbox where channel = 'telegram') from public.notifications where user_id = md5('t-admin@example.com')::uuid),
  '1/0',
  'a visitor message with Nexo up reaches the bell but not Telegram'
);

select is(
  (select title from public.notifications where user_id = md5('t-admin@example.com')::uuid),
  'Visitante',
  'the visitor notification carries no personal data'
);

delete from private.heartbeat;
delete from public.notifications;
delete from private.outbox;

insert into public.messages (conversation_id, author_kind, body)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', 'Sigo aqui');

select is(
  (select count(*) from private.outbox where channel = 'telegram' and recipient = '111'),
  1::bigint,
  'a visitor message with Nexo down reaches Telegram'
);

insert into private.heartbeat (service, seen_at) values ('omen', now());
delete from private.outbox;

update public.conversations set interest = true where id = 'f0000000-0000-4000-8000-0000000000e1';

insert into public.messages (conversation_id, author_kind, body)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', 'Quiero contratar');

select is(
  (select count(*) from private.outbox where channel = 'telegram'),
  1::bigint,
  'a visitor marked as interested reaches Telegram even with Nexo up'
);

update public.conversations set interest = null where id = 'f0000000-0000-4000-8000-0000000000e1';
delete from private.outbox;
update public.conversations set ai_enabled = false where id = 'f0000000-0000-4000-8000-0000000000e1';

insert into public.messages (conversation_id, author_kind, body)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', 'Con Nexo apagado');

select is(
  (select count(*) from private.outbox where channel = 'telegram'),
  1::bigint,
  'a visitor message with Nexo switched off reaches Telegram'
);

update public.conversations set ai_enabled = true where id = 'f0000000-0000-4000-8000-0000000000e1';
delete from private.outbox;

select tests.login_as('t-admin@example.com');
select public.set_notification_pref('message_new', 'telegram', false);
reset role;

update public.conversations set ai_enabled = false where id = 'f0000000-0000-4000-8000-0000000000e1';
insert into public.messages (conversation_id, author_kind, body)
values ('f0000000-0000-4000-8000-0000000000e1', 'human', 'Con el interruptor apagado');

select is(
  (select count(*) from private.outbox where channel = 'telegram'),
  0::bigint,
  'the message_new switch turns Telegram off'
);

select is(
  (select count(*) from public.notifications where user_id = md5('t-admin@example.com')::uuid and event = 'message_new'),
  4::bigint,
  'the bell still receives every visitor message'
);

delete from public.notifications;

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-client@example.com')::uuid, 'Hola desde el area');

select is(
  (select href from public.notifications where user_id = md5('t-admin@example.com')::uuid),
  '/admin/chat/f0000000-0000-4000-8000-0000000000c1',
  'a client message notifies Jose'
);

delete from public.notifications;

insert into public.messages (conversation_id, author_kind, author_id, body)
values ('f0000000-0000-4000-8000-0000000000c1', 'human', md5('t-admin@example.com')::uuid, 'Respuesta');

select is(
  (select count(*) from public.notifications),
  0::bigint,
  'clients get no notification rows yet'
);

update public.conversation_members set last_read_at = now() - interval '1 hour';

select tests.login_as('t-admin@example.com');

select is(
  (public.admin_counters() ->> 'unread_threads')::int,
  3,
  'admin_counters counts the rooms with messages Jose has not read'
);

select is(
  (public.admin_counters() ->> 'stories_to_decide')::int,
  0,
  'admin_counters reports no stories to decide without projects'
);

select ok(
  public.admin_counters() ? 'leads_new' and public.admin_counters() ? 'payouts_draft',
  'admin_counters keeps the earlier keys'
);

reset role;
update public.conversation_members set last_read_at = now() + interval '1 minute'
where user_id = md5('t-admin@example.com')::uuid;

select tests.login_as('t-admin@example.com');

select is((public.admin_counters() ->> 'unread_threads')::int, 0, 'reading clears the unread counter');

reset role;
insert into public.messages (conversation_id, author_kind, author_id, body, created_at)
values ('f0000000-0000-4000-8000-00000000000a', 'human', md5('t-admin@example.com')::uuid, 'Nuevo de Jose', now() + interval '2 minutes');
update public.conversation_members set last_read_at = now() - interval '1 hour'
where user_id = md5('t-a@example.com')::uuid;

select tests.login_as('t-a@example.com');

select is(
  (select unread_threads from public.crm_counters()),
  1,
  'crm_counters counts unread rooms for the closer'
);

reset role;
select tests.login_as('t-b@example.com');

select is(
  (select unread_threads from public.crm_counters()),
  0,
  'another closer has no unread rooms'
);

select has_column('public', 'messages', 'auto', 'sanity: messages keeps the auto column');

select * from finish();

rollback;
