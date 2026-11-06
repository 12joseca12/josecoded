create table public.project_links (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  url text not null,
  usage text,
  sort integer not null default 0,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint project_links_name_length check (char_length(btrim(name)) between 1 and 80),
  constraint project_links_url_https check (
    char_length(url) <= 2048 and url ~ '^https://[^\s/$.?#].[^\s]*$'
  ),
  constraint project_links_usage_length check (char_length(usage) <= 280),
  constraint project_links_project_url_key unique (project_id, url)
);

create index project_links_project_sort_idx on public.project_links (project_id, sort);
create index project_links_created_by_idx on public.project_links (created_by);

alter table public.project_links enable row level security;

revoke all on public.project_links from anon, authenticated;
grant select, delete on public.project_links to authenticated;
grant insert (project_id, name, url, usage) on public.project_links to authenticated;
grant update (name, url, usage) on public.project_links to authenticated;

create policy project_links_select
on public.project_links
for select
to authenticated
using ((select private.is_project_member(project_id)));

create policy project_links_insert_admin
on public.project_links
for insert
to authenticated
with check ((select private.is_admin()));

create policy project_links_update_admin
on public.project_links
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create policy project_links_delete_admin
on public.project_links
for delete
to authenticated
using ((select private.is_admin()));

create function private.project_links_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    new.sort := coalesce(
      (select max(l.sort) + 1 from public.project_links l where l.project_id = new.project_id),
      0
    );
    new.created_by := auth.uid();
  else
    new.url := btrim(new.url);
  end if;

  new.name := btrim(new.name);

  return new;
end;
$$;

create trigger project_links_guard
before insert or update on public.project_links
for each row execute function private.project_links_guard();

create trigger project_links_set_updated_at
before update on public.project_links
for each row execute function private.set_updated_at();

create trigger project_links_audit_insert
after insert on public.project_links
for each row execute function private.audit();

create trigger project_links_audit_update
after update on public.project_links
for each row
when (
  old.name is distinct from new.name
  or old.url is distinct from new.url
  or old.usage is distinct from new.usage
)
execute function private.audit();

create trigger project_links_audit_delete
after delete on public.project_links
for each row execute function private.audit();

create function public.reorder_project_links(p_project_id uuid, p_ids uuid[])
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.projects p where p.id = p_project_id) then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if p_ids is null
    or cardinality(p_ids) <> (select count(*) from public.project_links l where l.project_id = p_project_id)
    or cardinality(p_ids) <> (select count(distinct x) from unnest(p_ids) x)
    or exists (
      select 1
      from unnest(p_ids) x
      where not exists (select 1 from public.project_links l where l.id = x and l.project_id = p_project_id)
    )
  then
    raise exception 'ids_mismatch' using errcode = 'P0001';
  end if;

  update public.project_links l
  set sort = o.position - 1
  from unnest(p_ids) with ordinality as o (id, position)
  where l.id = o.id
    and l.project_id = p_project_id
    and l.sort is distinct from o.position - 1;
end;
$$;

revoke all on function private.project_links_guard() from public, anon, authenticated;
revoke all on function public.reorder_project_links(uuid, uuid[]) from public, anon, authenticated;
grant execute on function public.reorder_project_links(uuid, uuid[]) to authenticated;
