-- 014 · 1:1 문의 · 주간 낚시 랭킹 서버 연결
-- 표(inquiries · fish_catches · fish_weekly)는 005에서 만들었다. 여기서는 게임과 맞춘다.
--  1) 문의: 운영자가 답하면 서버가 문의한 사람에게 답변 우편을 보낸다(게임이 꺼져 있어도 도착).
--     실시간으로 내 문의 상태가 바뀌게 publication에 넣는다.
--  2) 낚시: 지난 주 지역별 1위에게 500골드 우편 + 수상 기록(fish_awards). 게임 칭호는 수상 기록을 보고 붙인다.
--     정산은 누구나 부르는 fish_settle()이 늦게라도 한 번만 한다(추첨 없는 행운권과 같은 방식, 예약 작업 불필요).
--     1위: 그 주 그 지역 가장 큰 기록, 같으면 먼저 낚은 사람.

-- ── 1) 문의 답변 → 우편 ──
create or replace function private.inquiry_mail()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if new.answer is not null and new.answer is distinct from old.answer then
    insert into public.mail (recipient, sender, sender_name, text)
    values (new.author, null, '운영자',
            left('[1:1 문의 답변] ' || new.answer || E'\n\n문의 · ' || left(new.text, 120), 500));
  end if;
  return null;
end $$;
revoke execute on function private.inquiry_mail() from public, anon, authenticated;
drop trigger if exists inquiry_mail on public.inquiries;
create trigger inquiry_mail after update of answer on public.inquiries for each row execute function private.inquiry_mail();

-- 문의 분류는 게임 목록만 (ASK_CAT)
alter table public.inquiries drop constraint if exists inquiries_cat_check;
alter table public.inquiries add constraint inquiries_cat_check check (cat in ('계정','전투','퀘스트','버그 신고','기타'));

-- ── 2) 낚시 랭킹 정산 ──
create table if not exists public.fish_awards (
  week        date not null,
  land        text not null,
  user_id     uuid not null references public.profiles(user_id) on delete cascade,
  species     text not null,
  size_cm     numeric(6,1) not null,
  created_at  timestamptz not null default now(),
  primary key (week, land)
);
create index if not exists fish_awards_user on public.fish_awards (user_id);
alter table public.fish_awards enable row level security;
revoke all on public.fish_awards from anon, authenticated;
grant select on public.fish_awards to authenticated;
drop policy if exists "fish awards: 읽기" on public.fish_awards;
create policy "fish awards: 읽기" on public.fish_awards for select to authenticated using (true);

-- 낚시 지역 이름(게임 LANDS · VIL_TOWN)
create or replace function private.fish_land_name(l text, village boolean)
returns text language sql immutable set search_path = '' as $$
  select case l
    when 'meadow' then case when village then '에우도라' else '초원의 땅' end
    when 'sea'    then case when village then '벤테'     else '바다의 땅' end
    when 'frost'  then case when village then '칼리로에' else '혹한의 땅' end
    else l end
$$;

create or replace function public.fish_settle()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select distinct on (f.week, f.land) f.week, f.land, f.user_id, f.species, f.size_cm
      from public.fish_catches f
     where f.week < public.kst_week()
       and not exists (select 1 from public.fish_awards a where a.week = f.week and a.land = f.land)
     order by f.week, f.land, f.size_cm desc, f.created_at, f.id
  loop
    insert into public.fish_awards (week, land, user_id, species, size_cm)
    values (r.week, r.land, r.user_id, r.species, r.size_cm)
    on conflict (week, land) do nothing;
    if found then
      insert into public.mail (recipient, sender, sender_name, text, gold)
      values (r.user_id, null, '운영자',
        format('[주간 낚시 랭킹] %s 주간 %s 1위를 축하합니다! 기록 · %s %scm. 보상으로 500골드와 칭호 〈%s의 낚시왕〉을 드립니다.',
               r.week, private.fish_land_name(r.land, false), r.species, r.size_cm, private.fish_land_name(r.land, true)),
        500);
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;
revoke execute on function public.fish_settle() from public, anon;
grant execute on function public.fish_settle() to authenticated;

-- 낚시 기록: 게임이 아는 지역만 (species에는 물고기 이름을 넣는다 — 순위·우편에 그대로 보임)
alter table public.fish_catches drop constraint if exists fish_catches_land_check;
alter table public.fish_catches add constraint fish_catches_land_check check (land in ('meadow','sea','frost'));

-- ── 실시간 ──
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'inquiries') then
    alter publication supabase_realtime add table public.inquiries;
  end if;
end $$;
