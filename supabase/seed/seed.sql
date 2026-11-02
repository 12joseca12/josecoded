-- Local/CI seed (supabase db reset). Test data only; never applied to production.
-- Task 1.6 (plan v3.2, DATOS §5): the four accounts, Jose as staff and the price catalogue.
-- Task 1.8a: CRM, leads, client area, affiliates and comments (sections 4-9). Task 1.8b: chat (section 10).
-- Fixed ids (apps/web/tests/helpers/supabase-test-clients.ts SEED mirrors them): users …a1-a4, organisation …0101,
-- contacts …02xx, leads …03xx, clients …04xx, tasks …05xx, task comments …06xx, client extras …07xx,
-- affiliates …08xx, rewards …09xx, blog comments …0axx, chat contexts …0bxx, chat threads …0cxx, chat messages …0dxx,
-- stories …0exx, commissions …0fxx, crm imports …10xx, import conflicts …11xx, quotes …12xx, quote items …13xx,
-- content entries …14xx, content versions …16xx, staff invites …15xx.
-- Emails of non-users use the reserved example.test domain.

-- 1) Auth users (email + password, only for the local tests: visitors are passwordless in production, DATOS Q4).
--    Password for all: test-password-123 (carla@test and dani@test, the closers of 1.8e, are confirmed too). jose/ana/bob are confirmed; sin@test is NOT confirmed (D35:
--    claim_client_access and area_lead_summary must refuse unconfirmed emails). GoTrue refuses the password login of an
--    unconfirmed user, so the test helper confirms sin@test just for the login with test_set_email_confirmed()
--    (section 11) and undoes it. private.handle_new_user() creates the four user_profiles rows.
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
   '{"provider":"email","providers":["email"]}', '{}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a5', 'authenticated', 'authenticated',
   'carla@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Carla Test"}', now(), now(), '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '00000000-0000-4000-8000-0000000000a6', 'authenticated', 'authenticated',
   'dani@test', extensions.crypt('test-password-123', extensions.gen_salt('bf')), now(),
   '{"provider":"email","providers":["email"]}', '{"full_name":"Dani Test"}', now(), now(), '', '', '', '')
on conflict (id) do nothing;

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', u.email_confirmed_at is not null),
       'email', now(), now(), now()
from auth.users u
where u.email in ('jose@test', 'ana@test', 'bob@test', 'sin@test', 'carla@test', 'dani@test')
on conflict do nothing;

-- 2) Staff: Jose is admin (Ana, Bob and sin@test are plain users). In production the controller inserts this row with
--    Jose's real user id in gate 1.9.
insert into public.staff_members (user_id, role, display_name, telegram_chat_id)
values ('00000000-0000-4000-8000-0000000000a1', 'admin', 'Jose', '0000000001')
on conflict (user_id) do nothing;

--    Closers (D51): carla is active with a 10 % rate fixed on her invitation; dani was switched off (15 %) and still owns
--    a contact. Both invitations are already claimed.
insert into public.staff_members (user_id, role, display_name, invited_by, commission_rate, disabled_at)
values ('00000000-0000-4000-8000-0000000000a5', 'closer', 'Carla', '00000000-0000-4000-8000-0000000000a1', 10, null),
       ('00000000-0000-4000-8000-0000000000a6', 'closer', 'Dani', '00000000-0000-4000-8000-0000000000a1', 15, now() - interval '3 days')
on conflict (user_id) do nothing;

insert into public.staff_invites (id, email, role, commission_rate, invited_by, claimed_at, claimed_user_id) values
  ('00000000-0000-4000-8000-000000001501', 'carla@test', 'closer', 10, '00000000-0000-4000-8000-0000000000a1',
   now() - interval '20 days', '00000000-0000-4000-8000-0000000000a5'),
  ('00000000-0000-4000-8000-000000001502', 'dani@test', 'closer', 15, '00000000-0000-4000-8000-0000000000a1',
   now() - interval '20 days', '00000000-0000-4000-8000-0000000000a6')
on conflict (id) do nothing;

