create type public.payout_status as enum ('draft', 'issued', 'paid');

create table public.payouts (
  id uuid primary key default gen_random_uuid(),
  beneficiary_id uuid not null references public.profiles (id) on delete restrict,
  period_start date not null,
  period_end date not null,
  cadence public.payout_cadence not null,
  total numeric(12, 2) not null,
  withholding_rate numeric(5, 2) not null default 0,
  net_total numeric(12, 2) not null,
  status public.payout_status not null default 'draft',
  statement_note text,
  closer_invoice_path text,
  issued_at timestamptz,
  paid_at date,
  paid_reference text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payouts_period_order check (period_end >= period_start),
  constraint payouts_total_not_negative check (total >= 0 and net_total >= 0 and net_total <= total),
  constraint payouts_withholding_range check (withholding_rate between 0 and 100),
  constraint payouts_note_length check (char_length(statement_note) <= 1000),
  constraint payouts_reference_length check (char_length(paid_reference) between 1 and 200),
  constraint payouts_paid_consistent check ((status = 'paid') = (paid_at is not null and paid_reference is not null)),
  constraint payouts_issued_consistent check ((status = 'draft') = (issued_at is null)),
  constraint payouts_invoice_path_shape check (
    closer_invoice_path is null
    or closer_invoice_path ~ '^payouts/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$'
  )
);

create index payouts_beneficiary_id_idx on public.payouts (beneficiary_id, period_start desc);
create index payouts_created_by_idx on public.payouts (created_by);
create index payouts_status_idx on public.payouts (status);

alter table public.commission_lines
  add constraint commission_lines_payout_id_fkey
  foreign key (payout_id) references public.payouts (id) on delete restrict;

alter table public.payouts enable row level security;
revoke all on public.payouts from anon, authenticated;
grant select on public.payouts to authenticated;

create policy payouts_select
on public.payouts
for select
to authenticated
using (
  (select private.is_admin())
  or (
    (select private.is_staff())
    and status <> 'draft'
    and (
      beneficiary_id = (select private.uid())
      or exists (
        select 1
        from public.profiles b
        where b.id = payouts.beneficiary_id
          and b.parent_closer_id = (select private.uid())
      )
    )
  )
);

create trigger payouts_audit
after insert or update or delete on public.payouts
for each row execute function private.audit();

