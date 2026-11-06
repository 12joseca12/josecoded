alter type public.notification_event add value if not exists 'fee_submitted';
alter type public.notification_event add value if not exists 'fee_decided';

create type public.fee_mode as enum ('hourly', 'milestones', 'fixed');
create type public.fee_item_status as enum ('pending', 'delivered', 'approved', 'rejected', 'paid');

create table public.freelance_fees (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete restrict,
  freelance_id uuid not null references public.profiles (id) on delete restrict,
  mode public.fee_mode not null,
  amount numeric(12, 2),
  hourly_rate numeric(8, 2),
  hours_cap numeric(7, 1),
  note text,
  agreed_at timestamptz not null default now(),
  agreed_by uuid references public.profiles (id) on delete set null,
  closed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint freelance_fees_project_freelance_key unique (project_id, freelance_id),
  constraint freelance_fees_note_length check (char_length(note) <= 1000),
  constraint freelance_fees_mode_shape check (
    case mode
      when 'hourly' then hourly_rate > 0 and amount is null and (hours_cap is null or hours_cap > 0)
      when 'fixed' then amount > 0 and hourly_rate is null and hours_cap is null
      else amount is null and hourly_rate is null and hours_cap is null
    end
  )
);

create index freelance_fees_freelance_id_idx on public.freelance_fees (freelance_id);
create index freelance_fees_project_id_idx on public.freelance_fees (project_id);
create index freelance_fees_agreed_by_idx on public.freelance_fees (agreed_by);

create table public.freelance_fee_items (
  id uuid primary key default gen_random_uuid(),
  fee_id uuid not null references public.freelance_fees (id) on delete restrict,
  label text not null,
  hours numeric(7, 1),
  amount numeric(12, 2) not null,
  worked_on date not null default ((now() at time zone 'Europe/Madrid')::date),
  status public.fee_item_status not null default 'pending',
  delivered_at timestamptz,
  rejected_reason text,
  payout_id uuid,
  submitted_by uuid references public.profiles (id) on delete set null,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint freelance_fee_items_label_length check (char_length(btrim(label)) between 1 and 120),
  constraint freelance_fee_items_hours_range check (hours is null or (hours > 0 and hours <= 24)),
  constraint freelance_fee_items_amount_positive check (amount > 0),
  constraint freelance_fee_items_reason_length check (char_length(rejected_reason) between 1 and 500),
  constraint freelance_fee_items_reason_consistent check ((status = 'rejected') = (rejected_reason is not null)),
  constraint freelance_fee_items_approved_consistent check (
    (status in ('approved', 'paid')) = (approved_at is not null)
  ),
  constraint freelance_fee_items_payout_consistent check (payout_id is null or status in ('approved', 'paid'))
);

create index freelance_fee_items_fee_status_idx on public.freelance_fee_items (fee_id, status);
create index freelance_fee_items_payout_id_idx on public.freelance_fee_items (payout_id);
create index freelance_fee_items_worked_on_idx on public.freelance_fee_items (worked_on);
create index freelance_fee_items_submitted_by_idx on public.freelance_fee_items (submitted_by);
create index freelance_fee_items_approved_by_idx on public.freelance_fee_items (approved_by);

alter table public.freelance_fees enable row level security;
alter table public.freelance_fee_items enable row level security;

revoke all on public.freelance_fees from anon, authenticated;
revoke all on public.freelance_fee_items from anon, authenticated;
grant select on public.freelance_fees to authenticated;
grant select on public.freelance_fee_items to authenticated;

create policy freelance_fees_select
on public.freelance_fees
for select
to authenticated
using (
  (select private.is_admin())
  or (
    freelance_id = (select private.uid())
    and (select private.role()) = 'freelance'
    and (select private.is_aal2())
  )
);

create policy freelance_fee_items_select
on public.freelance_fee_items
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.freelance_fees f
    where f.id = freelance_fee_items.fee_id
      and f.freelance_id = (select private.uid())
      and (select private.role()) = 'freelance'
      and (select private.is_aal2())
  )
);

