create type public.payout_cadence as enum ('per_payment', 'weekly', 'biweekly');

alter table public.profiles
  add column closer_recurring_rate numeric(5, 2),
  add column parent_recurring_rate numeric(5, 2),
  add column payout_cadence public.payout_cadence,
  add column invited_by uuid references public.profiles (id) on delete set null;

create index profiles_invited_by_idx on public.profiles (invited_by);

alter table public.profiles
  add constraint profiles_closer_recurring_rate_range check (closer_recurring_rate between 0 and 100),
  add constraint profiles_parent_recurring_rate_range check (parent_recurring_rate between 0 and 100),
  add constraint profiles_closer_recurring_below_project check (
    closer_recurring_rate is null or closer_rate is null or closer_recurring_rate < closer_rate
  ),
  add constraint profiles_parent_recurring_below_project check (
    parent_recurring_rate is null or parent_rate is null or parent_recurring_rate < parent_rate
  ),
  add constraint profiles_recurring_and_cadence_only_for_closers check (
    role = 'closer' or (
      closer_recurring_rate is null and parent_recurring_rate is null and payout_cadence is null
    )
  ),
  add constraint profiles_parent_recurring_needs_parent check (
    parent_closer_id is not null or parent_recurring_rate is null
  );

drop trigger profiles_audit_update on public.profiles;

create trigger profiles_audit_update
after update on public.profiles
for each row
when (
  old.role is distinct from new.role
  or old.parent_closer_id is distinct from new.parent_closer_id
  or old.closer_rate is distinct from new.closer_rate
  or old.parent_rate is distinct from new.parent_rate
  or old.closer_recurring_rate is distinct from new.closer_recurring_rate
  or old.parent_recurring_rate is distinct from new.parent_recurring_rate
  or old.payout_cadence is distinct from new.payout_cadence
  or old.is_active is distinct from new.is_active
  or old.archived_at is distinct from new.archived_at
)
execute function private.audit();

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email extensions.citext not null,
  role public.user_role not null,
  parent_closer_id uuid references public.profiles (id) on delete restrict,
  closer_rate numeric(5, 2),
  parent_rate numeric(5, 2),
  closer_recurring_rate numeric(5, 2),
  parent_recurring_rate numeric(5, 2),
  payout_cadence public.payout_cadence,
  project_id uuid,
  token_hash text not null unique,
  auth_user_id uuid references auth.users (id) on delete set null,
  invited_by uuid references public.profiles (id) on delete set null,
  note text,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  constraint invitations_email_shape check (
    position('@' in email::text) > 1 and char_length(email::text) <= 320
  ),
  constraint invitations_role_invitable check (role in ('closer', 'freelance', 'client')),
  constraint invitations_note_length check (char_length(note) <= 500),
  constraint invitations_closer_rate_range check (closer_rate between 0 and 100),
  constraint invitations_parent_rate_range check (parent_rate between 0 and 100),
  constraint invitations_closer_recurring_rate_range check (closer_recurring_rate between 0 and 100),
  constraint invitations_parent_recurring_rate_range check (parent_recurring_rate between 0 and 100),
  constraint invitations_closer_recurring_below_project check (
    closer_recurring_rate is null or closer_rate is null or closer_recurring_rate < closer_rate
  ),
  constraint invitations_parent_recurring_below_project check (
    parent_recurring_rate is null or parent_rate is null or parent_recurring_rate < parent_rate
  ),
  constraint invitations_rates_only_for_closers check (
    role = 'closer' or (
      closer_rate is null and parent_rate is null and closer_recurring_rate is null
      and parent_recurring_rate is null and payout_cadence is null and parent_closer_id is null
    )
  ),
  constraint invitations_parent_rates_need_parent check (
    parent_closer_id is not null or (parent_rate is null and parent_recurring_rate is null)
  ),
  constraint invitations_project_only_for_clients check (role = 'client' or project_id is null),
  constraint invitations_accepted_xor_revoked check (accepted_at is null or revoked_at is null)
);

create unique index invitations_open_email_key
on public.invitations (email)
where accepted_at is null and revoked_at is null;

create index invitations_parent_closer_id_idx on public.invitations (parent_closer_id);
create index invitations_auth_user_id_idx on public.invitations (auth_user_id);
create index invitations_invited_by_idx on public.invitations (invited_by);
create index invitations_created_at_idx on public.invitations (created_at desc);

alter table public.invitations enable row level security;

revoke all on public.invitations from anon, authenticated;
grant select on public.invitations to authenticated;

create policy invitations_select
on public.invitations
for select
to authenticated
using ((select private.is_admin()));

