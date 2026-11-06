begin;

\ir support/helpers.sql

select plan(56);

select tests.clean();
select tests.create_user('i-admin@example.com', 'admin', 'Jose Admin');
select tests.create_user('i-closer@example.com', 'closer', 'Closer');
select tests.create_user('i-free@example.com', 'freelance', 'Secret Freelance');
select tests.create_user('i-client@example.com', 'client', 'Client One');
select tests.create_user('i-client2@example.com', 'client', 'Client Two');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000a1', 'Identity Project', md5('i-client@example.com')::uuid, md5('i-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000a2', 'Other Project', md5('i-client2@example.com')::uuid, null);

create temp table ids (k text primary key, v uuid);
grant all on ids to public;
insert into ids select 'doc' || n, gen_random_uuid() from generate_series(1, 4) n;

select tests.login_as('i-admin@example.com');
select public.upsert_task('00000000-0000-4000-8000-0000000000a1', 'FreeTask', 'build', p_assignee_id => md5('i-free@example.com')::uuid);
select public.upsert_task('00000000-0000-4000-8000-0000000000a1', 'ClientTask', 'build', p_assignee_id => md5('i-client@example.com')::uuid);
select public.upsert_task('00000000-0000-4000-8000-0000000000a1', 'OpenTask', 'build');
select public.set_freelance_fee('00000000-0000-4000-8000-0000000000a1', 'hourly', null, 35);

reset role;
select tests.login_as('i-free@example.com');
select public.submit_fee_hours('00000000-0000-4000-8000-0000000000a1', 5, 'Setup', ((now() at time zone 'Europe/Madrid')::date));
select public.set_my_task_status((select id from public.project_tasks where title = 'FreeTask'), 'done');
insert into public.project_updates (project_id, body, visibility)
values ('00000000-0000-4000-8000-0000000000a1', 'Shared progress', 'client');
select public.ensure_my_conversation();

reset role;
select tests.login_as('i-admin@example.com');
select public.approve_fee_items(array[(select id from public.freelance_fee_items where label = 'Setup')]);

reset role;
select tests.login_service();
select public.register_document('00000000-0000-4000-8000-0000000000a1', md5('i-free@example.com')::uuid, 'delivery.pdf', 'application/pdf', 1000, 'projects/00000000-0000-4000-8000-0000000000a1/' || (select v from ids where k = 'doc1'), 'client');
select public.register_document('00000000-0000-4000-8000-0000000000a1', md5('i-admin@example.com')::uuid, 'internal.pdf', 'application/pdf', 1000, 'projects/00000000-0000-4000-8000-0000000000a1/' || (select v from ids where k = 'doc2'), 'team');
select public.register_document('00000000-0000-4000-8000-0000000000a1', md5('i-admin@example.com')::uuid, 'invoice.pdf', 'application/pdf', 1000, 'projects/00000000-0000-4000-8000-0000000000a1/' || (select v from ids where k = 'doc3'), 'client');
select public.register_document('00000000-0000-4000-8000-0000000000a1', md5('i-client@example.com')::uuid, 'logo.png', 'image/png', 1000, 'projects/00000000-0000-4000-8000-0000000000a1/' || (select v from ids where k = 'doc4'), 'client');

reset role;
insert into storage.objects (bucket_id, name)
select 'project-documents', storage_path from public.documents;

select tests.login_as('i-client@example.com');

select throws_ok($$select freelance_id from public.projects$$, '42501', null, 'the client cannot select projects.freelance_id');
select throws_ok($$select created_by from public.projects$$, '42501', null, 'the client cannot select projects.created_by');
select throws_ok($$select * from public.projects$$, '42501', null, 'the client cannot select every project column');
select is((select count(*)::int from public.projects where id = '00000000-0000-4000-8000-0000000000a1'), 1, 'the client still reads their project by the allowed columns');
select is((select name from public.projects), 'Identity Project', 'and its name');
select throws_ok($$select * from public.tasks$$, '42501', null, 'the client cannot read tasks directly');
select throws_ok($$select assignee_id from public.tasks$$, '42501', null, 'the client cannot read task assignees directly');
select throws_ok($$select * from public.documents$$, '42501', null, 'the client cannot read documents directly');
select throws_ok($$select uploaded_by from public.documents$$, '42501', null, 'the client cannot read document uploaders directly');
select throws_ok($$select * from public.project_overview$$, '42501', null, 'the client cannot read the admin overview');

select is((select count(*)::int from public.project_tasks), 3, 'the client reads the tasks of their project through the view');
select is((select count(*)::int from public.project_tasks where assignee_id is not null or done_by is not null), 0, 'no task carries an assignee or completer id for the client');
select is((select assignee_kind from public.project_tasks where title = 'FreeTask'), 'team', 'the freelance task is team for the client');
select is((select assignee_kind from public.project_tasks where title = 'ClientTask'), 'me', 'their own task is me');
select is((select assignee_kind from public.project_tasks where title = 'OpenTask'), 'none', 'an open task is none');
select is((select array_agg(title order by title) from public.project_tasks where assigned_to_me), array['ClientTask'], 'only their task is assigned to me');
select is((select status::text from public.project_tasks where title = 'FreeTask'), 'done', 'the client sees the status the freelance set');

select is((select array_agg(name order by name) from public.project_documents), array['delivery.pdf', 'invoice.pdf', 'logo.png'], 'the client reads the client documents and not the team ones');
select is((select uploader from public.project_documents where name = 'delivery.pdf'), 'team', 'the freelance delivery shows as team');
select is((select uploader from public.project_documents where name = 'invoice.pdf'), 'jose', 'a document of Jose shows as jose');
select is((select uploader from public.project_documents where name = 'logo.png'), 'me', 'their own document shows as me');
select is((select count(*)::int from public.project_documents where uploaded_by is not null), 0, 'no document carries an uploader id for the client');

