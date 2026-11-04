-- 022 · 019 파티 공유 보완 (체크 보류 요청, 2026-11-04)
--  ① 초대 전용 방(visibility='invite'): 파티장이 초대한 사람(invited)만 참가. 초대는 party_invite(파티장만).
--  ② 파티원 card(장비·강화·보너스·남은 체력) 값 검사: 내 세이브에 있는 장비 · 게임 목록(item_catalog)의 장비 · 착용 레벨 ≤ 내 레벨,
--     강화 0~10, 보너스는 maxHp·atk·def·luk 0~500, 체력 0~1. 아니면 BAD_CARD.
--  (파티원 보상은 게임 쪽에서 자기 몬스터 규칙으로 계산 — 08-server.js ptTrust)

alter table public.party_rooms add column if not exists invited uuid[] not null default '{}';

create or replace function private.party_member(u uuid, p_card jsonb, p_ready boolean)
returns jsonb language plpgsql stable security definer set search_path = '' as $$
declare p record; sv jsonb; k text; v jsonb; lv int;
begin
  select name, job, level into p from public.profiles where user_id = u;
  if p.name is null then raise exception 'NO_PROFILE'; end if;
  p_card := coalesce(p_card, '{}'::jsonb);
  if jsonb_typeof(p_card) <> 'object' or length(p_card::text) > 4000 then raise exception 'BAD_CARD'; end if;
  if exists (select 1 from jsonb_object_keys(p_card) x where x not in ('equip','enh','bonus','hp')) then raise exception 'BAD_CARD'; end if;
  select s.data->'me' into sv from public.saves s where s.user_id = u;
  sv := coalesce(sv, '{}'::jsonb);
  -- 장비: 슬롯 3개만, 게임 장비 · 레벨 이하 · 내 세이브(인벤토리 또는 장착)에 있는 것
  if p_card ? 'equip' then
    if jsonb_typeof(p_card->'equip') <> 'object' then raise exception 'BAD_CARD'; end if;
    for k, v in select * from jsonb_each(p_card->'equip') loop
      if k not in ('weapon','armor','acc') then raise exception 'BAD_CARD'; end if;
      if jsonb_typeof(v) = 'null' then continue; end if;
      if jsonb_typeof(v) <> 'string' then raise exception 'BAD_CARD'; end if;
      select ic.lvl into lv from public.item_catalog ic where ic.id = (v #>> '{}') and ic.type = 'equip';
      if not found then
        -- 운영 페이지에서 공개한 장비도 인정(착용 레벨은 그 값)
        select coalesce((ct.data->>'levelReq')::int, 0) into lv from public.content ct
         where ct.kind = 'item' and ct.id = (v #>> '{}') and ct.data->>'type' = 'equip';
        if not found then raise exception 'BAD_CARD'; end if;
      end if;
      if lv > coalesce(p.level, 1) then raise exception 'BAD_CARD'; end if;
      if not (coalesce((sv->'inv'->>(v #>> '{}'))::numeric, 0) >= 1
              or exists (select 1 from jsonb_each_text(case when jsonb_typeof(sv->'equip') = 'object' then sv->'equip' else '{}'::jsonb end) e
                          where e.value = (v #>> '{}'))) then raise exception 'BAD_CARD'; end if;
    end loop;
  end if;
  if p_card ? 'enh' then
    if jsonb_typeof(p_card->'enh') <> 'object' then raise exception 'BAD_CARD'; end if;
    for k, v in select * from jsonb_each(p_card->'enh') loop
      if jsonb_typeof(v) <> 'number' or (v #>> '{}')::numeric < 0 or (v #>> '{}')::numeric > 10 then raise exception 'BAD_CARD'; end if;
    end loop;
  end if;
  if p_card ? 'bonus' then
    if jsonb_typeof(p_card->'bonus') <> 'object' then raise exception 'BAD_CARD'; end if;
    for k, v in select * from jsonb_each(p_card->'bonus') loop
      if k not in ('maxHp','atk','def','luk') or jsonb_typeof(v) <> 'number'
         or (v #>> '{}')::numeric < 0 or (v #>> '{}')::numeric > 500 then raise exception 'BAD_CARD'; end if;
    end loop;
  end if;
  if p_card ? 'hp' and (jsonb_typeof(p_card->'hp') <> 'number' or (p_card->>'hp')::numeric < 0 or (p_card->>'hp')::numeric > 1) then
    raise exception 'BAD_CARD';
  end if;
  return jsonb_build_object('uid', u, 'name', p.name, 'job', coalesce(p.job, 'defender'), 'level', coalesce(p.level, 1),
                            'ready', coalesce(p_ready, false), 'card', p_card);
end $$;
revoke execute on function private.party_member(uuid, jsonb, boolean) from public, anon, authenticated;

create or replace function public.party_join(p_room uuid, p_card jsonb default '{}'::jsonb)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); r public.party_rooms;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  select * into r from public.party_rooms where id = p_room for update;
  if r.id is null or r.status = 'closed' then raise exception 'NO_ROOM'; end if;
  if r.members @> jsonb_build_array(jsonb_build_object('uid', me)) then return to_jsonb(r); end if;
  if r.status <> 'gather' then raise exception 'NOT_GATHER'; end if;
  if r.visibility = 'invite' and not (me = any(r.invited)) then raise exception 'NOT_INVITED'; end if;
  if jsonb_array_length(r.members) + jsonb_array_length(r.extra) >= r.target then raise exception 'FULL'; end if;
  perform private.party_drop(me, p_room);
  update public.party_rooms set members = members || jsonb_build_array(private.party_member(me, p_card, false)), updated_at = now()
   where id = p_room returning * into r;
  return to_jsonb(r);
end $$;

-- 파티장: 실제 블레서 초대(초대 전용 방에 들어올 수 있게). 최대 20명
create or replace function public.party_invite(p_room uuid, p_uid uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid();
begin
  if p_uid is null or p_uid = me then raise exception 'SELF'; end if;
  if not exists (select 1 from public.profiles where user_id = p_uid) then raise exception 'NO_PLAYER'; end if;
  update public.party_rooms
     set invited = case when p_uid = any(invited) then invited else (invited || p_uid)[greatest(1, cardinality(invited) - 18):] end,
         updated_at = now()
   where id = p_room and leader = me and status = 'gather';
  if not found then raise exception 'NOT_LEADER'; end if;
end $$;
revoke execute on function public.party_invite(uuid, uuid) from public, anon;
grant execute on function public.party_invite(uuid, uuid) to authenticated;
