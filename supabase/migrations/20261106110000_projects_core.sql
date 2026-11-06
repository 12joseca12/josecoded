create type public.project_phase as enum ('discover', 'design', 'build', 'publish', 'maintain');
create type public.project_status as enum ('active', 'paused', 'closed');
create type public.task_status as enum ('todo', 'doing', 'done');
create type public.story_status as enum ('proposed', 'in_review', 'accepted', 'rejected', 'in_tasks');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id uuid references public.profiles (id) on delete restrict,
  contact_id uuid references public.contacts (id) on delete set null,
  deal_id uuid,
  offer_slug text references public.offers (slug) on delete restrict,
  brief text,
  phase public.project_phase not null default 'discover',
  status public.project_status not null default 'active',
  freelance_id uuid references public.profiles (id) on delete set null,
  started_at date,
  due_at date,
  archived_at timestamptz,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint projects_deal_fkey
    foreign key (deal_id, contact_id) references public.deals (id, contact_id) on delete restrict,
  constraint projects_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint projects_brief_length check (char_length(brief) <= 20000),
  constraint projects_deal_needs_contact check (deal_id is null or contact_id is not null),
  constraint projects_dates_ordered check (started_at is null or due_at is null or due_at >= started_at),
  constraint projects_archived_is_closed check (archived_at is null or status = 'closed')
);

create index projects_client_id_idx on public.projects (client_id);
create index projects_contact_id_idx on public.projects (contact_id);
create index projects_deal_contact_idx on public.projects (deal_id, contact_id);
create index projects_offer_slug_idx on public.projects (offer_slug);
create index projects_freelance_id_idx on public.projects (freelance_id);
create index projects_created_by_idx on public.projects (created_by);
create index projects_created_at_idx on public.projects (created_at desc);

create table public.stories (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  title text not null,
  as_a text not null,
  i_want text not null,
  so_that text not null,
  criteria text[] not null default '{}',
  status public.story_status not null default 'proposed',
  out_of_scope boolean not null default false,
  estimate_hours numeric(6, 1),
  estimate_amount numeric(12, 2),
  decision_note text,
  decided_by uuid references public.profiles (id) on delete set null,
  decided_at timestamptz,
  confirmed_at timestamptz,
  task_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stories_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint stories_text_length check (
    char_length(btrim(as_a)) between 1 and 500
    and char_length(btrim(i_want)) between 1 and 500
    and char_length(btrim(so_that)) between 1 and 500
  ),
  constraint stories_criteria_size check (
    cardinality(criteria) <= 12
    and char_length(array_to_string(criteria, '')) <= 6000
    and array_position(criteria, '') is null
  ),
  constraint stories_estimate_range check (
    (estimate_hours is null or (estimate_hours >= 0 and estimate_hours < 10000))
    and (estimate_amount is null or (estimate_amount >= 0 and estimate_amount < 10000000))
  ),
  constraint stories_note_length check (char_length(decision_note) <= 2000),
  constraint stories_review_needs_estimate check (
    status <> 'in_review' or (estimate_hours > 0 and estimate_amount > 0)
  ),
  constraint stories_confirmed_when_accepted check (confirmed_at is null or status = 'accepted')
);

create index stories_project_id_idx on public.stories (project_id, created_at desc);
create index stories_author_id_idx on public.stories (author_id);
create index stories_decided_by_idx on public.stories (decided_by);
create index stories_task_id_idx on public.stories (task_id);
create index stories_status_idx on public.stories (status);

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  phase public.project_phase not null,
  title text not null,
  description text,
  status public.task_status not null default 'todo',
  assignee_id uuid references public.profiles (id) on delete set null,
  story_id uuid references public.stories (id) on delete set null,
  sort integer not null default 0,
  done_at timestamptz,
  done_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_title_length check (char_length(btrim(title)) between 1 and 200),
  constraint tasks_description_length check (char_length(description) <= 5000),
  constraint tasks_done_consistent check ((status = 'done') = (done_at is not null))
);

