create type public.notification_event as enum (
  'lead_new',
  'lead_claimed',
  'message_new',
  'commission_accrued',
  'payment_recorded',
  'payment_overdue',
  'payout_paid',
  'job_failed',
  'omen_down',
  'invitation_accepted'
);

create type public.outbox_channel as enum ('email', 'telegram');
create type public.outbox_status as enum ('queued', 'sending', 'sent', 'failed');

create table private.outbox (
  id bigint generated always as identity primary key,
  channel public.outbox_channel not null,
  recipient text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status public.outbox_status not null default 'queued',
  attempts integer not null default 0,
  last_error text,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  constraint outbox_recipient_length check (char_length(recipient) between 1 and 320),
  constraint outbox_template_shape check (template ~ '^[a-z][a-z0-9_]{0,63}$'),
  constraint outbox_attempts_positive check (attempts >= 0),
  constraint outbox_last_error_length check (char_length(last_error) <= 1000)
);

create index outbox_status_created_at_idx on private.outbox (status, created_at);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  event public.notification_event not null,
  title text not null,
  body text,
  href text,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint notifications_title_length check (char_length(title) between 1 and 200),
  constraint notifications_body_length check (char_length(body) <= 1000),
  constraint notifications_href_shape check (href is null or (href ~ '^/[^/]' and char_length(href) <= 500))
);

create index notifications_user_id_created_at_idx on public.notifications (user_id, created_at desc);
create index notifications_user_id_unread_idx on public.notifications (user_id) where read_at is null;

create table public.notification_prefs (
  user_id uuid not null references public.profiles (id) on delete cascade,
  event public.notification_event not null,
  telegram boolean not null default true,
  email boolean not null default true,
  bell boolean not null default true,
  primary key (user_id, event)
);

create table private.telegram_links (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  chat_id bigint not null unique,
  linked_at timestamptz not null default now()
);

create table private.telegram_codes (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  code text not null unique,
  expires_at timestamptz not null,
  constraint telegram_codes_code_shape check (code ~ '^[A-Z2-9]{6}$')
);

alter table private.outbox enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_prefs enable row level security;
alter table private.telegram_links enable row level security;
alter table private.telegram_codes enable row level security;

revoke all on private.outbox from anon, authenticated;
revoke all on public.notifications from anon, authenticated;
revoke all on public.notification_prefs from anon, authenticated;
revoke all on private.telegram_links from anon, authenticated;
revoke all on private.telegram_codes from anon, authenticated;

grant select on public.notifications to authenticated;
grant select on public.notification_prefs to authenticated;

create policy notifications_select
on public.notifications
for select
to authenticated
using (user_id = (select private.uid()) and (select private.is_staff()));

create policy notification_prefs_select
on public.notification_prefs
for select
to authenticated
using (
  (user_id = (select private.uid()) and (select private.is_staff()))
  or (select private.is_admin())
);

