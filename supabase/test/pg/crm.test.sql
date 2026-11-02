-- Assertions for task 1.8a (plan v3.2; DATOS v1.1 §4.3–§4.5, §5, §6, §8.3): SQL equivalents of every cell of the
-- DATOS §5 table for the crm, leads, area, affiliates, comments and storage rows, with the seeded accounts
-- jose (admin, a1), ana (P2 client + standard affiliate, a2), bob (premium affiliate, no client, a3), sin (unconfirmed,
-- a4) and anon, plus the RPC behaviours of the plan's test extract. Runs after base.test.sql on the same throwaway
-- database (supabase/test/pg/run.sh). Blocks run in their own transaction and roll back.
--
-- Helpers live in schema t (test database only). They run as the caller (security invoker), so RLS and grants apply:
--   t.ok(cond, what)   raises `PASS what` as a notice, or an exception `FAIL what`.
--   t.n(query)         number of rows the query returns.
--   t.err(query)       null when the statement succeeds (its effects stay), else 'SQLSTATE message'.
--   t.affected(dml)    rows changed by an insert/update/delete.
--   t.val(query)       first column of the first row, as text.
\o /dev/null
\set jose '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal2","email":"jose@test"}'
\set ana '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated","email":"ana@test"}'
\set bob '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated","email":"bob@test"}'
\set sin '{"sub":"00000000-0000-4000-8000-0000000000a4","role":"authenticated","email":"sin@test"}'

create schema if not exists t;  -- chat.test.sql (earlier in the run) creates the same helpers
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

-- ================================================================ structure (as postgres)
begin;
select t.ok((select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity and c.relname in (
               'crm_organizations', 'crm_contacts', 'leads', 'crm_interactions', 'crm_message_templates',
               'crm_message_drafts', 'clients', 'client_tasks', 'client_task_comments', 'client_assets',
               'client_extras', 'upgrade_requests', 'affiliates', 'affiliate_rewards', 'blog_comments')) = 15,
            'the 15 tables of DATOS §4.3-4.5 exist with RLS enabled');

-- P4: every foreign key in public has an index whose leading columns are the FK columns.
select t.ok(not exists (
  select 1 from pg_constraint k join pg_namespace s on s.oid = k.connamespace
  where s.nspname = 'public' and k.contype = 'f'
    and not exists (select 1 from pg_index i
                    where i.indrelid = k.conrelid
                      and (i.indkey::int2[])[0:array_length(k.conkey, 1) - 1] = k.conkey)),
  'every foreign key in public is covered by an index (P4)');

select t.ok(
  (select string_agg(t.typname || '=' || (select string_agg(e.enumlabel, ',' order by e.enumsortorder)
                                          from pg_enum e where e.enumtypid = t.oid), ' ' order by t.typname)
     from pg_type t join pg_namespace s on s.oid = t.typnamespace
    where s.nspname = 'public' and t.typname in ('contact_kind', 'lead_status', 'lead_source', 'contact_via',
                                                 'project_phase', 'affiliate_level', 'reward_type', 'comment_status'))
  = 'affiliate_level=standard,premium comment_status=pending,approved,rejected '
    'contact_kind=lead,client,agency,recruiter,other contact_via=client,partner,recruiter,other '
    'lead_source=web_form,web_proposal,chat,calcom,partner_form,manual,referral lead_status=open,won,lost '
    'project_phase=kickoff,design,build,review,delivered,maintenance reward_type=maintenance_months,percent',
  'enums match DATOS §4.3-4.5');

select t.ok((select count(*) from pg_type t join pg_namespace s on s.oid = t.typnamespace
             where s.nspname = 'public' and t.typtype = 'e'
               and t.typname not in ('context_status', 'thread_status', 'chat_sender', 'chat_message_type'))
            = 3 + 10 + 3 + 5 + 3 + 1 + 13,
            'public has the 38 enums of DATOS §4.1, §4.3-4.5 and the 13 of 1.8e (chat_case included, used by crm_contacts; the other '
            'chat enums are counted in chat.test.sql)');

-- Grants: anon only reads the public columns of blog_comments; nothing else of 1.8a.
select t.ok(not exists (select 1 from information_schema.role_table_grants
                        where grantee = 'anon' and table_schema in ('public', 'private', 'storage')
                          and table_name not in ('buckets', 'objects')),
            'anon: no table-level grant in public/private');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'anon' and table_schema = 'public')
            = 'author_name,body,created_at,id,locale,parent_id,post_slug,status',
            'anon: select on the public columns of blog_comments only (no user_id, no moderation data)');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'clients'
               and privilege_type = 'SELECT')
            = 'created_at,delivered_at,id,pack_code,pack_option,project_phase,starts_at',
            'authenticated: clients select by column, without notes_internal (DATOS §4.4)');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'affiliates'
               and privilege_type = 'INSERT') = 'user_id'
            and not has_table_privilege('authenticated', 'public.affiliates', 'insert'),
            'authenticated: affiliates insert only on user_id (code and level are never chosen by the user)');
select t.ok(not has_table_privilege('authenticated', 'public.leads', 'delete'),
            'authenticated: no delete on leads (closed, never removed)');

select t.ok((select public = false and file_size_limit = 26214400 and 'application/pdf' = any (allowed_mime_types)
                    and 'image/png' = any (allowed_mime_types)
             from storage.buckets where id = 'client-assets'),
            'bucket client-assets is private, 25 MiB, with images and PDF');
