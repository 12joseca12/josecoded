-- Assertions for task 1.8e (plan v3.4; DATOS v1.4 §14.3, §14.4, §14.9 criteria 1-6 and 9-11, §14.12): the RLS matrix of
-- the closers, the sharing model, imports and conflicts, commissions with frozen rates, client stories, portal access,
-- site content, notification rules, the price catalogue and quotes, plus the security-review additions (aal2 in the
-- database, comment.client, asset hardening, area_client). Six accounts: jose (admin, a1), ana (P2 client, a2), bob (no
-- client, a3), sin (unconfirmed, a4), carla (closer, a5, 10 %) and dani (closer switched off, a6, 15 %), plus anon and
-- the service role. Staff tokens carry aal2 like a verified TOTP session (the *1 variants carry aal1). Runs after the
-- other files on the same throwaway database; every block runs in its own transaction and rolls back.
\o /dev/null
\set jose '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal2","email":"jose@test"}'
\set jose1 '{"sub":"00000000-0000-4000-8000-0000000000a1","role":"authenticated","aal":"aal1","email":"jose@test"}'
\set ana '{"sub":"00000000-0000-4000-8000-0000000000a2","role":"authenticated","aal":"aal1","email":"ana@test"}'
\set bob '{"sub":"00000000-0000-4000-8000-0000000000a3","role":"authenticated","aal":"aal1","email":"bob@test"}'
\set carla '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated","aal":"aal2","email":"carla@test"}'
\set carla1 '{"sub":"00000000-0000-4000-8000-0000000000a5","role":"authenticated","aal":"aal1","email":"carla@test"}'
\set dani '{"sub":"00000000-0000-4000-8000-0000000000a6","role":"authenticated","aal":"aal2","email":"dani@test"}'
\set service '{"role":"service_role"}'

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
create or replace function t.snapshot() returns jsonb language plpgsql as $$
declare r jsonb;
begin
  select public.pricing_catalog_snapshot() into r;  -- own statement: sees what earlier calls of the same query wrote
  return r;
end $$;
grant execute on all functions in schema t to anon, authenticated, service_role;

-- ================================================================ structure (as postgres)
begin;
select t.ok((select count(*) from pg_class c join pg_namespace s on s.oid = c.relnamespace
             where s.nspname = 'public' and c.relkind = 'r' and c.relrowsecurity and c.relname in (
               'staff_invites', 'crm_imports', 'crm_import_conflicts', 'closer_commissions', 'client_user_stories',
               'site_content_entries', 'site_content_versions', 'site_content_publications', 'notification_rules',
               'staff_telegram_codes', 'pricing_settings', 'pricing_price_history', 'custom_quotes',
               'custom_quote_items')) = 14,
            'the 14 tables of DATOS §14.2 and §14.12 exist with RLS enabled');
select t.ok((select string_agg(enumlabel, ',' order by enumsortorder) from pg_enum
             where enumtypid = 'public.staff_role'::regtype) = 'admin,closer'
            and 'import_csv' = any (enum_range(null::public.contact_source)::text[])
            and 'commission' = any (enum_range(null::public.interaction_kind)::text[]),
            'staff_role has closer; contact_source has import_csv; interaction_kind has the new kinds');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'crm_import_conflicts'
               and privilege_type = 'SELECT') = 'created_at,id,import_id,owner_id,resolution,resolved_at,row,row_index,status',
            'crm_import_conflicts: existing_contact_id, existing_owner_id and resolution_note are granted to nobody');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'staff_members'
               and privilege_type = 'SELECT') = 'commission_rate,created_at,disabled_at,invited_by,role,telegram_chat_id,updated_at,user_id,display_name'
            or (select not bool_or(column_name = 'notes') from information_schema.column_privileges
                where grantee = 'authenticated' and table_schema = 'public' and table_name = 'staff_members'
                  and privilege_type = 'SELECT'),
            'staff_members: notes (the admin''s note about a person) is not readable with a JWT');
select t.ok(not exists (select 1 from information_schema.column_privileges
                        where grantee = 'authenticated' and table_schema = 'public' and table_name = 'pricing_settings'
                          and privilege_type = 'SELECT' and column_name = 'published_snapshot'),
            'pricing_settings: published_snapshot is not readable with a JWT');
select t.ok(not exists (select 1 from information_schema.role_table_grants
                        where grantee = 'authenticated' and table_schema = 'public'
                          and table_name in ('packs', 'pack_options', 'extras', 'pricing_settings', 'pricing_price_history',
                                             'closer_commissions', 'crm_imports', 'crm_import_conflicts',
                                             'site_content_versions', 'site_content_publications')
                          and privilege_type in ('INSERT', 'UPDATE', 'DELETE')),
            'catalogue, commissions, imports and content history: no write grant for authenticated (RPC only)');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'custom_quotes'
               and privilege_type = 'UPDATE') = 'notes,title,valid_until',
            'custom_quotes: update only title, valid_until, notes (status, lead, discount and totals are RPC)');
select t.ok((select string_agg(column_name, ',' order by column_name) from information_schema.column_privileges
             where grantee = 'authenticated' and table_schema = 'public' and table_name = 'client_user_stories'
               and privilege_type = 'UPDATE') = 'acceptance_criteria,as_a,i_want,so_that,sort,title',
            'client_user_stories: update only the text columns (status is RPC)');
select t.ok(not exists (select 1 from pg_proc p join pg_namespace s on s.oid = p.pronamespace
                        where s.nspname = 'public' and p.prosecdef and has_function_privilege('authenticated', p.oid, 'execute')),
            'no security definer function in public is executable by authenticated (advisor 0029 stays at zero)');
select t.ok(not has_function_privilege('authenticated', 'public.staff_telegram_link(text,text)', 'execute')
            and not has_function_privilege('authenticated', 'public.notification_recipients(text,uuid)', 'execute')
            and not has_function_privilege('authenticated', 'public.content_publication_mark(uuid,publication_status,text,jsonb,bigint,text)', 'execute')
            and not has_function_privilege('authenticated', 'public.pricing_published()', 'execute')
            and has_function_privilege('service_role', 'public.pricing_published()', 'execute'),
            'gateway RPCs (telegram link, recipients, publication mark, pricing_published) are service_role only');
select t.ok(not exists (select 1 from pg_policies where schemaname = 'public' and cmd = 'ALL'), 'no `for all` policy');
select t.ok((select count(*) from (select tablename, cmd, roles from pg_policies where schemaname = 'public'
                                    group by tablename, cmd, roles having count(*) > 1) d) = 0,
            'one policy per table, action and role (no multiple_permissive_policies)');
select t.ok(not exists (
  select 1 from pg_constraint k join pg_namespace s on s.oid = k.connamespace
  where s.nspname = 'public' and k.contype = 'f'
    and not exists (select 1 from pg_index i where i.indrelid = k.conrelid
                      and (i.indkey::int2[])[0:array_length(k.conkey, 1) - 1] = k.conkey)),
  'every foreign key in public is covered by an index (P4), the new ones included');
select t.ok((select count(*) from public.notification_rules) = 27
            and (select count(*) from public.notification_rules where event = 'comment.client') = 2
            and not exists (select 1 from public.notification_rules where enabled is not true),
            'notification_rules: the 27 seeded rules (DATOS §14.6, the existing events, comment.client and lead.owner_collision)');
select t.ok((select count(*) from private.scheduled_jobs where name in ('content.poll_deploy', 'telegram.poll_updates')) = 2,
            'scheduled_jobs: content.poll_deploy and telegram.poll_updates');
select t.ok((select string_agg(c, ',' order by c) from (
               select (jsonb_object_keys(private.pricing_snapshot_build())) c) k)
            = 'affiliate,apps,extras,feature,hourly,packs,upgradeRule,version',
            'the catalogue snapshot has the keys of pricingSchema');
select t.ok(private.pricing_snapshot_build()::text not like '%HIDDEN_PACK%'
            and (select count(*) from public.packs where code = 'HIDDEN_PACK' and not visible) = 1,
            'a hidden pack exists in packs but never in the snapshot');
select t.ok((select string_agg(p ->> 'code', ',') from jsonb_array_elements(private.pricing_snapshot_build() -> 'packs') p)
            = 'P1,P2,P3,P4'
            and (select string_agg(p ->> 'code', ',') from jsonb_array_elements(private.pricing_snapshot_build() -> 'apps') p)
            = 'APP_MVP,APP_PLUS'
            and jsonb_array_length(private.pricing_snapshot_build() -> 'extras') = 6,
            'snapshot: packs P1-P4, apps APP_MVP and APP_PLUS (derived from P5 and P5:plus), six extras');
select t.ok(not private.pricing_pending() and public.pricing_published() is not null
            and (select published_hash from public.pricing_settings) = md5(private.pricing_snapshot_build()::text),
            'seed: the catalogue starts published (hash matches the snapshot, nothing pending)');
rollback;

-- ================================================================ jose (admin, aal2): sees everything
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(private.is_admin() and private.is_staff() and not private.is_closer(), 'jose: admin and staff, not closer');
select t.ok(t.n('select id from public.crm_contacts') = 9 and t.n('select id from public.leads') = 5
            and t.n('select id from public.crm_organizations') = 1 and t.n('select id from public.crm_message_templates') = 8,
            'jose: all contacts (his, carla''s and dani''s), leads, organisations and templates');
select t.ok(t.n('select user_id from public.staff_members') = 3 and t.n('select id from public.staff_invites') = 2
            and t.n('select id from public.crm_imports') = 1 and t.n('select id from public.closer_commissions') = 1
            and t.n('select id from public.client_user_stories') = 1 and t.n('select id from public.custom_quotes') = 1
            and t.n('select id from public.custom_quote_items') = 2,
            'jose: staff, invitations, imports, commissions, stories and quotes');
select t.ok(t.n('select id from public.site_content_entries') = 2 and t.n('select id from public.site_content_versions') = 2
            and t.n('select id from public.notification_rules') = 27 and t.n('select id from public.pricing_price_history') > 0,
            'jose: content entries and versions, notification rules and the price history');
select t.ok(t.err('select existing_contact_id from public.crm_import_conflicts') like '42501 %'
            and t.n('select id from public.crm_import_conflicts') = 1
            and t.n($q$select id from public.admin_import_conflicts() where existing_contact_id = '00000000-0000-4000-8000-000000000201'
                       and existing_display_name = 'Marta Test' and existing_owner_name = 'Jose'
                       and importer_name = 'Carla'$q$) = 1,
            'jose: the conflict columns the grants hide come only through admin_import_conflicts()');
select t.ok(t.err($q$update public.packs set price = 1 where code = 'P1'$q$) like '42501 %'
            and t.err($q$update public.pricing_settings set hourly = 1$q$) like '42501 %'
            and t.err($q$insert into public.extras (code, price, pricing_version) values ('x_extra', 1, 'x')$q$) like '42501 %',
            'jose: not even the admin writes the catalogue directly (RPC only, so the history is complete)');
