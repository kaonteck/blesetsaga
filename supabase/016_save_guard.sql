-- 016 · 부정 방지 1단계: 세이브 검사 (5단계 · 서버 검증)
-- 게임은 상태 전체(S)를 saves에 덮어쓴다. 브라우저에서 S를 고치면 레벨·골드를 마음대로 올릴 수 있었다.
-- 진행 자체를 서버로 옮기기 전까지, 서버가 "직전 서버 값"과 비교해서 말이 안 되는 변화만 막는다.
--
--  1) saves.guard(새 열, 유저는 못 씀)에 검사 상태를 둔다: 마지막 검사 시각 · 레벨 예산 · 골드 예산 · 보정 번호 · 의심 기록.
--  2) 유저가 직접 올린 세이브(current_user = authenticated)만 검사한다.
--     서버 함수(우편 보내기·행운권·운영 레벨 조정 등, security definer)가 고친 값은 그대로 믿는다.
--     - 레벨: 1~99 정수, 내려가지 않음(예전 기기의 늦은 저장이 레벨을 되돌리지 못함).
--       오르는 양은 예산 안에서만 — 1분에 1레벨씩 차고 최대 10레벨까지 모임(실제 최고 속도는 초반 약 0.7레벨/분).
--     - 경험치: 0 이상(레벨이 깎이면 0).
--     - 골드: 0~99,999,999. 늘어나는 양은 예산 안에서만 — 1분에 3,000골드씩 차고 최대 100,000까지 모임
--       + 그 사이 서버에서 받은 우편 선물 골드(mail.claimed_at)는 따로 더해 줌(운영 우편·낚시 상금 등).
--       참고(실측): 필드 1판 최대 약 400골드, 던전 ×4, 장비 1개 최대 판매가 약 2,300골드, 8시간 자동 사냥 약 2만 골드.
--     - 인벤토리: 개수는 0~9,999 정수(게임 화면에는 다시 받아 오지 않음 — 넘친 개수만 서버에서 잘림).
--     - adminRev(운영 레벨 조정 번호)는 유저가 못 올림(010의 되돌리기 방지를 우회하지 못하게).
--     예산을 넘으면 값은 허용치까지만 남기고, guard.flags에 기록(운영 페이지 '부정 의심' 탭), guard.rev를 올린다.
--     게임은 저장 응답의 guard.rev가 자기 것보다 크면 서버의 레벨·경험치·골드를 받아 맞춘다(08-server.js `grdApply`).
--  3) 공개 프로필 레벨은 세이브 레벨을 따른다(다른 유저에게 보이는 레벨을 따로 부풀리지 못하게).
--  4) 행운권 구매는 서버에서도 LV10 이상(카지노 입장 레벨)만.

-- ── 1) 검사 상태 열 · 권한 ──
alter table public.saves add column if not exists guard jsonb not null default '{}'::jsonb;
revoke insert, update on public.saves from authenticated;
grant insert (user_id, data, updated_at), update (user_id, data, updated_at) on public.saves to authenticated;

-- ── 2) 세이브 검사 ──
-- security definer가 아님: 누가 쓰는지(current_user)를 봐야 한다. 유저 권한으로 도는 동안 읽는 것은 내 세이브·내 우편뿐.
create or replace function private.saves_guard()
returns trigger language plpgsql set search_path = '' as $$
declare
  t   numeric := extract(epoch from now());
  g   jsonb;
  at  numeric; dtm numeric; lvb numeric; gdb numeric; cred numeric := 0;
  om  jsonb; nm jsonb;
  ol  int; nl int; req_l numeric; og numeric; ng numeric; req_g numeric; ex numeric;
  fixed boolean := false; fl jsonb := '[]'::jsonb;
  inv jsonb; k text; v jsonb; c numeric; inv_bad boolean := false;
