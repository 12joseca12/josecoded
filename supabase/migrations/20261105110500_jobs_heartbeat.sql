create type public.job_kind as enum (
  'chat.reply',
  'chat.summary',
  'rag.index',
  'radar.scan',
  'radar.score',
  'radar.draft',
  'radar.send',
  'account.delete',
  'notify.send'
);

create type public.job_status as enum ('queued', 'running', 'done', 'failed', 'cancelled');

create table private.jobs (
  id uuid primary key default gen_random_uuid(),
  kind public.job_kind not null,
  payload jsonb not null default '{}'::jsonb,
  status public.job_status not null default 'queued',
  attempts integer not null default 0,
  max_attempts integer not null default 3,
  run_after timestamptz not null default now(),
  locked_by text,
  locked_at timestamptz,
  result jsonb,
  error text,
  created_at timestamptz not null default now(),
  finished_at timestamptz,
  constraint jobs_payload_is_object check (jsonb_typeof(payload) = 'object'),
  constraint jobs_payload_size check (char_length(payload::text) <= 20000),
  constraint jobs_attempts_range check (attempts >= 0),
  constraint jobs_max_attempts_range check (max_attempts between 1 and 10),
  constraint jobs_locked_by_length check (char_length(locked_by) between 1 and 80),
  constraint jobs_error_length check (char_length(error) <= 4000)
);

create index jobs_claim_idx on private.jobs (run_after, created_at) where status = 'queued';
create index jobs_running_idx on private.jobs (locked_at) where status = 'running';
create index jobs_status_created_idx on private.jobs (status, created_at desc);

create table private.heartbeat (
  service text primary key,
  seen_at timestamptz not null default now(),
  version text,
  models jsonb not null default '[]'::jsonb,
  constraint heartbeat_service_length check (char_length(service) between 1 and 40),
  constraint heartbeat_version_length check (char_length(version) <= 64),
  constraint heartbeat_models_is_array check (jsonb_typeof(models) = 'array'),
  constraint heartbeat_models_size check (char_length(models::text) <= 4000)
);

alter table private.jobs enable row level security;
alter table private.heartbeat enable row level security;

revoke all on private.jobs from anon, authenticated;
revoke all on private.heartbeat from anon, authenticated;

create function private.enqueue_job(
  p_kind public.job_kind,
  p_payload jsonb default '{}'::jsonb,
  p_run_after timestamptz default now()
)
returns uuid
language sql
set search_path = ''
as $$
  insert into private.jobs (kind, payload, run_after)
  values (p_kind, coalesce(p_payload, '{}'::jsonb), coalesce(p_run_after, now()))
  returning id
$$;

create function private.claim_jobs(p_worker text, p_limit integer)
returns table (
  id uuid,
  kind public.job_kind,
  payload jsonb,
  attempts integer,
  max_attempts integer
)
language plpgsql
set search_path = ''
as $$
begin
  update private.jobs j
  set status = case when j.attempts >= j.max_attempts then 'failed'::public.job_status else 'queued'::public.job_status end,
      error = coalesce(j.error, 'lock_expired'),
      locked_by = null,
      locked_at = null,
      run_after = now(),
      finished_at = case when j.attempts >= j.max_attempts then now() end
  where j.status = 'running'
    and j.locked_at < now() - interval '15 minutes';

  return query
  with picked as (
    select q.id
    from private.jobs q
    where q.status = 'queued'
      and q.run_after <= now()
    order by q.run_after, q.created_at
    limit p_limit
    for update skip locked
  )
  update private.jobs j
  set status = 'running',
      attempts = j.attempts + 1,
      locked_by = p_worker,
      locked_at = now()
  from picked
  where j.id = picked.id
  returning j.id, j.kind, j.payload, j.attempts, j.max_attempts;
end;
$$;

create function private.finish_job(p_id uuid, p_result jsonb, p_error text)
returns public.job_status
language plpgsql
set search_path = ''
as $$
declare
  v_job private.jobs;
  v_status public.job_status;
begin
  select * into v_job from private.jobs where id = p_id and status = 'running' for update;

  if not found then
    raise exception 'job_not_running' using errcode = 'P0001';
  end if;

  if p_error is null then
    v_status := 'done';
  elsif v_job.attempts < v_job.max_attempts then
    v_status := 'queued';
  else
    v_status := 'failed';
  end if;

  update private.jobs
  set status = v_status,
      result = p_result,
      error = left(p_error, 4000),
      locked_by = null,
      locked_at = null,
      run_after = case
        when v_status = 'queued' then now() + make_interval(secs => 30 * power(2, v_job.attempts - 1))
        else run_after
      end,
      finished_at = case when v_status = 'queued' then null else now() end
  where id = p_id;

  return v_status;
end;
$$;

create function public.omen_claim_jobs(p_worker text, p_limit integer default 5)
returns table (
  id uuid,
  kind public.job_kind,
  payload jsonb,
  attempts integer,
  max_attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_worker is null or char_length(btrim(p_worker)) not between 1 and 80 then
    raise exception 'invalid_worker' using errcode = 'P0001';
  end if;

  if p_limit is null or p_limit not between 1 and 50 then
    raise exception 'invalid_limit' using errcode = 'P0001';
  end if;

  return query select * from private.claim_jobs(btrim(p_worker), p_limit);
end;
$$;

create function public.omen_finish_job(
  p_id uuid,
  p_result jsonb default null,
  p_error text default null
)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
begin
  return private.finish_job(p_id, p_result, p_error);
end;
$$;

create function public.omen_heartbeat(p_version text default null, p_models jsonb default '[]'::jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_version is not null and char_length(p_version) > 64 then
    raise exception 'invalid_version' using errcode = 'P0001';
  end if;

  if p_models is null or jsonb_typeof(p_models) <> 'array' or char_length(p_models::text) > 4000 then
    raise exception 'invalid_models' using errcode = 'P0001';
  end if;

  insert into private.heartbeat (service, seen_at, version, models)
  values ('omen', now(), p_version, p_models)
  on conflict (service) do update
  set seen_at = excluded.seen_at,
      version = excluded.version,
      models = excluded.models;
end;
$$;

create function public.omen_status()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_beat private.heartbeat;
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_beat from private.heartbeat where service = 'omen';

  return jsonb_build_object(
    'seen_at', v_beat.seen_at,
    'version', v_beat.version,
    'models', coalesce(v_beat.models, '[]'::jsonb),
    'queued', (select count(*) from private.jobs where status = 'queued'),
    'running', (select count(*) from private.jobs where status = 'running'),
    'failed', (select count(*) from private.jobs where status = 'failed')
  );
end;
$$;

revoke all on function private.enqueue_job(public.job_kind, jsonb, timestamptz) from public, anon, authenticated;
revoke all on function private.claim_jobs(text, integer) from public, anon, authenticated;
revoke all on function private.finish_job(uuid, jsonb, text) from public, anon, authenticated;

revoke all on function public.omen_claim_jobs(text, integer) from public, anon, authenticated;
revoke all on function public.omen_finish_job(uuid, jsonb, text) from public, anon, authenticated;
revoke all on function public.omen_heartbeat(text, jsonb) from public, anon, authenticated;
revoke all on function public.omen_status() from public, anon, authenticated;

grant execute on function public.omen_claim_jobs(text, integer) to service_role;
grant execute on function public.omen_finish_job(uuid, jsonb, text) to service_role;
grant execute on function public.omen_heartbeat(text, jsonb) to service_role;
grant execute on function public.omen_status() to authenticated;
