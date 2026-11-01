-- 008 · 주간 행운권(로또) 서버화
-- 지금 게임은 당첨 번호를 날짜로 정해진 공식(seedRnd)으로 만들어서, 브라우저에서 미래 회차 번호를 미리 계산할 수 있다.
-- 서버화 후: 추첨 시각(금 20:00 KST)이 지난 뒤 처음 누군가 결과를 볼 때 서버가 무작위로 한 번 뽑는다(별도 예약 작업 불필요).
-- 구매·수령은 서버 함수로만: 구매 = 판매 시간·주간 장수 확인 → 보내는 사람 세이브에서 200골드 차감 → 행운권 기록,
--                           수령 = 당첨 등수 확인 → 한 번만 받음 표시 → 세이브에 상금 더하기.
-- 규칙(게임 05-features.js 와 같게): 0–9 중 서로 다른 4개 · 1장 200G · 한 주 2장 · 금 19:00 판매 마감 · 금 20:00 추첨
--                                    4개 1등 10000G · 3개 2등 3000G · 2개 3등 100G

-- ── 시계 (테스트에서만 바꿔 끼운다) ──
create or replace function private.lotto_clock()
returns timestamptz language sql stable set search_path = '' as $$ select now() $$;

-- 지금 기준 다음 추첨: 금요일 20:00 KST (지금이 그 시각 이후면 다음 주)
create or replace function private.lotto_next(p_t timestamptz)
returns table (draw_key text, draw_at timestamptz, close_at timestamptz)
language plpgsql stable set search_path = '' as $$
declare k timestamp := p_t at time zone 'Asia/Seoul'; fri timestamp;
begin
  fri := date_trunc('day', k) + make_interval(days => ((5 - extract(dow from k)::int + 7) % 7)) + interval '20 hours';
  if k >= fri then fri := fri + interval '7 days'; end if;
  draw_key := to_char(fri, 'YYYY-MM-DD');
  draw_at := fri at time zone 'Asia/Seoul';
  close_at := draw_at - interval '1 hour';
  return next;
end $$;

-- ── 직접 넣기 막기 (구매는 buy_lotto 로만) ──
revoke insert on public.lotto_tickets from authenticated;
drop policy if exists "tickets: 사기" on public.lotto_tickets;

-- ── 추첨: 시각이 지났는데 아직 안 뽑은 회차를 뽑고, 그 회차 행운권 등수를 매긴다 ──
create or replace function private.lotto_draw_due()
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.lotto_draws d
     set nums = (select array_agg(n::smallint order by n)
                   from (select n from generate_series(0, 9) n where d.draw_key is not null
                          order by gen_random_uuid() limit 4) s),
         drawn_at = now()
   where d.drawn_at is null and d.draw_at <= private.lotto_clock();
  update public.lotto_tickets t
     set rank = case cardinality(array(select unnest(t.nums) intersect select unnest(d.nums)))
                  when 4 then 1 when 3 then 2 when 2 then 3 else 0 end
    from public.lotto_draws d
   where d.draw_key = t.draw_key and d.drawn_at is not null and t.rank is null;
end $$;

-- ── 내 행운권 + 다음 추첨 정보 (부를 때마다 밀린 추첨부터 처리) ──
create or replace function public.lotto_sync()
returns jsonb language plpgsql security definer set search_path = '' as $$
declare nx record; me uuid := auth.uid();
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  perform private.lotto_draw_due();
  select * into nx from private.lotto_next(private.lotto_clock());
  return jsonb_build_object(
    'now', private.lotto_clock(),
    'next', jsonb_build_object('key', nx.draw_key, 'at', nx.draw_at, 'close', nx.close_at),
    'tickets', coalesce((select jsonb_agg(jsonb_build_object('id', t.id, 'draw', t.draw_key, 'nums', t.nums, 'rank', t.rank,
                                 'claimed', t.claimed_at is not null, 'ts', t.created_at, 'at', d.draw_at) order by t.created_at)
                         from public.lotto_tickets t join public.lotto_draws d on d.draw_key = t.draw_key
                        where t.user_id = me and t.created_at > private.lotto_clock() - interval '70 days'), '[]'::jsonb),
    'draws', coalesce((select jsonb_object_agg(d.draw_key, d.nums)
                         from public.lotto_draws d
                        where d.drawn_at is not null and d.draw_key in (select draw_key from public.lotto_tickets where user_id = me)), '{}'::jsonb));
end $$;

