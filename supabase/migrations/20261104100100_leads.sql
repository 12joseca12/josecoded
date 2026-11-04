create type public.lead_source as enum ('form', 'nexo', 'whatsapp', 'radar', 'manual');
create type public.contact_via as enum ('hiring', 'freelance', 'pack');
create type public.lead_status as enum ('new', 'assigned', 'contacted', 'converted', 'discarded');

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  source public.lead_source not null,
  via public.contact_via,
  pack_id uuid,
  full_name text not null,
  email extensions.citext,
  phone text,
  organization text,
  message text,
  offer_url text,
  company text,
  wanted_by date,
  has_domain boolean,
  has_store_accounts boolean,
  page_path text,
  locale public.app_locale,
  consent_at timestamptz,
  conversation_id uuid,
  radar_finding_id uuid,
  status public.lead_status not null default 'new',
  assigned_to uuid references public.profiles (id) on delete set null,
  assigned_at timestamptz,
  assigned_by uuid references public.profiles (id) on delete set null,
  contact_id uuid,
  deal_id uuid,
  discard_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  handled_at timestamptz,
  constraint leads_full_name_length check (char_length(btrim(full_name)) between 1 and 200),
  constraint leads_email_shape check (
    email is null or (position('@' in email::text) > 1 and char_length(email::text) <= 320)
  ),
  constraint leads_reachable check (email is not null or phone is not null),
  constraint leads_form_requires_email check (source <> 'form' or email is not null),
  constraint leads_phone_length check (char_length(phone) <= 40),
  constraint leads_organization_length check (char_length(organization) <= 200),
  constraint leads_message_length check (char_length(message) <= 4000),
  constraint leads_company_length check (char_length(company) <= 200),
  constraint leads_offer_url_shape check (
    offer_url is null or (offer_url ~ '^https?://' and char_length(offer_url) <= 2048)
  ),
  constraint leads_page_path_length check (char_length(page_path) <= 500),
  constraint leads_discard_reason_length check (char_length(discard_reason) <= 500),
  constraint leads_consent_required check (source not in ('form', 'nexo') or consent_at is not null),
  constraint leads_pack_needs_pack_via check (pack_id is null or via = 'pack'),
  constraint leads_hiring_fields check (
    via is not distinct from 'hiring' or (offer_url is null and company is null)
  ),
  constraint leads_freelance_fields check (via is not distinct from 'freelance' or wanted_by is null),
  constraint leads_pack_fields check (
    via is not distinct from 'pack' or (has_domain is null and has_store_accounts is null)
  )
);

create index leads_status_created_at_idx on public.leads (status, created_at desc);
create index leads_email_idx on public.leads (email);
create index leads_assigned_to_idx on public.leads (assigned_to);
create index leads_assigned_by_idx on public.leads (assigned_by);

create table private.form_quota (
  ip_hash text not null,
  day date not null,
  count integer not null default 0,
  primary key (ip_hash, day),
  constraint form_quota_ip_hash_length check (char_length(ip_hash) between 16 and 128),
  constraint form_quota_count_positive check (count >= 0)
);

create index form_quota_day_idx on private.form_quota (day);

alter table public.leads enable row level security;
alter table private.form_quota enable row level security;

revoke all on public.leads from anon, authenticated;
revoke all on private.form_quota from anon, authenticated;

create trigger leads_set_updated_at
before update on public.leads
for each row execute function private.set_updated_at();

grant select, insert, update on public.leads to authenticated;

create policy leads_select
on public.leads
for select
to authenticated
using ((select private.is_admin()));

create policy leads_insert
on public.leads
for insert
to authenticated
with check ((select private.is_admin()));

create policy leads_update
on public.leads
for update
to authenticated
using ((select private.is_admin()))
with check ((select private.is_admin()));

create function private.submit_lead(
  p_source public.lead_source,
  p_via public.contact_via default null,
  p_pack_id uuid default null,
  p_full_name text default null,
  p_email extensions.citext default null,
  p_phone text default null,
  p_organization text default null,
  p_message text default null,
  p_offer_url text default null,
  p_company text default null,
  p_wanted_by date default null,
  p_has_domain boolean default null,
  p_has_store_accounts boolean default null,
  p_page_path text default null,
  p_locale public.app_locale default null,
  p_consent boolean default false,
  p_ip_hash text default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if p_source is distinct from 'form' then
    raise exception 'invalid_source' using errcode = 'P0001';
  end if;

  if not coalesce(p_consent, false) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;

  if p_ip_hash is null then
    raise exception 'ip_hash_required' using errcode = 'P0001';
  end if;

  insert into private.form_quota as q (ip_hash, day, count)
  values (p_ip_hash, (now() at time zone 'utc')::date, 1)
  on conflict (ip_hash, day) do update set count = q.count + 1
  returning q.count into v_count;

  if v_count > 5 then
    raise exception 'form_quota_exceeded' using errcode = 'P0001', hint = 'contact_alternatives';
  end if;

  insert into public.leads (
    source, via, pack_id, full_name, email, phone, organization, message, offer_url, company,
    wanted_by, has_domain, has_store_accounts, page_path, locale, consent_at
  )
  values (
    p_source, p_via, p_pack_id, p_full_name, p_email, p_phone, p_organization, p_message,
    p_offer_url, p_company, p_wanted_by, p_has_domain, p_has_store_accounts, p_page_path,
    p_locale, now()
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function private.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text
) from public, anon, authenticated;

grant execute on function private.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text
) to service_role;
