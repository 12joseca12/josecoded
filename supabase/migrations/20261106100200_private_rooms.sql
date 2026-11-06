create function private.mask_excerpt(p_text text)
returns text
language sql
immutable
set search_path = ''
as $$
  select left(
    regexp_replace(
      regexp_replace(
        regexp_replace(p_text, '[^\s@]+@[^\s@]+\.[^\s@]+', '[…]', 'g'),
        '(https?://|www\.)\S+',
        '[…]',
        'gi'
      ),
      '\+?\d([\s.\-]*\d){6,}',
      '[…]',
      'g'
    ),
    140
  )
$$;

create function private.ensure_user_room(p_user uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_profile public.profiles;
  v_conversation uuid;
begin
  select p.* into v_profile
  from public.profiles p
  where p.id = p_user
    and p.is_active
    and p.archived_at is null
    and p.role in ('closer', 'freelance');

  if not found then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into public.conversations (kind, subject_user_id, locale)
  values (v_profile.role::text::public.conversation_kind, p_user, v_profile.locale)
  on conflict (subject_user_id) where kind in ('closer', 'freelance') do nothing
  returning id into v_conversation;

  if v_conversation is null then
    select c.id into v_conversation
    from public.conversations c
    where c.subject_user_id = p_user
      and c.kind in ('closer', 'freelance');
  end if;

  insert into public.conversation_members (conversation_id, user_id, role, added_by)
  values (v_conversation, p_user, v_profile.role::text::public.member_role, p_user)
  on conflict (conversation_id, user_id) do update
  set left_at = null
  where public.conversation_members.left_at is not null
    and exists (
      select 1 from public.conversations c where c.id = v_conversation and c.status = 'open'
    );

  return v_conversation;
end;
$$;

create function public.ensure_my_conversation()
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not (coalesce(private.role() in ('closer', 'freelance'), false) and private.is_staff()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return private.ensure_user_room(auth.uid());
end;
$$;

create function public.mark_read(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_conversation_member(p_conversation_id) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  update public.conversation_members m
  set last_read_at = clock_timestamp()
  where m.conversation_id = p_conversation_id
    and m.user_id = auth.uid()
    and m.left_at is null;
end;
$$;

create function public.set_ai_consent(p_conversation_id uuid, p_granted boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_conv public.conversations;
  v_granted boolean;
begin
  if p_granted is null then
    raise exception 'invalid_granted' using errcode = 'P0001';
  end if;

  if not (
    private.is_conversation_member(p_conversation_id)
    and exists (
      select 1
      from public.conversation_members m
      where m.conversation_id = p_conversation_id
        and m.user_id = v_uid
        and m.left_at is null
        and m.role = 'client'
    )
  ) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select c.* into v_conv from public.conversations c where c.id = p_conversation_id for update;

  if v_conv.kind <> 'client' then
    raise exception 'not_client_room' using errcode = 'P0001';
  end if;

  if v_conv.status <> 'open' then
    raise exception 'conversation_archived' using errcode = 'P0001';
  end if;

  v_granted := v_conv.ai_consent_at is not null and v_conv.ai_consent_revoked_at is null;

  if v_granted = p_granted then
    return;
  end if;

  if p_granted then
    update public.conversations
    set ai_consent_at = now(),
        ai_consent_by = v_uid,
        ai_consent_revoked_at = null
    where id = p_conversation_id;

    insert into public.messages (conversation_id, author_kind, system_event, body)
    values (p_conversation_id, 'system', 'consent_granted', '');
  else
    update public.conversations
    set ai_consent_revoked_at = now()
    where id = p_conversation_id;

    perform private.cancel_pending_replies(p_conversation_id, 'consent_revoked');

    insert into public.messages (conversation_id, author_kind, system_event, body)
    values (p_conversation_id, 'system', 'consent_revoked', '');
  end if;
end;
$$;

create function public.set_conversation_ai(p_conversation_id uuid, p_enabled boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations;
begin
  if not private.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if p_enabled is null then
    raise exception 'invalid_enabled' using errcode = 'P0001';
  end if;

  select c.* into v_conv from public.conversations c where c.id = p_conversation_id for update;

  if not found then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;

  if v_conv.status <> 'open' then
    raise exception 'conversation_archived' using errcode = 'P0001';
  end if;

  if v_conv.ai_enabled = p_enabled then
    return;
  end if;

  update public.conversations
  set ai_enabled = p_enabled,
      ai_off_reason = case when p_enabled then null else 'admin' end
  where id = p_conversation_id;

  if not p_enabled then
    perform private.cancel_pending_replies(p_conversation_id, 'ai_off');
  end if;

  insert into public.messages (conversation_id, author_kind, system_event, body)
  values (
    p_conversation_id,
    'system',
    case when p_enabled then 'ai_on'::public.system_event else 'ai_off'::public.system_event end,
    case when p_enabled then '' else 'admin' end
  );
end;
$$;

create function public.add_member(
  p_conversation_id uuid,
  p_user_id uuid,
  p_role public.member_role,
  p_can_write boolean default true
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations;
  v_profile public.profiles;
  v_existing public.conversation_members;
begin
  if not private.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  select c.* into v_conv from public.conversations c where c.id = p_conversation_id for update;

  if not found then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;

  if v_conv.kind = 'visitor' then
    raise exception 'visitor_room' using errcode = 'P0001';
  end if;

  if v_conv.status <> 'open' then
    raise exception 'conversation_archived' using errcode = 'P0001';
  end if;

  select p.* into v_profile
  from public.profiles p
  where p.id = p_user_id
    and p.is_active
    and p.archived_at is null;

  if not found then
    raise exception 'invalid_member' using errcode = 'P0001';
  end if;

  if p_role::text <> v_profile.role::text
    and not (p_role = 'owner' and v_profile.role = 'admin')
  then
    raise exception 'role_mismatch' using errcode = 'P0001';
  end if;

  if p_role = 'client' and v_conv.kind <> 'client' then
    raise exception 'client_outside_project' using errcode = 'P0001';
  end if;

  select m.* into v_existing
  from public.conversation_members m
  where m.conversation_id = p_conversation_id
    and m.user_id = p_user_id
  for update;

  if found and v_existing.left_at is null then
    raise exception 'already_member' using errcode = 'P0001';
  end if;

  if found then
    update public.conversation_members
    set left_at = null,
        role = p_role,
        can_write = coalesce(p_can_write, true),
        joined_at = now(),
        last_read_at = now(),
        added_by = auth.uid()
    where conversation_id = p_conversation_id
      and user_id = p_user_id;
  else
    insert into public.conversation_members (
      conversation_id, user_id, role, can_write, last_read_at, added_by
    )
    values (p_conversation_id, p_user_id, p_role, coalesce(p_can_write, true), now(), auth.uid());
  end if;

  insert into public.messages (conversation_id, author_kind, system_event, body)
  values (p_conversation_id, 'system', 'member_added', v_profile.full_name);
end;
$$;

create function public.remove_member(p_conversation_id uuid, p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_member public.conversation_members;
  v_name text;
begin
  if not private.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  select m.* into v_member
  from public.conversation_members m
  where m.conversation_id = p_conversation_id
    and m.user_id = p_user_id
    and m.left_at is null
  for update;

  if not found then
    raise exception 'member_not_found' using errcode = 'P0001';
  end if;

  if v_member.role = 'owner' then
    raise exception 'owner_cannot_leave' using errcode = 'P0001';
  end if;

  update public.conversation_members
  set left_at = now()
  where conversation_id = p_conversation_id
    and user_id = p_user_id;

  select p.full_name into v_name from public.profiles p where p.id = p_user_id;

  insert into public.messages (conversation_id, author_kind, system_event, body)
  values (p_conversation_id, 'system', 'member_left', coalesce(v_name, ''));
end;
$$;

create function private.archive_room(p_conversation_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform 1
  from public.conversations c
  where c.id = p_conversation_id
    and c.status = 'open'
  for update;

  if not found then
    return false;
  end if;

  insert into public.messages (conversation_id, author_kind, system_event, body)
  values (p_conversation_id, 'system', 'archived', '');

  update public.conversations
  set status = 'archived',
      archived_at = now()
  where id = p_conversation_id;

  perform private.cancel_pending_replies(p_conversation_id, 'archived');

  return true;
end;
$$;

create function public.archive_conversation(p_conversation_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if not exists (select 1 from public.conversations c where c.id = p_conversation_id) then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;

  perform private.archive_room(p_conversation_id);
end;
$$;

create function private.profiles_deactivate_rooms()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_room uuid;
begin
  for v_room in
    select c.id
    from public.conversations c
    where c.subject_user_id = new.id
      and c.kind in ('closer', 'freelance')
      and c.status = 'open'
  loop
    perform private.archive_room(v_room);
  end loop;

  update public.conversation_members m
  set left_at = now()
  where m.user_id = new.id
    and m.left_at is null;

  return null;
end;
$$;

create trigger profiles_deactivate_rooms
after update of is_active on public.profiles
for each row
when (old.is_active and not new.is_active)
execute function private.profiles_deactivate_rooms();

create trigger conversations_audit_update
after update on public.conversations
for each row
when (
  old.ai_enabled is distinct from new.ai_enabled
  or old.ai_consent_at is distinct from new.ai_consent_at
  or old.ai_consent_revoked_at is distinct from new.ai_consent_revoked_at
  or old.status is distinct from new.status
)
execute function private.audit();

create view public.my_conversations
with (security_invoker = true)
as
select
  c.id,
  c.kind,
  c.status,
  c.last_activity_at,
  (
    select private.mask_excerpt(lm.body)
    from public.messages lm
    where lm.conversation_id = c.id
      and lm.author_kind <> 'system'
    order by lm.created_at desc, lm.id desc
    limit 1
  ) as last_message_excerpt,
  (
    select count(*)
    from public.messages um
    where um.conversation_id = c.id
      and um.author_kind <> 'system'
      and um.author_id is distinct from (select auth.uid())
      and (me.last_read_at is null or um.created_at > me.last_read_at)
  )::integer as unread_count,
  private.ai_active(c.id) as ai_active,
  c.ai_enabled,
  case
    when c.kind <> 'client' then 'n/a'
    when c.ai_consent_at is not null and c.ai_consent_revoked_at is null then 'granted'
    when c.ai_consent_revoked_at is not null then 'revoked'
    else 'pending'
  end as consent_state,
  (
    select sp.full_name
    from public.profiles sp
    where sp.id = c.subject_user_id
  ) as counterpart_name,
  c.first_page_path,
  c.project_id
from public.conversations c
left join public.conversation_members me
  on me.conversation_id = c.id
  and me.user_id = (select auth.uid())
  and me.left_at is null;

create function public.list_room_members(p_conversation_id uuid)
returns table (
  user_id uuid,
  role public.member_role,
  full_name text,
  can_write boolean,
  joined_at timestamptz,
  left_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_admin() or private.is_conversation_member(p_conversation_id)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select m.user_id, m.role, p.full_name, m.can_write, m.joined_at, m.left_at
  from public.conversation_members m
  join public.profiles p on p.id = m.user_id
  where m.conversation_id = p_conversation_id
    and (m.left_at is null or private.is_admin())
  order by m.joined_at, m.user_id;
end;
$$;

create or replace function public.accept_invitation(
  p_token text,
  p_full_name text,
  p_locale public.app_locale default 'es'
)
returns public.user_role
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  v_row public.invitations;
begin
  if v_uid is null then
    raise exception 'not_authenticated' using errcode = '42501';
  end if;

  select i.* into v_row
  from public.invitations i
  where i.token_hash = private.hash_invitation_token(p_token)
  for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if v_row.accepted_at is not null then
    raise exception 'invitation_used' using errcode = 'P0001';
  end if;

  if v_row.revoked_at is not null then
    raise exception 'invitation_revoked' using errcode = 'P0001';
  end if;

  if v_row.expires_at <= now() then
    raise exception 'invitation_expired' using errcode = 'P0001';
  end if;

  if v_email = '' or v_email <> lower(v_row.email::text)
    or (v_row.auth_user_id is not null and v_row.auth_user_id <> v_uid)
  then
    raise exception 'invitation_email_mismatch' using errcode = 'P0001';
  end if;

  if char_length(btrim(coalesce(p_full_name, ''))) not between 1 and 200 then
    raise exception 'invalid_full_name' using errcode = 'P0001';
  end if;

  if exists (select 1 from public.profiles p where p.id = v_uid) then
    raise exception 'profile_exists' using errcode = 'P0001';
  end if;

  insert into public.profiles (
    id, role, full_name, locale, parent_closer_id, closer_rate, parent_rate,
    closer_recurring_rate, parent_recurring_rate, payout_cadence, invited_by
  )
  values (
    v_uid, v_row.role, btrim(p_full_name), coalesce(p_locale, 'es'), v_row.parent_closer_id,
    v_row.closer_rate, v_row.parent_rate, v_row.closer_recurring_rate, v_row.parent_recurring_rate,
    v_row.payout_cadence, v_row.invited_by
  );

  if v_row.role in ('closer', 'freelance') then
    perform private.ensure_user_room(v_uid);
  end if;

  update public.invitations
  set accepted_at = now(),
      auth_user_id = v_uid
  where id = v_row.id;

  if v_row.invited_by is not null then
    perform private.notify(
      v_row.invited_by,
      'invitation_accepted',
      btrim(p_full_name),
      v_row.role::text,
      '/admin/usuarios'
    );
  end if;

  return v_row.role;
end;
$$;

revoke all on function private.mask_excerpt(text) from public, anon, authenticated;
revoke all on function private.ensure_user_room(uuid) from public, anon, authenticated;
revoke all on function private.archive_room(uuid) from public, anon, authenticated;
revoke all on function private.profiles_deactivate_rooms() from public, anon, authenticated;

revoke all on function public.ensure_my_conversation() from public, anon, authenticated;
revoke all on function public.mark_read(uuid) from public, anon, authenticated;
revoke all on function public.set_ai_consent(uuid, boolean) from public, anon, authenticated;
revoke all on function public.set_conversation_ai(uuid, boolean) from public, anon, authenticated;
revoke all on function public.add_member(uuid, uuid, public.member_role, boolean) from public, anon, authenticated;
revoke all on function public.remove_member(uuid, uuid) from public, anon, authenticated;
revoke all on function public.archive_conversation(uuid) from public, anon, authenticated;
revoke all on function public.list_room_members(uuid) from public, anon, authenticated;
revoke all on public.my_conversations from anon, authenticated;

grant execute on function private.mask_excerpt(text) to authenticated;
grant execute on function public.ensure_my_conversation() to authenticated;
grant execute on function public.mark_read(uuid) to authenticated;
grant execute on function public.set_ai_consent(uuid, boolean) to authenticated;
grant execute on function public.set_conversation_ai(uuid, boolean) to authenticated;
grant execute on function public.add_member(uuid, uuid, public.member_role, boolean) to authenticated;
grant execute on function public.remove_member(uuid, uuid) to authenticated;
grant execute on function public.archive_conversation(uuid) to authenticated;
grant execute on function public.list_room_members(uuid) to authenticated;
grant select on public.my_conversations to authenticated;
