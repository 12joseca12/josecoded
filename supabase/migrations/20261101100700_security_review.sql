-- Task 1.8e, security review (plan v3.4; DATOS v1.4 §14.1, §14.4). Additive: replaces functions of 20261028100200 and
-- 20261101100200, which production already has or will have.
--   * create_lead only reuses contacts of Jose (owner_id null). A web lead whose email is a closer's contact gets its own
--     contact, a note and a lead.owner_collision event for Jose: a closer can no longer squat an email to read inbound
--     messages or to receive the client's portal link. lead.created carries owner_id.
--   * admin_close_lead_paid takes p_commission: the commission is automatic only for a lead the owner closer opened.

create or replace function public.create_lead(p jsonb)
returns table (lead_id uuid, contact_id uuid, created boolean)
language plpgsql security definer set search_path = '' as $$
#variable_conflict use_column
declare
  v_key       text := nullif(btrim(p ->> 'idempotency_key'), '');
  v_email     extensions.citext := nullif(btrim(p ->> 'email'), '')::extensions.citext;
  v_source    public.lead_source := (p ->> 'source')::public.lead_source;
  v_locale    public.locale := coalesce((p ->> 'locale')::public.locale, 'es');
  v_user      uuid := nullif(p ->> 'user_id', '')::uuid;
  v_affiliate text := nullif(btrim(p ->> 'affiliate_code'), '');
  v_meta      jsonb := coalesce(p -> 'meta', '{}'::jsonb);
  v_contact   uuid;
  v_lead      uuid;
  v_link_user uuid;
  v_squatted  uuid;
  v_squat_own uuid;
begin
  if v_source is null then raise exception 'source_required' using errcode = '22023'; end if;
  if v_email is null and nullif(btrim(p ->> 'phone'), '') is null then
    raise exception 'email_or_phone_required' using errcode = '22023';
  end if;

  if v_key is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('create_lead:key:' || v_key, 0));
  end if;
  if v_email is not null then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended('crm_contacts:email:' || lower(v_email::text), 0));
  end if;
  if v_user is not null and v_email is not null then
    select u.id into v_link_user from auth.users u
     where u.id = v_user and u.email_confirmed_at is not null
       and u.email::extensions.citext operator(extensions.=) v_email;
  end if;

  if v_key is not null then
    select l.id, l.contact_id into v_lead, v_contact from public.leads l where l.idempotency_key = v_key;
    if v_lead is not null then
      return query select v_lead, v_contact, false;
      return;
    end if;
  end if;

  -- Only Jose's own contacts (owner_id null) are reused: a web lead never lands in a closer's portfolio, nor links a
  -- user to a contact a closer owns. When the email is a closer's, the lead gets its own contact and Jose is told.
  if v_email is not null then
    select c.id into v_contact from public.crm_contacts c
     where c.email operator(extensions.=) v_email and c.kind in ('lead', 'client') and c.archived_at is null
       and c.owner_id is null
     order by c.created_at, c.id
     limit 1
     for update;
    if v_contact is null then
      select c.id, c.owner_id into v_squatted, v_squat_own from public.crm_contacts c
       where c.email operator(extensions.=) v_email and c.kind in ('lead', 'client') and c.archived_at is null
         and c.owner_id is not null
       order by c.created_at, c.id
       limit 1;
    end if;
  end if;
  if v_contact is null then
    insert into public.crm_contacts (kind, status, display_name, email, phone, locale, user_id, source, chat_case)
    values ('lead', 'new', coalesce(nullif(btrim(p ->> 'display_name'), ''), v_email::text, btrim(p ->> 'phone')),
            v_email, nullif(btrim(p ->> 'phone'), ''), v_locale, v_link_user,
            case v_source when 'referral' then 'manual' else v_source::text end::public.contact_source,
            (p ->> 'chat_case')::public.chat_case)
    returning id into v_contact;
  elsif v_link_user is not null then
    update public.crm_contacts set user_id = v_link_user where id = v_contact and user_id is null;
  end if;

  if v_affiliate is not null and not exists (select 1 from public.affiliates a where a.code = v_affiliate) then
    v_meta := v_meta || jsonb_build_object('affiliate_code_rejected', v_affiliate);
    v_affiliate := null;
  end if;

  insert into public.leads (contact_id, source, via, pack_code, pack_option, ai_proposal, message, locale,
                            affiliate_code, idempotency_key, user_id, meta)
  values (v_contact, v_source, coalesce((p ->> 'via')::public.contact_via, 'client'), nullif(p ->> 'pack_code', ''),
          nullif(p ->> 'pack_option', ''), p -> 'ai_proposal', p ->> 'message', v_locale, v_affiliate, v_key, v_user,
          v_meta)
  on conflict (idempotency_key) do nothing
  returning id into v_lead;
  if v_lead is null then  -- a concurrent call with the same key won
    select l.id, l.contact_id into v_lead, v_contact from public.leads l where l.idempotency_key = v_key;
    return query select v_lead, v_contact, false;
    return;
  end if;

  insert into public.crm_interactions (contact_id, kind, channel, direction, actor, lead_id, body, payload)
  values (v_contact, 'lead_created',
          case v_source when 'web_form' then 'web_form' when 'web_proposal' then 'web_proposal' when 'chat' then 'chat'
                        when 'calcom' then 'calcom' else 'other' end::public.interaction_channel,
          'in', 'contact', v_lead, p ->> 'message',
          jsonb_build_object('source', v_source, 'via', coalesce(p ->> 'via', 'client')));

  -- The contact is always Jose's (owner_id null); the key stays in the payload for the rules that address the owner.
  perform private.enqueue('lead.created', jsonb_build_object(
    'id', v_lead, 'contact_id', v_contact, 'source', v_source, 'via', coalesce(p ->> 'via', 'client'),
    'pack_code', nullif(p ->> 'pack_code', ''),
    'owner_id', (select c.owner_id from public.crm_contacts c where c.id = v_contact)));

  if v_squatted is not null then
    insert into public.crm_interactions (contact_id, kind, direction, actor, lead_id, body, payload)
    values (v_contact, 'note', 'internal', 'system', v_lead,
            'el email coincide con un contacto de un closer: revisar antes de contestar',
            jsonb_build_object('existing_contact_id', v_squatted, 'existing_owner_id', v_squat_own));
    perform private.enqueue('lead.owner_collision', jsonb_build_object(
      'lead_id', v_lead, 'contact_id', v_contact, 'existing_contact_id', v_squatted, 'existing_owner_id', v_squat_own));
  end if;

  return query select v_lead, v_contact, true;
