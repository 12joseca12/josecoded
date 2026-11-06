create table private.chat_quota (
  scope text not null,
  key_hash text not null,
  day date not null,
  count integer not null default 0,
  primary key (scope, key_hash, day),
  constraint chat_quota_scope_valid check (scope in ('ip', 'visitor')),
  constraint chat_quota_count_positive check (count >= 0)
);

create index chat_quota_day_idx on private.chat_quota (day);

alter table private.chat_quota enable row level security;
revoke all on private.chat_quota from anon, authenticated;

create function public.visitor_send(
  p_token_hash text,
  p_body text,
  p_page_path text,
  p_locale public.app_locale,
  p_ip_hash text
)
returns table (conversation_id uuid, message_id uuid)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_body text := btrim(coalesce(p_body, ''));
  v_day date := (now() at time zone 'utc')::date;
  v_visitor public.visitors;
  v_conversation uuid;
  v_message uuid;
  v_ip_count integer;
  v_visitor_count integer;
  v_page text := nullif(btrim(coalesce(p_page_path, '')), '');
begin
  if p_token_hash is null or char_length(p_token_hash) not between 32 and 128 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if p_ip_hash is null or char_length(p_ip_hash) not between 16 and 128 then
    raise exception 'invalid_ip_hash' using errcode = 'P0001';
  end if;

  if char_length(v_body) = 0 then
    raise exception 'empty_body' using errcode = 'P0001';
  end if;

  if char_length(v_body) > 2000 then
    raise exception 'body_too_long' using errcode = 'P0001';
  end if;

  if v_page is not null and char_length(v_page) > 500 then
    v_page := left(v_page, 500);
  end if;

  if not coalesce(
    (select s.value = 'true'::jsonb from public.site_settings s where s.key = 'public_chat'),
    false
  ) then
    raise exception 'public_chat_off' using errcode = 'P0001';
  end if;

  insert into public.visitors (token_hash, locale, last_activity_at)
  values (p_token_hash, coalesce(p_locale, 'es'), clock_timestamp() - interval '1 hour')
  on conflict (token_hash) do nothing;

  select v.* into v_visitor from public.visitors v where v.token_hash = p_token_hash for update;

  if clock_timestamp() - v_visitor.last_activity_at < interval '3 seconds' then
    raise exception 'chat_quota_exceeded' using errcode = 'P0001', hint = 'burst';
  end if;

  select c.id into v_conversation
  from public.conversations c
  where c.visitor_id = v_visitor.id
    and c.status = 'open';

  if v_conversation is null and exists (
    select 1 from public.conversations c where c.visitor_id = v_visitor.id
  ) then
    raise exception 'chat_closed' using errcode = 'P0001';
  end if;

  insert into private.chat_quota as q (scope, key_hash, day, count)
  values ('ip', p_ip_hash, v_day, 1)
  on conflict (scope, key_hash, day) do update set count = q.count + 1
  returning q.count into v_ip_count;

  if v_ip_count > 60 then
    raise exception 'chat_quota_exceeded' using errcode = 'P0001', hint = 'ip';
  end if;

  insert into private.chat_quota as q (scope, key_hash, day, count)
  values ('visitor', p_token_hash, v_day, 1)
  on conflict (scope, key_hash, day) do update set count = q.count + 1
  returning q.count into v_visitor_count;

  if v_visitor_count > 20 then
    raise exception 'chat_quota_exceeded' using errcode = 'P0001', hint = 'visitor';
  end if;

  if v_conversation is null then
    insert into public.conversations (kind, visitor_id, locale, first_page_path)
    values ('visitor', v_visitor.id, coalesce(p_locale, v_visitor.locale), v_page)
    returning id into v_conversation;
  end if;

  insert into public.messages (conversation_id, author_kind, body, page_path)
  values (v_conversation, 'human', v_body, v_page)
  returning id into v_message;

  update public.visitors
  set last_activity_at = clock_timestamp(),
      locale = coalesce(p_locale, locale)
  where id = v_visitor.id;

  return query select v_conversation, v_message;
end;
$$;

create function public.visitor_thread(p_token_hash text, p_since timestamptz default null)
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_visitor public.visitors;
  v_conv public.conversations;
  v_messages jsonb;
  v_online boolean;