create index tasks_project_phase_sort_idx on public.tasks (project_id, phase, sort);
create index tasks_assignee_id_idx on public.tasks (assignee_id);
create index tasks_story_id_idx on public.tasks (story_id);
create index tasks_done_by_idx on public.tasks (done_by);

alter table public.stories
  add constraint stories_task_id_fkey foreign key (task_id) references public.tasks (id) on delete set null;

alter table public.invitations
  add constraint invitations_project_id_fkey
  foreign key (project_id) references public.projects (id) on delete set null;

create index invitations_project_id_idx on public.invitations (project_id);

alter table public.projects enable row level security;
alter table public.tasks enable row level security;
alter table public.stories enable row level security;

revoke all on public.projects from anon, authenticated;
revoke all on public.tasks from anon, authenticated;
revoke all on public.stories from anon, authenticated;

create function private.is_project_member(p_project_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_admin()
    or exists (
      select 1
      from public.projects p
      where p.id = p_project_id
        and (
          (p.client_id = auth.uid() and private.role() = 'client')
          or (p.freelance_id = auth.uid() and private.role() = 'freelance' and private.is_aal2())
        )
    )
$$;

create function private.projects_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE' and new.id is distinct from old.id then
    raise exception 'project_id_immutable' using errcode = '23514';
  end if;

  if new.client_id is not null
    and (tg_op = 'INSERT' or new.client_id is distinct from old.client_id)
    and not exists (
      select 1
      from public.profiles p
      where p.id = new.client_id and p.role = 'client' and p.is_active and p.archived_at is null
    )
  then
    raise exception 'invalid_client' using errcode = 'P0001';
  end if;

  if new.freelance_id is not null
    and (tg_op = 'INSERT' or new.freelance_id is distinct from old.freelance_id)
    and not exists (
      select 1
      from public.profiles p
      where p.id = new.freelance_id and p.role = 'freelance' and p.is_active and p.archived_at is null
    )
  then
    raise exception 'invalid_freelance' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create function private.tasks_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if tg_op = 'UPDATE' and new.project_id is distinct from old.project_id then
    raise exception 'task_project_immutable' using errcode = '23514';
  end if;

  if new.story_id is not null and not exists (
    select 1 from public.stories s where s.id = new.story_id and s.project_id = new.project_id
  ) then
    raise exception 'story_project_mismatch' using errcode = 'P0001';
  end if;

  if new.assignee_id is not null
    and (tg_op = 'INSERT' or new.assignee_id is distinct from old.assignee_id)
  then
    select * into v_project from public.projects p where p.id = new.project_id;

    if new.assignee_id is distinct from v_project.client_id
      and new.assignee_id is distinct from v_project.freelance_id
    then
      raise exception 'invalid_assignee' using errcode = 'P0001';
    end if;
  end if;

  if new.status = 'done' then
    if tg_op = 'INSERT' or old.status is distinct from 'done' then
      new.done_at := now();
      new.done_by := coalesce(new.done_by, auth.uid());
    end if;
  else
    new.done_at := null;
    new.done_by := null;
  end if;

  return new;
end;
$$;

create trigger projects_guard
before insert or update on public.projects
for each row execute function private.projects_guard();

create trigger projects_set_updated_at
before update on public.projects
for each row execute function private.set_updated_at();

create trigger projects_audit_insert
after insert on public.projects
for each row execute function private.audit();

create trigger projects_audit_update
after update on public.projects
for each row
when (
  old.phase is distinct from new.phase
  or old.client_id is distinct from new.client_id
  or old.freelance_id is distinct from new.freelance_id
  or old.status is distinct from new.status
  or old.archived_at is distinct from new.archived_at
)
execute function private.audit();

create trigger projects_audit_delete
after delete on public.projects
for each row execute function private.audit();

create trigger tasks_guard
before insert or update on public.tasks
for each row execute function private.tasks_guard();

create trigger tasks_set_updated_at
before update on public.tasks
for each row execute function private.set_updated_at();

create trigger stories_set_updated_at
before update on public.stories
for each row execute function private.set_updated_at();

create trigger stories_audit_update
after update on public.stories
for each row
when (old.status is distinct from new.status)
execute function private.audit();

grant select on public.projects to authenticated;
grant update (name, brief, offer_slug, status, started_at, due_at) on public.projects to authenticated;
grant select on public.tasks to authenticated;
grant select, delete on public.stories to authenticated;
grant insert (project_id, author_id, title, as_a, i_want, so_that, criteria) on public.stories to authenticated;
grant update (title, as_a, i_want, so_that, criteria) on public.stories to authenticated;

create policy projects_select
on public.projects
for select
to authenticated
using (
  (select private.is_admin())
  or (client_id = (select private.uid()) and (select private.role()) = 'client')
);

create policy projects_update_admin
on public.projects
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy tasks_select
on public.tasks
for select
to authenticated
using ((select private.is_project_member(project_id)));

create policy stories_select
on public.stories
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.projects p
    where p.id = stories.project_id
      and p.client_id = (select private.uid())
      and (select private.role()) = 'client'
  )
);

