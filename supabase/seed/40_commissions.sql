insert into public.deals (id, contact_id, stage, via, amount, won_amount, won_at, recurring_monthly, currency)
values
  ('30000000-0000-4000-8000-000000000003', '20000000-0000-4000-8000-000000000001', 'won', 'project', 3000, 3000, now() - interval '20 days', 60, 'EUR'),
  ('30000000-0000-4000-8000-000000000004', '20000000-0000-4000-8000-000000000002', 'won', 'project', 1500, 1500, now() - interval '10 days', null, 'EUR');

update public.profiles
set closer_recurring_rate = 5
where id = '10000000-0000-4000-8000-000000000002';

update public.profiles
set closer_recurring_rate = 4, parent_recurring_rate = 2
where id = '10000000-0000-4000-8000-000000000003';

insert into public.commissions (
  id, deal_id, closer_id, closer_rate, closer_recurring_rate, subcloser_id, subcloser_rate, subcloser_recurring_rate,
  expected_base, expected_closer_amount, expected_subcloser_amount
)
values
  ('60000000-0000-4000-8000-000000000001', '30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000002', 10, 5, null, null, null, 3000, 300, 0),
  ('60000000-0000-4000-8000-000000000002', '30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000002', 5, 2, '10000000-0000-4000-8000-000000000003', 10, 4, 1500, 75, 150);
