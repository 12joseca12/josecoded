-- Task 1.8e (plan v3.4; DATOS v1.4 §14.2, §14.3, §14.4, §14.7 migration 4; D52). The client proposes user stories that
-- the admin or the owner closer accepts, estimates and turns into tasks. The same migration extends the client area for
-- closers (policies with owns_client) and carries the security-review additions: comment.client outbox event, the
-- asset.uploaded event moved to the moment the file really exists, an upload quota and CHECKs on client_assets, and
-- area_client() so the web stops selecting «clients … limit 1».

create type public.story_status as enum ('proposed', 'accepted', 'rejected', 'converted');

create table public.client_user_stories (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  author_user_id      uuid references auth.users (id) on delete set null,
  title               text not null check (char_length(title) between 1 and 140),
  as_a                text not null check (btrim(as_a) <> ''),
  i_want              text not null check (btrim(i_want) <> ''),
  so_that             text not null check (btrim(so_that) <> ''),
  acceptance_criteria text[] not null default '{}' check (cardinality(acceptance_criteria) <= 12),
  status              public.story_status not null default 'proposed',
  estimate_hours      numeric(6, 1) check (estimate_hours >= 0 and estimate_hours <> 'NaN'),
  estimate_amount     numeric(10, 2) check (estimate_amount >= 0 and estimate_amount <> 'NaN'),
  estimate_note       text,
  decided_by          uuid references auth.users (id) on delete set null,
  decided_at          timestamptz,
  task_id             uuid references public.client_tasks (id) on delete set null,
  sort                integer,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table public.client_user_stories enable row level security;
create index idx_client_user_stories_client_status on public.client_user_stories (client_id, status);
create index idx_client_user_stories_author on public.client_user_stories (author_user_id);
create index idx_client_user_stories_decided_by on public.client_user_stories (decided_by);
create index idx_client_user_stories_task on public.client_user_stories (task_id);
create trigger client_user_stories_set_updated_at before update on public.client_user_stories
  for each row execute function private.set_updated_at();

alter table public.client_tasks
  add column story_id uuid references public.client_user_stories (id) on delete set null;
create index idx_client_tasks_story on public.client_tasks (story_id);

-- Client: its own stories; proposes as itself and edits the text only while the story is «proposed». Closer owner and
-- admin read. Decisions go through accept_user_story/reject_user_story/convert_user_story only (no grant on status).
create policy client_user_stories_select on public.client_user_stories for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()) or (select private.owns_client(client_id)));
create policy client_user_stories_insert on public.client_user_stories for insert to authenticated
  with check ((client_id = (select private.client_id_of()) and author_user_id = (select auth.uid()))
              or (select private.is_admin()));
create policy client_user_stories_update on public.client_user_stories for update to authenticated
  using ((client_id = (select private.client_id_of()) and status = 'proposed') or (select private.is_admin()))
  with check ((client_id = (select private.client_id_of()) and status = 'proposed') or (select private.is_admin()));
grant select on public.client_user_stories to authenticated;
grant insert (client_id, author_user_id, title, as_a, i_want, so_that, acceptance_criteria, sort) on public.client_user_stories to authenticated;
grant update (title, as_a, i_want, so_that, acceptance_criteria, sort) on public.client_user_stories to authenticated;

-- story.proposed: the admin and the owner closer hear about it; the contact's timeline records it.
create or replace function private.client_user_stories_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_contact uuid;
  v_owner   uuid;
begin
  select c.contact_id, ct.owner_id into v_contact, v_owner
    from public.clients c join public.crm_contacts ct on ct.id = c.contact_id where c.id = new.client_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
  values (v_contact, 'story_proposed', 'in', 'contact', new.title, jsonb_build_object('story_id', new.id));
  perform private.enqueue('story.proposed', jsonb_build_object(
    'story_id', new.id, 'client_id', new.client_id, 'owner_id', v_owner, 'title', new.title));
  return null;
