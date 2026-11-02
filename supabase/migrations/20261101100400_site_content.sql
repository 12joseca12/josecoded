-- Task 1.8e (plan v3.4; DATOS v1.4 §14.2, §14.4, §14.5, §14.7 migration 5; D53). Editable site content: entries with a
-- draft and a published value, versions, publications to the repo (the gateway commits the snapshot) and the RPCs of the
-- admin. Supabase edits, the repo publishes: public pages stay static.

create type public.content_kind as enum ('message_override', 'faq', 'project', 'blog_post', 'settings');
create type public.publication_status as enum ('queued', 'committed', 'deployed', 'failed');

create table public.site_content_publications (
  id              uuid primary key default gen_random_uuid(),
  snapshot        jsonb not null,  -- {files: {path: content}}: what goes to the repo
  files           jsonb,           -- {path: sha} after the commit
  status          public.publication_status not null default 'queued',
  commit_sha      text,
  workflow_run_id bigint,
  error           text,
  created_by      uuid references auth.users (id) on delete set null,
  committed_at    timestamptz,
  deployed_at     timestamptz,
  created_at      timestamptz not null default now()
);
alter table public.site_content_publications enable row level security;
create index idx_site_content_publications_created on public.site_content_publications (created_at desc);
create index idx_site_content_publications_open on public.site_content_publications (status) where status in ('queued', 'committed');
create index idx_site_content_publications_created_by on public.site_content_publications (created_by);
create policy site_content_publications_select on public.site_content_publications for select to authenticated
  using ((select private.is_admin()));
grant select on public.site_content_publications to authenticated;

create table public.site_content_entries (
  id               uuid primary key default gen_random_uuid(),
  kind             public.content_kind not null,
  key              text not null check (btrim(key) <> ''),
  locale           public.locale,  -- null for settings and project
  draft            jsonb,
  published        jsonb,
  published_version integer not null default 0,
  draft_updated_at timestamptz,
  draft_updated_by uuid references auth.users (id) on delete set null,
  published_at     timestamptz,
  published_by     uuid references auth.users (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint site_content_entries_locale check ((kind in ('settings', 'project')) = (locale is null))
);
alter table public.site_content_entries enable row level security;
-- One entry per (kind, key, locale); two partial indexes because locale::text is not immutable for an index expression.
create unique index uq_site_content_entries_locale on public.site_content_entries (kind, key, locale) where locale is not null;
create unique index uq_site_content_entries_nolocale on public.site_content_entries (kind, key) where locale is null;
create index idx_site_content_entries_pending on public.site_content_entries (kind) where draft is distinct from published;
create index idx_site_content_entries_draft_by on public.site_content_entries (draft_updated_by);
create index idx_site_content_entries_published_by on public.site_content_entries (published_by);
create trigger site_content_entries_set_updated_at before update on public.site_content_entries
  for each row execute function private.set_updated_at();
create policy site_content_entries_select on public.site_content_entries for select to authenticated using ((select private.is_admin()));
create policy site_content_entries_insert on public.site_content_entries for insert to authenticated with check ((select private.is_admin()));
create policy site_content_entries_update on public.site_content_entries for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy site_content_entries_delete on public.site_content_entries for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.site_content_entries to authenticated;

create table public.site_content_versions (
  id             uuid primary key default gen_random_uuid(),
  entry_id       uuid not null references public.site_content_entries (id) on delete cascade,
  version        integer not null,
  content        jsonb not null,
  published_by   uuid references auth.users (id) on delete set null,
  published_at   timestamptz not null default now(),
  publication_id uuid references public.site_content_publications (id) on delete set null
);
alter table public.site_content_versions enable row level security;
create unique index uq_site_content_versions on public.site_content_versions (entry_id, version);
create index idx_site_content_versions_publication on public.site_content_versions (publication_id);
create index idx_site_content_versions_published_by on public.site_content_versions (published_by);
create policy site_content_versions_select on public.site_content_versions for select to authenticated using ((select private.is_admin()));
grant select on public.site_content_versions to authenticated;

-- Saves (or discards, with a null draft) the draft of an entry. Content rules are checked when publishing.
create or replace function private.content_save_draft_impl(
  p_kind public.content_kind, p_key text, p_locale public.locale, p_draft jsonb)
returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid uuid := (select auth.uid());
  v_id  uuid;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if nullif(btrim(p_key), '') is null then raise exception 'key_required' using errcode = '22023'; end if;
  if (p_kind in ('settings', 'project')) <> (p_locale is null) then raise exception 'invalid_locale_for_kind' using errcode = '22023'; end if;
  if p_draft is not null and jsonb_typeof(p_draft) <> 'object' then raise exception 'draft_must_be_an_object' using errcode = '22023'; end if;

  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('content_entry:' || p_kind || ':' || p_key || ':' || coalesce(p_locale::text, ''), 0));
  select e.id into v_id from public.site_content_entries e
   where e.kind = p_kind and e.key = p_key and e.locale is not distinct from p_locale;

  if v_id is null then
    if p_draft is null then return null; end if;
    insert into public.site_content_entries (kind, key, locale, draft, draft_updated_at, draft_updated_by)
    values (p_kind, p_key, p_locale, p_draft, now(), v_uid)
    returning id into v_id;
  elsif p_draft is null then
    update public.site_content_entries set draft = published, draft_updated_at = now(), draft_updated_by = v_uid where id = v_id;
  else
    update public.site_content_entries set draft = p_draft, draft_updated_at = now(), draft_updated_by = v_uid where id = v_id;
  end if;
  return v_id;
