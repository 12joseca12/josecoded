begin;

select plan(18);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind in ('r', 'p')
      and not c.relrowsecurity
  $$,
  'row level security is enabled on every table in public and private'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind in ('v', 'm')
      and not (coalesce(c.reloptions, '{}') && array['security_invoker=true', 'security_invoker=on'])
  $$,
  'every view in public is security invoker'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and not exists (
        select 1 from unnest(coalesce(p.proconfig, '{}')) cfg where cfg like 'search_path=%'
      )
  $$,
  'every function in public and private has a fixed search_path'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and p.prosecdef
      and not ('search_path=""' = any(coalesce(p.proconfig, '{}')))
  $$,
  'every security definer function pins an empty search_path'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname in ('public', 'private')
      and not exists (select 1 from pg_depend d where d.objid = p.oid and d.deptype = 'e')
      and exists (
        select 1
        from aclexplode(coalesce(p.proacl, acldefault('f', p.proowner))) a
        where a.grantee = 0 and a.privilege_type = 'EXECUTE'
      )
  $$,
  'no function in public or private is executable by PUBLIC'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('authenticated', p.oid, 'execute')
      and p.proname not in (
        'accept_invitation',
        'add_member',
        'admin_audit_log',
        'admin_counters',
        'admin_jobs',
        'admin_users',
        'approve_commission_lines',
        'archive_conversation',
        'archive_project',
        'assign_lead',
        'build_payout',
        'cancel_job',
        'cancel_recurring',
        'cancel_schedule_item',
        'claim_lead',
        'complete_my_task',
        'confirm_story',
        'create_project',
        'deal_payments',
        'decide_story',
        'delete_document',
        'delete_payout_draft',
        'delete_task',
        'discard_lead',
        'ensure_my_conversation',
        'ensure_project_conversation',
        'invite_user',
        'issue_proforma',
        'list_lead_inbox',
        'list_room_members',
        'log_totp_reset',
        'mark_notifications_read',
        'mark_read',
        'move_task',
        'omen_status',
        'reassign_portfolio',
        'record_invoice',
        'record_payment',
        'reject_commission_line',
        'remove_member',
        'renew_invitation',
        'reorder_project_links',
        'retry_job',
        'revoke_invitation',
        'send_test_notification',
        'set_ai_consent',
        'set_conversation_ai',
        'set_notification_pref',
        'set_payment_schedule',
        'set_payout_invoice',
        'set_payout_status',
        'set_project_client',
        'set_project_freelance',
        'set_project_phase',
        'set_setting',
        'set_user_active',
        'set_user_rates',
        'telegram_link_code',
        'telegram_link_status',
        'telegram_unlink',
        'touch_lead',
        'update_my_profile',
        'upsert_task',
        'void_invoice',
        'win_deal'
      )
  $$,
  'only the allowed security definer RPCs are callable from the API'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('anon', p.oid, 'execute')
  $$,
  'no function in public is callable by anon'
);

select is_empty(
  $$
    select c.conrelid::regclass::text || '.' || c.conname
    from pg_constraint c
    join pg_namespace n on n.oid = c.connamespace
    where c.contype = 'f'
      and n.nspname in ('public', 'private')
      and not exists (
        select 1
        from pg_index i
        where i.indrelid = c.conrelid
          and i.indisvalid
          and (string_to_array(i.indkey::text, ' ')::int2[])[1:cardinality(c.conkey)] @> c.conkey
      )
  $$,
  'every foreign key is covered by an index'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || '.' || policyname
    from pg_policies
    where schemaname in ('public', 'private')
      and ('anon' = any(roles) or 'public' = any(roles))
  $$,
  'no policy targets anon or public'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || ' ' || cmd
    from pg_policies
    where schemaname = 'public'
      and permissive = 'PERMISSIVE'
    group by schemaname, tablename, cmd
    having count(*) > 1
  $$,
  'no table has multiple permissive policies for the same action'
);

select is_empty(
  $$
    select schemaname || '.' || tablename || '.' || policyname
    from pg_policies
    where schemaname = 'public'
      and (
        coalesce(qual, '') ~ '(?<!SELECT )(private\.(uid|role|is_admin|is_staff|is_closer|is_aal2)\(\)|auth\.(uid|jwt|role)\(\))'
        or coalesce(with_check, '') ~ '(?<!SELECT )(private\.(uid|role|is_admin|is_staff|is_closer|is_aal2)\(\)|auth\.(uid|jwt|role)\(\))'
      )
  $$,
  'policies wrap auth helpers in a select so they are evaluated once per statement'
);

