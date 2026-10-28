-- Task 1.8a (plan v3.2; DATOS v1.1 §4.4, §5, §6). Affiliates (A7) and their rewards; leads.affiliate_code FK;
-- affiliate_leads() (replaces the old security definer view) and admin_close_lead_paid().

create type public.affiliate_level as enum ('standard', 'premium');
create type public.reward_type as enum ('maintenance_months', 'percent');
create type public.reward_status as enum ('pending', 'paid');

create table public.affiliates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users (id) on delete cascade,
  code       text not null unique check (code ~ '^[A-Z0-9]{3,12}-[A-Z0-9]{6}$'),  -- = AFFILIATE_CODE_RE (packages/pricing)
  level      public.affiliate_level not null default 'standard',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.affiliates enable row level security;
create trigger affiliates_set_updated_at before update on public.affiliates
  for each row execute function private.set_updated_at();

-- Recycled from 20260917100300_affiliates.sql. The user never chooses the code: prefix from the first given name
-- (metadata, else the email local part), accents stripped, alphanumerics only, 3..12 characters ('REF' otherwise),
-- plus a 6-character random suffix without 0/1. A code sent by the caller (seed, admin) is kept.
create or replace function private.set_affiliate_code() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_name   text;
  v_prefix text;
  v_suffix text;
begin
  if new.code is not null then return new; end if;
  select coalesce(u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name', split_part(u.email, '@', 1))
    into v_name from auth.users u where u.id = new.user_id;
  v_prefix := upper(regexp_replace(
    extensions.unaccent('extensions.unaccent'::regdictionary, split_part(btrim(coalesce(v_name, '')), ' ', 1)),
    '[^A-Za-z0-9]', '', 'g'));
  v_prefix := substr(v_prefix, 1, 12);
  if length(v_prefix) < 3 then v_prefix := 'REF'; end if;
  loop
    v_suffix := translate(upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6)), '01', 'XZ');
    new.code := v_prefix || '-' || v_suffix;
    exit when not exists (select 1 from public.affiliates a where a.code = new.code);
  end loop;
  return new;
end $$;
revoke all on function private.set_affiliate_code() from public, anon, authenticated;
create trigger affiliates_set_code before insert on public.affiliates
  for each row execute function private.set_affiliate_code();

create policy affiliates_select on public.affiliates for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()));
-- A user signs up as standard; the level is changed only by the admin (no update policy for anyone else).
create policy affiliates_insert on public.affiliates for insert to authenticated
  with check ((user_id = (select auth.uid()) and level = 'standard') or (select private.is_admin()));
create policy affiliates_update on public.affiliates for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy affiliates_delete on public.affiliates for delete to authenticated using ((select private.is_admin()));
grant select, update, delete on public.affiliates to authenticated;
grant insert (user_id) on public.affiliates to authenticated;

alter table public.leads add constraint leads_affiliate_code_fkey
  foreign key (affiliate_code) references public.affiliates (code) on update cascade on delete set null;

create table public.affiliate_rewards (
  id              uuid primary key default gen_random_uuid(),
  affiliate_id    uuid not null references public.affiliates (id) on delete cascade,
  lead_id         uuid not null unique references public.leads (id) on delete restrict,
  type            public.reward_type not null,
  amount          numeric(10, 2) not null check (amount > 0),  -- months or euros depending on type
  base_amount     numeric(10, 2),                              -- first order without VAT
  percent         smallint check (percent between 1 and 100),
  pricing_version text,
  status          public.reward_status not null default 'pending',
  paid_at         timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint affiliate_rewards_paid check ((status = 'paid') = (paid_at is not null))
);
alter table public.affiliate_rewards enable row level security;
create index idx_affiliate_rewards_affiliate on public.affiliate_rewards (affiliate_id);
create trigger affiliate_rewards_set_updated_at before update on public.affiliate_rewards
  for each row execute function private.set_updated_at();
create policy affiliate_rewards_select on public.affiliate_rewards for select to authenticated
  using (affiliate_id in (select a.id from public.affiliates a where a.user_id = (select auth.uid()))
         or (select private.is_admin()));
create policy affiliate_rewards_insert on public.affiliate_rewards for insert to authenticated
  with check ((select private.is_admin()));