-- 3) Price catalogue with the values of content/pricing.json (version 2026-09-14), names and texts included
--    (the form of `pnpm pricing:sync-db --seed`). P5 is the mobile app (the file lists it as APP_MVP / APP_PLUS: option plus
--    of P5, D37). HIDDEN_PACK is not in the file: it exists to prove that a hidden pack never reaches the snapshot.
--    The published snapshot is set at the end so the catalogue starts «published» (pricing_published() has a value).
insert into public.packs (code, kind, slug, name, includes, for_whom, price, weeks, sort, visible, pricing_version) values
  ('P1', 'web', 'landing', '{"es": "Web básica", "en": "{{DATO: pack P1 name (en)}}"}'::jsonb, '{"es": ["Web de presentación + contacto + SEO base + textos legales. Sin gestión ni pedidos"], "en": ["{{DATO: pack P1 includes (en)}}"]}'::jsonb, '{"es": "{{DATO: pack P1 forWhom (es)}}", "en": "{{DATO: pack P1 forWhom (en)}}"}'::jsonb, 900, 1, 1, true, '2026-09-14'),
  ('P2', 'web', 'gestion-logica', '{"es": "Pedidos / reservas", "en": "{{DATO: pack P2 name (en)}}"}'::jsonb, '{"es": ["P1 + pedidos o reservas + gestión básica (subir, modificar, eliminar productos o citas). Sin panel interno"], "en": ["{{DATO: pack P2 includes (en)}}"]}'::jsonb, '{"es": "{{DATO: pack P2 forWhom (es)}}", "en": "{{DATO: pack P2 forWhom (en)}}"}'::jsonb, 1400, 2, 2, true, '2026-09-14'),
  ('P3', 'web', 'crm-cms', '{"es": "Gestión", "en": "{{DATO: pack P3 name (en)}}"}'::jsonb, '{"es": ["P2 + panel interno con roles: pedidos, clientes, stock, agenda, exportaciones, facturación básica o integración con una herramienta del cliente"], "en": ["{{DATO: pack P3 includes (en)}}"]}'::jsonb, '{"es": "{{DATO: pack P3 forWhom (es)}}", "en": "{{DATO: pack P3 forWhom (en)}}"}'::jsonb, 2500, 2, 3, true, '2026-09-14'),
  ('P4', 'web', 'automatizaciones', '{"es": "Gestión + automatizaciones", "en": "{{DATO: pack P4 name (en)}}"}'::jsonb, '{"es": ["P3 + automatizaciones en n8n (avisos, emails, WhatsApp, sincronización con herramientas, informes) + IA (respuestas, clasificación, resúmenes)"], "en": ["{{DATO: pack P4 includes (en)}}"]}'::jsonb, '{"es": "{{DATO: pack P4 forWhom (es)}}", "en": "{{DATO: pack P4 forWhom (en)}}"}'::jsonb, 4200, 3, 4, true, '2026-09-14'),
  ('P5', 'app', 'app', '{"es": "App MVP", "en": "{{DATO: app APP_MVP name (en)}}"}'::jsonb, '{"es": ["React Native/Expo, iOS + Android, 3–5 pantallas, auth, backend simple (Supabase), publicación en stores"], "en": ["{{DATO: app APP_MVP includes (en)}}"]}'::jsonb, '{"es": "{{DATO: app APP_MVP forWhom (es)}}", "en": "{{DATO: app APP_MVP forWhom (en)}}"}'::jsonb, 4000, 6, 5, true, '2026-09-14'),
  ('HIDDEN_PACK', 'web', 'hidden-pack', '{"es": "Pack oculto", "en": "Hidden pack"}'::jsonb, '{"es": ["Interno"], "en": ["Internal"]}'::jsonb, '{"es": "Solo pruebas", "en": "Tests only"}'::jsonb, 777, 1, 99, false, '2026-09-14')
on conflict (code) do nothing;

insert into public.pack_options (pack_code, code, name, price, weeks, includes, for_whom, pricing_version) values
  ('P5', 'plus', '{"es": "App ampliada", "en": "{{DATO: app APP_PLUS name (en)}}"}'::jsonb, 6000, 8, '{"es": ["MVP + notificaciones, pagos o integración con API del cliente"], "en": ["{{DATO: app APP_PLUS includes (en)}}"]}'::jsonb, '{"es": "{{DATO: app APP_PLUS forWhom (es)}}", "en": "{{DATO: app APP_PLUS forWhom (en)}}"}'::jsonb, '2026-09-14')
on conflict (pack_code, code) do nothing;

