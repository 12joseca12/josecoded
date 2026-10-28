-- Task 1.6 (plan v3.2; DATOS v1.1 §2, §3, §4.1, §4.2, §4.7, §6). Migration 0 of the new project: schemas, extensions,
-- default privileges, helpers, identity, price catalogue, quotas, scheduled jobs and the outbox.
-- Rules for every later migration (DATOS §2, enforced by supabase/test/migrations.test.ts and supabase/test/pg/):
--   * explicit grants per table/function (P1); RLS on every public table, one policy per role and action (P2);
--   * policies call (select auth.uid()) / (select private.is_admin()) (P3);
--   * security definer only with set search_path = '' and revoke from public, anon, authenticated (P5);
--   * no HTTP out of Postgres: side effects go through private.outbox, drained by the gateway (P9).

-- 1) Extensions (pgcrypto ships with Supabase in `extensions`).
create extension if not exists citext with schema extensions;
create extension if not exists unaccent with schema extensions;

-- 2) private: helpers, counters, jobs and outbox. Not exposed by PostgREST ([api] schemas = ["public"]).
--    authenticated needs usage so policies can call the helpers; service_role so the RPCs resolve.
create schema private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated, service_role;

-- 3) P1: nothing created by postgres in public is reachable by anon/authenticated without an explicit grant.
--    service_role keeps the platform defaults (it bypasses RLS and is only used by the gateway).
alter default privileges for role postgres in schema public revoke all on tables from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on sequences from anon, authenticated;
alter default privileges for role postgres in schema public revoke all on functions from anon, authenticated;

-- 4) Enums (DATOS §4.1). Adding a value = `alter type … add value` in its own migration (P6).
create type public.staff_role as enum ('admin');
create type public.locale as enum ('es', 'en');
create type public.audience_signal as enum (
  'client', 'partner', 'recruiter', 'curious', 'referral', 'business', 'company', 'blog', 'neutral'
);

-- 5) Generic helpers.
create or replace function private.set_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.updated_at = now();
  return new;
end $$;
revoke all on function private.set_updated_at() from public, anon, authenticated;

