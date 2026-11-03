-- 019 · 4단계: 파티 레이드를 실제 블레서끼리 (모집 · 참가 · 준비 · 출발 · 공유 전투 · 파티 채팅)
-- 방식: 파티장 화면이 전투를 돌린다(전투 엔진은 게임 안에 있음).
--   · 파티장은 매 턴(그리고 누가 행동을 정할 때마다) 전투 상태를 party_state에 올린다 → 파티원 화면이 그대로 그린다.
--   · 파티원은 자기 행동만 party_acts에 올린다 → 파티장 화면이 받아 그 턴에 넣는다.
--   · 모든 쓰기는 서버 함수로만(누가 썼는지 서버가 확인). 실시간 전달은 postgres_changes(RLS: 그 방 사람만 받음).
-- 범위: 파티 레이드·토벌전(그리드 없는 전투). 던전 파티·만신전은 아직 이 기기 안에서만.
-- 이름·직업·레벨은 서버 프로필에서 가져온다(016으로 프로필 레벨 = 세이브 레벨). 장비·능력치 보너스(card)는 게임이 보냄.

-- ── 표 ──
create table if not exists public.party_rooms (
  id          uuid primary key default gen_random_uuid(),
  leader      uuid not null references public.profiles(user_id) on delete cascade,
  monster_id  text not null check (length(monster_id) between 1 and 64),
  name        text not null check (char_length(name) between 1 and 16),
  target      int  not null check (target between 1 and 8),
  visibility  text not null default 'public' check (visibility in ('public','invite')),
  status      text not null default 'gather' check (status in ('gather','battle','closed')),
  members     jsonb not null default '[]'::jsonb,   -- [{uid,name,job,level,ready,card}] 실제 블레서(파티장 포함)
  extra       jsonb not null default '[]'::jsonb,   -- 용병 [{name,job,level}] (파티장이 채움)
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists party_rooms_open on public.party_rooms (status, updated_at desc);
create index if not exists party_rooms_leader on public.party_rooms (leader);

create table if not exists public.party_state (
  room_id     uuid primary key references public.party_rooms(id) on delete cascade,
  rev         int not null default 0,
  state       jsonb not null,
  updated_at  timestamptz not null default now()
);
create table if not exists public.party_acts (
  room_id     uuid not null references public.party_rooms(id) on delete cascade,
  uid         uuid not null references public.profiles(user_id) on delete cascade,
  turn        int not null,
  action      jsonb,                      -- null = 행동 취소(수정 중)
  updated_at  timestamptz not null default now(),
  primary key (room_id, uid)
);
create table if not exists public.party_msgs (
  id          bigint generated always as identity primary key,
  room_id     uuid not null references public.party_rooms(id) on delete cascade,
  uid         uuid not null references public.profiles(user_id) on delete cascade,
  name        text not null,
  text        text not null check (char_length(text) between 1 and 200),
  created_at  timestamptz not null default now()
);
create index if not exists party_msgs_room on public.party_msgs (room_id, id);

-- 방 사람인지(파티장 포함)
create or replace function public.party_is_member(p_room uuid)
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.party_rooms r where r.id = p_room
                  and (r.leader = auth.uid() or r.members @> jsonb_build_array(jsonb_build_object('uid', auth.uid()))))
$$;
revoke execute on function public.party_is_member(uuid) from public, anon;
grant execute on function public.party_is_member(uuid) to authenticated;

alter table public.party_rooms enable row level security;
alter table public.party_state enable row level security;
alter table public.party_acts  enable row level security;
alter table public.party_msgs  enable row level security;
revoke all on public.party_rooms, public.party_state, public.party_acts, public.party_msgs from anon, authenticated;
grant select on public.party_rooms, public.party_state, public.party_acts, public.party_msgs to authenticated;
drop policy if exists "party rooms: 열린 방·내 방" on public.party_rooms;
create policy "party rooms: 열린 방·내 방" on public.party_rooms for select to authenticated
  using (status <> 'closed' or public.party_is_member(id));
drop policy if exists "party state: 방 사람만" on public.party_state;
create policy "party state: 방 사람만" on public.party_state for select to authenticated using (public.party_is_member(room_id));
drop policy if exists "party acts: 방 사람만" on public.party_acts;
create policy "party acts: 방 사람만" on public.party_acts for select to authenticated using (public.party_is_member(room_id));
drop policy if exists "party msgs: 방 사람만" on public.party_msgs;
create policy "party msgs: 방 사람만" on public.party_msgs for select to authenticated using (public.party_is_member(room_id));

