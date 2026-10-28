-- Local/CI seed (supabase db reset). Test data only; never applied to production.
-- Columns are taken from the inherited migrations in josedev/supabase/migrations.
-- Columns added by NEW migrations (e.g. pack_templates.code, 1.8) are seeded in task 1.8.
-- TODO(1.6 dump): verificar every INSERT below against supabase/schema/baseline.sql once it exists.

-- 1) Auth users (email + password, confirmed). Password for all three: test-password-123
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated',
   'jose@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated',
   'ana@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a3', 'authenticated', 'authenticated',
   'bob@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
       'email', now(), now(), now()
from auth.users u
where u.email in ('jose@test', 'ana@test', 'bob@test')
on conflict do nothing;

-- 2) Staff: Jose is admin (Ana and Bob are plain users)
insert into public.staff_members (user_id, email, role, must_change_password, telegram_chat_id)
values ('00000000-0000-4000-8000-0000000000a1', 'jose@test', 'admin', false, '0000000001')
on conflict (user_id) do nothing;

-- 3) Pack catalogue (the baseline carries no data; slugs match production)
insert into public.pack_templates (slug, nombre, orden) values
  ('landing', 'Landing', 1),
  ('gestion-logica', '+ Gestión y lógica', 2),
  ('crm-cms', '+ CRM / CMS', 3),
  ('automatizaciones', '+ Automatizaciones e integraciones', 4)
on conflict (slug) do nothing;
-- TODO(1.8): set pack_templates.code (P1..P4), price and weeks once 20260917100100_pack_codes.sql exists.

-- 4) Leads. Explicit assignment so the auto-assign trigger is deterministic.
insert into public.leads (id, assigned_staff_id, estado, fuente, monto, notas) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'nuevo', 'web', null, 'Seed lead: new'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a1', 'negociando', 'linkedin', 1200.00, 'Seed lead: negotiating')
on conflict (id) do nothing;

-- 5) Ana is a P2 client: closed lead (inserted already closed, so the on-close trigger does not fire)
--    plus the client row linked to her user (P2 = slug 'gestion-logica').
insert into public.leads (id, assigned_staff_id, estado, fuente, monto, notas, pack_template_id)
select '00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000a1', 'cerrado', 'web', 1500.00,
       'Seed lead: closed, Ana (P2)', id
from public.pack_templates where slug = 'gestion-logica'
on conflict (id) do nothing;

insert into public.clients (id, lead_id, user_id, pack_template_id, project_phase)
select '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b3',
       '00000000-0000-4000-8000-0000000000a2', id, 'desarrollo'
from public.pack_templates where slug = 'gestion-logica'
on conflict (id) do nothing;
