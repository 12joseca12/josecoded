alter type public.contact_via rename value 'pack' to 'project';

alter table public.leads
  drop constraint leads_pack_needs_pack_via,
  drop constraint leads_pack_fields;

create function private.slug_list_valid(p_slugs text[])
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    (
      select bool_and(s is not null and s ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(s) <= 40)
      from unnest(p_slugs) as s
    ),
    true
  )
$$;

create function private.offer_answers_valid(p_answers jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    jsonb_typeof(p_answers) = 'object'
    and char_length(p_answers::text) <= 1000
    and not exists (
      select 1
      from jsonb_object_keys(p_answers) as k
      where k not in ('start', 'kind', 'size', 'accounts', 'management', 'more')
    )
    and (p_answers ->> 'start') in ('idea', 'defined', 'existing')
    and (
      ((p_answers ->> 'start') = 'existing' and (p_answers - 'start') = '{}'::jsonb)
      or (
        (p_answers ->> 'start') <> 'existing'
        and (p_answers ->> 'kind') in ('web', 'app', 'both', 'unsure')
        and (p_answers ->> 'size') in ('small', 'medium', 'large', 'unsure')
        and (p_answers ->> 'accounts') in ('none', 'basic', 'roles')
        and (p_answers ->> 'management') in ('me', 'rare', 'team')
        and jsonb_typeof(p_answers -> 'more') = 'array'
        and jsonb_array_length(p_answers -> 'more') <= 8
        and not exists (
          select 1
          from jsonb_array_elements(p_answers -> 'more') as e
          where jsonb_typeof(e) <> 'string'
            or (e #>> '{}') not in (
              'payments', 'languages', 'seo', 'analytics', 'ai', 'push', 'offline', 'stores'
            )
        )
      )
    ),
    false
  )
$$;

alter table public.leads
  add column offer text,
  add column extras text[] not null default '{}',
  add column offer_answers jsonb,
  add column discarded_by uuid references public.profiles (id) on delete set null,
  add constraint leads_pack_id_needs_project_via check (
    pack_id is null or via is not distinct from 'project'
  ),
  add constraint leads_project_fields check (
    via is not distinct from 'project' or (has_domain is null and has_store_accounts is null)
  ),
  add constraint leads_offer_shape check (
    offer is null
    or (
      char_length(offer) <= 161
      and offer ~ '^[a-z0-9]+(-[a-z0-9]+)*(,[a-z0-9]+(-[a-z0-9]+)*)?$'
    )
  ),
  add constraint leads_extras_shape check (
    cardinality(extras) <= 12 and private.slug_list_valid(extras)
  ),
  add constraint leads_offer_needs_project_via check (
    (offer is null and cardinality(extras) = 0) or via is not distinct from 'project'
  ),
  add constraint leads_offer_answers_shape check (
    offer_answers is null
    or (
      via is not distinct from 'project' or via is not distinct from 'freelance'
    ) and private.offer_answers_valid(offer_answers)
  );

create index leads_discarded_by_idx on public.leads (discarded_by);

create function private.lead_activity_kind(p_source public.lead_source)
returns public.activity_kind
language sql
immutable
set search_path = ''
as $$
  select case p_source
    when 'form' then 'form'::public.activity_kind
    when 'nexo' then 'chat'::public.activity_kind
    when 'whatsapp' then 'whatsapp'::public.activity_kind
    else 'note'::public.activity_kind
  end
$$;

create function private.lead_activity_body(p_lead public.leads)
returns text
language sql
immutable
set search_path = ''
as $$
  select nullif(
    concat_ws(
      E'\n',
      nullif(btrim(p_lead.message), ''),
      case when p_lead.offer is not null then 'Oferta: ' || p_lead.offer end,
      case
        when cardinality(p_lead.extras) > 0 then 'Extras: ' || array_to_string(p_lead.extras, ', ')
      end,
      case
        when p_lead.offer_answers is not null then 'Respuestas: ' || p_lead.offer_answers::text
      end
    ),
    ''
  )
$$;

alter table public.contacts
  add column created_by_admin boolean not null default false;

