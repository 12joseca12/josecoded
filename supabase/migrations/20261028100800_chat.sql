-- Task 1.8b (plan v3.2; DATOS v1.2 §4.6, §5, §6, §8.6; spec v2.0 §0.4). Case-based chat (D39, D40): contexts per case
-- and locale, threads and messages, the trigger that feeds the admin inbox and the outbox, Realtime on chat_messages,
-- chat_context_published(), chat_purge_anonymous() and admin_counters() reading chat_threads statically.
-- anon has no grant on chat_*: the anonymous visitor always goes through the gateway, which validates the signed
-- chat_sid cookie (visitor_id) and works with the secret key. chat_case was created in 20261028100100_crm.sql.

-- 1) Enums (DATOS §4.6).
create type public.context_status as enum ('draft', 'published', 'archived');
create type public.thread_status as enum ('open', 'handed_over', 'closed');
create type public.chat_sender as enum ('visitor', 'assistant', 'jose');
create type public.chat_message_type as enum ('text', 'quick_contact', 'case_switch', 'system');

-- 2) Contexts (D40): versioned facts per case and locale, edited from the CRM (C8). At most one published per
--    (case, locale): publishing a new version archives the previous one in the same transaction. The gateway reads the
--    published one through chat_context_published(); no user JWT other than the admin's reads this table.
create table public.chat_contexts (
  id           uuid primary key default gen_random_uuid(),
  "case"       public.chat_case not null,
  locale       public.locale not null,
  version      integer not null check (version > 0),
  status       public.context_status not null default 'draft',
  title        text,
  body_md      text not null,
  facts        jsonb not null default '{}' check (jsonb_typeof(facts) = 'object'),  -- zod ChatContextFacts
  published_at timestamptz,
  published_by uuid references auth.users (id) on delete set null,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint chat_contexts_version_key unique ("case", locale, version)
);
alter table public.chat_contexts enable row level security;
create unique index uq_chat_contexts_published on public.chat_contexts ("case", locale) where status = 'published';
create index idx_chat_contexts_published_by on public.chat_contexts (published_by);
create trigger chat_contexts_set_updated_at before update on public.chat_contexts
  for each row execute function private.set_updated_at();
create policy chat_contexts_select on public.chat_contexts for select to authenticated using ((select private.is_admin()));
create policy chat_contexts_insert on public.chat_contexts for insert to authenticated
  with check ((select private.is_admin()));
create policy chat_contexts_update on public.chat_contexts for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy chat_contexts_delete on public.chat_contexts for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.chat_contexts to authenticated;