end $$;
revoke all on function public.create_lead(jsonb) from public, anon, authenticated;
grant execute on function public.create_lead(jsonb) to service_role;

-- «Cerrar cobrado» with the explicit commission switch. The old signatures go: a second overload with defaults would make
-- PostgREST calls by name ambiguous.
drop function public.admin_close_lead_paid(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text);
drop function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text);

create or replace function private.admin_close_lead_paid_impl(
  p_lead_id         uuid,
  p_amount          numeric,
  p_paid_at         timestamptz,
  p_generate_reward boolean,
  p_reward_type     public.reward_type,
  p_reward_amount   numeric,
  p_reward_percent  smallint,
  p_pricing_version text,
  p_commission      boolean default null
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
  v_wanted     boolean;
  v_invite     extensions.citext;
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

  -- Commission: p_commission true/false is Jose's explicit call. Without it (null) the commission is created only when
  -- the lead was originated by the owner closer himself (leads.created_by); a web, chat or cal.com lead (created_by
  -- null) or one opened by someone else earns nothing unless Jose says so.
  v_wanted := coalesce(p_commission, v_lead.created_by is not null and v_lead.created_by = v_contact.owner_id);
  if v_wanted and v_contact.owner_id is not null then
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

  -- The address frozen for the portal invitation, so the admin sees what a closer will be allowed to (re)send.
  select c.invite_email into v_invite from public.clients c where c.id = v_client;
  return jsonb_build_object('lead_id', v_lead.id, 'client_id', v_client, 'reward_id', v_reward,
                            'commission_id', v_commission, 'invite_email', v_invite);
end $$;
revoke all on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text, boolean) from public, anon, authenticated;
grant execute on function private.admin_close_lead_paid_impl(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text, boolean) to authenticated, service_role;

