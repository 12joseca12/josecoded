begin;

\ir support/helpers.sql

select plan(38);

create function pg_temp.affected(p_sql text)
returns bigint
language plpgsql
as $$
declare
  v_rows bigint;
begin
  execute p_sql;
  get diagnostics v_rows = row_count;
  return v_rows;
end;
$$;

grant execute on function pg_temp.affected(text) to public;

select tests.clean();
select tests.create_user('d-admin@example.com', 'admin', 'Admin');
select tests.create_user('d-closer@example.com', 'closer', 'Closer');
select tests.create_user('d-free@example.com', 'freelance', 'Freelance');
select tests.create_user('d-client@example.com', 'client', 'Client');
select tests.create_user('d-client2@example.com', 'client', 'Client Two');

insert into public.projects (id, name, client_id, freelance_id) values
  ('00000000-0000-4000-8000-0000000000b1', 'Project One', md5('d-client@example.com')::uuid, md5('d-free@example.com')::uuid),
  ('00000000-0000-4000-8000-0000000000b2', 'Project Two', md5('d-client2@example.com')::uuid, null),
  ('00000000-0000-4000-8000-0000000000b3', 'Project No Client', null, null);

create temp table ids (k text primary key, v uuid);
grant all on ids to public;
insert into ids select 'doc' || n, gen_random_uuid() from generate_series(1, 8) n;

select tests.login_service();

select lives_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'brief.pdf', 'application/pdf', 1000, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc1'), 'client')$$,
  'service_role registers a document uploaded by the client'
);
select lives_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-admin@example.com')::uuid, 'internal.pdf', 'application/pdf', 2000, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc2'), 'team')$$,
  'service_role registers a team document uploaded by the admin'
);
select lives_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-admin@example.com')::uuid, 'invoice.pdf', 'application/pdf', 3000, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc3'), 'client')$$,
  'service_role registers a client document uploaded by the admin'
);
select lives_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b2', md5('d-client2@example.com')::uuid, 'other.pdf', 'application/pdf', 500, 'projects/00000000-0000-4000-8000-0000000000b2/' || (select v from ids where k = 'doc4'), 'client')$$,
  'service_role registers a document of another project'
);

select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client2@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'client')$$,
  'P0001', 'not_member', 'someone outside the project cannot upload'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-closer@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'client')$$,
  'P0001', 'not_member', 'a closer cannot upload'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'team')$$,
  'P0001', 'visibility_forbidden', 'a client cannot upload team documents'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.exe', 'application/x-msdownload', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'client')$$,
  'P0001', 'invalid_mime', 'a mime type outside the list fails'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 26214401, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'client')$$,
  'P0001', 'file_too_large', 'a file above 25 MB fails'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b2/' || (select v from ids where k = 'doc5'), 'client')$$,
  'P0001', 'invalid_path', 'the path must belong to the project'
);
select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc1'), 'client')$$,
  'P0001', 'document_exists', 'the same path cannot be registered twice'
);
select throws_ok(
  $$select public.register_document(gen_random_uuid(), md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/x/y', 'client')$$,
  'P0001', 'project_not_found', 'an unknown project fails'
);

reset role;

with g as (select gen_random_uuid() as id from generate_series(1, 40))
insert into public.documents (id, project_id, uploaded_by, name, mime, size_bytes, storage_path)
select g.id, '00000000-0000-4000-8000-0000000000b3', md5('d-admin@example.com')::uuid, 'bulk.zip', 'application/zip', 26214400,
  'projects/00000000-0000-4000-8000-0000000000b3/' || g.id::text
from g;

select tests.login_service();

select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b3', md5('d-admin@example.com')::uuid, 'one-more.zip', 'application/zip', 26214400, 'projects/00000000-0000-4000-8000-0000000000b3/' || (select v from ids where k = 'doc6'), 'client')$$,
  'P0001', 'project_quota_exceeded', 'the 1 GB per project quota is enforced'
);
select lives_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b3', md5('d-admin@example.com')::uuid, 'small.zip', 'application/zip', 1000, 'projects/00000000-0000-4000-8000-0000000000b3/' || (select v from ids where k = 'doc7'), 'client')$$,
  'a file that still fits in the quota is accepted'
);

reset role;
select tests.login_as('d-client@example.com');

