create type public.schedule_kind as enum ('milestone', 'recurring');
create type public.schedule_status as enum ('scheduled', 'proforma_sent', 'invoiced', 'paid', 'cancelled');
create type public.invoice_kind as enum ('proforma', 'invoice');
create type public.invoice_status as enum ('draft', 'sent', 'paid', 'void');
create type public.payment_kind as enum ('payment', 'refund');
create type public.payment_method as enum ('transfer', 'card', 'stripe', 'other');

create table private.counters (
  key text primary key,
  value integer not null default 0,
  constraint counters_value_positive check (value >= 0)
);

alter table private.counters enable row level security;
revoke all on private.counters from anon, authenticated;

create table public.payment_schedule (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete restrict,
  label text not null,
  kind public.schedule_kind not null default 'milestone',
  percent numeric(5, 2),
  amount numeric(12, 2) not null,
  due_at date,
  status public.schedule_status not null default 'scheduled',
  sort integer not null default 0,
  created_at timestamptz not null default now(),
  constraint payment_schedule_label_length check (char_length(btrim(label)) between 1 and 120),
  constraint payment_schedule_percent_range check (percent between 0 and 100),
  constraint payment_schedule_amount_positive check (amount > 0)
);

create index payment_schedule_deal_id_idx on public.payment_schedule (deal_id, sort);
create index payment_schedule_due_idx on public.payment_schedule (due_at) where status in ('scheduled', 'proforma_sent', 'invoiced');

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete restrict,
  schedule_id uuid references public.payment_schedule (id) on delete restrict,
  kind public.invoice_kind not null,
  number text not null,
  issued_at date not null,
  amount_net numeric(12, 2) not null,
  vat_rate numeric(5, 2) not null,
  vat_amount numeric(12, 2) not null,
  amount_gross numeric(12, 2) not null,
  pdf_path text,
  status public.invoice_status not null default 'sent',
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint invoices_kind_number_key unique (kind, number),
  constraint invoices_number_length check (char_length(number) between 1 and 60),
  constraint invoices_proforma_number check ((kind = 'proforma') = (number like 'PF-%')),
  constraint invoices_amounts_valid check (
    amount_net > 0
    and vat_rate between 0 and 100
    and vat_amount >= 0
    and amount_gross = amount_net + vat_amount
  ),
  constraint invoices_pdf_path_shape check (
    pdf_path is null
    or (kind = 'invoice' and pdf_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.pdf$')
  )
);

create index invoices_deal_id_idx on public.invoices (deal_id);
create index invoices_schedule_id_idx on public.invoices (schedule_id);
create index invoices_created_by_idx on public.invoices (created_by);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  deal_id uuid not null references public.deals (id) on delete restrict,
  schedule_id uuid references public.payment_schedule (id) on delete restrict,
  invoice_id uuid references public.invoices (id) on delete restrict,
  kind public.payment_kind not null default 'payment',
  nature public.commission_nature not null,
  amount_net numeric(12, 2) not null,
  received_at date not null,
  method public.payment_method not null,
  reference text,
  recorded_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint payments_amount_positive check (amount_net > 0),
  constraint payments_reference_length check (char_length(reference) <= 200)
);

create index payments_deal_id_idx on public.payments (deal_id, received_at);
create index payments_schedule_id_idx on public.payments (schedule_id);
create index payments_invoice_id_idx on public.payments (invoice_id);
create index payments_recorded_by_idx on public.payments (recorded_by);

alter table public.commission_lines
  add constraint commission_lines_payment_id_fkey
  foreign key (payment_id) references public.payments (id) on delete restrict;

alter table public.payment_schedule enable row level security;
alter table public.invoices enable row level security;
alter table public.payments enable row level security;

revoke all on public.payment_schedule from anon, authenticated;
revoke all on public.invoices from anon, authenticated;
revoke all on public.payments from anon, authenticated;

grant select on public.payment_schedule to authenticated;
grant select on public.invoices to authenticated;
grant select on public.payments to authenticated;

create policy payment_schedule_select
on public.payment_schedule
for select
to authenticated
using (
  (select private.is_admin())
  or exists (
    select 1
    from public.deals d
    where d.id = payment_schedule.deal_id
      and private.owns_contact(d.contact_id)
  )
);