-- ── 구매 ── 오류: NOT_ACTIVE · BAD_NUMS · SALE_CLOSED · MAX_TICKETS · NO_SAVE · NOT_ENOUGH_GOLD
create or replace function public.buy_lotto(p_nums int[])
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); nx record; nums smallint[]; d jsonb; n int; tid uuid;
  price constant int := 200; max_per_week constant int := 2;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select array_agg(x::smallint order by x) into nums from (select distinct unnest(p_nums) x) s;
  if nums is null or cardinality(nums) <> 4 or cardinality(p_nums) <> 4 or not (0 <= all(nums) and 9 >= all(nums)) then raise exception 'BAD_NUMS'; end if;
  select * into nx from private.lotto_next(private.lotto_clock());
  if private.lotto_clock() >= nx.close_at then raise exception 'SALE_CLOSED'; end if;
  -- 세이브를 잠가서 같은 사람의 동시 구매를 줄 세운다
  select data into d from public.saves where user_id = me for update;
  if d is null or d->'me' is null then raise exception 'NO_SAVE'; end if;
  select count(*) into n from public.lotto_tickets where user_id = me and draw_key = nx.draw_key;
  if n >= max_per_week then raise exception 'MAX_TICKETS'; end if;
  if coalesce((d->'me'->>'gold')::numeric, 0) < price then raise exception 'NOT_ENOUGH_GOLD'; end if;
  update public.saves set data = jsonb_set(d, '{me,gold}', to_jsonb(coalesce((d->'me'->>'gold')::numeric, 0) - price)), updated_at = now()
   where user_id = me;
  insert into public.lotto_draws (draw_key, draw_at) values (nx.draw_key, nx.draw_at) on conflict (draw_key) do nothing;
  insert into public.lotto_tickets (user_id, draw_key, nums) values (me, nx.draw_key, nums) returning id into tid;
  return jsonb_build_object('id', tid, 'draw', nx.draw_key, 'at', nx.draw_at, 'nums', nums, 'price', price);
end $$;

-- ── 수령 ── 오류: NOT_ACTIVE · NOT_DRAWN · ALREADY_CLAIMED
create or replace function public.claim_lotto(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); t public.lotto_tickets; prize int;
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  perform private.lotto_draw_due();
  select * into t from public.lotto_tickets where id = p_id and user_id = me for update;
  if not found then raise exception 'ALREADY_CLAIMED'; end if;
  if t.rank is null then raise exception 'NOT_DRAWN'; end if;
  if t.claimed_at is not null then raise exception 'ALREADY_CLAIMED'; end if;
  update public.lotto_tickets set claimed_at = now() where id = p_id;
  prize := case t.rank when 1 then 10000 when 2 then 3000 when 3 then 100 else 0 end;
  if prize > 0 then
    update public.saves set data = jsonb_set(data, '{me,gold}', to_jsonb(coalesce((data->'me'->>'gold')::numeric, 0) + prize)), updated_at = now()
     where user_id = me and data->'me' is not null;
  end if;
  return jsonb_build_object('rank', t.rank, 'prize', prize);
end $$;

-- ── 운영: 회차별 판매·당첨 현황 ──
create or replace function public.admin_lotto(p_weeks int default 8)
returns table (draw_key text, draw_at timestamptz, nums smallint[], drawn_at timestamptz,
               tickets bigint, players bigint, r1 bigint, r2 bigint, r3 bigint, claimed bigint, paid bigint)
language plpgsql security definer set search_path = '' as $$
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  perform private.lotto_draw_due();
  return query
  select d.draw_key, d.draw_at, d.nums, d.drawn_at,
         count(t.id), count(distinct t.user_id),
         count(*) filter (where t.rank = 1), count(*) filter (where t.rank = 2), count(*) filter (where t.rank = 3),
         count(*) filter (where t.claimed_at is not null),
         coalesce(sum(case t.rank when 1 then 10000 when 2 then 3000 when 3 then 100 else 0 end) filter (where t.claimed_at is not null), 0)
    from public.lotto_draws d left join public.lotto_tickets t on t.draw_key = d.draw_key
   group by d.draw_key, d.draw_at, d.nums, d.drawn_at
   order by d.draw_at desc
   limit greatest(1, least(p_weeks, 104));
end $$;

do $$
declare f text;
begin
  foreach f in array array['public.lotto_sync()', 'public.buy_lotto(int[])', 'public.claim_lotto(uuid)', 'public.admin_lotto(int)'] loop
    execute format('revoke execute on function %s from public, anon', f);
    execute format('grant execute on function %s to authenticated', f);
  end loop;
end $$;
revoke execute on function private.lotto_draw_due() from public, anon, authenticated;
revoke execute on function private.lotto_next(timestamptz) from public, anon, authenticated;
revoke execute on function private.lotto_clock() from public, anon, authenticated;