select t.ok((select allowed_mime_types = array[
                      'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'application/pdf', 'text/plain',
                      'text/csv', 'application/zip', 'application/msword',
                      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                      'application/vnd.ms-powerpoint',
                      'application/vnd.openxmlformats-officedocument.presentationml.presentation']
                    and not exists (select 1 from unnest(allowed_mime_types) m where m like '%*%' or m like '%svg%')
             from storage.buckets where id = 'client-assets'),
            'bucket client-assets: explicit MIME allowlist, no wildcard and no SVG');
select t.ok((select string_agg(cmd, ',' order by cmd) from pg_policies
             where schemaname = 'storage' and tablename = 'objects' and policyname like 'client_assets_%')
            = 'DELETE,INSERT,SELECT', 'storage.objects: select/insert/delete policies for client-assets, no update');

select t.ok((select count(*) = 8 and bool_and(body !~ '@' and (max_chars is null or char_length(body) <= max_chars))
                    and bool_and(body like '%{{DATO:%') and bool_and(cardinality(rules) > 0)
             from public.crm_message_templates),
            'templates: 8 neutral launch templates (es/en), no emails, within max_chars, real copy marked {{DATO}}');

select t.ok((select string_agg(proargnames[i], ',' order by i)
             from pg_proc p, generate_subscripts(p.proargnames, 1) i
             where p.proname = 'affiliate_leads' and p.proargmodes[i] = 't')
            = 'lead_id,created_at,status,pack_code,reward_status',
            'affiliate_leads() returns five columns and no contact data');
select t.ok((select string_agg(proargnames[i], ',' order by i)
             from pg_proc p, generate_subscripts(p.proargnames, 1) i
             where p.proname = 'area_lead_summary' and p.proargmodes[i] = 't')
            = 'pack_code,pack_option,price_from,status,created_at',
            'area_lead_summary() returns five columns (no ai_proposal, no amount)');

select t.ok((select count(*) from private.outbox where event = 'comment.pending') = 2,
            'seed: the two pending comments enqueued comment.pending');
rollback;

-- ================================================================ anon
begin;
set local role anon;
select t.ok(bool_and(t.err(format('select id from public.%I', x)) like '42501 %'),
            'anon: permission denied on every crm_*, leads, client_*, upgrade_requests, affiliates, affiliate_rewards')
  from unnest(array['crm_organizations', 'crm_contacts', 'crm_interactions', 'crm_message_templates',
                    'crm_message_drafts', 'leads', 'clients', 'client_tasks', 'client_task_comments', 'client_assets',
                    'client_extras', 'upgrade_requests', 'affiliates', 'affiliate_rewards']) x;
select t.ok(t.n('select id from public.blog_comments') = 1
            and t.n($q$select id from public.blog_comments where status <> 'approved'$q$) = 0,
            'anon: blog_comments returns only the approved comment');
select t.ok(t.err('select user_id from public.blog_comments') like '42501 %',
            'anon: blog_comments.user_id is not readable');
select t.ok(t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body)
                    values ('x', 'es', '00000000-0000-4000-8000-0000000000a2', 'A', 'b')$q$) like '42501 %',
            'anon: cannot insert comments');
select t.ok(bool_and(t.err(q) like '42501 %'), 'anon: permission denied on every 1.8a RPC')
  from unnest(array[$q$select public.create_lead('{}')$q$, 'select public.area_lead_summary()',
                    'select public.claim_client_access()', 'select public.affiliate_leads()',
                    'select public.admin_counters()', $q$select public.request_upgrade('P3')$q$,
                    $q$select public.crm_import_organizations('[]')$q$, 'select * from public.admin_clients()',
                    $q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1)$q$]) q;
select t.ok(t.n($q$select id from storage.objects where bucket_id = 'client-assets'$q$) = 0,
            'anon: no client-assets object is visible');
rollback;

-- ================================================================ ana: CRM and leads are invisible
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(bool_and(t.n(format('select id from public.%I', x)) = 0), 'ana: 0 rows of every crm_* table and of leads')
  from unnest(array['crm_organizations', 'crm_contacts', 'crm_interactions', 'crm_message_templates',
                    'crm_message_drafts', 'leads']) x;
select t.ok(t.err($q$insert into public.crm_contacts (kind, status, display_name, source)
                    values ('lead', 'new', 'X', 'manual')$q$) like '42501 %'
            and t.err($q$insert into public.leads (contact_id, source)
                        values ('00000000-0000-4000-8000-000000000202', 'manual')$q$) like '42501 %',
            'ana: cannot insert contacts nor leads');
select t.ok(t.affected($q$update public.crm_contacts set owner_note = 'x'$q$) = 0
            and t.affected($q$update public.leads set message = 'x'$q$) = 0,
            'ana: updates on crm_contacts and leads change 0 rows');
select t.ok(t.err($q$select public.create_lead('{}')$q$) like '42501 %', 'ana: cannot call create_lead');
select t.ok(t.err($q$select * from public.crm_import_organizations('[]')$q$) ~ '^42501 (forbidden|permission)',
            'ana: crm_import_organizations is forbidden');
select t.ok(t.err('select public.admin_counters()') = '42501 forbidden', 'ana: admin_counters is forbidden');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1400)$q$)
            = '42501 forbidden', 'ana: admin_close_lead_paid is forbidden');
select t.ok(t.err('select * from public.admin_clients()') = '42501 forbidden'
            and t.err($q$select notes_internal from public.admin_clients('00000000-0000-4000-8000-000000000401')$q$)
                = '42501 forbidden',
            'ana: admin_clients is forbidden, also for her own client (notes_internal stays hidden)');
rollback;

-- ================================================================ ana: area (clients, tasks, comments, extras, upgrades)
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n('select id, pack_code from public.clients') = 1
            and t.val('select id from public.clients') = '00000000-0000-4000-8000-000000000401',
            'ana: reads exactly her client');