-- 3) Threads. visitor_id is the uuid inside the signed chat_sid cookie; user_id links the thread of a logged-in
--    visitor (recoverable on any device); contact_id links it to the CRM once the visitor leaves a way to reach them.
create table public.chat_threads (
  id               uuid primary key default gen_random_uuid(),
  visitor_id       uuid not null,
  user_id          uuid references auth.users (id) on delete set null,
  contact_id       uuid references public.crm_contacts (id) on delete set null,
  "case"           public.chat_case not null,
  locale           public.locale not null,
  origin_path      text,
  ai_enabled       boolean not null default true,
  status           public.thread_status not null default 'open',
  last_message_at  timestamptz,
  unread_for_admin boolean not null default false,
  ip_hash          text,
  context_version  integer,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.chat_threads enable row level security;
create index idx_chat_threads_visitor on public.chat_threads (visitor_id);
create index idx_chat_threads_user on public.chat_threads (user_id);
create index idx_chat_threads_contact on public.chat_threads (contact_id);
create index idx_chat_threads_inbox on public.chat_threads (last_message_at desc) where status <> 'closed';  -- C7
create index idx_chat_threads_unread on public.chat_threads (unread_for_admin) where unread_for_admin;  -- C1
create index idx_chat_threads_purge on public.chat_threads (last_message_at)
  where user_id is null and contact_id is null;  -- chat_purge_anonymous()
create trigger chat_threads_set_updated_at before update on public.chat_threads
  for each row execute function private.set_updated_at();
create policy chat_threads_select on public.chat_threads for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy chat_threads_insert on public.chat_threads for insert to authenticated with check ((select private.is_admin()));
create policy chat_threads_update on public.chat_threads for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy chat_threads_delete on public.chat_threads for delete to authenticated using ((select private.is_admin()));
grant select, insert, update, delete on public.chat_threads to authenticated;

-- crm_interactions.chat_thread_id (kind chat_thread) was created without FK in 20261028100100_crm.sql; its index
-- idx_crm_interactions_chat_thread already exists.
alter table public.crm_interactions add constraint crm_interactions_chat_thread_id_fkey
  foreign key (chat_thread_id) references public.chat_threads (id) on delete set null;

-- 4) Messages. Visitor and assistant messages are written by the gateway (service role); the admin writes his own
--    takeover replies (sender_role = 'jose'). No update or delete grant: a thread is removed whole (cascade).
create table public.chat_messages (
  id           uuid primary key default gen_random_uuid(),
  thread_id    uuid not null references public.chat_threads (id) on delete cascade,
  sender_role  public.chat_sender not null,
  content      text not null check (char_length(content) <= 8000),
  message_type public.chat_message_type not null default 'text',
  metadata     jsonb not null default '{}',
  created_at   timestamptz not null default now()
);
alter table public.chat_messages enable row level security;
create index idx_chat_messages_thread on public.chat_messages (thread_id, created_at);
-- The exists runs under the RLS of chat_threads (the caller's own threads) and uses idx_chat_threads_user via the pk.
create policy chat_messages_select on public.chat_messages for select to authenticated
  using ((select private.is_admin())
         or exists (select 1 from public.chat_threads t
                    where t.id = chat_messages.thread_id and t.user_id = (select auth.uid())));
create policy chat_messages_insert on public.chat_messages for insert to authenticated
  with check ((select private.is_admin()) and sender_role = 'jose');
grant select, insert on public.chat_messages to authenticated;

-- Realtime (DATOS §8.6): only chat_messages; Realtime applies the select policy, so a logged-in visitor receives the
-- messages of their own threads and the admin all of them.
alter publication supabase_realtime add table public.chat_messages;

-- 5) After a message: the thread's last_message_at moves forward, a visitor message marks it unread for the admin and
--    enqueues chat.visitor_message (the gateway groups the Telegram notices per thread every 10 minutes, job
--    chat.notify_digest). The payload carries ids only, never the content: the outbox outlives the 90-day purge of
--    anonymous threads, and the gateway reads the message by id when it notifies. Definer: the admin's takeover reply
--    and the service role both update the thread through it.
create or replace function private.chat_message_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_thread public.chat_threads;
begin
  update public.chat_threads t
     set last_message_at  = greatest(coalesce(t.last_message_at, new.created_at), new.created_at),
         unread_for_admin = t.unread_for_admin or new.sender_role = 'visitor'
   where t.id = new.thread_id
  returning t.* into v_thread;
  if new.sender_role = 'visitor' then
    perform private.enqueue('chat.visitor_message', jsonb_build_object(
      'id', new.id, 'thread_id', new.thread_id, 'case', v_thread."case", 'locale', v_thread.locale,
      'message_type', new.message_type, 'user_id', v_thread.user_id, 'contact_id', v_thread.contact_id));
  end if;
  return null;
end $$;
revoke all on function private.chat_message_after_insert() from public, anon, authenticated;
create trigger chat_message_after_insert after insert on public.chat_messages
  for each row execute function private.chat_message_after_insert();

-- 6) RPCs for the gateway (service role only).

-- The single published context of a case and locale as {version, title, body_md, facts}, or null when there is none
-- (the gateway then falls back to curious and marks the thread). Cached 5 minutes by the gateway.
create or replace function public.chat_context_published(p_case public.chat_case, p_locale public.locale)
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object('version', c.version, 'title', c.title, 'body_md', c.body_md, 'facts', c.facts)
    from public.chat_contexts c
   where c."case" = p_case and c.locale = p_locale and c.status = 'published'
$$;
revoke all on function public.chat_context_published(public.chat_case, public.locale) from public, anon, authenticated;
grant execute on function public.chat_context_published(public.chat_case, public.locale) to service_role;

-- Retention (DATOS P10, Q6: 90 days, job chat.purge_anonymous): deletes the anonymous threads without contact whose
-- last activity (last message, or creation when there is none) is older than p_older_than; messages go by cascade.
-- Threads of a user or linked to a CRM contact are never purged. Refuses intervals under a day so a wrong argument
-- cannot wipe the live inbox. Returns how many threads it deleted.
create or replace function public.chat_purge_anonymous(p_older_than interval)
returns integer language plpgsql security definer set search_path = '' as $$
declare
  v_cutoff timestamptz;
  v_count  integer;
begin
  if p_older_than is null or p_older_than < interval '1 day' then
    raise exception 'interval_too_short' using errcode = '22023';
  end if;
  v_cutoff := now() - p_older_than;
  delete from public.chat_threads t
   where t.user_id is null and t.contact_id is null
     and (t.last_message_at < v_cutoff or (t.last_message_at is null and t.created_at < v_cutoff));
  get diagnostics v_count = row_count;
  return v_count;
end $$;
revoke all on function public.chat_purge_anonymous(interval) from public, anon, authenticated;
grant execute on function public.chat_purge_anonymous(interval) to service_role;

-- 7) admin_counters() (20261028100700) looked chat_threads up dynamically until this migration; now it is static.
--    Same signature, same grants, same seven counters (DATOS §6, §7 C1).
create or replace function public.admin_counters() returns jsonb
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
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending')
  );
end $$;
revoke all on function public.admin_counters() from public, anon, authenticated;
grant execute on function public.admin_counters() to authenticated;
