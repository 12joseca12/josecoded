create type public.payout_kind as enum ('commission', 'freelance');

alter table public.payouts
  add column kind public.payout_kind not null default 'commission';

alter table public.freelance_fee_items
  add constraint freelance_fee_items_payout_id_fkey
  foreign key (payout_id) references public.payouts (id) on delete restrict;

create or replace function public.build_payout(
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
  v_kind public.payout_kind;
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

  if not found or v_profile.role not in ('closer', 'freelance') then
    raise exception 'invalid_beneficiary' using errcode = 'P0001';
  end if;

  v_kind := case when v_profile.role = 'freelance' then 'freelance' else 'commission' end;

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

  if v_kind = 'commission' then
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
  else
    perform 1
    from public.freelance_fee_items i
    join public.freelance_fees f on f.id = i.fee_id
    where f.freelance_id = p_beneficiary_id
      and i.status = 'approved'
      and i.payout_id is null
      and i.worked_on between p_period_start and p_period_end
    order by i.id
    for update of i;

    select coalesce(sum(i.amount), 0), count(*)
    into v_total, v_count
    from public.freelance_fee_items i
    join public.freelance_fees f on f.id = i.fee_id
    where f.freelance_id = p_beneficiary_id
      and i.status = 'approved'
      and i.payout_id is null
      and i.worked_on between p_period_start and p_period_end;
  end if;

  if v_count = 0 then
    raise exception 'no_lines_in_period' using errcode = 'P0001';
  end if;

  if v_total < 0 then
    raise exception 'negative_total' using errcode = 'P0001';
  end if;

  v_withholding := round(v_total * p_withholding_rate / 100, 2);

  insert into public.payouts (
    beneficiary_id, period_start, period_end, cadence, total, withholding_rate, net_total, statement_note,
    created_by, kind
  )
  values (
    p_beneficiary_id, p_period_start, p_period_end, v_cadence, v_total, p_withholding_rate,
    v_total - v_withholding, v_note, auth.uid(), v_kind
  )
  returning id into v_id;

  if v_kind = 'commission' then
    update public.commission_lines l
    set payout_id = v_id
    from public.payments p
    where p.id = l.payment_id
      and l.beneficiary_id = p_beneficiary_id
      and l.status = 'approved'
      and l.payout_id is null
      and p.received_at between p_period_start and p_period_end;
  else
    update public.freelance_fee_items i
    set payout_id = v_id
    from public.freelance_fees f
    where f.id = i.fee_id
      and f.freelance_id = p_beneficiary_id
      and i.status = 'approved'
      and i.payout_id is null
      and i.worked_on between p_period_start and p_period_end;
  end if;

  return v_id;
end;
$$;

create or replace function public.set_payout_status(
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
    update public.freelance_fee_items set status = 'paid' where payout_id = p_id and status = 'approved';
  else
    raise exception 'invalid_transition' using errcode = 'P0001';
  end if;
end;
$$;

create or replace function public.delete_payout_draft(p_id uuid)
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
  update public.freelance_fee_items set payout_id = null where payout_id = p_id;
  delete from public.payouts where id = p_id;
end;
$$;

create or replace function private.payouts_notify_paid()
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
    case new.kind when 'freelance' then '/freelance/pagos' else '/crm/comisiones' end
  );

  return null;
end;
$$;

create function public.freelance_counters()
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if private.role() is distinct from 'freelance' or not private.is_aal2() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return jsonb_build_object(
    'projects_active',
    (
      select count(*)
      from public.projects p
      where p.freelance_id = auth.uid() and p.archived_at is null and p.status = 'active'
    ),
    'tasks_pending',
    (
      select count(*)
      from public.tasks t
      join public.projects p on p.id = t.project_id
      where t.assignee_id = auth.uid() and t.status <> 'done' and p.freelance_id = auth.uid() and p.archived_at is null
    ),
    'fees_pending_amount',
    (
      select coalesce(sum(i.amount), 0)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      where f.freelance_id = auth.uid() and i.status in ('pending', 'delivered')
    ),
    'fees_owed_amount',
    (
      select coalesce(sum(i.amount), 0)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      where f.freelance_id = auth.uid() and i.status = 'approved'
    ),
    'fees_paid_amount',
    (
      select coalesce(sum(i.amount), 0)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      where f.freelance_id = auth.uid() and i.status = 'paid'
    ),
    'fees_paid_year_amount',
    (
      select coalesce(sum(i.amount), 0)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      join public.payouts po on po.id = i.payout_id
      where f.freelance_id = auth.uid()
        and i.status = 'paid'
        and extract(year from po.paid_at) = extract(year from (now() at time zone 'Europe/Madrid')::date)
    ),
    'last_paid_at',
    (
      select max(po.paid_at)
      from public.payouts po
      where po.beneficiary_id = auth.uid() and po.kind = 'freelance' and po.status = 'paid'
    ),
    'items_to_deliver',
    (
      select count(*)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      where f.freelance_id = auth.uid()
        and f.closed_at is null
        and f.mode in ('milestones', 'fixed')
        and i.status = 'pending'
    ),
    'unread_threads',
    (
      select count(*)
      from public.conversation_members me
      join public.conversations c on c.id = me.conversation_id
      where me.user_id = auth.uid()
        and me.left_at is null
        and c.status = 'open'
        and exists (
          select 1
          from public.messages m
          where m.conversation_id = c.id
            and m.author_kind <> 'system'
            and m.author_id is distinct from me.user_id
            and (me.last_read_at is null or m.created_at > me.last_read_at)
        )
    )
  );
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
    (select count(*) from private.jobs j where j.status = 'failed'),
    'unread_threads',
    (
      select count(*)
      from public.conversation_members me
      join public.conversations c on c.id = me.conversation_id
      where me.user_id = auth.uid()
        and me.left_at is null
        and c.status = 'open'
        and exists (
          select 1
          from public.messages m
          where m.conversation_id = c.id
            and m.author_kind <> 'system'
            and m.author_id is distinct from me.user_id
            and (me.last_read_at is null or m.created_at > me.last_read_at)
        )
    ),
    'stories_to_decide',
    (select count(*) from public.stories s where s.status = 'proposed'),
    'fee_items_pending',
    (
      select count(*)
      from public.freelance_fee_items i
      join public.freelance_fees f on f.id = i.fee_id
      where (f.mode = 'hourly' and i.status = 'pending')
         or (f.mode in ('milestones', 'fixed') and i.status = 'delivered')
    ),
    'fees_approved_unpaid_amount',
    (select coalesce(sum(i.amount), 0) from public.freelance_fee_items i where i.status = 'approved')
  );
end;
$$;

revoke all on function public.build_payout(uuid, date, date, numeric, text) from public, anon, authenticated;
revoke all on function public.set_payout_status(uuid, public.payout_status, date, text) from public, anon, authenticated;
revoke all on function public.delete_payout_draft(uuid) from public, anon, authenticated;
revoke all on function private.payouts_notify_paid() from public, anon, authenticated;
revoke all on function public.freelance_counters() from public, anon, authenticated;
revoke all on function public.admin_counters() from public, anon, authenticated;

grant execute on function public.build_payout(uuid, date, date, numeric, text) to authenticated;
grant execute on function public.set_payout_status(uuid, public.payout_status, date, text) to authenticated;
grant execute on function public.delete_payout_draft(uuid) to authenticated;
grant execute on function public.freelance_counters() to authenticated;
grant execute on function public.admin_counters() to authenticated;
