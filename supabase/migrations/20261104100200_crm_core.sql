create type public.contact_kind as enum ('prospect', 'client', 'recruiter', 'partner', 'other');
create type public.contact_source as enum ('manual', 'import', 'form', 'nexo', 'whatsapp', 'radar');
create type public.deal_stage as enum ('new', 'contacted', 'meeting', 'proposal', 'won', 'lost');
create type public.activity_kind as enum (
  'note', 'call', 'meeting', 'email', 'whatsapp', 'stage_change', 'form', 'chat', 'system'
);

create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null,
  full_name text not null,
  email extensions.citext,
  phone text,
  organization text,
  role_title text,
  city text,
  kind public.contact_kind not null default 'prospect',
  source public.contact_source not null default 'manual',
  lead_id uuid references public.leads (id) on delete set null,
  linkedin_url text,
  website text,
  tags text[] not null default '{}',
  notes text,
  next_action text,
  next_action_at timestamptz,
  last_activity_at timestamptz,
  import_id uuid,
  radar_finding_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  archived_at timestamptz,
  constraint contacts_full_name_length check (char_length(btrim(full_name)) between 1 and 200),
  constraint contacts_email_shape check (
    email is null or (position('@' in email::text) > 1 and char_length(email::text) <= 320)
  ),
  constraint contacts_phone_length check (char_length(phone) <= 40),
  constraint contacts_text_lengths check (
    char_length(organization) <= 200
    and char_length(role_title) <= 200
    and char_length(city) <= 200
    and char_length(linkedin_url) <= 2048
    and char_length(website) <= 2048
    and char_length(next_action) <= 500
  ),
  constraint contacts_notes_length check (char_length(notes) <= 20000),
  constraint contacts_tags_size check (cardinality(tags) <= 30)
);

create unique index contacts_owner_email_key
on public.contacts (owner_id, email)
where email is not null and owner_id is not null and archived_at is null;

create unique index contacts_unowned_email_key
on public.contacts (email)
where email is not null and owner_id is null and archived_at is null;

create index contacts_owner_id_idx on public.contacts (owner_id);
create index contacts_lead_id_idx on public.contacts (lead_id);
create index contacts_kind_idx on public.contacts (kind);
create index contacts_next_action_at_idx on public.contacts (next_action_at) where next_action_at is not null;
create index contacts_last_activity_at_idx on public.contacts (last_activity_at desc);

create table public.deals (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  owner_id uuid references public.profiles (id) on delete set null,
  stage public.deal_stage not null default 'new',
  via public.contact_via not null,
  pack_id uuid,
  amount numeric(12, 2),
  won_amount numeric(12, 2),
  currency text not null default 'EUR',
  lost_reason text,
  won_at timestamptz,
  lost_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint deals_id_contact_key unique (id, contact_id),
  constraint deals_amount_positive check (amount >= 0),
  constraint deals_won_amount_positive check (won_amount >= 0),
  constraint deals_currency_eur check (currency = 'EUR'),
  constraint deals_lost_reason_length check (char_length(lost_reason) <= 500),
  constraint deals_won_consistent check ((stage = 'won') = (won_at is not null)),
  constraint deals_lost_consistent check ((stage = 'lost') = (lost_at is not null))
);

create index deals_contact_id_idx on public.deals (contact_id);
create index deals_owner_id_idx on public.deals (owner_id);
create index deals_stage_idx on public.deals (stage);

create table public.activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts (id) on delete restrict,
  deal_id uuid,
  author_id uuid references public.profiles (id) on delete set null,
  kind public.activity_kind not null,
  body text,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint activities_deal_belongs_to_contact
    foreign key (deal_id, contact_id) references public.deals (id, contact_id) on delete restrict,
  constraint activities_body_length check (char_length(body) <= 10000)
);

create index activities_contact_occurred_idx on public.activities (contact_id, occurred_at desc);
create index activities_deal_contact_idx on public.activities (deal_id, contact_id);
create index activities_author_id_idx on public.activities (author_id);

alter table public.leads
  add constraint leads_contact_id_fkey foreign key (contact_id) references public.contacts (id) on delete set null,
  add constraint leads_deal_id_fkey foreign key (deal_id) references public.deals (id) on delete set null;

create index leads_contact_id_idx on public.leads (contact_id);
create index leads_deal_id_idx on public.leads (deal_id);

alter table public.contacts enable row level security;
alter table public.deals enable row level security;
alter table public.activities enable row level security;

revoke all on public.contacts from anon, authenticated;
revoke all on public.deals from anon, authenticated;
revoke all on public.activities from anon, authenticated;

create function private.is_closer()
returns boolean
language sql
stable
set search_path = ''
as $$
  select coalesce(private.role() = 'closer', false) and private.is_aal2()
$$;