select t.ok(t.err('select notes_internal from public.clients') like '42501 %'
            and t.err('select * from public.clients') like '42501 %',
            'ana: notes_internal is hidden by the column grant');
select t.ok(t.affected($q$update public.clients set project_phase = 'delivered'$q$) = 0,
            'ana: cannot update her client');
select t.ok(t.n('select id from public.client_tasks') = 2, 'ana: reads her two tasks');
select t.ok(t.n('select id from public.client_task_comments') = 1
            and t.n('select id from public.client_task_comments where internal') = 0,
            'ana: reads only the non-internal task comment');
select t.ok(t.err($q$insert into public.client_task_comments (client_id, task_id, author_user_id, body)
                    values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502',
                            '00000000-0000-4000-8000-0000000000a2', 'ok')$q$) is null,
            'ana: inserts a non-internal comment on her task');
select t.ok(t.err($q$insert into public.client_task_comments (client_id, task_id, author_user_id, body, internal)
                    values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502',
                            '00000000-0000-4000-8000-0000000000a2', 'x', true)$q$) like '42501 %',
            'ana: an internal comment fails');
select t.ok(t.err($q$insert into public.client_task_comments (client_id, author_user_id, body)
                    values ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-0000000000a2', 'x')$q$)
            like '42501 %'
            and t.err($q$insert into public.client_task_comments (client_id, author_user_id, body)
                        values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a1', 'x')$q$)
            like '42501 %',
            'ana: cannot comment on another client nor as another author');
select t.ok(t.n('select id from public.client_extras') = 1, 'ana: reads her included extra');
select t.ok(t.err($q$insert into public.client_extras (client_id, extra_code, status)
                    values ('00000000-0000-4000-8000-000000000401', 'geo', 'active')$q$) like '42501 %',
            'ana: cannot add extras directly');
select t.ok(t.n('select id from public.upgrade_requests') = 0
            and t.err($q$insert into public.upgrade_requests (client_id, from_pack_code, to_pack_code, computed_price, pricing_version)
                        values ('00000000-0000-4000-8000-000000000401', 'P2', 'P3', 1, '2026-09-14')$q$) like '42501 %',
            'ana: no upgrade yet, and no direct insert');
do $$
declare v uuid;
begin
  v := public.request_upgrade('P3');
  perform t.ok((select computed_price = 1100 and from_pack_code = 'P2' and to_pack_code = 'P3' and status = 'pending'
                       and pricing_version = '2026-09-14'
                from public.upgrade_requests where id = v),
               'ana: request_upgrade P2 -> P3 is priced 1100 by the database');
  perform t.ok(t.err($q$select public.request_upgrade(null, array['geo'])$q$) = '23505 upgrade_already_pending',
               'ana: a second request while one is pending is refused (upgrade_already_pending, 23505)');
  perform t.ok(t.affected($q$update public.upgrade_requests set status = 'rejected' where id = '$q$ || v || $q$'$q$) = 0,
               'ana: cannot resolve her own pending request to free the slot');
  -- Jose resolves it (as postgres here; the admin update policy is covered in the jose block).
  reset role;
  update public.upgrade_requests set status = 'rejected' where id = v;
  set local role authenticated;
  v := public.request_upgrade(null, array['seo_basic', 'seo_basic']);
  perform t.ok((select computed_price = 250 and extras = array['seo_basic'] from public.upgrade_requests where id = v),
               'ana: once the pending one is resolved, an extra alone is priced at list (250), deduplicated');
end $$;
select t.ok(t.err($q$select public.request_upgrade('P1')$q$) like '% not_an_upgrade'
            and t.err($q$select public.request_upgrade(null, array['nope'])$q$) like '% unknown_extra'
            and t.err($q$select public.request_upgrade('P9')$q$) like '% unknown_pack'
            and t.err('select public.request_upgrade(null)') like '% nothing_requested',
            'ana: request_upgrade rejects downgrades, unknown extras/packs and empty requests');
select t.ok(t.n('select id from public.upgrade_requests') = 2
            and t.n($q$select id from public.upgrade_requests where status = 'pending'$q$) = 1,
            'ana: reads her own upgrade requests, one of them pending');
select t.ok(t.val('select public.claim_client_access()') = '00000000-0000-4000-8000-000000000401',
            'ana: claim_client_access is idempotent for an already linked client');
select t.ok(t.n('select * from public.area_lead_summary()') = 1
            and t.val($q$select pack_code || ':' || price_from || ':' || status from public.area_lead_summary()$q$)
                = 'P2:1400:won',
            'ana: area_lead_summary returns her P2 lead (1400, won)');
reset role;
select t.ok((select count(*) from private.outbox where event = 'upgrade.requested') = 2,
            'request_upgrade enqueues upgrade.requested (once per accepted request, none for the refused one)');
select t.ok(t.err($q$insert into public.upgrade_requests (client_id, from_pack_code, to_pack_code, computed_price, pricing_version)
                    values ('00000000-0000-4000-8000-000000000401', 'P2', 'P4', 1, '2026-09-14')$q$)
            like '23505 %uq_upgrade_requests_pending%',
            'uq_upgrade_requests_pending: a second pending row is refused even outside the RPC (race between two calls)');
rollback;

-- ================================================================ ana: storage and client_assets
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name)
                    values ('00000000-0000-4000-8000-000000000b01', '00000000-0000-4000-8000-000000000401',
                            '00000000-0000-4000-8000-0000000000a2', 'client',
                            'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-000000000b01', 'logo.png')$q$)
            is null, 'ana: creates an asset row for her client');