create trigger invitations_audit_insert
after insert on public.invitations
for each row execute function private.audit();

create trigger invitations_audit_update
after update on public.invitations
for each row
when (
  old.accepted_at is distinct from new.accepted_at
  or old.revoked_at is distinct from new.revoked_at
  or old.expires_at is distinct from new.expires_at
  or old.token_hash is distinct from new.token_hash
)
execute function private.audit();

create function private.invitation_status(
  p_accepted_at timestamptz,
  p_revoked_at timestamptz,
  p_expires_at timestamptz
)
returns text
language sql
stable
set search_path = ''
as $$
  select case
    when p_accepted_at is not null then 'accepted'
    when p_revoked_at is not null then 'revoked'
    when p_expires_at <= now() then 'expired'
    else 'pending'
  end
$$;

create function private.new_invitation_token()
returns text
language sql
volatile
set search_path = ''
as $$
  select encode(uuid_send(gen_random_uuid()) || uuid_send(gen_random_uuid()), 'hex')
$$;

create function private.hash_invitation_token(p_token text)
returns text
language sql
immutable
set search_path = ''
as $$
  select encode(sha256(convert_to(coalesce(p_token, ''), 'UTF8')), 'hex')
$$;

create function private.queue_invitation_email(
  p_invitation public.invitations,
  p_token text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inviter text;
begin
  select p.full_name into v_inviter from public.profiles p where p.id = p_invitation.invited_by;

  insert into private.outbox (channel, recipient, template, payload)
  values (
    'email',
    p_invitation.email::text,
    'invitation',
    jsonb_build_object(
      'invitation_id', p_invitation.id,
      'path', '/invitacion/' || p_token,
      'role', p_invitation.role,
      'invited_by_name', v_inviter,
      'expires_at', p_invitation.expires_at,
      'locale', 'es'
    )
  );
end;
$$;

create function public.invite_user(
  p_email extensions.citext,
  p_role public.user_role,
  p_parent_closer_id uuid default null,
  p_closer_rate numeric default null,
  p_parent_rate numeric default null,
  p_closer_recurring_rate numeric default null,
  p_parent_recurring_rate numeric default null,
  p_payout_cadence public.payout_cadence default null,
  p_project_id uuid default null,
  p_note text default null,
  p_auth_user_id uuid default null
)
returns table (invitation_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_email extensions.citext := lower(btrim(p_email::text));
  v_token text;
  v_row public.invitations;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_email is null or position('@' in v_email::text) <= 1 or char_length(v_email::text) > 320 then
    raise exception 'invalid_email' using errcode = 'P0001';
  end if;

  if p_role not in ('closer', 'freelance', 'client') then
    raise exception 'invalid_role' using errcode = 'P0001';
  end if;

  if p_role <> 'closer' and (
    p_parent_closer_id is not null or p_closer_rate is not null or p_parent_rate is not null
    or p_closer_recurring_rate is not null or p_parent_recurring_rate is not null
    or p_payout_cadence is not null
  ) then
    raise exception 'rates_only_for_closers' using errcode = 'P0001';
  end if;

  if p_role <> 'client' and p_project_id is not null then
    raise exception 'project_only_for_clients' using errcode = 'P0001';
  end if;

  if p_parent_closer_id is null and (p_parent_rate is not null or p_parent_recurring_rate is not null) then
    raise exception 'parent_rate_needs_parent' using errcode = 'P0001';
  end if;

  if p_parent_closer_id is not null and not exists (
    select 1
    from public.profiles pc
    where pc.id = p_parent_closer_id
      and pc.role = 'closer'
      and pc.parent_closer_id is null
      and pc.is_active
      and pc.archived_at is null
  ) then
    raise exception 'invalid_parent_closer' using errcode = 'P0001';
  end if;

  if coalesce(p_closer_rate, 0) not between 0 and 100
    or coalesce(p_parent_rate, 0) not between 0 and 100
    or coalesce(p_closer_recurring_rate, 0) not between 0 and 100
    or coalesce(p_parent_recurring_rate, 0) not between 0 and 100
  then
    raise exception 'rate_out_of_range' using errcode = 'P0001';
  end if;

  if (p_closer_recurring_rate is not null and p_closer_rate is not null and p_closer_recurring_rate >= p_closer_rate)
    or (p_parent_recurring_rate is not null and p_parent_rate is not null and p_parent_recurring_rate >= p_parent_rate)
  then
    raise exception 'rates_recurring_not_lower' using errcode = 'P0001';
  end if;

  if char_length(p_note) > 500 then
    raise exception 'note_too_long' using errcode = 'P0001';
  end if;

  if p_auth_user_id is not null and not exists (
    select 1 from auth.users u where u.id = p_auth_user_id and lower(u.email::text) = lower(v_email::text)
  ) then
    raise exception 'auth_user_mismatch' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.profiles p
    left join auth.users u on u.id = p.id
    where p.archived_at is null
      and p.is_active
      and (p.id = p_auth_user_id or lower(u.email::text) = lower(v_email::text))
  ) then
    raise exception 'email_already_member' using errcode = 'P0001';
  end if;

  update public.invitations i
  set revoked_at = now()
  where i.email = v_email
    and i.accepted_at is null
    and i.revoked_at is null
    and i.expires_at <= now();

  if exists (
    select 1
    from public.invitations i
    where i.email = v_email
      and i.accepted_at is null
      and i.revoked_at is null
  ) then
    raise exception 'email_already_invited' using errcode = 'P0001';
  end if;

  v_token := private.new_invitation_token();

  insert into public.invitations (
    email, role, parent_closer_id, closer_rate, parent_rate, closer_recurring_rate,
    parent_recurring_rate, payout_cadence, project_id, token_hash, auth_user_id, invited_by, note
  )
  values (
    v_email, p_role, p_parent_closer_id, p_closer_rate, p_parent_rate, p_closer_recurring_rate,
    p_parent_recurring_rate, p_payout_cadence, p_project_id, private.hash_invitation_token(v_token),
    p_auth_user_id, v_uid, nullif(btrim(p_note), '')
  )
  returning * into v_row;

  perform private.queue_invitation_email(v_row, v_token);

  return query select v_row.id, v_token;
end;
$$;

create function public.renew_invitation(p_id uuid)
returns table (invitation_id uuid, token text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_token text;
  v_row public.invitations;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select i.* into v_row from public.invitations i where i.id = p_id for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if v_row.accepted_at is not null then
    raise exception 'invitation_used' using errcode = 'P0001';
  end if;

  if v_row.revoked_at is not null then
    raise exception 'invitation_revoked' using errcode = 'P0001';
  end if;

  v_token := private.new_invitation_token();

  update public.invitations i
  set token_hash = private.hash_invitation_token(v_token),
      expires_at = now() + interval '7 days'
  where i.id = p_id
  returning * into v_row;

  perform private.queue_invitation_email(v_row, v_token);

  return query select v_row.id, v_token;
end;
$$;

create function public.revoke_invitation(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_row public.invitations;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select i.* into v_row from public.invitations i where i.id = p_id for update;

  if not found then
    raise exception 'invitation_not_found' using errcode = 'P0001';
  end if;

  if v_row.accepted_at is not null then
    raise exception 'invitation_used' using errcode = 'P0001';
  end if;

  if v_row.revoked_at is null then
    update public.invitations set revoked_at = now() where id = p_id;
  end if;
end;
$$;

create function public.read_invitation(p_token text)
returns table (
  role public.user_role,
  invited_by_name text,
  email text,
  expires_at timestamptz,
  status text
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    i.role,
    p.full_name,
    i.email::text,
    i.expires_at,
    private.invitation_status(i.accepted_at, i.revoked_at, i.expires_at)
  from public.invitations i
  left join public.profiles p on p.id = i.invited_by
  where i.token_hash = private.hash_invitation_token(p_token)
$$;

create function public.accept_invitation(
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

revoke all on function private.invitation_status(timestamptz, timestamptz, timestamptz) from public, anon, authenticated;
revoke all on function private.new_invitation_token() from public, anon, authenticated;
revoke all on function private.hash_invitation_token(text) from public, anon, authenticated;
revoke all on function private.queue_invitation_email(public.invitations, text) from public, anon, authenticated;

revoke all on function public.invite_user(
  extensions.citext, public.user_role, uuid, numeric, numeric, numeric, numeric,
  public.payout_cadence, uuid, text, uuid
) from public, anon, authenticated;
revoke all on function public.renew_invitation(uuid) from public, anon, authenticated;
revoke all on function public.revoke_invitation(uuid) from public, anon, authenticated;
revoke all on function public.read_invitation(text) from public, anon, authenticated;
revoke all on function public.accept_invitation(text, text, public.app_locale) from public, anon, authenticated;

grant execute on function public.invite_user(
  extensions.citext, public.user_role, uuid, numeric, numeric, numeric, numeric,
  public.payout_cadence, uuid, text, uuid
) to authenticated;
grant execute on function public.renew_invitation(uuid) to authenticated;
grant execute on function public.revoke_invitation(uuid) to authenticated;
grant execute on function public.accept_invitation(text, text, public.app_locale) to authenticated;

grant execute on function public.read_invitation(text) to service_role;
