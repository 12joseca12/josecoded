create type public.conversation_kind as enum ('visitor', 'closer', 'client', 'freelance');
create type public.conversation_status as enum ('open', 'archived');
create type public.member_role as enum ('owner', 'closer', 'client', 'freelance');
create type public.author_kind as enum ('human', 'nexo', 'system');
create type public.message_kind as enum ('text', 'handoff', 'reference');
create type public.system_event as enum (
  'member_added',
  'member_left',
  'ai_on',
  'ai_off',
  'consent_granted',
  'consent_revoked',
  'archived',
  'handoff_done'
);

create table public.visitors (
  id uuid primary key default gen_random_uuid(),
  token_hash text not null unique,
  locale public.app_locale not null default 'es',
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  lead_id uuid references public.leads (id) on delete set null,
  consent_at timestamptz,
  constraint visitors_token_hash_shape check (char_length(token_hash) between 32 and 128)
);

create index visitors_lead_id_idx on public.visitors (lead_id);
create index visitors_last_activity_idx on public.visitors (last_activity_at);

create table public.conversations (
  id uuid primary key default gen_random_uuid(),
  kind public.conversation_kind not null,
  visitor_id uuid references public.visitors (id) on delete cascade,
  subject_user_id uuid references public.profiles (id) on delete cascade,
  project_id uuid,
  locale public.app_locale not null default 'es',
  ai_enabled boolean not null default true,
  ai_off_reason text,
  ai_consent_at timestamptz,
  ai_consent_by uuid references public.profiles (id) on delete set null,
  ai_consent_revoked_at timestamptz,
  lead_id uuid references public.leads (id) on delete set null,
  contact_id uuid references public.contacts (id) on delete set null,
  interest boolean,
  first_page_path text,
  status public.conversation_status not null default 'open',
  archived_at timestamptz,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint conversations_owner_by_kind check (
    (kind = 'visitor' and visitor_id is not null and subject_user_id is null and project_id is null)
    or (kind in ('closer', 'freelance') and subject_user_id is not null and visitor_id is null and project_id is null)
    or (kind = 'client' and project_id is not null and visitor_id is null and subject_user_id is null)
  ),
  constraint conversations_consent_only_client check (
    kind = 'client'
    or (ai_consent_at is null and ai_consent_by is null and ai_consent_revoked_at is null)
  ),
  constraint conversations_lead_only_visitor check (
    kind = 'visitor' or (lead_id is null and contact_id is null and interest is null)
  ),
  constraint conversations_archived_matches check ((status = 'archived') = (archived_at is not null)),
  constraint conversations_ai_off_reason_valid check (
    ai_off_reason is null or (not ai_enabled and ai_off_reason in ('takeover', 'admin'))
  ),
  constraint conversations_first_page_path_length check (char_length(first_page_path) <= 500)
);

create unique index conversations_subject_key
on public.conversations (subject_user_id)
where kind in ('closer', 'freelance');

create unique index conversations_project_key
on public.conversations (project_id)
where kind = 'client';

create unique index conversations_open_visitor_key
on public.conversations (visitor_id)
where kind = 'visitor' and status = 'open';

create index conversations_visitor_purge_idx
on public.conversations (last_activity_at)
where kind = 'visitor';

create index conversations_activity_idx on public.conversations (last_activity_at desc);
create index conversations_lead_id_idx on public.conversations (lead_id);
create index conversations_contact_id_idx on public.conversations (contact_id);
create index conversations_ai_consent_by_idx on public.conversations (ai_consent_by);

alter table public.leads
  add constraint leads_conversation_id_fkey
  foreign key (conversation_id) references public.conversations (id) on delete set null;

create index leads_conversation_id_idx on public.leads (conversation_id);

create table public.conversation_members (
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role public.member_role not null,
  can_write boolean not null default true,
  joined_at timestamptz not null default now(),
  left_at timestamptz,
  last_read_at timestamptz,
  added_by uuid references public.profiles (id) on delete set null,
  primary key (conversation_id, user_id)
);

