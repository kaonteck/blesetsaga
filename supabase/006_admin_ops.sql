-- 006 · 운영 도구 (운영 페이지에서 부르는 함수들) + 피드 사진 저장소
-- 모든 함수는 첫 줄에서 운영자인지 확인하고, 한 일을 admin_log 에 남긴다.

-- ── 운영 기록 ───────────────────────────────────────────────
create table if not exists public.admin_log (
  id          bigint generated always as identity primary key,
  admin       uuid references auth.users(id) on delete set null,
  action      text not null,          -- send_mail · ban · unban · invite_create · invite_delete · ...
  target      text,                   -- 대상 (유저 id, 코드 등)
  detail      jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists admin_log_recent on public.admin_log (id desc);
alter table public.admin_log enable row level security;
revoke all on public.admin_log from anon, authenticated;
grant select on public.admin_log to authenticated;
create policy "admin_log: 운영자만 읽기" on public.admin_log for select to authenticated using ((select public.is_admin()));

create or replace function private.alog(p_action text, p_target text, p_detail jsonb default '{}'::jsonb)
returns void language sql security definer set search_path = '' as $$
  insert into public.admin_log (admin, action, target, detail) values (auth.uid(), p_action, p_target, coalesce(p_detail, '{}'::jsonb));
$$;

-- ── 회원 목록 ───────────────────────────────────────────────
-- 운영 페이지의 회원 표. 마지막 로그인·마지막 저장 시각까지 한 번에.
create or replace function public.admin_players(p_search text default null, p_limit int default 200)
returns table (
  user_id uuid, username text, name text, job text, level int, status text, last_seen timestamptz,
  banned_until timestamptz, ban_reason text, is_admin boolean, last_sign_in timestamptz,
  saved_at timestamptz, joined_at timestamptz, invite text
) language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query
  select p.user_id, p.username, p.name, p.job, p.level, p.status, p.last_seen,
         p.banned_until, p.ban_reason, coalesce(u.raw_app_meta_data->>'role' = 'admin', false),
         u.last_sign_in_at, s.updated_at, u.created_at, u.raw_user_meta_data->>'invite'
  from public.profiles p
  join auth.users u on u.id = p.user_id
  left join public.saves s on s.user_id = p.user_id
  where p_search is null or p.username ilike '%' || p_search || '%' or p.name ilike '%' || p_search || '%'
  order by p.last_seen desc
  limit greatest(1, least(p_limit, 1000));
end $$;

-- 한 유저의 세이브 전체 보기 (문의 대응·버그 확인용, 읽기 전용)
create or replace function public.admin_player_save(p_user uuid)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare d jsonb;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select data into d from public.saves where user_id = p_user;
  return d;
end $$;

-- ── 정지 / 해제 ─────────────────────────────────────────────
-- p_until = null 이면 해제. 정지 중에는 채팅·피드·귓속말·우편 보내기가 막힌다.
create or replace function public.admin_ban(p_user uuid, p_until timestamptz, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  update public.profiles set banned_until = p_until, ban_reason = case when p_until is null then null else p_reason end
   where user_id = p_user;
  if not found then raise exception 'NO_USER'; end if;
  perform private.alog(case when p_until is null then 'unban' else 'ban' end, p_user::text,
                       jsonb_build_object('until', p_until, 'reason', p_reason));
end $$;

-- ── 운영 우편 (보상·사과·이벤트) ────────────────────────────
-- p_users = null 이면 전체 유저에게. 돌려주는 값 = 보낸 통수.
create or replace function public.admin_send_mail(
  p_users uuid[], p_text text, p_items jsonb default '{}'::jsonb, p_gold int default 0, p_from text default '운영자')
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  insert into public.mail (recipient, sender, sender_name, text, items, gold)
  select p.user_id, null, coalesce(nullif(p_from, ''), '운영자'), p_text, coalesce(p_items, '{}'::jsonb), greatest(0, coalesce(p_gold, 0))
  from public.profiles p
  where p_users is null or p.user_id = any(p_users);
  get diagnostics n = row_count;
  perform private.alog('send_mail', case when p_users is null then 'all' else array_to_string(p_users, ',') end,
                       jsonb_build_object('text', p_text, 'items', p_items, 'gold', p_gold, 'count', n));
  return n;
end $$;

-- ── 초대코드 ────────────────────────────────────────────────
create or replace function public.admin_invites()
returns table (code text, max_uses int, uses int, note text, created_at timestamptz)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query select i.code, i.max_uses, i.uses, i.note, i.created_at from private.invite_codes i order by i.created_at desc;
end $$;

-- p_code 를 비우면 8자리 코드를 만들어 준다. p_max_uses = null 이면 무제한.
create or replace function public.admin_invite_create(p_code text default null, p_max_uses int default 1, p_note text default null)
returns text language plpgsql security definer set search_path = '' as $$
declare c text := upper(trim(coalesce(p_code, '')));
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if c = '' then
    c := upper(substr(translate(encode(extensions.gen_random_bytes(9), 'base64'), '+/0O1Il', 'XYZWKMN'), 1, 8));
  end if;
  if c !~ '^[A-Z0-9_-]{4,32}$' then raise exception 'BAD_CODE'; end if;
  insert into private.invite_codes (code, max_uses, note) values (c, p_max_uses, p_note);
  perform private.alog('invite_create', c, jsonb_build_object('max_uses', p_max_uses, 'note', p_note));
  return c;
end $$;

create or replace function public.admin_invite_delete(p_code text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  delete from private.invite_codes where code = upper(trim(p_code));
  perform private.alog('invite_delete', upper(trim(p_code)));
end $$;

-- ── 운영 함수 실행 권한 ─────────────────────────────────────
do $$
declare f text;
begin
  foreach f in array array[
    'public.admin_players(text,int)', 'public.admin_player_save(uuid)', 'public.admin_ban(uuid,timestamptz,text)',
    'public.admin_send_mail(uuid[],text,jsonb,int,text)', 'public.admin_invites()',
    'public.admin_invite_create(text,int,text)', 'public.admin_invite_delete(text)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke execute on function private.alog(text, text, jsonb) from public, anon, authenticated;

-- ── 피드 사진 저장소 (Storage 'feed' 버킷) ──────────────────
-- 경로 규칙: <user_id>/<파일이름>. 누구나 볼 수 있고, 올리기·지우기는 자기 폴더만. 1장 최대 1MB(720px 압축본 기준 충분).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('feed', 'feed', true, 1048576, array['image/jpeg','image/png','image/webp'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "feed 사진: 내 폴더에 올리기" on storage.objects;
create policy "feed 사진: 내 폴더에 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'feed' and (storage.foldername(name))[1] = (select auth.uid())::text and (select public.is_active()));
drop policy if exists "feed 사진: 내 것·운영자 지우기" on storage.objects;
create policy "feed 사진: 내 것·운영자 지우기" on storage.objects for delete to authenticated
  using (bucket_id = 'feed' and ((storage.foldername(name))[1] = (select auth.uid())::text or (select public.is_admin())));
