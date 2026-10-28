-- Task 1.8a (plan v3.2; DATOS v1.1 §4.4, §5, §8.3). Client material (A4): rows in client_assets, files in the private
-- bucket client-assets under clients/<client_id>/<asset id>. The web creates the row first and then uploads with
-- uploadToSignedUrl; on delete it removes the object first and then the row. Downloads use 60 s signed URLs.

create table public.client_assets (
  id                  uuid primary key default gen_random_uuid(),
  client_id           uuid not null references public.clients (id) on delete cascade,
  uploaded_by_user_id uuid references auth.users (id) on delete set null,
  source              public.asset_source not null,
  storage_path        text not null unique,
  file_name           text,
  mime_type           text,
  size_bytes          bigint check (size_bytes >= 0),
  title               text,
  description         text,
  created_at          timestamptz not null default now(),
  constraint client_assets_path check (storage_path = 'clients/' || client_id::text || '/' || id::text)
);
alter table public.client_assets enable row level security;
create index idx_client_assets_client on public.client_assets (client_id);
create index idx_client_assets_uploaded_by on public.client_assets (uploaded_by_user_id);

create policy client_assets_select on public.client_assets for select to authenticated
  using (client_id = (select private.client_id_of()) or (select private.is_admin()));
create policy client_assets_insert on public.client_assets for insert to authenticated
  with check ((client_id = (select private.client_id_of()) and source = 'client'
               and uploaded_by_user_id = (select auth.uid()))
              or (select private.is_admin()));
-- No update for clients: a wrong file is deleted and uploaded again.
create policy client_assets_update on public.client_assets for update to authenticated
  using ((select private.is_admin())) with check ((select private.is_admin()));
create policy client_assets_delete on public.client_assets for delete to authenticated
  using ((client_id = (select private.client_id_of()) and source = 'client'
          and uploaded_by_user_id = (select auth.uid()))
         or (select private.is_admin()));
grant select, insert, update, delete on public.client_assets to authenticated;

-- Jose hears about client uploads through the outbox (admin uploads need no notice).
create or replace function private.client_assets_after_insert() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform private.enqueue('asset.uploaded', jsonb_build_object(
    'id', new.id, 'client_id', new.client_id, 'file_name', new.file_name, 'size_bytes', new.size_bytes));
  return null;
end $$;
revoke all on function private.client_assets_after_insert() from public, anon, authenticated;
create trigger client_assets_after_insert after insert on public.client_assets
  for each row when (new.source = 'client') execute function private.client_assets_after_insert();

-- Bucket: private, 25 MiB, raster images, PDF, text, CSV, zip and Office documents. Explicit allowlist, never
-- image/*: an SVG can carry script and would run on any page that serves it inline.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('client-assets', 'client-assets', false, 26214400, array[
  'image/png', 'image/jpeg', 'image/webp', 'image/avif', 'image/gif', 'application/pdf', 'text/plain', 'text/csv', 'application/zip',
  'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
])
on conflict (id) do nothing;

-- Objects (DATOS §8.3): a client reaches only clients/<their client id>/…; the folder is compared as text so a
-- malformed name never raises a cast error. Insert also needs the client_assets row with that exact path (RLS of
-- client_assets applies inside the subquery). Delete, for a client, only their own uploads. No update policy.
create policy client_assets_objects_select on storage.objects for select to authenticated
  using (bucket_id = 'client-assets' and (
    (select private.is_admin())
    or ((storage.foldername(name))[1] = 'clients'
        and (storage.foldername(name))[2] = (select private.client_id_of())::text)));
create policy client_assets_objects_insert on storage.objects for insert to authenticated
  with check (bucket_id = 'client-assets'
    and exists (select 1 from public.client_assets a where a.storage_path = objects.name)
    and ((select private.is_admin())
         or ((storage.foldername(name))[1] = 'clients'
             and (storage.foldername(name))[2] = (select private.client_id_of())::text)));
create policy client_assets_objects_delete on storage.objects for delete to authenticated
  using (bucket_id = 'client-assets' and (
    (select private.is_admin())
    or ((storage.foldername(name))[1] = 'clients'
        and (storage.foldername(name))[2] = (select private.client_id_of())::text
        and exists (select 1 from public.client_assets a
                    where a.storage_path = objects.name and a.source = 'client'
                      and a.uploaded_by_user_id = (select auth.uid())))));
