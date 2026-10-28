-- Task 1.8 (DT §0b, plan v2.1). Table behind the single `*/5 * * * *` Cron Trigger of the gateway: apps/api/src/scheduled.ts
-- runs the due rows in order and within a subrequest budget; what does not fit waits for the next tick.
-- Rows start due (next_run_at = now()): the dispatcher computes the next run after each execution, and jobs without a
-- registered handler are left untouched. Handlers must be idempotent (e.g. the newsletter ones check "already sent").
create table private.scheduled_jobs (
  name            text primary key,
  cron            text not null,          -- 5 fields, evaluated in tz
  tz              text,                   -- IANA; UTC when null
  last_run_at     timestamptz,
  next_run_at     timestamptz not null default now(),
  enabled         boolean not null default true,
  disabled_reason text
);
alter table private.scheduled_jobs enable row level security;  -- no policies: only the functions below touch it
create index idx_scheduled_jobs_due on private.scheduled_jobs (next_run_at, name) where enabled;

-- DT §0b. radar.mail is hourly (absorbs the calendar read) and radar.daily is a single job at 08:00 Madrid.
-- The newsletter hours are provisional: the owning task of phase 10 adjusts them.
insert into private.scheduled_jobs (name, cron, tz) values
  ('radar.sweep',         '*/5 * * * *', null),
  ('radar.mail',          '0 * * * *',   null),
  ('radar.daily',         '0 8 * * *',   'Europe/Madrid'),
  ('newsletter.monday',   '0 8 * * 1',   'Europe/Madrid'),
  ('newsletter.thursday', '0 8 * * 4',   'Europe/Madrid'),
  ('newsletter.sunday',   '0 8 * * 0',   'Europe/Madrid'),
  ('newsletter.feeds',    '0 */6 * * *', null),
  ('newsletter.sweep',    '*/5 * * * *', null),
  ('newsletter.stats',    '0 5 * * *',   null),
  ('leads.notify_retry',  '*/5 * * * *', null),
  ('brevo.stats',         '0 6 * * *',   null);

-- Port of the gateway adapter (ScheduledJobsRepo): PostgREST does not expose `private`, so the service role goes through these.
create or replace function public.scheduled_jobs_due(p_now timestamptz)
returns table (name text, cron text, tz text, next_run_at timestamptz)
language sql security definer set search_path = private, pg_temp stable as $$
  select j.name, j.cron, j.tz, j.next_run_at from private.scheduled_jobs j
  where j.enabled and j.next_run_at <= p_now
  order by j.next_run_at, j.name
$$;
create or replace function public.scheduled_jobs_mark_ran(p_name text, p_ran_at timestamptz, p_next_run_at timestamptz)
returns void language sql security definer set search_path = private, pg_temp as $$
  update private.scheduled_jobs set last_run_at = p_ran_at, next_run_at = p_next_run_at where name = p_name
$$;
-- Used when cron or tz cannot produce a next run (typo in a row): stops the retry every tick; re-enable by hand.
create or replace function public.scheduled_jobs_disable(p_name text, p_reason text)
returns void language sql security definer set search_path = private, pg_temp as $$
  update private.scheduled_jobs set enabled = false, disabled_reason = p_reason where name = p_name
$$;
revoke all on function public.scheduled_jobs_due(timestamptz) from public, anon, authenticated;
revoke all on function public.scheduled_jobs_mark_ran(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.scheduled_jobs_disable(text, text) from public, anon, authenticated;
grant execute on function public.scheduled_jobs_due(timestamptz) to service_role;
grant execute on function public.scheduled_jobs_mark_ran(text, timestamptz, timestamptz) to service_role;
grant execute on function public.scheduled_jobs_disable(text, text) to service_role;
