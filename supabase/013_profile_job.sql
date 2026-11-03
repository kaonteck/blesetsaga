-- 013 · 프로필 직업 값 제한 (체크 요청, 2026-11-03)
-- profiles.job에 아무 값이나 넣을 수 있어, 이상한 값 하나로 그 유저 메시지를 보는 모든 사람의 채팅창이 안 그려졌다.
-- 게임의 클래스 id(js/01-engine.js CLASSES)만 허용. 비어 있는 값(캐릭터 만들기 전)은 그대로 허용.
-- 클래스를 새로 추가하면 이 목록도 함께 늘려야 한다.
update public.profiles set job = null
 where job is not null and job not in ('defender','warrior','knight','infighter','mystic','destroyer','mage','salamander','shooter','dualist','priest','demigod','summoner');
alter table public.profiles drop constraint if exists profiles_job_check;
alter table public.profiles add constraint profiles_job_check check (job is null or job in
  ('defender','warrior','knight','infighter','mystic','destroyer','mage','salamander','shooter','dualist','priest','demigod','summoner'));
