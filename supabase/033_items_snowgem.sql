-- 033: 탐색 선택 이벤트(07-exev)의 새 아이템 「눈 결정」(snowgem, 재료)을 아이템 목록(018 item_catalog)에 추가 (메인 요청, 2026-11-07)
-- 게임 ITEMS 199종(origin/main 9889de9 기준) 중 목록에 없던 것은 이것 하나뿐(확인).
insert into public.item_catalog (id, type, lvl) values
  ('snowgem','mat',0)
on conflict (id) do update set type = excluded.type, lvl = excluded.lvl;
