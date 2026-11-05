create function public.admin_jobs(
  p_status public.job_status default null,
  p_limit integer default 50
)
returns table (
  id uuid,
  kind public.job_kind,
  status public.job_status,
  attempts integer,
  max_attempts integer,
  run_after timestamptz,
  error text,
  created_at timestamptz,
  finished_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_limit is null or p_limit not between 1 and 200 then
    raise exception 'invalid_limit' using errcode = 'P0001';
  end if;

  return query
  select j.id, j.kind, j.status, j.attempts, j.max_attempts, j.run_after, left(j.error, 500), j.created_at, j.finished_at
  from private.jobs j
  where p_status is null or j.status = p_status
  order by j.created_at desc, j.id
  limit p_limit;
end;
$$;

create function public.retry_job(p_id uuid)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.jobs;
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_job from private.jobs where id = p_id for update;

  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;

  if v_job.status not in ('failed', 'cancelled') then
    raise exception 'job_not_retryable' using errcode = 'P0001';
  end if;

  update private.jobs
  set status = 'queued',
      attempts = 0,
      run_after = now(),
      error = null,
      locked_by = null,
      locked_at = null,
      finished_at = null
  where id = p_id;

  insert into private.audit_log (actor_id, table_name, row_id, action, before, after)
  values (
    auth.uid(),
    'jobs',
    p_id,
    'update',
    jsonb_build_object('kind', v_job.kind, 'status', v_job.status, 'attempts', v_job.attempts, 'error', left(v_job.error, 500)),
    jsonb_build_object('kind', v_job.kind, 'status', 'queued', 'attempts', 0, 'error', null)
  );

  return 'queued';
end;
$$;

create function public.cancel_job(p_id uuid)
returns public.job_status
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.jobs;
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_job from private.jobs where id = p_id for update;

  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;

  if v_job.status <> 'queued' then
    raise exception 'job_not_cancellable' using errcode = 'P0001';
  end if;

  update private.jobs
  set status = 'cancelled',
      finished_at = now()
  where id = p_id;

  insert into private.audit_log (actor_id, table_name, row_id, action, before, after)
  values (
    auth.uid(),
    'jobs',
    p_id,
    'update',
    jsonb_build_object('kind', v_job.kind, 'status', v_job.status, 'attempts', v_job.attempts),
    jsonb_build_object('kind', v_job.kind, 'status', 'cancelled', 'attempts', v_job.attempts)
  );

  return 'cancelled';
end;
$$;

revoke all on function public.admin_jobs(public.job_status, integer) from public, anon, authenticated;
revoke all on function public.retry_job(uuid) from public, anon, authenticated;
revoke all on function public.cancel_job(uuid) from public, anon, authenticated;

grant execute on function public.admin_jobs(public.job_status, integer) to authenticated;
grant execute on function public.retry_job(uuid) to authenticated;
grant execute on function public.cancel_job(uuid) to authenticated;
