begin;

\ir support/helpers.sql

select plan(23);

select tests.clean();
select tests.create_user('t-admin@example.com', 'admin', 'Jose');
select tests.create_user('t-a@example.com', 'closer', 'Closer A');
select tests.create_user('t-b@example.com', 'closer', 'Closer B');

delete from private.jobs;
delete from storage.objects;

insert into public.conversations (id, kind, subject_user_id)
values
  ('f0000000-0000-4000-8000-00000000000a', 'closer', md5('t-a@example.com')::uuid),
  ('f0000000-0000-4000-8000-00000000000b', 'closer', md5('t-b@example.com')::uuid);

insert into public.conversation_members (conversation_id, user_id, role)
values
  ('f0000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'closer'),
  ('f0000000-0000-4000-8000-00000000000b', md5('t-b@example.com')::uuid, 'closer');

insert into public.visitors (id, token_hash)
values ('f2000000-0000-4000-8000-000000000001', repeat('a', 64));

insert into public.conversations (id, kind, visitor_id)
values ('f0000000-0000-4000-8000-0000000000e1', 'visitor', 'f2000000-0000-4000-8000-000000000001');

insert into public.messages (id, conversation_id, author_kind, author_id, body)
values
  ('f1000000-0000-4000-8000-00000000000a', 'f0000000-0000-4000-8000-00000000000a', 'human', md5('t-a@example.com')::uuid, 'Con adjuntos'),
  ('f1000000-0000-4000-8000-00000000000b', 'f0000000-0000-4000-8000-00000000000b', 'human', md5('t-b@example.com')::uuid, 'Otro'),
  ('f1000000-0000-4000-8000-0000000000e1', 'f0000000-0000-4000-8000-0000000000e1', 'human', null, 'Visitante');

select tests.login_service();

select lives_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'brief.pdf', 'application/pdf', 1024, 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-000000000001')$$,
  'service_role registers an attachment for the author'
);

select is(
  (select count(*) from public.message_attachments),
  1::bigint,
  'the attachment row exists'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'x.exe', 'application/x-msdownload', 10, 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-000000000002')$$,
  'P0001',
  'invalid_attachment',
  'a mime outside the list fails'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'big.pdf', 'application/pdf', 11534336, 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-000000000003')$$,
  'P0001',
  'invalid_attachment',
  'an 11 MB file fails'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'conversations/f0000000-0000-4000-8000-00000000000b/a0000000-0000-4000-8000-000000000004')$$,
  'P0001',
  'invalid_path',
  'a path in another conversation fails'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-b@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-000000000005')$$,
  'P0001',
  'not_message_author',
  'only the author of the message can attach'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-0000000000e1', null, 'x.pdf', 'application/pdf', 10, 'conversations/f0000000-0000-4000-8000-0000000000e1/a0000000-0000-4000-8000-000000000006')$$,
  'P0001',
  'attachments_not_allowed',
  'a visitor room accepts no attachments'
);

select lives_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'b' || g || '.png', 'image/png', 10, 'conversations/f0000000-0000-4000-8000-00000000000a/b0000000-0000-4000-8000-00000000000' || g) from generate_series(1, 4) g$$,
  'four more attachments reach the limit of five'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'sixth.png', 'image/png', 10, 'conversations/f0000000-0000-4000-8000-00000000000a/c0000000-0000-4000-8000-000000000001')$$,
  'P0001',
  'too_many_attachments',
  'a sixth attachment fails'
);

reset role;
update public.conversation_members set left_at = now()
where conversation_id = 'f0000000-0000-4000-8000-00000000000b' and user_id = md5('t-b@example.com')::uuid;
select tests.login_service();

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000b', md5('t-b@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'conversations/f0000000-0000-4000-8000-00000000000b/d0000000-0000-4000-8000-000000000001')$$,
  'P0001',
  'not_member',
  'a member who left cannot attach'
);

reset role;
select tests.login_as('t-a@example.com');

select throws_ok(
  $$insert into public.message_attachments (message_id, conversation_id, name, mime, size_bytes, storage_path) values ('f1000000-0000-4000-8000-00000000000a', 'f0000000-0000-4000-8000-00000000000a', 'x.pdf', 'application/pdf', 10, 'x')$$,
  '42501',
  null,
  'authenticated cannot insert attachments'
);

select throws_ok(
  $$select public.register_attachment('f1000000-0000-4000-8000-00000000000a', md5('t-a@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'conversations/f0000000-0000-4000-8000-00000000000a/e0000000-0000-4000-8000-000000000001')$$,
  '42501',
  null,
  'authenticated cannot run register_attachment'
);

select is((select count(*) from public.message_attachments), 5::bigint, 'closer A reads the attachments of their room');

reset role;
select tests.login_as('t-b@example.com');

select is((select count(*) from public.message_attachments), 0::bigint, 'closer B reads none');

reset role;
select tests.login_as('t-admin@example.com');

select is((select count(*) from public.message_attachments), 5::bigint, 'Jose reads them');

reset role;

insert into storage.objects (bucket_id, name)
values
  ('chat-attachments', 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-000000000001'),
  ('chat-attachments', 'conversations/f0000000-0000-4000-8000-00000000000b/a0000000-0000-4000-8000-000000000009'),
  ('chat-attachments', 'conversations/not-a-uuid/file');

select tests.login_as('t-a@example.com');

select is(
  (select count(*) from storage.objects where bucket_id = 'chat-attachments'),
  1::bigint,
  'closer A reads only the objects of their room in storage'
);

select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('chat-attachments', 'conversations/f0000000-0000-4000-8000-00000000000a/a0000000-0000-4000-8000-0000000000ff')$$,
  '42501',
  null,
  'authenticated cannot upload straight to the bucket'
);

delete from storage.objects where bucket_id = 'chat-attachments';

reset role;

select is(
  (select count(*) from storage.objects),
  3::bigint,
  'authenticated deletes nothing from the bucket'
);

select is(
  (select public || '/' || file_size_limit || '/' || cardinality(allowed_mime_types) from storage.buckets where id = 'chat-attachments'),
  'false/10485760/12',
  'the bucket is private with a 10 MB limit and a closed mime list'
);

select tests.login_as('t-b@example.com');

select is(
  (select count(*) from storage.objects where bucket_id = 'chat-attachments'),
  0::bigint,
  'closer B who left reads no objects'
);

reset role;

update public.conversations
set status = 'archived', archived_at = now() - interval '91 days'
where id = 'f0000000-0000-4000-8000-00000000000a';

select private.purge_conversations();

select is(
  (select count(*) from storage.objects where name like 'conversations/f0000000-0000-4000-8000-00000000000a/%'),
  0::bigint,
  'the purge removes the storage objects of an expired room'
);

select is(
  (select count(*) from public.message_attachments),
  0::bigint,
  'the purge removes the attachment rows of an expired room'
);

select is(
  (select count(*) from storage.objects),
  2::bigint,
  'the purge leaves other rooms alone'
);

select * from finish();

rollback;
