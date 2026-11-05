alter type public.notification_event add value if not exists 'document_added';

create type public.document_visibility as enum ('client', 'team');

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  name text not null,
  mime text not null,
  size_bytes bigint not null,
  storage_path text not null unique,
  visibility public.document_visibility not null default 'client',
  created_at timestamptz not null default now(),
  deleted_at timestamptz,
  deleted_by uuid references public.profiles (id) on delete set null,
  constraint documents_name_length check (char_length(btrim(name)) between 1 and 255),
  constraint documents_size_range check (size_bytes > 0 and size_bytes <= 26214400),
  constraint documents_mime_closed check (
    mime in (
      'application/pdf',
      'image/png',
      'image/jpeg',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'application/zip',
      'text/plain',
      'text/csv',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
  ),
  constraint documents_path_shape check (
    storage_path = 'projects/' || project_id::text || '/' || id::text
  ),
  constraint documents_deleted_consistent check (deleted_by is null or deleted_at is not null)
);

create index documents_project_id_idx on public.documents (project_id, created_at desc);
create index documents_uploaded_by_idx on public.documents (uploaded_by);
create index documents_deleted_by_idx on public.documents (deleted_by);

alter table public.documents enable row level security;

revoke all on public.documents from anon, authenticated;
grant select on public.documents to authenticated;

create policy documents_select
on public.documents
for select
to authenticated
using (
  deleted_at is null
  and (select private.is_project_member(project_id))
  and (visibility = 'client' or (select private.role()) in ('admin', 'freelance'))
);

create trigger documents_audit_insert
after insert on public.documents
for each row execute function private.audit();

create trigger documents_audit_update
after update on public.documents
for each row
when (old.deleted_at is distinct from new.deleted_at)
execute function private.audit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'project-documents',
  'project-documents',
  false,
  26214400,
  array[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/webp',
    'image/gif',
    'video/mp4',
    'video/webm',
    'video/quicktime',
    'application/zip',
    'text/plain',
    'text/csv',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy project_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-documents'
  and exists (
    select 1 from public.documents d where d.storage_path = objects.name and d.deleted_at is null
  )
);

create function public.register_document(
  p_project_id uuid,
  p_uploaded_by uuid,
  p_name text,
  p_mime text,
  p_size bigint,
  p_path text,
  p_visibility public.document_visibility default 'client'
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
  v_uploader public.profiles;
  v_id uuid;
  v_used bigint;
  v_recipient uuid;
begin
  select * into v_project from public.projects p where p.id = p_project_id;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  select * into v_uploader
  from public.profiles pr
  where pr.id = p_uploaded_by and pr.is_active and pr.archived_at is null;

  if not found
    or not (
      v_uploader.role = 'admin'
      or (v_uploader.role = 'client' and v_project.client_id = v_uploader.id)
      or (v_uploader.role = 'freelance' and v_project.freelance_id = v_uploader.id)
    )
  then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  if p_visibility = 'team' and v_uploader.role = 'client' then
    raise exception 'visibility_forbidden' using errcode = 'P0001';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 255 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  if p_size is null or p_size <= 0 or p_size > 26214400 then
    raise exception 'file_too_large' using errcode = 'P0001';
  end if;

  if p_path is null
    or p_path !~ ('^projects/' || p_project_id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$')
  then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;

  select coalesce(sum(d.size_bytes), 0) into v_used
  from public.documents d
  where d.project_id = p_project_id and d.deleted_at is null;

  if v_used + p_size > 1073741824 then
    raise exception 'project_quota_exceeded' using errcode = 'P0001';
  end if;

  begin
    insert into public.documents (id, project_id, uploaded_by, name, mime, size_bytes, storage_path, visibility)
    values (
      split_part(p_path, '/', 3)::uuid, p_project_id, p_uploaded_by, btrim(p_name), p_mime, p_size, p_path,
      p_visibility
    )
    returning id into v_id;
  exception
    when check_violation then
      raise exception 'invalid_mime' using errcode = 'P0001';
    when unique_violation then
      raise exception 'document_exists' using errcode = 'P0001';
  end;

  if v_uploader.role = 'client' then
    for v_recipient in
      select a.id from public.profiles a where a.role = 'admin' and a.is_active and a.archived_at is null
    loop
      perform private.notify(
        v_recipient, 'document_added', btrim(p_name), v_project.name, '/admin/proyectos/' || p_project_id::text
      );
    end loop;
  elsif p_visibility = 'client' and v_project.client_id is not null then
    perform private.notify(
      v_project.client_id, 'document_added', btrim(p_name), v_project.name,
      '/area/documentos?proyecto=' || p_project_id::text
    );
  end if;

  return v_id;
end;
$$;

create function public.delete_document(p_id uuid)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_doc public.documents;
begin
  select * into v_doc from public.documents d where d.id = p_id and d.deleted_at is null for update;

  if not found
    or not private.is_project_member(v_doc.project_id)
    or (v_doc.visibility = 'team' and private.role() = 'client')
  then
    raise exception 'document_not_found' using errcode = 'P0001';
  end if;

  if not private.is_admin() and v_doc.uploaded_by is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.documents set deleted_at = now(), deleted_by = auth.uid() where id = p_id;

  return v_doc.storage_path;
end;
$$;

revoke all on function public.register_document(uuid, uuid, text, text, bigint, text, public.document_visibility) from public, anon, authenticated;
revoke all on function public.delete_document(uuid) from public, anon, authenticated;

grant execute on function public.register_document(uuid, uuid, text, text, bigint, text, public.document_visibility) to service_role;
grant execute on function public.delete_document(uuid) to authenticated;