begin
  if current_user <> 'authenticated' then return new; end if;   -- 서버 함수가 고친 값
  -- upsert는 먼저 INSERT 검사를 거친다: 이미 내 세이브가 있으면 아래 UPDATE 검사에 맡긴다
  if tg_op = 'INSERT' and exists (select 1 from public.saves s where s.user_id = new.user_id) then return new; end if;

  g  := case when tg_op = 'UPDATE' then coalesce(old.guard, '{}'::jsonb) else '{}'::jsonb end;
  om := case when tg_op = 'UPDATE' and jsonb_typeof(old.data->'me') = 'object' then old.data->'me' else '{}'::jsonb end;
  nm := new.data->'me';
  if nm is null or jsonb_typeof(nm) <> 'object' then
    -- 캐릭터가 아직 없는 저장(만들기 화면). 예전 캐릭터가 있었다면 지우지 못하게 그대로 둔다
    if om <> '{}'::jsonb then new.data := jsonb_set(new.data, '{me}', om); end if;
    return new;
  end if;

  -- 예산: 처음 검사하는 기존 세이브는 가득 찬 예산부터(정상 유저가 첫 저장에서 깎이지 않게)
  at  := coalesce((g->>'at')::numeric, t);
  dtm := greatest(0, (t - at) / 60);
  lvb := least(10, coalesce((g->>'lv')::numeric, 10) + dtm);
  gdb := least(100000, coalesce((g->>'gd')::numeric, 100000) + dtm * 3000);
  if tg_op = 'UPDATE' then
    select coalesce(sum(m.gold), 0) into cred from public.mail m
     where m.recipient = new.user_id and m.claimed_at is not null and m.claimed_at > to_timestamp(at);
    gdb := gdb + cred;
  end if;

  -- 레벨
  ol := greatest(1, least(99, coalesce(case when jsonb_typeof(om->'level') = 'number' then round((om->>'level')::numeric)::int end, 1)));
  req_l := case when jsonb_typeof(nm->'level') = 'number' then round((nm->>'level')::numeric) else ol end;
  nl := greatest(1, least(99, req_l))::int;
  if nl < ol then nl := ol; end if;                               -- 레벨은 내려가지 않음(늦게 도착한 예전 저장)
  if nl - ol > floor(lvb) then
    fl := fl || jsonb_build_object('at', t, 'k', 'level', 'from', ol, 'to', req_l, 'ok', ol + floor(lvb));
    nl := ol + floor(lvb)::int;
    nm := jsonb_set(nm, '{exp}', '0'::jsonb);
  end if;
  lvb := lvb - (nl - ol);
  if req_l is distinct from nl::numeric then fixed := true; nm := jsonb_set(nm, '{level}', to_jsonb(nl)); end if;

  -- 경험치
  ex := case when jsonb_typeof(nm->'exp') = 'number' then (nm->>'exp')::numeric else 0 end;
  if jsonb_typeof(nm->'exp') = 'number' and (ex < 0 or ex > 1000000000) then
    nm := jsonb_set(nm, '{exp}', to_jsonb(greatest(0, least(1000000000, ex)))); fixed := true;
  end if;

  -- 골드
  og := greatest(0, coalesce(case when jsonb_typeof(om->'gold') = 'number' then (om->>'gold')::numeric end, 0));
  req_g := case when jsonb_typeof(nm->'gold') = 'number' then (nm->>'gold')::numeric else og end;
  ng := greatest(0, least(99999999, round(req_g)));
  if ng - og > floor(gdb) then
    fl := fl || jsonb_build_object('at', t, 'k', 'gold', 'from', og, 'to', req_g, 'ok', og + floor(gdb));
    ng := og + floor(gdb);
  elsif req_g > 99999999 then
    fl := fl || jsonb_build_object('at', t, 'k', 'gold', 'from', og, 'to', req_g, 'ok', ng);
  end if;
  gdb := gdb - greatest(0, ng - og);
  if round(req_g) is distinct from ng then fixed := true; end if;   -- 소수점 반올림만으로는 보정 알림 안 함
  if req_g is distinct from ng then nm := jsonb_set(nm, '{gold}', to_jsonb(ng)); end if;

  -- 인벤토리 개수
  if jsonb_typeof(nm->'inv') = 'object' then
    inv := '{}'::jsonb;
    for k, v in select * from jsonb_each(nm->'inv') loop
      c := case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric else 0 end;
      if c > 9999 then inv_bad := true; end if;
      inv := inv || jsonb_build_object(k, greatest(0, least(9999, round(c))));
    end loop;
    if inv_bad then fl := fl || jsonb_build_object('at', t, 'k', 'inv', 'ok', 9999); end if;
    nm := jsonb_set(nm, '{inv}', inv);
  end if;

  new.data := jsonb_set(new.data, '{me}', nm);
  -- 운영 조정 번호는 유저가 못 바꿈
  if tg_op = 'UPDATE' and (new.data->'adminRev') is distinct from (old.data->'adminRev') then
    new.data := case when old.data ? 'adminRev' then new.data || jsonb_build_object('adminRev', old.data->'adminRev') else new.data - 'adminRev' end;
  elsif tg_op = 'INSERT' then
    new.data := new.data - 'adminRev';
  end if;

  new.guard := jsonb_build_object(
    'at', t, 'lv', round(lvb, 3), 'gd', floor(gdb),
    'rev', coalesce((g->>'rev')::int, 0) + case when fixed then 1 else 0 end,
    'flags', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
               select x from jsonb_array_elements(fl || coalesce(g->'flags', '[]'::jsonb)) x limit 30) s));
  return new;
