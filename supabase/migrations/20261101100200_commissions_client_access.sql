-- Task 1.8e (plan v3.4; DATOS v1.4 §14.1, §14.4, §14.7 migration 3, §14.12.1). Commissions (the percentage is frozen on
-- every row, Q21), the closing RPC that creates them, portal access for clients (invite_client_access, staff_clients),
-- the staff list for the admin and the counters of the summary. Public RPCs are invoker wrappers over private impls.

create type public.commission_status as enum ('pending', 'approved', 'paid', 'rejected');

create table public.closer_commissions (
  id              uuid primary key default gen_random_uuid(),
  closer_id       uuid not null references public.staff_members (user_id) on delete restrict,
  lead_id         uuid not null references public.leads (id) on delete restrict,
  contact_id      uuid not null references public.crm_contacts (id) on delete restrict,
  base_amount     numeric(10, 2) not null check (base_amount >= 0),
  percent         numeric(5, 2) not null check (percent between 0 and 100),  -- frozen: the rate when the row was created
  amount          numeric(10, 2) not null check (amount >= 0),
  status          public.commission_status not null default 'pending',
  approved_at     timestamptz,
  approved_by     uuid references auth.users (id) on delete set null,
  paid_at         timestamptz,
  paid_note       text,
  rejected_reason text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint closer_commissions_paid check ((status = 'paid') = (paid_at is not null))
);
alter table public.closer_commissions enable row level security;
create unique index uq_closer_commissions_lead on public.closer_commissions (lead_id);
create index idx_closer_commissions_closer_status on public.closer_commissions (closer_id, status);
create index idx_closer_commissions_contact on public.closer_commissions (contact_id);
create index idx_closer_commissions_approved_by on public.closer_commissions (approved_by);
create index idx_closer_commissions_pending on public.closer_commissions (status) where status = 'pending';
create trigger closer_commissions_set_updated_at before update on public.closer_commissions
  for each row execute function private.set_updated_at();
-- A disabled closer still sees what he is owed (matrix of DATOS §14.3), so the own branch needs only aal2, not is_closer().
create policy closer_commissions_select on public.closer_commissions for select to authenticated
  using ((closer_id = (select auth.uid()) and (select private.is_aal2())) or (select private.is_admin()));
grant select on public.closer_commissions to authenticated;

-- «Cerrar cobrado» (replaces the impl of 20261029100000): same signature and result, plus the commission (Q21). The owner
-- of the contact earns percent = staff_members.commission_rate at this moment, frozen in the row. A rate of 0, a contact
-- of Jose (owner_id null) or an admin owner produce no commission. Disabled closers are owed commissions all the same.
create or replace function private.admin_close_lead_paid_impl(
  p_lead_id         uuid,
  p_amount          numeric,
  p_paid_at         timestamptz,
  p_generate_reward boolean,
  p_reward_type     public.reward_type,
  p_reward_amount   numeric,
  p_reward_percent  smallint,
  p_pricing_version text
) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare
  v_lead       public.leads;
  v_contact    public.crm_contacts;
  v_client     uuid;
  v_aff        uuid;
  v_reward     uuid;
  v_rate       numeric(5, 2);
  v_commission uuid;
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

  if v_contact.owner_id is not null then
    select s.commission_rate into v_rate from public.staff_members s
     where s.user_id = v_contact.owner_id and s.role = 'closer';
    if v_rate is not null and v_rate > 0 then
      insert into public.closer_commissions (closer_id, lead_id, contact_id, base_amount, percent, amount)
      values (v_contact.owner_id, v_lead.id, v_contact.id, p_amount, v_rate, round(p_amount * v_rate / 100, 2))
      on conflict (lead_id) do nothing
      returning id into v_commission;
      if v_commission is not null then
        insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, payload)
        values (v_contact.id, 'commission', 'internal', 'system', v_lead.id,
                jsonb_build_object('commission_id', v_commission, 'percent', v_rate,
                                   'amount', round(p_amount * v_rate / 100, 2)));
        perform private.enqueue('commission.created', jsonb_build_object(
          'commission_id', v_commission, 'closer_id', v_contact.owner_id, 'amount', round(p_amount * v_rate / 100, 2)));
      end if;
    end if;
  end if;

  if v_contact.status is distinct from 'active_client' then
    update public.crm_contacts set status = 'active_client' where id = v_contact.id;
  end if;
  insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, payload)
  values (v_lead.contact_id, 'lead_won', 'internal', 'jose', v_lead.id,
          jsonb_build_object('amount', p_amount, 'client_id', v_client, 'reward_id', v_reward));

  return jsonb_build_object('lead_id', v_lead.id, 'client_id', v_client, 'reward_id', v_reward,
                            'commission_id', v_commission);
