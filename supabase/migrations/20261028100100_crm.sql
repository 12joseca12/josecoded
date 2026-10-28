-- Task 1.8a (plan v3.2; DATOS v1.1 §4.3, §5, §6, §7). CRM: organisations, contacts, interactions, message templates
-- and drafts. Admin only (4 policies per table with (select private.is_admin())); a client never sees their contact.
-- leads arrives in 20261028100200 (it adds the crm_interactions.lead_id FK); chat_threads arrives in 1.8b (it adds the
-- crm_interactions.chat_thread_id FK).

-- 1) Enums (DATOS §4.3). chat_case belongs to the chat (§4.6) but crm_contacts.chat_case needs it now; 1.8b reuses it.
create type public.org_kind as enum ('agency', 'company', 'local_business', 'recruiter_firm', 'other');
create type public.contact_kind as enum ('lead', 'client', 'agency', 'recruiter', 'other');
create type public.contact_source as enum (
  'web_form', 'web_proposal', 'chat', 'calcom', 'partner_form', 'import_agencias', 'manual', 'radar', 'newsletter_interest'
);
create type public.chat_case as enum ('client', 'partner', 'recruiter', 'curious');
create type public.interaction_kind as enum (
  'note', 'message_sent', 'message_received', 'meeting', 'call', 'chat_thread', 'status_change', 'import',
  'lead_created', 'lead_won', 'lead_lost'
);
create type public.interaction_channel as enum (
  'linkedin_invite', 'linkedin_inmail', 'email', 'whatsapp', 'calcom', 'web_form', 'web_proposal', 'chat', 'other'
);
create type public.interaction_direction as enum ('out', 'in', 'internal');
create type public.interaction_actor as enum ('jose', 'ai', 'system', 'contact');
create type public.draft_author as enum ('ai', 'jose');
create type public.draft_status as enum ('draft', 'copied', 'marked_sent', 'discarded');

-- 2) Helpers.
-- Status of a contact depends on its kind (P6: text + check instead of an enum).
create or replace function private.contact_status_ok(p_kind public.contact_kind, p_status text) returns boolean
language sql immutable set search_path = '' as $$
  select case p_kind
    when 'lead'      then p_status in ('new', 'contacted', 'proposal_sent', 'won', 'lost', 'active_client', 'closed')
    when 'client'    then p_status in ('new', 'contacted', 'proposal_sent', 'won', 'lost', 'active_client', 'closed')
    when 'agency'    then p_status in ('pending', 'invited', 'inmail_sent', 'replied', 'meeting', 'collaborating', 'discarded')
    when 'recruiter' then p_status in ('new', 'in_process', 'interview', 'offer', 'rejected', 'closed')
    when 'other'     then p_status in ('new', 'active', 'closed')
    else false
  end
$$;
revoke all on function private.contact_status_ok(public.contact_kind, text) from public, anon, authenticated;
grant execute on function private.contact_status_ok(public.contact_kind, text) to authenticated;

-- Statuses that end the commercial follow-up: changing to one of them does not need a next action (spec §9).
-- active_client counts as terminal: the follow-up of a client lives in the area (tasks), not in the inbox.
create or replace function private.contact_status_terminal(p_status text) returns boolean
language sql immutable set search_path = '' as $$
  select p_status in ('won', 'lost', 'active_client', 'closed', 'discarded', 'rejected')
$$;
revoke all on function private.contact_status_terminal(text) from public, anon, authenticated;
grant execute on function private.contact_status_terminal(text) to authenticated;

-- Organisation names are matched on lower(unaccent(collapsed spaces)). The two-argument unaccent names its dictionary,
-- so it works with search_path = ''.
create or replace function private.normalize_name(p_name text) returns text
language sql stable set search_path = '' as $$
  select lower(extensions.unaccent('extensions.unaccent'::regdictionary, regexp_replace(btrim(p_name), '\s+', ' ', 'g')))
$$;
revoke all on function private.normalize_name(text) from public, anon, authenticated;
grant execute on function private.normalize_name(text) to authenticated;

