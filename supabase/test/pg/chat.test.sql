-- Assertions for task 1.8b (plan v3.2; DATOS v1.2 §4.6, §5, §6, §8.6): the chat cells of the DATOS §5 table
-- (chat_contexts, chat_threads, chat_messages) with the seeded accounts jose (admin, a1), ana (client with her own
-- thread, a2), bob (affiliate without threads, a3), sin (unconfirmed, a4) and anon, plus the behaviours of the plan's
-- test extract: one published context per case and locale, chat_context_published() service role only and null when
-- unpublished, the visitor-message trigger (unread_for_admin + chat.visitor_message) and chat_purge_anonymous().
-- Runs after base.test.sql and before crm.test.sql on the same throwaway database (supabase/test/pg/run.sh). Blocks run
-- in their own transaction and roll back. Seed: anonymous partner thread …0c01 (unread), Ana's client thread …0c02.
--
-- Helpers in schema t (same definitions as crm.test.sql; both files create them idempotently). They run as the caller:
--   t.ok(cond, what)   raises `PASS what` as a notice, or an exception `FAIL what`.
--   t.n(query)         number of rows the query returns.
--   t.err(query)       null when the statement succeeds (its effects stay), else 'SQLSTATE message'.
--   t.affected(dml)    rows changed by an insert/update/delete.
--   t.val(query)       first column of the first row, as text.
\o /dev/null
\set jose '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","email":"jose@test"}'
\set ana '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated","email":"ana@test"}'
\set bob '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated","email":"bob@test"}'
\set sin '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated","email":"sin@test"}'

create schema if not exists t;
grant usage on schema t to anon, authenticated, service_role;
create or replace function t.ok(c boolean, what text) returns void language plpgsql as $$
begin
  if c is not true then raise exception 'FAIL %', what; end if;
  raise notice 'PASS %', what;