select t.ok(t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path)
                    values ('00000000-0000-4000-8000-000000000b02', '00000000-0000-4000-8000-000000000401',
                            '00000000-0000-4000-8000-0000000000a2', 'client',
                            'clients/00000000-0000-4000-8000-000000000401/other')$q$) like '23514 %',
            'client_assets: storage_path must be clients/<client_id>/<id>');
select t.ok(t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path)
                    values ('00000000-0000-4000-8000-000000000b03', '00000000-0000-4000-8000-000000000401',
                            '00000000-0000-4000-8000-0000000000a2', 'admin',
                            'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-000000000b03')$q$)
            like '42501 %'
            and t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path)
                        values ('00000000-0000-4000-8000-000000000b04', '00000000-0000-4000-8000-000000000402',
                                '00000000-0000-4000-8000-0000000000a2', 'client',
                                'clients/00000000-0000-4000-8000-000000000402/00000000-0000-4000-8000-000000000b04')$q$)
            like '42501 %',
            'ana: cannot create admin assets nor assets of another client');
select t.ok(t.err($q$insert into storage.objects (bucket_id, name, owner_id)
                    values ('client-assets',
                            'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-000000000b01',
                            '00000000-0000-4000-8000-0000000000a2')$q$) is null,
            'ana: uploads under clients/<her id>/<asset id>');
select t.ok(t.err($q$insert into storage.objects (bucket_id, name)
                    values ('client-assets', 'clients/00000000-0000-4000-8000-000000000401/no-row')$q$) like '42501 %',
            'ana: an upload without its client_assets row fails');
select t.ok(t.err($q$insert into storage.objects (bucket_id, name)
                    values ('client-assets', 'clients/00000000-0000-4000-8000-000000000402/x')$q$) like '42501 %'
            and t.err($q$insert into storage.objects (bucket_id, name) values ('client-assets', 'elsewhere/x')$q$)
                like '42501 %',
            'ana: cannot upload into another client folder or outside clients/');
select t.ok(t.n($q$select id from storage.objects where bucket_id = 'client-assets'$q$) = 1
            and t.n('select id from public.client_assets') = 1,
            'ana: sees her object and her asset row');
select t.ok(t.affected($q$update public.client_assets set title = 'x'$q$) = 0, 'ana: cannot update asset rows');
reset role;
-- Jose uploads one into Ana's folder: Ana sees it but cannot delete it.
insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path)
values ('00000000-0000-4000-8000-000000000b05', '00000000-0000-4000-8000-000000000401',
        '00000000-0000-4000-8000-0000000000a1', 'admin',
        'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-000000000b05');
insert into storage.objects (bucket_id, name)
values ('client-assets', 'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-000000000b05');
insert into storage.objects (bucket_id, name) values ('client-assets', 'clients/00000000-0000-4000-8000-000000000402/y');
set local role authenticated;
select t.ok(t.n($q$select id from storage.objects where bucket_id = 'client-assets'$q$) = 2,
            'ana: sees the two objects of her folder, not the other client''s');
select t.ok(t.affected($q$delete from storage.objects where name like '%000000000b05'$q$) = 0
            and t.affected($q$delete from public.client_assets where id = '00000000-0000-4000-8000-000000000b05'$q$) = 0,
            'ana: cannot delete what Jose uploaded (object nor row)');
select t.ok(t.affected($q$delete from storage.objects where name like '%000000000b01'$q$) = 1
            and t.affected($q$delete from public.client_assets where id = '00000000-0000-4000-8000-000000000b01'$q$) = 1,
            'ana: deletes her own upload (object first, then row)');
reset role;
select t.ok((select count(*) from private.outbox where event = 'asset.uploaded') = 1,
            'a client upload enqueues asset.uploaded (the admin one does not)');
set local role authenticated;
set local request.jwt.claims = :'bob';
select t.ok(t.n($q$select id from storage.objects where bucket_id = 'client-assets'$q$) = 0
            and t.err($q$insert into storage.objects (bucket_id, name)
                        values ('client-assets', 'clients/00000000-0000-4000-8000-000000000401/z')$q$) like '42501 %',
            'bob (no client): sees and uploads no client-assets object');
set local request.jwt.claims = :'jose';
select t.ok(t.n($q$select id from storage.objects where bucket_id = 'client-assets'$q$) = 2,
            'jose: sees every client-assets object');
select t.ok(t.err($q$insert into storage.objects (bucket_id, name)
                    values ('client-assets', 'clients/00000000-0000-4000-8000-000000000402/no-row')$q$) like '42501 %',
            'jose: an upload also needs its client_assets row');
select t.ok(t.affected($q$delete from storage.objects where name like '%000000000b05'$q$) = 1,
            'jose: deletes any client-assets object');
rollback;

-- ================================================================ ana: affiliates and comments
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n('select id from public.affiliates') = 1
            and t.val('select code from public.affiliates') = 'ANA-TEST01',
            'ana: reads only her affiliate row (ANA-TEST01)');
select t.ok(t.affected($q$update public.affiliates set level = 'premium'$q$) = 0
            and t.val('select level from public.affiliates') = 'standard',
            'ana: cannot change her level');
select t.ok(t.err($q$insert into public.affiliates (user_id, level) values ('00000000-0000-4000-8000-0000000000a2', 'premium')$q$)
            like '42501 %'
            and t.err($q$insert into public.affiliates (user_id) values ('00000000-0000-4000-8000-0000000000a4')$q$)
            like '42501 %',
            'ana: cannot choose a level nor enrol someone else');