create function private.owns_contact(p_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_closer()
    and exists (
      select 1
      from public.contacts c
      where c.id = p_contact_id
        and c.owner_id is not null
        and (
          c.owner_id = auth.uid()
          or exists (
            select 1
            from public.profiles o
            where o.id = c.owner_id
              and o.parent_closer_id = auth.uid()
          )
        )
    )
$$;

create function private.owns_lead(p_lead_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_closer()
    and exists (
      select 1
      from public.leads l
      where l.id = p_lead_id
        and l.assigned_to is not null
        and (
          l.assigned_to = auth.uid()
          or exists (
            select 1
            from public.profiles o
            where o.id = l.assigned_to
              and o.parent_closer_id = auth.uid()
          )
        )
    )
$$;

create function private.is_api_client_role()
returns boolean
language sql
stable
set search_path = ''
as $$
  select current_user in ('anon', 'authenticated')
$$;

create function private.contacts_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'UPDATE'
    and new.owner_id is distinct from old.owner_id
    and private.is_api_client_role()
    and not private.is_admin()
  then
    raise exception 'owner_change_admin_only' using errcode = '42501';
  end if;

  return new;
end;
$$;

create function private.deals_guard()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'INSERT' then
    select c.owner_id into new.owner_id from public.contacts c where c.id = new.contact_id;
  elsif new.contact_id is distinct from old.contact_id then
    raise exception 'deal_contact_immutable' using errcode = '23514';
  end if;

  if private.is_api_client_role() then
    if new.stage = 'won' and (tg_op = 'INSERT' or old.stage is distinct from 'won') then
      raise exception 'won_requires_win_deal' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE' and old.stage = 'won' and new.stage is distinct from 'won' then
      raise exception 'won_deal_is_closed' using errcode = '42501';
    end if;

    if new.won_amount is distinct from (case when tg_op = 'INSERT' then null else old.won_amount end)
      or new.won_at is distinct from (case when tg_op = 'INSERT' then null else old.won_at end)
    then
      raise exception 'won_fields_require_win_deal' using errcode = '42501';
    end if;

    if tg_op = 'UPDATE'
      and new.owner_id is distinct from old.owner_id
      and not private.is_admin()
    then
      raise exception 'owner_change_admin_only' using errcode = '42501';
    end if;
  end if;

  if new.stage = 'lost' then
    new.lost_at := coalesce(new.lost_at, now());
  else
    new.lost_at := null;
  end if;

  return new;
end;
$$;

create function private.touch_contact_last_activity()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  update public.contacts
  set last_activity_at = greatest(coalesce(last_activity_at, new.occurred_at), new.occurred_at)
  where id = new.contact_id;

  return null;
end;
$$;

create trigger contacts_guard
before update on public.contacts
for each row execute function private.contacts_guard();

create trigger contacts_set_updated_at
before update on public.contacts
for each row execute function private.set_updated_at();

create trigger contacts_audit_owner_change
after update on public.contacts
for each row
when (old.owner_id is distinct from new.owner_id)
execute function private.audit();

create trigger deals_guard
before insert or update on public.deals
for each row execute function private.deals_guard();

create trigger deals_set_updated_at
before update on public.deals
for each row execute function private.set_updated_at();

create trigger deals_audit_stage_change
after update on public.deals
for each row
when (old.stage is distinct from new.stage)
execute function private.audit();

create trigger activities_touch_contact
after insert on public.activities
for each row execute function private.touch_contact_last_activity();

revoke all on function private.is_closer() from public, anon, authenticated;
revoke all on function private.owns_contact(uuid) from public, anon, authenticated;
revoke all on function private.owns_lead(uuid) from public, anon, authenticated;
revoke all on function private.is_api_client_role() from public, anon, authenticated;
revoke all on function private.contacts_guard() from public, anon, authenticated;
revoke all on function private.deals_guard() from public, anon, authenticated;
revoke all on function private.touch_contact_last_activity() from public, anon, authenticated;

grant execute on function private.is_closer() to authenticated;
grant execute on function private.owns_contact(uuid) to authenticated;
grant execute on function private.owns_lead(uuid) to authenticated;
grant execute on function private.is_api_client_role() to authenticated;

grant select, insert, update on public.contacts to authenticated;
grant select, insert, update on public.deals to authenticated;
grant select, insert on public.activities to authenticated;

create policy contacts_select
on public.contacts
for select
to authenticated
using ((select private.is_admin()) or private.owns_contact(id));

create policy contacts_insert
on public.contacts
for insert
to authenticated
with check (
  (select private.is_admin())
  or ((select private.is_closer()) and owner_id = (select private.uid()))
);

create policy contacts_update
on public.contacts
for update
to authenticated
using ((select private.is_admin()) or private.owns_contact(id))
with check ((select private.is_admin()) or private.owns_contact(id));

create policy deals_select
on public.deals
for select
to authenticated
using ((select private.is_admin()) or private.owns_contact(contact_id));

create policy deals_insert
on public.deals
for insert
to authenticated
with check ((select private.is_admin()) or private.owns_contact(contact_id));

create policy deals_update
on public.deals
for update
to authenticated
using ((select private.is_admin()) or private.owns_contact(contact_id))
with check ((select private.is_admin()) or private.owns_contact(contact_id));

create policy activities_select
on public.activities
for select
to authenticated
using ((select private.is_admin()) or private.owns_contact(contact_id));

create policy activities_insert
on public.activities
for insert
to authenticated
with check (
  author_id = (select private.uid())
  and kind in ('note', 'call', 'meeting', 'email', 'whatsapp')
  and ((select private.is_admin()) or private.owns_contact(contact_id))
);
