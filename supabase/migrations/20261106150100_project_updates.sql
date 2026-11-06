alter type public.notification_event add value if not exists 'project_update';

create type public.update_visibility as enum ('internal', 'client');

create table public.project_updates (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  body text not null,
  visibility public.update_visibility not null default 'internal',
  created_at timestamptz not null default now(),
  constraint project_updates_body_length check (char_length(btrim(body)) between 1 and 2000)
);

create index project_updates_project_created_idx on public.project_updates (project_id, created_at desc);
create index project_updates_project_visibility_idx on public.project_updates (project_id, visibility, created_at desc);
create index project_updates_author_id_idx on public.project_updates (author_id);
create index project_updates_task_id_idx on public.project_updates (task_id);

alter table public.project_updates enable row level security;

revoke all on public.project_updates from anon, authenticated;
grant select, delete on public.project_updates to authenticated;
grant insert (project_id, task_id, body, visibility) on public.project_updates to authenticated;

create policy project_updates_select
on public.project_updates
for select
to authenticated
using (
  (select private.is_admin())
  or (
    (select private.role()) = 'freelance'
    and (select private.is_project_member(project_id))
  )
);

create policy project_updates_insert
on public.project_updates
for insert
to authenticated
with check (
  (select private.is_admin())
  or (
    (select private.role()) = 'freelance'
    and (select private.is_project_member(project_id))
  )
);

create policy project_updates_delete
on public.project_updates
for delete
to authenticated
using (
  (select private.is_admin())
  or (
    author_id = (select private.uid())
    and (select private.role()) = 'freelance'
    and (select private.is_project_member(project_id))
  )
);

create function private.project_updates_guard()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if tg_op = 'UPDATE' then
    if new.id is distinct from old.id
      or new.project_id is distinct from old.project_id
      or new.author_id is distinct from old.author_id
      or new.task_id is distinct from old.task_id
      or new.body is distinct from old.body
      or new.created_at is distinct from old.created_at
    then
      raise exception 'update_immutable' using errcode = '23514';
    end if;

    return new;
  end if;

  if auth.uid() is not null then
    new.author_id := auth.uid();
  end if;

  select * into v_project from public.projects p where p.id = new.project_id;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profiles a
    where a.id = new.author_id
      and a.is_active
      and a.archived_at is null
      and (a.role = 'admin' or (a.role = 'freelance' and v_project.freelance_id = a.id))
  ) then
    raise exception 'not_project_team' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  if new.task_id is not null and not exists (
    select 1 from public.tasks t where t.id = new.task_id and t.project_id = new.project_id
  ) then
    raise exception 'task_project_mismatch' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create function private.project_updates_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
  v_author_role public.user_role;
  v_admin uuid;
  v_excerpt text := left(new.body, 140);
begin
  select * into v_project from public.projects p where p.id = new.project_id;
  select a.role into v_author_role from public.profiles a where a.id = new.author_id;

  if tg_op = 'INSERT' and v_author_role = 'freelance' then
    select p.id into v_admin
    from public.profiles p
    where p.role = 'admin' and p.is_active and p.archived_at is null
    order by p.created_at, p.id
    limit 1;

    if v_admin is not null then
      perform private.notify(
        v_admin,
        'project_update',
        v_project.name,
        v_excerpt,
        '/admin/proyectos/' || new.project_id::text || '?tab=avances'
      );
    end if;
  end if;

  if new.visibility = 'client'
    and v_project.client_id is not null
    and (tg_op = 'INSERT' or old.visibility is distinct from 'client')
  then
    perform private.notify(
      v_project.client_id,
      'project_update',
      case when v_author_role = 'admin' then 'Jose' else 'Equipo' end,
      v_excerpt,
      '/area?proyecto=' || new.project_id::text
    );
  end if;

  return null;
end;
$$;

create trigger project_updates_guard
before insert or update on public.project_updates
for each row execute function private.project_updates_guard();

create trigger project_updates_notify
after insert or update of visibility on public.project_updates
for each row execute function private.project_updates_notify();

create trigger project_updates_audit_update
after update on public.project_updates
for each row
when (old.visibility is distinct from new.visibility)
execute function private.audit();

create function private.client_project_update_rows()
returns table (
  id uuid,
  project_id uuid,
  task_id uuid,
  body text,
  created_at timestamptz,
  author_label text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    u.id,
    u.project_id,
    u.task_id,
    u.body,
    u.created_at,
    case
      when exists (select 1 from public.profiles a where a.id = u.author_id and a.role = 'admin') then 'jose'
      else 'team'
    end
  from public.project_updates u
  join public.projects p on p.id = u.project_id
  where u.visibility = 'client'
    and (
      private.is_admin()
      or (private.role() = 'client' and p.client_id = auth.uid())
    )
$$;

create view public.client_project_updates
with (security_invoker = true)
as
select id, project_id, task_id, body, created_at, author_label
from private.client_project_update_rows();

revoke all on public.client_project_updates from anon, authenticated;
grant select on public.client_project_updates to authenticated;

create function public.set_update_visibility(p_id uuid, p_visibility public.update_visibility)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_update public.project_updates;
begin
  if p_visibility is null then
    raise exception 'invalid_visibility' using errcode = 'P0001';
  end if;

  select * into v_update from public.project_updates u where u.id = p_id for update;

  if not found then
    raise exception 'update_not_found' using errcode = 'P0001';
  end if;

  if not private.is_admin() and not (
    v_update.author_id = auth.uid()
    and private.role() = 'freelance'
    and private.is_project_member(v_update.project_id)
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.project_updates set visibility = p_visibility where id = p_id;
end;
$$;

revoke all on function private.project_updates_guard() from public, anon, authenticated;
revoke all on function private.project_updates_notify() from public, anon, authenticated;
revoke all on function private.client_project_update_rows() from public, anon, authenticated;
revoke all on function public.set_update_visibility(uuid, public.update_visibility) from public, anon, authenticated;

grant execute on function private.client_project_update_rows() to authenticated;
grant execute on function public.set_update_visibility(uuid, public.update_visibility) to authenticated;
