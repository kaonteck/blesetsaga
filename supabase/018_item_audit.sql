-- 018 · 부정 방지 2차(1): 아이템 검사 — 기록만 (2026-11-04)
-- 016·017은 레벨·골드를 예산 안으로 자르고 아이템은 개수(99)만 막았다. 없던 아이템을 만들어 넣는 것은 못 막았다.
-- 018은 아이템을 자르지 않고 운영 페이지 '부정 의심'에 기록만 남긴다(새 아이템이 게임에 추가될 때 정상 유저가 잃지 않게).
--  ① 늘어난 아이템 개수 예산: 1분에 30개씩 차고 최대 150개까지 모임 + 서버 우편으로 받은 아이템 개수 + 쓴 골드 20당 1개(상점 구매).
--     넘으면 'items' 기록(늘어난 개수 · 허용치). 첫 저장은 예산 검사 없음.
--  ② 새로 생긴 아이템이 게임 목록(public.item_catalog, js의 ITEMS 175종)에도, 운영 페이지에서 공개한 아이템(content.kind='item')에도 없으면 'item_unknown'.
--  ③ 새로 생긴 장비의 착용 레벨이 지금 레벨 + 15보다 높으면 'gear'(그 사이 서버 우편으로 받은 아이템은 제외 — 선물은 정상).
-- 게임에 아이템을 새로 넣으면 아래 목록에도 추가해야 'item_unknown' 기록이 안 남는다(빠져도 아이템은 그대로, 기록만 남음).