-- 6) Identity (DATOS §4.1).
create table public.staff_members (
  user_id          uuid primary key references auth.users (id) on delete cascade,
  role             public.staff_role not null default 'admin',
  display_name     text,
  telegram_chat_id text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
alter table public.staff_members enable row level security;
create trigger staff_members_set_updated_at before update on public.staff_members
  for each row execute function private.set_updated_at();
-- No write policies: rows are inserted by the seed locally and by the controller in the gate (Jose's user id).
create policy staff_members_select_own on public.staff_members for select to authenticated
  using (user_id = (select auth.uid()));
grant select on public.staff_members to authenticated;

create or replace function private.is_admin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.staff_members s
                 where s.user_id = (select auth.uid()) and s.role = 'admin');
$$;
revoke all on function private.is_admin() from public, anon, authenticated;
grant execute on function private.is_admin() to authenticated;

-- D35: RPCs of the area refuse users whose email is not confirmed. Called from security definer RPCs only.
create or replace function private.assert_email_confirmed() returns void
language plpgsql stable security definer set search_path = '' as $$
begin
  if (select u.email_confirmed_at from auth.users u where u.id = (select auth.uid())) is null then
    raise exception 'email_not_confirmed' using errcode = '42501';
  end if;
end $$;
revoke all on function private.assert_email_confirmed() from public, anon, authenticated;

create table public.user_profiles (
  user_id               uuid primary key references auth.users (id) on delete cascade,
  display_name          text,
  locale                public.locale not null default 'es',
  first_audience        public.audience_signal,
  first_audience_source text check (first_audience_source in ('ref', 'origin')),
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.user_profiles enable row level security;
create trigger user_profiles_set_updated_at before update on public.user_profiles
  for each row execute function private.set_updated_at();
-- One select policy (own row or admin) to avoid multiple permissive policies; no insert: handle_new_user() creates it.
create policy user_profiles_select on public.user_profiles for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy user_profiles_update_own on public.user_profiles for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
grant select on public.user_profiles to authenticated;
grant update (display_name, locale, first_audience, first_audience_source) on public.user_profiles to authenticated;

-- first_audience is write-once (recycled from 20260929100000_user_profiles.sql).
create or replace function private.user_profiles_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if old.first_audience is not null and new.first_audience is distinct from old.first_audience then
    raise exception 'first_audience is write-once' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function private.user_profiles_guard() from public, anon, authenticated;
create trigger user_profiles_guard before update on public.user_profiles
  for each row execute function private.user_profiles_guard();

-- Profile row at sign-up. raw_user_meta_data is only read here, never used as a store (P10).
create or replace function private.handle_new_user() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles (user_id, display_name, locale)
  values (
    new.id,
    nullif(btrim(coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name', '')), ''),
    case when new.raw_user_meta_data ->> 'locale' in ('es', 'en')
         then (new.raw_user_meta_data ->> 'locale')::public.locale else 'es'::public.locale end
  )
  on conflict (user_id) do nothing;
  return new;
end $$;
revoke all on function private.handle_new_user() from public, anon, authenticated;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function private.handle_new_user();

-- 7) Price catalogue (DATOS §4.2). Synced from pricing.json by `pnpm pricing:sync-db`; names live in messages/*.json.
--    anon reads nothing: the public site reads pricing.json.
create table public.packs (
  code            text primary key check (code ~ '^P[1-9]$'),
  slug            text unique,
  price           integer not null,
  weeks           smallint,
  sort            smallint,
  active          boolean not null default true,
  pricing_version text not null,
  updated_at      timestamptz not null default now()
);
alter table public.packs enable row level security;
create trigger packs_set_updated_at before update on public.packs
  for each row execute function private.set_updated_at();
create policy packs_select on public.packs for select to authenticated using (true);
grant select on public.packs to authenticated;

-- The primary key (pack_code, code) also serves the pack_code foreign key (P4).
create table public.pack_options (
  pack_code       text not null references public.packs (code) on delete cascade,
  code            text not null,
  price           integer not null,
  pricing_version text not null,
  primary key (pack_code, code)
);
alter table public.pack_options enable row level security;
create policy pack_options_select on public.pack_options for select to authenticated using (true);
grant select on public.pack_options to authenticated;

create table public.extras (
  code            text primary key,
  price           integer not null,
  active          boolean not null default true,
  pricing_version text not null,
  updated_at      timestamptz not null default now()
);
alter table public.extras enable row level security;
create trigger extras_set_updated_at before update on public.extras
  for each row execute function private.set_updated_at();
create policy extras_select on public.extras for select to authenticated using (true);
grant select on public.extras to authenticated;

-- 8) Atomic quotas (recycled from 20260930100000_quota_counters.sql; search_path now '' per P5).
--    Callers: the gateway with the secret key (proposals per IP and global, chat per IP).
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
returns boolean language plpgsql security definer set search_path = '' as $$
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

-- 9) Scheduled jobs (recycled from 20260930100100_scheduled_jobs.sql). Table behind the single `*/5 * * * *` Cron
--    Trigger of the gateway: apps/api/src/scheduled.ts runs the due rows in order and within a subrequest budget; what
--    does not fit waits for the next tick. Rows start due (next_run_at = now()): the dispatcher computes the next run
--    after each execution, and jobs without a registered handler are left untouched. Handlers must be idempotent.
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

-- Launch rows (plan 1.6, DATOS §4.7). Radar (7.6) and newsletter (10.1) add theirs; leads.notify_retry is gone (outbox).
insert into private.scheduled_jobs (name, cron, tz) values
  ('outbox.drain',          '*/5 * * * *',  null),
  ('chat.notify_digest',    '*/10 * * * *', null),
  ('chat.purge_anonymous',  '0 4 * * *',    null),
  ('crm.due_digest',        '0 8 * * 1-5',  'Europe/Madrid');

-- Port of the gateway adapter (ScheduledJobsRepo): PostgREST does not expose `private`, so the service role goes through these.
create or replace function public.scheduled_jobs_due(p_now timestamptz)
returns table (name text, cron text, tz text, next_run_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select j.name, j.cron, j.tz, j.next_run_at from private.scheduled_jobs j
  where j.enabled and j.next_run_at <= p_now
  order by j.next_run_at, j.name
$$;
create or replace function public.scheduled_jobs_mark_ran(p_name text, p_ran_at timestamptz, p_next_run_at timestamptz)
returns void language sql security definer set search_path = '' as $$
  update private.scheduled_jobs set last_run_at = p_ran_at, next_run_at = p_next_run_at where name = p_name
$$;
-- Used when cron or tz cannot produce a next run (typo in a row): stops the retry every tick; re-enable by hand.
create or replace function public.scheduled_jobs_disable(p_name text, p_reason text)
returns void language sql security definer set search_path = '' as $$
  update private.scheduled_jobs set enabled = false, disabled_reason = p_reason where name = p_name
$$;
revoke all on function public.scheduled_jobs_due(timestamptz) from public, anon, authenticated;
revoke all on function public.scheduled_jobs_mark_ran(text, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function public.scheduled_jobs_disable(text, text) from public, anon, authenticated;
grant execute on function public.scheduled_jobs_due(timestamptz) to service_role;
grant execute on function public.scheduled_jobs_mark_ran(text, timestamptz, timestamptz) to service_role;
grant execute on function public.scheduled_jobs_disable(text, text) to service_role;

-- 10) Outbox (DATOS §4.7, §8.4). Triggers and RPCs write with private.enqueue(); the gateway's outbox.drain job claims,
--     delivers (Telegram / Resend) and acks or fails. Events: lead.created, comment.pending, asset.uploaded,
--     upgrade.requested, chat.visitor_message, system.*.
create table private.outbox (
  id           bigserial primary key,
  event        text not null,
  payload      jsonb not null,
  created_at   timestamptz not null default now(),
  claimed_at   timestamptz,
  claimed_by   text,
  attempts     smallint not null default 0,
  delivered_at timestamptz,
  last_error   text
);
alter table private.outbox enable row level security;  -- no policies: only enqueue() and the RPCs below touch it
create index idx_outbox_pending on private.outbox (created_at) where delivered_at is null;

-- Writes one event for the gateway's outbox.drain job. Only called from triggers and RPCs that are themselves
-- security definer (owned by postgres): no role has execute on it.
create or replace function private.enqueue(p_event text, p_payload jsonb) returns bigint
language sql set search_path = '' as $$
  insert into private.outbox (event, payload) values (p_event, coalesce(p_payload, '{}'::jsonb)) returning id
$$;
revoke all on function private.enqueue(text, jsonb) from public, anon, authenticated;

-- Claims up to p_limit (1..200) undelivered events with fewer than 10 attempts. A claim older than 10 minutes counts as
-- abandoned (worker died mid-batch) and is claimable again. Concurrent drains never get the same row (skip locked).
create or replace function public.outbox_claim(p_limit integer, p_worker text)
returns table (id bigint, event text, payload jsonb, attempts smallint, created_at timestamptz)
language sql security definer set search_path = '' as $$
  update private.outbox o set claimed_at = now(), claimed_by = p_worker
  where o.id in (
    select c.id from private.outbox c
    where c.delivered_at is null and c.attempts < 10
      and (c.claimed_at is null or c.claimed_at < now() - interval '10 minutes')
    order by c.created_at, c.id
    limit least(greatest(coalesce(p_limit, 50), 1), 200)
    for update skip locked
  )
  returning o.id, o.event, o.payload, o.attempts, o.created_at
$$;

-- Marks delivered events; returns how many changed (already delivered ids are ignored).
create or replace function public.outbox_ack(p_ids bigint[])
returns integer language plpgsql security definer set search_path = '' as $$
declare v_count integer;
begin
  update private.outbox set delivered_at = now()
  where id = any (p_ids) and delivered_at is null;
  get diagnostics v_count = row_count;
  return v_count;
end $$;

-- Records a failed delivery and releases the claim. On the 10th attempt the event is dead: a system.outbox_dead event
-- is enqueued so the next drain tells Jose (a dead system.outbox_dead does not spawn another one).
create or replace function public.outbox_fail(p_id bigint, p_error text)
returns void language plpgsql security definer set search_path = '' as $$
declare
  v_attempts smallint;
  v_event    text;
begin
  update private.outbox
     set attempts = attempts + 1, last_error = left(p_error, 2000), claimed_at = null, claimed_by = null
   where id = p_id and delivered_at is null
  returning attempts, event into v_attempts, v_event;
  if v_attempts >= 10 and v_event <> 'system.outbox_dead' then
    perform private.enqueue('system.outbox_dead',
      jsonb_build_object('id', p_id, 'event', v_event, 'last_error', left(p_error, 500)));
  end if;
end $$;
revoke all on function public.outbox_claim(integer, text) from public, anon, authenticated;
revoke all on function public.outbox_ack(bigint[]) from public, anon, authenticated;
revoke all on function public.outbox_fail(bigint, text) from public, anon, authenticated;
grant execute on function public.outbox_claim(integer, text) to service_role;
grant execute on function public.outbox_ack(bigint[]) to service_role;
grant execute on function public.outbox_fail(bigint, text) to service_role;

-- 11) Health for supabase-ping.yml (DATOS §11): outbox backlog and disabled jobs. Service role only.
create or replace function public.system_health()
returns jsonb language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'outbox_pending', (select count(*) from private.outbox o where o.delivered_at is null),
    'outbox_overdue', (select count(*) from private.outbox o
                       where o.delivered_at is null and o.created_at < now() - interval '1 hour'),
    'outbox_dead',    (select count(*) from private.outbox o where o.delivered_at is null and o.attempts >= 10),
    'jobs_disabled',  (select coalesce(jsonb_agg(j.name order by j.name), '[]'::jsonb)
                       from private.scheduled_jobs j where not j.enabled),
    'checked_at',     now()
  )
$$;
revoke all on function public.system_health() from public, anon, authenticated;
grant execute on function public.system_health() to service_role;