select t.ok(t.err('select notes from public.staff_members') like '42501 %'
            and t.val($q$select notes from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a1'$q$) is null,
            'jose: the notes about a person are not readable from the table even for the admin; admin_staff_list() returns them');
rollback;

-- ================================================================ aal1 tokens: the database enforces TOTP
begin;
set local role authenticated;
set local request.jwt.claims = :'jose1';
select t.ok(not private.is_admin() and not private.is_staff(), 'jose with an aal1 token: not admin, not staff');
select t.ok(t.n('select id from public.crm_contacts') = 0 and t.n('select id from public.leads') = 0
            and t.n('select id from public.crm_interactions') = 0 and t.n('select id from public.clients') = 0
            and t.n('select id from public.site_content_entries') = 0 and t.n('select id from public.notification_rules') = 0
            and t.n('select id from public.custom_quotes') = 0 and t.n('select id from public.closer_commissions') = 0,
            'jose with an aal1 token reads 0 rows of the CRM, clients, content, rules, quotes and commissions');
select t.ok(t.n('select user_id from public.staff_members') = 1,
            'jose with an aal1 token still reads his own staff row (the web needs it to ask for the second factor)');
select t.ok(t.err('select public.admin_counters()') = '42501 forbidden'
            and t.err('select public.admin_staff_list()') = '42501 forbidden'
            and t.err($q$select public.admin_pricing_set_settings(41, 150)$q$) = '42501 forbidden'
            and t.err($q$select public.content_publish()$q$) = '42501 forbidden',
            'jose with an aal1 token: admin RPCs answer forbidden');
select t.ok(t.err($q$insert into public.crm_contacts (kind, status, display_name, source) values ('lead', 'new', 'X', 'manual')$q$) like '42501 %',
            'jose with an aal1 token cannot insert into the CRM');
set local request.jwt.claims = :'carla1';
select t.ok(not private.is_closer() and not private.is_staff(), 'carla with an aal1 token: not closer');
select t.ok(t.n('select id from public.crm_contacts') = 0 and t.n('select id from public.leads') = 0
            and t.n('select id from public.crm_imports') = 0 and t.n('select id from public.closer_commissions') = 0
            and t.n('select id from public.custom_quotes') = 0 and t.n('select id from public.clients') = 0,
            'carla with an aal1 token reads 0 rows of her portfolio, imports, commissions, quotes and clients');
select t.ok(t.err($q$select public.crm_import_contacts_csv('[]', 'a.csv', 'aal1')$q$) = '42501 forbidden'
            and t.err('select public.staff_telegram_begin()') = '42501 forbidden'
            and t.err('select public.crm_team_counters()') = '42501 forbidden'
            and t.err('select public.crm_my_counters()') = '42501 forbidden',
            'carla with an aal1 token: import, telegram code and counters are forbidden');
rollback;

-- ================================================================ carla (closer, aal2): her portfolio only
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(private.is_closer() and private.is_staff() and not private.is_admin(), 'carla: closer and staff, not admin');
select t.ok(t.n('select id from public.crm_contacts') = 3
            and t.n($q$select id from public.crm_contacts where id in ('00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000204', '00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000220')$q$) = 0,
            'carla sees her 3 contacts and not one of Jose''s or dani''s');
select t.ok(t.n('select id from public.leads') = 2 and t.n('select id from public.leads where contact_id not in (''00000000-0000-4000-8000-000000000210'', ''00000000-0000-4000-8000-000000000211'')') = 0
            and t.n('select id from public.crm_interactions') = 0
            and t.n('select id from public.crm_message_drafts') = 0,
            'carla sees the leads of her contacts only and none of Jose''s interactions');
select t.ok(t.n('select id from public.crm_organizations') = 1 and t.n('select id from public.crm_message_templates') = 8,
            'carla reads the global data: organisations and templates');
select t.ok(t.affected($q$insert into public.crm_organizations (name, name_normalized, kind) values ('Org de Carla', 'x', 'agency')$q$) = 1
            and t.affected($q$update public.crm_organizations set fit = 5$q$) = 0
            and t.affected($q$delete from public.crm_organizations$q$) = 0
            and t.affected($q$update public.crm_message_templates set body = 'x'$q$) = 0
            and t.err($q$insert into public.crm_message_templates (code, channel, locale, body) values ('x', 'email', 'es', 'x')$q$) like '42501 %',
            'carla creates an organisation but changes no organisation or template');
select t.ok(t.err($q$update public.crm_contacts set owner_id = null where id = '00000000-0000-4000-8000-000000000210'$q$) like '42501 %',
            'carla cannot hand a contact to Jose (reassign): 42501');
select t.ok(t.err($q$update public.crm_contacts set owner_id = '00000000-0000-4000-8000-0000000000a6' where id = '00000000-0000-4000-8000-000000000210'$q$) like '42501 %',
            'carla cannot hand a contact to dani: 42501');
select t.ok(t.err($q$update public.crm_contacts set status = 'won', next_action_at = now() where id = '00000000-0000-4000-8000-000000000211'$q$) like '42501 %'
            and t.err($q$update public.crm_contacts set status = 'active_client' where id = '00000000-0000-4000-8000-000000000211'$q$) like '42501 %',
            'carla cannot set won or active_client by hand: 42501');
select t.ok(t.affected($q$update public.crm_contacts set status = 'contacted', next_action = 'call', next_action_at = now() + interval '1 day' where id = '00000000-0000-4000-8000-000000000211'$q$) = 1
            and t.val($q$select count(*) from public.crm_interactions where contact_id = '00000000-0000-4000-8000-000000000211' and kind = 'status_change'$q$) = '1',
            'carla moves her contact to contacted and the timeline records it');
select t.ok(t.err($q$update public.crm_contacts set user_id = '00000000-0000-4000-8000-0000000000a2' where id = '00000000-0000-4000-8000-000000000211'$q$) like '42501 %'
            and t.err($q$insert into public.crm_contacts (kind, status, display_name, source, owner_id, user_id) values ('lead', 'new', 'X', 'manual', '00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-0000000000a2')$q$) like '42501 %',
            'carla cannot link a contact to an auth user (it would feed the client area): 42501');
select t.ok(t.affected($q$update public.crm_contacts set owner_note = 'x' where id = '00000000-0000-4000-8000-000000000201'$q$) = 0
            and t.affected($q$delete from public.crm_contacts where id = '00000000-0000-4000-8000-000000000211'$q$) = 0,
            'carla changes and deletes nothing that is not hers (Jose''s contact; delete is admin only)');
select t.ok(t.affected($q$insert into public.crm_contacts (kind, status, display_name, source, owner_id) values ('lead', 'new', 'Nuevo de Carla', 'manual', '00000000-0000-4000-8000-0000000000a5')$q$) = 1
            and t.err($q$insert into public.crm_contacts (kind, status, display_name, source) values ('lead', 'new', 'Sin dueno', 'manual')$q$) like '42501 %'
            and t.err($q$insert into public.crm_contacts (kind, status, display_name, source, owner_id) values ('lead', 'new', 'De dani', 'manual', '00000000-0000-4000-8000-0000000000a6')$q$) like '42501 %',
            'carla inserts contacts as owner; with no owner (Jose''s) or with dani as owner: 42501');
select t.ok(t.err($q$update public.leads set status = 'won' where id = '00000000-0000-4000-8000-000000000311'$q$) like '42501 %'
            and t.err($q$update public.leads set affiliate_code = 'ANA-TEST01' where id = '00000000-0000-4000-8000-000000000311'$q$) like '42501 %'
            and t.err($q$update public.leads set amount = 5000 where id = '00000000-0000-4000-8000-000000000311'$q$) like '42501 %'
            and t.affected($q$update public.leads set status = 'lost' where id = '00000000-0000-4000-8000-000000000311'$q$) = 1,
            'carla loses a lead but cannot win it, put an amount or an affiliate on it');
select t.ok(t.n('select id from public.crm_imports') = 1 and t.n('select id from public.crm_import_conflicts') = 1
            and t.err('select existing_contact_id from public.crm_import_conflicts') like '42501 %'
            and t.err('select existing_owner_id from public.crm_import_conflicts') like '42501 %'
            and t.err('select resolution_note from public.crm_import_conflicts') like '42501 %'
            and t.err('select * from public.crm_import_conflicts') like '42501 %'
            and t.n('select id, import_id, owner_id, row_index, "row", status from public.crm_import_conflicts') = 1,
            'carla reads her import and her pending row, never who owns the other side (column grant: 42501)');
select t.ok(t.err($q$select public.admin_import_conflict_resolve('00000000-0000-4000-8000-000000001101', 'assign_importer')$q$) = '42501 forbidden'
            and t.err($q$select * from public.admin_import_conflicts()$q$) = '42501 forbidden',
            'carla cannot resolve a conflict nor read the admin view of the queue');
select t.ok(t.n('select code from public.packs') = 6 and t.n('select code from public.extras') = 6 and t.n('select pack_code from public.pack_options') = 1
            and t.n('select id from public.pricing_settings') = 1,
            'carla reads the catalogue (global data)');
select t.ok(t.err($q$update public.packs set price = 1$q$) like '42501 %'
            and t.err($q$select public.admin_pricing_set_pack('{"code":"P2","price":1500}')$q$) = '42501 forbidden'
            and t.err($q$select public.admin_pricing_set_extra('{"code":"nuevo_x","name":{"es":"a","en":"b"},"price":1}')$q$) = '42501 forbidden'
            and t.err($q$select public.admin_pricing_delete('pack', 'P1')$q$) = '42501 forbidden'
            and t.err('select published_snapshot from public.pricing_settings') like '42501 %',
            'carla cannot edit prices (42501 / forbidden) nor read the published snapshot');
select t.ok(t.val($q$select (public.pricing_catalog_snapshot() ->> 'hourly')$q$) = '40'
            and public.pricing_catalog_snapshot()::text not like '%HIDDEN_PACK%',
            'carla reads the catalogue snapshot (staff) and the hidden pack is not in it');
select t.ok(t.n('select id from public.closer_commissions') = 1
            and t.val('select percent::text from public.closer_commissions') = '10.00'
            and t.err($q$update public.closer_commissions set status = 'approved'$q$) like '42501 %'
            and t.err($q$select public.admin_commission_approve('00000000-0000-4000-8000-000000000f01')$q$) = '42501 forbidden'
            and t.err($q$select public.admin_commission_mark_paid('00000000-0000-4000-8000-000000000f01', now(), 'x')$q$) = '42501 forbidden',
            'carla reads her commission (10 %) and cannot approve, edit or pay it');
select t.ok(t.n('select id from public.clients') = 1
            and t.err('select notes_internal from public.clients') like '42501 %'
            and t.err('select contact_id from public.clients') like '42501 %'
            and t.n('select id from public.staff_clients()') = 1
            and t.val($q$select has_access::text from public.staff_clients('00000000-0000-4000-8000-000000000410')$q$) = 'false'
            and t.n($q$select id from public.staff_clients('00000000-0000-4000-8000-000000000401')$q$) = 0,
            'carla reads her client (no notes_internal, no CRM links) and staff_clients() returns hers only');
select t.ok(t.n('select id from public.client_tasks') = 0 and t.n('select id from public.client_task_comments') = 0
            and t.n('select id from public.client_assets') = 0 and t.n('select id from public.client_user_stories') = 0
            and t.n('select id from public.upgrade_requests') = 0 and t.n('select id from public.client_extras') = 0,
            'carla sees nothing of Ana''s client (Jose''s contact): tasks, comments, assets, stories');
select t.ok(t.n('select user_id from public.staff_members') = 1 and t.n('select id from public.staff_invites') = 0
            and t.err('select notes from public.staff_members') like '42501 %'
            and t.affected($q$update public.staff_members set commission_rate = 99$q$) = 0
            and t.err($q$insert into public.staff_members (user_id, role) values ('00000000-0000-4000-8000-0000000000a2', 'closer')$q$) like '42501 %',
            'carla sees her own staff row only, without notes; she cannot raise her rate nor make anybody staff');
select t.ok(t.n('select id from public.site_content_entries') = 0 and t.n('select id from public.site_content_publications') = 0
            and t.n('select id from public.pricing_price_history') = 0
            and t.n($q$select id from public.notification_rules where recipient = 'admin'$q$) = 0
            and t.n($q$select id from public.notification_rules where recipient = 'owner'$q$) > 0,
            'carla reads no content nor price history; of the rules only those that reach the owner');
select t.ok(t.err($q$select public.content_publish()$q$) = '42501 forbidden'
            and t.err($q$select public.content_save_draft('settings', 'settings', null, '{}')$q$) = '42501 forbidden'
            and t.err('select public.admin_staff_list()') = '42501 forbidden'
            and t.err('select public.admin_counters()') = '42501 forbidden'
            and t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a5', false, 99, null)$q$) = '42501 forbidden'
            and t.err($q$select public.admin_reassign_contacts('00000000-0000-4000-8000-0000000000a5', null)$q$) = '42501 forbidden'
            and t.err($q$select public.admin_staff_invite('x@example.test', 'closer', 10)$q$) = '42501 forbidden',
            'carla: content, staff and counters RPCs of the admin are forbidden');
select t.ok(t.val('select (public.crm_team_counters() ->> ''team_contacts'')::int') = '10'
            and t.val('select (public.crm_my_counters() ->> ''contacts_due'')::int') = '1'
            and (public.crm_my_counters() ->> 'conflicts_pending') = '1'
            and (public.crm_my_counters() ->> 'commissions_pending') = '1',
            'carla: team counters are numbers (10 contacts of the team, including the one she just created, without names), her own counters are hers');
select t.ok(t.val($q$select count(*) from public.area_client()$q$) = '0', 'carla: area_client() returns no row (she has no client)');
rollback;

-- ================================================================ carla: request close, portal invitation, telegram code
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$select public.crm_request_close('00000000-0000-4000-8000-000000000311')$q$) is null
            and t.val($q$select next_action from public.crm_contacts where id = '00000000-0000-4000-8000-000000000211'$q$) = 'Jose: cerrar cobrado',
            'carla requests the close of her open lead: next action «Jose: cerrar cobrado»');
