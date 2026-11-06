create table public.message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.messages (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  uploaded_by uuid references public.profiles (id) on delete set null,
  name text not null,
  mime text not null,
  size_bytes bigint not null,
  storage_path text not null,
  created_at timestamptz not null default now(),
  constraint message_attachments_name_length check (char_length(btrim(name)) between 1 and 200),
  constraint message_attachments_name_no_slash check (name !~ '[/\\]'),
  constraint message_attachments_size_range check (size_bytes between 1 and 10485760),
  constraint message_attachments_mime_allowed check (
    mime in (
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'application/zip',
      'application/msword',
      'application/vnd.ms-excel',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation'
    )
  ),
  constraint message_attachments_path_matches check (
    storage_path = 'conversations/' || conversation_id::text || '/' || id::text
  )
);

create index message_attachments_message_idx on public.message_attachments (message_id);
create index message_attachments_conversation_idx on public.message_attachments (conversation_id);
create index message_attachments_uploaded_by_idx on public.message_attachments (uploaded_by);

alter table public.message_attachments enable row level security;
revoke all on public.message_attachments from anon, authenticated;
grant select on public.message_attachments to authenticated;

create policy message_attachments_select
on public.message_attachments
for select
to authenticated
using ((select private.is_admin()) or private.is_conversation_member(conversation_id));

create function private.message_attachments_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_conv public.conversations;
  v_message public.messages;
begin
  select m.* into v_message from public.messages m where m.id = new.message_id;

  if not found or v_message.conversation_id <> new.conversation_id then
    raise exception 'message_mismatch' using errcode = 'P0001';
  end if;

  select c.* into v_conv from public.conversations c where c.id = new.conversation_id;

  if v_conv.kind = 'visitor' then
    raise exception 'attachments_not_allowed' using errcode = 'P0001';
  end if;

  if (select count(*) from public.message_attachments a where a.message_id = new.message_id) >= 5 then
    raise exception 'too_many_attachments' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

create trigger message_attachments_before_insert
before insert on public.message_attachments
for each row execute function private.message_attachments_before_insert();

create function private.storage_conversation_id(p_name text)
returns uuid
language sql
immutable
set search_path = ''
as $$
  select case
    when p_name ~ '^conversations/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      then split_part(p_name, '/', 2)::uuid
  end
$$;

create function public.register_attachment(
  p_message_id uuid,
  p_uploaded_by uuid,
  p_name text,
  p_mime text,
  p_size bigint,
  p_path text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_message public.messages;
  v_conv public.conversations;
  v_id uuid;
begin
  select m.* into v_message from public.messages m where m.id = p_message_id;

  if not found then
    raise exception 'message_not_found' using errcode = 'P0001';
  end if;

  select c.* into v_conv from public.conversations c where c.id = v_message.conversation_id;

  if v_conv.kind = 'visitor' then
    raise exception 'attachments_not_allowed' using errcode = 'P0001';
  end if;

  if v_conv.status <> 'open' then
    raise exception 'conversation_archived' using errcode = 'P0001';
  end if;

  if v_message.author_kind <> 'human' or v_message.author_id is distinct from p_uploaded_by then
    raise exception 'not_message_author' using errcode = 'P0001';
  end if;

  if not exists (
    select 1
    from public.conversation_members mb
    where mb.conversation_id = v_conv.id
      and mb.user_id = p_uploaded_by
      and mb.left_at is null
      and mb.can_write
  ) then
    raise exception 'not_member' using errcode = 'P0001';
  end if;

  if p_mime is null or p_size is null or p_name is null or p_path is null then
    raise exception 'invalid_attachment' using errcode = 'P0001';
  end if;

  if p_path !~ ('^conversations/' || v_conv.id::text || '/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$') then
    raise exception 'invalid_path' using errcode = 'P0001';
  end if;

  begin
    insert into public.message_attachments (
      id, message_id, conversation_id, uploaded_by, name, mime, size_bytes, storage_path
    )
    values (
      split_part(p_path, '/', 3)::uuid, p_message_id, v_conv.id, p_uploaded_by, btrim(p_name), p_mime, p_size, p_path
    )
    returning id into v_id;
  exception
    when check_violation then
      raise exception 'invalid_attachment' using errcode = 'P0001';
  end;

  return v_id;
end;
$$;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760,
  array[
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
    'application/pdf',
    'application/zip',
    'application/msword',
    'application/vnd.ms-excel',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation'
  ]
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy chat_attachments_select
on storage.objects
for select
to authenticated
using (
  bucket_id = 'chat-attachments'
  and private.is_conversation_member(private.storage_conversation_id(name))
);

create or replace function private.purge_conversations()
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

  delete from storage.objects o
  where o.bucket_id = 'chat-attachments'
    and private.storage_conversation_id(o.name) in (
      select c.id
      from public.conversations c
      where c.kind <> 'visitor'
        and c.status = 'archived'
        and c.archived_at < now() - interval '90 days'
    );

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

revoke all on function private.message_attachments_before_insert() from public, anon, authenticated;
revoke all on function private.storage_conversation_id(text) from public, anon, authenticated;
revoke all on function public.register_attachment(uuid, uuid, text, text, bigint, text) from public, anon, authenticated;

grant execute on function private.storage_conversation_id(text) to authenticated;
grant execute on function public.register_attachment(uuid, uuid, text, text, bigint, text) to service_role;
