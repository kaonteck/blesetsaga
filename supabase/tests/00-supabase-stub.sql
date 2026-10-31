do $$ begin create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls; create role supabase_auth_admin nologin; exception when duplicate_object then null; end $$;
create schema extensions; create extension pgcrypto schema extensions;
create schema auth;
create table auth.users (instance_id uuid, id uuid primary key, aud text, role text, email text, encrypted_password text,
  email_confirmed_at timestamptz, raw_app_meta_data jsonb default '{}', raw_user_meta_data jsonb default '{}',
  created_at timestamptz default now(), updated_at timestamptz, last_sign_in_at timestamptz,
  confirmation_token text, recovery_token text, email_change_token_new text, email_change text);
create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('request.jwt.claims', true),''),'{}')::jsonb $$;
create function auth.uid() returns uuid language sql stable as $$ select nullif(auth.jwt()->>'sub','')::uuid $$;
grant usage on schema auth, extensions to anon, authenticated;
grant execute on all functions in schema auth to anon, authenticated;
create schema storage;
create table storage.buckets (id text primary key, name text, public bool, file_size_limit bigint, allowed_mime_types text[]);
create table storage.objects (id uuid default gen_random_uuid() primary key, bucket_id text, name text, owner uuid);
alter table storage.objects enable row level security;
create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name,'/'))[1:array_length(string_to_array(name,'/'),1)-1] $$;
grant usage on schema storage to authenticated; grant select, insert, delete on storage.objects to authenticated;
create publication supabase_realtime;
grant usage on schema public to anon, authenticated;