insert into public.extras (code, name, description, price, billing, sort, pricing_version) values
  ('maintenance_basic', '{"es": "Mantenimiento básico", "en": "{{DATO: extra maintenance_basic label (en)}}"}'::jsonb, '{"es": "Copias, actualizaciones de dependencias y seguridad, 1 tanda de cambios de contenido al mes. Sin hosting", "en": "{{DATO: extra maintenance_basic description (en)}}"}'::jsonb, 49, 'monthly', 1, '2026-09-14'),
  ('maintenance_extended', '{"es": "Mantenimiento extendido", "en": "{{DATO: extra maintenance_extended label (en)}}"}'::jsonb, '{"es": "Básico + soporte prioritario (24 h laborables) + 3 tandas de cambios + informe mensual + 2 h de desarrollo/mes acumulables", "en": "{{DATO: extra maintenance_extended description (en)}}"}'::jsonb, 149, 'monthly', 2, '2026-09-14'),
  ('seo_basic', '{"es": "SEO básico", "en": "{{DATO: extra seo_basic label (en)}}"}'::jsonb, '{"es": "Metadatos, Google Business, sitemap, velocidad", "en": "{{DATO: extra seo_basic description (en)}}"}'::jsonb, 250, 'one_off', 3, '2026-09-14'),
  ('seo_full', '{"es": "SEO completo", "en": "{{DATO: extra seo_full label (en)}}"}'::jsonb, '{"es": "SEO básico + keywords, 5 páginas optimizadas, enlazado interno, informe", "en": "{{DATO: extra seo_full description (en)}}"}'::jsonb, 600, 'one_off', 4, '2026-09-14'),
  ('geo', '{"es": "GEO", "en": "{{DATO: extra geo label (en)}}"}'::jsonb, '{"es": "Optimización para IA de buscadores y agentes: datos estructurados, llms.txt, contenido citable, directorios", "en": "{{DATO: extra geo description (en)}}"}'::jsonb, 300, 'one_off', 5, '2026-09-14'),
  ('security_audit', '{"es": "Análisis de ciberseguridad", "en": "{{DATO: extra security_audit label (en)}}"}'::jsonb, '{"es": "Revisión de cabeceras, dependencias, formularios, permisos y copias; informe con correcciones aplicadas", "en": "{{DATO: extra security_audit description (en)}}"}'::jsonb, 250, 'one_off', 6, '2026-09-14')
on conflict (code) do nothing;

update public.pricing_settings
   set pricing_version = '2026-09-14', published_snapshot = private.pricing_snapshot_build(),
       published_hash = md5(private.pricing_snapshot_build()::text), published_at = now();

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

-- 10) Chat (task 1.8b, DATOS §4.6). Contexts: client/es and curious/es published, partner/es still a draft; the real
--     copy is pending (redactor), so every fact is a visible {{DATO: …}} placeholder. Threads: one anonymous partner
--     thread (no user, no contact) with a visitor question and the assistant's answer, left unread for the admin; and
--     Ana's client thread (her user and her CRM contact), already read by Jose. The trigger fills last_message_at and
--     unread_for_admin and enqueues chat.visitor_message for each visitor message, as in real use.
insert into public.chat_contexts (id, "case", locale, version, status, title, body_md, facts, published_at, published_by)
values
  ('00000000-0000-4000-8000-000000000b01', 'client', 'es', 1, 'published', '{{DATO: título contexto cliente}}',
   '{{DATO: contexto del caso cliente (packs, plazos, proceso)}}',
   '{"availability":"{{DATO: disponibilidad}}","rates_ref":"pricing","stack":["Next.js","Cloudflare Workers","Supabase"],
     "links":{"servicios":"/servicios","contacto":"/contacto"},"dos":["{{DATO: qué sí}}"],"donts":["{{DATO: qué no}}"]}',
   now() - interval '7 days', '00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-000000000b02', 'curious', 'es', 1, 'published', '{{DATO: título contexto curioso}}',
   '{{DATO: contexto del caso curioso (quién es Jose, qué hace)}}',
   '{"availability":"{{DATO: disponibilidad}}","rates_ref":"pricing","stack":["Next.js"],"links":{"sobre_mi":"/sobre-mi"},
     "dos":["{{DATO: qué sí}}"],"donts":["{{DATO: qué no}}"]}',
   now() - interval '7 days', '00000000-0000-4000-8000-0000000000a1'),
  ('00000000-0000-4000-8000-000000000b03', 'partner', 'es', 1, 'draft', '{{DATO: título contexto partner}}',
   '{{DATO: contexto del caso partner (colaboración con agencias)}}', '{}', null, null)