create index conversation_members_user_idx on public.conversation_members (user_id) where left_at is null;
create index conversation_members_added_by_idx on public.conversation_members (added_by);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  author_kind public.author_kind not null,
  author_id uuid references public.profiles (id) on delete set null,
  kind public.message_kind not null default 'text',
  system_event public.system_event,
  body text not null default '',
  page_path text,
  mentions_nexo boolean not null default false,
  sources text[] not null default '{}',
  model text,
  auto boolean not null default false,
  job_id uuid references private.jobs (id) on delete set null,
  ref_contact_id uuid references public.contacts (id) on delete set null,
  ref_task_id uuid,
  ref_story_id uuid,
  created_at timestamptz not null default now(),
  constraint messages_body_length check (char_length(body) <= 4000),
  constraint messages_body_required check (author_kind = 'system' or char_length(btrim(body)) > 0),
  constraint messages_system_event_matches check ((author_kind = 'system') = (system_event is not null)),
  constraint messages_author_by_kind check (author_kind = 'human' or author_id is null),
  constraint messages_nexo_fields check (
    author_kind = 'nexo' or (cardinality(sources) = 0 and model is null and job_id is null and not auto)
  ),
  constraint messages_page_path_length check (char_length(page_path) <= 500),
  constraint messages_model_length check (char_length(model) <= 100),
  constraint messages_sources_size check (cardinality(sources) <= 20),
  constraint messages_reference_shape check (
    (kind = 'reference' and num_nonnulls(ref_contact_id, ref_task_id, ref_story_id) = 1)
    or (kind <> 'reference' and num_nonnulls(ref_contact_id, ref_task_id, ref_story_id) = 0)
  )
);

create index messages_conversation_created_idx on public.messages (conversation_id, created_at, id);
create index messages_author_id_idx on public.messages (author_id);
create index messages_job_id_idx on public.messages (job_id) where job_id is not null;
create index messages_ref_contact_idx on public.messages (ref_contact_id) where ref_contact_id is not null;

alter table public.visitors enable row level security;
alter table public.conversations enable row level security;
alter table public.conversation_members enable row level security;
alter table public.messages enable row level security;

revoke all on public.visitors from anon, authenticated;
revoke all on public.conversations from anon, authenticated;
revoke all on public.conversation_members from anon, authenticated;
revoke all on public.messages from anon, authenticated;

create function private.is_conversation_member(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = p_conversation_id
      and m.user_id = auth.uid()
      and m.left_at is null
  )
  and (coalesce(private.role() = 'client', false) or private.is_staff())
$$;