-- 3) Organisations.
create table public.crm_organizations (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (btrim(name) <> ''),
  name_normalized text not null unique,
  kind            public.org_kind not null,
  website         text,
  city            text,
  size            text,
  fit             smallint check (fit between 1 and 5),
  notes           text,
  source          public.contact_source not null default 'manual',
  notion_url      text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
alter table public.crm_organizations enable row level security;
create index idx_crm_organizations_kind_fit on public.crm_organizations (kind, fit desc);
create trigger crm_organizations_set_updated_at before update on public.crm_organizations
  for each row execute function private.set_updated_at();

-- name_normalized is always derived from name (a value sent by the caller is overwritten).
create or replace function private.crm_organizations_normalize() returns trigger
language plpgsql set search_path = '' as $$
begin
  new.name_normalized = private.normalize_name(new.name);
  return new;
end $$;
revoke all on function private.crm_organizations_normalize() from public, anon, authenticated;
create trigger crm_organizations_normalize before insert or update of name, name_normalized on public.crm_organizations
  for each row execute function private.crm_organizations_normalize();

create policy crm_organizations_select on public.crm_organizations for select to authenticated
  using ((select private.is_admin()));
create policy crm_organizations_insert on public.crm_organizations for insert to authenticated
  with check ((select private.is_admin()));
create policy crm_organizations_update on public.crm_organizations for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy crm_organizations_delete on public.crm_organizations for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.crm_organizations to authenticated;

-- 4) Contacts. email is not unique: the same person can be an agency contact and a recruiter.
create table public.crm_contacts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid references public.crm_organizations (id) on delete set null,
  kind                public.contact_kind not null,
  status              text not null,
  display_name        text not null check (btrim(display_name) <> ''),
  role                text,
  email               extensions.citext,
  phone               text,
  linkedin_url        text,
  locale              public.locale default 'es',
  next_action         text,
  next_action_at      timestamptz,
  owner_note          text,
  user_id             uuid references auth.users (id) on delete set null,
  chat_case           public.chat_case,
  source              public.contact_source not null,
  notion_url          text,
  tags                text[] not null default '{}',
  archived_at         timestamptz,
  last_interaction_at timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint crm_contacts_status_by_kind check (private.contact_status_ok(kind, status))
);
alter table public.crm_contacts enable row level security;
create index idx_crm_contacts_organization on public.crm_contacts (organization_id);
create index idx_crm_contacts_user on public.crm_contacts (user_id);
create index idx_crm_contacts_email on public.crm_contacts (email);
-- Inbox (C2): due first, then by kind/status, archived rows out.
create index idx_crm_contacts_next_action on public.crm_contacts (next_action_at) where archived_at is null;
create index idx_crm_contacts_kind_status on public.crm_contacts (kind, status) where archived_at is null;
create index idx_crm_contacts_tags on public.crm_contacts using gin (tags);
create trigger crm_contacts_set_updated_at before update on public.crm_contacts
  for each row execute function private.set_updated_at();

create policy crm_contacts_select on public.crm_contacts for select to authenticated
  using ((select private.is_admin()));
create policy crm_contacts_insert on public.crm_contacts for insert to authenticated
  with check ((select private.is_admin()));
create policy crm_contacts_update on public.crm_contacts for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy crm_contacts_delete on public.crm_contacts for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.crm_contacts to authenticated;