create policy affiliate_rewards_update on public.affiliate_rewards for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy affiliate_rewards_delete on public.affiliate_rewards for delete to authenticated
  using ((select private.is_admin()));
grant select, insert, update, delete on public.affiliate_rewards to authenticated;

-- Leads referred by the current affiliate, without any contact data.
create or replace function public.affiliate_leads()
returns table (lead_id uuid, created_at timestamptz, status public.lead_status, pack_code text,
               reward_status public.reward_status)
language sql stable security definer set search_path = '' as $$
  select l.id, l.created_at, l.status, l.pack_code, r.status
    from public.affiliates a
    join public.leads l on l.affiliate_code = a.code
    left join public.affiliate_rewards r on r.lead_id = l.id
   where a.user_id = (select auth.uid())
   order by l.created_at desc, l.id
$$;
revoke all on function public.affiliate_leads() from public, anon, authenticated;
grant execute on function public.affiliate_leads() to authenticated;

-- «Close as paid» (UX §9.9; recycled from 20260917100650_admin_close_lead_paid.sql), one transaction: the lead goes to
-- won with amount/paid_at, the client is created if the contact has none, the reward is created when the lead carries
-- an affiliate code and p_generate_reward, the contact goes to active_client and a lead_won interaction is logged.
-- The reward values (type, amount, percent) come from the admin form, which computes them with @josecoded/pricing.
create or replace function public.admin_close_lead_paid(
  p_lead_id         uuid,
  p_amount          numeric,
  p_paid_at         timestamptz default null,
  p_generate_reward boolean default true,
  p_reward_type     public.reward_type default null,
  p_reward_amount   numeric default null,
  p_reward_percent  smallint default null,
  p_pricing_version text default null
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_lead    public.leads;
  v_contact public.crm_contacts;
  v_client  uuid;
  v_aff     uuid;
  v_reward  uuid;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_amount is null or p_amount < 0 then raise exception 'amount_required' using errcode = '22023'; end if;

  update public.leads set status = 'won', amount = p_amount, paid_at = coalesce(p_paid_at, now())
   where id = p_lead_id and status = 'open'
  returning * into v_lead;
  if v_lead.id is null then raise exception 'lead_already_closed_or_missing' using errcode = 'P0002'; end if;
  select * into v_contact from public.crm_contacts where id = v_lead.contact_id for update;

  select c.id into v_client from public.clients c where c.contact_id = v_lead.contact_id order by c.created_at limit 1;
  if v_client is null then
    if v_lead.pack_code is null then raise exception 'lead_without_pack' using errcode = '22023'; end if;
    insert into public.clients (contact_id, lead_id, user_id, invite_email, pack_code, pack_option)
    values (v_lead.contact_id, v_lead.id,
            case when v_contact.user_id is not null
                      and not exists (select 1 from public.clients c where c.user_id = v_contact.user_id)
                 then v_contact.user_id end,
            v_contact.email, v_lead.pack_code, v_lead.pack_option)
    returning id into v_client;
  end if;

  if p_generate_reward and v_lead.affiliate_code is not null then
    select a.id into v_aff from public.affiliates a where a.code = v_lead.affiliate_code;
    if v_aff is not null then
      if p_reward_type is null or p_reward_amount is null then
        raise exception 'reward_params_required' using errcode = '22023';
      end if;
      insert into public.affiliate_rewards (affiliate_id, lead_id, type, amount, base_amount, percent, pricing_version)
      values (v_aff, v_lead.id, p_reward_type, p_reward_amount, p_amount, p_reward_percent,
              coalesce(p_pricing_version, (select p.pricing_version from public.packs p where p.code = v_lead.pack_code)))
      returning id into v_reward;
    end if;
  end if;

  if v_contact.status is distinct from 'active_client' then
    update public.crm_contacts set status = 'active_client' where id = v_contact.id;
  end if;
  insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, payload)
  values (v_lead.contact_id, 'lead_won', 'internal', 'jose', v_lead.id,
          jsonb_build_object('amount', p_amount, 'client_id', v_client, 'reward_id', v_reward));

  return jsonb_build_object('lead_id', v_lead.id, 'client_id', v_client, 'reward_id', v_reward);
end $$;
revoke all on function public.admin_close_lead_paid(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text)
  from public, anon, authenticated;
grant execute on function public.admin_close_lead_paid(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text)
  to authenticated;