create function public.build_payout(
  p_beneficiary_id uuid,
  p_period_start date,
  p_period_end date,
  p_withholding_rate numeric default 0,
  p_note text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_cadence public.payout_cadence;
  v_total numeric(12, 2);
  v_withholding numeric(12, 2);
  v_count integer;
  v_note text := nullif(btrim(coalesce(p_note, '')), '');
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select p.* into v_profile from public.profiles p where p.id = p_beneficiary_id;

  if not found or v_profile.role <> 'closer' then
    raise exception 'invalid_beneficiary' using errcode = 'P0001';
  end if;

  if p_period_start is null or p_period_end is null or p_period_end < p_period_start
    or p_period_end - p_period_start > 366
  then
    raise exception 'invalid_period' using errcode = 'P0001';
  end if;

  if p_withholding_rate is null or p_withholding_rate < 0 or p_withholding_rate > 100
    or p_withholding_rate <> round(p_withholding_rate, 2)
  then
    raise exception 'invalid_withholding' using errcode = 'P0001';
  end if;

  if v_note is not null and char_length(v_note) > 1000 then
    raise exception 'invalid_note' using errcode = 'P0001';
  end if;

  v_cadence := v_profile.payout_cadence;

  if v_cadence is null then
    select (s.value #>> '{}')::public.payout_cadence into v_cadence
    from public.site_settings s
    where s.key = 'payout.default_cadence';
  end if;

  v_cadence := coalesce(v_cadence, 'biweekly');

  perform 1
  from public.commission_lines l
  join public.payments p on p.id = l.payment_id
  where l.beneficiary_id = p_beneficiary_id
    and l.status = 'approved'
    and l.payout_id is null
    and p.received_at between p_period_start and p_period_end
  order by l.id
  for update of l;

  select coalesce(sum(l.amount), 0), count(*)
  into v_total, v_count
  from public.commission_lines l
  join public.payments p on p.id = l.payment_id
  where l.beneficiary_id = p_beneficiary_id
    and l.status = 'approved'
    and l.payout_id is null
    and p.received_at between p_period_start and p_period_end;

  if v_count = 0 then
    raise exception 'no_lines_in_period' using errcode = 'P0001';
  end if;

  if v_total < 0 then
    raise exception 'negative_total' using errcode = 'P0001';
  end if;

  v_withholding := round(v_total * p_withholding_rate / 100, 2);

  insert into public.payouts (
    beneficiary_id, period_start, period_end, cadence, total, withholding_rate, net_total, statement_note, created_by
  )
  values (
    p_beneficiary_id, p_period_start, p_period_end, v_cadence, v_total, p_withholding_rate,
    v_total - v_withholding, v_note, auth.uid()
  )
  returning id into v_id;

  update public.commission_lines l
  set payout_id = v_id
  from public.payments p
  where p.id = l.payment_id
    and l.beneficiary_id = p_beneficiary_id
    and l.status = 'approved'
    and l.payout_id is null
    and p.received_at between p_period_start and p_period_end;

  return v_id;
end;
$$;

create function public.set_payout_status(
  p_id uuid,
  p_status public.payout_status,
  p_paid_at date default null,
  p_reference text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts;
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select p.* into v_payout from public.payouts p where p.id = p_id for update;

  if not found then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;

  if p_status = 'issued' and v_payout.status = 'draft' then
    update public.payouts set status = 'issued', issued_at = now() where id = p_id;
  elsif p_status = 'paid' and v_payout.status = 'issued' then
    if p_paid_at is null then
      raise exception 'paid_at_required' using errcode = 'P0001';
    end if;

    if p_paid_at > (now() at time zone 'Europe/Madrid')::date then
      raise exception 'future_date' using errcode = 'P0001';
    end if;

    if v_reference is null or char_length(v_reference) > 200 then
      raise exception 'reference_required' using errcode = 'P0001';
    end if;

    update public.payouts
    set status = 'paid', paid_at = p_paid_at, paid_reference = v_reference
    where id = p_id;

    update public.commission_lines set status = 'paid' where payout_id = p_id and status = 'approved';
  else
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;
end;
$$;

create function public.delete_payout_draft(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_payout public.payouts;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select p.* into v_payout from public.payouts p where p.id = p_id for update;

  if not found then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;

  if v_payout.status <> 'draft' then
    raise exception 'payout_not_draft' using errcode = 'P0001';
  end if;

  update public.commission_lines set payout_id = null where payout_id = p_id;
  delete from public.payouts where id = p_id;
end;
$$;

create function public.set_payout_invoice(p_id uuid, p_path text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  begin
    update public.payouts set closer_invoice_path = p_path where id = p_id;
  exception
    when check_violation then
      raise exception 'invalid_path' using errcode = 'P0001';
  end;

  if not found then
    raise exception 'payout_not_found' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.admin_users()
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
    (
      select coalesce(sum(l.amount), 0)
      from public.commission_lines l
      where l.beneficiary_id = p.id and l.status = 'accrued'
    )
  from public.profiles p
  left join auth.users u on u.id = p.id
  order by (p.is_active and p.archived_at is null) desc, p.role, p.full_name, p.id;
end;
$$;

create or replace function public.admin_counters()
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
    (select count(*) from public.profiles p where p.is_active and p.archived_at is null),
    'accrued_pending_count',
    (select count(*) from public.commission_lines l where l.status = 'accrued'),
    'accrued_pending_amount',
    (select coalesce(sum(l.amount), 0) from public.commission_lines l where l.status = 'accrued'),
    'payments_overdue',
    (
      select count(*)
      from public.payment_schedule s
      where s.status in ('scheduled', 'proforma_sent', 'invoiced')
        and s.due_at < (now() at time zone 'Europe/Madrid')::date
    ),
    'proformas_unpaid',
    (select count(*) from public.invoices i where i.kind = 'proforma' and i.status = 'sent'),
    'payouts_draft',
    (select count(*) from public.payouts p where p.status = 'draft'),
    'jobs_failed',
    (select count(*) from private.jobs j where j.status = 'failed')
  );
end;
$$;

revoke all on function public.build_payout(uuid, date, date, numeric, text) from public, anon, authenticated;
revoke all on function public.set_payout_status(uuid, public.payout_status, date, text) from public, anon, authenticated;
revoke all on function public.delete_payout_draft(uuid) from public, anon, authenticated;
revoke all on function public.set_payout_invoice(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_users() from public, anon, authenticated;
revoke all on function public.admin_counters() from public, anon, authenticated;

grant execute on function public.build_payout(uuid, date, date, numeric, text) to authenticated;
grant execute on function public.set_payout_status(uuid, public.payout_status, date, text) to authenticated;
grant execute on function public.delete_payout_draft(uuid) to authenticated;
grant execute on function public.set_payout_invoice(uuid, text) to authenticated;
grant execute on function public.admin_users() to authenticated;
grant execute on function public.admin_counters() to authenticated;