select t.ok(t.n('select id from public.affiliate_rewards') = 0, 'ana: has no rewards');
select t.ok(t.n('select * from public.affiliate_leads()') = 1
            and t.val('select lead_id from public.affiliate_leads()') = '00000000-0000-4000-8000-000000000301',
            'ana: affiliate_leads returns the lead she referred (Marta)');
select t.ok(t.n('select id from public.blog_comments') = 2
            and t.n($q$select id from public.blog_comments where status = 'pending'$q$) = 1
            and t.val($q$select id from public.blog_comments where status = 'pending'$q$) = '00000000-0000-4000-8000-000000000a02',
            'ana: sees the approved comment and her own pending one, not bob''s');
select t.ok(t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body)
                    values ('hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana', 'new')$q$) is null,
            'ana: inserts a pending comment');
select t.ok(t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body, status)
                    values ('hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana', 'x', 'approved')$q$)
            like '42501 %'
            and t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body)
                        values ('hello-world', 'es', '00000000-0000-4000-8000-0000000000a3', 'Bob', 'x')$q$) like '42501 %',
            'ana: cannot insert an approved comment nor one as bob');
select t.ok(t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body, parent_id)
                    values ('hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana', 'reply',
                            '00000000-0000-4000-8000-000000000a01')$q$) is null
            and t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body, parent_id)
                        values ('hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana', 'x',
                                '00000000-0000-4000-8000-000000000a03')$q$) like '42501 %'
            and t.err($q$insert into public.blog_comments (post_slug, locale, user_id, author_name, body, parent_id)
                        values ('other-post', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana', 'x',
                                '00000000-0000-4000-8000-000000000a01')$q$) like '42501 %',
            'ana: replies only to an approved comment of the same post');
select t.ok(t.affected($q$update public.blog_comments set status = 'approved'$q$) = 0
            and t.affected('delete from public.blog_comments') = 0,
            'ana: cannot moderate nor delete comments');
reset role;
select t.ok((select count(*) from private.outbox where event = 'comment.pending') = 4,
            'each new pending comment enqueues comment.pending');
rollback;

-- ================================================================ bob: affiliate without client
begin;
set local role authenticated;
set local request.jwt.claims = :'bob';
select t.ok(bool_and(t.n(format('select id from public.%I', x)) = 0),
            'bob: 0 rows of crm_*, leads, clients, client_* and upgrade_requests')
  from unnest(array['crm_organizations', 'crm_contacts', 'crm_interactions', 'crm_message_templates',
                    'crm_message_drafts', 'leads', 'clients', 'client_tasks', 'client_task_comments',
                    'client_assets', 'client_extras', 'upgrade_requests']) x;
select t.ok(t.err($q$select public.request_upgrade('P3')$q$) like '42501 not_a_client',
            'bob: request_upgrade says not_a_client');
select t.ok(t.val('select public.claim_client_access()') is null, 'bob: claim_client_access returns null (no invite)');
select t.ok(t.n('select * from public.area_lead_summary()') = 0, 'bob: area_lead_summary is empty');
select t.ok(t.n('select id from public.affiliates') = 1 and t.val('select level from public.affiliates') = 'premium',
            'bob: reads his premium affiliate row');
select t.ok(t.n('select id from public.affiliate_rewards') = 1
            and t.err($q$insert into public.affiliate_rewards (affiliate_id, lead_id, type, amount)
                        values ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000301', 'percent', 1)$q$)
                like '42501 %'
            and t.affected($q$update public.affiliate_rewards set status = 'paid', paid_at = now()$q$) = 0,
            'bob: reads his reward and cannot create or mark rewards');
select t.ok(t.val('select lead_id || '':'' || reward_status from public.affiliate_leads()')
            = '00000000-0000-4000-8000-000000000302:pending',
            'bob: affiliate_leads returns Ana''s lead with its pending reward');
select t.ok(t.n('select id from public.blog_comments') = 2
            and t.val($q$select id from public.blog_comments where status = 'pending'$q$) = '00000000-0000-4000-8000-000000000a03',
            'bob: sees the approved comment and his own pending one');
select t.ok(t.err('select public.admin_counters()') = '42501 forbidden'
            and t.err('select * from public.admin_clients()') = '42501 forbidden',
            'bob: admin_counters and admin_clients are forbidden');
rollback;

-- ================================================================ sin: unconfirmed email
begin;
set local role authenticated;
set local request.jwt.claims = :'sin';
select t.ok(t.err('select public.claim_client_access()') = '42501 email_not_confirmed',
            'sin: claim_client_access refuses the unconfirmed email');
select t.ok(t.err('select * from public.area_lead_summary()') = '42501 email_not_confirmed',
            'sin: area_lead_summary refuses the unconfirmed email');
select t.ok(t.err($q$select public.request_upgrade('P3')$q$) = '42501 email_not_confirmed',
            'sin: request_upgrade refuses the unconfirmed email');
select t.ok(t.n('select id from public.clients') = 0 and t.n('select id from public.affiliates') = 0,
            'sin: no client and no affiliate row');
select t.ok(t.err('select * from public.admin_clients()') = '42501 forbidden', 'sin: admin_clients is forbidden');
reset role;
select t.ok((select user_id is null from public.clients where id = '00000000-0000-4000-8000-000000000402'),
            'sin: the invited client stays unclaimed');
-- Once the email is confirmed, the same user claims it and the CRM contact is linked too.
update auth.users set email_confirmed_at = now() where id = '00000000-0000-4000-8000-0000000000a4';
set local role authenticated;
select t.ok(t.val('select public.claim_client_access()') = '00000000-0000-4000-8000-000000000402',
            'sin (confirmed): claim_client_access links the invited client');
reset role;
select t.ok((select c.user_id = '00000000-0000-4000-8000-0000000000a4' and k.user_id = c.user_id
             from public.clients c join public.crm_contacts k on k.id = c.contact_id
             where c.id = '00000000-0000-4000-8000-000000000402'),
            'claim_client_access also links crm_contacts.user_id');
rollback;

-- ================================================================ jose: admin reads and writes everything
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.n('select id from public.crm_organizations') = 1 and t.n('select id from public.crm_contacts') = 9
            and t.n('select id from public.crm_interactions') = 3 and t.n('select id from public.crm_message_templates') = 8
            and t.n('select id from public.crm_message_drafts') = 0 and t.n('select id from public.leads') = 5,
            'jose: reads every crm_* row and every lead');