end $$;
revoke all on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text) from public, anon, authenticated;
grant execute on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text) to authenticated, service_role;

-- Commission transitions (admin). Paying is a money gate: the Server Action asks for confirmation.
create or replace function private.admin_commission_approve_impl(p_id uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.closer_commissions;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.closer_commissions set status = 'approved', approved_at = now(), approved_by = (select auth.uid())
   where id = p_id and status = 'pending'
  returning * into c;
  if c.id is null then raise exception 'commission_not_pending' using errcode = '22023'; end if;
  perform private.enqueue('commission.approved', jsonb_build_object(
    'commission_id', c.id, 'closer_id', c.closer_id, 'amount', c.amount));
end $$;
revoke all on function private.admin_commission_approve_impl(uuid) from public, anon, authenticated;
grant execute on function private.admin_commission_approve_impl(uuid) to authenticated, service_role;

create or replace function private.admin_commission_reject_impl(p_id uuid, p_reason text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.closer_commissions;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  -- the closer reads the reason in her row: a rejection without one is not accepted
  if p_reason is null or btrim(p_reason) = '' or length(p_reason) > 1000 then
    raise exception 'reason_required' using errcode = '22023';
  end if;
  update public.closer_commissions set status = 'rejected', rejected_reason = btrim(p_reason)
   where id = p_id and status = 'pending'
  returning * into c;
  if c.id is null then raise exception 'commission_not_pending' using errcode = '22023'; end if;
  perform private.enqueue('commission.rejected', jsonb_build_object(
    'commission_id', c.id, 'closer_id', c.closer_id, 'amount', c.amount));
end $$;
revoke all on function private.admin_commission_reject_impl(uuid, text) from public, anon, authenticated;
grant execute on function private.admin_commission_reject_impl(uuid, text) to authenticated, service_role;

create or replace function private.admin_commission_mark_paid_impl(p_id uuid, p_paid_at timestamptz, p_note text) returns void
language plpgsql security definer set search_path = '' as $$
declare c public.closer_commissions;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  update public.closer_commissions set status = 'paid', paid_at = coalesce(p_paid_at, now()), paid_note = p_note
   where id = p_id and status = 'approved'
  returning * into c;
  if c.id is null then raise exception 'commission_not_approved' using errcode = '22023'; end if;
  perform private.enqueue('commission.paid', jsonb_build_object(
    'commission_id', c.id, 'closer_id', c.closer_id, 'amount', c.amount));
end $$;
revoke all on function private.admin_commission_mark_paid_impl(uuid, timestamptz, text) from public, anon, authenticated;
grant execute on function private.admin_commission_mark_paid_impl(uuid, timestamptz, text) to authenticated, service_role;

-- K5 «Comisiones»: the list with who, what and which pack, in one read. The closer cannot read `leads` (admin only) nor
-- the contact of a commission that was reassigned or of a closer switched off, and she is owed the money all the same,
-- so the join happens here: the rows are the caller's own (`closer_id = auth.uid()`; a disabled closer still reads
-- hers, as the policy of the table does) or all of them for the admin. Nobody else gets rows: not even an empty
-- answer to a client (forbidden). `closer_rate` is the current rate, only to explain a frozen `percent` that differs.
create or replace function private.staff_commissions_impl()
returns table (id uuid, closer_id uuid, closer_name text, closer_disabled boolean, closer_rate numeric,
               contact_name text, organization text, pack_code text, pack_option text, closed_at timestamptz,
               base_amount numeric, percent numeric, amount numeric, status public.commission_status,
               approved_at timestamptz, paid_at timestamptz, paid_note text, rejected_reason text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not (private.is_admin() or (private.is_aal2()
          and exists (select 1 from public.staff_members s where s.user_id = (select auth.uid())))) then
    raise exception 'forbidden' using errcode = '42501';
  end if;
  return query
  select k.id, k.closer_id, s.display_name, s.disabled_at is not null, s.commission_rate,
         ct.display_name, o.name, l.pack_code, l.pack_option, coalesce(l.paid_at, k.created_at),
         k.base_amount, k.percent, k.amount, k.status, k.approved_at, k.paid_at, k.paid_note, k.rejected_reason
    from public.closer_commissions k
    join public.staff_members s on s.user_id = k.closer_id
    join public.crm_contacts ct on ct.id = k.contact_id
    left join public.crm_organizations o on o.id = ct.organization_id
    join public.leads l on l.id = k.lead_id
   where private.is_admin() or k.closer_id = (select auth.uid())
   order by coalesce(l.paid_at, k.created_at) desc, k.id
   limit 500;
end $$;
revoke all on function private.staff_commissions_impl() from public, anon, authenticated;
grant execute on function private.staff_commissions_impl() to authenticated, service_role;

create or replace function public.staff_commissions()
returns table (id uuid, closer_id uuid, closer_name text, closer_disabled boolean, closer_rate numeric,
               contact_name text, organization text, pack_code text, pack_option text, closed_at timestamptz,
               base_amount numeric, percent numeric, amount numeric, status public.commission_status,
               approved_at timestamptz, paid_at timestamptz, paid_note text, rejected_reason text)
language sql stable security invoker set search_path = '' as $$
  select * from private.staff_commissions_impl()
$$;
revoke all on function public.staff_commissions() from public, anon, authenticated;
grant execute on function public.staff_commissions() to authenticated;

-- Manual commission (extras and upgrades do not generate one by themselves, §14.12.1): applies the current rate.
create or replace function private.admin_commission_create_impl(
  p_closer_id uuid, p_lead_id uuid, p_base_amount numeric, p_note text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_lead public.leads;
  v_rate numeric(5, 2);
  v_id   uuid;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if p_base_amount is null or p_base_amount < 0 then raise exception 'amount_required' using errcode = '22023'; end if;
  select * into v_lead from public.leads l where l.id = p_lead_id;
  if v_lead.id is null then raise exception 'lead_not_found' using errcode = 'P0002'; end if;
  select s.commission_rate into v_rate from public.staff_members s where s.user_id = p_closer_id and s.role = 'closer';
  if v_rate is null then raise exception 'closer_not_found' using errcode = 'P0002'; end if;
  insert into public.closer_commissions (closer_id, lead_id, contact_id, base_amount, percent, amount, paid_note)
  values (p_closer_id, v_lead.id, v_lead.contact_id, p_base_amount, v_rate, round(p_base_amount * v_rate / 100, 2), p_note)
  returning id into v_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, payload)
  values (v_lead.contact_id, 'commission', 'internal', 'jose', v_lead.id,
          jsonb_build_object('commission_id', v_id, 'percent', v_rate, 'manual', true));
  perform private.enqueue('commission.created', jsonb_build_object(
    'commission_id', v_id, 'closer_id', p_closer_id, 'amount', round(p_base_amount * v_rate / 100, 2)));
  return v_id;
end $$;
revoke all on function private.admin_commission_create_impl(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function private.admin_commission_create_impl(uuid, uuid, numeric, text) to authenticated, service_role;

create or replace function public.admin_commission_approve(p_id uuid) returns void
language sql security invoker set search_path = '' as $$ select private.admin_commission_approve_impl(p_id) $$;
create or replace function public.admin_commission_reject(p_id uuid, p_reason text) returns void
language sql security invoker set search_path = '' as $$ select private.admin_commission_reject_impl(p_id, p_reason) $$;
create or replace function public.admin_commission_mark_paid(p_id uuid, p_paid_at timestamptz, p_note text) returns void
language sql security invoker set search_path = '' as $$ select private.admin_commission_mark_paid_impl(p_id, p_paid_at, p_note) $$;
create or replace function public.admin_commission_create(p_closer_id uuid, p_lead_id uuid, p_base_amount numeric, p_note text)
returns uuid language sql security invoker set search_path = '' as $$
  select private.admin_commission_create_impl(p_closer_id, p_lead_id, p_base_amount, p_note)
$$;
revoke all on function public.admin_commission_approve(uuid) from public, anon, authenticated;
revoke all on function public.admin_commission_reject(uuid, text) from public, anon, authenticated;
revoke all on function public.admin_commission_mark_paid(uuid, timestamptz, text) from public, anon, authenticated;
revoke all on function public.admin_commission_create(uuid, uuid, numeric, text) from public, anon, authenticated;
grant execute on function public.admin_commission_approve(uuid) to authenticated;
grant execute on function public.admin_commission_reject(uuid, text) to authenticated;
grant execute on function public.admin_commission_mark_paid(uuid, timestamptz, text) to authenticated;
grant execute on function public.admin_commission_create(uuid, uuid, numeric, text) to authenticated;

-- Clients: one pending portal access per contact; the select policy admits the owner closer (columns stay limited by
-- the grant of 20261028100300: no notes_internal, no contact_id).
create unique index uq_clients_pending_contact on public.clients (contact_id) where user_id is null;
drop policy clients_select on public.clients;
create policy clients_select on public.clients for select to authenticated
  using (user_id = (select auth.uid()) or (select private.is_admin()) or (select private.owns_client(id)));

-- Habilitar acceso al portal (K3/K6): puts the email on a client without access and asks the gateway for the invitation.
-- The invitation goes to the email of the contact (crm_contacts.email); an empty p_email means exactly that. A different
-- address is the admin's decision (a client that changed address), never a closer's: otherwise a closer could invite
-- himself into the portal of his client. An address that belongs to a staff member is never invited.
create or replace function private.invite_client_access_impl(p_client_id uuid, p_email extensions.citext) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_client  public.clients;
  v_locale  public.locale;
  v_contact extensions.citext;
  v_email   extensions.citext := nullif(btrim(p_email::text), '')::extensions.citext;
begin
  select * into v_client from public.clients c where c.id = p_client_id;
  if v_client.id is null then raise exception 'client_not_found' using errcode = 'P0002'; end if;
  if not (private.is_admin() or private.owns_client(p_client_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_client.user_id is not null then raise exception 'client_already_has_access' using errcode = '22023'; end if;

  select nullif(btrim(c.email::text), '')::extensions.citext, coalesce(c.locale, 'es') into v_contact, v_locale
    from public.crm_contacts c where c.id = v_client.contact_id;
  v_email := coalesce(v_email, v_contact);
  if v_email is null or position('@' in v_email::text) = 0 then raise exception 'invalid_email' using errcode = '22023'; end if;
  if v_email is distinct from v_contact and not private.is_admin() then
    raise exception 'email_must_match_contact' using errcode = '42501';
  end if;
  if exists (select 1 from auth.users u join public.staff_members s on s.user_id = u.id
              where u.email::extensions.citext operator(extensions.=) v_email) then
    raise exception 'email_is_staff' using errcode = '22023';
  end if;

  update public.clients set invite_email = v_email where id = p_client_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
  values (v_client.contact_id, 'client_invited', 'internal', private.staff_actor(), jsonb_build_object('client_id', p_client_id));
  perform private.enqueue('client.invited', jsonb_build_object(
    'client_id', p_client_id, 'email', v_email::text, 'locale', v_locale));
end $$;
revoke all on function private.invite_client_access_impl(uuid, extensions.citext) from public, anon, authenticated;
grant execute on function private.invite_client_access_impl(uuid, extensions.citext) to authenticated, service_role;

create or replace function public.invite_client_access(p_client_id uuid, p_email extensions.citext) returns void
language sql security invoker set search_path = '' as $$
  select private.invite_client_access_impl(p_client_id, p_email)
$$;
revoke all on function public.invite_client_access(uuid, extensions.citext) from public, anon, authenticated;
grant execute on function public.invite_client_access(uuid, extensions.citext) to authenticated;

-- The clients of my contacts (closer) or all of them (admin), without notes_internal.
create or replace function private.staff_clients_impl(p_client_id uuid)
returns table (id uuid, contact_id uuid, lead_id uuid, user_id uuid, invite_email extensions.citext, pack_code text,
               pack_option text, project_phase public.project_phase, starts_at date, delivered_at date,
               created_at timestamptz, updated_at timestamptz, has_access boolean)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not private.is_staff() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select c.id, c.contact_id, c.lead_id, c.user_id, c.invite_email, c.pack_code, c.pack_option, c.project_phase,
         c.starts_at, c.delivered_at, c.created_at, c.updated_at, c.user_id is not null
    from public.clients c
    join public.crm_contacts ct on ct.id = c.contact_id
   where (p_client_id is null or c.id = p_client_id)
     and (private.is_admin() or ct.owner_id = (select auth.uid()))
   order by c.created_at desc, c.id;
end $$;
revoke all on function private.staff_clients_impl(uuid) from public, anon, authenticated;
grant execute on function private.staff_clients_impl(uuid) to authenticated, service_role;

create or replace function public.staff_clients(p_client_id uuid default null)
returns table (id uuid, contact_id uuid, lead_id uuid, user_id uuid, invite_email extensions.citext, pack_code text,
               pack_option text, project_phase public.project_phase, starts_at date, delivered_at date,
               created_at timestamptz, updated_at timestamptz, has_access boolean)
language sql stable security invoker set search_path = '' as $$
  select * from private.staff_clients_impl(p_client_id)
$$;
revoke all on function public.staff_clients(uuid) from public, anon, authenticated;
grant execute on function public.staff_clients(uuid) to authenticated;

-- D1 «Equipo»: the email comes from auth.users inside the definer (no JWT reads it); mfa_enrolled looks for a verified
-- factor (Q24); notes is the admin's note about the person.
create or replace function private.admin_staff_list_impl()
returns table (user_id uuid, role public.staff_role, display_name text, email text, disabled_at timestamptz,
               commission_rate numeric, telegram_linked boolean, mfa_enrolled boolean, contacts_count integer,
               commissions_pending integer, notes text)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select s.user_id, s.role, s.display_name, u.email::text, s.disabled_at, s.commission_rate,
         s.telegram_chat_id is not null,
         exists (select 1 from auth.mfa_factors f where f.user_id = s.user_id and f.status::text = 'verified'),
         (select count(*)::integer from public.crm_contacts c where c.owner_id = s.user_id and c.archived_at is null),
         (select count(*)::integer from public.closer_commissions k where k.closer_id = s.user_id and k.status = 'pending'),
         s.notes
    from public.staff_members s
    left join auth.users u on u.id = s.user_id
   order by s.role, s.created_at, s.user_id;
end $$;
revoke all on function private.admin_staff_list_impl() from public, anon, authenticated;
grant execute on function private.admin_staff_list_impl() to authenticated, service_role;

create or replace function public.admin_staff_list()
returns table (user_id uuid, role public.staff_role, display_name text, email text, disabled_at timestamptz,
               commission_rate numeric, telegram_linked boolean, mfa_enrolled boolean, contacts_count integer,
               commissions_pending integer, notes text)
language sql stable security invoker set search_path = '' as $$
  select * from private.admin_staff_list_impl()
$$;
revoke all on function public.admin_staff_list() from public, anon, authenticated;
grant execute on function public.admin_staff_list() to authenticated;

-- C1 counters: the seven of 1.8b plus the closer ones (stories, content and quotes arrive with their migrations).
create or replace function private.admin_counters_impl() returns jsonb
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return jsonb_build_object(
    'leads_open',       (select count(*) from public.leads l where l.status = 'open'),
    'contacts_due',     (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.next_action_at <= now()),
    'chat_unread',      (select count(*) from public.chat_threads t where t.unread_for_admin),
    'agencies_replied', (select count(*) from public.crm_contacts c
                          where c.archived_at is null and c.kind = 'agency' and c.status = 'replied'),
    'comments_pending', (select count(*) from public.blog_comments b where b.status = 'pending'),
    'upgrades_pending', (select count(*) from public.upgrade_requests u where u.status = 'pending'),
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending'),
    'commissions_pending',       (select count(*) from public.closer_commissions k where k.status = 'pending'),
    'imports_failed_24h',        (select count(*) from public.crm_imports i
                                   where i.status = 'failed' and i.created_at > now() - interval '24 hours'),
    'import_conflicts_pending',  (select count(*) from public.crm_import_conflicts k where k.status = 'pending')
  );
end $$;
revoke all on function private.admin_counters_impl() from public, anon, authenticated;
grant execute on function private.admin_counters_impl() to authenticated, service_role;