begin
  if p_token_hash is null or char_length(p_token_hash) not between 32 and 128 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  select exists (
    select 1 from private.heartbeat h where h.service = 'omen' and h.seen_at > now() - interval '2 minutes'
  ) into v_online;

  select v.* into v_visitor from public.visitors v where v.token_hash = p_token_hash;

  if not found then
    return jsonb_build_object(
      'messages', '[]'::jsonb,
      'nexo_online', v_online,
      'ai_enabled', true,
      'pending_reply', false,
      'handoff_done', false,
      'consent_at', null,
      'status', null
    );
  end if;

  select c.* into v_conv
  from public.conversations c
  where c.visitor_id = v_visitor.id
  order by (c.status = 'open') desc, c.created_at desc
  limit 1;

  if not found then
    return jsonb_build_object(
      'messages', '[]'::jsonb,
      'nexo_online', v_online,
      'ai_enabled', true,
      'pending_reply', false,
      'handoff_done', false,
      'consent_at', v_visitor.consent_at,
      'status', null
    );
  end if;

  select coalesce(jsonb_agg(m.j order by m.created_at, m.id), '[]'::jsonb)
  into v_messages
  from (
    select
      x.id,
      x.created_at,
      jsonb_build_object(
        'id', x.id,
        'author_kind', x.author_kind,
        'from_staff', x.author_kind = 'human' and x.author_id is not null,
        'kind', x.kind,
        'system_event', x.system_event,
        'body', x.body,
        'sources', x.sources,
        'auto', x.auto,
        'created_at', x.created_at
      ) as j
    from public.messages x
    where x.conversation_id = v_conv.id
      and (p_since is null or x.created_at > p_since)
    order by x.created_at desc, x.id desc
    limit 100
  ) m;

  return jsonb_build_object(
    'messages', v_messages,
    'nexo_online', v_online,
    'ai_enabled', v_conv.ai_enabled,
    'pending_reply', exists (
      select 1
      from private.jobs j
      where j.kind = 'chat.reply'
        and j.status in ('queued', 'running')
        and j.payload ->> 'conversation_id' = v_conv.id::text
    ),
    'handoff_done', v_visitor.lead_id is not null,
    'consent_at', v_visitor.consent_at,
    'status', v_conv.status
  );
end;
$$;

