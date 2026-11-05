-- 026 · 4단계: 만신전을 실제 블레서끼리 (2026-11-05)
-- 방식: 운영자가 만신전을 띄우면 party_rooms에 kind='mass' 방이 생긴다(집결 마감 until · 출현 정보 meta).
--   · 모든 블레서가 모집 중인 만신전 방을 읽고(019 정책: 닫히지 않은 방은 누구나 읽음), mass_join으로 원정대에 들어간다.
--   · 공대장(전투를 돌리는 화면) = 원정대에 먼저 들어온 블레서. 나가면 다음 사람에게 넘어간다(아무도 없으면 띄운 운영자).
--   · 출발(mass_start)은 공대장이, 집결 마감 10초가 지나도 출발하지 않았으면 원정대 누구나(그 사람이 공대장이 됨).
--   · 전투·행동·채팅은 019 그대로(party_state·party_acts·party_msgs, 방 사람만). 빈자리는 공대장 화면의 연습용 동료(봇).
-- 그 밖: 방 정원 상한 8 → 20(만신전용, 파티 레이드 함수는 그대로 8까지) · 파티 함수는 만신전 방에 쓰지 못하게.

alter table public.party_rooms add column if not exists kind    text not null default 'party';
alter table public.party_rooms add column if not exists until   timestamptz;
alter table public.party_rooms add column if not exists meta    jsonb not null default '{}'::jsonb;
alter table public.party_rooms add column if not exists spawner uuid references public.profiles(user_id) on delete set null;
do $$ begin
  alter table public.party_rooms add constraint party_rooms_kind_check check (kind in ('party','mass'));
exception when duplicate_object then null; end $$;
alter table public.party_rooms drop constraint if exists party_rooms_target_check;
alter table public.party_rooms add constraint party_rooms_target_check check (target between 1 and 20);
do $$ begin
  alter table public.party_rooms add constraint party_rooms_meta_check check (jsonb_typeof(meta) = 'object' and length(meta::text) <= 1000);
exception when duplicate_object then null; end $$;
create index if not exists party_rooms_mass on public.party_rooms (kind, status, until desc);

-- 만신전 방에서 한 명 빼기(공대장이면 다음 사람에게, 아무도 없으면 띄운 운영자)
create or replace function private.mass_out(u uuid, p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
begin
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> u),
         leader = case when r.leader <> u then r.leader
                       else coalesce((select (x->>'uid')::uuid from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> u limit 1), r.spawner, r.leader) end,
         updated_at = now()
   where r.id = p_room and r.kind = 'mass' and r.status <> 'closed'
     and r.members @> jsonb_build_array(jsonb_build_object('uid', u));
end $$;
revoke execute on function private.mass_out(uuid, uuid) from public, anon, authenticated;

-- 다른 방에서 빠지기(019): 내가 연 파티 방은 닫고, 만신전 방은 원정대에서만 빠짐(이벤트는 그대로)
create or replace function private.party_drop(u uuid, keep uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare rid uuid;
begin
  update public.party_rooms set status = 'closed', updated_at = now()
   where leader = u and kind = 'party' and status <> 'closed' and id is distinct from keep;
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> u),
         updated_at = now()
   where r.kind = 'party' and r.status <> 'closed' and r.id is distinct from keep and r.leader <> u
     and r.members @> jsonb_build_array(jsonb_build_object('uid', u));
  for rid in select id from public.party_rooms where kind = 'mass' and status = 'gather' and id is distinct from keep
               and members @> jsonb_build_array(jsonb_build_object('uid', u)) loop
    perform private.mass_out(u, rid);
  end loop;
end $$;
revoke execute on function private.party_drop(uuid, uuid) from public, anon, authenticated;

