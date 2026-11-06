create table public.imports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles (id) on delete cascade,
  assigned_to uuid references public.profiles (id) on delete set null,
  file_name text not null,
  file_hash text not null,
  rows_total integer not null,
  rows_created integer not null default 0,
  rows_updated integer not null default 0,
  rows_skipped integer not null default 0,
  rows_invalid integer not null default 0,
  created_at timestamptz not null default now(),
  constraint imports_file_name_length check (char_length(file_name) between 1 and 255),
  constraint imports_file_hash_shape check (file_hash ~ '^[0-9a-f]{64}$'),
  constraint imports_counts_valid check (
    rows_total between 1 and 500
    and rows_created >= 0
    and rows_updated >= 0
    and rows_skipped >= 0
    and rows_invalid >= 0
    and rows_created + rows_updated + rows_skipped + rows_invalid <= rows_total
  )
);

create unique index imports_owner_hash_key
on public.imports (owner_id, file_hash)
where rows_created + rows_updated > 0;

create index imports_owner_created_idx on public.imports (owner_id, created_at desc);
create index imports_assigned_to_idx on public.imports (assigned_to);

alter table public.imports enable row level security;
revoke all on public.imports from anon, authenticated;
grant select on public.imports to authenticated;

create policy imports_select
on public.imports
for select
to authenticated
using (
  (select private.is_admin())
  or ((select private.is_closer()) and owner_id = (select private.uid()))
);