select throws_ok(
  $$select public.register_document('00000000-0000-4000-8000-0000000000b1', md5('d-client@example.com')::uuid, 'x.pdf', 'application/pdf', 10, 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc5'), 'client')$$,
  '42501', null, 'authenticated cannot execute register_document'
);

select is(
  (select array_agg(name order by name) from public.documents),
  array['brief.pdf', 'invoice.pdf'],
  'the client reads client documents and no team documents or other projects'
);

reset role;
select tests.login_as('d-client2@example.com');
select is((select array_agg(name) from public.documents), array['other.pdf'], 'another client only reads their own project');

reset role;
select tests.login_as('d-free@example.com');
select is(
  (select array_agg(name order by name) from public.documents),
  array['brief.pdf', 'internal.pdf', 'invoice.pdf'],
  'the freelance reads the client and team documents of their project'
);

reset role;
select tests.login_aal1('d-free@example.com');
select is((select count(*) from public.documents), 0::bigint, 'the freelance without aal2 reads nothing');

reset role;
select tests.login_as('d-closer@example.com');
select is((select count(*) from public.documents), 0::bigint, 'the closer reads no documents');

reset role;

insert into storage.objects (bucket_id, name) values
  ('project-documents', 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc1')),
  ('project-documents', 'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc2')),
  ('project-documents', 'projects/00000000-0000-4000-8000-0000000000b2/' || (select v from ids where k = 'doc4')),
  ('project-documents', 'projects/00000000-0000-4000-8000-0000000000b1/' || gen_random_uuid()::text);

select tests.login_as('d-client@example.com');
select is((select count(*) from storage.objects), 1::bigint, 'the client only sees the object of a client document of their project');

reset role;
select tests.login_as('d-free@example.com');
select is((select count(*) from storage.objects), 2::bigint, 'the freelance sees the objects of the documents of their project');

reset role;
select tests.login_as('d-admin@example.com');
select is((select count(*) from storage.objects), 3::bigint, 'the admin sees every registered object and none without a document');

reset role;
select tests.login_as('d-client@example.com');
select throws_ok(
  $$insert into storage.objects (bucket_id, name) values ('project-documents', 'projects/00000000-0000-4000-8000-0000000000b1/' || gen_random_uuid()::text)$$,
  '42501', null, 'the client cannot write objects directly'
);

select throws_ok($$select public.delete_document((select v from ids where k = 'doc2'))$$, 'P0001', 'document_not_found', 'the client cannot delete a team document');
select throws_ok($$select public.delete_document((select v from ids where k = 'doc3'))$$, '42501', 'forbidden', 'the client cannot delete a document uploaded by Jose');
select is(
  public.delete_document((select v from ids where k = 'doc1')),
  'projects/00000000-0000-4000-8000-0000000000b1/' || (select v from ids where k = 'doc1'),
  'the client deletes their own document and gets the path to remove'
);
select is((select count(*) from public.documents), 1::bigint, 'the deleted document disappears for the client');
select throws_ok($$select public.delete_document((select v from ids where k = 'doc1'))$$, 'P0001', 'document_not_found', 'a document cannot be deleted twice');

reset role;
select tests.login_as('d-client2@example.com');
select throws_ok($$select public.delete_document((select v from ids where k = 'doc3'))$$, 'P0001', 'document_not_found', 'another client cannot delete it either');

reset role;
select tests.login_as('d-admin@example.com');
select lives_ok($$select public.delete_document((select v from ids where k = 'doc3'))$$, 'the admin deletes any document');
select is((select count(*) from public.documents where project_id = '00000000-0000-4000-8000-0000000000b1'), 1::bigint, 'only the team document remains');

reset role;

select is(
  (select count(*) from private.audit_log where table_name = 'documents' and action = 'update' and after ->> 'deleted_at' is not null),
  2::bigint,
  'deletions are audited'
);

select is(
  (select count(*) from public.notifications where event::text = 'document_added' and user_id = md5('d-admin@example.com')::uuid),
  2::bigint,
  'the admin is notified of each client upload'
);
select is(
  (select title from public.notifications where event::text = 'document_added' and user_id = md5('d-client@example.com')::uuid),
  'invoice.pdf',
  'the client is notified when Jose uploads a client document'
);
select is(
  (select count(*) from public.notifications where event::text = 'document_added' and user_id = md5('d-client@example.com')::uuid),
  1::bigint,
  'a team document does not notify the client'
);
select is(
  (select href from public.notifications where event::text = 'document_added' and user_id = md5('d-client@example.com')::uuid),
  '/area/documentos?proyecto=00000000-0000-4000-8000-0000000000b1',
  'the client notification links to the documents screen'
);

select is(
  (select row(public, file_size_limit, cardinality(allowed_mime_types))::text from storage.buckets where id = 'project-documents'),
  '(f,26214400,17)',
  'the bucket is private with the size limit and the closed mime list'
);

select * from finish();

rollback;
