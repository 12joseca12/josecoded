-- Minimal emulation of what a Supabase database already has before our migrations run.
-- ONLY for validating migrations + seed on a throwaway vanilla Postgres (cloud sessions without Docker images; see
-- supabase/test/pg/run.sh). Supabase local (`supabase start && supabase db reset`) is the real reference: when this
-- shim and Supabase disagree, Supabase wins and this file is fixed. It carries just what the migrations and the seed
-- touch; it is not a copy of the platform schema.
--
-- Differences worth knowing: here `postgres` is a superuser and owns `auth` and `storage` (on Supabase they belong to
-- supabase_auth_admin / supabase_storage_admin); auth.users and storage.objects have only the columns we use.

-- Roles of the Data API. service_role bypasses RLS like on the platform.
create role anon nologin noinherit;
create role authenticated nologin noinherit;
create role service_role nologin noinherit bypassrls;
create role authenticator login noinherit;
grant anon, authenticated, service_role to authenticator;
create role supabase_admin nologin;
create role supabase_auth_admin nologin noinherit;
create role supabase_storage_admin nologin noinherit;

-- Platform defaults for public: usage for the API roles, and everything postgres creates there is granted to them
-- (this is what migration 0 revokes for anon/authenticated, DATOS P1).
grant usage on schema public to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges for role postgres in schema public grant all on functions to anon, authenticated, service_role;

-- extensions schema with pgcrypto (Supabase ships it; the seed uses extensions.crypt/gen_salt).
create schema extensions;
grant usage on schema extensions to anon, authenticated, service_role;
create extension pgcrypto with schema extensions;
alter database postgres set search_path = "$user", public, extensions;

-- auth
create schema auth;
grant usage on schema auth to anon, authenticated, service_role;

create table auth.users (
  instance_id            uuid,
  id                     uuid primary key,
  aud                    varchar(255),
  role                   varchar(255),
  email                  varchar(255),
  encrypted_password     varchar(255),
  email_confirmed_at     timestamptz,
  raw_app_meta_data      jsonb,
  raw_user_meta_data     jsonb,
  created_at             timestamptz,
  updated_at             timestamptz,
  confirmation_token     varchar(255),
  recovery_token         varchar(255),
  email_change           varchar(255),
  email_change_token_new varchar(255),
  is_anonymous           boolean not null default false
);

create table auth.identities (
  id              uuid primary key default gen_random_uuid(),
  provider_id     text not null,
  user_id         uuid not null references auth.users (id) on delete cascade,
  identity_data   jsonb not null,
  provider        text not null,
  last_sign_in_at timestamptz,
  created_at      timestamptz,
  updated_at      timestamptz,
  email           text generated always as (lower(identity_data ->> 'email')) stored,
  unique (provider_id, provider)
);

-- Same resolution order as Supabase: the legacy per-claim GUC first, then the claims JSON that PostgREST sets.
create function auth.uid() returns uuid language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.sub', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'sub')
  )::uuid
$$;
create function auth.role() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.role', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'role')
  )::text
$$;
create function auth.email() returns text language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim.email', true), ''),
    (nullif(current_setting('request.jwt.claims', true), '')::jsonb ->> 'email')
  )::text
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(
    nullif(current_setting('request.jwt.claim', true), ''),
    nullif(current_setting('request.jwt.claims', true), '')
  )::jsonb
$$;
grant execute on function auth.uid(), auth.role(), auth.email(), auth.jwt() to anon, authenticated, service_role;

-- storage (bucket and object policies arrive with 1.8a, DATOS §8.3)
create schema storage;
grant usage on schema storage to anon, authenticated, service_role;

create table storage.buckets (
  id                 text primary key,
  name               text not null unique,
  owner              uuid,
  public             boolean not null default false,
  file_size_limit    bigint,
  allowed_mime_types text[],
  created_at         timestamptz default now(),
  updated_at         timestamptz default now()
);

create table storage.objects (
  id               uuid primary key default gen_random_uuid(),
  bucket_id        text references storage.buckets (id),
  name             text,
  owner            uuid,
  owner_id         text,
  metadata         jsonb,
  user_metadata    jsonb,
  version          text,
  path_tokens      text[] generated always as (string_to_array(name, '/')) stored,
  created_at       timestamptz default now(),
  updated_at       timestamptz default now(),
  last_accessed_at timestamptz default now()
);
alter table storage.buckets enable row level security;
alter table storage.objects enable row level security;
grant all on storage.buckets, storage.objects to anon, authenticated, service_role;

-- 'clients/<id>/<file>' -> {clients, <id>}, like storage.foldername() on the platform.
create function storage.foldername(name text) returns text[] language plpgsql immutable as $$
declare _parts text[];
begin
  select string_to_array(name, '/') into _parts;
  return _parts[1:array_length(_parts, 1) - 1];
end $$;
grant execute on function storage.foldername(text) to anon, authenticated, service_role;

-- Realtime publication (1.8b adds public.chat_messages).
create publication supabase_realtime;