end $$;
create or replace function t.n(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute 'select count(*) from (' || q || ') s' into n;
  return n;
end $$;
create or replace function t.err(q text) returns text language plpgsql as $$
begin
  execute q;
  return null;
exception when others then
  return sqlstate || ' ' || sqlerrm;
end $$;
create or replace function t.affected(q text) returns bigint language plpgsql as $$
declare n bigint;
begin
  execute q;
  get diagnostics n = row_count;
  return n;
end $$;
create or replace function t.val(q text) returns text language plpgsql as $$
declare v text;
begin
  execute q into v;
  return v;
end $$;
grant execute on all functions in schema t to anon, authenticated, service_role;

-- ================================================================ structure and seed (as postgres)
begin;
select t.ok((select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity
               and c.relname in ('chat_contexts', 'chat_threads', 'chat_messages')) = 3,
            'the three chat tables of DATOS §4.6 exist with RLS enabled');

select t.ok(
  (select string_agg(t.typname || '=' || (select string_agg(e.enumlabel, ',' order by e.enumsortorder)
                                          from pg_enum e where e.enumtypid = t.oid), ' ' order by t.typname)
     from pg_type t join pg_namespace s on s.oid = t.typnamespace
    where s.nspname = 'public'
      and t.typname in ('chat_case', 'context_status', 'thread_status', 'chat_sender', 'chat_message_type'))
  = 'chat_case=client,partner,recruiter,curious chat_message_type=text,quick_contact,case_switch,system '
    'chat_sender=visitor,assistant,jose context_status=draft,published,archived thread_status=open,handed_over,closed',
  'chat enums match DATOS §4.6 (chat_case reused from the CRM migration)');
select t.ok((select count(*) from pg_type t join pg_namespace s on s.oid = t.typnamespace
             where s.nspname = 'public' and t.typtype = 'e') = 25 + 4,
            'public has 29 enums: the 25 of §4.1/§4.3-4.5 plus the four new chat ones');

select t.ok((select indexdef from pg_indexes where schemaname = 'public' and indexname = 'uq_chat_contexts_published')
            = 'CREATE UNIQUE INDEX uq_chat_contexts_published ON public.chat_contexts USING btree ("case", locale) '
              'WHERE (status = ''published''::context_status)'
            and exists (select 1 from pg_constraint where conname = 'chat_contexts_version_key' and contype = 'u'),
            'chat_contexts: uq (case, locale) where published, and uq (case, locale, version)');
select t.ok((select count(*) from pg_indexes where schemaname = 'public' and tablename = 'chat_threads'
               and indexname in ('idx_chat_threads_visitor', 'idx_chat_threads_user', 'idx_chat_threads_contact',
                                 'idx_chat_threads_inbox', 'idx_chat_threads_unread', 'idx_chat_threads_purge')) = 6
            and (select indexdef from pg_indexes where indexname = 'idx_chat_threads_inbox')
                like '%(last_message_at DESC) WHERE (status <> ''closed''::thread_status)'
            and (select indexdef from pg_indexes where indexname = 'idx_chat_threads_purge')
                like '%(last_message_at) WHERE ((user_id IS NULL) AND (contact_id IS NULL))'
            and (select indexdef from pg_indexes where indexname = 'idx_chat_messages_thread')
                like '%(thread_id, created_at)',
            'chat indexes of DATOS §4.6: visitor, user, contact, C7 inbox, unread, purge and (thread_id, created_at)');

select t.ok((select confrelid = 'public.chat_threads'::regclass and confdeltype = 'n'
             from pg_constraint where conname = 'crm_interactions_chat_thread_id_fkey'),
            'crm_interactions.chat_thread_id now references chat_threads (on delete set null)');

select t.ok((select string_agg(schemaname || '.' || tablename, ',') from pg_publication_tables
             where pubname = 'supabase_realtime') = 'public.chat_messages',
            'Realtime: supabase_realtime publishes chat_messages (and nothing else)');

select t.ok(not exists (select 1 from information_schema.role_table_grants
                        where grantee in ('anon', 'PUBLIC') and table_schema = 'public' and table_name like 'chat\_%')
            and not exists (select 1 from information_schema.column_privileges
                            where grantee = 'anon' and table_schema = 'public' and table_name like 'chat\_%'),
            'anon: no grant on chat_* (the visitor goes through the gateway)');
select t.ok((select string_agg(table_name || ':' || privilege_type, ',' order by table_name, privilege_type)
             from information_schema.role_table_grants
             where grantee = 'authenticated' and table_schema = 'public' and table_name like 'chat\_%')
            = 'chat_contexts:DELETE,chat_contexts:INSERT,chat_contexts:SELECT,chat_contexts:UPDATE,'
              'chat_messages:INSERT,chat_messages:SELECT,'
              'chat_threads:DELETE,chat_threads:INSERT,chat_threads:SELECT,chat_threads:UPDATE',
            'authenticated: s/i/u/d on contexts and threads (RLS: admin), only select/insert on messages');
select t.ok((select string_agg(tablename || ':' || cmd, ',' order by tablename, cmd) from pg_policies
             where schemaname = 'public' and tablename like 'chat\_%')
            = 'chat_contexts:DELETE,chat_contexts:INSERT,chat_contexts:SELECT,chat_contexts:UPDATE,'
              'chat_messages:INSERT,chat_messages:SELECT,'
              'chat_threads:DELETE,chat_threads:INSERT,chat_threads:SELECT,chat_threads:UPDATE',
            'chat policies are one per action (no update/delete policy on messages)');

select t.ok(bool_and(has_function_privilege('service_role', f, 'execute')
                     and not has_function_privilege('authenticated', f, 'execute')
                     and not has_function_privilege('anon', f, 'execute'))
            , 'chat_context_published and chat_purge_anonymous are service_role only')
  from unnest(array['public.chat_context_published(public.chat_case,public.locale)',
                    'public.chat_purge_anonymous(interval)']) f;
select t.ok((select provolatile = 's' from pg_proc where proname = 'chat_context_published'),
            'chat_context_published is stable');
select t.ok((select prosrc !~* '(execute|to_regclass)' and prosrc ~ 'public\.chat_threads'
             from pg_proc where proname = 'admin_counters'),
            'admin_counters reads chat_threads statically (no dynamic lookup left)');

select t.ok((select count(*) = 3 and count(*) filter (where status = 'published') = 2
                    and bool_and(body_md like '%{{DATO:%')
                    and string_agg("case" || '/' || locale || ':' || status, ',' order by "case")
                        = 'client/es:published,partner/es:draft,curious/es:published'
             from public.chat_contexts),
            'seed: client/es and curious/es published, partner/es draft, copy marked {{DATO}}');
select t.ok((select user_id is null and contact_id is null and "case" = 'partner' and unread_for_admin
                    and last_message_at is not null
             from public.chat_threads where id = '00000000-0000-4000-8000-000000000c01')
            and (select user_id = '00000000-0000-4000-8000-0000000000a2'
                        and contact_id = '00000000-0000-4000-8000-000000000202' and "case" = 'client'
                        and not unread_for_admin
                 from public.chat_threads where id = '00000000-0000-4000-8000-000000000c02')
            and (select count(*) from public.chat_messages) = 4,
            'seed: anonymous partner thread (unread) and Ana''s client thread (her user and contact, read), 2 messages each');
select t.ok((select count(*) from private.outbox where event = 'chat.visitor_message') = 2
            and not exists (select 1 from private.outbox where event = 'chat.visitor_message'
                            and (payload ? 'content' or payload::text like '%Seed:%')),
            'seed: one chat.visitor_message per visitor message, carrying ids and never the content');
rollback;

-- ================================================================ anon
begin;
set local role anon;
select t.ok(bool_and(t.err(format('select id from public.%I', x)) like '42501 %'),
            'anon: permission denied on chat_contexts, chat_threads and chat_messages')
  from unnest(array['chat_contexts', 'chat_threads', 'chat_messages']) x;
select t.ok(t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                    values ('00000000-0000-4000-8000-000000000c01', 'visitor', 'x')$q$) like '42501 %',
            'anon: cannot write a message');
