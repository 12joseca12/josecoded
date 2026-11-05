insert into public.payment_schedule (id, deal_id, label, kind, percent, amount, due_at, status, sort)
values
  ('70000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', 'Anticipo 40 %', 'milestone', 40, 1200, current_date - 16, 'scheduled', 1),
  ('70000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000003', 'Entrega intermedia 40 %', 'milestone', 40, 1200, current_date - 6, 'scheduled', 2),
  ('70000000-0000-4000-8000-000000000003', '30000000-0000-4000-8000-000000000003', 'Entrega final 20 %', 'milestone', 20, 600, current_date + 24, 'scheduled', 3),
  ('70000000-0000-4000-8000-000000000004', '30000000-0000-4000-8000-000000000003', 'Mantenimiento mes 1', 'recurring', null, 60, current_date + 10, 'scheduled', 4),
  ('70000000-0000-4000-8000-000000000005', '30000000-0000-4000-8000-000000000004', 'Anticipo 50 %', 'milestone', 50, 750, current_date - 8, 'scheduled', 1),
  ('70000000-0000-4000-8000-000000000006', '30000000-0000-4000-8000-000000000004', 'Entrega final 50 %', 'milestone', 50, 750, current_date + 20, 'scheduled', 2);

insert into private.counters (key, value)
values ('proforma-' || to_char(now() at time zone 'Europe/Madrid', 'YYYY'), 1);

insert into public.invoices (id, deal_id, schedule_id, kind, number, issued_at, amount_net, vat_rate, vat_amount, amount_gross, status)
values
  ('71000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000002', 'proforma',
    'PF-' || to_char(now() at time zone 'Europe/Madrid', 'YYYY') || '-001', current_date - 12, 1200, 0, 0, 1200, 'sent');

update public.payment_schedule set status = 'proforma_sent' where id = '70000000-0000-4000-8000-000000000002';

insert into public.payments (id, deal_id, schedule_id, kind, nature, amount_net, received_at, method, reference)
values
  ('72000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '70000000-0000-4000-8000-000000000001', 'payment', 'project', 1200, current_date - 14, 'transfer', 'Prueba: transferencia anticipo'),
  ('72000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', '70000000-0000-4000-8000-000000000005', 'payment', 'project', 750, current_date - 6, 'card', 'Prueba: tarjeta anticipo');

update public.commission_lines
set status = 'approved', approved_at = now() - interval '1 day', approved_by = '10000000-0000-4000-8000-000000000001'
where payment_id = '72000000-0000-4000-8000-000000000001';