create function public.visitor_handoff(
  p_token_hash text,
  p_email text,
  p_phone text,
  p_name text,
  p_consent boolean
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_visitor public.visitors;
  v_conv public.conversations;
  v_email text := nullif(btrim(coalesce(p_email, '')), '');
  v_phone text := nullif(btrim(coalesce(p_phone, '')), '');
  v_name text := nullif(btrim(coalesce(p_name, '')), '');
  v_lead public.leads;
  v_first text;
begin
  if p_token_hash is null or char_length(p_token_hash) not between 32 and 128 then
    raise exception 'invalid_token' using errcode = 'P0001';
  end if;

  if not coalesce(p_consent, false) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;

  if v_email is null and v_phone is null then
    raise exception 'contact_required' using errcode = 'P0001';
  end if;

  if v_email is not null and (v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' or char_length(v_email) > 320) then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  if v_phone is not null and char_length(v_phone) > 40 then
    raise exception 'invalid_phone' using errcode = 'P0001';
  end if;

  if v_name is not null and char_length(v_name) > 200 then
    raise exception 'invalid_name' using errcode = 'P0001';
  end if;

  select v.* into v_visitor from public.visitors v where v.token_hash = p_token_hash for update;

  if not found then
    raise exception 'chat_not_found' using errcode = 'P0001';
  end if;

  if v_visitor.lead_id is not null then
    return v_visitor.lead_id;
  end if;

  select c.* into v_conv
  from public.conversations c
  where c.visitor_id = v_visitor.id
    and c.status = 'open';

  if not found then
    raise exception 'chat_not_found' using errcode = 'P0001';
  end if;

  select left(m.body, 1000) into v_first
  from public.messages m
  where m.conversation_id = v_conv.id
    and m.author_kind = 'human'
    and m.author_id is null
  order by m.created_at, m.id
  limit 1;

  insert into public.leads (
    source, full_name, email, phone, message, page_path, locale, consent_at, conversation_id
  )
  values (
    'nexo',
    coalesce(v_name, case v_conv.locale when 'en' then 'Visitor' else 'Visitante' end),
    v_email,
    v_phone,
    v_first,
    v_conv.first_page_path,
    v_conv.locale,
    now(),
    v_conv.id
  )
  returning * into v_lead;

  update public.visitors set lead_id = v_lead.id, consent_at = now() where id = v_visitor.id;

  update public.conversations
  set lead_id = v_lead.id,
      contact_id = v_lead.contact_id
  where id = v_conv.id;

  insert into public.messages (conversation_id, author_kind, system_event, body)
  values (v_conv.id, 'system', 'handoff_done', '');

  return v_lead.id;
end;
$$;

create function public.visitor_forget(
  p_token_hash text default null,
  p_lead_id uuid default null
)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
begin
  if p_token_hash is null and p_lead_id is null then
    raise exception 'target_required' using errcode = 'P0001';
  end if;

  delete from public.visitors v
  where (p_token_hash is not null and v.token_hash = p_token_hash)
    or (p_lead_id is not null and v.lead_id = p_lead_id);

  get diagnostics v_count = row_count;

  if p_lead_id is not null then
    delete from public.conversations c
    where c.kind = 'visitor'
      and (c.lead_id = p_lead_id or c.id in (select l.conversation_id from public.leads l where l.id = p_lead_id));
  end if;

  return v_count;
end;
$$;

create function private.purge_conversations()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_no_lead integer;
  v_with_lead integer;
  v_won integer;
  v_visitors integer;
  v_rooms integer;
  v_quota integer;
begin
  delete from public.conversations c
  where c.kind = 'visitor'
    and c.contact_id is not null
    and c.last_activity_at < now() - interval '90 days'
    and exists (
      select 1 from public.deals d where d.contact_id = c.contact_id and d.stage = 'won'
    );
  get diagnostics v_won = row_count;

  delete from public.conversations c
  where c.kind = 'visitor'
    and c.lead_id is null
    and c.last_activity_at < now() - interval '7 days';
  get diagnostics v_no_lead = row_count;

  delete from public.conversations c
  where c.kind = 'visitor'
    and c.lead_id is not null
    and c.last_activity_at < now() - interval '60 days'
    and not (
      c.contact_id is not null
      and exists (select 1 from public.deals d where d.contact_id = c.contact_id and d.stage = 'won')
    );
  get diagnostics v_with_lead = row_count;

  delete from public.visitors v
  where v.last_activity_at < now() - interval '7 days'
    and not exists (select 1 from public.conversations c where c.visitor_id = v.id);
  get diagnostics v_visitors = row_count;

  delete from public.conversations c
  where c.kind <> 'visitor'
    and c.status = 'archived'
    and c.archived_at < now() - interval '90 days';
  get diagnostics v_rooms = row_count;

  delete from private.chat_quota q where q.day < (now() at time zone 'utc')::date - 2;
  get diagnostics v_quota = row_count;

  return jsonb_build_object(
    'visitor_without_lead', v_no_lead,
    'visitor_with_lead', v_with_lead,
    'visitor_won', v_won,
    'visitors', v_visitors,
    'rooms', v_rooms,
    'quota', v_quota
  );
end;
$$;

create or replace function private.lead_activity_body(p_lead public.leads)
returns text
language sql
stable
set search_path = ''
as $$
  select nullif(
    concat_ws(
      E'\n',
      nullif(btrim(p_lead.message), ''),
      case when p_lead.offer is not null then 'Oferta: ' || p_lead.offer end,
      case
        when cardinality(p_lead.extras) > 0 then 'Extras: ' || array_to_string(p_lead.extras, ', ')
      end,
      case
        when p_lead.offer_answers is not null then 'Respuestas: ' || p_lead.offer_answers::text
      end,
      case
        when p_lead.conversation_id is not null then (
          select 'Conversación:' || E'\n' || right(
            string_agg(
              case
                when m.author_kind = 'nexo' then 'Nexo'
                when m.author_id is null then 'Visitante'
                else 'Jose'
              end || ': ' || m.body,
              E'\n' order by m.created_at, m.id
            ),
            2000
          )
          from public.messages m
          where m.conversation_id = p_lead.conversation_id
            and m.author_kind in ('human', 'nexo')
        )
      end
    ),
    ''
  )
$$;

create function private.leads_link_conversation()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.conversations c
  set contact_id = new.contact_id
  where c.id = new.conversation_id
    and c.kind = 'visitor'
    and c.contact_id is distinct from new.contact_id;

  return null;
end;
$$;

create trigger leads_link_conversation
after update of contact_id on public.leads
for each row
when (new.contact_id is not null and new.conversation_id is not null)
execute function private.leads_link_conversation();

revoke all on function public.visitor_send(text, text, text, public.app_locale, text) from public, anon, authenticated;
revoke all on function public.visitor_thread(text, timestamptz) from public, anon, authenticated;
revoke all on function public.visitor_handoff(text, text, text, text, boolean) from public, anon, authenticated;
revoke all on function public.visitor_forget(text, uuid) from public, anon, authenticated;
revoke all on function private.purge_conversations() from public, anon, authenticated;
revoke all on function private.leads_link_conversation() from public, anon, authenticated;

grant execute on function public.visitor_send(text, text, text, public.app_locale, text) to service_role;
grant execute on function public.visitor_thread(text, timestamptz) to service_role;
grant execute on function public.visitor_handoff(text, text, text, text, boolean) to service_role;
grant execute on function public.visitor_forget(text, uuid) to service_role;

do $$
begin
  if exists (select 1 from pg_available_extensions where name = 'pg_cron') then
    create extension if not exists pg_cron;

    if exists (select 1 from cron.job where jobname = 'purge-conversations') then
      perform cron.unschedule('purge-conversations');
    end if;

    perform cron.schedule('purge-conversations', '0 4 * * *', 'select private.purge_conversations()');
  end if;
end;
$$;
