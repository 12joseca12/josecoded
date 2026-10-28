-- Task 1.8 (DT §6.2). Blog comments with moderation.
create table public.blog_comments (
  id          uuid primary key default gen_random_uuid(),
  slug        text not null,
  locale      text not null check (locale in ('es','en')),
  user_id     uuid not null references auth.users(id) on delete cascade,
  parent_id   uuid references public.blog_comments(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 2000),
  status      text not null default 'pending' check (status in ('pending','approved','rejected')),
  author_name text not null,             -- snapshot of the public name at comment time
  created_at  timestamptz not null default now(),
  moderated_at timestamptz,
  moderated_by uuid references auth.users(id) on delete set null
);
create index idx_blog_comments_slug_status on public.blog_comments (slug, locale, status, created_at);
create index idx_blog_comments_user on public.blog_comments (user_id);
create index idx_blog_comments_parent on public.blog_comments (parent_id) where parent_id is not null;
create index idx_blog_comments_moderated_by on public.blog_comments (moderated_by) where moderated_by is not null;
create index idx_blog_comments_pending on public.blog_comments (created_at) where status = 'pending';
alter table public.blog_comments enable row level security;
grant select on public.blog_comments to anon, authenticated;
grant insert, update on public.blog_comments to authenticated;
grant delete on public.blog_comments to authenticated;
-- Deviation from DT §6.2: the single "approved or own or admin" policy for anon+authenticated made anon evaluate
-- private.staff_role_of(), which anon cannot execute (permission denied as soon as a non-approved row is reached).
-- Split in two: anon only needs the approved branch.
create policy "comments read approved" on public.blog_comments for select to anon, authenticated
  using (status = 'approved');
create policy "comments read own or admin" on public.blog_comments for select to authenticated
  using (user_id = (select auth.uid()) or private.staff_role_of((select auth.uid())) = 'admin');
-- Deviation from DT §6.2: the parent check queried blog_comments from inside its own policy, which Postgres rejects
-- ("infinite recursion detected in policy"). A security definer helper does the lookup outside RLS.
create or replace function private.comment_parent_ok(p_parent uuid, p_slug text)
returns boolean language sql security definer set search_path = public, pg_temp stable as $$
  select p_parent is null
      or exists (select 1 from public.blog_comments p where p.id = p_parent and p.status = 'approved' and p.slug = p_slug)
$$;
revoke all on function private.comment_parent_ok(uuid, text) from public, anon, authenticated;
grant execute on function private.comment_parent_ok(uuid, text) to authenticated;
create policy "comments insert own pending" on public.blog_comments for insert to authenticated
  with check (user_id = (select auth.uid()) and status = 'pending' and private.comment_parent_ok(parent_id, slug));
create policy "comments admin update" on public.blog_comments for update to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin') with check (private.staff_role_of((select auth.uid())) = 'admin');
create policy "comments admin delete" on public.blog_comments for delete to authenticated
  using (private.staff_role_of((select auth.uid())) = 'admin');