create function private.notify(
  p_user_id uuid,
  p_event public.notification_event,
  p_title text,
  p_body text default null,
  p_href text default null
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

  if v_pref.email then
    select u.email::text into v_email from auth.users u where u.id = p_user_id;

    if v_email is not null then
      insert into private.outbox (channel, recipient, template, payload)
      values ('email', v_email, 'notification', v_payload);
    end if;
  end if;

  if v_pref.telegram then
    select tl.chat_id into v_chat from private.telegram_links tl where tl.user_id = p_user_id;

    if v_chat is not null then
      insert into private.outbox (channel, recipient, template, payload)
      values ('telegram', v_chat::text, 'notification', v_payload);
    end if;
  end if;
end;
$$;

create function private.leads_notify_new()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_admin uuid;
  v_inbox text;
  v_href text := '/admin/interesados/' || new.id::text;
begin
  if new.source in ('form', 'nexo') then
    v_inbox := case new.via
      when 'freelance' then 'freelance@josecoded.com'
      when 'project' then 'proyectos@josecoded.com'
      else 'hola@josecoded.com'
    end;

    insert into private.outbox (channel, recipient, template, payload)
    values (
      'email',
      v_inbox,
      'lead_new',
      jsonb_build_object(
        'lead_id', new.id,
        'via', new.via,
        'source', new.source,
        'full_name', new.full_name,
        'organization', new.organization
      )
    );
  end if;

  select p.id into v_admin
  from public.profiles p
  where p.role = 'admin'
    and p.is_active
    and p.archived_at is null
  limit 1;

  if v_admin is not null and new.assigned_to is distinct from v_admin then
    perform private.notify(v_admin, 'lead_new', new.full_name, new.via::text, v_href);
  end if;

  if new.assigned_to is not null then
    perform private.notify(new.assigned_to, 'lead_claimed', new.full_name, new.via::text, v_href);
  end if;

  return null;
end;
$$;

create trigger leads_notify_new
after insert on public.leads
for each row execute function private.leads_notify_new();

create function public.telegram_link_code()
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_bytes bytea;
  v_code text;
  v_try integer := 0;
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  loop
    v_bytes := uuid_send(gen_random_uuid());
    v_code := '';

    for i in 0..5 loop
      v_code := v_code || substr(v_alphabet, (get_byte(v_bytes, i) % 32) + 1, 1);
    end loop;

    begin
      insert into private.telegram_codes as c (user_id, code, expires_at)
      values (v_uid, v_code, now() + interval '15 minutes')
      on conflict (user_id) do update set code = excluded.code, expires_at = excluded.expires_at;

      return v_code;
    exception
      when unique_violation then
        v_try := v_try + 1;

        if v_try >= 5 then
          raise exception 'code_generation_failed' using errcode = 'P0001';
        end if;
    end;
  end loop;
end;
$$;

create function public.telegram_unlink()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  delete from private.telegram_codes where user_id = v_uid;

  if exists (select 1 from private.telegram_links where user_id = v_uid) then
    delete from private.telegram_links where user_id = v_uid;

    insert into private.audit_log (actor_id, table_name, row_id, action, before)
    values (v_uid, 'telegram_links', v_uid, 'delete', jsonb_build_object('linked', true));
  end if;
end;
$$;

create function public.telegram_confirm_link(p_code text, p_chat_id bigint)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user uuid;
begin
  select c.user_id into v_user
  from private.telegram_codes c
  where c.code = upper(btrim(p_code))
    and c.expires_at > now()
  for update;

  if not found then
    raise exception 'code_invalid_or_expired' using errcode = 'P0001';
  end if;

  if exists (
    select 1 from private.telegram_links tl where tl.chat_id = p_chat_id and tl.user_id <> v_user
  ) then
    raise exception 'chat_already_linked' using errcode = 'P0001';
  end if;

  insert into private.telegram_links as tl (user_id, chat_id)
  values (v_user, p_chat_id)
  on conflict (user_id) do update set chat_id = excluded.chat_id, linked_at = now();

  delete from private.telegram_codes where user_id = v_user;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (v_user, 'telegram_links', v_user, 'insert', jsonb_build_object('linked', true));

  return v_user;
end;
$$;

create function public.set_notification_pref(
  p_event public.notification_event,
  p_channel text,
  p_enabled boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_channel not in ('telegram', 'email', 'bell') then
    raise exception 'invalid_channel' using errcode = 'P0001';
  end if;

  if p_enabled is null then
    raise exception 'invalid_enabled' using errcode = 'P0001';
  end if;

  insert into public.notification_prefs as np (user_id, event, telegram, email, bell)
  values (
    v_uid,
    p_event,
    case when p_channel = 'telegram' then p_enabled else true end,
    case when p_channel = 'email' then p_enabled else true end,
    case when p_channel = 'bell' then p_enabled else true end
  )
  on conflict (user_id, event) do update
  set telegram = case when p_channel = 'telegram' then p_enabled else np.telegram end,
      email = case when p_channel = 'email' then p_enabled else np.email end,
      bell = case when p_channel = 'bell' then p_enabled else np.bell end;
end;
$$;

create function public.send_test_notification(p_channel text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_locale public.app_locale;
  v_recipient text;
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select p.locale into v_locale from public.profiles p where p.id = v_uid;

  if p_channel = 'email' then
    select u.email::text into v_recipient from auth.users u where u.id = v_uid;
  elsif p_channel = 'telegram' then
    select tl.chat_id::text into v_recipient from private.telegram_links tl where tl.user_id = v_uid;

    if v_recipient is null then
      raise exception 'telegram_not_linked' using errcode = 'P0001';
    end if;
  else
    raise exception 'invalid_channel' using errcode = 'P0001';
  end if;

  insert into private.outbox (channel, recipient, template, payload)
  values (p_channel::public.outbox_channel, v_recipient, 'test', jsonb_build_object('locale', v_locale));
end;
$$;

create function public.mark_notifications_read(p_ids uuid[])
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.notifications n
  set read_at = now()
  where n.user_id = auth.uid()
    and n.id = any (p_ids)
    and n.read_at is null;

  get diagnostics v_count = row_count;

  return v_count;
end;
$$;

create function public.outbox_claim(p_limit integer default 20)
returns table (
  id bigint,
  channel public.outbox_channel,
  recipient text,
  template text,
  payload jsonb,
  attempts integer
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_limit is null or p_limit not between 1 and 100 then
    raise exception 'invalid_limit' using errcode = 'P0001';
  end if;

  return query
  with picked as (
    select o.id
    from private.outbox o
    where o.status = 'queued'
      or (o.status = 'sending' and o.locked_at < now() - interval '10 minutes')
    order by o.created_at, o.id
    limit p_limit
    for update skip locked
  )
  update private.outbox o
  set status = 'sending',
      locked_at = now()
  from picked
  where o.id = picked.id
  returning o.id, o.channel, o.recipient, o.template, o.payload, o.attempts;
end;
$$;

create function public.outbox_mark(p_id bigint, p_ok boolean, p_error text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if p_ok then
    update private.outbox
    set status = 'sent',
        sent_at = now(),
        locked_at = null,
        last_error = null
    where id = p_id
      and status = 'sending';
  else
    update private.outbox
    set attempts = attempts + 1,
        status = case when attempts + 1 >= 5 then 'failed'::public.outbox_status else 'queued'::public.outbox_status end,
        last_error = left(coalesce(p_error, 'unknown'), 1000),
        locked_at = null
    where id = p_id
      and status = 'sending';
  end if;

  if not found then
    raise exception 'outbox_item_not_sending' using errcode = 'P0001';
  end if;
end;
$$;

revoke all on function private.notify(uuid, public.notification_event, text, text, text) from public, anon, authenticated;
revoke all on function private.leads_notify_new() from public, anon, authenticated;

revoke all on function public.telegram_link_code() from public, anon, authenticated;
revoke all on function public.telegram_unlink() from public, anon, authenticated;
revoke all on function public.telegram_confirm_link(text, bigint) from public, anon, authenticated;
revoke all on function public.set_notification_pref(public.notification_event, text, boolean) from public, anon, authenticated;
revoke all on function public.send_test_notification(text) from public, anon, authenticated;
revoke all on function public.mark_notifications_read(uuid[]) from public, anon, authenticated;
revoke all on function public.outbox_claim(integer) from public, anon, authenticated;
revoke all on function public.outbox_mark(bigint, boolean, text) from public, anon, authenticated;

grant execute on function public.telegram_link_code() to authenticated;
grant execute on function public.telegram_unlink() to authenticated;
grant execute on function public.set_notification_pref(public.notification_event, text, boolean) to authenticated;
grant execute on function public.send_test_notification(text) to authenticated;
grant execute on function public.mark_notifications_read(uuid[]) to authenticated;

grant execute on function public.telegram_confirm_link(text, bigint) to service_role;
grant execute on function public.outbox_claim(integer) to service_role;
grant execute on function public.outbox_mark(bigint, boolean, text) to service_role;
