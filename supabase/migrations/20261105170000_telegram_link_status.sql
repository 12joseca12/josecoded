create function public.telegram_link_status()
returns table (
  linked_at timestamptz,
  pending_code text,
  pending_expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if not private.is_staff() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  return query
  select
    (select tl.linked_at from private.telegram_links tl where tl.user_id = v_uid),
    (select c.code from private.telegram_codes c where c.user_id = v_uid and c.expires_at > now()),
    (select c.expires_at from private.telegram_codes c where c.user_id = v_uid and c.expires_at > now());
end;
$$;

revoke all on function public.telegram_link_status() from public, anon, authenticated;
grant execute on function public.telegram_link_status() to authenticated;
