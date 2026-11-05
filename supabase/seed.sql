insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000001', 'authenticated', 'authenticated', 'admin@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'closer@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000003', 'authenticated', 'authenticated', 'subcloser@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000004', 'authenticated', 'authenticated', 'freelance@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '10000000-0000-4000-8000-000000000005', 'authenticated', 'authenticated', 'client@example.com', '', now(), '{"provider":"email","providers":["email"]}', '{}', now(), now());

insert into public.profiles (id, role, full_name, parent_closer_id, closer_rate, parent_rate)
values
  ('10000000-0000-4000-8000-000000000001', 'admin', 'Prueba Admin', null, null, null),
  ('10000000-0000-4000-8000-000000000002', 'closer', 'Prueba Closer', null, 10, null),
  ('10000000-0000-4000-8000-000000000003', 'closer', 'Prueba Subcloser', '10000000-0000-4000-8000-000000000002', 10, 5),
  ('10000000-0000-4000-8000-000000000004', 'freelance', 'Prueba Freelance', null, null, null),
  ('10000000-0000-4000-8000-000000000005', 'client', 'Prueba Cliente', null, null, null);

insert into public.contacts (id, owner_id, full_name, email, organization, kind, source)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'Prueba Contacto Closer', 'contacto-closer@example.com', 'Prueba SL', 'prospect', 'manual'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000003', 'Prueba Contacto Subcloser', 'contacto-sub@example.com', 'Prueba SA', 'prospect', 'manual'),
  ('20000000-0000-4000-8000-000000000003', null, 'Prueba Contacto Sin Dueno', 'contacto-libre@example.com', null, 'other', 'manual');

insert into public.deals (id, contact_id, stage, via, amount)
values
  ('30000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000001', 'proposal', 'project', 2400),
  ('30000000-0000-4000-8000-000000000002', '20000000-0000-4000-8000-000000000002', 'new', 'freelance', 800);

insert into public.activities (contact_id, deal_id, author_id, kind, body, occurred_at)
values
  ('20000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'call', 'Prueba: primera llamada', now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000001', null, '10000000-0000-4000-8000-000000000002', 'note', 'Prueba: nota interna', now() - interval '1 day');

insert into public.leads (id, source, via, full_name, email, phone, organization, message, offer_url, company, page_path, locale, consent_at, status, assigned_to, assigned_at, has_domain, has_store_accounts)
values
  ('40000000-0000-4000-8000-000000000001', 'form', 'hiring', 'Prueba Interesada Contratacion', 'interesada-hiring@example.com', null, 'Prueba SL', 'Prueba: busco un perfil para mi equipo.', 'https://example.com/oferta', 'Prueba SL', '/es/contacto', 'es', now() - interval '3 hours', 'new', null, null, null, null),
  ('40000000-0000-4000-8000-000000000002', 'form', 'project', 'Prueba Interesado Pack', 'interesado-pack@example.com', '600000000', null, 'Prueba: quiero una web para mi tienda.', null, null, '/es/contacto', 'es', now() - interval '1 day', 'new', null, null, true, false),
  ('40000000-0000-4000-8000-000000000003', 'whatsapp', null, 'Prueba Interesado WhatsApp', null, '600000001', null, 'Prueba: escribio por WhatsApp.', null, null, null, null, null, 'assigned', '10000000-0000-4000-8000-000000000002', now() - interval '2 days', null, null);