select t.ok(bool_and(t.err(q) like '42501 %'), 'anon: permission denied on chat_context_published and chat_purge_anonymous')
  from unnest(array[$q$select public.chat_context_published('client', 'es')$q$,
                    $q$select public.chat_purge_anonymous('90 days')$q$]) q;
rollback;

-- ================================================================ ana: only her thread and its messages
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n('select id from public.chat_contexts') = 0, 'ana: 0 chat_contexts');
select t.ok(t.err($q$insert into public.chat_contexts ("case", locale, version, body_md)
                    values ('client', 'es', 9, 'x')$q$) like '42501 %',
            'ana: cannot insert a context');
select t.ok(t.n('select id from public.chat_threads') = 1
            and t.val('select id from public.chat_threads') = '00000000-0000-4000-8000-000000000c02',
            'ana: reads exactly her thread');
select t.ok(t.n('select id from public.chat_messages') = 2
            and t.n($q$select id from public.chat_messages
                      where thread_id <> '00000000-0000-4000-8000-000000000c02'$q$) = 0,
            'ana: reads the two messages of her thread and none of the anonymous one');
select t.ok(t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                    values ('00000000-0000-4000-8000-000000000c02', 'visitor', 'x')$q$) like '42501 %'
            and t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                        values ('00000000-0000-4000-8000-000000000c02', 'jose', 'x')$q$) like '42501 %',
            'ana: cannot write messages directly, not even in her thread (the gateway writes them)');
select t.ok(t.err($q$update public.chat_messages set content = 'x'$q$) like '42501 %'
            and t.err('delete from public.chat_messages') like '42501 %',
            'ana: no update nor delete on messages');
select t.ok(t.affected($q$update public.chat_threads set ai_enabled = false, unread_for_admin = false$q$) = 0
            and t.affected('delete from public.chat_threads') = 0
            and t.err($q$insert into public.chat_threads (visitor_id, user_id, "case", locale)
                        values (gen_random_uuid(), '00000000-0000-4000-8000-0000000000a2', 'client', 'es')$q$)
                like '42501 %',
            'ana: cannot update, delete or create threads');
select t.ok(t.err($q$select public.chat_context_published('client', 'es')$q$) like '42501 %'
            and t.err($q$select public.chat_purge_anonymous('90 days')$q$) like '42501 %',
            'ana: chat_context_published and chat_purge_anonymous are denied');
rollback;

-- ================================================================ bob (affiliate) and sin: none
begin;
set local role authenticated;
set local request.jwt.claims = :'bob';
select t.ok(bool_and(t.n(format('select id from public.%I', x)) = 0), 'bob: 0 rows of chat_contexts, threads and messages')
  from unnest(array['chat_contexts', 'chat_threads', 'chat_messages']) x;
set local request.jwt.claims = :'sin';
select t.ok(bool_and(t.n(format('select id from public.%I', x)) = 0), 'sin: 0 rows of chat_contexts, threads and messages')
  from unnest(array['chat_contexts', 'chat_threads', 'chat_messages']) x;
rollback;

-- ================================================================ jose (admin)
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.n('select id from public.chat_contexts') = 3, 'jose: reads every context, drafts included');
select t.ok(t.n('select id from public.chat_threads') = 2
            and t.n($q$select id from public.chat_threads where user_id is null$q$) = 1
            and t.n($q$select id from public.chat_messages
                      where thread_id = '00000000-0000-4000-8000-000000000c01'$q$) = 2,
            'jose: reads both threads, the anonymous one and its messages included');