select t.ok(t.n('select id from public.clients') = 3 and t.n('select id from public.client_tasks') = 2
            and t.n('select id from public.client_task_comments') = 2 and t.n('select id from public.client_extras') = 1
            and t.n('select id from public.affiliates') = 2 and t.n('select id from public.affiliate_rewards') = 1
            and t.n('select id from public.blog_comments') = 3,
            'jose: reads every area, affiliate and comment row (internal comments included)');
select t.ok(t.err('select notes_internal from public.clients') like '42501 %'
            and t.affected($q$update public.clients set notes_internal = 'updated' where id = '00000000-0000-4000-8000-000000000401'$q$) = 1,
            'jose: the column grant hides notes_internal from his JWT too; he writes it');
select t.ok(t.val($q$select notes_internal || ':' || contact_id || ':' || user_id || ':' || invite_email
                    from public.admin_clients('00000000-0000-4000-8000-000000000401')$q$)
            = 'updated:00000000-0000-4000-8000-000000000202:00000000-0000-4000-8000-0000000000a2:ana@test'
            and t.n('select id from public.admin_clients()') = 3
            and t.n($q$select id from public.admin_clients('00000000-0000-4000-8000-0000000004ff')$q$) = 0,
            'jose: admin_clients reads every column (notes_internal, CRM links, invite_email), one or all clients');
select t.ok(t.err($q$insert into public.crm_contacts (kind, display_name, status, source)
                    values ('agency', 'X', 'won', 'manual')$q$) like '23514 %',
            'contact status must match its kind (agency cannot be won)');
select t.ok(t.err($q$insert into public.crm_contacts (kind, display_name, status, source)
                    values ('agency', 'X', 'pending', 'manual')$q$) is null,
            'jose: inserts a valid agency contact');
select t.ok(t.err($q$update public.crm_contacts set status = 'contacted'
                    where id = '00000000-0000-4000-8000-000000000201'$q$) like '23514 next_action_required%',
            'a status change without next_action_at fails with next_action_required');
select t.ok(t.affected($q$update public.crm_contacts set status = 'contacted', next_action = 'call',
                         next_action_at = now() + interval '2 days' where id = '00000000-0000-4000-8000-000000000201'$q$) = 1
            and t.val($q$select payload::text || ':' || actor from public.crm_interactions
                        where contact_id = '00000000-0000-4000-8000-000000000201' and kind = 'status_change'$q$)
                = '{"to": "contacted", "from": "new"}:jose',
            'with next_action_at the change logs a status_change {from: new, to: contacted} by jose');
select t.ok(t.err($q$update public.crm_contacts set status = 'lost', next_action_at = null
                    where id = '00000000-0000-4000-8000-000000000201'$q$) is null,
            'a change to a terminal status needs no next action');
select t.ok(t.affected($q$update public.crm_contacts set owner_note = 'x' where id = '00000000-0000-4000-8000-000000000204'$q$) = 1
            and t.n($q$select id from public.crm_interactions where kind = 'status_change'$q$) = 2,
            'updates that keep the status log nothing and need no next action');
select t.ok(t.err($q$insert into public.leads (contact_id, source, pack_code)
                    values ('00000000-0000-4000-8000-000000000204', 'manual', 'P1')$q$) is null,
            'jose: inserts a manual lead directly');
select t.ok(t.err($q$select public.create_lead('{"email":"x@example.test","source":"manual"}')$q$) like '42501 %',
            'jose (authenticated): create_lead is service role only');
select t.ok(t.val($q$select created || ':' || updated
                    from public.crm_import_organizations('[{"name":"Agencia  Test","kind":"agency","fit":5}]')$q$) = '0:1'
            and t.n($q$select id from public.crm_organizations where name_normalized = 'agencia test'$q$) = 1
            and t.val($q$select fit from public.crm_organizations where name_normalized = 'agencia test'$q$) = '5',
            'crm_import_organizations is idempotent by normalized name (updates, never duplicates)');
select t.ok(t.val($q$select created || ':' || updated from public.crm_import_organizations(
                    '[{"name":" Àgència   Nueva ","kind":"agency"},{"name":"agencia nueva","kind":"agency","fit":3}]')$q$) = '1:1'
            and t.val($q$select name_normalized from public.crm_organizations where fit = 3$q$) = 'agencia nueva',
            'crm_import_organizations normalizes case, accents and spaces');
select t.ok(public.admin_counters()
            = '{"chat_unread": 1, "leads_open": 3, "contacts_due": 2, "rewards_pending": 1, "agencies_replied": 0,
                "comments_pending": 2, "upgrades_pending": 0, "commissions_pending": 1, "imports_failed_24h": 0,
                "import_conflicts_pending": 1, "stories_proposed": 1, "content_pending": 1, "quotes_draft": 1}'::jsonb,
            'admin_counters returns the seven counters of C1 plus the six of 1.8e (chat_unread: the seeded anonymous thread)');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1400)$q$)
            like '22023 reward_params_required',
            'admin_close_lead_paid asks for the reward values when the lead carries an affiliate code');
