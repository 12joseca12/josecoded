create type public.commission_role as enum ('closer', 'parent');
create type public.commission_nature as enum ('project', 'recurring');
create type public.commission_line_status as enum ('accrued', 'approved', 'rejected', 'paid', 'reversed');

alter table public.deals
  add column recurring_monthly numeric(10, 2),
  add column recurring_started_at date,
  add column recurring_cancelled_at date,
  add constraint deals_recurring_monthly_positive check (recurring_monthly is null or recurring_monthly > 0);

create table public.commissions (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null unique references public.deals (id) on delete restrict,
  closer_id uuid not null references public.profiles (id) on delete restrict,
  closer_rate numeric(5, 2) not null,
  closer_recurring_rate numeric(5, 2),
  subcloser_id uuid references public.profiles (id) on delete restrict,
  subcloser_rate numeric(5, 2),
  subcloser_recurring_rate numeric(5, 2),
  expected_base numeric(12, 2) not null,
  expected_closer_amount numeric(12, 2) not null,
  expected_subcloser_amount numeric(12, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint commissions_rates_range check (
    closer_rate between 0 and 100
    and closer_recurring_rate between 0 and 100
    and subcloser_rate between 0 and 100
    and subcloser_recurring_rate between 0 and 100
  ),
  constraint commissions_recurring_below_project check (
    (closer_recurring_rate is null or closer_recurring_rate < closer_rate)
    and (subcloser_recurring_rate is null or subcloser_rate is null or subcloser_recurring_rate < subcloser_rate)
  ),
  constraint commissions_subcloser_consistent check (
    (subcloser_id is null) = (subcloser_rate is null)
  ),
  constraint commissions_expected_positive check (
    expected_base > 0 and expected_closer_amount >= 0 and expected_subcloser_amount >= 0
  )
);

create index commissions_closer_id_idx on public.commissions (closer_id);
create index commissions_subcloser_id_idx on public.commissions (subcloser_id);

create table public.commission_lines (
  id uuid primary key default gen_random_uuid(),
  commission_id uuid not null references public.commissions (id) on delete restrict,
  payment_id uuid,
  beneficiary_id uuid not null references public.profiles (id) on delete restrict,
  role public.commission_role not null,
  nature public.commission_nature not null,
  rate numeric(5, 2) not null,
  base numeric(12, 2) not null,
  amount numeric(12, 2) not null,
  status public.commission_line_status not null default 'accrued',
  rejected_reason text,
  payout_id uuid,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint commission_lines_rate_range check (rate between 0 and 100),
  constraint commission_lines_reason_length check (char_length(rejected_reason) between 1 and 500),
  constraint commission_lines_rejected_has_reason check ((status = 'rejected') = (rejected_reason is not null))
);

create index commission_lines_commission_id_idx on public.commission_lines (commission_id);
create index commission_lines_payment_id_idx on public.commission_lines (payment_id);
create index commission_lines_beneficiary_id_idx on public.commission_lines (beneficiary_id, status);
create index commission_lines_payout_id_idx on public.commission_lines (payout_id);
create index commission_lines_approved_by_idx on public.commission_lines (approved_by);

alter table public.commissions enable row level security;
alter table public.commission_lines enable row level security;

revoke all on public.commissions from anon, authenticated;
revoke all on public.commission_lines from anon, authenticated;

grant select on public.commissions to authenticated;
grant select on public.commission_lines to authenticated;

create policy commissions_select
on public.commissions
for select
to authenticated
using (
  (select private.is_admin())
  or (
    (select private.is_staff())
    and (closer_id = (select private.uid()) or subcloser_id = (select private.uid()))
  )
);

create policy commission_lines_select
on public.commission_lines
for select
to authenticated
using (
  (select private.is_admin())
  or (
    (select private.is_staff())
    and (
      beneficiary_id = (select private.uid())
      or exists (
        select 1
        from public.profiles b
        where b.id = commission_lines.beneficiary_id
          and b.parent_closer_id = (select private.uid())
      )
    )
  )
);

create trigger commissions_audit_insert
after insert on public.commissions
for each row execute function private.audit();

create trigger commission_lines_audit_status
after update on public.commission_lines
for each row
when (old.status is distinct from new.status)
execute function private.audit();

create or replace function private.deals_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select c.owner_id into new.owner_id from public.contacts c where c.id = new.contact_id;
  elsif new.contact_id is distinct from old.contact_id then
    raise exception 'deal_contact_immutable' using errcode = '23514';
  end if;

  if private.is_api_client_role() then
    if new.stage = 'won' and (tg_op = 'INSERT' or old.stage is distinct from 'won') then
      raise exception 'won_requires_win_deal' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and old.stage = 'won' and new.stage is distinct from 'won' then
      raise exception 'won_deal_is_closed' using errcode = '42501';
    end if;

    if new.won_amount is distinct from (case when tg_op = 'INSERT' then null else old.won_amount end)
      or new.won_at is distinct from (case when tg_op = 'INSERT' then null else old.won_at end)
    then
      raise exception 'won_fields_require_win_deal' using errcode = '42501';
    end if;

    if new.recurring_monthly is distinct from (case when tg_op = 'INSERT' then null else old.recurring_monthly end)
      or new.recurring_started_at is distinct from (case when tg_op = 'INSERT' then null else old.recurring_started_at end)
      or new.recurring_cancelled_at is distinct from (case when tg_op = 'INSERT' then null else old.recurring_cancelled_at end)
    then
      raise exception 'recurring_fields_require_rpc' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE'
      and new.owner_id is distinct from old.owner_id
      and not private.is_admin()
    then
      raise exception 'owner_change_admin_only' using errcode = '42501';
    end if;
  end if;

  if new.stage = 'lost' then
    new.lost_at := coalesce(new.lost_at, now());
  else
    new.lost_at := null;
  end if;

  return new;
end;
$$;

create function private.commission_rates_for(p_owner_id uuid)
returns table (
  closer_id uuid,
  closer_rate numeric,
  closer_recurring_rate numeric,
  subcloser_id uuid,
  subcloser_rate numeric,
  subcloser_recurring_rate numeric
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_owner public.profiles;
begin
  select p.* into v_owner from public.profiles p where p.id = p_owner_id;

  if not found or v_owner.role <> 'closer' then
    return;
  end if;

  if v_owner.parent_closer_id is null then
    return query
    select
      v_owner.id,
      coalesce(v_owner.closer_rate, 0),
      case when v_owner.closer_recurring_rate < coalesce(v_owner.closer_rate, 0) then v_owner.closer_recurring_rate end,
      null::uuid,
      null::numeric,
      null::numeric;
  else
    return query
    select
      v_owner.parent_closer_id,
      coalesce(v_owner.parent_rate, 0),
      case when v_owner.parent_recurring_rate < coalesce(v_owner.parent_rate, 0) then v_owner.parent_recurring_rate end,
      v_owner.id,
      coalesce(v_owner.closer_rate, 0),
      case when v_owner.closer_recurring_rate < coalesce(v_owner.closer_rate, 0) then v_owner.closer_recurring_rate end;
  end if;
end;
$$;

create function public.win_deal(
  p_deal_id uuid,
  p_won_amount numeric,
  p_recurring_monthly numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deals;
  v_rates record;
  v_commission_id uuid;
  v_closer_amount numeric(12, 2);
  v_sub_amount numeric(12, 2) := 0;
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select d.* into v_deal from public.deals d where d.id = p_deal_id for update;

  if not found or not (private.is_admin() or private.owns_contact(v_deal.contact_id)) then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  if v_deal.stage = 'won' then
    raise exception 'deal_already_won' using errcode = 'P0001';
  end if;

  if v_deal.stage = 'lost' then
    raise exception 'deal_lost' using errcode = 'P0001';
  end if;

  if p_won_amount is null or p_won_amount <= 0 or p_won_amount >= 10000000000
    or p_won_amount <> round(p_won_amount, 2)
  then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  if p_recurring_monthly is not null
    and (p_recurring_monthly <= 0 or p_recurring_monthly >= 100000000 or p_recurring_monthly <> round(p_recurring_monthly, 2))
  then
    raise exception 'invalid_recurring' using errcode = 'P0001';
  end if;

  update public.deals
  set stage = 'won',
      won_at = now(),
      won_amount = p_won_amount,
      recurring_monthly = p_recurring_monthly
  where id = p_deal_id;

  insert into public.activities (contact_id, deal_id, author_id, kind)
  values (v_deal.contact_id, p_deal_id, auth.uid(), 'stage_change');

  if v_deal.via = 'hiring' or v_deal.owner_id is null then
    return null;
  end if;

  select r.* into v_rates from private.commission_rates_for(v_deal.owner_id) r;

  if not found then
    return null;
  end if;

  v_closer_amount := round(p_won_amount * v_rates.closer_rate / 100, 2);

  if v_rates.subcloser_id is not null then
    v_sub_amount := round(p_won_amount * v_rates.subcloser_rate / 100, 2);
  end if;

  insert into public.commissions (
    deal_id, closer_id, closer_rate, closer_recurring_rate,
    subcloser_id, subcloser_rate, subcloser_recurring_rate,
    expected_base, expected_closer_amount, expected_subcloser_amount
  )
  values (
    p_deal_id, v_rates.closer_id, v_rates.closer_rate, v_rates.closer_recurring_rate,
    v_rates.subcloser_id, v_rates.subcloser_rate, v_rates.subcloser_recurring_rate,
    p_won_amount, v_closer_amount, v_sub_amount
  )
  returning id into v_commission_id;

  return v_commission_id;
end;
$$;

create function public.cancel_recurring(p_deal_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deals;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select d.* into v_deal from public.deals d where d.id = p_deal_id for update;

  if not found then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  if v_deal.stage <> 'won' or v_deal.recurring_monthly is null then
    raise exception 'no_recurring' using errcode = 'P0001';
  end if;

  if v_deal.recurring_cancelled_at is not null then
    raise exception 'recurring_already_cancelled' using errcode = 'P0001';
  end if;

  update public.deals set recurring_cancelled_at = current_date where id = p_deal_id;
end;
$$;

create function public.approve_commission_lines(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ids uuid[];
  v_count integer;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select coalesce(array_agg(distinct i), '{}') into v_ids from unnest(coalesce(p_ids, '{}')) as i;

  if cardinality(v_ids) = 0 or cardinality(v_ids) > 200 then
    raise exception 'invalid_selection' using errcode = 'P0001';
  end if;

  perform 1
  from public.commission_lines l
  where l.id = any (v_ids)
  order by l.id
  for update;

  if (
    select count(*) from public.commission_lines l where l.id = any (v_ids) and l.status = 'accrued'
  ) <> cardinality(v_ids) then
    raise exception 'line_not_accrued' using errcode = 'P0001';
  end if;

  update public.commission_lines
  set status = 'approved', approved_at = now(), approved_by = auth.uid()
  where id = any (v_ids);

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.reject_commission_line(p_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if char_length(v_reason) not between 1 and 500 then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  perform 1 from public.commission_lines l where l.id = p_id for update;

  if not found then
    raise exception 'line_not_found' using errcode = 'P0001';
  end if;

  update public.commission_lines
  set status = 'rejected', rejected_reason = v_reason
  where id = p_id and status = 'accrued';

  if not found then
    raise exception 'line_not_accrued' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.commission_rates_for(uuid) from public, anon, authenticated;
revoke all on function public.win_deal(uuid, numeric, numeric) from public, anon, authenticated;
revoke all on function public.cancel_recurring(uuid) from public, anon, authenticated;
revoke all on function public.approve_commission_lines(uuid[]) from public, anon, authenticated;
revoke all on function public.reject_commission_line(uuid, text) from public, anon, authenticated;

grant execute on function public.win_deal(uuid, numeric, numeric) to authenticated;
grant execute on function public.cancel_recurring(uuid) to authenticated;
grant execute on function public.approve_commission_lines(uuid[]) to authenticated;
grant execute on function public.reject_commission_line(uuid, text) to authenticated;
