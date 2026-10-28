-- Task 1.8 (DT §0b, plan v2.1). Atomic daily quotas in Postgres instead of KV (KV is not atomic).
-- Callers: the gateway with the service role (proposals per IP and global, chat per user).
create table private.quota_counters (
  key        text primary key,
  count      integer not null default 0,
  expires_at timestamptz not null
);
alter table private.quota_counters enable row level security;  -- no policies: only the definer function touches it
create index idx_quota_counters_expires on private.quota_counters (expires_at);

-- Counts one use of p_key. Returns true while the count stays within p_limit. A key whose window expired starts again at 1.
-- Rejected calls keep counting (the window just stays over its limit until it expires).
create or replace function public.increment_quota(p_key text, p_limit integer, p_ttl interval)
returns boolean language plpgsql security definer set search_path = private, pg_temp as $$
declare v_count integer;
begin
  insert into private.quota_counters as q (key, count, expires_at)
    values (p_key, 1, now() + p_ttl)
  on conflict (key) do update set
    count = case when q.expires_at <= now() then 1 else q.count + 1 end,
    expires_at = case when q.expires_at <= now() then now() + p_ttl else q.expires_at end
  returning q.count into v_count;
  return v_count <= p_limit;
end $$;
revoke all on function public.increment_quota(text, integer, interval) from public, anon, authenticated;
grant execute on function public.increment_quota(text, integer, interval) to service_role;