-- 5) Message templates and drafts (drafts first: crm_interactions.draft_id points to them).
create table public.crm_message_templates (
  id         uuid primary key default gen_random_uuid(),
  code       text not null unique,
  kind       public.contact_kind,
  channel    public.interaction_channel not null,
  locale     public.locale not null,
  title      text,
  body       text not null,
  max_chars  integer check (max_chars > 0),
  rules      text[] not null default '{}',
  version    integer not null default 1,
  active     boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.crm_message_templates enable row level security;
create trigger crm_message_templates_set_updated_at before update on public.crm_message_templates
  for each row execute function private.set_updated_at();
create policy crm_message_templates_select on public.crm_message_templates for select to authenticated
  using ((select private.is_admin()));
create policy crm_message_templates_insert on public.crm_message_templates for insert to authenticated
  with check ((select private.is_admin()));
create policy crm_message_templates_update on public.crm_message_templates for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy crm_message_templates_delete on public.crm_message_templates for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.crm_message_templates to authenticated;

create table public.crm_message_drafts (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.crm_contacts (id) on delete cascade,
  template_id    uuid references public.crm_message_templates (id) on delete set null,
  channel        public.interaction_channel not null,
  locale         public.locale,
  subject        text,
  body           text not null,
  char_count     integer generated always as (char_length(body)) stored,
  generated_by   public.draft_author not null,
  model          text,
  prompt_version text,
  status         public.draft_status not null default 'draft',
  marked_sent_at timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);
alter table public.crm_message_drafts enable row level security;
create index idx_crm_message_drafts_contact on public.crm_message_drafts (contact_id, created_at desc);
create index idx_crm_message_drafts_template on public.crm_message_drafts (template_id);
create trigger crm_message_drafts_set_updated_at before update on public.crm_message_drafts
  for each row execute function private.set_updated_at();
create policy crm_message_drafts_select on public.crm_message_drafts for select to authenticated
  using ((select private.is_admin()));
create policy crm_message_drafts_insert on public.crm_message_drafts for insert to authenticated
  with check ((select private.is_admin()));
create policy crm_message_drafts_update on public.crm_message_drafts for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy crm_message_drafts_delete on public.crm_message_drafts for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.crm_message_drafts to authenticated;

-- 6) Interactions (the contact's timeline, C3).
create table public.crm_interactions (
  id             uuid primary key default gen_random_uuid(),
  contact_id     uuid not null references public.crm_contacts (id) on delete cascade,
  kind           public.interaction_kind not null,
  channel        public.interaction_channel,
  direction      public.interaction_direction not null default 'internal',
  subject        text,
  body           text,
  occurred_at    timestamptz not null default now(),
  actor          public.interaction_actor not null,
  lead_id        uuid,  -- FK to leads in 20261028100200_leads.sql
  chat_thread_id uuid,  -- FK to chat_threads in 1.8b
  draft_id       uuid references public.crm_message_drafts (id) on delete set null,
  payload        jsonb not null default '{}',
  created_at     timestamptz not null default now()
);
alter table public.crm_interactions enable row level security;
create index idx_crm_interactions_contact on public.crm_interactions (contact_id, occurred_at desc);
create index idx_crm_interactions_lead on public.crm_interactions (lead_id);
create index idx_crm_interactions_chat_thread on public.crm_interactions (chat_thread_id);
create index idx_crm_interactions_draft on public.crm_interactions (draft_id);
create policy crm_interactions_select on public.crm_interactions for select to authenticated
  using ((select private.is_admin()));
create policy crm_interactions_insert on public.crm_interactions for insert to authenticated
  with check ((select private.is_admin()));
create policy crm_interactions_update on public.crm_interactions for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy crm_interactions_delete on public.crm_interactions for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.crm_interactions to authenticated;

-- crm_contacts.last_interaction_at (C2/C3 «última interacción») follows the newest occurred_at of the contact's
-- timeline; it never moves back when an older interaction is logged late. Bookkeeping rows (status_change, import)
-- are not an interaction with the person and do not count. Runs as the caller: the admin (RLS lets him update
-- contacts), the service role or a definer RPC; nobody else can insert interactions.
create or replace function private.crm_interactions_touch_contact() returns trigger
language plpgsql set search_path = '' as $$
begin
  update public.crm_contacts c set last_interaction_at = new.occurred_at
   where c.id = new.contact_id and (c.last_interaction_at is null or c.last_interaction_at < new.occurred_at);
  return null;
end $$;
revoke all on function private.crm_interactions_touch_contact() from public, anon, authenticated;
create trigger crm_interactions_touch_contact after insert on public.crm_interactions
  for each row when (new.kind not in ('status_change', 'import'))
  execute function private.crm_interactions_touch_contact();

-- 7) Status changes (spec §9 «next action is mandatory»): a change to a non-terminal status needs next_action_at, and
--    every change leaves a status_change interaction. Runs as the caller: the admin (RLS) or a definer RPC. The actor is
--    jose when there is a user in the request (only the admin can update contacts), system otherwise (service role).
create or replace function private.crm_contact_status_change() returns trigger
language plpgsql set search_path = '' as $$
begin
  if not private.contact_status_terminal(new.status) and new.next_action_at is null then
    raise exception 'next_action_required: status % needs next_action_at', new.status using errcode = '23514';
  end if;
  insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
  values (new.id, 'status_change', 'internal',
          case when (select auth.uid()) is null then 'system' else 'jose' end::public.interaction_actor,
          jsonb_build_object('from', old.status, 'to', new.status));
  return null;
end $$;
revoke all on function private.crm_contact_status_change() from public, anon, authenticated;
create trigger crm_contact_status_change after update of status on public.crm_contacts
  for each row when (old.status is distinct from new.status)
  execute function private.crm_contact_status_change();

