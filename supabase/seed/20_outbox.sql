insert into public.notifications (user_id, event, title, body, href, read_at)
values
  ('10000000-0000-4000-8000-000000000001', 'invitation_accepted', 'Prueba Closer', null, '/admin/usuarios', now() - interval '1 day'),
  ('10000000-0000-4000-8000-000000000001', 'job_failed', 'radar.scan', 'Prueba: fallo de ejemplo', '/admin/sistema', null),
  ('10000000-0000-4000-8000-000000000002', 'lead_claimed', 'Prueba Interesado WhatsApp', 'project', '/crm/contactos', null);

insert into public.notification_prefs (user_id, event, telegram, email, bell)
values
  ('10000000-0000-4000-8000-000000000001', 'lead_new', true, false, true);