select t.ok(t.err($q$insert into public.chat_contexts ("case", locale, version, status, body_md)
                    values ('client', 'es', 9, 'published', 'x')$q$) ~ '^23505 .*uq_chat_contexts_published',
            'only one published context per case and locale');
select t.ok(t.err($q$insert into public.chat_contexts ("case", locale, version, body_md)
                    values ('client', 'es', 1, 'x')$q$) ~ '^23505 .*chat_contexts_version_key',
            'a version number is unique per case and locale');
select t.ok(t.err($q$insert into public.chat_contexts ("case", locale, version, body_md, facts)
                    values ('client', 'en', 1, 'x', '[]')$q$) like '23514 %',
            'facts must be a JSON object');
do $$
begin
  perform t.ok(t.err($q$update public.chat_contexts set status = 'archived'
                         where "case" = 'client' and locale = 'es' and status = 'published';
                       insert into public.chat_contexts ("case", locale, version, status, body_md, published_at, published_by)
                       values ('client', 'es', 2, 'published', 'v2', now(), '00000000-0000-4000-8000-0000000000a1')$q$)
               is null
               and t.val($q$select version from public.chat_contexts
                           where "case" = 'client' and locale = 'es' and status = 'published'$q$) = '2',
               'jose publishes v2 by archiving v1 in the same transaction');
end $$;
select t.ok(t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                    values ('00000000-0000-4000-8000-000000000c01', 'assistant', 'x')$q$) like '42501 %'
            and t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                        values ('00000000-0000-4000-8000-000000000c01', 'visitor', 'x')$q$) like '42501 %',
            'jose: cannot write as the assistant or the visitor');
select t.ok(t.affected($q$update public.chat_threads set ai_enabled = false, status = 'handed_over',
                         unread_for_admin = false where id = '00000000-0000-4000-8000-000000000c01'$q$) = 1,
            'jose takes over the anonymous thread (ai off, handed_over, read)');
select t.ok(t.err($q$insert into public.chat_messages (thread_id, sender_role, content)
                    values ('00000000-0000-4000-8000-000000000c01', 'jose', 'Hola, soy Jose')$q$) is null
            and t.val($q$select unread_for_admin::text || ':' || (last_message_at > now() - interval '1 minute')::text
                        from public.chat_threads where id = '00000000-0000-4000-8000-000000000c01'$q$) = 'false:true',
            'jose replies as jose: last_message_at moves, the thread stays read');
select t.ok(t.err(format($q$insert into public.chat_messages (thread_id, sender_role, content)
                           values ('00000000-0000-4000-8000-000000000c01', 'jose', %L)$q$, repeat('x', 8001)))
            like '23514 %',
            'a message is at most 8000 characters');
select t.ok((public.admin_counters() ->> 'chat_unread') = '0', 'admin_counters: chat_unread follows unread_for_admin');
reset role;
select t.ok((select count(*) from private.outbox where event = 'chat.visitor_message') = 2,
            'a jose reply enqueues no chat.visitor_message');
rollback;

-- ================================================================ service role (gateway): context, visitor messages
begin;
set local role service_role;
select t.ok((select public.chat_context_published('client', 'es') ->> 'version') = '1'
            and (select array_agg(k order by k) from jsonb_object_keys(public.chat_context_published('client', 'es')) k)
                = array['body_md', 'facts', 'title', 'version']
            and (public.chat_context_published('client', 'es') -> 'facts' ->> 'rates_ref') = 'pricing',
            'chat_context_published returns {version, title, body_md, facts} of the published context');
select t.ok(public.chat_context_published('partner', 'es') is null
            and public.chat_context_published('client', 'en') is null,
            'chat_context_published returns null for a draft-only case and for a locale without context');
do $$
declare
  v_thread uuid;
  v_msg    uuid;
  v_at     timestamptz;
  r        record;
  v_found  boolean := false;
