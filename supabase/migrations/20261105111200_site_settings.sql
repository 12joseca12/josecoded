create function private.setting_value_valid(p_key text, p_value jsonb)
returns boolean
language sql
immutable
set search_path = ''
as $$
  select coalesce(
    case
      when p_value is null then false
      when p_key in (
        'blog', 'lab', 'public_chat', 'show_prices', 'projects', 'search', 'google_sign_in', 'cv_download'
      ) then jsonb_typeof(p_value) = 'boolean'
      when p_key = 'maintenance' then
        case
          when jsonb_typeof(p_value) <> 'object' then false
          when exists (
            select 1 from jsonb_object_keys(p_value) as k where k not in ('on', 'until')
          ) then false
          when jsonb_typeof(p_value -> 'on') is distinct from 'boolean' then false
          when not (p_value ? 'until') then true
          when jsonb_typeof(p_value -> 'until') = 'null' then true
          when jsonb_typeof(p_value -> 'until') <> 'string' then false
          else (p_value ->> 'until') ~ '^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?(Z|[+-]\d{2}:\d{2})$'
        end
      when p_key = 'availability.next_project_month' then
        case
          when jsonb_typeof(p_value) = 'null' then true
          when jsonb_typeof(p_value) <> 'string' then false
          else (p_value #>> '{}') ~ '^\d{4}-(0[1-9]|1[0-2])$'
        end
      when p_key = 'availability.from' then
        case
          when jsonb_typeof(p_value) = 'null' then true
          when jsonb_typeof(p_value) <> 'string' then false
          else (p_value #>> '{}') ~ '^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$'
        end
      when p_key = 'availability.weekly_hours' then
        case
          when jsonb_typeof(p_value) = 'null' then true
          when jsonb_typeof(p_value) <> 'number' then false
          when (p_value #>> '{}') !~ '^\d{1,2}$' then false
          else (p_value #>> '{}')::integer between 0 and 80
        end
      when p_key = 'nexo.reply_delay_min' then
        case
          when jsonb_typeof(p_value) <> 'number' then false
          when (p_value #>> '{}') !~ '^\d{1,3}$' then false
          else (p_value #>> '{}')::integer between 0 and 240
        end
      when p_key = 'payout.default_cadence' then
        jsonb_typeof(p_value) = 'string' and (p_value #>> '{}') in ('per_payment', 'weekly', 'biweekly')
      when p_key = 'billing.vat_rate' then
        case
          when jsonb_typeof(p_value) <> 'number' then false
          when (p_value #>> '{}') !~ '^\d{1,3}(\.\d{1,2})?$' then false
          else (p_value #>> '{}')::numeric between 0 and 100
        end
      else false
    end,
    false
  )
$$;

create table public.site_settings (
  key text primary key,
  value jsonb not null,
  public boolean generated always as (
    key not in ('nexo.reply_delay_min', 'payout.default_cadence', 'billing.vat_rate')
  ) stored,
  updated_by uuid references public.profiles (id) on delete set null,
  updated_at timestamptz not null default now(),
  constraint site_settings_key_allowed check (
    key in (
      'availability.from',
      'availability.next_project_month',
      'availability.weekly_hours',
      'billing.vat_rate',
      'blog',
      'cv_download',
      'google_sign_in',
      'lab',
      'maintenance',
      'nexo.reply_delay_min',
      'payout.default_cadence',
      'projects',
      'public_chat',
      'search',
      'show_prices'
    )
  ),
  constraint site_settings_value_valid check (private.setting_value_valid(key, value))
);

create index site_settings_updated_by_idx on public.site_settings (updated_by);

alter table public.site_settings enable row level security;

revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to authenticated;

create policy site_settings_select_admin
on public.site_settings
for select
to authenticated
using ((select private.is_admin()));

insert into public.site_settings (key, value)
values
  ('availability.from', 'null'::jsonb),
  ('availability.next_project_month', 'null'::jsonb),
  ('availability.weekly_hours', 'null'::jsonb),
  ('billing.vat_rate', '21'::jsonb),
  ('blog', 'true'::jsonb),
  ('cv_download', 'true'::jsonb),
  ('google_sign_in', 'false'::jsonb),
  ('lab', 'false'::jsonb),
  ('maintenance', '{"on": false}'::jsonb),
  ('nexo.reply_delay_min', '10'::jsonb),
  ('payout.default_cadence', '"biweekly"'::jsonb),
  ('projects', 'true'::jsonb),
  ('public_chat', 'false'::jsonb),
  ('search', 'false'::jsonb),
  ('show_prices', 'true'::jsonb);

create function private.audit_site_setting()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into private.audit_log (actor_id, table_name, row_id, action, before, after)
  values (
    auth.uid(),
    tg_table_name,
    md5(new.key)::uuid,
    'update',
    jsonb_build_object('key', old.key, 'value', old.value),
    jsonb_build_object('key', new.key, 'value', new.value)
  );
  return null;
end;
$$;

create trigger site_settings_set_updated_at
before update on public.site_settings
for each row execute function private.set_updated_at();

create trigger site_settings_audit_update
after update on public.site_settings
for each row
when (old.value is distinct from new.value)
execute function private.audit_site_setting();

create function public.set_setting(p_key text, p_value jsonb)
returns timestamptz
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_updated_at timestamptz;
begin
  if not (select private.is_admin()) then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if not exists (select 1 from public.site_settings where key = p_key) then
    raise exception 'setting_key_not_allowed' using errcode = 'P0001';
  end if;

  if not private.setting_value_valid(p_key, p_value) then
    raise exception 'setting_value_invalid' using errcode = 'P0001';
  end if;

  update public.site_settings
  set value = p_value,
      updated_by = (select private.uid())
  where key = p_key
  returning updated_at into v_updated_at;

  return v_updated_at;
end;
$$;

create function public.read_public_settings()
returns table (key text, value jsonb, updated_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select s.key, s.value, s.updated_at
  from public.site_settings s
  where s.public
  order by s.key
$$;

revoke all on function private.setting_value_valid(text, jsonb) from public, anon, authenticated;
revoke all on function private.audit_site_setting() from public, anon, authenticated;
revoke all on function public.set_setting(text, jsonb) from public, anon, authenticated;
revoke all on function public.read_public_settings() from public, anon, authenticated;

grant execute on function public.set_setting(text, jsonb) to authenticated;
grant execute on function public.read_public_settings() to service_role;