create or replace function public.admin_close_lead_paid(
  p_lead_id         uuid,
  p_amount          numeric,
  p_paid_at         timestamptz default null,
  p_generate_reward boolean default true,
  p_reward_type     public.reward_type default null,
  p_reward_amount   numeric default null,
  p_reward_percent  smallint default null,
  p_pricing_version text default null,
  p_commission      boolean default null
) returns jsonb
language sql security invoker set search_path = '' as $$
  select private.admin_close_lead_paid_impl(p_lead_id, p_amount, p_paid_at, p_generate_reward, p_reward_type,
                                            p_reward_amount, p_reward_percent, p_pricing_version, p_commission)
$$;
revoke all on function public.admin_close_lead_paid(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text, boolean) from public, anon, authenticated;
grant execute on function public.admin_close_lead_paid(uuid, numeric, timestamptz, boolean, public.reward_type, numeric, smallint, text, boolean) to authenticated;

-- Jose is told when a web lead collides with a closer's contact.
insert into public.notification_rules (event, recipient, channel) values
  ('lead.owner_collision', 'admin', 'telegram')
on conflict do nothing;

-- ================================================================ Review of «CRM contactos» (f977b0a)
-- 1) A closer could PATCH crm_contacts.email and then invite himself into the portal of his client (the invite goes to the
--    contact email, claim_client_access binds whoever opens it), or change it before the close so that admin_close copies
--    it into clients.invite_email. Now:
--      * a closer cannot change the email of a contact that has a lead, a client or a won / active_client status
--        (fix it before opening the first lead; after that it is Jose's call);
--      * a closer invites only to clients.invite_email, frozen when the client was created (or by Jose);
--      * the close returns that frozen address.
-- Definer: the API role has no grant on clients.contact_id, and the guard must see every lead and client of the contact.
create or replace function private.contact_has_deal(p_contact_id uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.clients c where c.contact_id = p_contact_id)
      or exists (select 1 from public.leads l where l.contact_id = p_contact_id)
$$;
revoke all on function private.contact_has_deal(uuid) from public, anon, authenticated;
grant execute on function private.contact_has_deal(uuid) to authenticated, service_role;

create or replace function private.crm_contacts_closer_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  -- Nested on purpose: private.is_admin() is only executable by authenticated, so it must not be evaluated for other roles.
  if current_user = 'authenticated' then
    if (tg_op = 'INSERT' and new.user_id is not null)
       or (tg_op = 'UPDATE' and new.user_id is distinct from old.user_id) then
      if not private.is_admin() then
        raise exception 'closers cannot link a contact to a user' using errcode = '42501';
      end if;
    end if;
    if tg_op = 'UPDATE' and new.email is distinct from old.email then
      if not private.is_admin() then
        if old.status in ('won', 'active_client') or new.status in ('won', 'active_client')
           or private.contact_has_deal(old.id) then
          raise exception 'closers cannot change the email of a contact with a lead or a client' using errcode = '42501';
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

-- 4) A closer sets the pack of a lead that has none; he never swaps it afterwards (the close builds the client from it).
create or replace function private.leads_closer_guard() returns trigger
language plpgsql set search_path = '' as $$
begin
  if current_user = 'authenticated' then
    if tg_op = 'INSERT' then
      new.created_by := (select auth.uid());
      if not private.is_admin() then
        new.status := 'open';
        new.amount := null;
        new.paid_at := null;
        new.user_id := null;
        new.affiliate_code := null;
        new.idempotency_key := null;
      end if;
    else
      new.created_by := old.created_by;
      if new.affiliate_code is distinct from old.affiliate_code or new.amount is distinct from old.amount
         or new.paid_at is distinct from old.paid_at or new.user_id is distinct from old.user_id
         or new.contact_id is distinct from old.contact_id or new.idempotency_key is distinct from old.idempotency_key
         or (new.status = 'won' and old.status is distinct from 'won')
         or (old.status in ('won', 'lost') and new.status is distinct from old.status)
         or (old.pack_code is not null
             and (new.pack_code is distinct from old.pack_code or new.pack_option is distinct from old.pack_option)) then
        if not private.is_admin() then
          raise exception 'closers cannot change amount, affiliate, owner link, pack or the final status of a lead' using errcode = '42501';
        end if;
      end if;
    end if;
  end if;
  return new;
