-- 029 접속 지역 (메인 2026-11-06) — 캐릭터 생성 다음 화면에서 본명과 함께 받는 '접속 지역(현재 위치)'. 028 real_names에 칸 추가, 정책 그대로(본인만).
alter table public.real_names add column if not exists region text check (region is null or char_length(btrim(region)) between 1 and 40);