-- 검사 함수는 유저 권한으로 돈다(누가 썼는지 봐야 해서) → 목록은 읽기 전용 public 표(비밀 아님)
create table if not exists public.item_catalog (
  id    text primary key,
  type  text not null,
  lvl   int not null default 0
);
alter table public.item_catalog enable row level security;
revoke all on public.item_catalog from anon, authenticated;
grant select on public.item_catalog to authenticated;
drop policy if exists "item catalog: 읽기" on public.item_catalog;
create policy "item catalog: 읽기" on public.item_catalog for select to authenticated using (true);
truncate public.item_catalog;
insert into public.item_catalog (id, type, lvl) values
  ('potion','use',0),
  ('holywater','use',0),
  ('elixir','use',0),
  ('sword','equip',0),
  ('shield','equip',0),
  ('bow','equip',0),
  ('staff','equip',0),
  ('leather','equip',0),
  ('cloak','equip',0),
  ('amulet','equip',0),
  ('crest','equip',0),
  ('g1_gsword','equip',5),
  ('g1_knuckle','equip',5),
  ('g1_dagger','equip',5),
  ('g1_staff','equip',5),
  ('g1_gun','equip',5),
  ('g1_scepter','equip',5),
  ('g1_armor','equip',5),
  ('g1_acc','equip',5),
  ('g2_gsword','equip',10),
  ('g2_knuckle','equip',10),
  ('g2_dagger','equip',10),
  ('g2_staff','equip',10),
  ('g2_gun','equip',10),
  ('g2_scepter','equip',10),
  ('g2_orb','equip',10),
  ('g2_armor','equip',10),
  ('g2_acc','equip',10),
  ('g3_gsword','equip',20),
  ('g3_axe','equip',20),
  ('g3_sws','equip',20),
  ('g3_knuckle','equip',20),
  ('g3_dagger','equip',20),
  ('g3_staff','equip',20),
  ('g3_gun','equip',20),
  ('g3_dgun','equip',20),
  ('g3_scepter','equip',20),
  ('g3_orb','equip',20),
  ('g3_armor','equip',20),
  ('g3_acc','equip',20),
  ('g4_gsword','equip',30),
  ('g4_axe','equip',30),
  ('g4_sws','equip',30),
  ('g4_knuckle','equip',30),
  ('g4_dagger','equip',30),
  ('g4_staff','equip',30),
  ('g4_gun','equip',30),
  ('g4_dgun','equip',30),
  ('g4_scepter','equip',30),
  ('g4_orb','equip',30),
  ('g4_armor','equip',30),
  ('g4_acc','equip',30),
  ('g5_gsword','equip',40),
  ('g5_axe','equip',40),
  ('g5_sws','equip',40),
  ('g5_knuckle','equip',40),
  ('g5_dagger','equip',40),
  ('g5_staff','equip',40),
  ('g5_gun','equip',40),
  ('g5_dgun','equip',40),
  ('g5_scepter','equip',40),
  ('g5_orb','equip',40),
  ('g5_armor','equip',40),
  ('g5_acc','equip',40),
  ('g6_gsword','equip',50),
  ('g6_axe','equip',50),
  ('g6_sws','equip',50),
  ('g6_knuckle','equip',50),
  ('g6_dagger','equip',50),
  ('g6_staff','equip',50),
  ('g6_gun','equip',50),
  ('g6_dgun','equip',50),
  ('g6_scepter','equip',50),
  ('g6_orb','equip',50),
  ('g6_armor','equip',50),
  ('g6_acc','equip',50),
  ('g7_gsword','equip',65),
  ('g7_axe','equip',65),
  ('g7_sws','equip',65),
  ('g7_knuckle','equip',65),
  ('g7_dagger','equip',65),
  ('g7_staff','equip',65),
  ('g7_gun','equip',65),
  ('g7_dgun','equip',65),
  ('g7_scepter','equip',65),
  ('g7_orb','equip',65),
  ('g7_armor','equip',65),
  ('g7_acc','equip',65),
  ('g8_gsword','equip',80),
  ('g8_axe','equip',80),
  ('g8_sws','equip',80),
  ('g8_knuckle','equip',80),
  ('g8_dagger','equip',80),
  ('g8_staff','equip',80),
  ('g8_gun','equip',80),
  ('g8_dgun','equip',80),
  ('g8_scepter','equip',80),
  ('g8_orb','equip',80),
  ('g8_armor','equip',80),
  ('g8_acc','equip',80),
  ('herb','mat',0),
  ('ore','mat',0),
  ('venom','mat',0),
  ('salt','mat',0),
  ('ember','mat',0),
  ('frost','mat',0),
  ('pearl','mat',0),
  ('chaos','mat',0),
  ('snowglobe','deco',0),
  ('swiftdraft','use',0),
  ('windanklet','equip',0),
  ('grain','mat',0),
  ('meat','mat',0),
  ('fish','mat',0),
  ('mushroom','mat',0),
  ('pepper','mat',0),
  ('berry','mat',0),
  ('k_bread','use',0),
  ('k_skewer','use',0),
  ('k_soup','use',0),
  ('k_pie','use',0),
  ('k_spicy','use',0),
  ('k_jam','use',0),
  ('k_feast','use',0),
  ('k_royal','use',0),
  ('a_tonic','use',0),
  ('a_frost','use',0),
  ('a_pearl','use',0),
  ('a_chaos','use',0),
  ('haste5','use',0),
  ('haste10','use',0),
  ('haste30','use',0),
  ('haste60','use',0),
  ('haste360','use',0),
  ('q_letter','mat',0),
  ('q_wallet','mat',0),
  ('q_return','mat',0),
  ('j2052','mat',0),
  ('q_mask','mat',0),
  ('q_ferry','mat',0),
  ('q_lamp','mat',0),
  ('q_pilgrim','mat',0),
  ('q_cavemap','mat',0),
  ('q_trial','mat',0),
  ('fl_f_pira','mat',0),
  ('fl_f_crucian','mat',0),
  ('fl_f_shrimp','mat',0),
  ('fl_f_crawfish','mat',0),
  ('fl_f_catfish','mat',0),
  ('fl_f_mandarin','mat',0),
  ('fl_f_goldcarp','mat',0),
  ('fl_f_sturgeon','mat',0),
  ('fl_f_jack','mat',0),
  ('fl_f_mackerel','mat',0),
  ('fl_f_crab','mat',0),
  ('fl_f_octopus','mat',0),
  ('fl_f_seabream','mat',0),
  ('fl_f_marlin','mat',0),
  ('fl_f_turtle','mat',0),
  ('fl_f_levi','mat',0),
  ('fl_f_smelt','mat',0),
  ('fl_f_capelin','mat',0),
  ('fl_f_char','mat',0),
  ('fl_f_kingcrab','mat',0),
  ('fl_f_icetrout','mat',0),
  ('fl_f_silvercod','mat',0),
  ('fl_f_jelly','mat',0),
  ('fl_f_icelord','mat',0),
  ('rod1','mat',0),
  ('rod2','mat',0),
  ('rod3','mat',0),
  ('rod4','mat',0),
  ('bottle','use',0),
  ('goldbar','deco',0),
  ('jobticket','use',0);

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

  -- 인벤토리 개수(첫 저장도 99개까지)
  oi := case when jsonb_typeof(om->'inv') = 'object' then om->'inv' else '{}'::jsonb end;
  if jsonb_typeof(nm->'inv') = 'object' then
    inv := '{}'::jsonb;
    for k, v in select * from jsonb_each(nm->'inv') loop
      c := case when jsonb_typeof(v) = 'number' then (v #>> '{}')::numeric else 0 end;
      if c > 99 then fixed := true; end if;
      if c > 999 then inv_bad := true; end if;
      c := greatest(0, least(99, round(c)));
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
    if inv_bad then fl := fl || jsonb_build_object('at', t, 'k', 'inv', 'ok', 99); end if;
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
