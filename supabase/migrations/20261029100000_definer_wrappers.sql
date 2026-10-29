-- DATOS §10.4: the security advisor must return zero findings. Supabase flags every public security definer function that
-- `authenticated` can execute (0029_authenticated_security_definer_function_executable). Standard remedy: the definer body
-- moves to private.<name>_impl (private is not exposed by PostgREST), and public.<name> keeps the same signature, return
-- type and grants as a security invoker wrapper that only calls it. The authorization checks (is_admin, auth.uid,
-- assert_email_confirmed) stay inside the impl, so the wrapper adds no trust: the impl is executable by authenticated
-- (it must be, the invoker wrapper runs as the caller; service_role keeps the access it had), as private.is_admin()
-- already is. anon has no usage on private. The bodies are copied unchanged from the migrations that defined them.

-- crm_import_organizations
create or replace function private.crm_import_organizations_impl(p_rows jsonb)
returns table (created integer, updated integer)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  r         jsonb;
  v_created integer := 0;
  v_updated integer := 0;
  v_insert  boolean;
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  if jsonb_typeof(coalesce(p_rows, '[]'::jsonb)) <> 'array' then raise exception 'rows_must_be_an_array'; end if;
  for r in select value from jsonb_array_elements(coalesce(p_rows, '[]'::jsonb)) loop
    insert into public.crm_organizations as o (name, name_normalized, kind, website, city, size, fit, notes, source, notion_url)
    values (r ->> 'name', private.normalize_name(r ->> 'name'), (r ->> 'kind')::public.org_kind, r ->> 'website',
            r ->> 'city', r ->> 'size', (r ->> 'fit')::smallint, r ->> 'notes',
            coalesce((r ->> 'source')::public.contact_source, 'import_agencias'), r ->> 'notion_url')
    on conflict (name_normalized) do update set
      kind       = excluded.kind,
      website    = coalesce(excluded.website, o.website),
      city       = coalesce(excluded.city, o.city),
      size       = coalesce(excluded.size, o.size),
      fit        = coalesce(excluded.fit, o.fit),
      notes      = coalesce(excluded.notes, o.notes),
      notion_url = coalesce(excluded.notion_url, o.notion_url)
    returning (xmax = 0) into v_insert;
    if v_insert then v_created := v_created + 1; else v_updated := v_updated + 1; end if;
  end loop;
  return query select v_created, v_updated;
end $$;
revoke all on function private.crm_import_organizations_impl(jsonb) from public, anon, authenticated;
grant execute on function private.crm_import_organizations_impl(jsonb) to authenticated, service_role;

create or replace function public.crm_import_organizations(p_rows jsonb)
returns table (created integer, updated integer)
language sql security invoker set search_path = '' as $$
  select * from private.crm_import_organizations_impl(p_rows)
$$;

-- admin_clients
create or replace function private.admin_clients_impl(p_client_id uuid)
returns setof public.clients
language plpgsql stable security definer set search_path = '' as $$
begin
  if not private.is_admin() then raise exception 'forbidden' using errcode = '42501'; end if;
  return query
  select c.* from public.clients c
   where p_client_id is null or c.id = p_client_id
   order by c.created_at desc, c.id;
end $$;
revoke all on function private.admin_clients_impl(uuid) from public, anon, authenticated;
grant execute on function private.admin_clients_impl(uuid) to authenticated, service_role;

create or replace function public.admin_clients(p_client_id uuid default null)
returns setof public.clients
language sql stable security invoker set search_path = '' as $$
  select * from private.admin_clients_impl(p_client_id)
$$;

-- request_upgrade
create or replace function private.request_upgrade_impl(p_to_pack_code text, p_extras text[])
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_client       uuid;
  v_from         public.packs;
  v_to           public.packs;
  v_extras       text[] := coalesce((select array_agg(distinct e order by e) from unnest(coalesce(p_extras, '{}')) e), '{}');
  v_found        integer;
  v_diff         integer := 0;
  v_extras_price integer := 0;
  v_version      text;
  v_id           uuid;
begin
  perform private.assert_email_confirmed();
  v_client := private.client_id_of();
  if v_client is null then raise exception 'not_a_client' using errcode = '42501'; end if;
  if p_to_pack_code is null and cardinality(v_extras) = 0 then raise exception 'nothing_requested' using errcode = '22023'; end if;

  select p.* into v_from from public.clients c join public.packs p on p.code = c.pack_code where c.id = v_client;
  v_version := v_from.pricing_version;

  if p_to_pack_code is not null then
    select p.* into v_to from public.packs p where p.code = p_to_pack_code and p.active;
    if v_to.code is null then raise exception 'unknown_pack' using errcode = '22023'; end if;
    if v_to.price <= v_from.price then raise exception 'not_an_upgrade' using errcode = '22023'; end if;
    v_diff := v_to.price - v_from.price;
    v_version := v_to.pricing_version;
  end if;

  if cardinality(v_extras) > 0 then
    select count(*), coalesce(sum(x.price), 0) into v_found, v_extras_price
      from public.extras x where x.code = any (v_extras) and x.active;
    if v_found <> cardinality(v_extras) then raise exception 'unknown_extra' using errcode = '22023'; end if;
  end if;

  -- One pending request per client (uq_upgrade_requests_pending); 23505 so PostgREST answers 409.
  if exists (select 1 from public.upgrade_requests u where u.client_id = v_client and u.status = 'pending') then
    raise exception 'upgrade_already_pending' using errcode = '23505';
  end if;

  insert into public.upgrade_requests (client_id, from_pack_code, to_pack_code, extras, computed_price, pricing_version)
  values (v_client, v_from.code, p_to_pack_code, v_extras, v_diff + v_extras_price, v_version)
  returning id into v_id;

  perform private.enqueue('upgrade.requested', jsonb_build_object(
    'id', v_id, 'client_id', v_client, 'from_pack_code', v_from.code, 'to_pack_code', p_to_pack_code,
    'extras', to_jsonb(v_extras), 'computed_price', v_diff + v_extras_price));
  return v_id;
