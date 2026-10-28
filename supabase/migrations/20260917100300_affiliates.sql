-- Task 1.8 (DT §6.2 + §0b, plan v2.1). Affiliates, their code trigger and the contact-free leads view.
create table public.affiliates (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null unique references auth.users(id) on delete cascade,
  -- Single contract AFFILIATE_CODE_RE (packages/pricing/src/affiliate-code.ts), copied literally:
  -- DANI-3B7K2Q, MARTA-7F2KX9. A test in supabase/test compares both.
  code       text not null unique check (code ~ '^[A-Z0-9]{3,12}-[A-Z0-9]{6}$'),
  level      text not null default 'standard' check (level in ('standard','premium')),
  created_at timestamptz not null default now()
);
-- v2.1: the code is generated only when the row comes without one (the seed fixes ANA-TEST01), gen_random_bytes is
-- schema-qualified and the search_path includes `extensions`.
create or replace function private.set_affiliate_code() returns trigger language plpgsql security definer set search_path = public, extensions as $$
declare
  v_name   text;
  v_prefix text;
  v_suffix text;
begin
  if new.code is not null then
    return new;
  end if;
  -- The user never chooses the code. Prefix: first given name (auth.users metadata, else the email local part),
  -- accents stripped, alphanumerics only, at most 12 characters; under 3 falls back to 'REF' (same as suggestPrefix()).
  select coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', split_part(u.email, '@', 1))
    into v_name from auth.users u where u.id = new.user_id;
  v_prefix := upper(regexp_replace(translate(split_part(btrim(coalesce(v_name, '')), ' ', 1), 'áéíóúàèìòùäëïöüñÁÉÍÓÚÑ', 'aeiouaeiouaeiounAEIOUN'), '[^A-Za-z0-9]', '', 'g'));
  v_prefix := substr(v_prefix, 1, 12);
  if length(v_prefix) < 3 then v_prefix := 'REF'; end if;
  loop
    -- 6-character suffix without 0/1 (translated to X/Z)
    v_suffix := translate(upper(substr(encode(extensions.gen_random_bytes(4), 'hex'), 1, 6)), '01', 'XZ');
    new.code := v_prefix || '-' || v_suffix;
    exit when not exists (select 1 from public.affiliates a where a.code = new.code);
  end loop;
  return new;
end $$;
revoke all on function private.set_affiliate_code() from public, anon, authenticated;
create trigger trg_affiliates_code before insert on public.affiliates for each row execute function private.set_affiliate_code();
alter table public.affiliates enable row level security;
grant select, insert on public.affiliates to authenticated;
grant update on public.affiliates to authenticated;
create policy "affiliates read own or admin" on public.affiliates for select to authenticated
  using (user_id = (select auth.uid()) or private.staff_role_of((select auth.uid())) = 'admin');
create policy "affiliates insert self standard" on public.affiliates for insert to authenticated
  with check (user_id = (select auth.uid()) and level = 'standard');
create policy "affiliates admin update" on public.affiliates for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');
alter table public.leads add constraint leads_affiliate_code_fkey foreign key (affiliate_code) references public.affiliates(code) on delete set null;

-- View so an affiliate sees ONLY status and date of their leads (never contact data).
-- No security_invoker: the view runs with its owner's privileges (postgres) and filters by auth.uid(), so NO new select
-- policy on `leads` is needed (it would expose whole rows through PostgREST).
create view public.affiliate_leads_view as
  select l.id, l.affiliate_code, l.estado, l.created_at, (l.paid_at is not null) as paid
  from public.leads l
  where l.affiliate_code in (select a.code from public.affiliates a where a.user_id = (select auth.uid()));
revoke all on public.affiliate_leads_view from public, anon;
grant select on public.affiliate_leads_view to authenticated;
