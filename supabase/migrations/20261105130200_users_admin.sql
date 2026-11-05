create function public.admin_users()
returns table (
  id uuid,
  email text,
  full_name text,
  role public.user_role,
  is_active boolean,
  archived_at timestamptz,
  created_at timestamptz,
  parent_closer_id uuid,
  closer_rate numeric,
  parent_rate numeric,
  closer_recurring_rate numeric,
  parent_recurring_rate numeric,
  payout_cadence public.payout_cadence,
  has_totp boolean,
  contacts_count bigint,
  open_deals bigint,
  accrued_pending numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    p.id,
    u.email::text,
    p.full_name,
    p.role,
    p.is_active,
    p.archived_at,
    p.created_at,
    p.parent_closer_id,
    p.closer_rate,
    p.parent_rate,
    p.closer_recurring_rate,
    p.parent_recurring_rate,
    p.payout_cadence,
    exists (
      select 1 from auth.mfa_factors f where f.user_id = p.id and f.status::text = 'verified'
    ),
    (select count(*) from public.contacts c where c.owner_id = p.id and c.archived_at is null),
    (select count(*) from public.deals d where d.owner_id = p.id and d.stage not in ('won', 'lost')),
    0::numeric
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by (p.is_active and p.archived_at is null) desc, p.role, p.full_name, p.id;
end;
$$;

create function public.set_user_rates(
  p_user_id uuid,
  p_closer_rate numeric default null,
  p_parent_rate numeric default null,
  p_closer_recurring_rate numeric default null,
  p_parent_recurring_rate numeric default null,
  p_payout_cadence public.payout_cadence default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select p.* into v_profile from public.profiles p where p.id = p_user_id for update;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  if v_profile.role <> 'closer' then
    raise exception 'rates_only_for_closers' using errcode = 'P0001';
  end if;

  if v_profile.parent_closer_id is null
    and (p_parent_rate is not null or p_parent_recurring_rate is not null)
  then
    raise exception 'parent_rate_needs_parent' using errcode = 'P0001';
  end if;

  if coalesce(p_closer_rate, 0) not between 0 and 100
    or coalesce(p_parent_rate, 0) not between 0 and 100
    or coalesce(p_closer_recurring_rate, 0) not between 0 and 100
    or coalesce(p_parent_recurring_rate, 0) not between 0 and 100
  then
    raise exception 'rate_out_of_range' using errcode = 'P0001';
  end if;

  if (p_closer_recurring_rate is not null and p_closer_rate is not null and p_closer_recurring_rate >= p_closer_rate)
    or (p_parent_recurring_rate is not null and p_parent_rate is not null and p_parent_recurring_rate >= p_parent_rate)
  then
    raise exception 'rates_recurring_not_lower' using errcode = 'P0001';
  end if;

  update public.profiles
  set closer_rate = p_closer_rate,
      parent_rate = p_parent_rate,
      closer_recurring_rate = p_closer_recurring_rate,
      parent_recurring_rate = p_parent_recurring_rate,
      payout_cadence = p_payout_cadence
  where id = p_user_id;
end;
$$;

create function public.set_user_active(p_user_id uuid, p_active boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_active is null then
    raise exception 'invalid_active' using errcode = 'P0001';
  end if;

  select p.* into v_profile from public.profiles p where p.id = p_user_id for update;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  if not p_active and v_profile.role = 'closer' and exists (
    select 1
    from public.profiles c
    where c.parent_closer_id = p_user_id
      and c.is_active
      and c.archived_at is null
  ) then
    raise exception 'closer_has_subclosers' using errcode = '23514';
  end if;

  if p_active and v_profile.parent_closer_id is not null and not exists (
    select 1
    from public.profiles pc
    where pc.id = v_profile.parent_closer_id
      and pc.is_active
      and pc.archived_at is null
  ) then
    raise exception 'parent_closer_inactive' using errcode = 'P0001';
  end if;

  update public.profiles
  set is_active = p_active,
      archived_at = case when p_active then null else now() end
  where id = p_user_id;
end;
$$;

create function public.reassign_portfolio(p_from_user uuid, p_to_user uuid)
returns table (contacts bigint, deals bigint, leads bigint)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_contacts bigint;
  v_deals bigint;
  v_leads bigint;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_from_user is null or p_to_user is null or p_from_user = p_to_user then
    raise exception 'invalid_assignee' using errcode = 'P0001';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_from_user) then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_to_user
      and p.is_active
      and p.archived_at is null
      and p.role in ('closer', 'admin')
  ) then
    raise exception 'invalid_assignee' using errcode = 'P0001';
  end if;

  begin
    update public.contacts c
    set owner_id = p_to_user
    where c.owner_id = p_from_user;

    get diagnostics v_contacts = row_count;
  exception
    when unique_violation then
      raise exception 'contact_email_conflict' using errcode = 'P0001';
  end;

  update public.deals d
  set owner_id = p_to_user
  where d.owner_id = p_from_user
    and d.stage not in ('won', 'lost');

  get diagnostics v_deals = row_count;

  update public.leads l
  set assigned_to = p_to_user,
      assigned_by = v_uid,
      assigned_at = now()
  where l.assigned_to = p_from_user
    and l.status in ('assigned', 'contacted');

  get diagnostics v_leads = row_count;

  return query select v_contacts, v_deals, v_leads;
end;
$$;

create function public.log_totp_reset(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles p where p.id = p_user_id) then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (auth.uid(), 'profiles', p_user_id, 'update', jsonb_build_object('totp_reset', true));
end;
$$;

create function public.admin_audit_log(
  p_table text default null,
  p_row_id uuid default null,
  p_limit integer default 50
)
returns table (
  id bigint,
  at timestamptz,
  actor_id uuid,
  actor_name text,
  table_name text,
  row_id uuid,
  action text,
  before jsonb,
  after jsonb
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    a.id,
    a.at,
    a.actor_id,
    p.full_name,
    a.table_name,
    a.row_id,
    a.action,
    a.before - 'token_hash',
    a.after - 'token_hash'
  from private.audit_log a
  left join public.profiles p on p.id = a.actor_id
  where (p_table is null or a.table_name = p_table)
    and (p_row_id is null or a.row_id = p_row_id)
  order by a.at desc, a.id desc
  limit greatest(1, least(coalesce(p_limit, 50), 200));
end;
$$;

create function public.admin_counters()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'leads_new',
    (select count(*) from public.leads l where l.status = 'new' and l.contact_id is null),
    'leads_waiting_admin',
    (select count(*) from public.leads l where l.status = 'new' and l.contact_id is not null),
    'invitations_pending',
    (
      select count(*)
      from public.invitations i
      where i.accepted_at is null and i.revoked_at is null and i.expires_at > now()
    ),
    'users_active',
    (select count(*) from public.profiles p where p.is_active and p.archived_at is null)
  );
end;
$$;

revoke all on function public.admin_users() from public, anon, authenticated;
revoke all on function public.set_user_rates(uuid, numeric, numeric, numeric, numeric, public.payout_cadence) from public, anon, authenticated;
revoke all on function public.set_user_active(uuid, boolean) from public, anon, authenticated;
revoke all on function public.reassign_portfolio(uuid, uuid) from public, anon, authenticated;
revoke all on function public.log_totp_reset(uuid) from public, anon, authenticated;
revoke all on function public.admin_audit_log(text, uuid, integer) from public, anon, authenticated;
revoke all on function public.admin_counters() from public, anon, authenticated;

grant execute on function public.admin_users() to authenticated;
grant execute on function public.set_user_rates(uuid, numeric, numeric, numeric, numeric, public.payout_cadence) to authenticated;
grant execute on function public.set_user_active(uuid, boolean) to authenticated;
grant execute on function public.reassign_portfolio(uuid, uuid) to authenticated;
grant execute on function public.log_totp_reset(uuid) to authenticated;
grant execute on function public.admin_audit_log(text, uuid, integer) to authenticated;
grant execute on function public.admin_counters() to authenticated;
