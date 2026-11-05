-- 027: 8장 「백야의 신전」 새 아이템 2개를 아이템 목록(018 item_catalog)에 추가 (체크·메인 요청, 2026-11-05)
-- 게임 ITEMS 197종 ⊂ item_catalog 198종(origin/main 4e1b0bc 기준). 목록에만 남은 jobticket(테스트 아이템, 게임에서 회수)은
-- 예전 세이브의 변경권이 '없는 아이템'으로 기록되지 않게 그대로 둔다.
insert into public.item_catalog (id, type, lvl) values
  ('q_bits','mat',0),
  ('d_clock','deco',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