on conflict (id) do nothing;

insert into public.chat_threads (id, visitor_id, user_id, contact_id, "case", locale, origin_path, context_version) values
  ('00000000-0000-4000-8000-000000000c01', '00000000-0000-4000-8000-0000000000e1', null, null, 'partner', 'es',
   '/partners', null),
  ('00000000-0000-4000-8000-000000000c02', '00000000-0000-4000-8000-0000000000e2', '00000000-0000-4000-8000-0000000000a2',
   '00000000-0000-4000-8000-000000000202', 'client', 'es', '/servicios#packs', 1)
on conflict (id) do nothing;

insert into public.chat_messages (id, thread_id, sender_role, content, created_at) values
  ('00000000-0000-4000-8000-000000000d01', '00000000-0000-4000-8000-000000000c01', 'visitor',
   'Seed: ¿colaboráis con agencias?', now() - interval '2 hours'),
  ('00000000-0000-4000-8000-000000000d02', '00000000-0000-4000-8000-000000000c01', 'assistant',
   'Seed: respuesta con el contexto curious (partner no está publicado)', now() - interval '2 hours' + interval '5 seconds'),
  ('00000000-0000-4000-8000-000000000d03', '00000000-0000-4000-8000-000000000c02', 'visitor',
   'Seed: ¿cuándo estará la revisión del diseño?', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000d04', '00000000-0000-4000-8000-000000000c02', 'assistant',
   'Seed: respuesta con el contexto client', now() - interval '1 day' + interval '5 seconds')
on conflict (id) do nothing;
update public.chat_threads set unread_for_admin = false where id = '00000000-0000-4000-8000-000000000c02';

-- 10b) Closers (task 1.8e, DATOS §14.7). carla (a5) owns three contacts: a client (with a won lead of 1.000 EUR and its
--      pending commission at the frozen 10 %, and a portal invitation nobody claimed), an open lead and an agency.
--      dani (a6, disabled) still owns one contact. Contacts of Jose have owner_id null.
insert into public.crm_contacts (id, kind, status, display_name, email, locale, source, owner_id, next_action, next_action_at) values
  ('00000000-0000-4000-8000-000000000210', 'client', 'active_client', 'Cliente de Carla', 'cliente-carla@example.test', 'es',
   'manual', '00000000-0000-4000-8000-0000000000a5', null, null),
  ('00000000-0000-4000-8000-000000000211', 'lead', 'new', 'Lead de Carla', 'lead-carla@example.test', 'es',
   'manual', '00000000-0000-4000-8000-0000000000a5', null, null),
  ('00000000-0000-4000-8000-000000000212', 'agency', 'pending', 'Agencia de Carla', 'agencia-carla@example.test', 'es',
   'manual', '00000000-0000-4000-8000-0000000000a5', 'send invitation', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000220', 'lead', 'new', 'Lead de Dani', 'lead-dani@example.test', 'es',
   'manual', '00000000-0000-4000-8000-0000000000a6', null, null)
on conflict (id) do nothing;

insert into public.leads (id, contact_id, status, source, via, pack_code, message, locale, amount, paid_at, idempotency_key) values
  ('00000000-0000-4000-8000-000000000310', '00000000-0000-4000-8000-000000000210', 'won', 'manual', 'client', 'P1',
   'Seed: lead ganado de Carla', 'es', 1000.00, now() - interval '5 days', 'seed:carla-won'),
  ('00000000-0000-4000-8000-000000000311', '00000000-0000-4000-8000-000000000211', 'open', 'manual', 'client', 'P2',
   'Seed: lead abierto de Carla', 'es', null, null, 'seed:carla-open')
on conflict (id) do nothing;

insert into public.clients (id, contact_id, lead_id, user_id, invite_email, pack_code, project_phase) values
  ('00000000-0000-4000-8000-000000000410', '00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000310',
   null, 'cliente-carla@example.test', 'P1', 'kickoff')
on conflict (id) do nothing;

insert into public.closer_commissions (id, closer_id, lead_id, contact_id, base_amount, percent, amount) values
  ('00000000-0000-4000-8000-000000000f01', '00000000-0000-4000-8000-0000000000a5', '00000000-0000-4000-8000-000000000310',
   '00000000-0000-4000-8000-000000000210', 1000.00, 10.00, 100.00)
on conflict (id) do nothing;

