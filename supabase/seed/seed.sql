-- Local/CI seed (supabase db reset). Test data only; never applied to production.
-- Columns are taken from the inherited migrations in josedev/supabase/migrations.
-- Columns added by the 1.8 migrations (pack codes, affiliates, comments, ...) are seeded here too.
-- TODO(1.6 dump): verificar every INSERT below against supabase/schema/baseline.sql once it exists.

-- 1) Auth users (email + password). Password for all four: test-password-123.
--    jose/ana/bob are confirmed; sin@test is NOT confirmed (plan 1.8, DT §0b: claim_client_access and
--    area_lead_summary must refuse unconfirmed emails). GoTrue refuses the password login of an unconfirmed user, so
--    the test helper confirms sin@test just for the login with test_set_email_confirmed() (section 9) and undoes it.
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
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a4', 'authenticated', 'authenticated',
   'sin@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), null,
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', u.email_confirmed_at is not null),
       'email', now(), now(), now()
from auth.users u
where u.email in ('jose@test', 'ana@test', 'bob@test', 'sin@test')
on conflict do nothing;

-- 2) Staff: Jose is admin (Ana and Bob are plain users)
insert into public.staff_members (user_id, email, role, must_change_password, telegram_chat_id)
values ('00000000-0000-4000-8000-0000000000a1', 'jose@test', 'admin', false, '0000000001')
on conflict (user_id) do nothing;

-- 3) Pack catalogue (the baseline carries no data; slugs match production). Code, price, weeks and pricing_version
--    come from 20260917100100_pack_codes.sql, whose UPDATEs find no rows on an empty local database: same values here.
insert into public.pack_templates (slug, nombre, orden, code, price, weeks, pricing_version) values
  ('landing',          'Web básica',                 1, 'P1',  900, 1, '2026-09-14'),
  ('gestion-logica',   'Pedidos / reservas',         2, 'P2', 1400, 2, '2026-09-14'),
  ('crm-cms',          'Gestión',                    3, 'P3', 2500, 2, '2026-09-14'),
  ('automatizaciones', 'Gestión + automatizaciones', 4, 'P4', 4200, 3, '2026-09-14')
on conflict (slug) do nothing;

insert into public.pack_extras (slug, nombre, precio, code) values
  ('seo-basic', 'SEO básico', 250, 'seo_basic')
on conflict (slug) do nothing;

-- Affiliates. The code is fixed here, so the trigger keeps it (it only generates when code is null).
insert into public.affiliates (id, user_id, code, level) values
  ('00000000-0000-4000-8000-0000000000e1', '00000000-0000-4000-8000-0000000000a2', 'ANA-TEST01', 'standard'),
  ('00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a3', 'BOB-TEST01', 'premium')
on conflict (id) do nothing;

-- 4) Leads. Explicit assignment so the auto-assign trigger is deterministic.
--    b1: new web-form lead referred by Ana. b2: negotiating. contact_* use the reserved example.test domain.
insert into public.leads (id, assigned_staff_id, estado, fuente, monto, notas, contact_name, contact_email, locale, affiliate_code) values
  ('00000000-0000-4000-8000-0000000000b1', '00000000-0000-4000-8000-0000000000a1', 'nuevo', 'web_form', null, 'Seed lead: new, referred by Ana',
   'Marta Test', 'marta@example.test', 'es', 'ANA-TEST01'),
  ('00000000-0000-4000-8000-0000000000b2', '00000000-0000-4000-8000-0000000000a1', 'negociando', 'linkedin', 1200.00, 'Seed lead: negotiating',
   'Dani Test', 'dani@example.test', 'es', null)
on conflict (id) do nothing;

-- 5) Ana is a P2 client: closed lead (inserted already closed, so the on-close trigger does not fire) that came from
--    the proposal generator (area_lead_summary() returns it to her) and was referred by Bob, plus the client row linked to her user.
insert into public.leads (id, assigned_staff_id, estado, fuente, monto, notas, pack_template_id, contact_name, contact_email, locale,
                          ai_proposal, user_id, affiliate_code, paid_at)
