-- 032: 공동 목표 — 한도를 넘는 기여를 버리지 않고 '대기분'으로 미뤄 둠(유저 결정 2026-11-07)
--   예산이 다시 차면 다음 goal_add 때나 goal_status 때(게임은 1분마다 읽음) 대기분부터 합계에 넣는다.
--   대기분도 종류마다 상한(처치 2,000 · 탐색·낚시 50 · 던전·레이드 30)까지만, 넘는 것은 버림(TOO_FAST).
--   주가 바뀌면 그 주 대기분은 그 주 합계에 못 들어감(정상 플레이로는 거의 없음).

alter table public.weekly_goal_progress add column if not exists pending bigint not null default 0;

create or replace function private.goal_pend_cap(p_kind text)
returns int language sql immutable set search_path = '' as $$
  select case when p_kind like 'kill%' then 2000 when p_kind in ('explore', 'fish') then 50 else 30 end
$$;

-- 한 블레서의 기여를 넣음: (대기분 + 새로 온 양) 중 예산만큼 합계로, 나머지는 대기분으로(상한까지)
create or replace function private.goal_credit(p_uid uuid, p_week date, p_add int,
  out added int, out queued int, out dropped int, out mine bigint, out pending bigint)
language plpgsql security definer set search_path = '' as $$
declare g public.weekly_goals; pr public.weekly_goal_progress; rt numeric; cp numeric; b numeric; want bigint; pc int;
begin
  added := 0; queued := 0; dropped := 0; mine := 0; pending := 0;
  select * into g from public.weekly_goals where week = p_week;
  if not found then return; end if;
  select * into rt, cp from private.goal_rate(g.kind);
  pc := private.goal_pend_cap(g.kind);
  insert into public.weekly_goal_progress (week, user_id, n, bucket, at) values (p_week, p_uid, 0, cp, now())
  on conflict (week, user_id) do nothing;
  select * into pr from public.weekly_goal_progress where week = p_week and user_id = p_uid for update;
  if g.done_at is not null then   -- 다 찼으면 대기분은 정리
    if pr.pending > 0 then update public.weekly_goal_progress set pending = 0 where week = p_week and user_id = p_uid; end if;
    mine := pr.n; return;
  end if;
  b := least(cp, pr.bucket + rt * extract(epoch from (now() - pr.at)) / 60);
  want := pr.pending + greatest(coalesce(p_add, 0), 0);
  added := least(want, floor(b))::int;
  pending := least(want - added, pc);
  queued := greatest(pending - pr.pending, 0)::int;
  dropped := (want - added - pending)::int;
  update public.weekly_goal_progress set n = n + added, bucket = b - added, pending = goal_credit.pending, at = now()
   where week = p_week and user_id = p_uid returning n into mine;
  if added > 0 then
    update public.weekly_goals set total = total + added,
           done_at = case when total + added >= target then coalesce(done_at, now()) else done_at end
     where week = p_week returning * into g;
    if g.total >= g.target and g.paid_at is null then perform private.goal_pay(p_week); end if;
  end if;
end $$;
revoke all on function private.goal_credit(uuid, date, int) from public, anon, authenticated;

create or replace function public.goal_add(p_kind text, p_n int default 1)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); wk date := public.goal_week(); g public.weekly_goals; c record; k int;
begin
  if uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform private.goal_ensure(wk);
  select * into g from public.weekly_goals where week = wk;
  if not found then return jsonb_build_object('ok', false, 'reason', 'NO_GOAL'); end if;
  if not (p_kind = g.kind or (g.kind = 'kill' and p_kind like 'kill:%')) then
    return jsonb_build_object('ok', false, 'reason', 'OTHER_KIND');
  end if;
  if g.done_at is not null then
    return jsonb_build_object('ok', false, 'reason', 'DONE', 'total', g.total, 'target', g.target, 'done', true);
  end if;
  k := least(greatest(coalesce(p_n, 0), 0), 1000);
  if k = 0 then return jsonb_build_object('ok', false, 'reason', 'ZERO'); end if;
  select * into c from private.goal_credit(uid, wk, k);
  select * into g from public.weekly_goals where week = wk;
  return jsonb_build_object('ok', c.added + c.queued > 0,
    'reason', case when c.dropped > 0 then 'TOO_FAST' when c.queued > 0 then 'QUEUED' end,
    'added', c.added, 'queued', c.queued, 'dropped', c.dropped, 'pending', c.pending,
    'mine', c.mine, 'total', g.total, 'target', g.target, 'done', g.total >= g.target);
end $$;
revoke execute on function public.goal_add(text, int) from public, anon;
grant execute on function public.goal_add(text, int) to authenticated;

-- 상태를 읽을 때 내 대기분부터 넣음(예산이 찼으면)
create or replace function public.goal_status()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare uid uuid := auth.uid(); wk date := public.goal_week(); g public.weekly_goals; p public.weekly_goals;
        c record; pmine bigint;
begin
  if uid is null then raise exception 'NOT_LOGGED_IN'; end if;
  perform private.goal_ensure(wk);
  if exists (select 1 from public.weekly_goal_progress where week = wk and user_id = uid and pending > 0) then
    select * into c from private.goal_credit(uid, wk, 0);
  end if;
  select * into g from public.weekly_goals where week = wk;
  select * into p from public.weekly_goals where week = wk - 7;
  select coalesce((select n from public.weekly_goal_progress where week = wk - 7 and user_id = uid), 0) into pmine;
  return jsonb_build_object(
    'week', wk, 'ends', (wk + 7)::timestamp + interval '5 hours',
    'kind', g.kind, 'name', g.name, 'descr', g.descr, 'target', g.target, 'total', g.total,
    'gold', g.gold, 'items', g.items, 'done', g.done_at is not null,
    'mine', coalesce((select n from public.weekly_goal_progress where week = wk and user_id = uid), 0),
    'pending', coalesce((select pending from public.weekly_goal_progress where week = wk and user_id = uid), 0),
    'prev', case when p.week is null then null else jsonb_build_object(
      'name', p.name, 'target', p.target, 'total', p.total, 'done', p.done_at is not null, 'mine', pmine) end);
end $$;
revoke execute on function public.goal_status() from public, anon;
grant execute on function public.goal_status() to authenticated;
