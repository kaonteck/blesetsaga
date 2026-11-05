-- 025: 7장 「거울 속 죄수」 새 아이템 8개를 아이템 목록(018 item_catalog)에 추가 (체크·메인 요청, 2026-11-05)
-- 게임 ITEMS 196종 = item_catalog 196종(id·종류·착용 레벨 같음, origin/main 6d2f3be 기준 확인)
insert into public.item_catalog (id, type, lvl) values
  ('q_lantern','mat',0),
  ('q_innkey','mat',0),
  ('q_icepick','mat',0),
  ('q_vmirror','mat',0),
  ('q_nametag','mat',0),
  ('q_letter7','mat',0),
  ('q_snow','mat',0),
  ('d_shard','deco',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
