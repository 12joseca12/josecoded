-- Task 1.8a (plan v3.2; DATOS v1.1 §6, §7 C1). One call for the seven counters of the admin summary, admin only.
-- chat_unread reads chat_threads, created in 1.8b (20261028100800_chat.sql): until then it is 0. The lookup is dynamic
-- so this function needs no redefinition when the table arrives.
create or replace function public.admin_counters() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare v_chat_unread bigint := 0;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if to_regclass('public.chat_threads') is not null then
    execute 'select count(*) from public.chat_threads t where t.unread_for_admin' into v_chat_unread;
  end if;
  return jsonb_build_object(
    'leads_open',       (select count(*) from public.leads l where l.status = 'open'),
    'contacts_due',     (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.next_action_at <= now()),
    'chat_unread',      v_chat_unread,
    'agencies_replied', (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.kind = 'agency' and c.status = 'replied'),
    'comments_pending', (select count(*) from public.blog_comments b where b.status = 'pending'),
    'upgrades_pending', (select count(*) from public.upgrade_requests u where u.status = 'pending'),
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending')
  );
end $$;
revoke all on function public.admin_counters() from public, anon, authenticated;
grant execute on function public.admin_counters() to authenticated;