select t.ok(t.err($q$select public.crm_request_close('00000000-0000-4000-8000-000000000301')$q$) = '42501 forbidden'
            and t.err($q$select public.crm_request_close('00000000-0000-4000-8000-000000000310')$q$) = '22023 lead_not_open',
            'carla cannot request the close of Jose''s lead (forbidden) nor of one already won');
select t.ok(t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'cliente-carla@example.test')$q$) is null
            and t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000401', 'x@example.test')$q$) = '42501 forbidden'
            and t.err($q$select public.invite_client_access('00000000-0000-4000-8000-000000000410', 'sin-arroba')$q$) = '22023 invalid_email',
            'carla invites her client to the portal; Ana''s client is forbidden; a bad email is refused');
select t.ok(t.val('select length(public.staff_telegram_begin())') = '8'
            and t.n('select user_id from public.staff_telegram_codes') = 1,
            'carla asks for a telegram code: 8 characters, one row of her own');
reset role;
select t.ok((select count(*) from private.outbox where event = 'lead.close_requested' and payload ->> 'owner_id' = '00000000-0000-4000-8000-0000000000a5') = 1
            and (select count(*) from private.outbox where event = 'client.invited'
                  and payload ->> 'client_id' = '00000000-0000-4000-8000-000000000410' and payload ->> 'email' = 'cliente-carla@example.test') = 1
            and (select invite_email::text from public.clients where id = '00000000-0000-4000-8000-000000000410') = 'cliente-carla@example.test'
            and (select count(*) from public.crm_interactions where contact_id = '00000000-0000-4000-8000-000000000210' and kind = 'client_invited' and actor = 'closer') = 1,
            'outbox lead.close_requested (with the owner) and client.invited; invite_email stored; timeline entry');
rollback;

-- ================================================================ dani (closer switched off): nothing, aal2 or not
begin;
insert into public.leads (id, contact_id, status, source, via, pack_code, amount, paid_at, idempotency_key)
values ('00000000-0000-4000-8000-000000000330', '00000000-0000-4000-8000-000000000220', 'won', 'manual', 'client', 'P1', 100, now(), 'k:dani-won');
insert into public.closer_commissions (closer_id, lead_id, contact_id, base_amount, percent, amount)
values ('00000000-0000-4000-8000-0000000000a6', '00000000-0000-4000-8000-000000000330', '00000000-0000-4000-8000-000000000220', 100, 15, 15);
set local role authenticated;
set local request.jwt.claims = :'dani';
select t.ok(not private.is_closer() and not private.is_staff() and not private.is_admin(), 'dani: switched off, not closer');
select t.ok(t.n('select id from public.crm_contacts') = 0 and t.n('select id from public.leads') = 0
            and t.n('select id from public.crm_interactions') = 0 and t.n('select id from public.crm_message_drafts') = 0
            and t.n('select id from public.crm_organizations') = 0 and t.n('select id from public.crm_message_templates') = 0,
            'dani owns a contact and still reads 0 rows of the whole CRM');
select t.ok(t.n('select id from public.crm_imports') = 0 and t.n('select id from public.crm_import_conflicts') = 0
            and t.n('select id from public.clients') = 0 and t.n('select id from public.client_user_stories') = 0
            and t.n('select id from public.custom_quotes') = 0 and t.n('select id from public.notification_rules') = 0,
            'dani: 0 rows of imports, conflicts, clients, stories, quotes and rules');
select t.ok(t.n('select code from public.packs') = 0 and t.n('select code from public.extras') = 0
            and t.n('select pack_code from public.pack_options') = 0 and t.n('select id from public.pricing_settings') = 0,
            'dani: 0 rows of the catalogue');
select t.ok(t.n('select user_id from public.staff_members') = 1
            and t.val('select (disabled_at is not null)::text from public.staff_members') = 'true',
            'dani sees his own staff row and its disabled_at');
select t.ok(t.n('select id from public.closer_commissions') = 1,
            'dani still sees the commissions he is owed');
select t.ok(t.err($q$select public.crm_import_contacts_csv('[]', 'a.csv', 'dani')$q$) = '42501 forbidden'
            and t.err('select public.staff_telegram_begin()') = '42501 forbidden'
            and t.err('select public.crm_team_counters()') = '42501 forbidden'
            and t.err($q$select public.crm_request_close('00000000-0000-4000-8000-000000000311')$q$) = '42501 forbidden'
            and t.err($q$select public.quote_create('00000000-0000-4000-8000-000000000220', 'x')$q$) = '42501 forbidden',
            'dani: import, telegram code, counters, close request and quotes are forbidden');
select t.ok(t.err($q$insert into public.crm_contacts (kind, status, display_name, source, owner_id) values ('lead', 'new', 'X', 'manual', '00000000-0000-4000-8000-0000000000a6')$q$) like '42501 %'
            and t.affected($q$update public.crm_contacts set owner_note = 'x'$q$) = 0,
            'dani cannot insert nor update contacts');
rollback;

-- ================================================================ ana, bob, anon: no CRM, no closer data
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n('select id from public.staff_invites') = 0 and t.n('select id from public.crm_imports') = 0
            and t.n('select id from public.closer_commissions') = 0 and t.n('select id from public.custom_quotes') = 0
            and t.n('select id from public.site_content_entries') = 0 and t.n('select id from public.notification_rules') = 0
            and t.n('select user_id from public.staff_members') = 0 and t.n('select id from public.crm_import_conflicts') = 0,
            'ana: 0 rows of invitations, imports, commissions, quotes, content, rules and staff');
select t.ok(t.n('select code from public.packs') = 5 and t.n('select code from public.extras') = 6,
            'ana reads the visible catalogue (area): 5 packs (the hidden one is not hers) and 6 extras');
select t.ok(t.err($q$update public.packs set price = 1 where code = 'P2'$q$) like '42501 %'
            and t.err('select public.pricing_catalog_snapshot()') = '42501 forbidden'
            and t.err('select public.staff_telegram_begin()') = '42501 forbidden'
            and t.err($q$select public.crm_import_contacts_csv('[]', 'a.csv', 'ana')$q$) = '42501 forbidden'
            and t.err($q$select public.claim_staff_access()$q$) is null,
            'ana: cannot edit prices, read the staff snapshot, ask for a code or import; claiming without an invitation returns null');
select t.ok(t.val('select count(*) from public.area_client()') = '1'
            and t.val('select id from public.area_client()') = '00000000-0000-4000-8000-000000000401'
            and t.val('select project_phase::text from public.area_client()') = 'build',
            'ana: area_client() returns her own client row');
set local request.jwt.claims = :'bob';
select t.ok(t.val('select count(*) from public.area_client()') = '0' and t.n('select code from public.packs') = 5,
            'bob: area_client() returns nothing; he still reads the visible catalogue (5 packs)');
reset role;
set local role anon;
select t.ok(t.err('select public.area_client()') like '42501 %' and t.err('select public.pricing_published()') like '42501 %'
            and t.err('select id from public.custom_quotes') like '42501 %' and t.err('select id from public.staff_invites') like '42501 %',
            'anon: permission denied on area_client, pricing_published, quotes and invitations');
rollback;

-- ================================================================ CSV import (carla): idempotent, leak-free, conflicts (Q22)
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table imp (r jsonb);
grant all on imp to authenticated;
insert into imp select public.crm_import_contacts_csv(
  '[{"display_name":"Nuevo Uno","email":"nuevo1@example.test","kind":"lead","organization":"Org Nueva","city":"Sevilla","tags":["csv","a"]},
    {"display_name":"Nuevo Dos","linkedin_url":"https://www.linkedin.com/in/dos/?utm=x","kind":"agency"},
    {"display_name":"Lead de Carla otra vez","email":"LEAD-CARLA@example.test","role":"CEO","tags":["b"]},
    {"display_name":"Intruso","email":"marta@example.test","role":"Gerente","kind":"lead"},
    {"display_name":"","email":"sin-nombre@example.test"},
    {"display_name":"Sin contacto"}]', 'a.csv', 'sha-a');
select t.ok((select (r ->> 'created')::int from imp) = 2 and (select (r ->> 'updated')::int from imp) = 1
            and (select (r ->> 'conflicts')::int from imp) = 1 and (select (r ->> 'skipped')::int from imp) = 2,
            'import: 2 created, 1 updated (her own contact by email), 1 conflict and 2 invalid rows skipped');
select t.ok((select r ->> 'errors' from imp) = '[{"row": 5, "reason": "invalid"}, {"row": 6, "reason": "invalid"}]',
            'import: errors carry the row number and a reason, no data of the row');
select t.ok((select r::text from imp) not like '%Marta%' and (select r::text from imp) not like '%jose%'
            and (select r::text from imp) not like '%00000000-0000-4000-8000-000000000201%' and (select r::text from imp) not like '%Jose%',
            'import: the response leaks no name, id or owner of the other side');