create function private.can_write_conversation(p_conversation_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_conversation_member(p_conversation_id)
  and exists (
    select 1
    from public.conversation_members m
    join public.conversations c on c.id = m.conversation_id
    where m.conversation_id = p_conversation_id
      and m.user_id = auth.uid()
      and m.left_at is null
      and m.can_write
      and c.status = 'open'
  )
$$;

create function private.ai_active(p_conversation_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(
    (
      select c.ai_enabled
        and (c.kind <> 'client' or (c.ai_consent_at is not null and c.ai_consent_revoked_at is null))
      from public.conversations c
      where c.id = p_conversation_id
    ),
    false
  )
$$;

create function private.reply_delay()
returns integer
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (
      select (s.value #>> '{}')::integer
      from public.site_settings s
      where s.key = 'nexo.reply_delay_min'
        and jsonb_typeof(s.value) = 'number'
    ),
    10
  )
$$;

create function private.cancel_pending_replies(
  p_conversation_id uuid,
  p_reason text default 'superseded'
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  update private.jobs j
  set status = 'cancelled',
      finished_at = now(),
      error = left(coalesce(p_reason, 'superseded'), 4000)
  where j.kind = 'chat.reply'
    and j.status = 'queued'
    and j.payload ->> 'conversation_id' = p_conversation_id::text;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

create function private.conversations_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.conversation_members (conversation_id, user_id, role)
  select new.id, p.id, 'owner'
  from public.profiles p
  where p.role = 'admin'
    and p.is_active
    and p.archived_at is null;

  return null;
end;
$$;

create trigger conversations_after_insert
after insert on public.conversations
for each row execute function private.conversations_after_insert();

create function private.messages_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.mentions_nexo := new.author_kind = 'human' and new.body ~* '(^|\s)@nexo\M';
  return new;
end;
$$;

create trigger messages_before_insert
before insert on public.messages
for each row execute function private.messages_before_insert();

create function private.messages_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations;
  v_delayed boolean;
  v_run_after timestamptz;
begin
  update public.conversations
  set last_activity_at = now()
  where id = new.conversation_id
  returning * into v_conv;

  if new.author_kind <> 'human' then
    return null;
  end if;

  if v_conv.kind = 'visitor' and new.author_id is not null then
    update public.conversations
    set ai_enabled = false,
        ai_off_reason = 'takeover'
    where id = v_conv.id
      and ai_enabled;

    if found then
      insert into public.messages (conversation_id, author_kind, system_event, body)
      values (v_conv.id, 'system', 'ai_off', 'takeover');
    end if;

    perform private.cancel_pending_replies(v_conv.id);

    return null;
  end if;

  if v_conv.kind <> 'visitor' then
    perform private.cancel_pending_replies(v_conv.id);
  end if;

  if not private.ai_active(v_conv.id) then
    return null;
  end if;

  if v_conv.kind <> 'visitor' and not new.mentions_nexo and exists (
    select 1
    from public.conversation_members m
    where m.conversation_id = v_conv.id
      and m.user_id = new.author_id
      and m.role = 'owner'
  ) then
    return null;
  end if;

  v_delayed := v_conv.kind <> 'visitor' and not new.mentions_nexo;
  v_run_after := case
    when v_delayed then now() + make_interval(mins => private.reply_delay())
    else now()
  end;

  perform private.enqueue_job(
    'chat.reply',
    jsonb_build_object(
      'conversation_id', v_conv.id,
      'message_id', new.id,
      'kind', v_conv.kind::text,
      'locale', v_conv.locale::text,
      'page_path', new.page_path,
      'project_id', v_conv.project_id,
      'mention', new.mentions_nexo,
      'delayed', v_delayed
    ),
    v_run_after
  );

  return null;
end;
$$;

create trigger messages_after_insert
after insert on public.messages
for each row execute function private.messages_after_insert();

grant select on public.visitors to authenticated;
grant select on public.conversations to authenticated;
grant select on public.conversation_members to authenticated;
grant select on public.messages to authenticated;
grant insert (conversation_id, author_kind, author_id, body, page_path) on public.messages to authenticated;

create policy visitors_select
on public.visitors
for select
to authenticated
using ((select private.is_admin()));

create policy conversations_select
on public.conversations
for select
to authenticated
using ((select private.is_admin()) or private.is_conversation_member(id));

create policy conversation_members_select
on public.conversation_members
for select
to authenticated
using ((select private.is_admin()) or private.is_conversation_member(conversation_id));

create policy messages_select
on public.messages
for select
to authenticated
using ((select private.is_admin()) or private.is_conversation_member(conversation_id));

create policy messages_insert
on public.messages
for insert
to authenticated
with check (
  author_kind = 'human'
  and author_id = (select private.uid())
  and private.can_write_conversation(conversation_id)
  and ((select private.role()) = 'client' or (select private.is_staff()))
);

revoke all on function private.is_conversation_member(uuid) from public, anon, authenticated;
revoke all on function private.can_write_conversation(uuid) from public, anon, authenticated;
revoke all on function private.ai_active(uuid) from public, anon, authenticated;
revoke all on function private.reply_delay() from public, anon, authenticated;
revoke all on function private.cancel_pending_replies(uuid, text) from public, anon, authenticated;
revoke all on function private.conversations_after_insert() from public, anon, authenticated;
revoke all on function private.messages_before_insert() from public, anon, authenticated;
revoke all on function private.messages_after_insert() from public, anon, authenticated;

grant execute on function private.is_conversation_member(uuid) to authenticated;
grant execute on function private.can_write_conversation(uuid) to authenticated;
grant execute on function private.ai_active(uuid) to authenticated;

do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages'
    ) then
      alter publication supabase_realtime add table public.messages;
    end if;

    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'conversation_members'
    ) then
      alter publication supabase_realtime add table public.conversation_members;
    end if;
  end if;
end;
$$;

create function private.conversation_topic_id(p_topic text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_topic ~ '^conversation:[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then substr(p_topic, 14)::uuid
  end
$$;

revoke all on function private.conversation_topic_id(text) from public, anon, authenticated;
grant execute on function private.conversation_topic_id(text) to authenticated;

create policy conversation_broadcast_select
on realtime.messages
for select
to authenticated
using (private.is_conversation_member(private.conversation_topic_id((select realtime.topic()))));

create policy conversation_broadcast_insert
on realtime.messages
for insert
to authenticated
with check (private.is_conversation_member(private.conversation_topic_id((select realtime.topic()))));