end $$;
revoke all on function private.client_user_stories_after_insert() from public, anon, authenticated;
create trigger client_user_stories_after_insert after insert on public.client_user_stories
  for each row when (new.status = 'proposed') execute function private.client_user_stories_after_insert();

-- Task text of a story: «Como … quiero … para …» plus the acceptance criteria.
create or replace function private.story_to_task(p_story public.client_user_stories) returns uuid
language plpgsql set search_path = '' as $$
declare v_id uuid;
begin
  insert into public.client_tasks (client_id, title, description, status, sort, story_id)
  values (p_story.client_id, p_story.title,
          'Como ' || p_story.as_a || ' quiero ' || p_story.i_want || ' para ' || p_story.so_that
            || case when cardinality(p_story.acceptance_criteria) > 0
                    then E'\n\nCriterios de aceptación:\n- ' || array_to_string(p_story.acceptance_criteria, E'\n- ') else '' end,
          'pending',
          coalesce((select max(t.sort) from public.client_tasks t where t.client_id = p_story.client_id), 0) + 1,
          p_story.id)
  returning id into v_id;
  return v_id;
end $$;
revoke all on function private.story_to_task(public.client_user_stories) from public, anon, authenticated;

-- Accept (with estimate): optionally creates the task and leaves the story «converted». Admin or the owner closer.
create or replace function private.accept_user_story_impl(
  p_story_id uuid, p_estimate_hours numeric, p_estimate_amount numeric, p_note text, p_create_task boolean)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s         public.client_user_stories;
  v_task    uuid;
  v_contact uuid;
begin
  select * into s from public.client_user_stories x where x.id = p_story_id for update;
  if s.id is null then raise exception 'story_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_client(s.client_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if s.status <> 'proposed' then raise exception 'story_not_proposed' using errcode = '22023'; end if;
  -- an acceptance is a commitment with hours: the estimate is not optional (the amount is), nor is the note an essay
  if p_estimate_hours is null or p_estimate_hours <= 0 or p_estimate_hours = 'NaN' or p_estimate_amount = 'NaN' then raise exception 'estimate_required' using errcode = '22023'; end if;
  if char_length(coalesce(p_note, '')) > 1000 then raise exception 'note_too_long' using errcode = '22023'; end if;

  update public.client_user_stories set estimate_hours = p_estimate_hours, estimate_amount = p_estimate_amount,
         estimate_note = p_note, decided_by = (select auth.uid()), decided_at = now(), status = 'accepted'
   where id = s.id returning * into s;
  if coalesce(p_create_task, true) then
    v_task := private.story_to_task(s);
    update public.client_user_stories set status = 'converted', task_id = v_task where id = s.id returning * into s;
  end if;

  select c.contact_id into v_contact from public.clients c where c.id = s.client_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
  values (v_contact, 'story_decided', 'internal', private.staff_actor(), s.title, jsonb_build_object('story_id', s.id, 'status', s.status));
  perform private.enqueue('story.decided', jsonb_build_object('story_id', s.id, 'client_id', s.client_id, 'status', s.status));
  return v_task;
end $$;
revoke all on function private.accept_user_story_impl(uuid, numeric, numeric, text, boolean) from public, anon, authenticated;
grant execute on function private.accept_user_story_impl(uuid, numeric, numeric, text, boolean) to authenticated, service_role;

create or replace function public.accept_user_story(
  p_story_id uuid, p_estimate_hours numeric, p_estimate_amount numeric, p_note text, p_create_task boolean default true)
returns uuid language sql security invoker set search_path = '' as $$
  select private.accept_user_story_impl(p_story_id, p_estimate_hours, p_estimate_amount, p_note, p_create_task)
$$;
revoke all on function public.accept_user_story(uuid, numeric, numeric, text, boolean) from public, anon, authenticated;
grant execute on function public.accept_user_story(uuid, numeric, numeric, text, boolean) to authenticated;

