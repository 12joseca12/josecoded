insert into public.project_updates (id, project_id, author_id, task_id, body, visibility, created_at)
values
  ('76000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', null, 'Prueba: revisado el listado de productos, falta la paginacion.', 'internal', now() - interval '3 days'),
  ('76000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', '61000000-0000-4000-8000-000000000005', 'Prueba: el catalogo de productos ya carga desde la base de datos.', 'client', now() - interval '2 days'),
  ('76000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', null, 'Prueba: pendiente confirmar el formato de las imagenes.', 'internal', now() - interval '1 day'),
  ('76000000-0000-4000-8000-000000000004', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', null, 'Prueba: esta semana cerramos el catalogo y pasamos al formulario de contacto.', 'client', now() - interval '12 hours');
