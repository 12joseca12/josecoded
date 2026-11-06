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
    (select count(*) from public.stories s where s.status = 'proposed')
  );
end;
$$;

revoke all on function public.admin_counters() from public, anon, authenticated;
grant execute on function public.admin_counters() to authenticated;