end $$;
revoke all on function private.request_upgrade_impl(text, text[]) from public, anon, authenticated;
grant execute on function private.request_upgrade_impl(text, text[]) to authenticated, service_role;

create or replace function public.request_upgrade(p_to_pack_code text, p_extras text[] default '{}')
returns uuid language sql security invoker set search_path = '' as $$
  select private.request_upgrade_impl(p_to_pack_code, p_extras)
$$;

-- claim_client_access
create or replace function private.claim_client_access_impl() returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  v_uid     uuid := (select auth.uid());
  v_email   extensions.citext;
  v_id      uuid;
  v_contact uuid;
begin
  perform private.assert_email_confirmed();
  select c.id into v_id from public.clients c where c.user_id = v_uid;
  if v_id is not null then return v_id; end if;  -- already linked: idempotent

  select u.email::extensions.citext into v_email from auth.users u where u.id = v_uid;
  if v_email is null then return null; end if;
  -- skip locked: two concurrent sessions never claim the same row.
  select c.id, c.contact_id into v_id, v_contact from public.clients c
   where c.user_id is null and c.invite_email operator(extensions.=) v_email
   order by c.created_at, c.id
   limit 1
   for update skip locked;
  if v_id is null then return null; end if;
  update public.clients set user_id = v_uid where id = v_id;
  update public.crm_contacts set user_id = v_uid where id = v_contact and user_id is null;
  return v_id;
end $$;
revoke all on function private.claim_client_access_impl() from public, anon, authenticated;
grant execute on function private.claim_client_access_impl() to authenticated, service_role;

create or replace function public.claim_client_access() returns uuid
language sql security invoker set search_path = '' as $$
  select private.claim_client_access_impl()
$$;

-- area_lead_summary
create or replace function private.area_lead_summary_impl()
returns table (pack_code text, pack_option text, price_from integer, status public.lead_status, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_uid   uuid := (select auth.uid());
  v_email extensions.citext;
begin
  perform private.assert_email_confirmed();
  select u.email::extensions.citext into v_email from auth.users u where u.id = v_uid;
  return query
  select l.pack_code, l.pack_option,
         coalesce((l.ai_proposal ->> 'priceFrom')::integer, o.price, p.price),
         l.status, l.created_at
    from public.leads l
    join public.crm_contacts c on c.id = l.contact_id
    left join public.packs p on p.code = l.pack_code
    left join public.pack_options o on o.pack_code = l.pack_code and o.code = l.pack_option
   where l.user_id = v_uid or (v_email is not null and c.email operator(extensions.=) v_email)
   order by l.created_at desc, l.id
   limit 1;
end $$;
revoke all on function private.area_lead_summary_impl() from public, anon, authenticated;
grant execute on function private.area_lead_summary_impl() to authenticated, service_role;

create or replace function public.area_lead_summary()
returns table (pack_code text, pack_option text, price_from integer, status public.lead_status, created_at timestamptz)
language sql stable security invoker set search_path = '' as $$
  select * from private.area_lead_summary_impl()
$$;

-- affiliate_leads
create or replace function private.affiliate_leads_impl()
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
revoke all on function private.affiliate_leads_impl() from public, anon, authenticated;
grant execute on function private.affiliate_leads_impl() to authenticated, service_role;

create or replace function public.affiliate_leads()
returns table (lead_id uuid, created_at timestamptz, status public.lead_status, pack_code text,
               reward_status public.reward_status)
language sql stable security invoker set search_path = '' as $$
  select * from private.affiliate_leads_impl()
$$;

-- admin_close_lead_paid
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
revoke all on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text) from public, anon, authenticated;
grant execute on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text) to authenticated, service_role;

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
language sql security invoker set search_path = '' as $$
  select private.admin_close_lead_paid_impl(p_lead_id, p_amount, p_paid_at, p_generate_reward, p_reward_type,
                                            p_reward_amount, p_reward_percent, p_pricing_version)
$$;

-- admin_counters
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
    'rewards_pending',  (select count(*) from public.affiliate_rewards r where r.status = 'pending')
  );
end $$;
revoke all on function private.admin_counters_impl() from public, anon, authenticated;
grant execute on function private.admin_counters_impl() to authenticated, service_role;

create or replace function public.admin_counters() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select private.admin_counters_impl()
$$;

-- Private tables with RLS on and no policy (advisor 0008 rls_enabled_no_policy, INFO). Nothing but service_role
-- (bypassrls) and the definer functions touches them. One select policy per table that matches no row: it grants nothing
-- (authenticated/anon also lack table privileges) and only makes the intent explicit.
create policy outbox_no_client_access on private.outbox for select to authenticated using (false);
create policy quota_counters_no_client_access on private.quota_counters for select to authenticated using (false);
create policy scheduled_jobs_no_client_access on private.scheduled_jobs for select to authenticated using (false);