create or replace function private.reject_user_story_impl(p_story_id uuid, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare
  s         public.client_user_stories;
  v_contact uuid;
begin
  select * into s from public.client_user_stories x where x.id = p_story_id for update;
  if s.id is null then raise exception 'story_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_client(s.client_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if s.status <> 'proposed' then raise exception 'story_not_proposed' using errcode = '22023'; end if;
  -- the client reads the reason as it is written: a rejection without one is not accepted
  if btrim(coalesce(p_note, '')) = '' then raise exception 'reason_required' using errcode = '22023'; end if;
  if char_length(p_note) > 1000 then raise exception 'note_too_long' using errcode = '22023'; end if;
  update public.client_user_stories set status = 'rejected', estimate_note = p_note, decided_by = (select auth.uid()),
         decided_at = now()
   where id = s.id;
  select c.contact_id into v_contact from public.clients c where c.id = s.client_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, body, payload)
  values (v_contact, 'story_decided', 'internal', private.staff_actor(), s.title, jsonb_build_object('story_id', s.id, 'status', 'rejected'));
  perform private.enqueue('story.decided', jsonb_build_object('story_id', s.id, 'client_id', s.client_id, 'status', 'rejected'));
end $$;
revoke all on function private.reject_user_story_impl(uuid, text) from public, anon, authenticated;
grant execute on function private.reject_user_story_impl(uuid, text) to authenticated, service_role;

create or replace function public.reject_user_story(p_story_id uuid, p_note text) returns void
language sql security invoker set search_path = '' as $$
  select private.reject_user_story_impl(p_story_id, p_note)
$$;
revoke all on function public.reject_user_story(uuid, text) from public, anon, authenticated;
grant execute on function public.reject_user_story(uuid, text) to authenticated;

-- An accepted story whose estimate was agreed outside the web becomes a task now.
create or replace function private.convert_user_story_impl(p_story_id uuid) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  s      public.client_user_stories;
  v_task uuid;
begin
  select * into s from public.client_user_stories x where x.id = p_story_id for update;
  if s.id is null then raise exception 'story_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_client(s.client_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if s.status <> 'accepted' then raise exception 'story_not_accepted' using errcode = '22023'; end if;
  v_task := private.story_to_task(s);
  update public.client_user_stories set status = 'converted', task_id = v_task where id = s.id;
  return v_task;
end $$;
revoke all on function private.convert_user_story_impl(uuid) from public, anon, authenticated;
grant execute on function private.convert_user_story_impl(uuid) to authenticated, service_role;

create or replace function public.convert_user_story(p_story_id uuid) returns uuid
language sql security invoker set search_path = '' as $$
  select private.convert_user_story_impl(p_story_id)
$$;
revoke all on function public.convert_user_story(uuid) from public, anon, authenticated;
grant execute on function public.convert_user_story(uuid) to authenticated;

-- Area policies for the owner closer (select only; writes of the closer are RPCs). Internal comments stay admin-only.
drop policy client_tasks_select on public.client_tasks;
create policy client_tasks_select on public.client_tasks for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()) or (select private.owns_client(client_id)));
drop policy client_task_comments_select on public.client_task_comments;
create policy client_task_comments_select on public.client_task_comments for select to authenticated
  using (((client_id = (select private.client_id_of()) or (select private.owns_client(client_id))) and not internal)
         or (select private.is_admin()));
-- The material is the client's own (briefs, logos, access notes): the owner closer does not read it, only the client and
-- the admin (DATOS §14.3). Same predicate as before this migration, restated here so the policy has no closer branch.
drop policy client_assets_select on public.client_assets;
create policy client_assets_select on public.client_assets for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()));

-- Closer counters for K1: own portfolio (the admin: his own, null owner; commissions: all, he is the payer).
create or replace function private.crm_my_counters_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare
  v_uid   uuid := (select auth.uid());
  v_admin boolean := private.is_admin();
  v_owner uuid;
