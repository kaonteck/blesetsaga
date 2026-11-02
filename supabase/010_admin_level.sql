-- 010 · 운영: 유저 레벨 조정 (임시 운영 도구)
-- 게임은 상태 전체(S)를 몇 초마다 saves에 덮어쓴다. 그래서 운영자가 세이브의 레벨만 바꾸면
-- 접속 중인 유저의 다음 저장이 예전 레벨로 되돌려 버린다. 이렇게 막는다.
--  1) admin_set_level: 세이브의 me.level·me.exp(0)를 바꾸고 data.adminRev(운영 조정 번호)를 1 올린다.
--     savedAt도 지금으로 올려서, 다음 로그인 때 이 기기·다른 기기의 예전 로컬 세이브보다 서버 세이브가 이긴다.
--  2) saves BEFORE UPDATE 트리거: 들어오는 세이브의 adminRev가 서버보다 작으면(= 조정을 아직 못 본 게임이 올린 것)
--     레벨·경험치·adminRev만 서버 값으로 유지한다. 나머지 진행은 게임이 올린 그대로.
--  3) 게임(08-server.js)은 저장 응답의 adminRev가 자기 것보다 크면 서버의 레벨·경험치를 받아 화면에 반영한다.
-- 클래스(전직)는 바꾸지 않는다. LV20 아래로 내려도 상위 클래스는 그대로 유지된다.

create or replace function public.admin_set_level(p_user uuid, p_level int, p_reason text default null)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare d jsonb; before int; rev int;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_level is null or p_level < 1 or p_level > 99 then raise exception 'BAD_LEVEL'; end if;
  select data into d from public.saves where user_id = p_user for update;
  if d is null or d->'me' is null then raise exception 'NO_SAVE'; end if;
  before := coalesce((d->'me'->>'level')::int, 1);
  rev := coalesce((d->>'adminRev')::int, 0) + 1;
  d := jsonb_set(d, '{me,level}', to_jsonb(p_level));
  d := jsonb_set(d, '{me,exp}', to_jsonb(0));
  d := d || jsonb_build_object('adminRev', rev, 'savedAt', (extract(epoch from now()) * 1000)::bigint);
  -- 트리거가 이 변경을 "예전 값"으로 오해하지 않도록 adminRev가 커지는 쪽이라 그대로 통과한다
  update public.saves set data = d, updated_at = now() where user_id = p_user;
  update public.profiles set level = p_level where user_id = p_user;
  perform private.alog('set_level', p_user::text, jsonb_build_object('before', before, 'after', p_level, 'reason', p_reason));
  return jsonb_build_object('before', before, 'after', p_level, 'rev', rev);
end $$;
revoke execute on function public.admin_set_level(uuid, int, text) from public, anon;
grant execute on function public.admin_set_level(uuid, int, text) to authenticated;

create or replace function private.saves_keep_admin()
returns trigger language plpgsql security definer set search_path = '' as $$
declare o int := coalesce((old.data->>'adminRev')::int, 0); n int := coalesce((new.data->>'adminRev')::int, 0);
begin
  if o > n and new.data->'me' is not null and old.data->'me' is not null then
    new.data := jsonb_set(jsonb_set(new.data, '{me,level}', coalesce(old.data->'me'->'level', '1'::jsonb)),
                          '{me,exp}', coalesce(old.data->'me'->'exp', '0'::jsonb))
                || jsonb_build_object('adminRev', o);
  end if;
  return new;
end $$;
revoke execute on function private.saves_keep_admin() from public, anon, authenticated;
drop trigger if exists saves_keep_admin on public.saves;
create trigger saves_keep_admin before update on public.saves for each row execute function private.saves_keep_admin();
