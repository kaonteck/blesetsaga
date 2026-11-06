-- 030 만신전 두 방 (메인 2026-11-07, 유저 요청) — 운영자가 만신전을 띄우면 같은 보스·같은 마감·같은 정원의 방을 두 개 연다.
-- 두 방은 meta.grp(같은 출현 묶음)와 meta.slot(1·2)로 구분. 원정대·공대장·출발·전투는 방마다 따로(026 그대로).
-- 한 사람은 한 방에만: 다른 방에 참가하면 026 party_drop이 예전 방 원정대에서 빼 줌. 반환값은 1방 id(예전 호출과 같은 모양).
create or replace function public.mass_spawn(p_monster text, p_minutes int, p_target int, p_meta jsonb default '{}'::jsonb)
returns uuid language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); rid uuid; first uuid; g uuid := gen_random_uuid(); i int;
begin
  if me is null or not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  if p_monster is null or length(p_monster) not between 1 and 64 then raise exception 'BAD_MONSTER'; end if;
  if p_minutes is null or p_minutes < 1 or p_minutes > 180 then raise exception 'BAD_TIME'; end if;
  if p_target is null or p_target < 1 or p_target > 20 then raise exception 'BAD_TARGET'; end if;
  p_meta := coalesce(p_meta, '{}'::jsonb);
  if jsonb_typeof(p_meta) <> 'object' or length(p_meta::text) > 1000 then raise exception 'BAD_META'; end if;
  update public.party_rooms set status = 'closed', updated_at = now() where kind = 'mass' and status = 'gather';
  for i in 1..2 loop
    insert into public.party_rooms (leader, spawner, kind, monster_id, name, target, visibility, status, members, until, meta)
    values (me, me, 'mass', p_monster, '만신전 ' || i || '방', p_target, 'public', 'gather', '[]'::jsonb, now() + make_interval(mins => p_minutes),
            p_meta || jsonb_build_object('grp', g::text, 'slot', i))
    returning id into rid;
    if i = 1 then first := rid; end if;
  end loop;
  return first;
end $$;
revoke execute on function public.mass_spawn(text, int, int, jsonb) from public, anon;
grant execute on function public.mass_spawn(text, int, int, jsonb) to authenticated;