begin
  if not (v_admin or private.is_closer()) then raise exception 'forbidden' using errcode = '42501'; end if;
  v_owner := case when v_admin then null else v_uid end;
  return jsonb_build_object(
    'contacts_due',     (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.next_action_at <= now() and c.owner_id is not distinct from v_owner),
    'leads_open',       (select count(*) from public.leads l join public.crm_contacts c on c.id = l.contact_id
                          where l.status = 'open' and c.owner_id is not distinct from v_owner),
    'stories_proposed', (select count(*) from public.client_user_stories s
                          join public.clients cl on cl.id = s.client_id join public.crm_contacts c on c.id = cl.contact_id
                          where s.status = 'proposed' and c.owner_id is not distinct from v_owner),
    'commissions_pending', (select count(*) from public.closer_commissions k
                             where k.status = 'pending' and (v_admin or k.closer_id = v_uid)),
    'commissions_approved_amount', (select coalesce(sum(k.amount), 0) from public.closer_commissions k
                                     where k.status = 'approved' and (v_admin or k.closer_id = v_uid)),
    'conflicts_pending', (select count(*) from public.crm_import_conflicts k
                           where k.status = 'pending' and k.owner_id = v_uid),
    'imports_last',     (select to_jsonb(x) from (
                           select i.id, i.created_count as created, i.updated_count as updated,
                                  i.skipped_count as skipped, i.conflicts_count as conflicts, i.created_at
                             from public.crm_imports i where i.owner_id = v_uid
                            order by i.created_at desc, i.id limit 1) x)
  );
end $$;
revoke all on function private.crm_my_counters_impl() from public, anon, authenticated;
grant execute on function private.crm_my_counters_impl() to authenticated, service_role;

create or replace function public.crm_my_counters() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.crm_my_counters_impl()
$$;
revoke all on function public.crm_my_counters() from public, anon, authenticated;
grant execute on function public.crm_my_counters() to authenticated;

-- C1 counters, now with the stories.
create or replace function private.admin_counters_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'leads_open',       (select count(*) from public.leads l where l.status = 'open'),
    'contacts_due',     (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.next_action_at <= now()),
    'chat_unread',      (select count(*) from public.chat_threads t where t.unread_for_admin),
    'agencies_replied', (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.kind = 'agency' and c.status = 'replied'),
    'comments_pending', (select count(*) from public.blog_comments b where b.status = 'pending'),
    'upgrades_pending', (select count(*) from public.upgrade_requests u where u.status = 'pending'),
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending'),
    'commissions_pending',       (select count(*) from public.closer_commissions k where k.status = 'pending'),
    'imports_failed_24h',        (select count(*) from public.crm_imports i
                                   where i.status = 'failed' and i.created_at > now() - interval '24 hours'),
    'import_conflicts_pending',  (select count(*) from public.crm_import_conflicts k where k.status = 'pending'),
    'stories_proposed',          (select count(*) from public.client_user_stories s where s.status = 'proposed')
  );
end $$;
revoke all on function private.admin_counters_impl() from public, anon, authenticated;
grant execute on function private.admin_counters_impl() to authenticated, service_role;

-- ---------------------------------------------------------------------------------------------------------------------
-- Security-review additions (coordinator, lane E).

-- A) comment.client: a client's visible comment reaches the admin and the owner closer. Batched per task: while an
--    undelivered comment.client for the same client and task is waiting in the outbox no second one is queued.
create or replace function private.client_task_comments_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_user  uuid;
  v_owner uuid;