do $$
declare r jsonb;
begin
  r := public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1400, null, true, 'percent', 140, 10::smallint);
  perform set_config('t.closed', r::text, true);
end $$;
reset role;  -- the checks read clients.contact_id/lead_id/invite_email, outside the authenticated column grant
do $$
declare r jsonb := current_setting('t.closed')::jsonb;
begin
  perform t.ok((select status = 'won' and amount = 1400 and paid_at is not null
                from public.leads where id = '00000000-0000-4000-8000-000000000301'),
               'admin_close_lead_paid: the lead is won with amount and paid_at');
  perform t.ok((select contact_id = '00000000-0000-4000-8000-000000000201' and pack_code = 'P2'
                       and lead_id = '00000000-0000-4000-8000-000000000301' and invite_email = 'marta@example.test'
                from public.clients where id = (r ->> 'client_id')::uuid),
               'admin_close_lead_paid: creates the client (P2, invited by the contact email)');
  perform t.ok((select affiliate_id = '00000000-0000-4000-8000-000000000801' and amount = 140 and percent = 10
                       and base_amount = 1400 and status = 'pending' and pricing_version = '2026-09-14'
                from public.affiliate_rewards where id = (r ->> 'reward_id')::uuid),
               'admin_close_lead_paid: creates Ana''s pending reward');
  perform t.ok((select status = 'active_client' from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201')
               and exists (select 1 from public.crm_interactions
                           where contact_id = '00000000-0000-4000-8000-000000000201' and kind = 'lead_won'
                             and lead_id = '00000000-0000-4000-8000-000000000301'),
               'admin_close_lead_paid: the contact is active_client and a lead_won interaction is logged');
end $$;
set local role authenticated;
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1400)$q$)
            like 'P0002 lead_already_closed_or_missing',
            'admin_close_lead_paid refuses a lead that is already closed');
set local request.jwt.claims = :'ana';
select t.ok(t.val('select reward_status from public.affiliate_leads()') = 'pending',
            'ana then sees the pending reward of her referral');
set local request.jwt.claims = :'jose';
select t.ok(t.affected($q$update public.blog_comments set status = 'approved', moderated_at = now(),
                         moderated_by = '00000000-0000-4000-8000-0000000000a1'
                         where id = '00000000-0000-4000-8000-000000000a02'$q$) = 1,
            'jose: moderates a comment');
set local request.jwt.claims = :'bob';
select t.ok(t.n('select id from public.blog_comments') = 3, 'bob then sees the newly approved comment');
rollback;

-- ================================================================ service role: create_lead (gateway POST /leads)
begin;
set local role service_role;
do $$
declare
  p  jsonb := '{"email":"nuevo@test","display_name":"Nuevo","source":"web_form","via":"client","locale":"es",
                "idempotency_key":"k1","message":"hola"}';
  a  record;
  b  record;
  c  record;
  ev text[];
begin
  select * into a from public.create_lead(p);
  select * into b from public.create_lead(p);
  perform t.ok(a.created and not b.created and a.lead_id = b.lead_id and a.contact_id = b.contact_id,
               'create_lead is idempotent by idempotency_key');
  select * into c from public.create_lead(p || '{"idempotency_key":"k2","email":"NUEVO@test"}');
  perform t.ok(c.created and c.lead_id <> a.lead_id and c.contact_id = a.contact_id,
               'create_lead reuses the contact by email (case-insensitive) for a new opportunity');
  select array_agg(o.event order by o.id) into ev from public.outbox_claim(50, 'test') o;
  perform t.ok('lead.created' = any (ev), 'create_lead enqueues lead.created');
  select * into c from public.create_lead('{"email":"ana@test","source":"web_form","idempotency_key":"k3"}');
  perform t.ok(c.contact_id = '00000000-0000-4000-8000-000000000202', 'create_lead reuses a client contact by email');
  select * into c from public.create_lead('{"email":"x@example.test","source":"referral","affiliate_code":"NOPE-0000","idempotency_key":"k4"}');
  perform t.ok(c.created, 'create_lead keeps a lead whose affiliate code is unknown');
  select * into c from public.create_lead('{"email":"y@example.test","source":"web_form","affiliate_code":"ANA-TEST01","idempotency_key":"k5"}');
  perform t.ok(c.created, 'create_lead accepts a known affiliate code');
end $$;
do $$
declare c record;
begin
  -- ana (logged in) types Marta's email: the lead keeps ana as submitter, Marta's contact is not linked to ana.
  select * into c from public.create_lead('{"email":"marta@example.test","source":"web_form","idempotency_key":"k6",
                                            "user_id":"00000000-0000-4000-8000-0000000000a2"}');
  perform t.ok(c.contact_id = '00000000-0000-4000-8000-000000000201'
               and (select user_id is null from public.crm_contacts where id = c.contact_id)
               and (select user_id = '00000000-0000-4000-8000-0000000000a2' from public.leads where id = c.lead_id),
               'create_lead never links an existing contact to a user whose email is not the lead email');
  select * into c from public.create_lead('{"email":"victim@example.test","source":"web_form","idempotency_key":"k7",
                                            "user_id":"00000000-0000-4000-8000-0000000000a3"}');
  perform t.ok((select user_id is null from public.crm_contacts where id = c.contact_id),
               'create_lead creates the contact of a mismatched email without the user');
  select * into c from public.create_lead('{"email":"sin@test","source":"web_form","idempotency_key":"k8",
                                            "user_id":"00000000-0000-4000-8000-0000000000a4"}');
  perform t.ok(c.contact_id = '00000000-0000-4000-8000-000000000205'
               and (select user_id is null from public.crm_contacts where id = c.contact_id),
               'create_lead does not link a user whose email is unconfirmed');
  select * into c from public.create_lead('{"email":"BOB@test","source":"web_form","idempotency_key":"k9",
                                            "user_id":"00000000-0000-4000-8000-0000000000a3"}');
  perform t.ok((select user_id = '00000000-0000-4000-8000-0000000000a3' from public.crm_contacts where id = c.contact_id),
               'create_lead links the contact when the user''s confirmed email is the lead email (case-insensitive)');