end $$;
revoke all on function private.content_save_draft_impl(public.content_kind, text, public.locale, jsonb) from public, anon, authenticated;
grant execute on function private.content_save_draft_impl(public.content_kind, text, public.locale, jsonb) to authenticated, service_role;

create or replace function public.content_save_draft(p_kind public.content_kind, p_key text, p_locale public.locale, p_draft jsonb)
returns uuid language sql security invoker set search_path = '' as $$
  select private.content_save_draft_impl(p_kind, p_key, p_locale, p_draft)
$$;
revoke all on function public.content_save_draft(public.content_kind, text, public.locale, jsonb) from public, anon, authenticated;
grant execute on function public.content_save_draft(public.content_kind, text, public.locale, jsonb) to authenticated;

-- The repository files of every published entry (the repo mirrors the whole state, not only what changed).
create or replace function private.content_files_build() returns jsonb
language sql stable set search_path = '' as $$
  select coalesce(jsonb_object_agg(f.path, f.content), '{}'::jsonb)
    from (
      select 'content/overrides/messages.' || l.locale::text || '.json' as path,
             (select coalesce(jsonb_object_agg(e.key, e.published -> 'value' order by e.key), '{}'::jsonb)
                from public.site_content_entries e
               where e.kind = 'message_override' and e.locale = l.locale and e.published is not null) as content
        from (select unnest(enum_range(null::public.locale)) as locale) l
      union all
      select 'content/overrides/faq.json',
             (select coalesce(jsonb_agg(e.published || jsonb_build_object('key', e.key, 'locale', e.locale)
                                        order by e.key, e.locale), '[]'::jsonb)
                from public.site_content_entries e where e.kind = 'faq' and e.published is not null)
      union all
      select 'content/overrides/projects.json',
             (select coalesce(jsonb_object_agg(e.key, e.published order by e.key), '{}'::jsonb)
                from public.site_content_entries e where e.kind = 'project' and e.published is not null)
      union all
      select 'content/overrides/settings.json',
             coalesce((select e.published from public.site_content_entries e where e.kind = 'settings' and e.key = 'settings'), '{}'::jsonb)
      union all
      select 'content/blog/' || e.key || '.' || e.locale::text || '.md', e.published
        from public.site_content_entries e
       where e.kind = 'blog_post' and e.published is not null and e.published ->> 'published' = 'true'
    ) f
$$;
revoke all on function private.content_files_build() from public, anon, authenticated;

