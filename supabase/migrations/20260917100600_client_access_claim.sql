-- Task 1.8 (DT §6.2 + §0b, plan v2.1). The admin puts an email on the client; whoever registers AND CONFIRMS that
-- email is linked by calling this RPC after the auth callback. No service role or auth.admin needed.
alter table public.clients add column invite_email text;
create index idx_clients_invite_email on public.clients (lower(invite_email)) where invite_email is not null;
create or replace function public.claim_client_access() returns uuid language plpgsql security definer set search_path = public as $$
declare v_id uuid;
begin
  -- Verified email required: someone who registers with another person's address without confirming it gets nothing.
  if (select u.email_confirmed_at from auth.users u where u.id = auth.uid()) is null then
    return null;
  end if;
  -- skip locked: two concurrent sessions never claim the same row.
  select c.id into v_id from public.clients c
   where c.user_id is null and lower(c.invite_email) = lower(auth.email())
   order by c.created_at, c.id
   limit 1
   for update skip locked;
  if v_id is null then return null; end if;
  update public.clients set user_id = auth.uid() where id = v_id;
  return v_id;
end $$;
revoke execute on function public.claim_client_access() from public, anon;
grant execute on function public.claim_client_access() to authenticated;