create policy stories_insert_client
on public.stories
for insert
to authenticated
with check (
  author_id = (select private.uid())
  and (select private.role()) = 'client'
  and exists (
    select 1
    from public.projects p
    where p.id = stories.project_id
      and p.client_id = (select private.uid())
      and p.archived_at is null
  )
);

create policy stories_update_client
on public.stories
for update
to authenticated
using (
  author_id = (select private.uid())
  and status = 'proposed'
  and (select private.role()) = 'client'
)
with check (
  author_id = (select private.uid())
  and status = 'proposed'
);

create policy stories_delete_client
on public.stories
for delete
to authenticated
using (
  author_id = (select private.uid())
  and status = 'proposed'
  and (select private.role()) = 'client'
);

create view public.project_progress
with (security_invoker = true)
as
select
  p.id as project_id,
  (count(t.id) filter (where t.status = 'done'))::integer as done,
  (count(t.id))::integer as total,
  case
    when count(t.id) = 0 then 0
    else round(100.0 * count(t.id) filter (where t.status = 'done') / count(t.id))::integer
  end as percent
from public.projects p
left join public.tasks t on t.project_id = p.id
group by p.id;

create view public.project_overview
with (security_invoker = true)
as
select
  p.id,
  p.name,
  p.client_id,
  c.full_name as client_name,
  p.contact_id,
  p.deal_id,
  p.offer_slug,
  p.phase,
  p.status,
  p.freelance_id,
  f.full_name as freelance_name,
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
  ) as stories_to_decide
from public.projects p
join public.project_progress pr on pr.project_id = p.id
left join public.profiles c on c.id = p.client_id
left join public.profiles f on f.id = p.freelance_id;

