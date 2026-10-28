-- Task 1.8 (DT §0b, finding 31). One query for the admin Resumen counters, admin only.
-- Chat unread and Radar counters arrive additively with 1.11 and phase 7 (their tables do not exist yet).
create or replace function public.admin_counters()
returns table (leads_new bigint, comments_pending bigint, upgrades_pending bigint, rewards_pending bigint)
language plpgsql security definer set search_path = public, pg_temp stable as $$
begin
  if private.staff_role_of((select auth.uid())) is distinct from 'admin' then raise exception 'forbidden'; end if;
  return query select
    (select count(*) from public.leads where estado = 'nuevo'),
    (select count(*) from public.blog_comments where status = 'pending'),
    (select count(*) from public.upgrade_requests where status = 'pending'),
    (select count(*) from public.affiliate_rewards where status = 'pending');
end $$;
revoke all on function public.admin_counters() from public, anon;
grant execute on function public.admin_counters() to authenticated;
