create function private.account_deletion_caller()
returns uuid
language plpgsql
stable
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_role public.user_role;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select p.role into v_role
  from public.profiles p
  where p.id = v_uid
    and p.is_active
    and p.archived_at is null;

  if not found then
    raise exception 'profile_not_found' using errcode = 'P0001';
  end if;

  if v_role = 'admin' then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_role in ('closer', 'freelance') and not (select private.is_staff()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return v_uid;
end;
$$;

create function public.my_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.account_deletion_caller();
begin
  return (
    select j.created_at
    from private.jobs j
    where j.kind = 'account.delete'
      and j.status in ('queued', 'running')
      and j.payload ->> 'user_id' = v_uid::text
    order by j.created_at desc
    limit 1
  );
end;
$$;

create function public.request_account_deletion()
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.account_deletion_caller();
  v_requested timestamptz;
begin
  perform pg_advisory_xact_lock(hashtextextended('account.delete:' || v_uid::text, 0));

  v_requested := public.my_account_deletion();
  if v_requested is not null then
    return v_requested;
  end if;

  insert into private.jobs (kind, payload, max_attempts)
  values (
    'account.delete',
    jsonb_build_object('user_id', v_uid, 'review', 'admin'),
    1
  )
  returning created_at into v_requested;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (v_uid, 'profiles', v_uid, 'update', jsonb_build_object('account_deletion_requested', true));

  return v_requested;
end;
$$;

create function public.cancel_account_deletion()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := private.account_deletion_caller();
begin
  update private.jobs
  set status = 'cancelled',
      finished_at = now()
  where kind = 'account.delete'
    and status = 'queued'
    and payload ->> 'user_id' = v_uid::text;

  if not found then
    raise exception 'request_not_found' using errcode = 'P0001';
  end if;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (v_uid, 'profiles', v_uid, 'update', jsonb_build_object('account_deletion_cancelled', true));
end;
$$;

revoke all on function private.account_deletion_caller() from public, anon, authenticated;
revoke all on function public.my_account_deletion() from public, anon, authenticated;
revoke all on function public.request_account_deletion() from public, anon, authenticated;
revoke all on function public.cancel_account_deletion() from public, anon, authenticated;

grant execute on function public.my_account_deletion() to authenticated;
grant execute on function public.request_account_deletion() to authenticated;
grant execute on function public.cancel_account_deletion() to authenticated;