select '00000000-0000-4000-8000-0000000000b3', '00000000-0000-4000-8000-0000000000a1', 'cerrado', 'web_proposal', 1500.00,
       'Seed lead: closed, Ana (P2)', id, 'Ana Test', 'ana@test', 'es',
       '{"pack":"P2","priceFrom":1400,"isApp":false,"pricingVersion":"2026-09-14","extras":[],"source":"rules","summary":"Seed proposal","scope":["Seed"]}'::jsonb,
       '00000000-0000-4000-8000-0000000000a2', 'BOB-TEST01', now()
from public.pack_templates where slug = 'gestion-logica'
on conflict (id) do nothing;

insert into public.clients (id, lead_id, user_id, pack_template_id, project_phase, invite_email)
select '00000000-0000-4000-8000-0000000000c1', '00000000-0000-4000-8000-0000000000b3',
       '00000000-0000-4000-8000-0000000000a2', id, 'desarrollo', 'ana@test'
from public.pack_templates where slug = 'gestion-logica'
on conflict (id) do nothing;

-- 6) A second client, still unclaimed, invited as sin@test: the claim test checks that an unconfirmed email gets nothing.
insert into public.leads (id, assigned_staff_id, estado, fuente, monto, notas, pack_template_id)
select '00000000-0000-4000-8000-0000000000b4', '00000000-0000-4000-8000-0000000000a1', 'cerrado', 'web_form', 900.00,
       'Seed lead: closed, invited as sin@test (P1)', id
from public.pack_templates where slug = 'landing'
on conflict (id) do nothing;

insert into public.clients (id, lead_id, user_id, pack_template_id, project_phase, invite_email)
select '00000000-0000-4000-8000-0000000000c2', '00000000-0000-4000-8000-0000000000b4', null, id, 'briefing', 'sin@test'
from public.pack_templates where slug = 'landing'
on conflict (id) do nothing;

-- 6b) sin@test has an old proposal lead by email: area_lead_summary() must still return nothing while the email is unconfirmed.
insert into public.leads (id, assigned_staff_id, estado, fuente, notas, contact_name, contact_email, locale, ai_proposal)
values ('00000000-0000-4000-8000-0000000000b5', '00000000-0000-4000-8000-0000000000a1', 'nuevo', 'web_proposal',
        'Seed lead: proposal by sin@test (unconfirmed)', 'Sin Test', 'sin@test', 'es',
        '{"pack":"P1","priceFrom":900,"isApp":false,"pricingVersion":"2026-09-14","extras":[],"source":"rules","summary":"Seed proposal","scope":["Seed"]}'::jsonb)
on conflict (id) do nothing;

-- 7) Reward: Bob (premium, 20 %) referred Ana's P2 order. Pending.
insert into public.affiliate_rewards (id, affiliate_id, lead_id, type, amount, base_amount, percent, pricing_version, status) values
  ('00000000-0000-4000-8000-0000000000f1', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000b3',
   'percent', 280.00, 1400.00, 20.00, '2026-09-14', 'pending')
on conflict (id) do nothing;

-- 8) Comments: one approved (Bob), one pending each for Ana and Bob.
insert into public.blog_comments (id, slug, locale, user_id, body, status, author_name) values
  ('00000000-0000-4000-8000-000000000d01', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a3', 'Seed comment: approved', 'approved', 'Bob'),
  ('00000000-0000-4000-8000-000000000d02', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Seed comment: pending (Ana)', 'pending', 'Ana'),
  ('00000000-0000-4000-8000-000000000d03', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a3', 'Seed comment: pending (Bob)', 'pending', 'Bob')
on conflict (id) do nothing;

-- 9) Area profile of Ana (Bob and sin@test have none: the tests create Bob's).
insert into public.user_profiles (user_id, first_audience, first_audience_source) values
  ('00000000-0000-4000-8000-0000000000a2', 'referral', 'ref')
on conflict (user_id) do nothing;

-- 10) Test-only helper (this file never reaches production): lets the RLS helper confirm sin@test just long enough
--     to log in, then unconfirm it. Only the service role can call it.
create or replace function public.test_set_email_confirmed(p_email text, p_confirmed boolean)
returns void language sql security definer set search_path = auth, pg_temp as $$
  update auth.users set email_confirmed_at = case when p_confirmed then now() else null end where email = p_email
$$;
revoke all on function public.test_set_email_confirmed(text, boolean) from public, anon, authenticated;
grant execute on function public.test_set_email_confirmed(text, boolean) to service_role;
