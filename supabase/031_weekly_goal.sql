-- 031: 서버 공동 목표(메인 요청 5-3, 2026-11-07)
-- 한 주에 목표 하나를 모든 블레서가 함께 채운다. 다 채우면 기여한 블레서(1 이상)에게만 우편 보상.
--   주 = 월요일 05:00 KST에 바뀜(public.goal_week()).
--   종류(kind): kill(아무 몬스터) · kill:<몬스터 id> · explore(탐색) · fish(낚시 성공) · dungeon(던전 공략) · raid(파티 레이드·토벌전 승리)
--   게임: goal_add(종류, 수) — 그 주 목표와 종류가 다르면 아무 일도 안 함. goal_status() — 지금 주 목표·합계·내 기여.
--   운영: weekly_goals 표를 직접 만들고 고침(운영자만), admin_goals()로 지난 주까지 확인, goal_settle()로 지급 누락 확인.

create or replace function public.goal_week(t timestamptz default now())
returns date language sql stable set search_path = '' as $$
  select date_trunc('week', (t at time zone 'Asia/Seoul') - interval '5 hours')::date
$$;
grant execute on function public.goal_week(timestamptz) to authenticated;

create table if not exists public.weekly_goals (
  week        date primary key,
  kind        text not null check (kind ~ '^(kill|kill:[a-z0-9_]{1,40}|explore|fish|dungeon|raid)$'),
  target      int  not null check (target between 1 and 10000000),
  name        text not null check (char_length(name) between 1 and 40),
  descr       text not null default '' check (char_length(descr) <= 200),
  gold        int  not null default 0 check (gold between 0 and 100000),
  items       jsonb not null default '{}'::jsonb check (jsonb_typeof(items) = 'object'),
  total       bigint not null default 0,
  done_at     timestamptz,
  paid_at     timestamptz,
  paid_n      int not null default 0,
  auto        boolean not null default false,     -- 기본 순환 목록에서 저절로 만든 것
  updated_at  timestamptz not null default now()
);
alter table public.weekly_goals enable row level security;
revoke all on public.weekly_goals from anon, authenticated;
grant select on public.weekly_goals to authenticated;
grant insert, update, delete on public.weekly_goals to authenticated;
drop policy if exists wg_read on public.weekly_goals;
create policy wg_read on public.weekly_goals for select to authenticated using (true);
drop policy if exists wg_admin_ins on public.weekly_goals;
create policy wg_admin_ins on public.weekly_goals for insert to authenticated with check ((select public.is_admin()));
drop policy if exists wg_admin_upd on public.weekly_goals;
create policy wg_admin_upd on public.weekly_goals for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
drop policy if exists wg_admin_del on public.weekly_goals;
create policy wg_admin_del on public.weekly_goals for delete to authenticated using ((select public.is_admin()) and paid_at is null);

-- 운영자가 고쳐도 합계·지급 기록은 못 바꿈, 보상 아이템은 게임 아이템만(1~99개), 이미 지급한 주는 목표·보상 못 바꿈
create or replace function private.wg_guard()
returns trigger language plpgsql set search_path = '' as $$
declare k text; v jsonb;
begin
  if current_user in ('authenticated', 'anon') then
    if tg_op = 'INSERT' then
      new.total := 0; new.done_at := null; new.paid_at := null; new.paid_n := 0; new.auto := false;
    else
      new.total := old.total; new.done_at := old.done_at; new.paid_at := old.paid_at; new.paid_n := old.paid_n; new.auto := old.auto;
      new.week := old.week;
      if old.paid_at is not null and (new.kind, new.target, new.gold, new.items) is distinct from (old.kind, old.target, old.gold, old.items) then
        raise exception 'GOAL_PAID' using hint = '이미 보상을 보낸 주는 목표·보상을 바꿀 수 없습니다';
      end if;
    end if;
  end if;
  for k, v in select * from jsonb_each(new.items) loop
    if jsonb_typeof(v) <> 'number' or (v::text)::numeric not between 1 and 99 or (v::text)::numeric <> floor((v::text)::numeric) then
      raise exception 'BAD_ITEMS' using hint = '아이템 개수는 1~99';
    end if;
    if not exists (select 1 from public.item_catalog c where c.id = k)
       and not exists (select 1 from public.content c where c.kind = 'item' and c.id = k and c.published is not null) then
      raise exception 'BAD_ITEMS' using hint = format('없는 아이템: %s', k);
    end if;
  end loop;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists wg_guard on public.weekly_goals;
create trigger wg_guard before insert or update on public.weekly_goals for each row execute function private.wg_guard();

