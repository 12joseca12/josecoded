-- Local/CI seed (supabase db reset). Test data only; never applied to production.
-- Task 1.6 (plan v3.2, DATOS §5): the four accounts, Jose as staff and the price catalogue.
-- Task 1.8a: CRM, leads, client area, affiliates and comments (sections 4-9). Chat arrives with 1.8b.
-- Fixed ids (apps/web/tests/helpers/supabase-test-clients.ts SEED mirrors them): users …a1-a4, organisation …0101,
-- contacts …02xx, leads …03xx, clients …04xx, tasks …05xx, task comments …06xx, client extras …07xx,
-- affiliates …08xx, rewards …09xx, blog comments …0axx. Emails of non-users use the reserved example.test domain.

-- 1) Auth users (email + password, only for the local tests: visitors are passwordless in production, DATOS Q4).
--    Password for all four: test-password-123. jose/ana/bob are confirmed; sin@test is NOT confirmed (D35:
--    claim_client_access and area_lead_summary must refuse unconfirmed emails). GoTrue refuses the password login of an
--    unconfirmed user, so the test helper confirms sin@test just for the login with test_set_email_confirmed()
--    (section 10) and undoes it. private.handle_new_user() creates the four user_profiles rows.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new
) values
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a1', 'authenticated', 'authenticated',
   'jose@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Jose Test"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a2', 'authenticated', 'authenticated',
   'ana@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Ana Test"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a3', 'authenticated', 'authenticated',
   'bob@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Bob Test","locale":"en"}', now(), now(), '', '', '', ''),
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

-- 2) Staff: Jose is admin (Ana, Bob and sin@test are plain users). In production the controller inserts this row with
--    Jose's real user id in gate 1.9.
insert into public.staff_members (user_id, role, display_name, telegram_chat_id)
values ('00000000-0000-4000-8000-0000000000a1', 'admin', 'Jose', '0000000001')
on conflict (user_id) do nothing;

-- 3) Price catalogue with the values of packages/pricing/pricing.json (version 2026-09-14). P5 is the mobile app
--    (pricing.json still lists it as apps APP_MVP 4000 € / 6 weeks and APP_PLUS 6000 €: the plus option of P5, D37).
--    In production these rows come from `pnpm pricing:sync-db` (supabase/generated/pricing-sync.sql).
insert into public.packs (code, slug, price, weeks, sort, pricing_version) values
  ('P1', 'landing',          900,  1, 1, '2026-09-14'),
  ('P2', 'gestion-logica',   1400, 2, 2, '2026-09-14'),
  ('P3', 'crm-cms',          2500, 2, 3, '2026-09-14'),
  ('P4', 'automatizaciones', 4200, 3, 4, '2026-09-14'),
  ('P5', 'app',              4000, 6, 5, '2026-09-14')
on conflict (code) do nothing;

insert into public.pack_options (pack_code, code, price, pricing_version) values
  ('P5', 'plus', 6000, '2026-09-14')
on conflict (pack_code, code) do nothing;

insert into public.extras (code, price, pricing_version) values
  ('maintenance_basic',    49,  '2026-09-14'),
  ('maintenance_extended', 149, '2026-09-14'),
  ('seo_basic',            250, '2026-09-14'),
  ('seo_full',             600, '2026-09-14'),
  ('geo',                  300, '2026-09-14'),
  ('security_audit',       250, '2026-09-14')
on conflict (code) do nothing;

-- 4) Affiliates first (leads.affiliate_code references them). Fixed codes: the trigger only generates when null.
insert into public.affiliates (id, user_id, code, level) values
  ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-0000000000a2', 'ANA-TEST01', 'standard'),
  ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-0000000000a3', 'BOB-TEST01', 'premium')
on conflict (id) do nothing;

-- 5) CRM: one agency organisation and five contacts.
insert into public.crm_organizations (id, name, name_normalized, kind, city, fit, source) values
  ('00000000-0000-4000-8000-000000000101', 'Agencia Test', 'agencia test', 'agency', 'Test', 4, 'manual')
on conflict (id) do nothing;

insert into public.crm_contacts (id, organization_id, kind, status, display_name, email, locale, user_id, source,
                                 next_action, next_action_at) values
  -- Marta: web lead with an open P2 proposal referred by Ana.
  ('00000000-0000-4000-8000-000000000201', null, 'lead', 'new', 'Marta Test', 'marta@example.test', 'es', null,
   'web_proposal', null, null),
  -- Ana: active P2 client (her user is linked).
  ('00000000-0000-4000-8000-000000000202', null, 'client', 'active_client', 'Ana Test', 'ana@test', 'es',
   '00000000-0000-4000-8000-0000000000a2', 'web_proposal', null, null),
  -- Agency contact still pending (C2 inbox: due yesterday).
  ('00000000-0000-4000-8000-000000000203', '00000000-0000-4000-8000-000000000101', 'agency', 'pending',
   'Contacto Agencia Test', 'agencia@example.test', 'es', null, 'import_agencias', 'send invitation',
   now() - interval '1 day'),
  -- Recruiter, new.
  ('00000000-0000-4000-8000-000000000204', null, 'recruiter', 'new', 'Recruiter Test', 'recruiter@example.test', 'en',
   null, 'manual', null, null),
  -- Invited client with no user yet (sin@test is unconfirmed: it cannot claim it).
  ('00000000-0000-4000-8000-000000000205', null, 'client', 'active_client', 'Sin Test', 'sin@test', 'es', null,
   'manual', null, null)