-- 8) Bulk import (C5, `Comercial/agencias.md` → CSV → zod in the web): upsert by name_normalized. Admin only.
create or replace function public.crm_import_organizations(p_rows jsonb)
returns table (created integer, updated integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  r         jsonb;
  v_created integer := 0;
  v_updated integer := 0;
  v_insert  boolean;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then raise exception 'rows_must_be_an_array'; end if;
  for r in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into public.crm_organizations as o (name, name_normalized, kind, website, city, size, fit, notes, source, notion_url)
    values (r ->> 'name', private.normalize_name(r ->> 'name'), (r ->> 'kind')::public.org_kind, r ->> 'website',
            r ->> 'city', r ->> 'size', (r ->> 'fit')::smallint, r ->> 'notes',
            coalesce((r ->> 'source')::public.contact_source, 'import_agencias'), r ->> 'notion_url')
    on conflict (name_normalized) do update set
      kind       = excluded.kind,
      website    = coalesce(excluded.website, o.website),
      city       = coalesce(excluded.city, o.city),
      size       = coalesce(excluded.size, o.size),
      fit        = coalesce(excluded.fit, o.fit),
      notes      = coalesce(excluded.notes, o.notes),
      notion_url = coalesce(excluded.notion_url, o.notion_url)
    returning (xmax = 0) into v_insert;
    if v_insert then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
  end loop;
  return query select v_created, v_updated;
end $$;
revoke all on function public.crm_import_organizations(jsonb) from public, anon, authenticated;
grant execute on function public.crm_import_organizations(jsonb) to authenticated;

-- 9) Launch templates. Structure and rules only: the real copy (voice, offer, names) comes from
--    `Comercial/agencias-mensajes.md` in the vault and is pasted by Jose from /admin (C9); {{DATO: …}} marks it.
--    Variables in {{double braces}} are filled by the draft generator; no personal data lives here.
insert into public.crm_message_templates (code, kind, channel, locale, title, body, max_chars, rules) values
  ('agency.linkedin_invite.es', 'agency', 'linkedin_invite', 'es', 'Agencia: invitación de LinkedIn',
   E'Hola {{first_name}}, {{DATO: motivo concreto ligado a un proyecto de {{organization}}}}. {{DATO: propuesta de colaboración en una frase}}.',
   300, array['personal_first_line', 'one_call_to_action', 'no_links', 'no_prices', 'max_chars']),
  ('agency.linkedin_invite.en', 'agency', 'linkedin_invite', 'en', 'Agency: LinkedIn invitation',
   E'Hi {{first_name}}, {{DATO: concrete reason tied to a project of {{organization}}}}. {{DATO: one-sentence collaboration offer}}.',
   300, array['personal_first_line', 'one_call_to_action', 'no_links', 'no_prices', 'max_chars']),
  ('agency.inmail.es', 'agency', 'linkedin_inmail', 'es', 'Agencia: InMail',
   E'Hola {{first_name}}:\n\n{{DATO: gancho con un trabajo reciente de {{organization}}}}\n\n{{DATO: qué puedo hacer para la agencia (marca blanca, plazos)}}\n\n{{DATO: llamada a la acción única}}\n\nJose',
   1900, array['personal_first_line', 'one_call_to_action', 'one_link_max', 'no_prices', 'max_chars']),
  ('agency.inmail.en', 'agency', 'linkedin_inmail', 'en', 'Agency: InMail',
   E'Hi {{first_name}},\n\n{{DATO: hook with a recent work of {{organization}}}}\n\n{{DATO: what I can do for the agency (white label, timelines)}}\n\n{{DATO: single call to action}}\n\nJose',
   1900, array['personal_first_line', 'one_call_to_action', 'one_link_max', 'no_prices', 'max_chars']),
  ('agency.followup.es', 'agency', 'linkedin_inmail', 'es', 'Agencia: seguimiento',
   E'Hola {{first_name}}, {{DATO: recordatorio breve sin presión}}. {{DATO: dato nuevo o enlace a /partners}}.',
   600, array['no_guilt', 'one_call_to_action', 'one_link_max', 'max_chars']),
  ('agency.followup.en', 'agency', 'linkedin_inmail', 'en', 'Agency: follow-up',
   E'Hi {{first_name}}, {{DATO: short no-pressure reminder}}. {{DATO: new fact or link to /partners}}.',
   600, array['no_guilt', 'one_call_to_action', 'one_link_max', 'max_chars']),
  ('agency.email.es', 'agency', 'email', 'es', 'Agencia: email',
   E'Hola {{first_name}}:\n\n{{DATO: presentación en dos frases}}\n\n{{DATO: propuesta de colaboración}}\n\nUn saludo,\nJose',
   null, array['personal_first_line', 'one_call_to_action', 'plain_text', 'no_attachments']),
  ('agency.email.en', 'agency', 'email', 'en', 'Agency: email',
   E'Hi {{first_name}},\n\n{{DATO: two-sentence introduction}}\n\n{{DATO: collaboration offer}}\n\nBest,\nJose',
   null, array['personal_first_line', 'one_call_to_action', 'plain_text', 'no_attachments'])
on conflict (code) do nothing;