begin
  insert into public.chat_threads (visitor_id, "case", locale, origin_path)
  values (gen_random_uuid(), 'curious', 'es', '/') returning id into v_thread;
  perform t.ok((select not unread_for_admin and last_message_at is null from public.chat_threads where id = v_thread),
               'a new thread starts read and without last_message_at');
  insert into public.chat_messages (thread_id, sender_role, content) values (v_thread, 'visitor', 'hola')
  returning id, created_at into v_msg, v_at;
  perform t.ok((select unread_for_admin and last_message_at = v_at from public.chat_threads where id = v_thread),
               'a visitor message marks the thread unread_for_admin and sets last_message_at');
  for r in select * from public.outbox_claim(200, 'chat-test') loop
    if r.event = 'chat.visitor_message' and r.payload ->> 'id' = v_msg::text then
      v_found := r.payload ->> 'thread_id' = v_thread::text and r.payload ->> 'case' = 'curious'
                 and r.payload ->> 'locale' = 'es' and not r.payload ? 'content';
    end if;
  end loop;
  perform t.ok(v_found, 'the visitor message enqueues chat.visitor_message {id, thread_id, case, locale}, no content');

  update public.chat_threads set unread_for_admin = false where id = v_thread;
  insert into public.chat_messages (thread_id, sender_role, content, created_at)
  values (v_thread, 'assistant', 'respuesta', v_at + interval '1 second');
  perform t.ok((select not unread_for_admin and last_message_at = v_at + interval '1 second'
                from public.chat_threads where id = v_thread),
               'an assistant message moves last_message_at and leaves the thread read');
  insert into public.chat_messages (thread_id, sender_role, content, created_at)
  values (v_thread, 'visitor', 'late', v_at - interval '1 hour');
  perform t.ok((select last_message_at = v_at + interval '1 second' from public.chat_threads where id = v_thread),
               'a message stamped in the past never moves last_message_at back');
end $$;
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, actor, chat_thread_id)
                    values ('00000000-0000-4000-8000-000000000202', 'chat_thread', 'system',
                            '00000000-0000-4000-8000-0000000000ff')$q$) like '23503 %',
            'crm_interactions.chat_thread_id must be an existing thread');
rollback;

-- ================================================================ service role: chat_purge_anonymous
begin;
set local role service_role;
insert into public.chat_threads (id, visitor_id, user_id, contact_id, "case", locale, created_at) values
  ('00000000-0000-4000-8000-0000000000f1', gen_random_uuid(), null, null, 'curious', 'es', now() - interval '120 days'),
  ('00000000-0000-4000-8000-0000000000f2', gen_random_uuid(), null, null, 'curious', 'es', now() - interval '120 days'),
  ('00000000-0000-4000-8000-0000000000f3', gen_random_uuid(), '00000000-0000-4000-8000-0000000000a3', null, 'client',
   'es', now() - interval '120 days'),
  ('00000000-0000-4000-8000-0000000000f4', gen_random_uuid(), null, '00000000-0000-4000-8000-000000000204', 'recruiter',
   'en', now() - interval '120 days'),
  ('00000000-0000-4000-8000-0000000000f5', gen_random_uuid(), null, null, 'curious', 'es', now() - interval '120 days'),
  ('00000000-0000-4000-8000-0000000000f6', gen_random_uuid(), null, null, 'curious', 'es', now() - interval '120 days');
insert into public.chat_messages (thread_id, sender_role, content, created_at) values
  ('00000000-0000-4000-8000-0000000000f1', 'visitor', 'old', now() - interval '100 days'),  -- anonymous, idle 100 d
  ('00000000-0000-4000-8000-0000000000f2', 'visitor', 'old', now() - interval '100 days'),  -- anonymous, but active
  ('00000000-0000-4000-8000-0000000000f2', 'visitor', 'new', now() - interval '3 days'),
  ('00000000-0000-4000-8000-0000000000f3', 'visitor', 'old', now() - interval '100 days'),  -- bob's
  ('00000000-0000-4000-8000-0000000000f4', 'visitor', 'old', now() - interval '100 days');  -- linked to a contact
-- …f5: anonymous, no message, created 120 days ago. …f6: anonymous and idle, but a CRM interaction points at it.
insert into public.crm_interactions (contact_id, kind, actor, chat_thread_id) values
  ('00000000-0000-4000-8000-000000000204', 'chat_thread', 'system', '00000000-0000-4000-8000-0000000000f4'),
  ('00000000-0000-4000-8000-000000000204', 'chat_thread', 'system', '00000000-0000-4000-8000-0000000000f6');
select t.ok(t.err($q$select public.chat_purge_anonymous('1 hour')$q$) = '22023 interval_too_short'
            and t.err('select public.chat_purge_anonymous(null)') = '22023 interval_too_short',
            'chat_purge_anonymous refuses intervals under a day');
select t.ok(public.chat_purge_anonymous('90 days') = 2,
            'chat_purge_anonymous(90 days) deletes the two anonymous threads without contact idle for longer');