on conflict (id) do nothing;

-- 6) Leads: Marta open P2 (web_proposal, referred by Ana); Ana won and paid P2 (referred by Bob); sin's won P1.
insert into public.leads (id, contact_id, status, source, via, pack_code, ai_proposal, message, locale, amount, paid_at,
                          affiliate_code, idempotency_key, user_id) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', 'open', 'web_proposal', 'client',
   'P2', '{"pack":"P2","priceFrom":1400,"isApp":false,"pricingVersion":"2026-09-14","extras":[],"source":"rules","summary":"Seed proposal","scope":["Seed"]}',
   'Seed: open proposal', 'es', null, null, 'ANA-TEST01', 'seed:marta', null),
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000202', 'won', 'web_proposal', 'client',
   'P2', '{"pack":"P2","priceFrom":1400,"isApp":false,"pricingVersion":"2026-09-14","extras":[],"source":"rules","summary":"Seed proposal","scope":["Seed"]}',
   'Seed: Ana proposal', 'es', 1400.00, now() - interval '30 days', 'BOB-TEST01', 'seed:ana',
   '00000000-0000-4000-8000-0000000000a2'),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000205', 'won', 'manual', 'client',
   'P1', null, 'Seed: invited client', 'es', 900.00, now() - interval '10 days', null, 'seed:sin', null)
on conflict (id) do nothing;

insert into public.crm_interactions (contact_id, kind, channel, direction, actor, lead_id, body, payload) values
  ('00000000-0000-4000-8000-000000000201', 'lead_created', 'web_proposal', 'in', 'contact',
   '00000000-0000-4000-8000-000000000301', 'Seed: open proposal', '{"source":"web_proposal","via":"client"}'),
  ('00000000-0000-4000-8000-000000000202', 'lead_won', null, 'internal', 'jose',
   '00000000-0000-4000-8000-000000000302', null, '{"amount":1400}');

-- 7) Clients: Ana (P2, claimed) and the invited sin@test (P1, unclaimed). Two tasks of Ana, one internal and one
--    visible comment, and her included seo_basic extra.
insert into public.clients (id, contact_id, lead_id, user_id, invite_email, pack_code, project_phase, starts_at,
                            notes_internal) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000202', '00000000-0000-4000-8000-000000000302',
   '00000000-0000-4000-8000-0000000000a2', 'ana@test', 'P2', 'build', current_date - 20, 'Seed: internal note on Ana'),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000205', '00000000-0000-4000-8000-000000000303',
   null, 'sin@test', 'P1', 'kickoff', null, null)
on conflict (id) do nothing;

insert into public.client_tasks (id, client_id, title, status, sort) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000401', 'Seed: send the logo', 'done', 1),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000401', 'Seed: review the design', 'pending', 2)
on conflict (id) do nothing;

insert into public.client_task_comments (id, client_id, task_id, author_user_id, body, internal) values
  ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502',
   '00000000-0000-4000-8000-0000000000a1', 'Seed: internal comment', true),
  ('00000000-0000-4000-8000-000000000602', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000502',
   '00000000-0000-4000-8000-0000000000a1', 'Seed: visible comment', false)
on conflict (id) do nothing;

insert into public.client_extras (id, client_id, extra_code, free, status, source_lead_id) values
  ('00000000-0000-4000-8000-000000000701', '00000000-0000-4000-8000-000000000401', 'seo_basic', true, 'included',
   '00000000-0000-4000-8000-000000000302')
on conflict (id) do nothing;

-- 8) Reward: Bob (premium, 20 %) referred Ana's P2 order. Pending.
insert into public.affiliate_rewards (id, affiliate_id, lead_id, type, amount, base_amount, percent, pricing_version) values
  ('00000000-0000-4000-8000-000000000901', '00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000302',
   'percent', 280.00, 1400.00, 20, '2026-09-14')
on conflict (id) do nothing;

-- 9) Comments: one approved (Bob), one pending each for Ana and Bob. The two pending ones leave comment.pending events
--    in the outbox, as in real use.
insert into public.blog_comments (id, post_slug, locale, user_id, author_name, body, status) values
  ('00000000-0000-4000-8000-000000000a01', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a3', 'Bob',
   'Seed comment: approved', 'approved'),
  ('00000000-0000-4000-8000-000000000a02', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a2', 'Ana',
   'Seed comment: pending (Ana)', 'pending'),
  ('00000000-0000-4000-8000-000000000a03', 'hello-world', 'es', '00000000-0000-4000-8000-0000000000a3', 'Bob',
   'Seed comment: pending (Bob)', 'pending')
on conflict (id) do nothing;

-- 10) Test-only helper (this file never reaches production): lets the RLS helper confirm sin@test just long enough
--     to log in, then unconfirm it. Only the service role can call it.
create or replace function public.test_set_email_confirmed(p_email text, p_confirmed boolean)
returns void language sql security definer set search_path = '' as $$
  update auth.users set email_confirmed_at = case when p_confirmed then now() else null end where email = p_email
$$;
revoke all on function public.test_set_email_confirmed(text, boolean) from public, anon, authenticated;
grant execute on function public.test_set_email_confirmed(text, boolean) to service_role;