create function private.freelance_fee_items_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
declare
  v_fee public.freelance_fees;
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_used numeric;
begin
  select * into v_fee from public.freelance_fees f where f.id = new.fee_id for no key update;

  if tg_op = 'UPDATE' then
    if new.fee_id is distinct from old.fee_id then
      raise exception 'fee_immutable' using errcode = '23514';
    end if;

    if new.status is distinct from old.status and private.is_api_client_role() then
      raise exception 'status_requires_rpc' using errcode = '42501';
    end if;
  elsif new.status <> 'pending' and private.is_api_client_role() then
    raise exception 'status_requires_rpc' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' and v_fee.closed_at is not null then
    raise exception 'fee_closed' using errcode = 'P0001';
  end if;

  if v_fee.mode = 'hourly' then
    if new.hours is null then
      raise exception 'invalid_hours' using errcode = 'P0001';
    end if;

    if tg_op = 'INSERT' then
      if new.amount is not null then
        raise exception 'amount_is_computed' using errcode = 'P0001';
      end if;
    elsif new.hours is not distinct from old.hours and new.amount is distinct from old.amount then
      raise exception 'amount_is_computed' using errcode = 'P0001';
    end if;

    new.amount := round(new.hours * v_fee.hourly_rate, 2);

    if tg_op = 'INSERT' and new.worked_on > v_today then
      raise exception 'future_date' using errcode = 'P0001';
    end if;

    if v_fee.hours_cap is not null and (tg_op = 'INSERT' or new.hours is distinct from old.hours) then
      select coalesce(sum(i.hours), 0) into v_used
      from public.freelance_fee_items i
      where i.fee_id = new.fee_id
        and i.status in ('pending', 'delivered', 'approved', 'paid')
        and i.id <> new.id;

      if v_used + new.hours > v_fee.hours_cap then
        raise exception 'hours_cap_exceeded' using errcode = 'P0001';
      end if;
    end if;
  else
    if new.hours is not null then
      raise exception 'fee_mode_mismatch' using errcode = 'P0001';
    end if;

    if v_fee.mode = 'fixed'
      and new.status <> 'rejected'
      and (tg_op = 'INSERT' or new.amount is distinct from old.amount)
    then
      select coalesce(sum(i.amount), 0) into v_used
      from public.freelance_fee_items i
      where i.fee_id = new.fee_id
        and i.status <> 'rejected'
        and i.id <> new.id;

      if v_used + new.amount > v_fee.amount then
        raise exception 'fee_amount_exceeded' using errcode = 'P0001';
      end if;
    end if;
  end if;

  return new;
end;
$$;

create function private.freelance_fee_items_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee public.freelance_fees;
  v_project_name text;
  v_admin uuid;
  v_href text;
begin
  select * into v_fee from public.freelance_fees f where f.id = new.fee_id;
  select p.name into v_project_name from public.projects p where p.id = v_fee.project_id;

  if tg_op = 'UPDATE' and new.status in ('approved', 'rejected') and old.status is distinct from new.status then
    perform private.notify(
      v_fee.freelance_id,
      'fee_decided',
      coalesce(v_project_name, '-'),
      new.label || ' · ' || new.status::text,
      '/freelance/pagos'
    );

    return null;
  end if;

  if not (
    (tg_op = 'INSERT' and new.status = 'pending' and new.submitted_by is not distinct from v_fee.freelance_id)
    or (tg_op = 'UPDATE' and new.status = 'delivered' and old.status is distinct from 'delivered')
  ) then
    return null;
  end if;

  select p.id into v_admin
  from public.profiles p
  where p.role = 'admin' and p.is_active and p.archived_at is null
  order by p.created_at, p.id
  limit 1;

  if v_admin is null then
    return null;
  end if;

  v_href := '/admin/proyectos/' || v_fee.project_id::text || '?tab=equipo';

  perform private.notify(
    v_admin,
    'fee_submitted',
    coalesce(v_project_name, '-'),
    case
      when new.hours is not null
        then to_char(new.hours, 'FM9990.0') || ' h · EUR ' || to_char(new.amount, 'FM999999990.00')
      else 'Delivered: ' || new.label
    end,
    v_href
  );

  return null;
end;
$$;