-- 기본 순환 목록: 그 주 목표가 없으면 이 중 하나로 만든다(주 번호 순서대로)
create table if not exists private.goal_rotation (
  idx    int primary key,
  kind   text not null,
  target int  not null,
  name   text not null,
  descr  text not null,
  gold   int  not null,
  items  jsonb not null default '{}'::jsonb
);
insert into private.goal_rotation (idx, kind, target, name, descr, gold, items) values
  (0, 'kill',    10000, '대륙의 몬스터 1만 마리',   '이번 주, 모든 블레서가 함께 몬스터 1만 마리를 쓰러뜨립니다.', 1000, '{"potion":3}'),
  (1, 'explore',  2000, '탐색 2천 번',            '이번 주, 모든 블레서가 함께 대륙을 2천 번 탐색합니다.',       1000, '{"potion":3}'),
  (2, 'dungeon',   300, '던전 공략 300번',         '이번 주, 모든 블레서가 함께 던전을 300번 공략합니다.',        1500, '{"potion":5}'),
  (3, 'fish',      500, '물고기 500마리',          '이번 주, 모든 블레서가 함께 물고기 500마리를 낚습니다.',       1000, '{"potion":3}'),
  (4, 'raid',      200, '파티 레이드 승리 200번',   '이번 주, 모든 블레서가 함께 파티 레이드·토벌전에서 200번 이깁니다.', 1500, '{"potion":5}')
on conflict (idx) do nothing;
revoke all on private.goal_rotation from public, anon, authenticated;

create or replace function private.goal_ensure(p_week date)
returns void language plpgsql security definer set search_path = '' as $$
declare n int; r record;
begin
  if exists (select 1 from public.weekly_goals where week = p_week) then return; end if;
  select count(*) into n from private.goal_rotation;
  if n = 0 then return; end if;
  select * into r from private.goal_rotation
   order by idx offset ((((p_week - date '2026-01-05') / 7) % n + n) % n) limit 1;
  insert into public.weekly_goals (week, kind, target, name, descr, gold, items, auto)
  values (p_week, r.kind, r.target, r.name, r.descr, r.gold, r.items, true)
  on conflict (week) do nothing;
end $$;
revoke all on function private.goal_ensure(date) from public, anon, authenticated;

create table if not exists public.weekly_goal_progress (
  week     date not null references public.weekly_goals(week) on delete cascade,
  user_id  uuid not null references public.profiles(user_id) on delete cascade,
  n        bigint not null default 0,
  bucket   numeric not null default 0,       -- 남은 기여 예산(시간이 지나면 다시 참)
  at       timestamptz not null default now(),
  primary key (week, user_id)
);
alter table public.weekly_goal_progress enable row level security;
revoke all on public.weekly_goal_progress from anon, authenticated;
grant select on public.weekly_goal_progress to authenticated;
drop policy if exists wgp_read on public.weekly_goal_progress;
create policy wgp_read on public.weekly_goal_progress for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));

-- 종류별 기여 예산: 1분에 rate만큼 차고 cap까지 쌓임(8시간 자동 사냥 96마리도 한 번에 받을 수 있게)
create or replace function private.goal_rate(p_kind text, out rate numeric, out cap numeric)
language sql immutable set search_path = '' as $$
  select case when p_kind like 'kill%' then 6 when p_kind = 'explore' then 1 when p_kind = 'fish' then 0.5 else 0.5 end,
         case when p_kind like 'kill%' then 300 when p_kind = 'explore' then 20 when p_kind = 'fish' then 20 else 10 end
$$;

-- 다 찬 주의 보상 지급(한 번만). 기여 1 이상인 블레서에게 우편.
create or replace function private.goal_pay(p_week date)
returns int language plpgsql security definer set search_path = '' as $$
declare g public.weekly_goals; n int := 0;
begin
  update public.weekly_goals set paid_at = now(), done_at = coalesce(done_at, now())
   where week = p_week and paid_at is null and total >= target
   returning * into g;
  if not found then return 0; end if;
  insert into public.mail (recipient, sender, sender_name, text, items, gold)
  select p.user_id, null, '운영자',
         left(format('[공동 목표 달성] %s 주 「%s」를 모든 블레서가 함께 채웠습니다! 내 기여 %s · 함께해 주셔서 감사합니다.',
                     g.week, g.name, p.n), 500),
         g.items, g.gold
    from public.weekly_goal_progress p
   where p.week = p_week and p.n >= 1;
  get diagnostics n = row_count;
  update public.weekly_goals set paid_n = n where week = p_week;
  return n;
end $$;
revoke all on function private.goal_pay(date) from public, anon, authenticated;

-- 게임: 행동할 때 부름. 반환 {ok, added, mine, total, target, done}
create or replace function public.goal_add(p_kind text, p_n int default 1)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); wk date := public.goal_week(); g public.weekly_goals;
        pr public.weekly_goal_progress; rt numeric; cp numeric; b numeric; k int;