-- ── 파티 함수: 만신전 방에는 쓰지 못하게(만신전 함수로만) ──
create or replace function public.party_join(p_room uuid, p_card jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.party_rooms;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select * into r from public.party_rooms where id = p_room for update;
  if r.id is null or r.status = 'closed' or r.kind <> 'party' then raise exception 'NO_ROOM'; end if;
  if r.members @> jsonb_build_array(jsonb_build_object('uid', me)) then return to_jsonb(r); end if;
  if r.status <> 'gather' then raise exception 'NOT_GATHER'; end if;
  if r.visibility = 'invite' and not (me = any(r.invited)) then raise exception 'NOT_INVITED'; end if;
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
  if exists (select 1 from public.party_rooms where id = p_room and kind = 'mass') then perform private.mass_out(me, p_room); return; end if;
  update public.party_rooms set status = 'closed', updated_at = now() where id = p_room and leader = me and status <> 'closed';
  if found then return; end if;
  update public.party_rooms r
     set members = (select coalesce(jsonb_agg(x), '[]'::jsonb) from jsonb_array_elements(r.members) x where (x->>'uid')::uuid <> me),
         updated_at = now()
   where r.id = p_room and r.members @> jsonb_build_array(jsonb_build_object('uid', me));
end $$;

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
   where id = p_room and leader = me and status <> 'closed' and kind = 'party';
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
   where r.id = p_room and r.leader = me and r.status = 'gather' and r.kind = 'party';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

create or replace function public.party_start(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.party_rooms set status = 'battle', updated_at = now() where id = p_room and leader = me and status = 'gather' and kind = 'party';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

-- ── 만신전 함수 ── 오류: NOT_ADMIN · NOT_ACTIVE · NO_ROOM · NOT_GATHER · FULL · NOT_LEADER · BAD_*
-- 운영자: 만신전 띄우기(이미 모집 중인 만신전은 닫음)
create or replace function public.mass_spawn(p_monster text, p_minutes int, p_target int, p_meta jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); rid uuid;
begin
  if me is null or not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_monster is null or length(p_monster) not between 1 and 64 then raise exception 'BAD_MONSTER'; end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 180 then raise exception 'BAD_TIME'; end if;
  if p_target is null or p_target < 1 or p_target > 20 then raise exception 'BAD_TARGET'; end if;
  p_meta := coalesce(p_meta, '{}'::jsonb);
  if jsonb_typeof(p_meta) <> 'object' or length(p_meta::text) > 1000 then raise exception 'BAD_META'; end if;
  update public.party_rooms set status = 'closed', updated_at = now() where kind = 'mass' and status = 'gather';
  insert into public.party_rooms (leader, spawner, kind, monster_id, name, target, visibility, status, members, until, meta)
  values (me, me, 'mass', p_monster, '만신전', p_target, 'public', 'gather', '[]'::jsonb, now() + make_interval(mins => p_minutes), p_meta)
  returning id into rid;
  return rid;
end $$;

-- 원정대 참가(처음 들어온 블레서가 공대장)
create or replace function public.mass_join(p_room uuid, p_card jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.party_rooms;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select * into r from public.party_rooms where id = p_room for update;
  if r.id is null or r.kind <> 'mass' or r.status = 'closed' then raise exception 'NO_ROOM'; end if;
  if r.members @> jsonb_build_array(jsonb_build_object('uid', me)) then return to_jsonb(r); end if;
  if r.status <> 'gather' or r.until < now() then raise exception 'NOT_GATHER'; end if;
  if jsonb_array_length(r.members) >= r.target then raise exception 'FULL'; end if;
  perform private.party_drop(me, p_room);
  update public.party_rooms
     set members = members || jsonb_build_array(private.party_member(me, p_card, true)),
         leader = case when members @> jsonb_build_array(jsonb_build_object('uid', leader)) then leader else me end,
         updated_at = now()
   where id = p_room returning * into r;
  return to_jsonb(r);
end $$;

-- 집결 취소
create or replace function public.mass_leave(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  if not exists (select 1 from public.party_rooms where id = p_room and kind = 'mass' and status = 'gather') then raise exception 'NOT_GATHER'; end if;
  perform private.mass_out(me, p_room);
end $$;

-- 출발: 공대장 · 또는 집결 마감 10초가 지나도 출발하지 않았으면 원정대 누구나(그 사람이 공대장)
create or replace function public.mass_start(p_room uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  update public.party_rooms set status = 'battle', leader = me, updated_at = now()
   where id = p_room and kind = 'mass' and status = 'gather'
     and members @> jsonb_build_array(jsonb_build_object('uid', me))
     and (leader = me or until < now() - interval '10 seconds');
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;

revoke execute on function public.mass_spawn(text, int, int, jsonb), public.mass_join(uuid, jsonb), public.mass_leave(uuid), public.mass_start(uuid) from public, anon;
grant execute on function public.mass_spawn(text, int, int, jsonb), public.mass_join(uuid, jsonb), public.mass_leave(uuid), public.mass_start(uuid) to authenticated;
