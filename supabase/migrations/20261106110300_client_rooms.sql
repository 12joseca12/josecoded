alter table public.conversations
  add constraint conversations_project_id_fkey
  foreign key (project_id) references public.projects (id) on delete cascade;

create function private.sync_project_room(p_project_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation public.conversations;
  v_client uuid;
  v_closer uuid;
  v_member record;
  v_changed integer;
begin
  select c.* into v_conversation
  from public.conversations c
  where c.project_id = p_project_id
    and c.kind = 'client'
  for update;

  if not found or v_conversation.status <> 'open' then
    return;
  end if;

  select p.id into v_client
  from public.projects pr
  join public.profiles p on p.id = pr.client_id
  where pr.id = p_project_id
    and p.role = 'client'
    and p.is_active
    and p.archived_at is null;

  select p.id into v_closer
  from public.projects pr
  join public.deals d on d.id = pr.deal_id
  join public.profiles p on p.id = d.owner_id
  where pr.id = p_project_id
    and p.role = 'closer'
    and p.is_active
    and p.archived_at is null;

  for v_member in
    select m.user_id, p.full_name
    from public.conversation_members m
    join public.profiles p on p.id = m.user_id
    where m.conversation_id = v_conversation.id
      and m.left_at is null
      and m.role in ('client', 'closer')
      and m.user_id is distinct from v_client
      and m.user_id is distinct from v_closer
  loop
    update public.conversation_members
    set left_at = now()
    where conversation_id = v_conversation.id
      and user_id = v_member.user_id;

    insert into public.messages (conversation_id, author_kind, system_event, body)
    values (v_conversation.id, 'system', 'member_left', v_member.full_name);
  end loop;

  for v_member in
    select w.user_id, w.role, p.full_name
    from (values (v_client, 'client'::public.member_role), (v_closer, 'closer'::public.member_role))
      as w (user_id, role)
    join public.profiles p on p.id = w.user_id
    where w.user_id is not null
  loop
    insert into public.conversation_members (conversation_id, user_id, role, last_read_at)
    values (v_conversation.id, v_member.user_id, v_member.role, now())
    on conflict (conversation_id, user_id) do update
    set left_at = null,
        role = excluded.role,
        joined_at = now(),
        last_read_at = now()
    where public.conversation_members.left_at is not null;

    get diagnostics v_changed = row_count;

    if v_changed > 0 then
      insert into public.messages (conversation_id, author_kind, system_event, body)
      values (v_conversation.id, 'system', 'member_added', v_member.full_name);
    end if;
  end loop;
end;
$$;

create function private.ensure_project_room(p_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation uuid;
  v_locale public.app_locale;
begin
  select coalesce(p.locale, 'es') into v_locale
  from public.projects pr
  left join public.profiles p on p.id = pr.client_id
  where pr.id = p_project_id;

  if not found then
    raise exception 'project_not_found' using errcode = 'P0001';
  end if;

  insert into public.conversations (kind, project_id, locale)
  values ('client', p_project_id, v_locale)
  on conflict (project_id) where kind = 'client' do nothing
  returning id into v_conversation;

  if v_conversation is null then
    select c.id into v_conversation
    from public.conversations c
    where c.project_id = p_project_id
      and c.kind = 'client';
  end if;

  perform private.sync_project_room(p_project_id);

  return v_conversation;
end;
$$;

create function public.ensure_project_conversation(p_project_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return private.ensure_project_room(p_project_id);
end;
$$;

create function private.projects_room_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.ensure_project_room(new.id);
  return null;
end;
$$;

create trigger projects_room_after_insert
after insert on public.projects
for each row execute function private.projects_room_after_insert();

create function private.projects_room_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conversation uuid;
begin
  select c.id into v_conversation
  from public.conversations c
  where c.project_id = new.id
    and c.kind = 'client';

  if v_conversation is null then
    perform private.ensure_project_room(new.id);
    return null;
  end if;

  if new.archived_at is not null and old.archived_at is null then
    perform private.archive_room(v_conversation);
    return null;
  end if;

  if new.archived_at is null and old.archived_at is not null then
    update public.conversations
    set status = 'open',
        archived_at = null
    where id = v_conversation;
  end if;

  perform private.sync_project_room(new.id);

  return null;
end;
$$;

create trigger projects_room_after_update
after update of client_id, deal_id, archived_at on public.projects
for each row
when (
  old.client_id is distinct from new.client_id
  or old.deal_id is distinct from new.deal_id
  or old.archived_at is distinct from new.archived_at
)
execute function private.projects_room_after_update();

create function private.deals_room_after_update()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_project uuid;
begin
  for v_project in
    select pr.id from public.projects pr where pr.deal_id = new.id
  loop
    perform private.sync_project_room(v_project);
  end loop;

  return null;
end;
$$;

create trigger deals_room_after_update
after update of owner_id on public.deals
for each row
when (old.owner_id is distinct from new.owner_id)
execute function private.deals_room_after_update();

insert into public.conversations (kind, project_id, locale)
select 'client', pr.id, coalesce(p.locale, 'es')
from public.projects pr
left join public.profiles p on p.id = pr.client_id
on conflict (project_id) where kind = 'client' do nothing;

select private.sync_project_room(pr.id) from public.projects pr;

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

  if v_row.role = 'client' and v_row.project_id is not null then
    update public.projects
    set client_id = v_uid
    where id = v_row.project_id
      and client_id is null
      and archived_at is null;
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

create function public.omen_conversation_context(p_job_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.jobs;
  v_conversation public.conversations;
  v_consent text;
  v_result jsonb;
  v_project public.projects;
begin
  select j.* into v_job
  from private.jobs j
  where j.id = p_job_id
    and j.kind = 'chat.reply';

  if not found then
    raise exception 'job_not_found' using errcode = 'P0001';
  end if;

  select c.* into v_conversation
  from public.conversations c
  where c.id = (v_job.payload ->> 'conversation_id')::uuid;

  if not found then
    raise exception 'conversation_not_found' using errcode = 'P0001';
  end if;

  v_consent := case
    when v_conversation.kind <> 'client' then 'n/a'
    when v_conversation.ai_consent_at is not null and v_conversation.ai_consent_revoked_at is null
      then 'granted'
    when v_conversation.ai_consent_revoked_at is not null then 'revoked'
    else 'pending'
  end;

  v_result := jsonb_build_object(
    'conversation',
    jsonb_build_object(
      'id', v_conversation.id,
      'kind', v_conversation.kind,
      'locale', v_conversation.locale,
      'ai_enabled', v_conversation.ai_enabled,
      'consent_state', v_consent
    ),
    'members', '[]'::jsonb,
    'messages', '[]'::jsonb
  );

  if v_conversation.kind = 'client' and v_consent <> 'granted' then
    return v_result;
  end if;

  v_result := v_result || jsonb_build_object(
    'members',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object('role', m.role, 'display_name', p.full_name)
          order by m.joined_at, m.user_id
        )
        from public.conversation_members m
        join public.profiles p on p.id = m.user_id
        where m.conversation_id = v_conversation.id
          and m.left_at is null
      ),
      '[]'::jsonb
    ),
    'messages',
    coalesce(
      (
        select jsonb_agg(
          jsonb_build_object(
            'author_kind', r.author_kind,
            'role', r.role,
            'body', r.body,
            'created_at', r.created_at
          )
          order by r.created_at, r.id
        )
        from (
          select
            msg.id,
            msg.author_kind,
            msg.body,
            msg.created_at,
            case
              when msg.author_kind <> 'human' then null
              when msg.author_id is null then 'visitor'
              else (
                select m.role::text
                from public.conversation_members m
                where m.conversation_id = msg.conversation_id
                  and m.user_id = msg.author_id
              )
            end as role
          from public.messages msg
          where msg.conversation_id = v_conversation.id
          order by msg.created_at desc, msg.id desc
          limit 30
        ) r
      ),
      '[]'::jsonb
    )
  );

  if v_conversation.kind = 'client' then
    select pr.* into v_project from public.projects pr where pr.id = v_conversation.project_id;

    if found then
      v_result := v_result || jsonb_build_object(
        'project',
        jsonb_build_object('name', v_project.name, 'phase', v_project.phase, 'brief', v_project.brief)
      );
    end if;
  end if;

  if v_conversation.kind = 'visitor' then
    v_result := v_result || jsonb_build_object(
      'visitor', jsonb_build_object('first_page_path', v_conversation.first_page_path)
    );
  end if;

  return v_result;
end;
$$;

create function public.omen_post_reply(
  p_job_id uuid,
  p_body text,
  p_sources text[] default '{}',
  p_model text default null,
  p_interest boolean default null,
  p_confidence numeric default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_job private.jobs;
  v_conversation public.conversations;
  v_trigger public.messages;
  v_skip text;
  v_message uuid;
begin
  select j.* into v_job
  from private.jobs j
  where j.id = p_job_id
    and j.kind = 'chat.reply'
    and j.status = 'running'
  for update;

  if not found then
    raise exception 'job_not_running' using errcode = 'P0001';
  end if;

  if p_body is null or char_length(btrim(p_body)) = 0 then
    raise exception 'empty_reply' using errcode = 'P0001';
  end if;

  if char_length(p_body) > 4000 then
    raise exception 'reply_too_long' using errcode = 'P0001';
  end if;

  if p_confidence is not null and p_confidence not between 0 and 1 then
    raise exception 'invalid_confidence' using errcode = 'P0001';
  end if;

  if p_model is null or char_length(p_model) not between 1 and 100 then
    raise exception 'invalid_model' using errcode = 'P0001';
  end if;

  select c.* into v_conversation
  from public.conversations c
  where c.id = (v_job.payload ->> 'conversation_id')::uuid
  for update;

  select m.* into v_trigger
  from public.messages m
  where m.id = (v_job.payload ->> 'message_id')::uuid;

  v_skip := case
    when v_conversation.id is null then 'conversation_closed'
    when v_conversation.status <> 'open' then 'conversation_closed'
    when v_job.run_after < now() - interval '30 minutes' then 'reply_stale'
    when not private.ai_active(v_conversation.id) then 'ai_inactive'
    when v_trigger.id is not null and exists (
      select 1
      from public.messages later
      where later.conversation_id = v_conversation.id
        and later.author_kind = 'human'
        and later.created_at > v_trigger.created_at
        and (v_conversation.kind <> 'visitor' or later.author_id is not null)
    ) then 'human_replied'
  end;

  if v_skip is not null then
    perform private.finish_job(p_job_id, jsonb_build_object('skipped', v_skip), null);
    return null;
  end if;

  insert into public.messages (
    conversation_id, author_kind, body, sources, model, auto, job_id
  )
  values (
    v_conversation.id,
    'nexo',
    p_body,
    coalesce(p_sources, '{}'),
    p_model,
    coalesce((v_job.payload ->> 'delayed')::boolean, false),
    p_job_id
  )
  returning id into v_message;

  if v_conversation.kind = 'visitor' and p_interest is not null then
    update public.conversations set interest = p_interest where id = v_conversation.id;
  end if;

  perform private.finish_job(
    p_job_id,
    jsonb_build_object(
      'message_id', v_message,
      'model', p_model,
      'confidence', p_confidence,
      'interest', p_interest
    ),
    null
  );

  return v_message;
end;
$$;

revoke all on function private.sync_project_room(uuid) from public, anon, authenticated;
revoke all on function private.ensure_project_room(uuid) from public, anon, authenticated;
revoke all on function private.projects_room_after_insert() from public, anon, authenticated;
revoke all on function private.projects_room_after_update() from public, anon, authenticated;
revoke all on function private.deals_room_after_update() from public, anon, authenticated;
revoke all on function public.ensure_project_conversation(uuid) from public, anon, authenticated;
revoke all on function public.omen_conversation_context(uuid) from public, anon, authenticated;
revoke all on function public.omen_post_reply(uuid, text, text[], text, boolean, numeric) from public, anon, authenticated;

grant execute on function public.ensure_project_conversation(uuid) to authenticated;
grant execute on function public.omen_conversation_context(uuid) to service_role;
grant execute on function public.omen_post_reply(uuid, text, text[], text, boolean, numeric) to service_role;
