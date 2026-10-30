-- 1) 사이트 가입(Auth 서버) 외의 경로(SQL Editor 등)로 만드는 계정은 초대코드 검사를 건너뛴다.
create or replace function private.check_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c text := upper(trim(coalesce(new.raw_user_meta_data->>'invite', '')));
begin
  if session_user <> 'supabase_auth_admin' then return new; end if;  -- 사이트 가입만 검사
  update private.invite_codes set uses = uses + 1
   where code = c and (max_uses is null or uses < max_uses);
  if not found then raise exception 'INVALID_INVITE'; end if;
  return new;
end $$;

-- 2) 운영자 계정 만들기: 아이디와 비밀번호만 바꿔서 실행
do $$
declare
  uid uuid := gen_random_uuid();
  login_id text := 'admin';              -- 아이디
  pw text := '여기에_비밀번호';           -- 비밀번호
  em text := login_id || '@blesetsaga.vercel.app';
begin
  insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
    raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
    confirmation_token, recovery_token, email_change_token_new, email_change)
  values ('00000000-0000-0000-0000-000000000000', uid, 'authenticated', 'authenticated', em,
    extensions.crypt(pw, extensions.gen_salt('bf')), now(),
    '{"provider":"email","providers":["email"],"role":"admin"}', jsonb_build_object('username', login_id),
    now(), now(), '', '', '', '');
  insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
  values (gen_random_uuid(), uid, uid::text,
    jsonb_build_object('sub', uid::text, 'email', em, 'email_verified', true), 'email', now(), now(), now());
end $$;

-- (참고) 이미 있는 계정을 운영자로 올리기 / 내리기 — 다시 로그인해야 반영
-- update auth.users set raw_app_meta_data = raw_app_meta_data || '{"role":"admin"}' where email = 'kim@blesetsaga.vercel.app';
-- update auth.users set raw_app_meta_data = raw_app_meta_data - 'role' where email = 'kim@blesetsaga.vercel.app';

-- 3) 권한 정리 (2026-10-31 적용됨)
revoke execute on function public.rls_auto_enable() from anon, authenticated, public;
revoke all on public.saves from anon;
revoke truncate, references, trigger, delete on public.saves from authenticated;
revoke all on schema private from anon, authenticated;