end $$;

-- 1b, 2, 3) Portal invitation.
--   * Admin: p_email, else the frozen invite_email, else the contact email; a staff address is refused (email_is_staff).
--   * Closer: only clients.invite_email; another address is email_must_match_contact; a staff address answers the same
--     generic invalid_email (no oracle of who is staff).
--   * Closer: at most 20 invitations per day and one per client every 10 minutes (invite_recently_sent).
create or replace function private.invite_client_access_impl(p_client_id uuid, p_email extensions.citext) returns void
language plpgsql security definer set search_path = '' as $$
declare
  v_client  public.clients;
  v_locale  public.locale;
  v_contact extensions.citext;
  v_admin   boolean := private.is_admin();
  v_uid     uuid := (select auth.uid());
  v_email   extensions.citext := nullif(btrim(p_email::text), '')::extensions.citext;
  v_count   integer;
begin
  select * into v_client from public.clients c where c.id = p_client_id;
  if v_client.id is null then raise exception 'client_not_found' using errcode = 'P0002'; end if;
  if not (v_admin or private.owns_client(p_client_id)) then raise exception 'forbidden' using errcode = '42501'; end if;
  if v_client.user_id is not null then raise exception 'client_already_has_access' using errcode = '22023'; end if;

  select nullif(btrim(c.email::text), '')::extensions.citext, coalesce(c.locale, 'es') into v_contact, v_locale
    from public.crm_contacts c where c.id = v_client.contact_id;

  if v_admin then
    v_email := coalesce(v_email, v_client.invite_email, v_contact);
  else
    -- The address is the one frozen when the client was created; the current contact email is never trusted here.
    if v_client.invite_email is null or position('@' in v_client.invite_email::text) = 0 then
      raise exception 'invalid_email' using errcode = '22023';
    end if;
    if v_email is not null and position('@' in v_email::text) = 0 then raise exception 'invalid_email' using errcode = '22023'; end if;
    if v_email is not null and v_email is distinct from v_client.invite_email then
      raise exception 'email_must_match_contact' using errcode = '42501';
    end if;
    v_email := v_client.invite_email;
  end if;
  if v_email is null or position('@' in v_email::text) = 0 then raise exception 'invalid_email' using errcode = '22023'; end if;

  if exists (select 1 from auth.users u join public.staff_members s on s.user_id = u.id
              where u.email::extensions.citext operator(extensions.=) v_email) then
    if v_admin then raise exception 'email_is_staff' using errcode = '22023'; end if;
    raise exception 'invalid_email' using errcode = '22023';
  end if;

  if not v_admin then
    -- One send per client per 10 minutes; a refused call rolls its own increment back, so the window stays the first one.
    insert into private.quota_counters as q (key, count, expires_at)
    values ('client_invite_at:' || p_client_id::text, 1, now() + interval '10 minutes')
    on conflict (key) do update set
      count      = case when q.expires_at <= now() then 1 else q.count + 1 end,
      expires_at = case when q.expires_at <= now() then now() + interval '10 minutes' else q.expires_at end
    returning q.count into v_count;
    if v_count > 1 then raise exception 'invite_recently_sent' using errcode = '54000'; end if;

    insert into private.quota_counters as q (key, count, expires_at)
    values ('client_invites:' || v_uid::text, 1, now() + interval '1 day')
    on conflict (key) do update set
      count      = case when q.expires_at <= now() then 1 else q.count + 1 end,
      expires_at = case when q.expires_at <= now() then now() + interval '1 day' else q.expires_at end
    returning q.count into v_count;
    if v_count > 20 then raise exception 'invite_quota_exceeded' using errcode = '54000'; end if;
  end if;

  update public.clients set invite_email = v_email where id = p_client_id;
  insert into public.crm_interactions (contact_id, kind, direction, actor, payload)
  values (v_client.contact_id, 'client_invited', 'internal', private.staff_actor(), jsonb_build_object('client_id', p_client_id));
  perform private.enqueue('client.invited', jsonb_build_object(
    'client_id', p_client_id, 'email', v_email::text, 'locale', v_locale));
end $$;