end $$;
select t.ok(t.err($q$select public.create_lead('{"email":"z@example.test"}')$q$) like '22023 source_required'
            and t.err($q$select public.create_lead('{"source":"web_form"}')$q$) like '22023 email_or_phone_required',
            'create_lead requires a source and an email or phone');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000301', 1)$q$) = '42501 forbidden',
            'service role without a user is not admin for admin_close_lead_paid');
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, actor)
                    values ('00000000-0000-4000-8000-000000000204', 'chat_thread', 'system')$q$) is null
            and t.err($q$update public.crm_contacts set status = 'in_process', next_action = 'reply',
                         next_action_at = now() where id = '00000000-0000-4000-8000-000000000204'$q$) is null
            and t.err($q$insert into public.crm_organizations (name, kind) values ('Org  Gateway', 'agency')$q$) is null,
            'service role (gateway) writes interactions, contact statuses and organisations (check helpers granted)');
reset role;
select t.ok((select count(*) = 1 and bool_and(kind = 'lead' and status = 'new' and source = 'web_form')
             from public.crm_contacts where email = 'nuevo@test'),
            'create_lead created one new lead contact for nuevo@test');
select t.ok((select count(*) from public.crm_interactions i join public.leads l on l.id = i.lead_id
             where i.kind = 'lead_created' and l.idempotency_key in ('k1', 'k2')) = 2,
            'create_lead logs one lead_created interaction per new opportunity');
select t.ok((select affiliate_code is null and meta ->> 'affiliate_code_rejected' = 'NOPE-0000' and source = 'referral'
             from public.leads where idempotency_key = 'k4')
            and (select c.source = 'manual' from public.crm_contacts c join public.leads l on l.contact_id = c.id
                 where l.idempotency_key = 'k4')
            and (select affiliate_code = 'ANA-TEST01' from public.leads where idempotency_key = 'k5'),
            'unknown affiliate codes go to meta.affiliate_code_rejected; known ones are kept');
rollback;

-- ================================================================ affiliate code generation (trigger)
begin;
insert into auth.users (id, email, raw_user_meta_data, email_confirmed_at)
values ('00000000-0000-4000-8000-0000000000c9', 'nuria@example.test', '{"full_name":"Núria Pérez"}', now());
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000c9","role":"authenticated"}';
select t.ok(t.err($q$insert into public.affiliates (user_id) values ('00000000-0000-4000-8000-0000000000c9')$q$) is null
            and t.val('select code from public.affiliates') ~ '^NURIA-[2-9A-FXZ]{6}$'
            and t.val('select level from public.affiliates') = 'standard',
            'a user enrols as standard affiliate and gets a generated code (prefix from the name, no accents)');
reset role;
select t.ok(t.err($q$insert into public.affiliates (user_id, code) values ('00000000-0000-4000-8000-0000000000a4', 'SIN-TEST')$q$)
            like '23514 %'
            and t.err($q$insert into public.affiliates (user_id, code) values ('00000000-0000-4000-8000-0000000000a4', 'SIN-TEST0001')$q$)
            like '23514 %'
            and t.err($q$insert into public.affiliates (user_id, code) values ('00000000-0000-4000-8000-0000000000a4', 'SIN-TEST01')$q$)
            is null,
            'affiliates.code: the suffix is exactly 6 characters (AFFILIATE_CODE_RE of packages/pricing)');
rollback;

-- ================================================================ crm_contacts.last_interaction_at
begin;
select t.ok((select last_interaction_at is not null from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201')
            and (select last_interaction_at is null from public.crm_contacts where id = '00000000-0000-4000-8000-000000000204'),
            'seed: contacts with interactions carry last_interaction_at, the others do not');
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, actor, occurred_at)
                    values ('00000000-0000-4000-8000-000000000204', 'call', 'jose', '2026-10-01 10:00+00')$q$) is null
            and t.val($q$select last_interaction_at = '2026-10-01 10:00+00' from public.crm_contacts
                        where id = '00000000-0000-4000-8000-000000000204'$q$) = 'true',
            'jose logs a call: last_interaction_at takes its occurred_at');
select t.ok(t.err($q$insert into public.crm_interactions (contact_id, kind, actor, occurred_at)
                    values ('00000000-0000-4000-8000-000000000204', 'note', 'jose', '2026-09-01 10:00+00')$q$) is null
            and t.val($q$select last_interaction_at = '2026-10-01 10:00+00' from public.crm_contacts
                        where id = '00000000-0000-4000-8000-000000000204'$q$) = 'true',
            'an older interaction logged late does not move last_interaction_at back');
select t.ok(t.affected($q$update public.crm_contacts set status = 'closed' where id = '00000000-0000-4000-8000-000000000204'$q$) = 1
            and t.val($q$select last_interaction_at = '2026-10-01 10:00+00' from public.crm_contacts
                        where id = '00000000-0000-4000-8000-000000000204'$q$) = 'true',
            'a status_change (bookkeeping) does not count as an interaction');
rollback;
