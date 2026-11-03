-- 017 · 016 세이브 검사 보완 (체크 보류 요청, 2026-11-04)
--  ① 계정 삭제(설정 › 계정 삭제)가 안 되던 것
--     게임은 캐릭터 없는 상태를 저장해서 삭제하는데, 016이 "캐릭터 없는 저장으로 예전 캐릭터를 지우지 못하게"
--     서버의 예전 캐릭터를 그대로 두고, 새 캐릭터를 만들면 "레벨은 내려가지 않음" 규칙으로 예전 레벨이 붙었다.
--     → 삭제는 서버 함수 reset_my_save()로: 세이브·우편·행운권·낚시 기록을 지우고 공개 프로필 레벨·직업·칭호를 처음으로.
--       게임(08-server.js)은 서버 모드의 '계정 삭제'에서 이 함수를 먼저 부른다.
--  ② 첫 업로드가 잘리던 것
--     서버에 세이브가 없는 계정이 이 기기에서 키운 캐릭터를 처음 올리면, 예전 값이 LV1·0골드로 계산돼 잘렸다.
--     → 계정의 첫 저장(INSERT, 계정마다 한 번뿐 — 유저는 세이브를 지울 수 없음)은 자르지 않고 받는다.
--       아이템 99개·골드 최대치 같은 절대 한도만 적용하고, 값이 크면(LV11 이상 또는 10만 골드 초과) 의심 기록만 남긴다.
--       계정 삭제 뒤의 새 캐릭터는 INSERT가 아니라 UPDATE라서 예산 검사를 그대로 받는다(삭제로 우회 불가).

-- ── ① 계정 삭제 ──
create or replace function public.reset_my_save()
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'NOT_AUTH'; end if;
  -- 보정 번호·의심 기록은 남긴다(삭제로 기록을 지우지 못하게). 예산은 처음처럼 가득.
  update public.saves
     set data = '{}'::jsonb,
         guard = jsonb_build_object('rev', coalesce(guard->'rev', '0'::jsonb), 'flags', coalesce(guard->'flags', '[]'::jsonb)),
         updated_at = now()
   where user_id = me;
  delete from public.mail where recipient = me;
  delete from public.lotto_tickets where user_id = me;
  delete from public.fish_catches where user_id = me;
  update public.profiles set level = 1, job = null, title = null, memo = null where user_id = me;
end $$;
revoke execute on function public.reset_my_save() from public, anon;
grant execute on function public.reset_my_save() to authenticated;

-- ── ② 첫 저장은 자르지 않음 ──
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
  first_save boolean := tg_op = 'INSERT';
begin
  if current_user <> 'authenticated' then return new; end if;   -- 서버 함수가 고친 값
  -- upsert는 먼저 INSERT 검사를 거친다: 이미 내 세이브가 있으면 아래 UPDATE 검사에 맡긴다
  if tg_op = 'INSERT' and exists (select 1 from public.saves s where s.user_id = new.user_id) then return new; end if;

  g  := case when tg_op = 'UPDATE' then coalesce(old.guard, '{}'::jsonb) else '{}'::jsonb end;
  om := case when tg_op = 'UPDATE' and jsonb_typeof(old.data->'me') = 'object' then old.data->'me' else '{}'::jsonb end;
  nm := new.data->'me';
  if nm is null or jsonb_typeof(nm) <> 'object' then
    -- 캐릭터가 없는 저장(만들기 화면). 예전 캐릭터가 있었다면 지우지 못하게 그대로 둔다(삭제는 reset_my_save로)
    if om <> '{}'::jsonb then new.data := jsonb_set(new.data, '{me}', om); end if;
    return new;
  end if;

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
  if first_save then
    if nl > 10 then fl := fl || jsonb_build_object('at', t, 'k', 'first', 'what', 'level', 'to', nl); end if;
  else
    if nl < ol then nl := ol; end if;
    if nl - ol > floor(lvb) then
      fl := fl || jsonb_build_object('at', t, 'k', 'level', 'from', ol, 'to', req_l, 'ok', ol + floor(lvb));
      nl := ol + floor(lvb)::int;
      nm := jsonb_set(nm, '{exp}', '0'::jsonb);
    end if;
    lvb := lvb - (nl - ol);
  end if;
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
  if first_save then
    if ng > 100000 then fl := fl || jsonb_build_object('at', t, 'k', 'first', 'what', 'gold', 'to', ng); end if;
  elsif ng - og > floor(gdb) then
    fl := fl || jsonb_build_object('at', t, 'k', 'gold', 'from', og, 'to', req_g, 'ok', og + floor(gdb));
    ng := og + floor(gdb);
  elsif req_g > 99999999 then
    fl := fl || jsonb_build_object('at', t, 'k', 'gold', 'from', og, 'to', req_g, 'ok', ng);
  end if;
  if not first_save then gdb := gdb - greatest(0, ng - og); end if;
  if round(req_g) is distinct from ng then fixed := true; end if;
  if req_g is distinct from ng then nm := jsonb_set(nm, '{gold}', to_jsonb(ng)); end if;

  -- 인벤토리 개수(첫 저장도 99개까지)
  if jsonb_typeof(nm->'inv') = 'object' then
    inv := '{}'::jsonb;
    for k, v in select * from jsonb_each(nm->'inv') loop
      c := case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric else 0 end;
      if c > 99 then fixed := true; end if;
      if c > 999 then inv_bad := true; end if;
      inv := inv || jsonb_build_object(k, greatest(0, least(99, round(c))));
    end loop;
    if inv_bad then fl := fl || jsonb_build_object('at', t, 'k', 'inv', 'ok', 99); end if;
    nm := jsonb_set(nm, '{inv}', inv);
  end if;

  new.data := jsonb_set(new.data, '{me}', nm);
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
