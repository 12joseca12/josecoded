-- Task 1.8 (DT §1.12 + §6.2 + §0b, plan v2.1). Area personalisation: one row per user and the lead summary RPC.
-- leads.user_id moved to 20260917100000_leads_web_fields.sql (v2.1).
create extension if not exists moddatetime with schema extensions;
create table public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  first_audience text check (first_audience in ('business','company','blog','referral')),
  first_audience_source text check (first_audience_source in ('ref','origin')),
  locale text not null default 'es' check (locale in ('es','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger user_profiles_updated_at before update on public.user_profiles
  for each row execute function extensions.moddatetime(updated_at);
alter table public.user_profiles enable row level security;
grant select, insert, update on public.user_profiles to authenticated;
create policy "own profile select" on public.user_profiles for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "own profile insert" on public.user_profiles for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "own profile update" on public.user_profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "admin reads profiles" on public.user_profiles for select to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin');
create function private.user_profiles_guard() returns trigger language plpgsql as $$
begin
  if old.first_audience is not null and new.first_audience is distinct from old.first_audience then
    raise exception 'first_audience is write-once' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke all on function private.user_profiles_guard() from public, anon, authenticated;
create trigger user_profiles_guard before update on public.user_profiles
  for each row execute function private.user_profiles_guard();
-- v2.1: only with a confirmed email, and only the lead that comes from the proposal generator.
create function public.area_lead_summary()
returns table (pack_code text, price_from numeric, estado text, created_at timestamptz, is_app boolean)
language sql security definer set search_path = public, pg_temp stable as $$
  select l.ai_proposal->>'pack', (l.ai_proposal->>'priceFrom')::numeric, l.estado, l.created_at,
         coalesce((l.ai_proposal->>'isApp')::boolean, false)
  from public.leads l
  where (select u.email_confirmed_at from auth.users u where u.id = auth.uid()) is not null
    and l.ai_proposal is not null and l.fuente = 'web_proposal'
    and (l.user_id = auth.uid() or lower(l.contact_email) = lower(auth.email()))
  order by l.created_at desc limit 1
$$;
revoke all on function public.area_lead_summary() from public, anon;
grant execute on function public.area_lead_summary() to authenticated;