begin
  select c.user_id, ct.owner_id into v_user, v_owner
    from public.clients c join public.crm_contacts ct on ct.id = c.contact_id where c.id = new.client_id;
  if new.author_user_id is distinct from v_user then return null; end if;  -- the admin answering is not a notice
  if exists (select 1 from private.outbox o
              where o.event = 'comment.client' and o.delivered_at is null and o.dead_at is null
                and o.payload ->> 'client_id' = new.client_id::text
                and o.payload ->> 'task_id' is not distinct from new.task_id::text) then
    return null;
  end if;
  perform private.enqueue('comment.client', jsonb_build_object(
    'id', new.id, 'client_id', new.client_id, 'task_id', new.task_id, 'owner_id', v_owner));
  return null;
end $$;
revoke all on function private.client_task_comments_after_insert() from public, anon, authenticated;
create trigger client_task_comments_after_insert after insert on public.client_task_comments
  for each row when (not new.internal) execute function private.client_task_comments_after_insert();

-- B) asset.uploaded fires when the object exists in storage, not when the row is created (the row is written first and
--    the upload may never happen). Trigger on storage.objects for the client-assets bucket, matched to the row.
drop trigger client_assets_after_insert on public.client_assets;
drop function private.client_assets_after_insert();

create or replace function private.storage_client_asset_uploaded() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a public.client_assets;
begin
  select * into a from public.client_assets x where x.storage_path = new.name and x.source = 'client';
  if a.id is not null then
    perform private.enqueue('asset.uploaded', jsonb_build_object(
      'id', a.id, 'client_id', a.client_id, 'file_name', a.file_name, 'size_bytes', a.size_bytes));
  end if;
  return null;
end $$;
revoke all on function private.storage_client_asset_uploaded() from public, anon, authenticated;
create trigger client_assets_object_uploaded after insert on storage.objects
  for each row when (new.bucket_id = 'client-assets') execute function private.storage_client_asset_uploaded();

-- C) Per-client daily quota of uploads (50 per rolling day) through the shared counters; the admin is exempt.
create or replace function private.client_assets_quota() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  insert into private.quota_counters as q (key, count, expires_at)
  values ('client_assets:' || new.client_id::text, 1, now() + interval '1 day')
  on conflict (key) do update set
    count      = case when q.expires_at <= now() then 1 else q.count + 1 end,
    expires_at = case when q.expires_at <= now() then now() + interval '1 day' else q.expires_at end
  returning q.count into v_count;
  if v_count > 50 then raise exception 'asset_quota_exceeded' using errcode = '54000'; end if;
  return new;
end $$;
revoke all on function private.client_assets_quota() from public, anon, authenticated;
create trigger client_assets_quota before insert on public.client_assets
  for each row when (new.source = 'client') execute function private.client_assets_quota();

-- D) CHECKs: the type and size the bucket accepts, repeated on the row (a client controls both values).
alter table public.client_assets
  add constraint client_assets_mime_allowed check (mime_type is null or mime_type in (
    'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'application/pdf', 'text/plain', 'text/csv',
    'application/zip', 'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation')),
  add constraint client_assets_size_max check (size_bytes is null or size_bytes <= 26214400);

-- E) area_client(): the caller's own client row. A closer can now read the clients he owns, so «select … limit 1» on
--    clients is ambiguous; the area asks for its own through client_id_of(). Same columns the client may read.
create or replace function private.area_client_impl()
returns table (id uuid, pack_code text, pack_option text, project_phase public.project_phase, starts_at date,
               delivered_at date, created_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select c.id, c.pack_code, c.pack_option, c.project_phase, c.starts_at, c.delivered_at, c.created_at
    from public.clients c where c.id = (select private.client_id_of())
$$;
revoke all on function private.area_client_impl() from public, anon, authenticated;
grant execute on function private.area_client_impl() to authenticated, service_role;

create or replace function public.area_client()
returns table (id uuid, pack_code text, pack_option text, project_phase public.project_phase, starts_at date,
               delivered_at date, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from private.area_client_impl()
$$;
revoke all on function public.area_client() from public, anon, authenticated;
grant execute on function public.area_client() to authenticated;