-- ── 도우미 ──
-- 프로필에서 파티원 한 명(card는 게임이 보낸 장비·보너스 · 4KB까지)
create or replace function private.party_member(u uuid, p_card jsonb, p_ready boolean)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare p record;
begin
  select name, job, level into p from public.profiles where user_id = u;
  if p.name is null then raise exception 'NO_PROFILE'; end if;
  if p_card is not null and (jsonb_typeof(p_card) <> 'object' or length(p_card::text) > 4000) then raise exception 'BAD_CARD'; end if;
  return jsonb_build_object('uid', u, 'name', p.name, 'job', coalesce(p.job, 'defender'), 'level', coalesce(p.level, 1),
                            'ready', coalesce(p_ready, false), 'card', coalesce(p_card, '{}'::jsonb));
end $$;
-- 다른 방에서 나가기(한 사람은 열린 방 하나만): 내가 파티장이면 그 방을 닫는다
create or replace function private.party_drop(u uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.party_rooms set status = 'closed', updated_at = now()
   where leader = u and status <> 'closed' and id is distinct from keep;
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> u),
         updated_at = now()
   where r.status <> 'closed' and r.id is distinct from keep and r.leader <> u
     and r.members @> jsonb_build_array(jsonb_build_object('uid', u));
end $$;
revoke execute on function private.party_member(uuid, jsonb, boolean) from public, anon, authenticated;
revoke execute on function private.party_drop(uuid, uuid) from public, anon, authenticated;