end $$;
revoke execute on function private.saves_guard() from public, anon, authenticated;
-- 010의 saves_keep_admin(운영 레벨 유지)보다 뒤에 돈다(트리거는 이름 순)
drop trigger if exists saves_zguard on public.saves;
create trigger saves_zguard before insert or update on public.saves for each row execute function private.saves_guard();

-- ── 3) 공개 프로필 레벨 = 세이브 레벨 ──
create or replace function private.profiles_level()
returns trigger language plpgsql set search_path = '' as $$
declare l int;
begin
  if current_user <> 'authenticated' then return new; end if;
  select greatest(1, least(99, round((s.data->'me'->>'level')::numeric)))::int into l
    from public.saves s where s.user_id = new.user_id and jsonb_typeof(s.data->'me'->'level') = 'number';
  new.level := coalesce(l, 1);
  return new;
end $$;
revoke execute on function private.profiles_level() from public, anon, authenticated;
drop trigger if exists profiles_level on public.profiles;
create trigger profiles_level before insert or update of level on public.profiles for each row execute function private.profiles_level();

-- ── 운영: 부정 의심 목록 · 지우기 ──
create or replace function public.admin_save_flags()
returns table (user_id uuid, name text, username text, level int, gold numeric, last_at timestamptz, n int, flags jsonb)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  return query
    select s.user_id, p.name, p.username,
           (s.data->'me'->>'level')::numeric::int, (s.data->'me'->>'gold')::numeric,
           to_timestamp((s.guard->'flags'->0->>'at')::numeric), jsonb_array_length(s.guard->'flags'), s.guard->'flags'
      from public.saves s left join public.profiles p on p.user_id = s.user_id
     where jsonb_array_length(coalesce(s.guard->'flags', '[]'::jsonb)) > 0
     order by (s.guard->'flags'->0->>'at')::numeric desc;
end $$;
revoke execute on function public.admin_save_flags() from public, anon;
grant execute on function public.admin_save_flags() to authenticated;

create or replace function public.admin_clear_flags(p_user uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  update public.saves set guard = jsonb_set(guard, '{flags}', '[]'::jsonb) where user_id = p_user;
  perform private.alog('clear_flags', p_user::text, '{}'::jsonb);
end $$;
revoke execute on function public.admin_clear_flags(uuid) from public, anon;
grant execute on function public.admin_clear_flags(uuid) to authenticated;

-- ── 4) 행운권: 서버에서도 LV10 이상 ── (008과 같고 레벨 확인만 추가) 오류에 LOW_LEVEL 추가
create or replace function public.buy_lotto(p_nums int[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); nx record; nums smallint[]; d jsonb; n int; tid uuid;
  price constant int := 200; max_per_week constant int := 2; min_level constant int := 10;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select array_agg(x::smallint order by x) into nums from (select distinct unnest(p_nums) x) s;
  if nums is null or cardinality(nums) <> 4 or cardinality(p_nums) <> 4 or not (0 <= all(nums) and 9 >= all(nums)) then raise exception 'BAD_NUMS'; end if;
  select * into nx from private.lotto_next(private.lotto_clock());
  if private.lotto_clock() >= nx.close_at then raise exception 'SALE_CLOSED'; end if;
  select data into d from public.saves where user_id = me for update;
  if d is null or d->'me' is null then raise exception 'NO_SAVE'; end if;
  if coalesce((d->'me'->>'level')::numeric, 1) < min_level then raise exception 'LOW_LEVEL'; end if;
  select count(*) into n from public.lotto_tickets where user_id = me and draw_key = nx.draw_key;
  if n >= max_per_week then raise exception 'MAX_TICKETS'; end if;
  if coalesce((d->'me'->>'gold')::numeric, 0) < price then raise exception 'NOT_ENOUGH_GOLD'; end if;
  update public.saves set data = jsonb_set(d, '{me,gold}', to_jsonb(coalesce((d->'me'->>'gold')::numeric, 0) - price)), updated_at = now()
   where user_id = me;
  insert into public.lotto_draws (draw_key, draw_at) values (nx.draw_key, nx.draw_at) on conflict (draw_key) do nothing;
  insert into public.lotto_tickets (user_id, draw_key, nums) values (me, nx.draw_key, nums) returning id into tid;
  return jsonb_build_object('id', tid, 'draw', nx.draw_key, 'at', nx.draw_at, 'nums', nums, 'price', price);
end $$;
