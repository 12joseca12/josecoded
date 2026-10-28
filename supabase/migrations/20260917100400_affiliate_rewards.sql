-- Task 1.8 (DT §6.2). Affiliate rewards: one per lead, written by admin_close_lead_paid() or the admin.
create table public.affiliate_rewards (
  id           uuid primary key default gen_random_uuid(),
  affiliate_id uuid not null references public.affiliates(id) on delete cascade,
  lead_id      uuid not null unique references public.leads(id) on delete restrict,
  type         text not null check (type in ('maintenance_months','percent')),
  amount       numeric(10,2) not null check (amount > 0),   -- months or euros depending on type
  base_amount  numeric(10,2) not null,                       -- first order without VAT
  percent      numeric(5,2),                                 -- 10 or 20 if type='percent'
  pricing_version text not null,
  status       text not null default 'pending' check (status in ('pending','paid')),
  paid_at      timestamptz,
  created_at   timestamptz not null default now(),
  constraint rewards_paid_consistency check ((status = 'paid') = (paid_at is not null))
);
create index idx_affiliate_rewards_affiliate on public.affiliate_rewards (affiliate_id, status);
alter table public.affiliate_rewards enable row level security;
grant select, insert, update on public.affiliate_rewards to authenticated;
create policy "rewards read own or admin" on public.affiliate_rewards for select to authenticated
  using (affiliate_id in (select id from public.affiliates where user_id = (select auth.uid())) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "rewards admin insert" on public.affiliate_rewards for insert to authenticated
  with check (private.staff_role_of((select auth.uid())) = 'admin');
create policy "rewards admin mark paid" on public.affiliate_rewards for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin' and status = 'pending')
  with check (private.staff_role_of((select auth.uid())) = 'admin' and status = 'paid' and paid_at is not null);
