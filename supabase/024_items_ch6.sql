-- 024: 6장 「고대 문명의 기억」 새 퀘스트 아이템 4개를 아이템 목록(018 item_catalog)에 추가 (체크·메인 요청, 2026-11-05)
-- 게임 ITEMS 188종 = item_catalog 188종(id·종류·착용 레벨 같음, origin/main 13027c8 기준 확인)
insert into public.item_catalog (id, type, lvl) values
  ('q_rubbing','mat',0),
  ('q_celona','mat',0),
  ('q_plan','mat',0),
  ('q_ticket','mat',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