-- Publishes the drafts (all pending ones, or the ids given) in one transaction and queues the commit of the snapshot.
create or replace function private.content_publish_impl(p_entry_ids uuid[]) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  e         public.site_content_entries;
  v_pub     uuid := gen_random_uuid();
  v_count   integer := 0;
  v_version integer;
  v_editable constant text[] := array['home', 'services', 'partners', 'about', 'projects', 'contact', 'blog', 'lab', 'seo', 'common'];
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('content_publish', 0));

  -- Validate first: nothing is published if any pending entry is wrong.
  for e in select x.* from public.site_content_entries x
            where x.draft is distinct from x.published and (p_entry_ids is null or x.id = any (p_entry_ids))
            order by x.kind, x.key for update loop
    if e.draft is null then continue; end if;
    if jsonb_typeof(e.draft) <> 'object' then raise exception 'invalid_content: %', e.key using errcode = '22023'; end if;
    if e.draft::text like '%{{DATO%' then raise exception 'placeholder_in_content: %', e.key using errcode = '22023'; end if;
    if e.kind = 'message_override' then
      if not (split_part(e.key, '.', 1) = any (v_editable)) then
        raise exception 'namespace_not_editable: %', e.key using errcode = '22023';
      end if;
      if jsonb_typeof(e.draft -> 'value') <> 'string' then raise exception 'invalid_content: %', e.key using errcode = '22023'; end if;
    elsif e.kind = 'faq' then
      if jsonb_typeof(e.draft -> 'question') <> 'string' or jsonb_typeof(e.draft -> 'answer') <> 'string' then
        raise exception 'invalid_content: %', e.key using errcode = '22023';
      end if;
    elsif e.kind = 'blog_post' then
      if jsonb_typeof(e.draft -> 'title') <> 'string' or jsonb_typeof(e.draft -> 'body_md') <> 'string' then
        raise exception 'invalid_content: %', e.key using errcode = '22023';
      end if;
    end if;
  end loop;

  insert into public.site_content_publications (id, snapshot, created_by) values (v_pub, '{}'::jsonb, v_uid);

  for e in select x.* from public.site_content_entries x
            where x.draft is distinct from x.published and x.draft is not null
              and (p_entry_ids is null or x.id = any (p_entry_ids))
            order by x.kind, x.key loop
    v_version := e.published_version + 1;
    update public.site_content_entries set published = draft, published_version = v_version, published_at = now(), published_by = v_uid
     where id = e.id;
    insert into public.site_content_versions (entry_id, version, content, published_by, publication_id)
    values (e.id, v_version, e.draft, v_uid, v_pub);
    v_count := v_count + 1;
  end loop;
  if v_count = 0 then raise exception 'nothing_to_publish' using errcode = '22023'; end if;

  update public.site_content_publications set snapshot = jsonb_build_object('files', private.content_files_build()) where id = v_pub;
  perform private.enqueue('content.publish_requested', jsonb_build_object('publication_id', v_pub));
  return v_pub;
end $$;
revoke all on function private.content_publish_impl(uuid[]) from public, anon, authenticated;
grant execute on function private.content_publish_impl(uuid[]) to authenticated, service_role;

create or replace function public.content_publish(p_entry_ids uuid[] default null) returns uuid
language sql security invoker set search_path = '' as $$
  select private.content_publish_impl(p_entry_ids)
$$;
revoke all on function public.content_publish(uuid[]) from public, anon, authenticated;
grant execute on function public.content_publish(uuid[]) to authenticated;

-- Rollback never deletes history: the old version becomes the draft and is published as a new version.
create or replace function private.content_rollback_impl(p_entry_id uuid, p_version integer) returns uuid
language plpgsql security definer set search_path = '' as $$
declare v_content jsonb;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  select v.content into v_content from public.site_content_versions v where v.entry_id = p_entry_id and v.version = p_version;
  if v_content is null then raise exception 'version_not_found' using errcode = 'P0002'; end if;
  update public.site_content_entries set draft = v_content, draft_updated_at = now(), draft_updated_by = (select auth.uid())
   where id = p_entry_id;
  return private.content_publish_impl(array[p_entry_id]);
end $$;
revoke all on function private.content_rollback_impl(uuid, integer) from public, anon, authenticated;
grant execute on function private.content_rollback_impl(uuid, integer) to authenticated, service_role;