alter table private.audit_log
  drop constraint audit_log_action_valid,
  add constraint audit_log_action_valid check (
    action in ('insert', 'update', 'delete', 'contact_email_matches_lead', 'claim_quota_reached')
  );

create table private.claim_quota (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day date not null,
  count integer not null default 0,
  primary key (user_id, day),
  constraint claim_quota_count_positive check (count >= 0)
);

create index claim_quota_day_idx on private.claim_quota (day);

alter table private.claim_quota enable row level security;
revoke all on private.claim_quota from anon, authenticated;

create function private.claim_daily_limit()
returns integer
language sql
immutable
set search_path = ''
as $$
  select 25
$$;

create function private.contacts_before_insert()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.created_by_admin := private.is_admin();
  return new;
end;
$$;

create function private.contact_has_real_relation(p_contact_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
      select 1
      from public.contacts c
      where c.id = p_contact_id
        and (c.lead_id is not null or c.import_id is not null or c.created_by_admin)
    )
    or exists (select 1 from public.deals d where d.contact_id = p_contact_id)
    or exists (
      select 1
      from public.activities a
      where a.contact_id = p_contact_id
        and a.author_id is not null
    )
$$;

create function private.contacts_after_insert_alert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead uuid;
begin
  select l.id
  into v_lead
  from public.leads l
  where l.email operator(extensions.=) new.email
    and l.status in ('new', 'assigned', 'contacted')
  order by l.created_at desc
  limit 1;

  if found then
    insert into private.audit_log (actor_id, table_name, row_id, action, after)
    values (
      auth.uid(),
      'contacts',
      new.id,
      'contact_email_matches_lead',
      jsonb_build_object('lead_id', v_lead, 'owner_id', new.owner_id)
    );
  end if;

  return null;
end;
$$;

create trigger contacts_set_creator
before insert on public.contacts
for each row execute function private.contacts_before_insert();

create trigger contacts_alert_open_lead_email
after insert on public.contacts
for each row
when (
  new.email is not null
  and new.lead_id is null
  and new.import_id is null
  and not new.created_by_admin
)
execute function private.contacts_after_insert_alert();

create trigger deals_audit_owner_change
after update on public.deals
for each row
when (old.owner_id is distinct from new.owner_id)
execute function private.audit();

create function private.leads_before_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_contact uuid;
  v_owner uuid;
  v_owner_usable boolean;
begin
  if new.assigned_to is not null then
    if not exists (
      select 1
      from public.profiles p
      where p.id = new.assigned_to
        and p.is_active
        and p.archived_at is null
        and p.role in ('closer', 'admin')
    ) then
      raise exception 'invalid_assignee' using errcode = 'P0001';
    end if;

    if new.status = 'new' then
      new.status := 'assigned';
    end if;
    new.assigned_at := coalesce(new.assigned_at, now());
    new.assigned_by := coalesce(new.assigned_by, auth.uid(), new.assigned_to);
  end if;

  if new.email is null or new.contact_id is not null then
    return new;
  end if;

  select c.id, c.owner_id
  into v_contact, v_owner
  from public.contacts c
  where c.email operator(extensions.=) new.email
    and c.archived_at is null
    and private.contact_has_real_relation(c.id)
  order by (c.owner_id is not null) desc, c.created_at, c.id
  limit 1;

  if not found then
    return new;
  end if;

  if new.assigned_to is not null then
    if v_owner is not distinct from new.assigned_to then
      new.contact_id := v_contact;
    end if;
    return new;
  end if;

  select exists (
    select 1
    from public.profiles p
    where p.id = v_owner
      and p.is_active
      and p.archived_at is null
      and p.role in ('closer', 'admin')
  )
  into v_owner_usable;

  new.contact_id := v_contact;

  if v_owner is not null and v_owner_usable then
    new.assigned_to := v_owner;
    new.assigned_at := now();
    new.assigned_by := null;
    new.status := 'assigned';
  end if;

  return new;
end;
$$;

create function private.leads_after_insert()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.activities (contact_id, author_id, kind, body)
  values (
    new.contact_id,
    null,
    private.lead_activity_kind(new.source),
    case
      when new.source in ('form', 'nexo')
        then btrim('[Sin verificar] ' || coalesce(private.lead_activity_body(new), ''))
      else private.lead_activity_body(new)
    end
  );

  return null;
