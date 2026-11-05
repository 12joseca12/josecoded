alter table public.payment_schedule
  add column overdue_notified_at timestamptz;

create function private.commission_lines_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_name text;
begin
  if new.amount <= 0 then
    return null;
  end if;

  select c.full_name into v_name
  from public.commissions m
  join public.deals d on d.id = m.deal_id
  join public.contacts c on c.id = d.contact_id
  where m.id = new.commission_id;

  perform private.notify(
    new.beneficiary_id,
    'commission_accrued',
    coalesce(v_name, '-'),
    'EUR ' || to_char(new.amount, 'FM999999990.00'),
    '/crm/comisiones'
  );

  return null;
end;
$$;

create trigger commission_lines_notify
after insert on public.commission_lines
for each row execute function private.commission_lines_notify();

create function private.payments_notify_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
  v_total numeric;
  v_name text;
begin
  select coalesce(sum(l.amount), 0) into v_total
  from public.commission_lines l
  where l.payment_id = new.id;

  if v_total <= 0 then
    return null;
  end if;

  select p.id into v_admin
  from public.profiles p
  where p.role = 'admin' and p.is_active and p.archived_at is null
  limit 1;

  if v_admin is null then
    return null;
  end if;

  select c.full_name into v_name
  from public.deals d
  join public.contacts c on c.id = d.contact_id
  where d.id = new.deal_id;

  perform private.notify(
    v_admin,
    'commission_accrued',
    coalesce(v_name, '-'),
    'EUR ' || to_char(v_total, 'FM999999990.00'),
    '/crm/comisiones'
  );

  return null;
end;
$$;

create trigger payments_notify_admin
after insert on public.payments
for each row execute function private.payments_notify_admin();

create function private.payouts_notify_paid()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.notify(
    new.beneficiary_id,
    'payout_paid',
    to_char(new.period_start, 'YYYY-MM-DD') || ' / ' || to_char(new.period_end, 'YYYY-MM-DD'),
    'EUR ' || to_char(new.net_total, 'FM999999990.00'),
    '/crm/comisiones'
  );

  return null;
end;
$$;

create trigger payouts_notify_paid
after update on public.payouts
for each row
when (old.status is distinct from 'paid' and new.status = 'paid')
execute function private.payouts_notify_paid();

create function public.payments_notify_overdue()
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
  v_today date := (now() at time zone 'Europe/Madrid')::date;
  v_count integer := 0;
  v_item record;
begin
  select p.id into v_admin
  from public.profiles p
  where p.role = 'admin' and p.is_active and p.archived_at is null
  limit 1;

  if v_admin is null then
    return 0;
  end if;

  for v_item in
    select s.id, s.label, s.amount, c.full_name
    from public.payment_schedule s
    join public.deals d on d.id = s.deal_id
    join public.contacts c on c.id = d.contact_id
    where s.status in ('scheduled', 'proforma_sent', 'invoiced')
      and s.due_at < v_today
      and s.overdue_notified_at is null
    order by s.due_at, s.id
    for update of s skip locked
  loop
    perform private.notify(
      v_admin,
      'payment_overdue',
      v_item.full_name,
      v_item.label || ' · EUR ' || to_char(v_item.amount, 'FM999999990.00'),
      '/admin/cobros'
    );

    update public.payment_schedule set overdue_notified_at = now() where id = v_item.id;
    v_count := v_count + 1;
  end loop;

  return v_count;
end;
$$;

revoke all on function private.commission_lines_notify() from public, anon, authenticated;
revoke all on function private.payments_notify_admin() from public, anon, authenticated;
revoke all on function private.payouts_notify_paid() from public, anon, authenticated;
revoke all on function public.payments_notify_overdue() from public, anon, authenticated;

grant execute on function public.payments_notify_overdue() to service_role;