select t.ok((select string_agg(right(id::text, 2), ',' order by id) from public.chat_threads
             where id::text like '00000000-0000-4000-8000-0000000000f_') = 'f2,f3,f4,f6'
            and exists (select 1 from public.chat_threads where id = '00000000-0000-4000-8000-000000000c01')
            and exists (select 1 from public.chat_threads where id = '00000000-0000-4000-8000-000000000c02'),
            'kept: the recently active anonymous thread, the user''s, the contact''s, the one a CRM interaction '
            'points at, and the seeded ones');
select t.ok(not exists (select 1 from public.chat_messages where thread_id = '00000000-0000-4000-8000-0000000000f1'),
            'the messages of a purged thread go with it (cascade)');
select t.ok(public.chat_purge_anonymous('90 days') = 0, 'chat_purge_anonymous is idempotent');
reset role;
delete from public.chat_threads where id = '00000000-0000-4000-8000-0000000000f4';
select t.ok((select chat_thread_id is null from public.crm_interactions
             where contact_id = '00000000-0000-4000-8000-000000000204' and kind = 'chat_thread'
               and chat_thread_id is distinct from '00000000-0000-4000-8000-0000000000f6'),
            'deleting a thread keeps its CRM interaction with chat_thread_id set to null');
rollback;

-- ================================================================ chat_context_publish (C8, admin only)
begin;
select t.ok(has_function_privilege('authenticated', 'public.chat_context_publish(uuid)', 'execute')
            and not has_function_privilege('anon', 'public.chat_context_publish(uuid)', 'execute')
            and (select not prosecdef from pg_proc where proname = 'chat_context_publish'),
            'chat_context_publish: authenticated may call it (it checks is_admin), anon not; security invoker');
set local role anon;
select t.ok(t.err($q$select public.chat_context_publish('00000000-0000-4000-8000-000000000b03')$q$) like '42501 %',
            'anon: chat_context_publish denied');
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.err($q$select public.chat_context_publish('00000000-0000-4000-8000-000000000b03')$q$)
            = '42501 forbidden', 'ana: chat_context_publish is forbidden');
reset role;
set local role service_role;
select t.ok(t.err($q$select public.chat_context_publish('00000000-0000-4000-8000-000000000b03')$q$)
            = '42501 forbidden', 'service role: chat_context_publish is for the admin only');
reset role;
set local role authenticated;
set local request.jwt.claims = :'jose';
insert into public.chat_contexts (id, "case", locale, version, body_md)
values ('00000000-0000-4000-8000-000000000bf2', 'client', 'es', 2, 'v2');
select t.ok(public.chat_context_publish('00000000-0000-4000-8000-000000000bf2')
            = '{"id":"00000000-0000-4000-8000-000000000bf2","version":2,"archived_version":1}'::jsonb
            and t.val($q$select string_agg(version || ':' || status, ',' order by version) from public.chat_contexts
                        where "case" = 'client' and locale = 'es'$q$) = '1:archived,2:published'
            and t.val($q$select (published_by = '00000000-0000-4000-8000-0000000000a1'
                                 and published_at > now() - interval '1 minute')::text
                        from public.chat_contexts where id = '00000000-0000-4000-8000-000000000bf2'$q$) = 'true',
            'jose publishes v2 in one call: v1 archived, v2 published with published_at and published_by');
select t.ok((public.chat_context_publish('00000000-0000-4000-8000-000000000b01') ->> 'archived_version') = '2'
            and t.val($q$select version from public.chat_contexts
                        where "case" = 'client' and locale = 'es' and status = 'published'$q$) = '1',
            'republishing the archived v1 rolls back and archives v2');
select t.ok((public.chat_context_publish('00000000-0000-4000-8000-000000000b01') -> 'archived_version') = 'null'::jsonb
            and t.n($q$select id from public.chat_contexts
                      where "case" = 'client' and locale = 'es' and status = 'published'$q$) = 1,
            'publishing the published version changes nothing');
select t.ok((public.chat_context_publish('00000000-0000-4000-8000-000000000b03') -> 'archived_version') = 'null'::jsonb
            and t.val($q$select status from public.chat_contexts
                        where id = '00000000-0000-4000-8000-000000000b02'$q$) = 'published',
            'publishing the partner/es draft touches no other case (curious/es stays published)');
select t.ok(t.err($q$select public.chat_context_publish('00000000-0000-4000-8000-0000000000ff')$q$)
            = 'P0002 context_not_found', 'chat_context_publish: unknown id');
rollback;