--      One import by carla (checksum seed-import-1): 3 rows created and 1 row whose email belongs to Marta (Jose's
--      contact), waiting in the conflict queue.
insert into public.crm_imports (id, owner_id, file_name, checksum, row_count, created_count, conflicts_count) values
  ('00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-0000000000a5', 'seed.csv', 'seed-import-1', 4, 3, 1)
on conflict (id) do nothing;
insert into public.crm_import_conflicts (id, import_id, owner_id, row_index, "row", existing_contact_id, existing_owner_id) values
  ('00000000-0000-4000-8000-000000001101', '00000000-0000-4000-8000-000000001001', '00000000-0000-4000-8000-0000000000a5', 4,
   '{"display_name": "Marta (Carla)", "email": "marta@example.test", "kind": "lead", "role": "Gerente", "city": "Madrid", "tags": ["csv"], "locale": "es"}',
   '00000000-0000-4000-8000-000000000201', null)
on conflict (id) do nothing;

-- 10c) A story proposed by Ana (client 0401): leaves story.proposed in the outbox and a timeline entry.
insert into public.client_user_stories (id, client_id, author_user_id, title, as_a, i_want, so_that, acceptance_criteria) values
  ('00000000-0000-4000-8000-000000000e01', '00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-0000000000a2',
   'Reservas', 'dueña', 'reservar online', 'no perder llamadas', array['Formulario', 'Correo'])
on conflict (id) do nothing;

-- 10d) Site content: one override with a draft different from the published value and the published settings.
insert into public.site_content_entries (id, kind, key, locale, draft, published, published_version, draft_updated_at, published_at) values
  ('00000000-0000-4000-8000-000000001401', 'message_override', 'home.hero.title', 'es', '{"value": "Borrador del titular"}',
   '{"value": "Titular publicado"}', 1, now(), now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000001402', 'settings', 'settings', null,
   '{"sections": {"lab": true, "blog": true, "partners": true, "projects": true, "chat": true}, "prices": {"showPrices": true}, "home": {"scenes": []}}',
   '{"sections": {"lab": true, "blog": true, "partners": true, "projects": true, "chat": true}, "prices": {"showPrices": true}, "home": {"scenes": []}}',
   1, now(), now() - interval '2 days')
on conflict (id) do nothing;
insert into public.site_content_versions (id, entry_id, version, content, published_at) values
  ('00000000-0000-4000-8000-000000001601', '00000000-0000-4000-8000-000000001401', 1, '{"value": "Titular publicado"}', now() - interval '2 days'),
  ('00000000-0000-4000-8000-000000001602', '00000000-0000-4000-8000-000000001402', 1,
   '{"sections": {"lab": true, "blog": true, "partners": true, "projects": true, "chat": true}, "prices": {"showPrices": true}, "home": {"scenes": []}}',
   now() - interval '2 days')
on conflict (id) do nothing;

-- 10e) A custom quote (draft) of carla's client with two extras: seo_full x 1 + maintenance_basic x 12 = 1.188 EUR. The
--      lines take name and price from the extras (trigger); the subtotal follows.
insert into public.custom_quotes (id, contact_id, lead_id, title, pricing_version, created_by) values
  ('00000000-0000-4000-8000-000000001201', '00000000-0000-4000-8000-000000000210', '00000000-0000-4000-8000-000000000310',
   'Presupuesto seed', '2026-09-14', '00000000-0000-4000-8000-0000000000a5')
on conflict (id) do nothing;
insert into public.custom_quote_items (id, quote_id, extra_code, quantity, sort) values
  ('00000000-0000-4000-8000-000000001301', '00000000-0000-4000-8000-000000001201', 'seo_full', 1, 1),
  ('00000000-0000-4000-8000-000000001302', '00000000-0000-4000-8000-000000001201', 'maintenance_basic', 12, 2)
on conflict (id) do nothing;

-- 11) Test-only helper (this file never reaches production): lets the RLS helper confirm sin@test just long enough
--     to log in, then unconfirm it. Only the service role can call it.
create or replace function public.test_set_email_confirmed(p_email text, p_confirmed boolean)
returns void language sql security definer set search_path = '' as $$
  update auth.users set email_confirmed_at = case when p_confirmed then now() else null end where email = p_email
$$;
revoke all on function public.test_set_email_confirmed(text, boolean) from public, anon, authenticated;
grant execute on function public.test_set_email_confirmed(text, boolean) to service_role;
