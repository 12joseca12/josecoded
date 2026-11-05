drop function private.notify(uuid, public.notification_event, text, text, text);

create function private.notify(
  p_user_id uuid,
  p_event public.notification_event,
  p_title text,
  p_body text default null,
  p_href text default null,
  p_telegram boolean default true,
  p_email boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_pref public.notification_prefs;
  v_email text;
  v_chat bigint;
  v_payload jsonb;
begin
  select p.* into v_profile
  from public.profiles p
  where p.id = p_user_id
    and p.is_active
    and p.archived_at is null;

  if not found then
    return;
  end if;

  select np.* into v_pref
  from public.notification_prefs np
  where np.user_id = p_user_id
    and np.event = p_event;

  if not found then
    v_pref.telegram := true;
    v_pref.email := true;
    v_pref.bell := true;
  end if;

  v_payload := jsonb_build_object(
    'event', p_event,
    'title', p_title,
    'body', p_body,
    'href', p_href,
    'locale', v_profile.locale
  );

  if v_pref.bell then
    insert into public.notifications (user_id, event, title, body, href)
    values (p_user_id, p_event, p_title, p_body, p_href);
  end if;

  if v_pref.email and p_email then
    select u.email::text into v_email from auth.users u where u.id = p_user_id;

    if v_email is not null then
      insert into private.outbox (channel, recipient, template, payload)
      values ('email', v_email, 'notification', v_payload);
    end if;
  end if;

  if v_pref.telegram and p_telegram then
    select tl.chat_id into v_chat from private.telegram_links tl where tl.user_id = p_user_id;

    if v_chat is not null then
      insert into private.outbox (channel, recipient, template, payload)
      values ('telegram', v_chat::text, 'notification', v_payload);
    end if;
  end if;
end;
$$;

revoke all on function private.notify(uuid, public.notification_event, text, text, text, boolean, boolean)
from public, anon, authenticated;

create function private.messages_notify()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations;
  v_author text;
  v_excerpt text;
  v_nexo_up boolean;
  v_telegram_for_owner boolean;
  v_member record;
  v_href text;
begin
  select c.* into v_conv from public.conversations c where c.id = new.conversation_id;

  v_excerpt := private.mask_excerpt(new.body);

  if new.author_id is not null then
    select p.full_name into v_author from public.profiles p where p.id = new.author_id;
  else
    v_author := case v_conv.locale when 'en' then 'Visitor' else 'Visitante' end;
  end if;

  v_nexo_up := private.ai_active(v_conv.id)
    and exists (
      select 1 from private.heartbeat h where h.service = 'omen' and h.seen_at > now() - interval '2 minutes'
    );

  v_telegram_for_owner := v_conv.kind <> 'visitor'
    or not v_nexo_up
    or v_conv.lead_id is not null
    or coalesce(v_conv.interest, false);

  for v_member in
    select m.user_id, m.role, p.role as profile_role
    from public.conversation_members m
    join public.profiles p on p.id = m.user_id
    where m.conversation_id = new.conversation_id
      and m.left_at is null
      and m.user_id is distinct from new.author_id
      and p.role in ('admin', 'closer', 'freelance')
  loop
    v_href := case v_member.profile_role
      when 'admin' then '/admin/chat/' || v_conv.id::text
      when 'closer' then '/crm/chat?sala=' || v_conv.id::text
      else '/freelance/chat?sala=' || v_conv.id::text
    end;

    perform private.notify(
      v_member.user_id,
      'message_new',
      coalesce(v_author, ''),
      v_excerpt,
      v_href,
      v_member.role <> 'owner' or v_telegram_for_owner,
      false
    );
  end loop;

  return null;
end;
$$;

create trigger messages_notify
after insert on public.messages
for each row
when (new.author_kind = 'human')
execute function private.messages_notify();

revoke all on function private.messages_notify() from public, anon, authenticated;

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
    0
  );
end;
$$;

drop function public.crm_counters();

create function public.crm_counters()
returns table (
  inbox_new integer,
  actions_overdue integer,
  actions_today integer,
  deals_new integer,
  deals_contacted integer,
  deals_meeting integer,
  deals_proposal integer,
  unread_threads integer
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
    d.deals_proposal,
    (
      select count(*)::integer
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

revoke all on function public.admin_counters() from public, anon, authenticated;
grant execute on function public.admin_counters() to authenticated;
revoke all on function public.crm_counters() from public, anon, authenticated;
grant execute on function public.crm_counters() to authenticated;
