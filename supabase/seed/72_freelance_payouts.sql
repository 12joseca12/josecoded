insert into public.payouts (id, beneficiary_id, period_start, period_end, cadence, total, withholding_rate, net_total, status, issued_at, paid_at, paid_reference, created_by, kind)
values
  ('73000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000004', current_date - 60, current_date - 31, 'biweekly', 350, 0, 350, 'paid', now() - interval '30 days', current_date - 28, 'Prueba: transferencia 0001', '10000000-0000-4000-8000-000000000001', 'freelance');

insert into public.freelance_fee_items (id, fee_id, label, hours, amount, worked_on, status, submitted_by, approved_at, approved_by, payout_id)
values
  ('75000000-0000-4000-8000-000000000007', '74000000-0000-4000-8000-000000000001', 'Prueba: sistema de componentes', 10, null, current_date - 45, 'paid', '10000000-0000-4000-8000-000000000004', now() - interval '40 days', '10000000-0000-4000-8000-000000000001', '73000000-0000-4000-8000-000000000002');