select is((select count(*)::int from public.client_project_updates), 1, 'the client reads the published update');
select is((select author_label from public.client_project_updates), 'team', 'it is signed by the team');
select hasnt_column('public', 'client_project_updates', 'author_id', 'the client view has no author_id');
select is((select count(*)::int from public.project_updates), 0, 'the client reads no project_updates');

select is((select count(*)::int from public.freelance_fees), 0, 'the client reads no freelance_fees');
select is((select count(*)::int from public.freelance_fee_items), 0, 'the client reads no freelance_fee_items');
select is((select count(*)::int from public.freelance_fee_summary), 0, 'the client reads no freelance_fee_summary');
select is((select count(*)::int from public.payouts), 0, 'the client reads no payouts');
select is((select count(*)::int from public.profiles), 1, 'the client reads only their own profile');
select is((select count(*)::int from public.team_profiles), 1, 'and only their own team profile row');

select is((select count(*)::int from public.notifications), 0, 'the client reads no notification rows');

reset role;
select cmp_ok((select count(*)::int from public.notifications where user_id = md5('i-client@example.com')::uuid), '>=', 2, 'the client has notifications to check');
select is(
  (
    select count(*)::int
    from public.notifications n
    where n.user_id = md5('i-client@example.com')::uuid
      and (n.title || ' ' || coalesce(n.body, '') || ' ' || coalesce(n.href, '')) ilike any (
        array['%Secret Freelance%', '%i-free@example.com%', '%' || md5('i-free@example.com') || '%']
      )
  ),
  0,
  'no notification of the client names the freelance'
);
select is((select title from public.notifications where event = 'document_added' and user_id = md5('i-client@example.com')::uuid and body = 'delivery.pdf'), 'Equipo', 'the delivery notification is signed Equipo');
select is((select title from public.notifications where event = 'project_update' and user_id = md5('i-client@example.com')::uuid), 'Equipo', 'the update notification is signed Equipo');
select cmp_ok((select count(*)::int from private.outbox where recipient = 'i-client@example.com'), '>=', 2, 'the client has queued emails to check');
select is(
  (
    select count(*)::int
    from private.outbox o
    where o.recipient = 'i-client@example.com'
      and o.payload::text ilike any (
        array['%Secret Freelance%', '%i-free@example.com%', '%' || md5('i-free@example.com') || '%']
      )
  ),
  0,
  'no queued email to the client names the freelance'
);

select tests.login_as('i-client@example.com');

select is((select count(*)::int from public.my_conversations where kind <> 'client'), 0, 'the client lists no room other than their own');
select is((select count(*)::int from public.messages), (select count(*)::int from public.messages where author_kind <> 'human' or author_id is not null), 'the client reads only messages of rooms they belong to');

select cmp_ok((select count(*)::int from storage.objects), '>=', 3, 'the client reads storage objects');
select is((select count(*)::int from storage.objects where owner is not null), 0, 'no storage object readable by the client has an owner');

select throws_ok($$select * from public.admin_audit_log()$$, '42501', null, 'the client cannot read the audit log');
select throws_ok($$select * from private.audit_log$$, '42501', null, 'the client cannot read private.audit_log');

reset role;
select tests.login_as('i-free@example.com');

select is((select assignee_kind from public.project_tasks where title = 'ClientTask'), 'client', 'the freelance sees the client task as client');
select is((select count(*)::int from public.project_tasks where title = 'ClientTask' and assignee_id is not null), 0, 'without the client id');
select is((select assignee_kind from public.project_tasks where title = 'FreeTask'), 'me', 'and their own as me');
select is((select array_agg(name order by name) from public.project_documents), array['delivery.pdf', 'internal.pdf'], 'the freelance reads the team documents and their own deliveries only');
select throws_ok($$select * from public.tasks$$, '42501', null, 'the freelance cannot read tasks directly');
select throws_ok($$select * from public.documents$$, '42501', null, 'the freelance cannot read documents directly');

reset role;
select tests.login_service();
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000a1', md5('i-free@example.com')::uuid, 'notes.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000a1/' || gen_random_uuid()::text, 'team')$$,
  'P0001', 'visibility_not_allowed', 'the freelance cannot register a team document'
);

reset role;
select tests.login_as('i-admin@example.com');

select is((select freelance_id from public.project_overview where id = '00000000-0000-4000-8000-0000000000a1'), md5('i-free@example.com')::uuid, 'the admin overview carries the freelance');
select is((select assignee_id from public.project_tasks where title = 'FreeTask'), md5('i-free@example.com')::uuid, 'the admin sees task assignees');
select is((select uploaded_by from public.project_documents where name = 'delivery.pdf'), md5('i-free@example.com')::uuid, 'the admin sees document uploaders');

reset role;
select is_empty(
  $$
    select c.table_name, c.column_name, c.grantee
    from information_schema.column_privileges c
    where c.table_schema = 'public'
      and c.grantee in ('authenticated', 'anon', 'PUBLIC')
      and c.privilege_type = 'SELECT'
      and (
        (c.table_name = 'projects' and c.column_name in ('freelance_id', 'created_by'))
        or (c.table_name = 'tasks' and c.column_name in ('assignee_id', 'done_by'))
        or (c.table_name = 'documents' and c.column_name = 'uploaded_by')
      )
  $$,
  'no identity column of projects, tasks or documents has SELECT for authenticated, anon or PUBLIC'
);

select * from finish();

rollback;
