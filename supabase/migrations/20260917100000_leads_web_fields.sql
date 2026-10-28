-- Task 1.8 (DT §6.2 + §0b, plan v2.1). Additive: web fields of leads, idempotency key and the visitor link.
alter table public.leads
  add column contact_name  text,
  add column contact_email text,
  add column contact_phone text,
  add column message       text,
  add column locale        text check (locale in ('es','en')),
  add column ai_proposal   jsonb,
  add column affiliate_code text,
  add column paid_at       timestamptz,
  add column meta          jsonb not null default '{}'::jsonb,
  -- v2.1: `calcom:<booking uid>`, or a client-generated UUID resent on retries; a repeated key returns the existing lead.
  add column idempotency_key text unique,
  -- v2.0 (DT §1.12): filled by the gateway when the visitor's JWT arrives. set null so deleting an account never blocks.
  add column user_id uuid references auth.users(id) on delete set null;
create index idx_leads_contact_email on public.leads (lower(contact_email));
create index idx_leads_affiliate_code on public.leads (affiliate_code) where affiliate_code is not null;
create index idx_leads_created_at on public.leads (created_at desc);
create index leads_user_id_idx on public.leads (user_id) where user_id is not null;
-- fuente: bounded by app convention: web_form | web_proposal | calcom | whatsapp (no CHECK, to leave inherited rows alone)
-- H7: manual lead from the admin (UX §9.3). Only INSERT policy of the table; anon and normal users still cannot insert.
create policy "admin insert leads" on public.leads for insert to authenticated
  with check (private.staff_role_of((select auth.uid())) = 'admin');
-- affiliate_code gets its FK to affiliates(code) in 20260917100300_affiliates.sql.