begin
  if uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform private.goal_ensure(wk);
  select * into g from public.weekly_goals where week = wk;
  if not found then return jsonb_build_object('ok', false, 'reason', 'NO_GOAL'); end if;
  -- 'kill' 목표는 어떤 처치든, 'kill:<id>' 목표는 그 몬스터만
  if not (p_kind = g.kind or (g.kind = 'kill' and p_kind like 'kill:%')) then
    return jsonb_build_object('ok', false, 'reason', 'OTHER_KIND');
  end if;
  if g.done_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'DONE', 'total', g.total, 'target', g.target, 'done', true);
  end if;
  k := least(greatest(coalesce(p_n, 0), 0), 1000);
  if k = 0 then return jsonb_build_object('ok', false, 'reason', 'ZERO'); end if;
  select * into rt, cp from private.goal_rate(g.kind);
  insert into public.weekly_goal_progress (week, user_id, n, bucket, at) values (wk, uid, 0, cp, now())
  on conflict (week, user_id) do nothing;
  select * into pr from public.weekly_goal_progress where week = wk and user_id = uid for update;
  b := least(cp, pr.bucket + rt * extract(epoch from (now() - pr.at)) / 60);
  k := least(k, floor(b)::int);
  update public.weekly_goal_progress set n = n + k, bucket = b - k, at = now()
   where week = wk and user_id = uid returning * into pr;
  if k > 0 then
    update public.weekly_goals set total = total + k,
           done_at = case when total + k >= target then coalesce(done_at, now()) else done_at end
     where week = wk returning * into g;
    if g.total >= g.target and g.paid_at is null then perform private.goal_pay(wk); end if;
  end if;
  return jsonb_build_object('ok', k > 0, 'reason', case when k = 0 then 'TOO_FAST' end, 'added', k,
                            'mine', pr.n, 'total', g.total, 'target', g.target, 'done', g.total >= g.target);
end $$;
revoke execute on function public.goal_add(text, int) from public, anon;
grant execute on function public.goal_add(text, int) to authenticated;

-- 게임: 지금 주 목표 · 합계 · 내 기여(지난 주 결과도 함께)
create or replace function public.goal_status()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); wk date := public.goal_week(); g public.weekly_goals; p public.weekly_goals; mine bigint; pmine bigint;
begin
  if uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform private.goal_ensure(wk);
  select * into g from public.weekly_goals where week = wk;
  select coalesce((select n from public.weekly_goal_progress where week = wk and user_id = uid), 0) into mine;
  select * into p from public.weekly_goals where week = wk - 7;
  select coalesce((select n from public.weekly_goal_progress where week = wk - 7 and user_id = uid), 0) into pmine;
  return jsonb_build_object(
    'week', wk, 'ends', (wk + 7)::timestamp + interval '5 hours',   -- KST 기준 시각(월 05:00)
    'kind', g.kind, 'name', g.name, 'descr', g.descr, 'target', g.target, 'total', g.total,
    'gold', g.gold, 'items', g.items, 'done', g.done_at is not null, 'mine', mine,
    'prev', case when p.week is null then null else jsonb_build_object(
      'name', p.name, 'target', p.target, 'total', p.total, 'done', p.done_at is not null, 'mine', pmine) end);
end $$;
revoke execute on function public.goal_status() from public, anon;
grant execute on function public.goal_status() to authenticated;

-- 지급 누락 확인(운영 페이지 버튼 · 게임 접속 때). 합계가 목표 이상인데 아직 안 보낸 주를 보냄(지난 주 포함).
create or replace function public.goal_settle()
returns int language plpgsql security definer set search_path = '' as $$
declare r record; n int := 0;
begin
  for r in select week from public.weekly_goals where paid_at is null and total >= target order by week loop
    begin
      update public.weekly_goals set done_at = coalesce(done_at, now()) where week = r.week;
      n := n + private.goal_pay(r.week);
    exception when others then
      raise warning 'goal_settle % 실패: %', r.week, sqlerrm;
    end;
  end loop;
  return n;
end $$;
revoke execute on function public.goal_settle() from public, anon;
grant execute on function public.goal_settle() to authenticated;

-- 운영: 최근 몇 주 목표와 기여 인원
create or replace function public.admin_goals(p_weeks int default 8)
returns table (week date, kind text, target int, name text, descr text, gold int, items jsonb, total bigint,
               done_at timestamptz, paid_at timestamptz, paid_n int, auto boolean, people bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  perform private.goal_ensure(public.goal_week());
  return query
    select g.week, g.kind, g.target, g.name, g.descr, g.gold, g.items, g.total, g.done_at, g.paid_at, g.paid_n, g.auto,
           (select count(*) from public.weekly_goal_progress p where p.week = g.week and p.n >= 1)
      from public.weekly_goals g
     where g.week >= public.goal_week() - 7 * greatest(1, least(coalesce(p_weeks, 8), 52))
     order by g.week desc;
end $$;
revoke execute on function public.admin_goals(int) from public, anon;
grant execute on function public.admin_goals(int) to authenticated;

-- 실시간 알림은 쓰지 않음(처치마다 모든 화면에 알림이 가지 않게) — 게임은 goal_status()를 1분마다 읽음
