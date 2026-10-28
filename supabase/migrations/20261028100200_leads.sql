-- Task 1.8a (plan v3.2; DATOS v1.1 §4.3, §5, §6). Leads = opportunities of a crm_contacts row (several per contact).
-- Admin reads and writes them directly (manual lead); the gateway creates them with create_lead() (service role); a
-- client only sees their summary through area_lead_summary() (20261028100300). affiliate_code gets its FK in
-- 20261028100500_affiliates.sql.

create type public.lead_status as enum ('open', 'won', 'lost');
create type public.lead_source as enum ('web_form', 'web_proposal', 'chat', 'calcom', 'partner_form', 'manual', 'referral');
create type public.contact_via as enum ('client', 'partner', 'recruiter', 'other');

create table public.leads (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid not null references public.crm_contacts (id) on delete restrict,
  status          public.lead_status not null default 'open',
  source          public.lead_source not null,
  via             public.contact_via not null default 'client',
  pack_code       text references public.packs (code),
  pack_option     text,
  ai_proposal     jsonb,
  message         text,
  locale          public.locale,
  amount          numeric(10, 2) check (amount >= 0),
  paid_at         timestamptz,
  affiliate_code  text,
  -- `calcom:<booking uid>` or a client-generated UUID resent on retries; a repeated key returns the existing lead.
  idempotency_key text unique,
  user_id         uuid references auth.users (id) on delete set null,
  meta            jsonb not null default '{}',  -- origin, utm, cal.com booking id
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.leads enable row level security;
create index idx_leads_contact on public.leads (contact_id, created_at desc);
create index idx_leads_user on public.leads (user_id);
create index idx_leads_affiliate_code on public.leads (affiliate_code);
create index idx_leads_pack on public.leads (pack_code);
create index idx_leads_open on public.leads (status, created_at desc) where status = 'open';
create trigger leads_set_updated_at before update on public.leads
  for each row execute function private.set_updated_at();

alter table public.crm_interactions
  add constraint crm_interactions_lead_id_fkey foreign key (lead_id) references public.leads (id) on delete set null;

-- Admin only. No delete grant: a lead is closed (won/lost), never removed.
create policy leads_select on public.leads for select to authenticated using ((select private.is_admin()));
create policy leads_insert on public.leads for insert to authenticated with check ((select private.is_admin()));
create policy leads_update on public.leads for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
grant select, insert, update on public.leads to authenticated;

-- Gateway entry point of POST /leads (zod `createLeadInput` validates first). One transaction: finds the contact by
-- email among non-archived lead/client contacts or creates it, inserts the lead (idempotent by idempotency_key), the
-- lead_created interaction and the lead.created outbox event. An unknown affiliate code never loses the lead: it is
-- dropped and kept in meta.affiliate_code_rejected.
create or replace function public.create_lead(p jsonb)
returns table (lead_id uuid, contact_id uuid, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_key       text := nullif(btrim(p ->> 'idempotency_key'), '');
  v_email     extensions.citext := nullif(btrim(p ->> 'email'), '')::extensions.citext;
  v_source    public.lead_source := (p ->> 'source')::public.lead_source;
  v_locale    public.locale := coalesce((p ->> 'locale')::public.locale, 'es');
  v_user      uuid := nullif(p ->> 'user_id', '')::uuid;
  v_affiliate text := nullif(btrim(p ->> 'affiliate_code'), '');
  v_meta      jsonb := coalesce(p -> 'meta', '{}'::jsonb);
  v_contact   uuid;
  v_lead      uuid;
begin
  if v_source is null then raise exception 'source_required' using errcode = '22023'; end if;
  if v_email is null and nullif(btrim(p ->> 'phone'), '') is null then
    raise exception 'email_or_phone_required' using errcode = '22023';
  end if;

  if v_key is not null then
    select l.id, l.contact_id into v_lead, v_contact from public.leads l where l.idempotency_key = v_key;
    if v_lead is not null then
      return query select v_lead, v_contact, false;
      return;
    end if;
  end if;

  if v_email is not null then
    select c.id into v_contact from public.crm_contacts c
     where c.email operator(extensions.=) v_email and c.kind in ('lead', 'client') and c.archived_at is null
     order by c.created_at, c.id
     limit 1
     for update;
  end if;
  if v_contact is null then
    insert into public.crm_contacts (kind, status, display_name, email, phone, locale, user_id, source, chat_case)
    values ('lead', 'new', coalesce(nullif(btrim(p ->> 'display_name'), ''), v_email::text, btrim(p ->> 'phone')),
            v_email, nullif(btrim(p ->> 'phone'), ''), v_locale, v_user,
            case v_source when 'referral' then 'manual' else v_source::text end::public.contact_source,
            (p ->> 'chat_case')::public.chat_case)
    returning id into v_contact;
  elsif v_user is not null then
    update public.crm_contacts set user_id = v_user where id = v_contact and user_id is null;
  end if;

  if v_affiliate is not null and not exists (select 1 from public.affiliates a where a.code = v_affiliate) then
    v_meta := v_meta || jsonb_build_object('affiliate_code_rejected', v_affiliate);
    v_affiliate := null;
  end if;

  insert into public.leads (contact_id, source, via, pack_code, pack_option, ai_proposal, message, locale,
                            affiliate_code, idempotency_key, user_id, meta)
  values (v_contact, v_source, coalesce((p ->> 'via')::public.contact_via, 'client'), nullif(p ->> 'pack_code', ''),
          nullif(p ->> 'pack_option', ''), p -> 'ai_proposal', p ->> 'message', v_locale, v_affiliate, v_key, v_user,
          v_meta)
  on conflict (idempotency_key) do nothing
  returning id into v_lead;
  if v_lead is null then  -- a concurrent call with the same key won
    select l.id, l.contact_id into v_lead, v_contact from public.leads l where l.idempotency_key = v_key;
    return query select v_lead, v_contact, false;
    return;
  end if;

  insert into public.crm_interactions (contact_id, kind, channel, direction, actor, lead_id, body, payload)
  values (v_contact, 'lead_created',
          case v_source when 'web_form' then 'web_form' when 'web_proposal' then 'web_proposal' when 'chat' then 'chat'
                        when 'calcom' then 'calcom' else 'other' end::public.interaction_channel,
          'in', 'contact', v_lead, p ->> 'message',
          jsonb_build_object('source', v_source, 'via', coalesce(p ->> 'via', 'client')));

  perform private.enqueue('lead.created', jsonb_build_object(
    'id', v_lead, 'contact_id', v_contact, 'source', v_source, 'via', coalesce(p ->> 'via', 'client'),
    'pack_code', nullif(p ->> 'pack_code', '')));

  return query select v_lead, v_contact, true;
end $$;
revoke all on function public.create_lead(jsonb) from public, anon, authenticated;
grant execute on function public.create_lead(jsonb) to service_role;
