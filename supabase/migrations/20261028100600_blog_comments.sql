-- Task 1.8a (plan v3.2; DATOS v1.1 §4.5, §5, §6, §7). Blog comments with moderation (D10), recycled from
-- 20260917100200_blog_comments.sql: post_slug, comment_status, private.comment_parent_ok(), outbox comment.pending.
-- The only table anon can read (approved rows, public columns only).

create type public.comment_status as enum ('pending', 'approved', 'rejected');

create table public.blog_comments (
  id           uuid primary key default gen_random_uuid(),
  post_slug    text not null,
  locale       public.locale not null,
  user_id      uuid not null references auth.users (id) on delete cascade,
  parent_id    uuid references public.blog_comments (id) on delete set null,
  author_name  text not null check (btrim(author_name) <> ''),  -- snapshot of the public name at comment time
  body         text not null check (char_length(body) between 1 and 4000),
  status       public.comment_status not null default 'pending',
  moderated_at timestamptz,
  moderated_by uuid references auth.users (id) on delete set null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
alter table public.blog_comments enable row level security;
create index idx_blog_comments_post on public.blog_comments (post_slug, locale, created_at) where status = 'approved';
create index idx_blog_comments_user on public.blog_comments (user_id);
create index idx_blog_comments_parent on public.blog_comments (parent_id);
create index idx_blog_comments_moderated_by on public.blog_comments (moderated_by);
create index idx_blog_comments_pending on public.blog_comments (status, created_at) where status = 'pending';  -- C11
create trigger blog_comments_set_updated_at before update on public.blog_comments
  for each row execute function private.set_updated_at();

-- The parent must be approved and belong to the same post and locale. A security definer lookup: querying
-- blog_comments from its own policy would recurse.
create or replace function private.comment_parent_ok(p_parent_id uuid, p_post_slug text, p_locale public.locale)
returns boolean language sql stable security definer set search_path = '' as $$
  select p_parent_id is null
      or exists (select 1 from public.blog_comments p
                 where p.id = p_parent_id and p.status = 'approved' and p.post_slug = p_post_slug and p.locale = p_locale)
$$;
revoke all on function private.comment_parent_ok(uuid, text, public.locale) from public, anon, authenticated;
grant execute on function private.comment_parent_ok(uuid, text, public.locale) to authenticated;

-- anon has its own select policy so it never evaluates the authenticated branch (which calls helpers it cannot run).
create policy blog_comments_select_anon on public.blog_comments for select to anon using (status = 'approved');
create policy blog_comments_select on public.blog_comments for select to authenticated
  using (status = 'approved' or user_id = (select auth.uid()) or (select private.is_admin()));
create policy blog_comments_insert on public.blog_comments for insert to authenticated
  with check ((user_id = (select auth.uid()) and status = 'pending' and moderated_at is null and moderated_by is null
               and private.comment_parent_ok(parent_id, post_slug, locale))
              or (select private.is_admin()));
create policy blog_comments_update on public.blog_comments for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy blog_comments_delete on public.blog_comments for delete to authenticated using ((select private.is_admin()));
-- anon reads the public columns only (no user_id nor moderation data).
grant select (id, post_slug, locale, parent_id, author_name, body, status, created_at) on public.blog_comments to anon;
grant select, insert, update, delete on public.blog_comments to authenticated;

-- Jose hears about new pending comments by Telegram through the outbox.
create or replace function private.blog_comments_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue('comment.pending', jsonb_build_object(
    'id', new.id, 'post_slug', new.post_slug, 'locale', new.locale, 'author_name', new.author_name));
  return null;
end $$;
revoke all on function private.blog_comments_after_insert() from public, anon, authenticated;
create trigger blog_comments_after_insert after insert on public.blog_comments
  for each row when (new.status = 'pending') execute function private.blog_comments_after_insert();
