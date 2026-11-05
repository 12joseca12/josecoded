insert into public.projects (id, name, client_id, contact_id, offer_slug, brief, phase, freelance_id, started_at, due_at, created_by)
values
  ('60000000-0000-4000-8000-000000000001', 'Prueba: web de la tienda', '10000000-0000-4000-8000-000000000005', '20000000-0000-4000-8000-000000000001', 'web-negocio', 'Prueba: tienda pequena con catalogo y contacto.', 'build', '10000000-0000-4000-8000-000000000004', current_date - 30, current_date + 30, '10000000-0000-4000-8000-000000000001');

insert into public.stories (id, project_id, author_id, title, as_a, i_want, so_that, criteria, status, out_of_scope, estimate_hours, estimate_amount, decision_note, decided_by, decided_at)
values
  ('62000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'Prueba: buscador de productos', 'clienta de la tienda', 'buscar productos por nombre', 'encontrar lo que quiero rapido', array['Prueba: busca por nombre', 'Prueba: muestra aviso si no hay resultados'], 'proposed', false, null, null, null, null, null),
  ('62000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'Prueba: area de pedidos', 'clienta de la tienda', 'ver mis pedidos anteriores', 'repetir una compra', array['Prueba: lista de pedidos'], 'in_review', true, 12, 480, 'Prueba: queda fuera del alcance acordado.', '10000000-0000-4000-8000-000000000001', now() - interval '1 day'),
  ('62000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000005', 'Prueba: pagina de contacto', 'visitante', 'enviar un mensaje desde la web', 'preguntar antes de comprar', array['Prueba: formulario con confirmacion'], 'proposed', false, null, null, null, null, null);

insert into public.tasks (id, project_id, phase, title, description, status, assignee_id, story_id, sort)
values
  ('61000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', 'discover', 'Prueba: reunion de arranque', null, 'done', null, null, 0),
  ('61000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', 'discover', 'Prueba: enviar logotipo y textos', 'Prueba: logotipo en vector y textos de la portada.', 'done', '10000000-0000-4000-8000-000000000005', null, 1),
  ('61000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', 'design', 'Prueba: aprobar la maqueta de la portada', null, 'todo', '10000000-0000-4000-8000-000000000005', null, 0),
  ('61000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000001', 'design', 'Prueba: sistema de componentes', null, 'doing', '10000000-0000-4000-8000-000000000004', null, 1),
  ('61000000-0000-4000-8000-000000000005', '60000000-0000-4000-8000-000000000001', 'build', 'Prueba: catalogo de productos', null, 'doing', '10000000-0000-4000-8000-000000000004', null, 0),
  ('61000000-0000-4000-8000-000000000006', '60000000-0000-4000-8000-000000000001', 'build', 'Prueba: formulario de contacto', null, 'todo', null, '62000000-0000-4000-8000-000000000003', 1),
  ('61000000-0000-4000-8000-000000000007', '60000000-0000-4000-8000-000000000001', 'build', 'Prueba: pagina de condiciones', null, 'todo', null, null, 2),
  ('61000000-0000-4000-8000-000000000008', '60000000-0000-4000-8000-000000000001', 'publish', 'Prueba: conectar el dominio', null, 'todo', null, null, 0);

update public.stories
set status = 'in_tasks', task_id = '61000000-0000-4000-8000-000000000006', decided_by = '10000000-0000-4000-8000-000000000001', decided_at = now() - interval '2 days'
where id = '62000000-0000-4000-8000-000000000003';

insert into public.project_links (project_id, name, url, usage, created_by)
values
  ('60000000-0000-4000-8000-000000000001', 'Prueba: version de pruebas', 'https://staging.example.com/', 'Prueba: aqui ves el avance antes de publicar.', '10000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000001', 'Prueba: diseno en Figma', 'https://www.figma.com/file/prueba', null, '10000000-0000-4000-8000-000000000001');
