insert into public.conversations (id, kind, subject_user_id, first_page_path)
values ('70000000-0000-4000-8000-000000000001', 'closer', '10000000-0000-4000-8000-000000000002', null);

insert into public.conversation_members (conversation_id, user_id, role, added_by)
values ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', 'closer', '10000000-0000-4000-8000-000000000001')
on conflict do nothing;

insert into public.messages (id, conversation_id, author_kind, author_id, system_event, body, auto, created_at)
values
  ('71000000-0000-4000-8000-000000000001', '70000000-0000-4000-8000-000000000001', 'system', null, 'member_added', 'Prueba Closer', false, now() - interval '3 days'),
  ('71000000-0000-4000-8000-000000000002', '70000000-0000-4000-8000-000000000001', 'human', '10000000-0000-4000-8000-000000000002', null, 'Prueba: hola Jose, he hablado con un contacto nuevo.', false, now() - interval '2 days'),
  ('71000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 'human', '10000000-0000-4000-8000-000000000001', null, 'Prueba: genial, cuentame que necesita.', false, now() - interval '2 days' + interval '5 minutes'),
  ('71000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000001', 'human', '10000000-0000-4000-8000-000000000002', null, 'Prueba: quiere una web para su tienda. @Nexo, que pack encaja?', false, now() - interval '1 day'),
  ('71000000-0000-4000-8000-000000000005', '70000000-0000-4000-8000-000000000001', 'nexo', null, null, 'Prueba: respondo yo, Nexo, porque nadie ha contestado.', true, now() - interval '1 day' + interval '1 minute'),
  ('71000000-0000-4000-8000-000000000006', '70000000-0000-4000-8000-000000000001', 'human', '10000000-0000-4000-8000-000000000001', null, 'Prueba: gracias, lo reviso esta tarde.', false, now() - interval '3 hours');

insert into public.visitors (id, token_hash, locale)
values ('72000000-0000-4000-8000-000000000001', encode(sha256('seed-visitor-token'::bytea), 'hex'), 'es');

insert into public.conversations (id, kind, visitor_id, first_page_path)
values ('70000000-0000-4000-8000-000000000002', 'visitor', '72000000-0000-4000-8000-000000000001', '/es/servicios');

insert into public.messages (id, conversation_id, author_kind, body, page_path, created_at)
values ('71000000-0000-4000-8000-000000000007', '70000000-0000-4000-8000-000000000002', 'human', 'Prueba: cuanto cuesta una web?', '/es/servicios', now() - interval '20 minutes');

delete from private.jobs where kind = 'chat.reply';

update public.conversation_members
set last_read_at = now() - interval '1 day'
where conversation_id = '70000000-0000-4000-8000-000000000001'
  and user_id = '10000000-0000-4000-8000-000000000001';