create policy invoices_select
on public.invoices
for select
to authenticated
using ((select private.is_admin()));

create policy payments_select
on public.payments
for select
to authenticated
using ((select private.is_admin()));

create trigger payment_schedule_audit
after insert or update or delete on public.payment_schedule
for each row execute function private.audit();

create trigger invoices_audit
after insert or update on public.invoices
for each row execute function private.audit();

create trigger payments_audit
after insert on public.payments
for each row execute function private.audit();

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('billing', 'billing', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy billing_select_admin
on storage.objects
for select
to authenticated
using (bucket_id = 'billing' and (select private.is_admin()));

create function private.accrue_commission(p_payment public.payments)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_commission public.commissions;
  v_deal public.deals;
  v_sign integer := case when p_payment.kind = 'refund' then -1 else 1 end;
  v_eligible boolean;
  v_count integer := 0;
  v_closer_rate numeric;
  v_sub_rate numeric;
begin
  select c.* into v_commission from public.commissions c where c.deal_id = p_payment.deal_id;

  if not found then
    return 0;
  end if;

  select d.* into v_deal from public.deals d where d.id = p_payment.deal_id;

  if p_payment.nature = 'recurring' then
    if p_payment.kind = 'refund' then
      v_eligible := v_deal.recurring_started_at is not null;
    else
      v_eligible := v_deal.recurring_started_at is not null
        and p_payment.received_at < (v_deal.recurring_started_at + interval '12 months')::date
        and (v_deal.recurring_cancelled_at is null or p_payment.received_at <= v_deal.recurring_cancelled_at);
    end if;

    v_closer_rate := v_commission.closer_recurring_rate;
    v_sub_rate := v_commission.subcloser_recurring_rate;
  else
    v_eligible := true;
    v_closer_rate := v_commission.closer_rate;
    v_sub_rate := v_commission.subcloser_rate;
  end if;

  if not v_eligible then
    return 0;
  end if;

  if coalesce(v_closer_rate, 0) > 0 then
    insert into public.commission_lines (
      commission_id, payment_id, beneficiary_id, role, nature, rate, base, amount
    )
    values (
      v_commission.id,
      p_payment.id,
      v_commission.closer_id,
      case when v_commission.subcloser_id is null then 'closer'::public.commission_role else 'parent'::public.commission_role end,
      p_payment.nature,
      v_closer_rate,
      v_sign * p_payment.amount_net,
      v_sign * round(p_payment.amount_net * v_closer_rate / 100, 2)
    );

    v_count := v_count + 1;
  end if;

  if v_commission.subcloser_id is not null and coalesce(v_sub_rate, 0) > 0 then
    insert into public.commission_lines (
      commission_id, payment_id, beneficiary_id, role, nature, rate, base, amount
    )
    values (
      v_commission.id,
      p_payment.id,
      v_commission.subcloser_id,
      'closer',
      p_payment.nature,
      v_sub_rate,
      v_sign * p_payment.amount_net,
      v_sign * round(p_payment.amount_net * v_sub_rate / 100, 2)
    );

    v_count := v_count + 1;
  end if;

  return v_count;
end;
$$;

create function private.payments_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schedule public.payment_schedule;
  v_invoice public.invoices;
  v_net numeric;
begin
  if new.kind = 'payment' and new.nature = 'recurring' then
    update public.deals
    set recurring_started_at = new.received_at
    where id = new.deal_id
      and recurring_started_at is null;
  end if;

  perform private.accrue_commission(new);

  if new.schedule_id is not null then
    select s.* into v_schedule from public.payment_schedule s where s.id = new.schedule_id for update;

    select coalesce(sum(case p.kind when 'payment' then p.amount_net else -p.amount_net end), 0)
    into v_net
    from public.payments p
    where p.schedule_id = new.schedule_id;

    if v_schedule.status <> 'cancelled' then
      if v_net >= v_schedule.amount then
        update public.payment_schedule set status = 'paid' where id = v_schedule.id and status <> 'paid';
      elsif v_schedule.status = 'paid' then
        update public.payment_schedule
        set status = case
          when exists (
            select 1 from public.invoices i
            where i.schedule_id = v_schedule.id and i.kind = 'invoice' and i.status <> 'void'
          ) then 'invoiced'::public.schedule_status
          when exists (
            select 1 from public.invoices i
            where i.schedule_id = v_schedule.id and i.kind = 'proforma' and i.status <> 'void'
          ) then 'proforma_sent'::public.schedule_status
          else 'scheduled'::public.schedule_status
        end
        where id = v_schedule.id;
      end if;
    end if;
  end if;

  if new.invoice_id is not null then
    select i.* into v_invoice from public.invoices i where i.id = new.invoice_id for update;

    select coalesce(sum(case p.kind when 'payment' then p.amount_net else -p.amount_net end), 0)
    into v_net
    from public.payments p
    where p.invoice_id = new.invoice_id;

    if v_invoice.status <> 'void' then
      if v_net >= v_invoice.amount_net then
        update public.invoices set status = 'paid' where id = v_invoice.id and status <> 'paid';
      elsif v_invoice.status = 'paid' then
        update public.invoices set status = 'sent' where id = v_invoice.id;
      end if;
    end if;
  end if;

  return null;
end;
$$;

create trigger payments_after_insert
after insert on public.payments
for each row execute function private.payments_after_insert();

create type private.schedule_item_input as (
  idx integer,
  label text,
  kind text,
  percent numeric,
  amount numeric,
  due_at date
);

create function public.set_payment_schedule(p_deal_id uuid, p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deals;
  v_items private.schedule_item_input[];
  v_kept numeric;
  v_new numeric;
  v_milestones integer;
  v_count integer;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select d.* into v_deal from public.deals d where d.id = p_deal_id for update;

  if not found then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  if v_deal.stage <> 'won' then
    raise exception 'deal_not_won' using errcode = 'P0001';
  end if;

  if p_items is null or jsonb_typeof(p_items) <> 'array'
    or jsonb_array_length(p_items) not between 1 and 24
  then
    raise exception 'invalid_schedule' using errcode = 'P0001';
  end if;

  begin
    select array_agg(
      row(
        e.pos::integer,
        btrim(e.item ->> 'label'),
        coalesce(e.item ->> 'kind', 'milestone'),
        (e.item ->> 'percent')::numeric,
        (e.item ->> 'amount')::numeric,
        (e.item ->> 'due_at')::date
      )::private.schedule_item_input
      order by e.pos
    )
    into v_items
    from jsonb_array_elements(p_items) with ordinality as e (item, pos);
  exception
    when invalid_text_representation or datetime_field_overflow or invalid_datetime_format
      or numeric_value_out_of_range then
      raise exception 'invalid_schedule' using errcode = 'P0001';
  end;

  if exists (
    select 1 from unnest(v_items) i
    where i.label is null
      or char_length(i.label) not between 1 and 120
      or i.kind not in ('milestone', 'recurring')
      or i.amount is null
      or i.amount <= 0
      or i.amount >= 10000000000
      or i.amount <> round(i.amount, 2)
      or (i.percent is not null and i.percent not between 0 and 100)
  ) then
    raise exception 'invalid_schedule' using errcode = 'P0001';
  end if;

  delete from public.payment_schedule s
  where s.deal_id = p_deal_id
    and s.status = 'scheduled'
    and not exists (select 1 from public.payments p where p.schedule_id = s.id)
    and not exists (select 1 from public.invoices i where i.schedule_id = s.id and i.status <> 'void');

  select coalesce(sum(s.amount), 0), count(*)
  into v_kept, v_milestones
  from public.payment_schedule s
  where s.deal_id = p_deal_id and s.kind = 'milestone' and s.status <> 'cancelled';

  select coalesce(sum(i.amount), 0), v_milestones + count(*)
  into v_new, v_milestones
  from unnest(v_items) i
  where i.kind = 'milestone';

  if v_milestones > 0 and v_kept + v_new <> v_deal.won_amount then
    raise exception 'schedule_total_mismatch' using errcode = 'P0001';
  end if;

  insert into public.payment_schedule (deal_id, label, kind, percent, amount, due_at, sort)
  select p_deal_id, i.label, i.kind::public.schedule_kind, i.percent, i.amount, i.due_at, i.idx
  from unnest(v_items) i
  order by i.idx;

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create function public.issue_proforma(p_schedule_id uuid, p_vat_rate numeric default null)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schedule public.payment_schedule;
  v_vat numeric;
  v_year text := to_char(now() at time zone 'Europe/Madrid', 'YYYY');
  v_n integer;
  v_vat_amount numeric(12, 2);
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select s.* into v_schedule from public.payment_schedule s where s.id = p_schedule_id for update;

  if not found then
    raise exception 'schedule_not_found' using errcode = 'P0001';
  end if;

  if v_schedule.status = 'proforma_sent' then
    raise exception 'proforma_already_issued' using errcode = 'P0001';
  end if;

  if v_schedule.status <> 'scheduled' then
    raise exception 'schedule_not_issuable' using errcode = 'P0001';
  end if;

  v_vat := p_vat_rate;

  if v_vat is null then
    select (s.value #>> '{}')::numeric into v_vat from public.site_settings s where s.key = 'billing.vat_rate';
    v_vat := coalesce(v_vat, 0);
  end if;

  if v_vat < 0 or v_vat > 100 or v_vat <> round(v_vat, 2) then
    raise exception 'invalid_vat' using errcode = 'P0001';
  end if;

  insert into private.counters as c (key, value)
  values ('proforma-' || v_year, 1)
  on conflict (key) do update set value = c.value + 1
  returning c.value into v_n;

  v_vat_amount := round(v_schedule.amount * v_vat / 100, 2);

  insert into public.invoices (
    deal_id, schedule_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross, status, created_by
  )
  values (
    v_schedule.deal_id, v_schedule.id, 'proforma',
    'PF-' || v_year || '-' || lpad(v_n::text, 3, '0'),
    (now() at time zone 'Europe/Madrid')::date,
    v_schedule.amount, v_vat, v_vat_amount, v_schedule.amount + v_vat_amount, 'sent', auth.uid()
  )
  returning id into v_id;

  update public.payment_schedule set status = 'proforma_sent' where id = v_schedule.id;

  return v_id;
end;
$$;

create function public.record_invoice(
  p_deal_id uuid,
  p_number text,
  p_issued_at date,
  p_net numeric,
  p_vat_rate numeric,
  p_schedule_id uuid default null,
  p_pdf_path text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deals;
  v_schedule public.payment_schedule;
  v_number text := btrim(coalesce(p_number, ''));
  v_vat_amount numeric(12, 2);
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select d.* into v_deal from public.deals d where d.id = p_deal_id;

  if not found then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  if char_length(v_number) not between 1 and 60 then
    raise exception 'invalid_invoice_number' using errcode = 'P0001';
  end if;

  if upper(v_number) like 'PF-%' then
    raise exception 'invoice_number_reserved' using errcode = 'P0001';
  end if;

  if p_issued_at is null or p_net is null or p_net <= 0 or p_net >= 10000000000 or p_net <> round(p_net, 2) then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  if p_vat_rate is null or p_vat_rate < 0 or p_vat_rate > 100 or p_vat_rate <> round(p_vat_rate, 2) then
    raise exception 'invalid_vat' using errcode = 'P0001';
  end if;

  if p_schedule_id is not null then
    select s.* into v_schedule from public.payment_schedule s where s.id = p_schedule_id for update;

    if not found or v_schedule.deal_id <> p_deal_id then
      raise exception 'schedule_mismatch' using errcode = 'P0001';
    end if;

    if v_schedule.status = 'cancelled' then
      raise exception 'schedule_cancelled' using errcode = 'P0001';
    end if;
  end if;

  v_vat_amount := round(p_net * p_vat_rate / 100, 2);

  begin
    insert into public.invoices (
      deal_id, schedule_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross, pdf_path, status, created_by
    )
    values (
      p_deal_id, p_schedule_id, 'invoice', v_number, p_issued_at, p_net, p_vat_rate, v_vat_amount,
      p_net + v_vat_amount, p_pdf_path, 'sent', auth.uid()
    )
    returning id into v_id;
  exception
    when unique_violation then
      raise exception 'invoice_number_taken' using errcode = 'P0001';
    when check_violation then
      raise exception 'invalid_invoice' using errcode = 'P0001';
  end;

  if p_schedule_id is not null and v_schedule.status in ('scheduled', 'proforma_sent') then
    update public.payment_schedule set status = 'invoiced' where id = p_schedule_id;
  end if;

  return v_id;
end;
$$;

create function public.record_payment(
  p_deal_id uuid,
  p_kind public.payment_kind,
  p_nature public.commission_nature,
  p_amount_net numeric,
  p_received_at date,
  p_method public.payment_method,
  p_schedule_id uuid default null,
  p_invoice_id uuid default null,
  p_reference text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_deal public.deals;
  v_schedule public.payment_schedule;
  v_invoice public.invoices;
  v_paid numeric;
  v_refunded numeric;
  v_reference text := nullif(btrim(coalesce(p_reference, '')), '');
  v_id uuid;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select d.* into v_deal from public.deals d where d.id = p_deal_id for update;

  if not found then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  if v_deal.stage <> 'won' then
    raise exception 'deal_not_won' using errcode = 'P0001';
  end if;

  if p_kind is null or p_nature is null or p_method is null or p_received_at is null then
    raise exception 'invalid_payment' using errcode = 'P0001';
  end if;

  if p_amount_net is null or p_amount_net <= 0 or p_amount_net >= 10000000000 or p_amount_net <> round(p_amount_net, 2) then
    raise exception 'invalid_amount' using errcode = 'P0001';
  end if;

  if p_received_at > (now() at time zone 'Europe/Madrid')::date then
    raise exception 'future_date' using errcode = 'P0001';
  end if;

  if v_reference is not null and char_length(v_reference) > 200 then
    raise exception 'invalid_payment' using errcode = 'P0001';
  end if;

  if p_nature = 'recurring' and v_deal.recurring_monthly is null then
    raise exception 'no_recurring' using errcode = 'P0001';
  end if;

  if p_schedule_id is not null then
    select s.* into v_schedule from public.payment_schedule s where s.id = p_schedule_id for update;

    if not found or v_schedule.deal_id <> p_deal_id then
      raise exception 'schedule_mismatch' using errcode = 'P0001';
    end if;

    if v_schedule.status = 'cancelled' then
      raise exception 'schedule_cancelled' using errcode = 'P0001';
    end if;

    if (v_schedule.kind = 'milestone') <> (p_nature = 'project') then
      raise exception 'nature_mismatch' using errcode = 'P0001';
    end if;
  end if;

  if p_invoice_id is not null then
    select i.* into v_invoice from public.invoices i where i.id = p_invoice_id;

    if not found or v_invoice.deal_id <> p_deal_id then
      raise exception 'invoice_mismatch' using errcode = 'P0001';
    end if;

    if v_invoice.status = 'void' then
      raise exception 'invoice_void' using errcode = 'P0001';
    end if;
  end if;

  select
    coalesce(sum(p.amount_net) filter (where p.kind = 'payment'), 0),
    coalesce(sum(p.amount_net) filter (where p.kind = 'refund'), 0)
  into v_paid, v_refunded
  from public.payments p
  where p.deal_id = p_deal_id
    and p.nature = p_nature
    and (p_schedule_id is null or p.schedule_id = p_schedule_id);

  if p_kind = 'payment' then
    if p_schedule_id is not null and v_paid - v_refunded + p_amount_net > v_schedule.amount then
      raise exception 'payment_exceeds_schedule' using errcode = 'P0001';
    end if;

    if p_schedule_id is null and p_nature = 'project' and v_paid - v_refunded + p_amount_net > v_deal.won_amount then
      raise exception 'payment_exceeds_deal' using errcode = 'P0001';
    end if;
  elsif v_refunded + p_amount_net > v_paid then
    raise exception 'refund_exceeds_paid' using errcode = 'P0001';
  end if;

  insert into public.payments (
    deal_id, schedule_id, invoice_id, kind, nature, amount_net, received_at, method, reference, recorded_by
  )
  values (
    p_deal_id, p_schedule_id, p_invoice_id, p_kind, p_nature, p_amount_net, p_received_at, p_method, v_reference, auth.uid()
  )
  returning id into v_id;

  return v_id;
end;
$$;

create function public.cancel_schedule_item(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_schedule public.payment_schedule;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select s.* into v_schedule from public.payment_schedule s where s.id = p_id for update;

  if not found then
    raise exception 'schedule_not_found' using errcode = 'P0001';
  end if;

  if v_schedule.status in ('paid', 'cancelled') or exists (
    select 1 from public.payments p where p.schedule_id = p_id
  ) then
    raise exception 'schedule_has_payments' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from public.invoices i where i.schedule_id = p_id and i.kind = 'invoice' and i.status <> 'void'
  ) then
    raise exception 'schedule_has_invoice' using errcode = 'P0001';
  end if;

  update public.invoices set status = 'void' where schedule_id = p_id and kind = 'proforma' and status <> 'void';
  update public.payment_schedule set status = 'cancelled' where id = p_id;
end;
$$;

create function public.void_invoice(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_invoice public.invoices;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select i.* into v_invoice from public.invoices i where i.id = p_id for update;

  if not found then
    raise exception 'invoice_not_found' using errcode = 'P0001';
  end if;

  if v_invoice.status in ('paid', 'void') then
    raise exception 'invoice_not_voidable' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.payments p where p.invoice_id = p_id) then
    raise exception 'invoice_has_payments' using errcode = 'P0001';
  end if;

  update public.invoices set status = 'void' where id = p_id;

  if v_invoice.schedule_id is not null then
    update public.payment_schedule s
    set status = case
      when exists (
        select 1 from public.invoices i
        where i.schedule_id = s.id and i.kind = 'invoice' and i.status <> 'void'
      ) then 'invoiced'::public.schedule_status
      when exists (
        select 1 from public.invoices i
        where i.schedule_id = s.id and i.kind = 'proforma' and i.status <> 'void'
      ) then 'proforma_sent'::public.schedule_status
      else 'scheduled'::public.schedule_status
    end
    where s.id = v_invoice.schedule_id
      and s.status in ('proforma_sent', 'invoiced');
  end if;
end;
$$;

create function public.deal_payments(p_deal_id uuid)
returns table (
  id uuid,
  schedule_id uuid,
  kind public.payment_kind,
  nature public.commission_nature,
  amount_net numeric,
  received_at date,
  method public.payment_method,
  reference text
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_admin boolean := private.is_admin();
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not v_admin and not exists (
    select 1
    from public.deals d
    where d.id = p_deal_id and private.owns_contact(d.contact_id)
  ) then
    raise exception 'deal_not_found' using errcode = 'P0001';
  end if;

  return query
  select
    p.id,
    p.schedule_id,
    p.kind,
    p.nature,
    p.amount_net,
    p.received_at,
    case when v_admin then p.method end,
    case when v_admin then p.reference end
  from public.payments p
  where p.deal_id = p_deal_id
  order by p.received_at desc, p.created_at desc, p.id;
end;
$$;

revoke all on function private.accrue_commission(public.payments) from public, anon, authenticated;
revoke all on function private.payments_after_insert() from public, anon, authenticated;
revoke all on function public.set_payment_schedule(uuid, jsonb) from public, anon, authenticated;
revoke all on function public.issue_proforma(uuid, numeric) from public, anon, authenticated;
revoke all on function public.record_invoice(uuid, text, date, numeric, numeric, uuid, text) from public, anon, authenticated;
revoke all on function public.record_payment(uuid, public.payment_kind, public.commission_nature, numeric, date, public.payment_method, uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.cancel_schedule_item(uuid) from public, anon, authenticated;
revoke all on function public.void_invoice(uuid) from public, anon, authenticated;
revoke all on function public.deal_payments(uuid) from public, anon, authenticated;

grant execute on function public.set_payment_schedule(uuid, jsonb) to authenticated;
grant execute on function public.issue_proforma(uuid, numeric) to authenticated;
grant execute on function public.record_invoice(uuid, text, date, numeric, numeric, uuid, text) to authenticated;
grant execute on function public.record_payment(uuid, public.payment_kind, public.commission_nature, numeric, date, public.payment_method, uuid, uuid, text) to authenticated;
grant execute on function public.cancel_schedule_item(uuid) to authenticated;
grant execute on function public.void_invoice(uuid) to authenticated;
grant execute on function public.deal_payments(uuid) to authenticated;
