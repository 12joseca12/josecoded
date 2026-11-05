insert into public.payouts (id, beneficiary_id, period_start, period_end, cadence, total, withholding_rate, net_total, status, created_by)
values
  ('73000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000002', current_date - 30, current_date - 1, 'biweekly', 120, 0, 120, 'draft', '10000000-0000-4000-8000-000000000001');

update public.commission_lines
set payout_id = '73000000-0000-4000-8000-000000000001'
where payment_id = '72000000-0000-4000-8000-000000000001'
  and beneficiary_id = '10000000-0000-4000-8000-000000000002';
