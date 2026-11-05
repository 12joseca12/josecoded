create or replace function public.log_totp_reset(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_email text;
  v_locale public.app_locale;
begin
  if not private.is_admin() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  select u.email::text, p.locale
  into v_email, v_locale
  from public.profiles p
  left join auth.users u on u.id = p.id
  where p.id = p_user_id;

  if not found then
    raise exception 'user_not_found' using errcode = 'P0001';
  end if;

  insert into private.audit_log (actor_id, table_name, row_id, action, after)
  values (auth.uid(), 'profiles', p_user_id, 'update', jsonb_build_object('totp_reset', true));

  if v_email is not null then
    insert into private.outbox (channel, recipient, template, payload)
    values ('email', v_email, 'totp_reset', jsonb_build_object('locale', v_locale));
  end if;
end;
$$;