create or replace function public.content_rollback(p_entry_id uuid, p_version integer) returns uuid
language sql security invoker set search_path = '' as $$
  select private.content_rollback_impl(p_entry_id, p_version)
$$;
revoke all on function public.content_rollback(uuid, integer) from public, anon, authenticated;
grant execute on function public.content_rollback(uuid, integer) to authenticated;

-- Preview (Draft Mode): the draft when it exists, the published value otherwise, for one language.
create or replace function private.content_draft_snapshot_impl(p_locale public.locale) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'messages', (select coalesce(jsonb_object_agg(e.key, coalesce(e.draft, e.published) -> 'value' order by e.key), '{}'::jsonb)
                   from public.site_content_entries e
                  where e.kind = 'message_override' and e.locale = p_locale and coalesce(e.draft, e.published) is not null),
    'faq',      (select coalesce(jsonb_agg(coalesce(e.draft, e.published) || jsonb_build_object('key', e.key) order by e.key), '[]'::jsonb)
                   from public.site_content_entries e
                  where e.kind = 'faq' and e.locale = p_locale and coalesce(e.draft, e.published) is not null),
    'projects', (select coalesce(jsonb_object_agg(e.key, coalesce(e.draft, e.published) order by e.key), '{}'::jsonb)
                   from public.site_content_entries e
                  where e.kind = 'project' and coalesce(e.draft, e.published) is not null),
    'settings', coalesce((select coalesce(e.draft, e.published) from public.site_content_entries e
                           where e.kind = 'settings' and e.key = 'settings'), '{}'::jsonb));
end $$;
revoke all on function private.content_draft_snapshot_impl(public.locale) from public, anon, authenticated;
grant execute on function private.content_draft_snapshot_impl(public.locale) to authenticated, service_role;

create or replace function public.content_draft_snapshot(p_locale public.locale) returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.content_draft_snapshot_impl(p_locale)
$$;
revoke all on function public.content_draft_snapshot(public.locale) from public, anon, authenticated;
grant execute on function public.content_draft_snapshot(public.locale) to authenticated;

-- Gateway only (service role): notes the progress of a publication. A failed one tells the admin.
create or replace function public.content_publication_mark(
  p_id uuid, p_status public.publication_status, p_commit_sha text, p_files jsonb, p_run_id bigint, p_error text)
returns void
language plpgsql security definer set search_path = '' as $$
begin
  update public.site_content_publications set
    status          = p_status,
    commit_sha      = coalesce(p_commit_sha, commit_sha),
    files           = coalesce(p_files, files),
    workflow_run_id = coalesce(p_run_id, workflow_run_id),
    error           = case when p_status = 'failed' then left(p_error, 2000) else error end,
    committed_at    = case when p_status = 'committed' then coalesce(committed_at, now()) else committed_at end,
    deployed_at     = case when p_status = 'deployed' then coalesce(deployed_at, now()) else deployed_at end
   where id = p_id;
  if not found then raise exception 'publication_not_found' using errcode = 'P0002'; end if;
  if p_status = 'deployed' then
    perform private.enqueue('content.deployed', jsonb_build_object('publication_id', p_id, 'commit_sha', p_commit_sha));
  elsif p_status = 'failed' then
    perform private.enqueue('content.deploy_failed', jsonb_build_object(
      'publication_id', p_id, 'commit_sha', p_commit_sha, 'error', left(p_error, 500)));
  end if;
end $$;
revoke all on function public.content_publication_mark(uuid, public.publication_status, text, jsonb, bigint, text) from public, anon, authenticated;
grant execute on function public.content_publication_mark(uuid, public.publication_status, text, jsonb, bigint, text) to service_role;

-- C1 counters, now with the content waiting to be published.
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
    'stories_proposed',          (select count(*) from public.client_user_stories s where s.status = 'proposed'),
    'content_pending',           (select count(*) from public.site_content_entries e where e.draft is distinct from e.published)
  );
end $$;
revoke all on function private.admin_counters_impl() from public, anon, authenticated;
grant execute on function private.admin_counters_impl() to authenticated, service_role;
