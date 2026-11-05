create function public.crm_counters()
returns table (
  inbox_new integer,
  actions_overdue integer,
  actions_today integer,
  deals_new integer,
  deals_contacted integer,
  deals_meeting integer,
  deals_proposal integer
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_now timestamptz := now();
  v_tomorrow timestamptz := (
    (date_trunc('day', v_now at time zone 'Europe/Madrid') + interval '1 day')
    at time zone 'Europe/Madrid'
  );
begin
  if not (private.is_closer() or private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    (select count(*)::integer from public.list_lead_inbox()),
    (
      select count(*)::integer
      from public.contacts c
      where c.archived_at is null
        and c.next_action_at is not null
        and c.next_action_at < v_now
    ),
    (
      select count(*)::integer
      from public.contacts c
      where c.archived_at is null
        and c.next_action_at >= v_now
        and c.next_action_at < v_tomorrow
    ),
    d.deals_new,
    d.deals_contacted,
    d.deals_meeting,
    d.deals_proposal
  from (
    select
      (count(*) filter (where dl.stage = 'new'))::integer as deals_new,
      (count(*) filter (where dl.stage = 'contacted'))::integer as deals_contacted,
      (count(*) filter (where dl.stage = 'meeting'))::integer as deals_meeting,
      (count(*) filter (where dl.stage = 'proposal'))::integer as deals_proposal
    from public.deals dl
    join public.contacts c on c.id = dl.contact_id
    where c.archived_at is null
  ) d;
end;
$$;

revoke all on function public.crm_counters() from public, anon, authenticated;
grant execute on function public.crm_counters() to authenticated;