create trigger freelance_fees_set_updated_at
before update on public.freelance_fees
for each row execute function private.set_updated_at();

create trigger freelance_fees_audit_insert
after insert on public.freelance_fees
for each row execute function private.audit();

create trigger freelance_fees_audit_update
after update on public.freelance_fees
for each row
when (
  old.mode is distinct from new.mode
  or old.amount is distinct from new.amount
  or old.hourly_rate is distinct from new.hourly_rate
  or old.hours_cap is distinct from new.hours_cap
  or old.closed_at is distinct from new.closed_at
)
execute function private.audit();

create trigger freelance_fee_items_guard
before insert or update on public.freelance_fee_items
for each row execute function private.freelance_fee_items_guard();

create trigger freelance_fee_items_audit_update
after update on public.freelance_fee_items
for each row
when (old.status is distinct from new.status)
execute function private.audit();

create trigger freelance_fee_items_notify
after insert or update on public.freelance_fee_items
for each row execute function private.freelance_fee_items_notify();

create function private.freelance_fee_rows()
returns table (
  fee_id uuid,
  project_id uuid,
  project_name text,
  project_phase public.project_phase,
  project_archived_at timestamptz,
  freelance_id uuid,
  mode public.fee_mode,
  amount numeric,
  hourly_rate numeric,
  hours_cap numeric,
  closed_at timestamptz,
  agreed_total numeric,
  hours_approved numeric,
  pending_amount numeric,
  delivered_amount numeric,
  approved_unpaid_amount numeric,
  paid_amount numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    f.id,
    f.project_id,
    p.name,
    p.phase,
    p.archived_at,
    f.freelance_id,
    f.mode,
    f.amount,
    f.hourly_rate,
    f.hours_cap,
    f.closed_at,
    case f.mode
      when 'fixed' then f.amount
      when 'hourly' then f.hours_cap * f.hourly_rate
      else coalesce(t.agreed, 0)
    end,
    coalesce(t.hours_approved, 0),
    coalesce(t.pending, 0),
    coalesce(t.delivered, 0),
    coalesce(t.approved_unpaid, 0),
    coalesce(t.paid, 0)
  from public.freelance_fees f
  join public.projects p on p.id = f.project_id
  left join lateral (
    select
      sum(i.amount) filter (where i.status <> 'rejected') as agreed,
      sum(i.hours) filter (where i.status in ('approved', 'paid')) as hours_approved,
      sum(i.amount) filter (where i.status = 'pending') as pending,
      sum(i.amount) filter (where i.status = 'delivered') as delivered,
      sum(i.amount) filter (where i.status = 'approved') as approved_unpaid,
      sum(i.amount) filter (where i.status = 'paid') as paid
    from public.freelance_fee_items i
    where i.fee_id = f.id
  ) t on true
  where private.is_admin()
    or (private.role() = 'freelance' and private.is_aal2() and f.freelance_id = auth.uid())
$$;

create view public.freelance_fee_summary
with (security_invoker = true)
as
select
  fee_id, project_id, project_name, project_phase, project_archived_at, freelance_id, mode, amount,
  hourly_rate, hours_cap, closed_at, agreed_total, hours_approved, pending_amount, delivered_amount,
  approved_unpaid_amount, paid_amount
from private.freelance_fee_rows();

revoke all on public.freelance_fee_summary from anon, authenticated;
grant select on public.freelance_fee_summary to authenticated;

create or replace function public.set_project_freelance(p_id uuid, p_user_id uuid default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_project from public.projects p where p.id = p_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  if p_user_id is not null and not exists (
    select 1
    from public.profiles pr
    where pr.id = p_user_id and pr.role = 'freelance' and pr.is_active and pr.archived_at is null
  ) then
    raise exception 'invalid_freelance' using errcode = 'P0001';
  end if;

  if v_project.freelance_id is not null and v_project.freelance_id is distinct from p_user_id then
    update public.tasks set assignee_id = null
    where project_id = p_id and assignee_id = v_project.freelance_id;

    update public.freelance_fees set closed_at = now()
    where project_id = p_id and freelance_id = v_project.freelance_id and closed_at is null;
  end if;

  if p_user_id is not null then
    update public.freelance_fees set closed_at = null
    where project_id = p_id and freelance_id = p_user_id and closed_at is not null;
  end if;

  update public.projects set freelance_id = p_user_id where id = p_id;
end;
$$;

create function public.set_freelance_fee(
  p_project_id uuid,
  p_mode public.fee_mode,
  p_amount numeric default null,
  p_hourly_rate numeric default null,
  p_hours_cap numeric default null,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project public.projects;
  v_fee public.freelance_fees;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
  v_used numeric;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_project from public.projects p where p.id = p_project_id for update;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  if v_project.archived_at is not null then
    raise exception 'project_archived' using errcode = 'P0001';
  end if;

  if v_project.freelance_id is null then
    raise exception 'project_has_no_freelance' using errcode = 'P0001';
  end if;

  if p_mode is null
    or (v_note is not null and char_length(v_note) > 1000)
    or (p_mode = 'hourly' and (
      p_hourly_rate is null or p_hourly_rate <= 0 or p_hourly_rate >= 100000
      or p_hourly_rate <> round(p_hourly_rate, 2)
      or p_amount is not null
      or (p_hours_cap is not null and (p_hours_cap <= 0 or p_hours_cap >= 100000 or p_hours_cap <> round(p_hours_cap, 1)))
    ))
    or (p_mode = 'fixed' and (
      p_amount is null or p_amount <= 0 or p_amount >= 10000000 or p_amount <> round(p_amount, 2)
      or p_hourly_rate is not null or p_hours_cap is not null
    ))
    or (p_mode = 'milestones' and (p_amount is not null or p_hourly_rate is not null or p_hours_cap is not null))
  then
    raise exception 'invalid_fee' using errcode = 'P0001';
  end if;

  select * into v_fee
  from public.freelance_fees f
  where f.project_id = p_project_id and f.freelance_id = v_project.freelance_id
  for update;

  if not found then
    insert into public.freelance_fees (
      project_id, freelance_id, mode, amount, hourly_rate, hours_cap, note, agreed_by
    )
    values (
      p_project_id, v_project.freelance_id, p_mode, p_amount, p_hourly_rate, p_hours_cap, v_note, auth.uid()
    )
    returning id into v_id;

    return v_id;
  end if;

  if v_fee.mode <> p_mode and exists (
    select 1 from public.freelance_fee_items i where i.fee_id = v_fee.id and i.status <> 'rejected'
  ) then
    raise exception 'fee_has_items' using errcode = 'P0001';
  end if;

  if p_mode = 'fixed' and p_amount < (
    select coalesce(sum(i.amount), 0)
    from public.freelance_fee_items i
    where i.fee_id = v_fee.id and i.status <> 'rejected'
  ) then
    raise exception 'fee_amount_exceeded' using errcode = 'P0001';
  end if;

  if p_mode = 'hourly' and p_hours_cap is not null then
    select coalesce(sum(i.hours), 0) into v_used
    from public.freelance_fee_items i
    where i.fee_id = v_fee.id and i.status in ('pending', 'delivered', 'approved', 'paid');

    if p_hours_cap < v_used then
      raise exception 'hours_cap_exceeded' using errcode = 'P0001';
    end if;
  end if;

  update public.freelance_fees
  set mode = p_mode,
      amount = p_amount,
      hourly_rate = p_hourly_rate,
      hours_cap = p_hours_cap,
      note = v_note,
      agreed_at = now(),
      agreed_by = auth.uid(),
      closed_at = null
  where id = v_fee.id;

  return v_fee.id;
end;
$$;

create function public.add_fee_item(
  p_fee_id uuid,
  p_label text,
  p_amount numeric,
  p_worked_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee public.freelance_fees;
  v_label text := btrim(coalesce(p_label, ''));
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select * into v_fee from public.freelance_fees f where f.id = p_fee_id;

  if not found then
    raise exception 'fee_not_found' using errcode = 'P0001';
  end if;

  if v_fee.mode = 'hourly' then
    raise exception 'fee_mode_mismatch' using errcode = 'P0001';
  end if;

  if char_length(v_label) not between 1 and 120 then
    raise exception 'invalid_label' using errcode = 'P0001';
  end if;

  if p_amount is null or p_amount <= 0 or p_amount >= 10000000 or p_amount <> round(p_amount, 2) then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  insert into public.freelance_fee_items (fee_id, label, amount, worked_on, submitted_by)
  values (
    p_fee_id, v_label, p_amount, coalesce(p_worked_on, (now() at time zone 'Europe/Madrid')::date), auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create function public.approve_fee_items(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_locked integer;
  v_today date := (now() at time zone 'Europe/Madrid')::date;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct x), '{}') into v_ids from unnest(coalesce(p_ids, '{}')) as x where x is not null;

  if cardinality(v_ids) not between 1 and 200 then
    raise exception 'invalid_selection' using errcode = 'P0001';
  end if;

  select count(*) into v_locked
  from (
    select i.id
    from public.freelance_fee_items i
    where i.id = any (v_ids) and i.status in ('pending', 'delivered')
    order by i.id
    for update
  ) locked;

  if v_locked <> cardinality(v_ids) then
    raise exception 'item_not_approvable' using errcode = 'P0001';
  end if;

  update public.freelance_fee_items
  set status = 'approved',
      approved_at = now(),
      approved_by = auth.uid(),
      worked_on = least(worked_on, v_today)
  where id = any (v_ids);

  return cardinality(v_ids);
end;
$$;

create function public.reject_fee_item(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.freelance_fee_items;
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if char_length(v_reason) not between 1 and 500 then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  select * into v_item from public.freelance_fee_items i where i.id = p_id for update;

  if not found then
    raise exception 'item_not_found' using errcode = 'P0001';
  end if;

  if v_item.status not in ('pending', 'delivered') then
    raise exception 'item_not_approvable' using errcode = 'P0001';
  end if;

  update public.freelance_fee_items set status = 'rejected', rejected_reason = v_reason where id = p_id;
end;
$$;

create function public.submit_fee_hours(
  p_project_id uuid,
  p_hours numeric,
  p_label text,
  p_worked_on date default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fee public.freelance_fees;
  v_label text := btrim(coalesce(p_label, ''));
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_id uuid;
begin
  if private.role() is distinct from 'freelance' or not private.is_aal2() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select f.* into v_fee
  from public.freelance_fees f
  join public.projects p on p.id = f.project_id
  where f.project_id = p_project_id
    and f.freelance_id = auth.uid()
    and p.freelance_id = auth.uid()
    and f.closed_at is null
    and p.archived_at is null;

  if not found then
    raise exception 'fee_not_found' using errcode = 'P0001';
  end if;

  if v_fee.mode <> 'hourly' then
    raise exception 'fee_mode_mismatch' using errcode = 'P0001';
  end if;

  if p_hours is null or p_hours <= 0 or p_hours > 24 or p_hours <> round(p_hours, 1) then
    raise exception 'invalid_hours' using errcode = 'P0001';
  end if;

  if char_length(v_label) not between 1 and 120 then
    raise exception 'invalid_label' using errcode = 'P0001';
  end if;

  if coalesce(p_worked_on, v_today) > v_today then
    raise exception 'future_date' using errcode = 'P0001';
  end if;

  insert into public.freelance_fee_items (fee_id, label, hours, worked_on, submitted_by)
  values (v_fee.id, v_label, p_hours, coalesce(p_worked_on, v_today), auth.uid())
  returning id into v_id;

  return v_id;
end;
$$;

create function public.mark_item_delivered(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.freelance_fee_items;
  v_fee public.freelance_fees;
begin
  if private.role() is distinct from 'freelance' or not private.is_aal2() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select i.* into v_item from public.freelance_fee_items i where i.id = p_id for update;

  if not found then
    raise exception 'item_not_found' using errcode = 'P0001';
  end if;

  select f.* into v_fee from public.freelance_fees f where f.id = v_item.fee_id;

  if v_fee.freelance_id is distinct from auth.uid() or v_fee.closed_at is not null then
    raise exception 'item_not_found' using errcode = 'P0001';
  end if;

  if v_fee.mode = 'hourly' then
    raise exception 'fee_mode_mismatch' using errcode = 'P0001';
  end if;

  if v_item.status <> 'pending' then
    raise exception 'item_not_pending' using errcode = 'P0001';
  end if;

  update public.freelance_fee_items
  set status = 'delivered',
      delivered_at = now(),
      worked_on = (now() at time zone 'Europe/Madrid')::date
  where id = p_id;
end;
$$;

create function public.delete_fee_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_item public.freelance_fee_items;
  v_fee public.freelance_fees;
begin
  if not private.is_admin() and (private.role() is distinct from 'freelance' or not private.is_aal2()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select i.* into v_item from public.freelance_fee_items i where i.id = p_id for update;

  if not found then
    raise exception 'item_not_found' using errcode = 'P0001';
  end if;

  select f.* into v_fee from public.freelance_fees f where f.id = v_item.fee_id;

  if not private.is_admin() then
    if v_fee.freelance_id is distinct from auth.uid() then
      raise exception 'item_not_found' using errcode = 'P0001';
    end if;

    if v_fee.mode <> 'hourly' or v_item.submitted_by is distinct from auth.uid() then
      raise exception 'forbidden' using errcode = '42501';
    end if;
  end if;

  if v_item.status <> 'pending' then
    raise exception 'item_not_pending' using errcode = 'P0001';
  end if;

  delete from public.freelance_fee_items where id = p_id;
end;
$$;

create function public.set_my_task_status(p_id uuid, p_status public.task_status)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_task public.tasks;
begin
  if p_status is null then
    raise exception 'invalid_status' using errcode = 'P0001';
  end if;

  select * into v_task from public.tasks t where t.id = p_id for update;

  if not found or not private.is_project_member(v_task.project_id) or private.is_admin() then
    raise exception 'task_not_found' using errcode = 'P0001';
  end if;

  if v_task.assignee_id is distinct from auth.uid() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_task.status is distinct from p_status then
    update public.tasks set status = p_status where id = p_id;
  end if;
end;
$$;

create or replace function public.complete_my_task(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.set_my_task_status(p_id, 'done');
end;
$$;

revoke all on function private.freelance_fee_items_guard() from public, anon, authenticated;
revoke all on function private.freelance_fee_items_notify() from public, anon, authenticated;
revoke all on function private.freelance_fee_rows() from public, anon, authenticated;
revoke all on function public.set_freelance_fee(uuid, public.fee_mode, numeric, numeric, numeric, text) from public, anon, authenticated;
revoke all on function public.add_fee_item(uuid, text, numeric, date) from public, anon, authenticated;
revoke all on function public.approve_fee_items(uuid[]) from public, anon, authenticated;
revoke all on function public.reject_fee_item(uuid, text) from public, anon, authenticated;
revoke all on function public.submit_fee_hours(uuid, numeric, text, date) from public, anon, authenticated;
revoke all on function public.mark_item_delivered(uuid) from public, anon, authenticated;
revoke all on function public.delete_fee_item(uuid) from public, anon, authenticated;
revoke all on function public.set_my_task_status(uuid, public.task_status) from public, anon, authenticated;
revoke all on function public.complete_my_task(uuid) from public, anon, authenticated;
revoke all on function public.set_project_freelance(uuid, uuid) from public, anon, authenticated;

grant execute on function private.freelance_fee_rows() to authenticated;
grant execute on function public.set_freelance_fee(uuid, public.fee_mode, numeric, numeric, numeric, text) to authenticated;
grant execute on function public.add_fee_item(uuid, text, numeric, date) to authenticated;
grant execute on function public.approve_fee_items(uuid[]) to authenticated;
grant execute on function public.reject_fee_item(uuid, text) to authenticated;
grant execute on function public.submit_fee_hours(uuid, numeric, text, date) to authenticated;
grant execute on function public.mark_item_delivered(uuid) to authenticated;
grant execute on function public.delete_fee_item(uuid) to authenticated;
grant execute on function public.set_my_task_status(uuid, public.task_status) to authenticated;
grant execute on function public.complete_my_task(uuid) to authenticated;
grant execute on function public.set_project_freelance(uuid, uuid) to authenticated;