select is_empty(
  $$
    select c.oid::regclass::text
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname in ('public', 'private')
      and c.relkind = 'r'
      and has_table_privilege('authenticated', c.oid, 'select')
      and not exists (select 1 from pg_policy pol where pol.polrelid = c.oid and pol.polcmd in ('r', '*'))
  $$,
  'every table readable by authenticated has a select policy'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and has_function_privilege('authenticated', p.oid, 'execute')
      and p.proname not in (
        'accept_invitation',
        'add_member',
        'admin_audit_log',
        'admin_counters',
        'admin_jobs',
        'admin_users',
        'approve_commission_lines',
        'archive_conversation',
        'archive_project',
        'assign_lead',
        'build_payout',
        'cancel_job',
        'cancel_recurring',
        'cancel_schedule_item',
        'claim_lead',
        'complete_my_task',
        'confirm_story',
        'create_project',
        'crm_counters',
        'deal_payments',
        'decide_story',
        'delete_document',
        'delete_payout_draft',
        'delete_task',
        'discard_lead',
        'ensure_my_conversation',
        'ensure_project_conversation',
        'invite_user',
        'issue_proforma',
        'list_lead_inbox',
        'list_room_members',
        'log_totp_reset',
        'mark_notifications_read',
        'mark_read',
        'move_task',
        'omen_status',
        'reassign_portfolio',
        'record_invoice',
        'record_payment',
        'reject_commission_line',
        'remove_member',
        'renew_invitation',
        'reorder_project_links',
        'retry_job',
        'revoke_invitation',
        'send_test_notification',
        'set_ai_consent',
        'set_conversation_ai',
        'set_notification_pref',
        'set_payment_schedule',
        'set_payout_invoice',
        'set_payout_status',
        'set_project_client',
        'set_project_freelance',
        'set_project_phase',
        'set_setting',
        'set_user_active',
        'set_user_rates',
        'telegram_link_code',
        'telegram_link_status',
        'telegram_unlink',
        'touch_lead',
        'update_my_profile',
        'upsert_task',
        'void_invoice',
        'win_deal'
      )
  $$,
  'only the profile and lead RPCs are callable by authenticated in public'
);

select is(
  (
    select string_agg(p.proname::text, ',' order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('service_role', p.oid, 'execute')
      and not has_function_privilege('authenticated', p.oid, 'execute')
      and not has_function_privilege('anon', p.oid, 'execute')
  ),
  'omen_claim_jobs,omen_conversation_context,omen_finish_job,omen_heartbeat,omen_post_reply,outbox_claim,outbox_mark,payments_notify_overdue,read_invitation,read_public_settings,register_document,submit_lead,telegram_confirm_link,visitor_forget,visitor_handoff,visitor_send,visitor_thread',
  'only the lead intake, outbox, invitation read, Telegram link and Omen job functions are service_role-only in public'
);

select is(
  (
    select string_agg(p.proname::text, ',' order by p.proname)
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and has_function_privilege('authenticated', p.oid, 'execute')
  ),
  'ai_active,can_write_conversation,contact_has_history,conversation_topic_id,freelance_project_rows,is_aal2,is_admin,is_api_client_role,is_closer,is_conversation_member,is_project_member,is_staff,mask_excerpt,offer_answers_valid,owns_contact,owns_lead,role,slug_list_valid,uid',
  'only the policy helpers and the two constraint helpers in private are executable by authenticated (decision 9.6)'
);

select is_empty(
  $$
    select p.oid::regprocedure::text
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and has_function_privilege('service_role', p.oid, 'execute')
  $$,
  'service_role cannot execute anything in private'
);

create function public.zz_default_acl_probe() returns integer language sql as 'select 1';
create table public.zz_default_acl_probe_table (id integer);

select is_empty(
  $$
    select r.rolname
    from (values ('anon'), ('authenticated'), ('public')) as r (rolname)
    where has_function_privilege(r.rolname, 'public.zz_default_acl_probe()'::regprocedure, 'execute')
  $$,
  'a new function in public is not executable by anon, authenticated or PUBLIC by default'
);

select is_empty(
  $$
    select r.rolname
    from (values ('anon'), ('authenticated')) as r (rolname)
    where has_table_privilege(r.rolname, 'public.zz_default_acl_probe_table'::regclass, 'select,insert,update,delete')
  $$,
  'a new table in public is not accessible to anon or authenticated by default'
);

select * from finish();

rollback;
