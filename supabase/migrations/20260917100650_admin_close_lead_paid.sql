-- Task 1.8 (DT §6.2; UX §9.9). Close a lead as paid + reward, in one transaction.
create or replace function public.admin_close_lead_paid(
  p_lead_id uuid, p_base_amount numeric, p_reward_type text, p_reward_amount numeric,
  p_reward_percent numeric, p_pricing_version text, p_generate_reward boolean
) returns uuid language plpgsql security definer set search_path = public as $$
declare v_aff uuid; v_reward uuid;
begin
  if private.staff_role_of((select auth.uid())) is distinct from 'admin' then raise exception 'forbidden'; end if;
  -- monto = base of the first order without VAT; the inherited trigger leads_financial_integrity requires monto and on_lead_close creates clients
  update public.leads set monto = p_base_amount, estado = 'cerrado', paid_at = now() where id = p_lead_id and paid_at is null;
  if not found then raise exception 'lead_already_closed_or_missing'; end if;
  if p_generate_reward then
    select a.id into v_aff from public.affiliates a join public.leads l on l.affiliate_code = a.code where l.id = p_lead_id;
    if v_aff is not null then
      insert into public.affiliate_rewards (affiliate_id, lead_id, type, amount, base_amount, percent, pricing_version)
        values (v_aff, p_lead_id, p_reward_type, p_reward_amount, p_base_amount, p_reward_percent, p_pricing_version)
        returning id into v_reward;
    end if;
  end if;
  return v_reward;
end $$;
revoke all on function public.admin_close_lead_paid(uuid, numeric, text, numeric, numeric, text, boolean) from public, anon;
grant execute on function public.admin_close_lead_paid(uuid, numeric, text, numeric, numeric, text, boolean) to authenticated;
