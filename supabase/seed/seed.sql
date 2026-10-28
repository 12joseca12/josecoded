-- Local/CI seed (supabase db reset). Test data only; never applied to production.
-- Task 1.6 (plan v3.2, DATOS §5): the four accounts, Jose as staff and the price catalogue. CRM, area, affiliates and
-- comments arrive with 1.8a; chat with 1.8b.

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

-- 10) Test-only helper (this file never reaches production): lets the RLS helper confirm sin@test just long enough
--     to log in, then unconfirm it. Only the service role can call it.
create or replace function public.test_set_email_confirmed(p_email text, p_confirmed boolean)
returns void language sql security definer set search_path = '' as $$
  update auth.users set email_confirmed_at = case when p_confirmed then now() else null end where email = p_email
$$;
revoke all on function public.test_set_email_confirmed(text, boolean) from public, anon, authenticated;
grant execute on function public.test_set_email_confirmed(text, boolean) to service_role;