select t.ok(t.n($q$select id from public.crm_contacts where source = 'import_csv' and owner_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 2
            and t.val($q$select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000211'$q$) = 'CEO'
            and t.val($q$select array_to_string(tags, ',') from public.crm_contacts where id = '00000000-0000-4000-8000-000000000211'$q$) = 'b'
            and t.val($q$select o.city from public.crm_organizations o where o.name_normalized = 'org nueva'$q$) = 'Sevilla',
            'import: new contacts belong to carla, her own one only gains the empty fields and tags, the organisation is created');
select t.ok(t.val($q$select display_name from public.crm_contacts where id = '00000000-0000-4000-8000-000000000211'$q$) = 'Lead de Carla',
            'import: an existing contact keeps its name');
select t.ok(public.crm_import_contacts_csv('[{"display_name":"Otro","email":"otro@example.test"}]', 'a.csv', 'sha-a') ->> 'import_id'
            = (select r ->> 'import_id' from imp)
            and (public.crm_import_contacts_csv('[{"display_name":"Otro","email":"otro@example.test"}]', 'a.csv', 'sha-a') ->> 'created') = '2'
            and t.n($q$select id from public.crm_contacts where email = 'otro@example.test'$q$) = 0,
            'import is idempotent: the same checksum returns the previous result and touches nothing');
select t.ok(t.n('select id from public.crm_import_conflicts') = 2 and t.n('select id from public.crm_imports') = 2,
            'carla sees her two pending rows (seed + this import) and two imports');
reset role;
select t.ok((select display_name from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201') = 'Marta Test'
            and (select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201') is null
            and (select owner_id from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201') is null,
            'import: Jose''s contact is untouched by the conflicting row');
select t.ok((select count(*) from public.crm_import_conflicts where status = 'pending' and owner_id = '00000000-0000-4000-8000-0000000000a5'
              and existing_contact_id = '00000000-0000-4000-8000-000000000201' and "row" ->> 'display_name' = 'Intruso') = 1
            and (select count(*) from private.outbox where event = 'crm.import_conflicts' and (payload ->> 'conflicts')::int = 1) = 1
            and (select count(*) from private.outbox where event = 'crm.import_done' and payload ->> 'owner_id' = '00000000-0000-4000-8000-0000000000a5') = 1,
            'import: the conflict row is queued with the existing contact; outbox crm.import_done and crm.import_conflicts');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$select public.crm_import_contacts_csv((select jsonb_agg(jsonb_build_object('display_name', 'N' || i, 'email', 'n' || i || '@example.test')) from generate_series(1, 501) i), 'big.csv', 'sha-big')$q$)
            = '22023 too_many_rows'
            and t.n($q$select id from public.crm_imports where checksum = 'sha-big'$q$) = 0,
            'import: 501 rows fail with too_many_rows before touching anything');
select t.ok(t.err($q$select public.crm_import_contacts_csv('{}', 'x.csv', 'sha-x')$q$) = '22023 rows_must_be_an_array'
            and t.err($q$select public.crm_import_contacts_csv('[]', 'x.csv', ' ')$q$) = '22023 checksum_required',
            'import: rows must be an array and the checksum is required');
select t.ok((select r ->> 'conflicts' from imp) = '1'
            and t.err($q$select public.crm_import_contacts_csv('[{"display_name":"Intruso otra vez","email":"marta@example.test"}]', 'c.csv', 'sha-c')$q$) is null
            and t.n('select id from public.crm_import_conflicts') = 3,
            'import: a different file with the same person queues another row (the admin will see two)');
rollback;

-- ================================================================ conflict resolution (Q22): the four outcomes
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
select public.crm_import_contacts_csv(
  '[{"display_name":"Fusion","email":"agencia@example.test","role":"Directora","tags":["merge"]},
    {"display_name":"Mantener","email":"recruiter@example.test","role":"Intrusa"},
    {"display_name":"Descartar","email":"sin@test","role":"X"}]', 'b.csv', 'sha-b');
set local request.jwt.claims = :'jose';
select t.ok(t.n('select id from public.admin_import_conflicts()') = 4 and t.n($q$select id from public.admin_import_conflicts('resolved')$q$) = 0,
            'admin: four pending conflicts (seed + three)');
select t.ok(t.err($q$select public.admin_import_conflict_resolve('00000000-0000-4000-8000-000000001101', 'assign_importer', 'ok')$q$) is null,
            'admin resolves the seeded conflict with assign_importer');
select t.ok(t.val($q$select owner_id::text from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201'$q$) = '00000000-0000-4000-8000-0000000000a5'
            and t.val($q$select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201'$q$) = 'Gerente'
            and t.val($q$select array_to_string(tags, ',') from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201'$q$) = 'csv'
            and t.val($q$select status::text || ':' || resolution::text from public.crm_import_conflicts where id = '00000000-0000-4000-8000-000000001101'$q$) = 'resolved:assign_importer',
            'assign_importer: the contact moves to carla and gains the empty fields and tags from the row');
select t.ok(t.err($q$select public.admin_import_conflict_resolve('00000000-0000-4000-8000-000000001101', 'discard')$q$) = '22023 conflict_not_pending',
            'a resolved conflict cannot be resolved again');
select t.ok(t.err($q$select public.admin_import_conflict_resolve((select id from public.crm_import_conflicts where "row" ->> 'display_name' = 'Fusion'), 'merge')$q$) is null
            and t.err($q$select public.admin_import_conflict_resolve((select id from public.crm_import_conflicts where "row" ->> 'display_name' = 'Mantener'), 'assign_existing')$q$) is null
            and t.err($q$select public.admin_import_conflict_resolve((select id from public.crm_import_conflicts where "row" ->> 'display_name' = 'Descartar'), 'discard')$q$) is null,
            'admin resolves the other three conflicts: merge, assign_existing and discard');
select t.ok(t.val($q$select owner_id::text from public.crm_contacts where id = '00000000-0000-4000-8000-000000000203'$q$) is null
            and t.val($q$select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000203'$q$) = 'Directora'
            and t.val($q$select array_to_string(tags, ',') from public.crm_contacts where id = '00000000-0000-4000-8000-000000000203'$q$) = 'merge'
            and t.val($q$select display_name from public.crm_contacts where id = '00000000-0000-4000-8000-000000000203'$q$) = 'Contacto Agencia Test',
            'merge: the contact stays with Jose and gains the empty fields and tags');
select t.ok(t.val($q$select owner_id::text from public.crm_contacts where id = '00000000-0000-4000-8000-000000000204'$q$) is null
            and t.val($q$select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000204'$q$) is null
            and t.val($q$select owner_id::text from public.crm_contacts where id = '00000000-0000-4000-8000-000000000205'$q$) is null
            and t.val($q$select role from public.crm_contacts where id = '00000000-0000-4000-8000-000000000205'$q$) is null,
            'assign_existing and discard: nothing changes in the contacts');
select t.ok(t.n($q$select id from public.admin_import_conflicts('pending')$q$) = 0
            and t.n($q$select id from public.admin_import_conflicts('resolved')$q$) = 4,
            'the four conflicts are resolved');
reset role;
select t.ok((select count(*) from private.outbox where event = 'crm.import_conflict_resolved') = 4
            and (select count(*) from private.outbox where event = 'crm.import_conflict_resolved'
                  and payload ->> 'outcome' = 'assigned' and payload ->> 'owner_id' = '00000000-0000-4000-8000-0000000000a5') = 1
            and (select count(*) from private.outbox where event = 'crm.import_conflict_resolved' and payload ->> 'outcome' = 'not_assigned') = 3,
            'outbox crm.import_conflict_resolved: outcome assigned (1) / not_assigned (3) with no contact data');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n($q$select id from public.crm_contacts where id = '00000000-0000-4000-8000-000000000201'$q$) = 1 and t.n('select id from public.crm_contacts') = 4,
            'carla sees the contact the admin assigned to her (and only that one more)');
select t.ok(t.val($q$select resolution::text from public.crm_import_conflicts where id = '00000000-0000-4000-8000-000000001101'$q$) = 'assign_importer'
            and t.err('select existing_contact_id from public.crm_import_conflicts') like '42501 %',
            'carla sees how her row was resolved, still never the other side');
rollback;

begin;
-- A contact archived while its conflict waits: the importer gets a new contact (documented rare case).
update public.crm_contacts set archived_at = now() where id = '00000000-0000-4000-8000-000000000201';
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_import_conflict_resolve('00000000-0000-4000-8000-000000001101', 'discard')$q$) is null,
            'admin resolves a conflict whose existing contact was archived meanwhile');
select t.ok(t.val($q$select resolution::text from public.crm_import_conflicts where id = '00000000-0000-4000-8000-000000001101'$q$) = 'assign_importer'
            and t.val($q$select count(*) from public.crm_contacts where owner_id = '00000000-0000-4000-8000-0000000000a5' and display_name = 'Marta (Carla)'$q$) = '1',
            'archived existing contact: the row becomes a new contact for the importer (assign_importer)');
rollback;

-- ================================================================ staff: invite, claim, switch off, reassign, list (Q21, Q24)
begin;
insert into auth.users (instance_id, id, aud, role, email, email_confirmed_at, raw_user_meta_data, created_at, updated_at)
values ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a7', 'authenticated', 'authenticated',
        'eva@test', now(), '{"full_name":"Eva Test"}', now(), now()),
       ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a8', 'authenticated', 'authenticated',
        'old@test', now(), '{}', now(), now()),
       ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a9', 'authenticated', 'authenticated',
        'raw@test', null, '{}', now(), now());
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_staff_invite('eva@test', 'closer')$q$) like '42883 %',
            'admin_staff_invite without the rate does not exist: the argument is mandatory (Q21)');
select t.ok(t.err($q$select public.admin_staff_invite('eva@test', 'closer', 101)$q$) = '22023 invalid_commission_rate'
            and t.err($q$select public.admin_staff_invite('eva@test', 'closer', null)$q$) = '22023 invalid_commission_rate'
            and t.err($q$select public.admin_staff_invite('no-es-email', 'closer', 10)$q$) = '22023 invalid_email'
            and t.err($q$select public.admin_staff_invite('carla@test', 'closer', 10)$q$) = '22023 already_staff',
            'invitation: rate out of range or missing, bad email and an existing staff member are refused');
select t.ok(t.err($q$select public.admin_staff_invite('eva@test', 'closer', 12.5)$q$) is null
            and t.err($q$select public.admin_staff_invite('eva@test', 'closer', 12.5)$q$) is null
            and t.n($q$select id from public.staff_invites where email = 'eva@test'$q$) = 1,
            'invitation: upsert by email (resending does not duplicate)');
select t.ok(t.err($q$select public.admin_staff_invite('old@test', 'closer', 8)$q$) is null
            and t.err($q$select public.admin_staff_invite('raw@test', 'closer', 8)$q$) is null,
            'invitations for old@test and raw@test');
reset role;
update public.staff_invites set expires_at = now() - interval '1 day' where email = 'old@test';
select t.ok((select count(*) from private.outbox where event = 'staff.invited' and payload ->> 'email' = 'eva@test') = 2,
            'outbox staff.invited for the email of the invitee (one per send)');
set local role authenticated;
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a7","role":"authenticated","aal":"aal1","email":"eva@test"}';
select t.ok(t.val('select public.claim_staff_access()::text') = 'closer'
            and t.val('select public.claim_staff_access()::text') = 'closer'
            and t.val('select commission_rate::text from public.staff_members') = '12.50',
            'claim_staff_access (aal1 is enough: it precedes the TOTP enrolment): closer with the rate of the invitation, idempotent');
select t.ok(t.n('select id from public.crm_contacts') = 0 and not private.is_closer(),
            'a freshly claimed closer with an aal1 token reads nothing yet');
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a8","role":"authenticated","aal":"aal1","email":"old@test"}';
select t.ok(t.val('select coalesce(public.claim_staff_access()::text, ''none'')') = 'none',
            'an expired invitation cannot be claimed');
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-0000000000a9","role":"authenticated","aal":"aal1","email":"raw@test"}';
select t.ok(t.err('select public.claim_staff_access()') = '42501 email_not_confirmed',
            'an unconfirmed email cannot claim staff access');