end;
$$;

create trigger leads_match_contact
before insert on public.leads
for each row execute function private.leads_before_insert();

create trigger leads_audit_changes
after update on public.leads
for each row
when (old.assigned_to is distinct from new.assigned_to or old.status is distinct from new.status)
execute function private.audit();

create trigger leads_log_matched_activity
after insert on public.leads
for each row
when (new.contact_id is not null and new.assigned_to is not null)
execute function private.leads_after_insert();

create function private.convert_lead(
  p_lead public.leads,
  p_owner uuid,
  p_actor uuid,
  p_adopt boolean,
  out o_contact_id uuid,
  out o_deal_id uuid
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_previous_owner uuid;
  v_other uuid;
  v_other_owner uuid;
begin
  o_contact_id := p_lead.contact_id;

  if o_contact_id is not null then
    select c.owner_id
    into v_previous_owner
    from public.contacts c
    where c.id = o_contact_id
    for update;

    if v_previous_owner is distinct from p_owner then
      begin
        update public.contacts set owner_id = p_owner where id = o_contact_id;
      exception
        when unique_violation then
          raise exception 'contact_conflict' using errcode = 'P0001';
      end;

      update public.deals set owner_id = p_owner where contact_id = o_contact_id;
    end if;
  else
    if p_lead.email is not null then
      select c.id
      into o_contact_id
      from public.contacts c
      where c.email operator(extensions.=) p_lead.email
        and c.owner_id = p_owner
        and c.archived_at is null
      limit 1;

      if o_contact_id is null then
        select c.id, c.owner_id
        into v_other, v_other_owner
        from public.contacts c
        where c.email operator(extensions.=) p_lead.email
          and c.archived_at is null
        order by (c.owner_id is not null) desc, c.created_at, c.id
        limit 1
        for update;

        if found then
          if v_other_owner is not null or not p_adopt then
            raise exception 'contact_conflict' using errcode = 'P0001';
          end if;

          update public.contacts set owner_id = p_owner where id = v_other;
          update public.deals set owner_id = p_owner where contact_id = v_other;
          o_contact_id := v_other;
        end if;
      end if;
    end if;

    if o_contact_id is null then
      begin
        insert into public.contacts (owner_id, full_name, email, phone, organization, kind, source, lead_id)
        values (
          p_owner,
          p_lead.full_name,
          p_lead.email,
          p_lead.phone,
          p_lead.organization,
          'prospect',
          p_lead.source::text::public.contact_source,
          p_lead.id
        )
        returning id into o_contact_id;
      exception
        when unique_violation then
          raise exception 'contact_conflict' using errcode = 'P0001';
      end;
    end if;
  end if;

  o_deal_id := p_lead.deal_id;

  if o_deal_id is null then
    insert into public.deals (contact_id, stage, via, pack_id)
    values (o_contact_id, 'new', coalesce(p_lead.via, 'hiring'), p_lead.pack_id)
    returning id into o_deal_id;
  end if;

  insert into public.activities (contact_id, deal_id, author_id, kind, body)
  values (
    o_contact_id,
    o_deal_id,
    p_actor,
    private.lead_activity_kind(p_lead.source),
    private.lead_activity_body(p_lead)
  );
end;
$$;

create function private.is_own_or_sub(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.is_closer()
    and p_user is not null
    and (
      p_user = auth.uid()
      or exists (
        select 1
        from public.profiles o
        where o.id = p_user
          and o.parent_closer_id = auth.uid()
      )
    )
$$;

create function public.list_lead_inbox()
returns table (
  id uuid,
  first_name text,
  via public.contact_via,
  offer text,
  extras text[],
  created_at timestamptz,
  excerpt text,
  locale public.app_locale
)
language plpgsql
stable
security definer
set search_path = ''
as $$
begin
  if not (private.is_closer() or private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    l.id,
    split_part(btrim(l.full_name), ' ', 1),
    l.via,
    l.offer,
    l.extras,
    l.created_at,
    left(
      regexp_replace(
        regexp_replace(
          regexp_replace(l.message, '[^\s@]+@[^\s@]+\.[^\s@]+', '[…]', 'g'),
          '(https?://|www\.)\S+',
          '[…]',
          'gi'
        ),
        '\+?\d([\s.\-]*\d){6,}',
        '[…]',
        'g'
      ),
      140
    ),
    l.locale
  from public.leads l
  where l.status = 'new'
    and l.assigned_to is null
    and l.contact_id is null
  order by l.created_at desc
  limit 200;
end;
$$;

create function public.claim_lead(p_lead_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_lead public.leads;
  v_contact uuid;
  v_deal uuid;
  v_count integer;
  v_admin uuid;
begin
  if not (private.is_closer() or private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not private.is_admin() then
    insert into private.claim_quota as q (user_id, day, count)
    values (v_uid, (now() at time zone 'utc')::date, 1)
    on conflict (user_id, day) do update set count = q.count + 1
    returning q.count into v_count;

    if v_count > private.claim_daily_limit() then
      raise exception 'claim_quota_exceeded' using errcode = 'P0001';
    end if;

    if v_count = private.claim_daily_limit() then
      insert into private.audit_log (actor_id, table_name, row_id, action, after)
      values (
        v_uid,
        'profiles',
        v_uid,
        'claim_quota_reached',
        jsonb_build_object('day', (now() at time zone 'utc')::date, 'limit', v_count)
      );
    end if;
  end if;

  update public.leads l
  set assigned_to = v_uid,
      assigned_by = v_uid,
      assigned_at = now(),
      status = 'converted'
  where l.id = p_lead_id
    and l.status = 'new'
    and l.assigned_to is null
    and l.contact_id is null
  returning l.* into v_lead;

  if not found then
    raise exception 'lead_already_claimed' using errcode = 'P0001';
  end if;

  begin
    select cl.o_contact_id, cl.o_deal_id
    into v_contact, v_deal
    from private.convert_lead(v_lead, v_uid, v_uid, false) cl;
  exception
    when raise_exception then
      if sqlerrm is distinct from 'contact_conflict' then
        raise;
      end if;

      select p.id into v_admin from public.profiles p where p.role = 'admin' limit 1;

      update public.leads
      set assigned_to = v_admin,
          assigned_by = v_admin,
          assigned_at = now(),
          status = 'assigned'
      where id = p_lead_id;

      return null;
  end;

  update public.leads set contact_id = v_contact, deal_id = v_deal where id = p_lead_id;

  return v_contact;
end;
$$;

create function public.assign_lead(p_lead_id uuid, p_user_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_lead public.leads;
  v_contact uuid;
  v_deal uuid;
begin
  if not private.is_admin() then
    raise exception 'admin_only' using errcode = '42501';
  end if;

  if not exists (
    select 1
    from public.profiles p
    where p.id = p_user_id
      and p.is_active
      and p.archived_at is null
      and p.role in ('closer', 'admin')
  ) then
    raise exception 'invalid_assignee' using errcode = 'P0001';
  end if;

  select l.* into v_lead from public.leads l where l.id = p_lead_id for update;

  if not found then
    raise exception 'lead_not_found' using errcode = 'P0001';
  end if;

  if v_lead.status = 'discarded' then
    raise exception 'lead_discarded' using errcode = 'P0001';
  end if;

  select cl.o_contact_id, cl.o_deal_id
  into v_contact, v_deal
  from private.convert_lead(v_lead, p_user_id, v_uid, true) cl;

  update public.leads
  set assigned_to = p_user_id,
      assigned_by = v_uid,
      assigned_at = now(),
      status = 'converted',
      contact_id = v_contact,
      deal_id = v_deal
  where id = p_lead_id;

  return v_contact;
end;
$$;

create function public.discard_lead(p_lead_id uuid, p_reason text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_reason text := btrim(coalesce(p_reason, ''));
  v_lead public.leads;
begin
  if not (private.is_admin() or private.is_closer()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_reason = '' then
    raise exception 'reason_required' using errcode = 'P0001';
  end if;

  if char_length(v_reason) > 500 then
    raise exception 'reason_too_long' using errcode = 'P0001';
  end if;

  select l.* into v_lead from public.leads l where l.id = p_lead_id for update;

  if not found then
    if private.is_admin() then
      raise exception 'lead_not_found' using errcode = 'P0001';
    end if;
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not (private.is_admin() or private.is_own_or_sub(v_lead.assigned_to)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_lead.status not in ('new', 'assigned', 'contacted') or v_lead.deal_id is not null then
    raise exception 'lead_not_discardable' using errcode = 'P0001';
  end if;

  update public.leads
  set status = 'discarded',
      discard_reason = v_reason,
      discarded_by = auth.uid(),
      handled_at = coalesce(handled_at, now())
  where id = p_lead_id;
end;
$$;

create function public.touch_lead(p_lead_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_lead public.leads;
begin
  if not (private.is_admin() or private.is_closer()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select l.* into v_lead from public.leads l where l.id = p_lead_id for update;

  if not found then
    if private.is_admin() then
      raise exception 'lead_not_found' using errcode = 'P0001';
    end if;
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not (private.is_admin() or private.is_own_or_sub(v_lead.assigned_to)) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_lead.status not in ('assigned', 'converted', 'contacted') then
    raise exception 'lead_not_touchable' using errcode = 'P0001';
  end if;

  update public.leads
  set status = case
        when v_lead.status = 'assigned' then 'contacted'::public.lead_status
        else v_lead.status
      end,
      handled_at = coalesce(handled_at, now())
  where id = p_lead_id;
end;
$$;

revoke all on function private.slug_list_valid(text[]) from public, anon, authenticated;
revoke all on function private.offer_answers_valid(jsonb) from public, anon, authenticated;
revoke all on function private.lead_activity_kind(public.lead_source) from public, anon, authenticated;
revoke all on function private.lead_activity_body(public.leads) from public, anon, authenticated;
revoke all on function private.leads_before_insert() from public, anon, authenticated;
revoke all on function private.leads_after_insert() from public, anon, authenticated;
revoke all on function private.convert_lead(public.leads, uuid, uuid, boolean) from public, anon, authenticated;
revoke all on function private.is_own_or_sub(uuid) from public, anon, authenticated;
revoke all on function private.claim_daily_limit() from public, anon, authenticated;
revoke all on function private.contacts_before_insert() from public, anon, authenticated;
revoke all on function private.contact_has_real_relation(uuid) from public, anon, authenticated;
revoke all on function private.contacts_after_insert_alert() from public, anon, authenticated;

revoke all on function public.claim_lead(uuid) from public, anon, authenticated;
revoke all on function public.assign_lead(uuid, uuid) from public, anon, authenticated;
revoke all on function public.discard_lead(uuid, text) from public, anon, authenticated;
revoke all on function public.touch_lead(uuid) from public, anon, authenticated;
revoke all on function public.list_lead_inbox() from public, anon, authenticated;

grant execute on function private.slug_list_valid(text[]) to authenticated;
grant execute on function private.offer_answers_valid(jsonb) to authenticated;

grant execute on function public.claim_lead(uuid) to authenticated;
grant execute on function public.assign_lead(uuid, uuid) to authenticated;
grant execute on function public.discard_lead(uuid, text) to authenticated;
grant execute on function public.touch_lead(uuid) to authenticated;
grant execute on function public.list_lead_inbox() to authenticated;

revoke insert on public.leads from authenticated;
grant insert (source, via, full_name, email, phone, organization, message, locale, assigned_to)
on public.leads to authenticated;

drop policy leads_select on public.leads;
drop policy leads_insert on public.leads;

create policy leads_select
on public.leads
for select
to authenticated
using (
  (select private.is_admin())
  or ((select private.is_closer()) and assigned_to = (select private.uid()))
  or private.owns_lead(id)
);

create policy leads_insert
on public.leads
for insert
to authenticated
with check (
  (select private.is_admin())
  or (
    (select private.is_closer())
    and source in ('whatsapp', 'manual')
    and assigned_to = (select private.uid())
  )
);

drop function public.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text
);
drop function private.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text
);

create function private.submit_lead(
  p_source public.lead_source,
  p_via public.contact_via default null,
  p_pack_id uuid default null,
  p_full_name text default null,
  p_email extensions.citext default null,
  p_phone text default null,
  p_organization text default null,
  p_message text default null,
  p_offer_url text default null,
  p_company text default null,
  p_wanted_by date default null,
  p_has_domain boolean default null,
  p_has_store_accounts boolean default null,
  p_page_path text default null,
  p_locale public.app_locale default null,
  p_consent boolean default false,
  p_ip_hash text default null,
  p_offer text default null,
  p_extras text[] default null,
  p_offer_answers jsonb default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_count integer;
  v_id uuid;
begin
  if p_source is distinct from 'form' then
    raise exception 'invalid_source' using errcode = 'P0001';
  end if;

  if not coalesce(p_consent, false) then
    raise exception 'consent_required' using errcode = 'P0001';
  end if;

  if p_ip_hash is null then
    raise exception 'ip_hash_required' using errcode = 'P0001';
  end if;

  insert into private.form_quota as q (ip_hash, day, count)
  values (p_ip_hash, (now() at time zone 'utc')::date, 1)
  on conflict (ip_hash, day) do update set count = q.count + 1
  returning q.count into v_count;

  if v_count > 5 then
    raise exception 'form_quota_exceeded' using errcode = 'P0001', hint = 'contact_alternatives';
  end if;

  if p_email is not null then
    insert into private.form_quota as q (ip_hash, day, count)
    values ('email:' || md5(lower(p_email::text)), (now() at time zone 'utc')::date, 1)
    on conflict (ip_hash, day) do update set count = q.count + 1
    returning q.count into v_count;

    if v_count > 3 then
      raise exception 'form_email_quota_exceeded' using errcode = 'P0001', hint = 'contact_alternatives';
    end if;
  end if;

  insert into private.form_quota as q (ip_hash, day, count)
  values ('__global__', (now() at time zone 'utc')::date, 1)
  on conflict (ip_hash, day) do update set count = q.count + 1
  returning q.count into v_count;

  if v_count > 200 then
    raise exception 'form_global_quota_exceeded' using errcode = 'P0001', hint = 'contact_alternatives';
  end if;

  insert into public.leads (
    source, via, pack_id, full_name, email, phone, organization, message, offer_url, company,
    wanted_by, has_domain, has_store_accounts, page_path, locale, consent_at,
    offer, extras, offer_answers
  )
  values (
    p_source, p_via, p_pack_id, p_full_name, p_email, p_phone, p_organization, p_message,
    p_offer_url, p_company, p_wanted_by, p_has_domain, p_has_store_accounts, p_page_path,
    p_locale, now(), p_offer, coalesce(p_extras, '{}'), p_offer_answers
  )
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function private.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb
) from public, anon, authenticated, service_role;

create function public.submit_lead(
  p_source public.lead_source,
  p_via public.contact_via default null,
  p_pack_id uuid default null,
  p_full_name text default null,
  p_email extensions.citext default null,
  p_phone text default null,
  p_organization text default null,
  p_message text default null,
  p_offer_url text default null,
  p_company text default null,
  p_wanted_by date default null,
  p_has_domain boolean default null,
  p_has_store_accounts boolean default null,
  p_page_path text default null,
  p_locale public.app_locale default null,
  p_consent boolean default false,
  p_ip_hash text default null,
  p_offer text default null,
  p_extras text[] default null,
  p_offer_answers jsonb default null
)
returns uuid
language sql
security definer
set search_path = ''
as $$
  select private.submit_lead(
    p_source, p_via, p_pack_id, p_full_name, p_email, p_phone, p_organization, p_message,
    p_offer_url, p_company, p_wanted_by, p_has_domain, p_has_store_accounts, p_page_path,
    p_locale, p_consent, p_ip_hash, p_offer, p_extras, p_offer_answers
  )
$$;

revoke all on function public.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb
) from public, anon, authenticated;

grant execute on function public.submit_lead(
  public.lead_source, public.contact_via, uuid, text, extensions.citext, text, text, text, text,
  text, date, boolean, boolean, text, public.app_locale, boolean, text, text, text[], jsonb
) to service_role;
