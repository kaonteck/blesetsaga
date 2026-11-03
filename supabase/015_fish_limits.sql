-- 015 · 주간 낚시 랭킹 막힘 방지 (체크 요청, 2026-11-03)
-- 문제: fish_catches.species 길이 제한이 없고 size_cm은 9999.9까지 받음 → 600자 이름 · 9999cm 기록이 1위가 되면
--       fish_settle()의 우편 글이 500자를 넘어 mail_text_check에 걸리고, 정산 전체가 실패(그 뒤 모든 주도 막힘).
-- 고침: ① 기록은 그 지역에 실제로 있는 물고기 이름만 ② 크기는 그 물고기의 게임 범위(최소~최대 cm) 안에서만
--       ③ fish_settle(): 우편 글 길이 보장 + 한 지역·한 주가 실패해도 나머지는 정산.
-- 물고기 목록은 js/05-features.js의 FISH와 같아야 한다(물고기를 추가·변경하면 아래 표에도).

create table if not exists private.fish_species (
  land     text not null,
  name     text not null,
  min_cm   numeric(6,1) not null,
  max_cm   numeric(6,1) not null,
  primary key (land, name)
);
revoke all on private.fish_species from public, anon, authenticated;
truncate private.fish_species;
insert into private.fish_species (land, name, min_cm, max_cm) values
  ('meadow','피라미',5,12),
  ('meadow','붕어',10,30),
  ('meadow','민물새우',3,8),
  ('meadow','가재',8,15),
  ('meadow','메기',30,90),
  ('meadow','쏘가리',25,60),
  ('meadow','황금 잉어',40,100),
  ('meadow','강의 주인 철갑상어',100,250),
  ('sea','전갱이',15,35),
  ('sea','고등어',25,45),
  ('sea','꽃게',10,25),
  ('sea','문어',30,90),
  ('sea','참돔',30,80),
  ('sea','청새치',150,300),
  ('sea','바다거북',60,120),
  ('sea','새끼 리바이어던',200,500),
  ('frost','빙어',5,15),
  ('frost','열빙어',10,20),
  ('frost','북극곤들매기',30,70),
  ('frost','대게',15,30),
  ('frost','얼음 송어',40,90),
  ('frost','은빛 대구',50,120),
  ('frost','서리 해파리',20,60),
  ('frost','얼음 군주 넙치',100,200);

create or replace function private.fish_check()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from private.fish_species s
                  where s.land = new.land and s.name = new.species
                    and new.size_cm between s.min_cm and s.max_cm) then
    raise exception 'BAD_FISH' using errcode = 'check_violation';
  end if;
  return new;
end $$;
revoke execute on function private.fish_check() from public, anon, authenticated;
drop trigger if exists fish_check on public.fish_catches;
create trigger fish_check before insert on public.fish_catches for each row execute function private.fish_check();

-- 이미 들어간 잘못된 기록(있다면)은 지운다 — 정산에서 1위가 되지 않게
delete from public.fish_catches f
 where not exists (select 1 from private.fish_species s
                    where s.land = f.land and s.name = f.species and f.size_cm between s.min_cm and s.max_cm);

create or replace function public.fish_settle()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in
    select distinct on (f.week, f.land) f.week, f.land, f.user_id, f.species, f.size_cm
      from public.fish_catches f
     where f.week < public.kst_week()
       and not exists (select 1 from public.fish_awards a where a.week = f.week and a.land = f.land)
       and exists (select 1 from private.fish_species s
                    where s.land = f.land and s.name = f.species and f.size_cm between s.min_cm and s.max_cm)
     order by f.week, f.land, f.size_cm desc, f.created_at, f.id
  loop
    begin   -- 한 줄이 실패해도 다음 지역·주는 계속(이 줄만 되돌림)
      insert into public.fish_awards (week, land, user_id, species, size_cm)
      values (r.week, r.land, r.user_id, left(r.species, 20), r.size_cm)
      on conflict (week, land) do nothing;
      if found then
        insert into public.mail (recipient, sender, sender_name, text, gold)
        values (r.user_id, null, '운영자',
          left(format('[주간 낚시 랭킹] %s 주간 %s 1위를 축하합니다! 기록 · %s %scm. 보상으로 500골드와 칭호 〈%s의 낚시왕〉을 드립니다.',
                 r.week, private.fish_land_name(r.land, false), left(r.species, 20), r.size_cm, private.fish_land_name(r.land, true)), 500),
          500);
        n := n + 1;
      end if;
    exception when others then
      raise warning 'fish_settle % % 실패: %', r.week, r.land, sqlerrm;
    end;
  end loop;
  return n;
end $$;
revoke execute on function public.fish_settle() from public, anon;
grant execute on function public.fish_settle() to authenticated;
