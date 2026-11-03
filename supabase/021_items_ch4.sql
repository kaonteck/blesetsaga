-- 021: 4장 「황금의 갈증」 새 퀘스트 아이템 4개를 아이템 목록(018 item_catalog)에 추가 (메인 요청, 2026-11-04)
-- 게임 ITEMS 179종 = item_catalog 179종(id·종류·착용 레벨 같음, origin/main b4ec043 기준 확인)
insert into public.item_catalog (id, type, lvl) values
  ('q_permit','mat',0),
  ('q_chip','mat',0),
  ('q_vaultkey','mat',0),
  ('q_eternal','mat',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
