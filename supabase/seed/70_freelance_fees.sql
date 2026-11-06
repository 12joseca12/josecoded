insert into public.projects (id, name, client_id, phase, status, freelance_id, started_at, archived_at, created_by)
values
  ('60000000-0000-4000-8000-000000000002', 'Prueba: landing cerrada', '10000000-0000-4000-8000-000000000005', 'maintain', 'closed', null, current_date - 120, now() - interval '20 days', '10000000-0000-4000-8000-000000000001'),
  ('60000000-0000-4000-8000-000000000003', 'Prueba: identidad y maqueta', null, 'design', 'active', '10000000-0000-4000-8000-000000000004', current_date - 10, null, '10000000-0000-4000-8000-000000000001');

insert into public.freelance_fees (id, project_id, freelance_id, mode, amount, hourly_rate, hours_cap, note, agreed_by, closed_at)
values
  ('74000000-0000-4000-8000-000000000001', '60000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000004', 'hourly', null, 35, 60, 'Prueba: tarifa por horas', '10000000-0000-4000-8000-000000000001', null),
  ('74000000-0000-4000-8000-000000000002', '60000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', 'fixed', 900, null, null, 'Prueba: precio fijo', '10000000-0000-4000-8000-000000000001', null),
  ('74000000-0000-4000-8000-000000000003', '60000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000004', 'milestones', null, null, null, 'Prueba: por hitos', '10000000-0000-4000-8000-000000000001', null);

insert into public.freelance_fee_items (id, fee_id, label, hours, amount, worked_on, status, delivered_at, rejected_reason, submitted_by, approved_at, approved_by)
values
  ('75000000-0000-4000-8000-000000000001', '74000000-0000-4000-8000-000000000001', 'Prueba: catalogo de productos', 8, null, current_date - 6, 'approved', null, null, '10000000-0000-4000-8000-000000000004', now() - interval '5 days', '10000000-0000-4000-8000-000000000001'),
  ('75000000-0000-4000-8000-000000000002', '74000000-0000-4000-8000-000000000001', 'Prueba: ajustes de la portada', 6, null, current_date - 1, 'pending', null, null, '10000000-0000-4000-8000-000000000004', null, null),
  ('75000000-0000-4000-8000-000000000003', '74000000-0000-4000-8000-000000000001', 'Prueba: horas duplicadas', 4, null, current_date - 3, 'rejected', null, 'Prueba: horas duplicadas', '10000000-0000-4000-8000-000000000004', null, null),
  ('75000000-0000-4000-8000-000000000004', '74000000-0000-4000-8000-000000000002', 'Prueba: maquetacion', null, 600, current_date - 60, 'approved', now() - interval '61 days', null, '10000000-0000-4000-8000-000000000001', now() - interval '58 days', '10000000-0000-4000-8000-000000000001'),
  ('75000000-0000-4000-8000-000000000005', '74000000-0000-4000-8000-000000000002', 'Prueba: entrega final', null, 300, current_date - 22, 'delivered', now() - interval '22 days', null, '10000000-0000-4000-8000-000000000001', null, null),
  ('75000000-0000-4000-8000-000000000006', '74000000-0000-4000-8000-000000000003', 'Prueba: sistema de color y tipografia', null, 450, current_date + 7, 'pending', null, null, '10000000-0000-4000-8000-000000000001', null, null);

update public.freelance_fees set closed_at = now() - interval '20 days' where id = '74000000-0000-4000-8000-000000000002';
