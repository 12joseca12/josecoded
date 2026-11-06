revoke select on public.projects from authenticated;
grant select (
  id, name, client_id, contact_id, deal_id, offer_slug, brief, phase, status,
  started_at, due_at, archived_at, created_at, updated_at
) on public.projects to authenticated;

create function private.project_progress_rows()
returns table (project_id uuid, done integer, total integer, percent integer)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    (count(t.id) filter (where t.status = 'done'))::integer,
    (count(t.id))::integer,
    case
      when count(t.id) = 0 then 0
      else round(100.0 * count(t.id) filter (where t.status = 'done') / count(t.id))::integer
    end
  from public.projects p
  left join public.tasks t on t.project_id = p.id
  where private.is_project_member(p.id)
  group by p.id
$$;

create or replace view public.project_progress
with (security_invoker = true)
as
select project_id, done, total, percent
from private.project_progress_rows();

create function private.project_overview_rows()
returns table (
  id uuid,
  name text,
  client_id uuid,
  client_name text,
  contact_id uuid,
  deal_id uuid,
  offer_slug text,
  phase public.project_phase,
  status public.project_status,
  freelance_id uuid,
  freelance_name text,
  started_at date,
  due_at date,
  archived_at timestamptz,
  created_at timestamptz,
  done integer,
  total integer,
  percent integer,
  stories_to_decide integer
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    p.name,
    p.client_id,
    c.full_name,
    p.contact_id,
    p.deal_id,
    p.offer_slug,
    p.phase,
    p.status,
    p.freelance_id,
    f.full_name,
    p.started_at,
    p.due_at,
    p.archived_at,
    p.created_at,
    pr.done,
    pr.total,
    pr.percent,
    (
      select count(*)::integer
      from public.stories s
      where s.project_id = p.id and s.status = 'proposed'
    )
  from public.projects p
  join private.project_progress_rows() pr on pr.project_id = p.id
  left join public.profiles c on c.id = p.client_id
  left join public.profiles f on f.id = p.freelance_id;
end;
$$;

drop view public.project_overview;

create view public.project_overview
with (security_invoker = true)
as
select
  id, name, client_id, client_name, contact_id, deal_id, offer_slug, phase, status,
  freelance_id, freelance_name, started_at, due_at, archived_at, created_at,
  done, total, percent, stories_to_decide
from private.project_overview_rows();

revoke all on public.project_overview from anon, authenticated;
grant select on public.project_overview to authenticated;

revoke select on public.tasks from authenticated;

create function private.project_task_rows()
returns table (
  id uuid,
  project_id uuid,
  phase public.project_phase,
  title text,
  description text,
  status public.task_status,
  story_id uuid,
  sort integer,
  done_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz,
  assigned_to_me boolean,
  assignee_kind text,
  assignee_id uuid,
  done_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    t.id,
    t.project_id,
    t.phase,
    t.title,
    t.description,
    t.status,
    t.story_id,
    t.sort,
    t.done_at,
    t.created_at,
    t.updated_at,
    coalesce(t.assignee_id = auth.uid(), false),
    case
      when t.assignee_id is null then 'none'
      when t.assignee_id = auth.uid() then 'me'
      when t.assignee_id = p.client_id then 'client'
      else 'team'
    end,
    case when private.is_admin() then t.assignee_id end,
    case when private.is_admin() then t.done_by end
  from public.tasks t
  join public.projects p on p.id = t.project_id
  where private.is_project_member(t.project_id)
$$;

create view public.project_tasks
with (security_invoker = true)
as
select
  id, project_id, phase, title, description, status, story_id, sort, done_at, created_at, updated_at,
  assigned_to_me, assignee_kind, assignee_id, done_by
from private.project_task_rows();

revoke all on public.project_tasks from anon, authenticated;
grant select on public.project_tasks to authenticated;

revoke select on public.documents from authenticated;

create function private.project_document_rows()
returns table (
  id uuid,
  project_id uuid,
  name text,
  mime text,
  size_bytes bigint,
  storage_path text,
  visibility public.document_visibility,
  created_at timestamptz,
  uploaded_by_me boolean,
  uploader text,
  uploaded_by uuid
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    d.id,
    d.project_id,
    d.name,
    d.mime,
    d.size_bytes,
    d.storage_path,
    d.visibility,
    d.created_at,
    coalesce(d.uploaded_by = auth.uid(), false),
    case
      when d.uploaded_by = auth.uid() then 'me'
      when exists (select 1 from public.profiles u where u.id = d.uploaded_by and u.role = 'admin') then 'jose'
      else 'team'
    end,
    case when private.is_admin() then d.uploaded_by end
  from public.documents d
  where d.deleted_at is null
    and private.is_project_member(d.project_id)
    and (
      private.is_admin()
      or (private.role() = 'client' and d.visibility = 'client')
      or (private.role() = 'freelance' and (d.visibility = 'team' or d.uploaded_by = auth.uid()))
    )
$$;

create view public.project_documents
with (security_invoker = true)
as
select
  id, project_id, name, mime, size_bytes, storage_path, visibility, created_at,
  uploaded_by_me, uploader, uploaded_by
from private.project_document_rows();

revoke all on public.project_documents from anon, authenticated;
grant select on public.project_documents to authenticated;

create function private.can_read_document_object(p_name text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.project_documents pd
    where pd.storage_path = p_name
  )
$$;

drop policy project_documents_select on storage.objects;

create policy project_documents_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'project-documents'
  and (select private.can_read_document_object(name))
);

create or replace function public.register_document(
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

  if p_visibility <> 'client' and v_uploader.role = 'freelance' then
    raise exception 'visibility_not_allowed' using errcode = 'P0001';
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
      v_project.client_id,
      'document_added',
      case when v_uploader.role = 'admin' then 'Jose' else 'Equipo' end,
      btrim(p_name),
      '/area/documentos?proyecto=' || p_project_id::text
    );
  end if;

  return v_id;
end;
$$;

revoke all on function private.project_progress_rows() from public, anon, authenticated;
revoke all on function private.project_overview_rows() from public, anon, authenticated;
revoke all on function private.project_task_rows() from public, anon, authenticated;
revoke all on function private.project_document_rows() from public, anon, authenticated;
revoke all on function private.can_read_document_object(text) from public, anon, authenticated;
revoke all on function public.register_document(uuid, uuid, text, text, bigint, text, public.document_visibility) from public, anon, authenticated;

grant execute on function private.project_progress_rows() to authenticated;
grant execute on function private.project_overview_rows() to authenticated;
grant execute on function private.project_task_rows() to authenticated;
grant execute on function private.project_document_rows() to authenticated;
grant execute on function private.can_read_document_object(text) to authenticated;
grant execute on function public.register_document(uuid, uuid, text, text, bigint, text, public.document_visibility) to service_role;
