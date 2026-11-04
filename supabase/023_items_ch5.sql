-- 023: 5장 「세이렌의 부름」 새 퀘스트 아이템 5개를 아이템 목록(018 item_catalog)에 추가 (메인 요청, 2026-11-04)
-- 게임 ITEMS 184종 = item_catalog 184종(id·종류·착용 레벨 같음, origin/main 37df5df 기준 확인)
insert into public.item_catalog (id, type, lvl) values
  ('q_score','mat',0),
  ('q_bottle','mat',0),
  ('q_wax','mat',0),
  ('q_photo','mat',0),
  ('q_conch','mat',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