create function private.import_text(p_value text, p_max integer)
returns text
language sql
immutable
set search_path = ''
as $$
  select case
    when btrim(coalesce(p_value, ''), E' \t\r\n') = '' then null
    when left(btrim(p_value, E' \t\r\n'), 1) in ('=', '+', '-', '@')
      then left('''' || btrim(p_value, E' \t\r\n'), p_max)
    else left(btrim(p_value, E' \t\r\n'), p_max)
  end
$$;

create function public.import_contacts(
  p_file_name text,
  p_file_hash text,
  p_rows jsonb,
  p_on_duplicate text default 'skip',
  p_owner_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
  v_is_admin boolean := private.is_admin();
  v_owner uuid := coalesce(p_owner_id, auth.uid());
  v_import uuid;
  v_name text;
  v_item record;
  v_full_name text;
  v_email text;
  v_phone text;
  v_org text;
  v_notes text;
  v_kind public.contact_kind;
  v_existing uuid;
  v_total integer;
  v_created integer := 0;
  v_updated integer := 0;
  v_skipped integer := 0;
  v_invalid integer := 0;
  v_changed integer;
begin
  if not (private.is_closer() or v_is_admin) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if p_on_duplicate not in ('skip', 'update') then
    raise exception 'invalid_duplicate_mode' using errcode = '22023';
  end if;

  if p_file_hash is null or p_file_hash !~ '^[0-9a-f]{64}$' then
    raise exception 'invalid_file_hash' using errcode = '22023';
  end if;

  if p_rows is null or jsonb_typeof(p_rows) <> 'array' then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;

  v_total := jsonb_array_length(p_rows);

  if v_total = 0 then
    raise exception 'invalid_rows' using errcode = '22023';
  end if;

  if v_total > 500 then
    raise exception 'too_many_rows' using errcode = '22023';
  end if;

  if v_owner <> v_uid then
    if not v_is_admin then
      raise exception 'forbidden' using errcode = '42501';
    end if;

    if not exists (
      select 1
      from public.profiles p
      where p.id = v_owner
        and p.role in ('admin', 'closer')
        and p.is_active
        and p.archived_at is null
    ) then
      raise exception 'invalid_owner' using errcode = '22023';
    end if;
  end if;

  if exists (
    select 1
    from public.imports i
    where i.owner_id = v_uid
      and i.file_hash = p_file_hash
      and i.rows_created + i.rows_updated > 0
  ) then
    raise exception 'already_imported' using errcode = 'P0001';
  end if;

  v_name := coalesce(private.import_text(regexp_replace(coalesce(p_file_name, ''), '[[:cntrl:]/\\]', '', 'g'), 255), 'import.csv');

  insert into public.imports (owner_id, assigned_to, file_name, file_hash, rows_total)
  values (v_uid, v_owner, v_name, p_file_hash, v_total)
  returning id into v_import;

  for v_item in
    select e.value as row_value
    from jsonb_array_elements(p_rows) as e (value)
  loop
    if jsonb_typeof(v_item.row_value) <> 'object' then
      v_invalid := v_invalid + 1;
      continue;
    end if;

    v_full_name := private.import_text(v_item.row_value ->> 'full_name', 200);
    v_email := nullif(btrim(coalesce(v_item.row_value ->> 'email', '')), '');
    v_phone := nullif(btrim(coalesce(v_item.row_value ->> 'phone', '')), '');
    v_org := private.import_text(v_item.row_value ->> 'organization', 200);
    v_notes := private.import_text(v_item.row_value ->> 'notes', 20000);

    begin
      v_kind := coalesce(nullif(v_item.row_value ->> 'kind', ''), 'prospect')::public.contact_kind;
    exception
      when invalid_text_representation then
        v_invalid := v_invalid + 1;
        continue;
    end;

    if v_full_name is null
      or (
        v_email is not null
        and (
          char_length(v_email) > 320
          or v_email !~ '^[^=+@[:space:][:cntrl:]-][^[:space:][:cntrl:]@]*@[^[:space:][:cntrl:]@]+\.[^[:space:][:cntrl:]@]+$'
        )
      )
      or (v_phone is not null and (char_length(v_phone) > 40 or v_phone !~ '^[+0-9(][0-9 ().-]*$'))
    then
      v_invalid := v_invalid + 1;
      continue;
    end if;

    v_existing := null;

    if v_email is not null then
      select c.id
      into v_existing
      from public.contacts c
      where c.owner_id = v_owner
        and c.archived_at is null
        and c.email operator(extensions.=) v_email::extensions.citext;
    end if;

    if v_existing is null then
      insert into public.contacts (owner_id, full_name, email, phone, organization, kind, notes, source, import_id)
      values (v_owner, v_full_name, v_email::extensions.citext, v_phone, v_org, v_kind, v_notes, 'import', v_import);
      v_created := v_created + 1;
    elsif p_on_duplicate = 'skip' then
      v_skipped := v_skipped + 1;
    else
      update public.contacts c
      set phone = coalesce(c.phone, v_phone),
          organization = coalesce(c.organization, v_org),
          notes = coalesce(c.notes, v_notes)
      where c.id = v_existing
        and (
          (c.phone is null and v_phone is not null)
          or (c.organization is null and v_org is not null)
          or (c.notes is null and v_notes is not null)
        );
      get diagnostics v_changed = row_count;

      if v_changed > 0 then
        v_updated := v_updated + 1;
      else
        v_skipped := v_skipped + 1;
      end if;
    end if;
  end loop;

  update public.imports
  set rows_created = v_created,
      rows_updated = v_updated,
      rows_skipped = v_skipped,
      rows_invalid = v_invalid
  where id = v_import;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (
    v_uid,
    'imports',
    v_import,
    'insert',
    jsonb_build_object(
      'file_hash', p_file_hash,
      'assigned_to', v_owner,
      'on_duplicate', p_on_duplicate,
      'rows_total', v_total,
      'rows_created', v_created,
      'rows_updated', v_updated,
      'rows_skipped', v_skipped,
      'rows_invalid', v_invalid
    )
  );

  return jsonb_build_object(
    'import_id', v_import,
    'created', v_created,
    'updated', v_updated,
    'skipped', v_skipped,
    'invalid', v_invalid
  );
exception
  when unique_violation then
    if sqlerrm like '%imports_owner_hash_key%' then
      raise exception 'already_imported' using errcode = 'P0001';
    end if;
    raise;
end;
$$;

revoke all on function private.import_text(text, integer) from public, anon, authenticated;
revoke all on function public.import_contacts(text, text, jsonb, text, uuid) from public, anon, authenticated;
grant execute on function public.import_contacts(text, text, jsonb, text, uuid) to authenticated;