reset role;
select t.ok((select claimed_user_id from public.staff_invites where email = 'eva@test') = '00000000-0000-4000-8000-0000000000a7'
            and (select count(*) from private.outbox where event = 'staff.claimed') = 1,
            'the claimed invitation is marked and staff.claimed is queued');
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.n('select * from public.admin_staff_list()') = 4
            and t.val($q$select mfa_enrolled::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 'false'
            and t.val($q$select contacts_count::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = '3'
            and t.val($q$select commissions_pending::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = '1'
            and t.val($q$select email from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 'carla@test'
            and t.val($q$select telegram_linked::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a1'$q$) = 'true',
            'admin_staff_list: email, contacts, pending commissions, telegram and MFA state per person (carla has no factor)');
reset role;
insert into auth.mfa_factors (user_id, factor_type, status) values ('00000000-0000-4000-8000-0000000000a5', 'totp', 'verified'), ('00000000-0000-4000-8000-0000000000a6', 'totp', 'unverified');
set local role authenticated;
select t.ok(t.val($q$select mfa_enrolled::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 'true'
            and t.val($q$select mfa_enrolled::text from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a6'$q$) = 'false',
            'admin_staff_list: mfa_enrolled needs a verified factor');
select t.ok(t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a5', true, 20, 'nota interna')$q$) is null
            and t.val($q$select (disabled_at is not null)::text || ':' || commission_rate::text || ':' || notes from public.admin_staff_list() where user_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 'true:20.00:nota interna'
            and t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a1', true, null, null)$q$) = '22023 cannot_disable_self'
            and t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a5', null, 101, null)$q$) = '22023 invalid_commission_rate'
            and t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a2', true, null, null)$q$) = 'P0002 staff_not_found',
            'admin_staff_set: switches off, changes the rate and the notes; self and bad values are refused');
select t.ok(t.val($q$select public.admin_reassign_contacts('00000000-0000-4000-8000-0000000000a5', null)$q$) = '3'
            and t.n($q$select id from public.crm_contacts where owner_id = '00000000-0000-4000-8000-0000000000a5'$q$) = 0
            and t.val($q$select public.admin_reassign_contacts(null, '00000000-0000-4000-8000-0000000000a5')$q$) = '8'
            and t.err($q$select public.admin_reassign_contacts(null, '00000000-0000-4000-8000-0000000000a2')$q$) = 'P0002 staff_not_found',
            'admin_reassign_contacts moves a whole portfolio (to Jose with null) and logs a note per contact');
reset role;
select t.ok((select count(*) from public.crm_interactions where body = 'reasignado') = 11,
            'every reassigned contact got a timeline note');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n('select id from public.crm_contacts') = 0,
            'a switched-off carla reads 0 contacts at once even with her token still valid (aal2)');
rollback;

-- ================================================================ commissions with a frozen percent (Q21)
begin;
insert into public.crm_contacts (id, kind, status, display_name, email, source, owner_id)
values ('00000000-0000-4000-8000-000000000230', 'lead', 'new', 'Otro lead de Carla', 'otro-carla@example.test', 'manual', '00000000-0000-4000-8000-0000000000a5');
insert into public.leads (id, contact_id, status, source, via, pack_code, idempotency_key) values
  ('00000000-0000-4000-8000-000000000320', '00000000-0000-4000-8000-000000000230', 'open', 'manual', 'client', 'P1', 'k:ca'),
  ('00000000-0000-4000-8000-000000000321', '00000000-0000-4000-8000-000000000201', 'open', 'manual', 'client', 'P1', 'k:marta2'),
  ('00000000-0000-4000-8000-000000000322', '00000000-0000-4000-8000-000000000220', 'open', 'manual', 'client', 'P1', 'k:dani');
-- Commission without p_commission only for leads the owner closer opened (created_by): these three were opened by their closers.
update public.leads set created_by = '00000000-0000-4000-8000-0000000000a5' where id in ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000320');
update public.leads set created_by = '00000000-0000-4000-8000-0000000000a6' where id = '00000000-0000-4000-8000-000000000322';
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000311', 1400, now(), false)$q$) is null
            and t.val($q$select percent::text || ':' || amount::text || ':' || status::text from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'$q$) = '10.00:140.00:pending',
            'closing a lead of carla for 1.400 creates her commission: 10.00 % = 140.00, pending');
select t.ok(t.err($q$select public.admin_staff_set('00000000-0000-4000-8000-0000000000a5', false, 20, null)$q$) is null
            and t.val($q$select percent::text from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'$q$) = '10.00',
            'changing carla''s rate does not rewrite the commission already created');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000320', 1000, now(), false)$q$) is null
            and t.val($q$select percent::text || ':' || amount::text from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000320'$q$) = '20.00:200.00',
            'the next close uses the new rate: 20.00 % of 1.000 = 200.00');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000321', 1000, now(), false)$q$) is null
            and t.n($q$select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000321'$q$) = 0,
            'a contact of Jose (no owner) produces no commission');
select t.ok(t.err($q$select public.admin_close_lead_paid('00000000-0000-4000-8000-000000000322', 200, now(), false)$q$) is null
            and t.val($q$select closer_id::text || ':' || percent::text || ':' || amount::text from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000322'$q$) = '00000000-0000-4000-8000-0000000000a6:15.00:30.00',
            'a switched-off closer is owed the commission all the same (15 % of 200)');
select t.ok(t.val($q$select count(*) from public.crm_interactions where kind = 'commission'$q$) = '3',
            'each commission leaves a «commission» interaction in the timeline');
select t.ok(t.err($q$select public.admin_commission_mark_paid((select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'), now(), 'transferencia')$q$) = '22023 commission_not_approved'
            and t.err($q$select public.admin_commission_approve((select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'))$q$) is null
            and t.err($q$select public.admin_commission_approve((select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'))$q$) = '22023 commission_not_pending'
            and t.err($q$select public.admin_commission_mark_paid((select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'), '2026-11-02', 'transferencia')$q$) is null
            and t.val($q$select status::text || ':' || coalesce(paid_note, '') from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000311'$q$) = 'paid:transferencia',
            'commission transitions: pending -> approved -> paid (paying before approving, or approving twice, fails)');
select t.ok(t.err($q$select public.admin_commission_reject((select id from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000320'), 'duplicada')$q$) is null
            and t.val($q$select status::text || ':' || rejected_reason from public.closer_commissions where lead_id = '00000000-0000-4000-8000-000000000320'$q$) = 'rejected:duplicada',
            'a pending commission can be rejected with a reason');
select t.ok(t.err($q$select public.admin_commission_create('00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-000000000311', 500, 'extra')$q$) like '23505 %'
            and t.err($q$select public.admin_commission_create('00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-000000000331', 500, null)$q$) = 'P0002 lead_not_found'
            and t.err($q$select public.admin_commission_create('00000000-0000-4000-8000-0000000000a2', '00000000-0000-4000-8000-000000000311', 500, null)$q$) = 'P0002 closer_not_found',
            'manual commissions keep one per lead (unique) and need a real lead and closer');
reset role;
select t.ok((select count(*) from private.outbox where event = 'commission.created') = 3
            and (select count(*) from private.outbox where event = 'commission.approved') = 1
            and (select count(*) from private.outbox where event = 'commission.paid') = 1
            and (select count(*) from private.outbox where event = 'commission.rejected') = 1,
            'outbox: commission.created (3), approved, paid and rejected');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n('select id from public.closer_commissions') = 3 and t.n($q$select id from public.closer_commissions where closer_id <> '00000000-0000-4000-8000-0000000000a5'$q$) = 0,
            'carla reads her own commissions only');
rollback;

-- ================================================================ client stories (D52)
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n('select id from public.client_user_stories') = 1,
            'ana sees her seeded story');
create temp table st (id uuid);
grant all on st to authenticated;
with ins as (
  insert into public.client_user_stories (client_id, author_user_id, title, as_a, i_want, so_that, acceptance_criteria)
  values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'Pagos', 'dueña', 'cobrar online', 'cobrar sin ir al banco', array['Stripe', 'Factura']) returning id)
insert into st select id from ins;
select t.ok((select count(*) from st) = 1
            and t.val($q$select status::text from public.client_user_stories where title = 'Pagos'$q$) = 'proposed',
            'ana proposes a story: it is born «proposed»');
select t.ok(t.err($q$update public.client_user_stories set status = 'accepted' where title = 'Pagos'$q$) like '42501 %'
            and t.err($q$update public.client_user_stories set estimate_hours = 1 where title = 'Pagos'$q$) like '42501 %'
            and t.err($q$update public.client_user_stories set decided_by = '00000000-0000-4000-8000-0000000000a2' where title = 'Pagos'$q$) like '42501 %',
            'ana cannot change the status, the estimate or the decision of a story: 42501');
select t.ok(t.affected($q$update public.client_user_stories set title = 'Pagos online' where title = 'Pagos'$q$) = 1,
            'ana edits the text while the story is proposed');
select t.ok(t.err($q$insert into public.client_user_stories (client_id, author_user_id, title, as_a, i_want, so_that) values ('00000000-0000-4000-8000-000000000410', '00000000-0000-4000-8000-0000000000a2', 'X', 'a', 'b', 'c')$q$) like '42501 %'
            and t.err($q$insert into public.client_user_stories (client_id, author_user_id, title, as_a, i_want, so_that) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a3', 'X', 'a', 'b', 'c')$q$) like '42501 %'
            and t.err($q$insert into public.client_user_stories (client_id, author_user_id, title, as_a, i_want, so_that, status) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'X', 'a', 'b', 'c', 'accepted')$q$) like '42501 %',
            'ana cannot propose on another client, as another author, or with a status of her choice');
select t.ok(t.err($q$select public.accept_user_story((select id from st), 1, 1, null)$q$) = '42501 forbidden'
            and t.err($q$select public.reject_user_story((select id from st), 'no')$q$) = '42501 forbidden',
            'ana cannot decide a story');
reset role;
select t.ok((select count(*) from private.outbox where event = 'story.proposed' and payload ->> 'title' = 'Pagos online') = 0
            and (select count(*) from private.outbox where event = 'story.proposed' and payload ->> 'client_id' = '00000000-0000-4000-8000-000000000401') = 2
            and (select payload ->> 'owner_id' from private.outbox where event = 'story.proposed' and payload ->> 'title' = 'Pagos') is null
            and (select count(*) from public.crm_interactions where kind = 'story_proposed' and contact_id = '00000000-0000-4000-8000-000000000202') = 2,
            'outbox story.proposed (seed + new, owner null: Jose''s contact) and a timeline entry per story');
-- A story on carla's client: she decides, Jose's ones are not hers.
insert into public.client_user_stories (id, client_id, title, as_a, i_want, so_that, acceptance_criteria)
values ('00000000-0000-4000-8000-000000000e02', '00000000-0000-4000-8000-000000000410', 'Reservas', 'dueño', 'reservar', 'no perder citas', array['Formulario']);
select t.ok((select payload ->> 'owner_id' from private.outbox where event = 'story.proposed' and payload ->> 'story_id' = '00000000-0000-4000-8000-000000000e02') = '00000000-0000-4000-8000-0000000000a5',
            'story.proposed carries the owner closer so the rule «owner» reaches carla');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n('select id from public.client_user_stories') = 1 and t.n('select id from public.client_tasks') = 0
            and t.err($q$update public.client_user_stories set status = 'accepted'$q$) like '42501 %'
            and t.err($q$select public.accept_user_story('00000000-0000-4000-8000-000000000e01', 6, 600, null)$q$) = '42501 forbidden'
            and t.err($q$select public.reject_user_story('00000000-0000-4000-8000-000000000e01', 'no')$q$) = '42501 forbidden',
            'carla sees the story of her client, cannot update it directly nor decide the stories of Jose''s clients');
select t.ok(t.val($q$select (public.accept_user_story('00000000-0000-4000-8000-000000000e02', 6, 600, 'ok'))::text is not null$q$) = 'true'
            and t.val($q$select status::text || ':' || estimate_hours::text || ':' || (task_id is not null)::text from public.client_user_stories$q$) = 'converted:6.0:true'
            and t.n($q$select id from public.client_tasks where story_id = '00000000-0000-4000-8000-000000000e02'$q$) = 1
            and t.val($q$select description like 'Como dueño quiero reservar para no perder citas%Formulario%' from public.client_tasks where story_id is not null$q$) = 'true',
            'carla accepts with 6 h: a task «Como … quiero … para …» with the criteria and the story converted');
select t.ok(t.err($q$select public.accept_user_story('00000000-0000-4000-8000-000000000e02', 1, 1, null)$q$) = '22023 story_not_proposed'
            and t.err($q$select public.convert_user_story('00000000-0000-4000-8000-000000000e02')$q$) = '22023 story_not_accepted',
            'a decided story cannot be decided or converted again');
set local request.jwt.claims = :'jose';
select t.ok(t.val($q$select public.accept_user_story('00000000-0000-4000-8000-000000000e01', 3, null, 'sin tarea', false)$q$) is null
            and t.val($q$select status::text from public.client_user_stories where id = '00000000-0000-4000-8000-000000000e01'$q$) = 'accepted'
            and t.val($q$select (public.convert_user_story('00000000-0000-4000-8000-000000000e01'))::text is not null$q$) = 'true'
            and t.val($q$select status::text from public.client_user_stories where id = '00000000-0000-4000-8000-000000000e01'$q$) = 'converted',
            'admin: accept without a task leaves it accepted; convert_user_story creates the task later');
select t.ok(t.err($q$select public.reject_user_story((select id from public.client_user_stories where title = 'Pagos online'), 'fuera de alcance')$q$) is null
            and t.val($q$select status::text || ':' || estimate_note from public.client_user_stories where title = 'Pagos online'$q$) = 'rejected:fuera de alcance',
            'admin rejects a story with a note');
reset role;
select t.ok((select count(*) from private.outbox where event = 'story.decided') = 3
            and (select count(*) from public.crm_interactions where kind = 'story_decided') = 3,
            'outbox story.decided (client email) and timeline entries for each decision');
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.n($q$select id from public.client_tasks where story_id is not null$q$) = 1
            and t.affected($q$update public.client_user_stories set title = 'cambio' where id = '00000000-0000-4000-8000-000000000e01'$q$) = 0,
            'ana sees the task born from her story («De tu historia») and cannot edit a converted story (0 rows)');
rollback;

-- ================================================================ site content (D53)
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.content_save_draft('message_override', 'auth.login.title', 'es', '{"value":"x"}')$q$) is null,
            'jose saves a draft of a key outside the editable namespaces (it is judged at publication)');
select t.ok(t.err($q$select public.content_publish()$q$) like '22023 namespace_not_editable%',
            'content_publish rejects a foreign namespace (auth) and publishes nothing');
select t.ok(t.err($q$select public.content_save_draft('message_override', 'auth.login.title', 'es', null)$q$) is null
            and t.err($q$select public.content_save_draft('message_override', 'home.cta', 'es', '{"value":"Hola {{DATO: x}}"}')$q$) is null
            and t.err($q$select public.content_publish()$q$) like '22023 placeholder_in_content%',
            'content_publish rejects a {{DATO}} marker');
select t.ok(t.err($q$select public.content_save_draft('settings', 'settings', 'es', '{}')$q$) = '22023 invalid_locale_for_kind'
            and t.err($q$select public.content_save_draft('faq', 'f1', null, '{}')$q$) = '22023 invalid_locale_for_kind'
            and t.err($q$select public.content_save_draft('faq', 'f1', 'es', '[]')$q$) = '22023 draft_must_be_an_object',
            'drafts: settings and projects have no locale, the rest need one, and the draft is an object');
select t.ok(t.err($q$select public.content_save_draft('message_override', 'home.cta', 'es', null)$q$) is null
            and t.n($q$select id from public.site_content_entries where draft is distinct from published$q$) = 1
            and t.val('select (public.admin_counters() ->> ''content_pending'')::int') = '1',
            'discarding a draft returns the entry to the published value; one entry (seed override) is still pending');
create temp table pub (id uuid);
grant all on pub to authenticated, service_role;
insert into pub select public.content_publish();
select t.ok((select count(*) from pub) = 1
            and t.val($q$select status::text from public.site_content_publications where id = (select id from pub)$q$) = 'queued'
            and t.val($q$select published ->> 'value' || ':' || published_version::text from public.site_content_entries where id = '00000000-0000-4000-8000-000000001401'$q$) = 'Borrador del titular:2'
            and t.val('select (public.admin_counters() ->> ''content_pending'')::int') = '0',
            'content_publish: the seed override goes to version 2, the publication is queued and nothing is pending');
select t.ok(t.val($q$select snapshot -> 'files' -> 'content/overrides/messages.es.json' ->> 'home.hero.title' from public.site_content_publications where id = (select id from pub)$q$) = 'Borrador del titular'
            and t.val($q$select snapshot -> 'files' ? 'content/pricing.json' from public.site_content_publications where id = (select id from pub)$q$) = 'true'
            and t.val($q$select snapshot -> 'files' ? 'content/overrides/settings.json' from public.site_content_publications where id = (select id from pub)$q$) = 'true',
            'the snapshot carries every published file: overrides, settings and content/pricing.json');
select t.ok(t.err('select public.content_publish()') = '22023 nothing_to_publish',
            'publishing with nothing pending is refused');
select t.ok(t.err($q$select public.content_rollback('00000000-0000-4000-8000-000000001401', 1)$q$) is null
            and t.val($q$select published_version::text || ':' || (published ->> 'value') from public.site_content_entries where id = '00000000-0000-4000-8000-000000001401'$q$) = '3:Titular publicado'
            and t.val($q$select content ->> 'value' from public.site_content_versions where entry_id = '00000000-0000-4000-8000-000000001401' and version = 3$q$) = 'Titular publicado'
            and t.n($q$select id from public.site_content_versions where entry_id = '00000000-0000-4000-8000-000000001401'$q$) = 3
            and t.err($q$select public.content_rollback('00000000-0000-4000-8000-000000001401', 99)$q$) = 'P0002 version_not_found',
            'content_rollback: version 1 comes back as version 3 and the history is kept');
select t.ok(t.val($q$select (public.content_draft_snapshot('es') -> 'messages' ->> 'home.hero.title')$q$) = 'Titular publicado'
            and t.val($q$select jsonb_typeof(public.content_draft_snapshot('es') -> 'settings')$q$) = 'object',
            'content_draft_snapshot: the draft if there is one, the published value otherwise');
select t.ok(t.err($q$select public.content_publication_mark((select id from pub), 'deployed', 'abc', null, null, null)$q$) like '42501 %',
            'jose (authenticated) cannot mark a publication: service role only');
reset role;
set local role service_role;
set local request.jwt.claims = :'service';
select t.ok(t.err($q$select public.content_publication_mark((select id from pub), 'committed', 'abc123', '{"a":"sha"}', 55, null)$q$) is null
            and t.err($q$select public.content_publication_mark((select id from pub), 'deployed', null, null, null, null)$q$) is null
            and t.err($q$select public.content_publication_mark('00000000-0000-4000-8000-0000000000ff', 'failed', null, null, null, 'boom')$q$) = 'P0002 publication_not_found',
            'service role marks committed and deployed; an unknown publication is refused');
reset role;
select t.ok((select status::text || ':' || commit_sha || ':' || workflow_run_id::text from public.site_content_publications where id = (select id from pub)) = 'deployed:abc123:55'
            and (select count(*) from private.outbox where event = 'content.publish_requested') = 2
            and (select count(*) from private.outbox where event = 'content.deployed') = 1,
            'publication state, outbox content.publish_requested (two publications) and content.deployed');
set local role service_role;
select public.content_publication_mark((select id from public.site_content_publications order by created_at desc, id limit 1), 'failed', null, null, null, 'build roto');
reset role;
select t.ok((select count(*) from private.outbox where event = 'content.deploy_failed' and payload ->> 'error' = 'build roto') = 1,
            'a failed publication queues content.deploy_failed');
rollback;

-- ================================================================ notification rules and telegram
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.n('select id from public.notification_rules') = 27 and t.affected($q$update public.notification_rules set enabled = false where event = 'quote.sent'$q$) = 1
            and t.err($q$insert into public.notification_rules (event, recipient, channel) values ('quote.sent', 'staff_user', 'telegram')$q$) like '23514 %'
            and t.err($q$insert into public.notification_rules (event, recipient, channel) values ('lead.created', 'admin', 'telegram')$q$) like '23505 %',
            'admin edits rules; staff_user needs a recipient and a rule is unique');
select t.ok(t.err($q$select * from public.notification_recipients('lead.created', null)$q$) like '42501 %',
            'authenticated cannot resolve recipients (service role only)');
reset role;
update public.staff_members set telegram_chat_id = '777' where user_id = '00000000-0000-4000-8000-0000000000a5';
update public.staff_members set telegram_chat_id = '888' where user_id = '00000000-0000-4000-8000-0000000000a6';
set local role service_role;
set local request.jwt.claims = :'service';
select t.ok((select string_agg(channel::text || ':' || address, ',' order by address) from public.notification_recipients('lead.created', '00000000-0000-4000-8000-0000000000a5')) = 'telegram:0000000001,telegram:777'
            and (select string_agg(channel::text || ':' || address, ',') from public.notification_recipients('lead.created', null)) = 'telegram:0000000001'
            and (select count(*) from public.notification_recipients('lead.created', '00000000-0000-4000-8000-0000000000a6')) = 1,
            'recipients of lead.created: the admin plus the owner closer; no owner -> admin only; a switched-off owner is skipped');
select t.ok((select string_agg(channel::text || ':' || coalesce(address, 'null'), ',') from public.notification_recipients('client.invited', null)) = 'email:null'
            and (select count(*) from public.notification_recipients('evento.sin.reglas', '00000000-0000-4000-8000-0000000000a5')) = 0
            and (select string_agg(channel::text || ':' || address, ',') from public.notification_recipients('crm.import_done', '00000000-0000-4000-8000-0000000000a5')) = 'telegram:777',
            'recipients: client rules return the channel for the gateway to resolve; no rule, no notice; owner only for import_done');
select t.ok(public.staff_telegram_link('NOEXISTE', '123') is false, 'telegram link with an unknown code returns false');
reset role;
insert into public.staff_telegram_codes (user_id, code, expires_at) values ('00000000-0000-4000-8000-0000000000a5', 'ABCD1234', now() + interval '10 minutes')
  on conflict (user_id) do update set code = excluded.code, expires_at = excluded.expires_at;
set local role service_role;
select t.ok(public.staff_telegram_link('abcd1234', '999') is true
            and public.staff_telegram_link('ABCD1234', '999') is false,
            'telegram link: the code (case-insensitive) links once and is burnt');
reset role;
select t.ok((select telegram_chat_id from public.staff_members where user_id = '00000000-0000-4000-8000-0000000000a5') = '999'
            and (select count(*) from public.staff_telegram_codes where user_id = '00000000-0000-4000-8000-0000000000a5') = 0,
            'staff_members.telegram_chat_id holds the linked chat and the code is gone');
insert into public.staff_telegram_codes (user_id, code, expires_at) values ('00000000-0000-4000-8000-0000000000a5', 'OLD00000', now() - interval '1 minute');
set local role service_role;
select t.ok(public.staff_telegram_link('OLD00000', '111') is false, 'an expired telegram code does not link');
reset role;
insert into public.staff_telegram_codes (user_id, code, expires_at) values ('00000000-0000-4000-8000-0000000000a6', 'DANI0000', now() + interval '10 minutes');
set local role service_role;
select t.ok(public.staff_telegram_link('DANI0000', '222') is false, 'B4 a switched-off member cannot link a Telegram chat');
reset role;
select t.ok((select telegram_chat_id from public.staff_members where user_id = '00000000-0000-4000-8000-0000000000a6') is distinct from '222',
            'B4 and his row stays without that chat');
update public.staff_members set telegram_chat_id = null where role = 'admin';
set local role service_role;
select t.ok((select string_agg(channel::text || ':' || coalesce(address, 'null') || ':' || admin_fallback::text, ',') from public.notification_recipients('lead.created', null)) = 'telegram:null:true'
            and (select count(*) from public.notification_recipients('client.invited', null) where admin_fallback) = 0
            and (select count(*) from public.notification_recipients('lead.created', '00000000-0000-4000-8000-0000000000a5') where address = '999' and not admin_fallback) = 1,
            'M3 an admin rule whose admin has no chat comes back as admin_fallback (the gateway uses TELEGRAM_ADMIN_CHAT_ID); owner rows without chat are still skipped');
reset role;
rollback;

-- ================================================================ price catalogue (Q23, D54)
begin;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_pricing_set_pack('{"code":"P2","price":1500}')$q$) is null
            and t.val($q$select old_price::text || '>' || new_price::text || ':' || changed_by::text from public.pricing_price_history where item_kind = 'pack' and item_code = 'P2' order by changed_at desc, id desc limit 1$q$) is not null,
            'admin_pricing_set_pack changes P2 to 1.500');
select t.ok(t.val($q$select old_price::text || '>' || new_price::text || ':' || changed_by::text from public.pricing_price_history where item_kind = 'pack' and item_code = 'P2' order by changed_at desc, id desc limit 1$q$)
            = '1400.00>1500.00:00000000-0000-4000-8000-0000000000a1',
            'price history: P2 1400 -> 1500 by jose');
select t.ok(((t.snapshot() -> 'packs') -> 1 ->> 'price') = '1500' and (t.snapshot() -> 'packs') -> 1 ->> 'code' = 'P2'
            and t.val('select (public.admin_counters() ->> ''content_pending'')::int') = '2',
            'the snapshot reflects 1.500 at once; the unpublished catalogue counts as pending content (1 entry + prices)');
reset role;
set local role service_role;
set local request.jwt.claims = :'service';
select t.ok(((public.pricing_published() -> 'packs') -> 1 ->> 'price') = '1400' and t.snapshot() is not null,
            'pricing_published() still says 1.400 until content_publish() (service role)');
reset role;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_pricing_set_pack('{"code":"LANDING","kind":"web","slug":"landing-2","name":{"es":"Landing","en":"Landing"},"price":500,"weeks":1,"sort":6}')$q$) is null
            and t.err($q$select public.admin_pricing_set_pack('{"code":"bad code","price":1}')$q$) = '22023 invalid_code'
            and t.err($q$select public.admin_pricing_set_pack('{"code":"NOPRICE"}')$q$) = '22023 name_and_price_required'
            and exists (select 1 from jsonb_array_elements(t.snapshot() -> 'packs') p where p ->> 'code' = 'LANDING'),
            'a new pack (LANDING) is created, bad input is refused, and it shows up in the snapshot');
select t.ok(t.err($q$select public.admin_pricing_set_pack('{"code":"HIDDEN_PACK","visible":true}')$q$) is null
            and exists (select 1 from jsonb_array_elements(t.snapshot() -> 'packs') p where p ->> 'code' = 'HIDDEN_PACK')
            and t.err($q$select public.admin_pricing_set_pack('{"code":"HIDDEN_PACK","visible":false}')$q$) is null
            and not exists (select 1 from jsonb_array_elements(t.snapshot() -> 'packs') p where p ->> 'code' = 'HIDDEN_PACK'),
            'visible = false takes a pack out of the snapshot, visible = true puts it back');
select t.ok(t.err($q$select public.admin_pricing_delete('pack', 'P4')$q$) is null
            and not exists (select 1 from jsonb_array_elements(t.snapshot() -> 'packs') p where p ->> 'code' = 'P4')
            and t.val($q$select (deleted_at is not null)::text || ':' || active::text from public.packs where code = 'P4'$q$) = 'true:false'
            and t.err($q$select public.admin_pricing_set_pack('{"code":"P4","price":1}')$q$) = '22023 pack_deleted'
            and t.err($q$select public.admin_pricing_restore('pack', 'P4')$q$) is null
            and t.val($q$select (deleted_at is null)::text from public.packs where code = 'P4'$q$) = 'true',
            'soft delete: P4 leaves the snapshot but stays in the table; it cannot be edited until restored');
select t.ok(t.err($q$select public.admin_pricing_delete('pack', 'NOPE')$q$) = 'P0002 item_not_found'
            and t.err($q$select public.admin_pricing_delete('settings', 'x')$q$) = '22023 invalid_kind',
            'delete: unknown item and wrong kind are refused');
select t.ok(t.err($q$select public.admin_pricing_set_option('P5', '{"code":"pro","name":{"es":"Pro","en":"Pro"},"price":9000,"weeks":10}')$q$) is null
            and exists (select 1 from jsonb_array_elements(t.snapshot() -> 'apps') p where p ->> 'code' = 'P5_PRO' and p ->> 'price' = '9000')
            and t.err($q$select public.admin_pricing_set_option('NOPE', '{"code":"pro"}')$q$) = 'P0002 pack_not_found',
            'a new option of the app pack shows up as an app (P5_PRO)');
select t.ok(t.err($q$select public.admin_pricing_set_extra('{"code":"internal_fee","name":{"es":"Tarifa interna","en":"Internal fee"},"price":80,"visible":false}')$q$) is null
            and not exists (select 1 from jsonb_array_elements(t.snapshot() -> 'extras') e where e ->> 'code' = 'internal_fee')
            and t.err($q$select public.admin_pricing_set_extra('{"code":"Bad-Code","price":1}')$q$) = '22023 invalid_code',
            'an internal extra (visible = false) never reaches the snapshot');
select t.ok(t.err($q$select public.admin_pricing_set_settings(50, 150)$q$) is null
            and t.val($q$select old_price::text || '>' || new_price::text from public.pricing_price_history where item_kind = 'settings' and item_code = 'hourly' order by id desc limit 1$q$) = '40.00>50.00'
            and (t.snapshot() ->> 'hourly') = '50'
            and t.err($q$select public.admin_pricing_set_settings(0, 150)$q$) = '22023 invalid_rate',
            'hourly and feature rates: history on change, positive values only');
create temp table pub (id uuid);
grant all on pub to authenticated, service_role;
insert into pub select public.content_publish();
select t.ok(t.val($q$select (snapshot -> 'files' -> 'content/pricing.json' -> 'packs' -> 1 ->> 'price') from public.site_content_publications where id = (select id from pub)$q$) = '1500'
            and t.val($q$select (snapshot -> 'files' -> 'content/pricing.json' ->> 'version') ~ '^\d{4}-\d{2}-\d{2}\.\d+$' from public.site_content_publications where id = (select id from pub)$q$) = 'true'
            and t.val($q$select (snapshot -> 'files' -> 'content/pricing.json')::text not like '%HIDDEN_PACK%' from public.site_content_publications where id = (select id from pub)$q$) = 'true'
            and t.val('select (public.admin_counters() ->> ''content_pending'')::int') = '0',
            'content_publish writes content/pricing.json with 1.500 and a new version, without the hidden pack; nothing is pending');
select t.ok(t.err($q$select public.admin_pricing_set_settings(60, 150)$q$) is null, 'a second change to publish');
create temp table pub2 (id uuid);
grant all on pub2 to authenticated, service_role;
insert into pub2 select public.content_publish();
select t.ok(t.val($q$select status::text || ':' || error from public.site_content_publications where id = (select id from pub)$q$) = 'failed:superseded'
            and t.val($q$select status::text from public.site_content_publications where id = (select id from pub2)$q$) = 'queued',
            'M1 a newer publication marks the older queued one failed: superseded in the same transaction; the newer stays queued');
reset role;
select t.ok((select (published_snapshot -> 'packs' -> 1 ->> 'price') from public.pricing_settings) = '1500'
            and (select published_hash from public.pricing_settings) = md5(private.pricing_snapshot_build()::text)
            and (select pricing_version from public.packs where code = 'P2') = (select pricing_version from public.pricing_settings)
            and (select count(*) from public.packs where code = 'HIDDEN_PACK' and pricing_version = (select pricing_version from public.pricing_settings)) = 0,
            'published snapshot, hash and the pricing_version of the visible items follow the publication');
set local role service_role;
set local request.jwt.claims = :'service';
select t.ok(((public.pricing_published() -> 'packs') -> 1 ->> 'price') = '1500', 'pricing_published() now says 1.500');
reset role;
rollback;

-- ================================================================ custom quotes (Q23)
begin;
set local role authenticated;
set local request.jwt.claims = :'carla';
create temp table q (id uuid);
grant all on q to authenticated;
insert into q select public.quote_create('00000000-0000-4000-8000-000000000211', 'Presupuesto web', '00000000-0000-4000-8000-000000000311');
select t.ok((select count(*) from q) = 1 and t.val('select status::text || '':'' || total::text from public.custom_quotes where id = (select id from q)') = 'draft:0.00'
            and t.err($q$select public.quote_create('00000000-0000-4000-8000-000000000201', 'De Jose')$q$) = '42501 forbidden'
            and t.err($q$select public.quote_create('00000000-0000-4000-8000-000000000211', 'x', '00000000-0000-4000-8000-000000000301')$q$) = '22023 lead_not_of_contact',
            'carla creates a draft quote on her contact; Jose''s contact is forbidden; the lead must belong to the contact');
select t.ok(t.err($q$select public.quote_add_item((select id from q), 'seo_full', 1)$q$) is null
            and t.err($q$select public.quote_add_item((select id from q), 'maintenance_basic', 12)$q$) is null
            and t.val('select subtotal::text || '':'' || total::text from public.custom_quotes where id = (select id from q)') = '1188.00:1188.00',
            'two extras: seo_full x 1 + maintenance_basic x 12 -> subtotal = total = 1.188');
select t.ok(t.err($q$update public.custom_quotes set discount_amount = 100 where id = (select id from q)$q$) like '42501 %'
            and t.err($q$update public.custom_quotes set total = 1 where id = (select id from q)$q$) like '42501 %'
            and t.err($q$insert into public.custom_quotes (contact_id, title, discount_amount) values ('00000000-0000-4000-8000-000000000211', 'x', 5)$q$) like '42501 %'
            and t.err($q$select public.admin_quote_set_discount((select id from q), 100, 'x')$q$) = '42501 forbidden',
            'carla cannot touch the discount or the totals: 42501 / forbidden');
select t.ok(t.err($q$insert into public.custom_quote_items (quote_id, extra_code, quantity) values ((select id from q), 'no_existe', 1)$q$) like '23503 %'
            and t.err($q$select public.quote_add_item((select id from q), 'no_existe', 1)$q$) = '22023 unknown_extra'
            and t.err($q$insert into public.custom_quote_items (quote_id, extra_code, quantity, unit_price) values ((select id from q), 'geo', 1, 1)$q$) like '42501 %',
            'a line with an unknown extra fails (FK / unknown_extra); the price of a line is not hers to set');
select t.ok(t.err($q$insert into public.custom_quote_items (quote_id, extra_code, quantity) values ((select id from q), 'geo', 2)$q$) is null
            and t.val($q$select unit_price::text || ':' || line_total::text || ':' || (label ->> 'es') from public.custom_quote_items where quote_id = (select id from q) and extra_code = 'geo'$q$) = '300.00:600.00:GEO'
            and t.val('select subtotal::text from public.custom_quotes where id = (select id from q)') = '1788.00',
            'a direct insert also snapshots name and price from the extra and the subtotal follows');
select t.ok(t.err($q$select public.quote_set_quantity((select id from public.custom_quote_items where quote_id = (select id from q) and extra_code = 'geo'), 1)$q$) is null
            and t.err($q$select public.quote_remove_item((select id from public.custom_quote_items where quote_id = (select id from q) and extra_code = 'geo'))$q$) is null
            and t.val('select subtotal::text from public.custom_quotes where id = (select id from q)') = '1188.00'
            and t.err($q$select public.quote_set_quantity((select id from public.custom_quote_items limit 1), 0)$q$) = '22023 invalid_quantity',
            'quantity and removal of lines recalculate the subtotal');
reset role;
set local role authenticated;
set local request.jwt.claims = :'jose';
select t.ok(t.err($q$select public.admin_quote_set_discount((select id from q), 100, 'amigo')$q$) is null
            and t.val('select total::text || '':'' || discount_amount::text || '':'' || discount_note from public.custom_quotes where id = (select id from q)') = '1088.00:100.00:amigo'
            and t.err($q$select public.admin_quote_set_discount((select id from q), 5000, null)$q$) = '22023 invalid_discount',
            'the admin sets the discount: total 1.088; more than the subtotal is refused');
select t.ok(t.err($q$select public.admin_pricing_set_extra('{"code":"seo_full","price":650}')$q$) is null
            and t.val($q$select unit_price::text from public.custom_quote_items where quote_id = (select id from q) and extra_code = 'seo_full'$q$) = '600.00'
            and t.val('select total::text from public.custom_quotes where id = (select id from q)') = '1088.00',
            'the price of a line does not change when the admin changes the price of the extra (snapshot per line)');
set local request.jwt.claims = :'carla';
select t.ok(t.err($q$select public.quote_mark_sent((select id from q))$q$) is null
            and t.val('select status::text from public.custom_quotes where id = (select id from q)') = 'sent'
            and t.err($q$select public.quote_add_item((select id from q), 'geo', 1)$q$) = '22023 quote_not_draft'
            and t.err($q$select public.quote_mark_sent((select id from q))$q$) = '22023 quote_not_draft',
            'carla marks the quote as sent; a sent quote is frozen');
select t.ok(t.err($q$select public.quote_decide((select id from q), 'draft')$q$) = '22023 invalid_transition'
            and t.err($q$select public.quote_decide((select id from q), 'accepted')$q$) is null
            and t.val('select status::text || '':'' || (decided_at is not null)::text from public.custom_quotes where id = (select id from q)') = 'accepted:true'
            and t.err($q$select public.quote_decide((select id from q), 'rejected')$q$) = '22023 invalid_transition',
            'a sent quote is accepted once (sent -> accepted/rejected/expired)');
select t.ok(t.err($q$select public.quote_mark_sent(public.quote_create('00000000-0000-4000-8000-000000000211', 'vacio'))$q$) = '22023 quote_without_items',
            'a quote without lines cannot be sent');
reset role;
select t.ok((select count(*) from private.outbox where event = 'quote.sent' and (payload ->> 'total')::numeric = 1088 and payload ->> 'owner_id' = '00000000-0000-4000-8000-0000000000a5') = 1
            and (select count(*) from public.crm_interactions where kind = 'message_sent' and payload ->> 'quote_id' = (select id::text from q)) = 1,
            'outbox quote.sent (total 1.088, owner carla) and a message_sent interaction');
-- Jose's quote is not carla's.
insert into public.custom_quotes (id, contact_id, title) values ('00000000-0000-4000-8000-000000001202', '00000000-0000-4000-8000-000000000204', 'De Jose');
set local role authenticated;
set local request.jwt.claims = :'carla';
select t.ok(t.n($q$select id from public.custom_quotes where contact_id = '00000000-0000-4000-8000-000000000204'$q$) = 0
            and t.n($q$select id from public.custom_quote_items where quote_id = '00000000-0000-4000-8000-000000001202'$q$) = 0
            and t.err($q$select public.quote_add_item('00000000-0000-4000-8000-000000001202', 'geo', 1)$q$) = '42501 forbidden',
            'carla sees no quote or line of a contact of Jose and cannot add to it');
set local request.jwt.claims = :'jose';
select t.ok(t.n('select id from public.custom_quotes') = 3 and t.err($q$delete from public.custom_quotes where id = (select id from q)$q$) is null
            and t.n('select id from public.custom_quotes') = 3,
            'the admin deletes only drafts (the accepted quote stays)');
select t.ok(t.affected($q$delete from public.custom_quotes where id = '00000000-0000-4000-8000-000000001202'$q$) = 1,
            'the admin deletes a draft quote');
rollback;

-- ================================================================ security-review additions (comment.client, assets)
begin;
set local role authenticated;
set local request.jwt.claims = :'ana';
select t.ok(t.affected($q$insert into public.client_task_comments (client_id, task_id, author_user_id, body) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-0000000000a2', 'primero')$q$) = 1
            and t.affected($q$insert into public.client_task_comments (client_id, task_id, author_user_id, body) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-0000000000a2', 'segundo')$q$) = 1,
            'ana comments twice on the same task');
reset role;
select t.ok((select count(*) from private.outbox where event = 'comment.client') = 1
            and (select payload ->> 'task_id' from private.outbox where event = 'comment.client') = '00000000-0000-4000-8000-000000000502'
            and (select payload ->> 'owner_id' from private.outbox where event = 'comment.client') is null,
            'comment.client is queued once per task while the first one waits in the outbox (batched)');
update private.outbox set delivered_at = now() where event = 'comment.client';
set local role authenticated;
set local request.jwt.claims = :'ana';
insert into public.client_task_comments (client_id, task_id, author_user_id, body) values ('00000000-0000-4000-8000-000000000401', null, '00000000-0000-4000-8000-0000000000a2', 'general');
insert into public.client_task_comments (client_id, task_id, author_user_id, body) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-0000000000a2', 'tercero');
reset role;
select t.ok((select count(*) from private.outbox where event = 'comment.client') = 3,
            'after delivery a new comment queues again; a comment with no task is its own notice');
set local role authenticated;
set local request.jwt.claims = :'jose';
insert into public.client_task_comments (client_id, task_id, author_user_id, body) values ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-0000000000a1', 'respuesta');
reset role;
select t.ok((select count(*) from private.outbox where event = 'comment.client') = 3,
            'the admin answering does not queue comment.client');

-- client_assets: the row alone no longer announces an upload; the object in storage does.
set local role authenticated;
set local request.jwt.claims = :'ana';
create temp table asset_ids (id uuid);
grant all on asset_ids to authenticated;
insert into asset_ids select gen_random_uuid();
select t.ok(t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name, mime_type, size_bytes)
                     select id, '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'client', 'clients/00000000-0000-4000-8000-000000000401/' || id, 'logo.png', 'image/png', 1000 from asset_ids$q$) is null,
            'ana registers an upload (row first, file after)');
select t.ok(t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name, mime_type, size_bytes)
                     values ('00000000-0000-4000-8000-0000000000d1', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'client', 'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-0000000000d1', 'x.exe', 'application/x-msdownload', 10)$q$) like '23514 %client_assets_mime_allowed%'
            and t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name, mime_type, size_bytes)
                     values ('00000000-0000-4000-8000-0000000000d2', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'client', 'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-0000000000d2', 'big.zip', 'application/zip', 26214401)$q$) like '23514 %client_assets_size_max%'
            and t.err($q$insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name, mime_type, size_bytes)
                     values ('00000000-0000-4000-8000-0000000000d3', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'client', 'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-0000000000d3', 'ok.zip', 'application/zip', 26214400)$q$) is null,
            'client_assets: a MIME type outside the bucket allowlist and a size over 25 MiB are refused; 25 MiB is fine');
reset role;
select t.ok((select count(*) from private.outbox where event = 'asset.uploaded') = 0,
            'a client_assets row alone enqueues no asset.uploaded');
insert into storage.objects (bucket_id, name) select 'client-assets', 'clients/00000000-0000-4000-8000-000000000401/' || id from asset_ids;
insert into storage.objects (bucket_id, name) values ('client-assets', 'clients/00000000-0000-4000-8000-000000000401/00000000-0000-4000-8000-0000000000aa');
insert into storage.buckets (id, name) values ('other-bucket', 'other-bucket');
insert into storage.objects (bucket_id, name) select 'other-bucket', 'clients/00000000-0000-4000-8000-000000000401/' || id from asset_ids;
select t.ok((select count(*) from private.outbox where event = 'asset.uploaded') = 1
            and (select payload ->> 'client_id' from private.outbox where event = 'asset.uploaded') = '00000000-0000-4000-8000-000000000401'
            and (select payload ->> 'file_name' from private.outbox where event = 'asset.uploaded') = 'logo.png',
            'asset.uploaded is queued when the object lands in the client-assets bucket and matches a client row');
set local role authenticated;
set local request.jwt.claims = :'ana';
do $$
declare
  i integer;
  ok integer := 0;
  failed text;
begin
  for i in 1..60 loop
    begin
      insert into public.client_assets (id, client_id, uploaded_by_user_id, source, storage_path, file_name, mime_type, size_bytes)
      select g, '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2', 'client', 'clients/00000000-0000-4000-8000-000000000401/' || g, 'f' || i, 'text/plain', 10 from (select gen_random_uuid() g) x;
      ok := ok + 1;
    exception when others then
      failed := sqlstate;
    end;
  end loop;
  perform t.ok(ok = 48 and failed = '54000', 'client_assets: the daily quota of 50 uploads per client stops the 51st (54000)');
end $$;
set local request.jwt.claims = :'jose';
select t.ok(t.affected($q$insert into public.client_assets (id, client_id, source, storage_path, file_name, mime_type, size_bytes, uploaded_by_user_id)
                          select g, '00000000-0000-4000-8000-000000000401', 'admin', 'clients/00000000-0000-4000-8000-000000000401/' || g, 'admin.pdf', 'application/pdf', 10, '00000000-0000-4000-8000-0000000000a1' from (select gen_random_uuid() g) x$q$) = 1,
            'the admin is exempt from the upload quota');
rollback;
