-- 020: 아이템 99개 상한 해제(유저 요청) — 같은 아이템이 99개를 넘으면 인벤토리에서 칸을 하나 더 써서 1부터 다시 쌓는다(화면 표시).
-- 세이브에는 지금처럼 아이템마다 총 개수 하나만 저장하므로 서버는 99개에서 자르지 않는다.
-- 터무니없는 값만 막는다: 아이템마다 9,999개까지(넘으면 자르고 '아이템 개수' 의심 기록). 018의 아이템 검사(기록만)는 그대로.
-- 018의 private.saves_guard()를 그대로 다시 만들고 인벤토리 부분만 바꿈.

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
  oi  jsonb; ib numeric; icred numeric := 0; gained numeric := 0; o numeric;
  unknown text[] := '{}'; gearhi text[] := '{}'; glvl int;
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
    -- 서버 우편으로 받은 아이템 개수(018 아이템 예산에 따로 더함)
    select coalesce(sum((it.value #>> '{}')::numeric), 0) into icred
      from public.mail m, jsonb_each(m.items) it
     where m.recipient = new.user_id and m.claimed_at is not null and m.claimed_at > to_timestamp(at)
       and jsonb_typeof(it.value) = 'number';
  end if;
  ib := least(150, coalesce((g->>'ib')::numeric, 150) + dtm * 30);

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

  -- 인벤토리 개수(020: 아이템마다 9,999개까지, 첫 저장도 같음)
  oi := case when jsonb_typeof(om->'inv') = 'object' then om->'inv' else '{}'::jsonb end;
  if jsonb_typeof(nm->'inv') = 'object' then
    inv := '{}'::jsonb;
    for k, v in select * from jsonb_each(nm->'inv') loop
      c := case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric else 0 end;
      if c > 9999 then inv_bad := true; fixed := true; end if;
      c := greatest(0, least(9999, round(c)));
      inv := inv || jsonb_build_object(k, c);
      -- 018 아이템 검사(기록만): 늘어난 개수, 새로 생긴 아이템이 게임에 있는지, 레벨보다 너무 높은 장비인지
      o := case when jsonb_typeof(oi->k) = 'number' then greatest(0, (oi->>k)::numeric) else 0 end;
      if c > o then
        gained := gained + (c - o);
        if o = 0 then
          select ic.lvl into glvl from public.item_catalog ic where ic.id = k;
          if not found then
            if not exists (select 1 from public.content ct where ct.kind = 'item' and ct.id = k) then unknown := unknown || k; end if;
          elsif glvl > nl + 15 and not exists (
                  select 1 from public.mail m where m.recipient = new.user_id and m.claimed_at is not null
                     and m.claimed_at > to_timestamp(at) and m.items ? k) then
            gearhi := gearhi || k;
          end if;
        end if;
      end if;
    end loop;
    if inv_bad then fl := fl || jsonb_build_object('at', t, 'k', 'inv', 'ok', 9999); end if;
    nm := jsonb_set(nm, '{inv}', inv);
  end if;
  if cardinality(unknown) > 0 then fl := fl || jsonb_build_object('at', t, 'k', 'item_unknown', 'ids', to_jsonb(unknown[1:5])); end if;
  if cardinality(gearhi) > 0 then fl := fl || jsonb_build_object('at', t, 'k', 'gear', 'ids', to_jsonb(gearhi[1:5]), 'level', nl); end if;
  if not first_save then
    -- 골드를 쓴 만큼(구매) 20골드당 1개씩 더 인정
    ib := ib + icred + floor(greatest(0, og - ng) / 20);
    if gained > ib then fl := fl || jsonb_build_object('at', t, 'k', 'items', 'to', gained, 'ok', floor(ib)); end if;
    ib := least(150, greatest(0, ib - gained));
  end if;

  new.data := jsonb_set(new.data, '{me}', nm);
  if tg_op = 'UPDATE' and (new.data->'adminRev') is distinct from (old.data->'adminRev') then
    new.data := case when old.data ? 'adminRev' then new.data || jsonb_build_object('adminRev', old.data->'adminRev') else new.data - 'adminRev' end;
  elsif tg_op = 'INSERT' then
    new.data := new.data - 'adminRev';
  end if;

  new.guard := jsonb_build_object(
    'at', t, 'lv', round(lvb, 3), 'gd', floor(gdb), 'ib', floor(ib),
    'rev', coalesce((g->>'rev')::int, 0) + case when fixed then 1 else 0 end,
    'flags', (select coalesce(jsonb_agg(x), '[]'::jsonb) from (
               select x from jsonb_array_elements(fl || coalesce(g->'flags', '[]'::jsonb)) x limit 30) s));
  return new;
end $$;
revoke execute on function private.saves_guard() from public, anon, authenticated;