-- ── 서버 함수 ── 오류: NOT_ACTIVE · NO_ROOM · NOT_LEADER · NOT_MEMBER · FULL · NOT_GATHER · NOT_BATTLE · BAD_*
create or replace function public.party_create(p_monster text, p_name text, p_target int, p_vis text default 'public', p_card jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  if p_target is null or p_target < 1 or p_target > 8 then raise exception 'BAD_TARGET'; end if;
  perform private.party_drop(me, null);
  insert into public.party_rooms (leader, monster_id, name, target, visibility, members)
  values (me, p_monster, left(coalesce(nullif(btrim(p_name), ''), '파티'), 16), p_target,
          case when p_vis = 'invite' then 'invite' else 'public' end,
          jsonb_build_array(private.party_member(me, p_card, false)))
  returning id into rid;
  return rid;
end $$;

create or replace function public.party_join(p_room uuid, p_card jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.party_rooms;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select * into r from public.party_rooms where id = p_room for update;
  if r.id is null or r.status = 'closed' then raise exception 'NO_ROOM'; end if;
  if r.members @> jsonb_build_array(jsonb_build_object('uid', me)) then return to_jsonb(r); end if;
  if r.status <> 'gather' then raise exception 'NOT_GATHER'; end if;
  if jsonb_array_length(r.members) + jsonb_array_length(r.extra) >= r.target then raise exception 'FULL'; end if;
  perform private.party_drop(me, p_room);
  update public.party_rooms set members = members || jsonb_build_array(private.party_member(me, p_card, false)), updated_at = now()
   where id = p_room returning * into r;
  return to_jsonb(r);
end $$;

create or replace function public.party_leave(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  update public.party_rooms set status = 'closed', updated_at = now() where id = p_room and leader = me and status <> 'closed';
  if found then return; end if;
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> me),
         updated_at = now()
   where r.id = p_room and r.members @> jsonb_build_array(jsonb_build_object('uid', me));
end $$;

create or replace function public.party_ready(p_room uuid, p_ready boolean, p_card jsonb default null)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  update public.party_rooms r
     set members = (select jsonb_agg(case when (x->>'uid')::uuid = me
                                          then private.party_member(me, coalesce(p_card, x->'card'), p_ready) else x end)
                      from jsonb_array_elements(r.members) x),
         updated_at = now()
   where r.id = p_room and r.status = 'gather' and r.members @> jsonb_build_array(jsonb_build_object('uid', me));
  if not found then raise exception 'NOT_MEMBER'; end if;
end $$;

-- 파티장: 용병 목록·공개 범위·마감 인원 (살아 있다는 신호도 겸함)
create or replace function public.party_set(p_room uuid, p_extra jsonb, p_vis text default null, p_target int default null)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); e jsonb;
begin
  if p_extra is null or jsonb_typeof(p_extra) <> 'array' or jsonb_array_length(p_extra) > 8 then raise exception 'BAD_EXTRA'; end if;
  for e in select * from jsonb_array_elements(p_extra) loop
    if jsonb_typeof(e) <> 'object' or char_length(coalesce(e->>'name', '')) not between 1 and 20
       or coalesce(e->>'job', '') not in ('defender','warrior','knight','infighter','mystic','destroyer','mage','salamander','shooter','dualist','priest','demigod','summoner')
       or jsonb_typeof(e->'level') <> 'number' or (e->>'level')::numeric not between 1 and 99 then raise exception 'BAD_EXTRA'; end if;
  end loop;
  if p_target is not null and (p_target < 1 or p_target > 8) then raise exception 'BAD_TARGET'; end if;
  update public.party_rooms
     set extra = (select coalesce(jsonb_agg(jsonb_build_object('name', x->>'name', 'job', x->>'job', 'level', (x->>'level')::int)), '[]'::jsonb)
                    from jsonb_array_elements(p_extra) x),
         visibility = case when p_vis in ('public','invite') then p_vis else visibility end,
         target = coalesce(p_target, target),
         updated_at = now()
   where id = p_room and leader = me and status <> 'closed';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

create or replace function public.party_kick(p_room uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if p_uid = me then raise exception 'SELF'; end if;
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> p_uid),
         updated_at = now()
   where r.id = p_room and r.leader = me and r.status = 'gather';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

create or replace function public.party_start(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.party_rooms set status = 'battle', updated_at = now() where id = p_room and leader = me and status = 'gather';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

-- 파티장: 전투 상태 올리기(200KB까지). p_over면 방을 닫는다
create or replace function public.party_push(p_room uuid, p_state jsonb, p_rev int, p_over boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if not exists (select 1 from public.party_rooms where id = p_room and leader = me and status = 'battle') then raise exception 'NOT_BATTLE'; end if;
  if p_state is null or jsonb_typeof(p_state) <> 'object' or length(p_state::text) > 200000 then raise exception 'BAD_STATE'; end if;
  insert into public.party_state (room_id, rev, state, updated_at) values (p_room, coalesce(p_rev, 0), p_state, now())
    on conflict (room_id) do update set rev = excluded.rev, state = excluded.state, updated_at = now();
  update public.party_rooms set updated_at = now(), status = case when p_over then 'closed' else status end where id = p_room;
end $$;

-- 파티원: 이번 턴 내 행동(2KB까지, null = 취소)
create or replace function public.party_act(p_room uuid, p_turn int, p_action jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if not exists (select 1 from public.party_rooms r where r.id = p_room and r.status = 'battle'
                  and r.members @> jsonb_build_array(jsonb_build_object('uid', me))) then raise exception 'NOT_BATTLE'; end if;
  if p_action is not null and (jsonb_typeof(p_action) <> 'object' or length(p_action::text) > 2000) then raise exception 'BAD_ACTION'; end if;
  insert into public.party_acts (room_id, uid, turn, action, updated_at) values (p_room, me, p_turn, p_action, now())
    on conflict (room_id, uid) do update set turn = excluded.turn, action = excluded.action, updated_at = now();
end $$;

create or replace function public.party_say(p_room uuid, p_text text)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); nm text;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  if not public.party_is_member(p_room) then raise exception 'NOT_MEMBER'; end if;
  select name into nm from public.profiles where user_id = me;
  insert into public.party_msgs (room_id, uid, name, text) values (p_room, me, coalesce(nm, '블레서'), left(btrim(p_text), 200));
end $$;

do $$ declare f text; begin
  foreach f in array array['party_create(text,text,int,text,jsonb)','party_join(uuid,jsonb)','party_leave(uuid)','party_ready(uuid,boolean,jsonb)',
    'party_set(uuid,jsonb,text,int)','party_kick(uuid,uuid)','party_start(uuid)','party_push(uuid,jsonb,int,boolean)','party_act(uuid,int,jsonb)','party_say(uuid,text)'] loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- ── 실시간 ──
do $$ declare t text; begin
  foreach t in array array['party_rooms','party_state','party_acts','party_msgs'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