create function private.freelance_project_rows()
returns table (
  id uuid,
  name text,
  brief text,
  phase public.project_phase,
  status public.project_status,
  started_at date,
  due_at date,
  archived_at timestamptz,
  created_at timestamptz,
  done integer,
  total integer,
  percent integer
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id, p.name, p.brief, p.phase, p.status, p.started_at, p.due_at, p.archived_at, p.created_at,
    pr.done, pr.total, pr.percent
  from public.projects p
  join public.project_progress pr on pr.project_id = p.id
  where private.role() = 'freelance'
    and private.is_aal2()
    and p.freelance_id = auth.uid()
$$;

create view public.freelance_projects
with (security_invoker = true)
as
select id, name, brief, phase, status, started_at, due_at, archived_at, created_at, done, total, percent
from private.freelance_project_rows();

revoke all on public.project_progress from anon, authenticated;
revoke all on public.project_overview from anon, authenticated;
revoke all on public.freelance_projects from anon, authenticated;
grant select on public.project_progress to authenticated;
grant select on public.project_overview to authenticated;
grant select on public.freelance_projects to authenticated;

create function public.create_project(
  p_name text,
  p_contact_id uuid default null,
  p_deal_id uuid default null,
  p_offer_slug text default null,
  p_brief text default null,
  p_freelance_id uuid default null,
  p_started_at date default null,
  p_due_at date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact_id uuid := p_contact_id;
  v_deal public.deals;
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_name is null or char_length(btrim(p_name)) not between 1 and 200 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  if p_deal_id is not null then
    select * into v_deal from public.deals d where d.id = p_deal_id;

    if not found then
      raise exception 'deal_not_found' using errcode = 'P0001';
    end if;

    if v_deal.stage <> 'won' then
      raise exception 'deal_not_won' using errcode = 'P0001';
    end if;

    if v_contact_id is not null and v_contact_id <> v_deal.contact_id then
      raise exception 'contact_deal_mismatch' using errcode = 'P0001';
    end if;

    v_contact_id := v_deal.contact_id;
  end if;

  if v_contact_id is not null and not exists (select 1 from public.contacts c where c.id = v_contact_id) then
    raise exception 'contact_not_found' using errcode = 'P0001';
  end if;

  if p_offer_slug is not null and not exists (select 1 from public.offers o where o.slug = p_offer_slug) then
    raise exception 'offer_not_found' using errcode = 'P0001';
  end if;

  if p_started_at is not null and p_due_at is not null and p_due_at < p_started_at then
    raise exception 'invalid_dates' using errcode = 'P0001';
  end if;

  insert into public.projects (
    name, contact_id, deal_id, offer_slug, brief, freelance_id, started_at, due_at, created_by
  )
  values (
    btrim(p_name), v_contact_id, p_deal_id, p_offer_slug, p_brief, p_freelance_id, p_started_at, p_due_at,
    auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create function public.set_project_phase(p_id uuid, p_phase public.project_phase)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_project from public.projects p where p.id = p_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  update public.projects set phase = p_phase where id = p_id;
end;
$$;

create function public.set_project_client(p_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_project from public.projects p where p.id = p_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  if p_user_id is null or not exists (
    select 1
    from public.profiles pr
    where pr.id = p_user_id and pr.role = 'client' and pr.is_active and pr.archived_at is null
  ) then
    raise exception 'invalid_client' using errcode = 'P0001';
  end if;

  if v_project.client_id is not null and v_project.client_id <> p_user_id then
    update public.tasks set assignee_id = null
    where project_id = p_id and assignee_id = v_project.client_id;
  end if;

  update public.projects set client_id = p_user_id where id = p_id;
end;
$$;

create function public.set_project_freelance(p_id uuid, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_project from public.projects p where p.id = p_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  if p_user_id is not null and not exists (
    select 1
    from public.profiles pr
    where pr.id = p_user_id and pr.role = 'freelance' and pr.is_active and pr.archived_at is null
  ) then
    raise exception 'invalid_freelance' using errcode = 'P0001';
  end if;

  if v_project.freelance_id is not null and v_project.freelance_id is distinct from p_user_id then
    update public.tasks set assignee_id = null
    where project_id = p_id and assignee_id = v_project.freelance_id;
  end if;

  update public.projects set freelance_id = p_user_id where id = p_id;
end;
$$;

create function public.archive_project(p_id uuid, p_archived boolean default true)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_archived then
    update public.projects
    set archived_at = coalesce(archived_at, now()), status = 'closed'
    where id = p_id;
  else
    update public.projects
    set archived_at = null, status = 'active'
    where id = p_id;
  end if;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;
end;
$$;

create function public.upsert_task(
  p_project_id uuid,
  p_title text,
  p_phase public.project_phase,
  p_id uuid default null,
  p_description text default null,
  p_status public.task_status default 'todo',
  p_assignee_id uuid default null,
  p_story_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_project public.projects;
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_title is null or char_length(btrim(p_title)) not between 1 and 200 then
    raise exception 'invalid_title' using errcode = 'P0001';
  end if;

  select * into v_project from public.projects p where p.id = p_project_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if p_id is null then
    insert into public.tasks (project_id, phase, title, description, status, assignee_id, story_id, sort)
    values (
      p_project_id, p_phase, btrim(p_title), p_description, p_status, p_assignee_id, p_story_id,
      coalesce((select max(t.sort) + 1 from public.tasks t where t.project_id = p_project_id and t.phase = p_phase), 0)
    )
    returning id into v_id;

    return v_id;
  end if;

  select * into v_task from public.tasks t where t.id = p_id for update;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0001';
  end if;

  if v_task.project_id <> p_project_id then
    raise exception 'task_project_mismatch' using errcode = 'P0001';
  end if;

  update public.tasks
  set title = btrim(p_title),
      phase = p_phase,
      description = p_description,
      status = p_status,
      assignee_id = p_assignee_id,
      story_id = p_story_id,
      sort = case
        when phase is distinct from p_phase
          then coalesce((select max(t.sort) + 1 from public.tasks t where t.project_id = p_project_id and t.phase = p_phase), 0)
        else sort
      end
  where id = p_id;

  return p_id;
end;
$$;

create function public.move_task(p_id uuid, p_phase public.project_phase, p_sort integer)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
  v_ids uuid[];
  v_position integer := greatest(coalesce(p_sort, 0), 0);
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_task from public.tasks t where t.id = p_id for update;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0001';
  end if;

  select coalesce(array_agg(t.id order by t.sort, t.created_at, t.id), '{}')
  into v_ids
  from public.tasks t
  where t.project_id = v_task.project_id and t.phase = p_phase and t.id <> p_id;

  v_position := least(v_position, cardinality(v_ids));
  v_ids := v_ids[1:v_position] || p_id || v_ids[v_position + 1:];

  update public.tasks set phase = p_phase where id = p_id and phase <> p_phase;

  update public.tasks t
  set sort = o.position - 1
  from unnest(v_ids) with ordinality as o (id, position)
  where t.id = o.id and t.sort is distinct from o.position - 1;
end;
$$;

create function public.delete_task(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_task from public.tasks t where t.id = p_id for update;

  if not found then
    raise exception 'task_not_found' using errcode = 'P0001';
  end if;

  if v_task.status <> 'todo' or v_task.story_id is not null then
    raise exception 'task_not_deletable' using errcode = 'P0001';
  end if;

  delete from public.tasks where id = p_id;
end;
$$;

create function public.complete_my_task(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  select * into v_task from public.tasks t where t.id = p_id for update;

  if not found or not private.is_project_member(v_task.project_id) or private.is_admin() then
    raise exception 'task_not_found' using errcode = 'P0001';
  end if;

  if v_task.assignee_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_task.status <> 'done' then
    update public.tasks set status = 'done' where id = p_id;
  end if;
end;
$$;

create function public.decide_story(
  p_id uuid,
  p_decision text,
  p_hours numeric default null,
  p_amount numeric default null,
  p_note text default null,
  p_create_task boolean default false
)
returns public.story_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_story public.stories;
  v_project public.projects;
  v_status public.story_status;
  v_task_id uuid;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_decision is null or p_decision not in ('accept', 'reject', 'out_of_scope') then
    raise exception 'invalid_decision' using errcode = 'P0001';
  end if;

  select * into v_story from public.stories s where s.id = p_id for update;

  if not found then
    raise exception 'story_not_found' using errcode = 'P0001';
  end if;

  if v_story.status <> 'proposed' then
    raise exception 'story_not_proposed' using errcode = 'P0001';
  end if;

  select * into v_project from public.projects p where p.id = v_story.project_id;

  if p_decision = 'reject' and v_note is null then
    raise exception 'note_required' using errcode = 'P0001';
  end if;

  if p_decision = 'out_of_scope' and (coalesce(p_hours, 0) <= 0 or coalesce(p_amount, 0) <= 0) then
    raise exception 'estimate_required' using errcode = 'P0001';
  end if;

  if p_decision = 'accept' then
    v_status := 'accepted';

    if p_create_task then
      insert into public.tasks (project_id, phase, title, description, story_id, sort)
      values (
        v_story.project_id, v_project.phase, v_story.title, v_story.i_want, v_story.id,
        coalesce((select max(t.sort) + 1 from public.tasks t where t.project_id = v_story.project_id and t.phase = v_project.phase), 0)
      )
      returning id into v_task_id;

      v_status := 'in_tasks';
    end if;
  elsif p_decision = 'reject' then
    v_status := 'rejected';
  else
    v_status := 'in_review';
  end if;

  update public.stories
  set status = v_status,
      out_of_scope = (p_decision = 'out_of_scope'),
      estimate_hours = p_hours,
      estimate_amount = p_amount,
      decision_note = v_note,
      decided_by = auth.uid(),
      decided_at = now(),
      task_id = v_task_id
  where id = p_id;

  return v_status;
end;
$$;

create function public.confirm_story(p_id uuid, p_accept boolean default true)
returns public.story_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_story public.stories;
  v_status public.story_status;
begin
  select * into v_story from public.stories s where s.id = p_id for update;

  if not found then
    raise exception 'story_not_found' using errcode = 'P0001';
  end if;

  if private.role() is distinct from 'client' or v_story.author_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_story.status <> 'in_review' then
    raise exception 'story_not_in_review' using errcode = 'P0001';
  end if;

  v_status := case when coalesce(p_accept, true) then 'accepted' else 'rejected' end;

  update public.stories
  set status = v_status,
      confirmed_at = case when v_status = 'accepted' then now() end
  where id = p_id;

  return v_status;
end;
$$;

revoke all on function private.is_project_member(uuid) from public, anon, authenticated;
revoke all on function private.projects_guard() from public, anon, authenticated;
revoke all on function private.tasks_guard() from public, anon, authenticated;
revoke all on function private.freelance_project_rows() from public, anon, authenticated;
revoke all on function public.create_project(text, uuid, uuid, text, text, uuid, date, date) from public, anon, authenticated;
revoke all on function public.set_project_phase(uuid, public.project_phase) from public, anon, authenticated;
revoke all on function public.set_project_client(uuid, uuid) from public, anon, authenticated;
revoke all on function public.set_project_freelance(uuid, uuid) from public, anon, authenticated;
revoke all on function public.archive_project(uuid, boolean) from public, anon, authenticated;
revoke all on function public.upsert_task(uuid, text, public.project_phase, uuid, text, public.task_status, uuid, uuid) from public, anon, authenticated;
revoke all on function public.move_task(uuid, public.project_phase, integer) from public, anon, authenticated;
revoke all on function public.delete_task(uuid) from public, anon, authenticated;
revoke all on function public.complete_my_task(uuid) from public, anon, authenticated;
revoke all on function public.decide_story(uuid, text, numeric, numeric, text, boolean) from public, anon, authenticated;
revoke all on function public.confirm_story(uuid, boolean) from public, anon, authenticated;

grant execute on function private.is_project_member(uuid) to authenticated;
grant execute on function private.freelance_project_rows() to authenticated;
grant execute on function public.create_project(text, uuid, uuid, text, text, uuid, date, date) to authenticated;
grant execute on function public.set_project_phase(uuid, public.project_phase) to authenticated;
grant execute on function public.set_project_client(uuid, uuid) to authenticated;
grant execute on function public.set_project_freelance(uuid, uuid) to authenticated;
grant execute on function public.archive_project(uuid, boolean) to authenticated;
grant execute on function public.upsert_task(uuid, text, public.project_phase, uuid, text, public.task_status, uuid, uuid) to authenticated;
grant execute on function public.move_task(uuid, public.project_phase, integer) to authenticated;
grant execute on function public.delete_task(uuid) to authenticated;
grant execute on function public.complete_my_task(uuid) to authenticated;
grant execute on function public.decide_story(uuid, text, numeric, numeric, text, boolean) to authenticated;
grant execute on function public.confirm_story(uuid, boolean) to authenticated;
