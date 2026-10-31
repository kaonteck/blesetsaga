-- 007 · 유저끼리 우편 (골드·아이템 선물) — 보내는 사람에게서 차감
-- 우편은 원래 유저끼리 골드·아이템을 주고받는 시스템이다(사용자 확인).
-- 선물은 반드시 send_mail()로만 보낸다: 보내는 사람의 서버 세이브에 그만큼 있는지 확인하고, 세이브에서 빼고, 우편을 만드는 것을 한 번에 한다.
-- 표에 직접 넣는 우편은 글만 된다(첨부를 넣으면 막힘) → 차감 없이 선물을 만들어 보내는 길이 없다.
-- 게임(08-server.js)은 보내기 직전에 세이브를 서버에 올리고 → send_mail → 성공하면 자기 화면에서도 같은 만큼 뺀다.

-- 1) 직접 넣기는 글만
revoke insert (items, gold) on public.mail from authenticated;
drop policy if exists "mail: 유저끼리 보내기" on public.mail;
drop policy if exists "mail: 유저끼리 보내기 (글만)" on public.mail;
create policy "mail: 유저끼리 보내기 (글만)" on public.mail for insert to authenticated
  with check (sender = (select auth.uid()) and recipient <> (select auth.uid()) and (select public.is_active())
              and items = '{}'::jsonb and gold = 0);

-- 2) 받은 우편은 언제든 지울 수 있다 (받지 않은 선물도 함께 사라짐 — 게임 화면도 그렇게 안내)
drop policy if exists "mail: 내 우편 지우기" on public.mail;
create policy "mail: 내 우편 지우기" on public.mail for delete to authenticated
  using (recipient = (select auth.uid()));

-- 3) 보내기
--   p_items: {"아이템id": 개수, ...} 최대 3종, p_gold: 0 이상
--   오류: NOT_ACTIVE(정지) · NO_RECIPIENT · SELF · BAD_TEXT · BAD_ITEMS · NO_SAVE · NOT_ENOUGH_GOLD · NOT_ENOUGH:<아이템id>
create or replace function public.send_mail(p_to uuid, p_text text, p_items jsonb default '{}'::jsonb, p_gold int default 0)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare
  me uuid := auth.uid();
  items jsonb := coalesce(p_items, '{}'::jsonb);
  gold int := coalesce(p_gold, 0);
  txt text := btrim(coalesce(p_text, ''));
  d jsonb; k text; n int; have int; equipped int; mid uuid;
begin
  if me is null or not public.is_active() then raise exception 'NOT_ACTIVE'; end if;
  if p_to is null or not exists (select 1 from public.profiles where user_id = p_to) then raise exception 'NO_RECIPIENT'; end if;
  if p_to = me then raise exception 'SELF'; end if;
  if char_length(txt) > 200 then raise exception 'BAD_TEXT'; end if;
  if jsonb_typeof(items) <> 'object' or (select count(*) from jsonb_object_keys(items)) > 3 then raise exception 'BAD_ITEMS'; end if;
  for k, n in select key, (value #>> '{}')::int from jsonb_each(items) loop
    if k !~ '^[A-Za-z0-9_\-]{1,64}$' or k = '_gold' or n is null or n < 1 or n > 100000 then raise exception 'BAD_ITEMS'; end if;
  end loop;
  if gold < 0 or gold > 1000000000 then raise exception 'BAD_ITEMS'; end if;
  if txt = '' and items = '{}'::jsonb and gold = 0 then raise exception 'BAD_TEXT'; end if;

  -- 보내는 사람 세이브를 잠그고 확인·차감
  if items <> '{}'::jsonb or gold > 0 then
    select data into d from public.saves where user_id = me for update;
    if d is null or d->'me' is null then raise exception 'NO_SAVE'; end if;
    if coalesce((d->'me'->>'gold')::numeric, 0) < gold then raise exception 'NOT_ENOUGH_GOLD'; end if;
    for k, n in select key, (value #>> '{}')::int from jsonb_each(items) loop
      have := coalesce((d->'me'->'inv'->>k)::int, 0);
      select count(*) into equipped from jsonb_each_text(coalesce(d->'me'->'equip', '{}'::jsonb)) e where e.value = k;
      if have - least(equipped, 1) < n then raise exception 'NOT_ENOUGH:%', k; end if;
      d := jsonb_set(d, array['me','inv',k], to_jsonb(have - n));
    end loop;
    d := jsonb_set(d, '{me,gold}', to_jsonb(coalesce((d->'me'->>'gold')::numeric, 0) - gold));
    update public.saves set data = d, updated_at = now() where user_id = me;
  end if;

  insert into public.mail (recipient, sender, text, items, gold)
  values (p_to, me, case when txt = '' then '(선물)' else txt end, items, gold)
  returning id into mid;
  return jsonb_build_object('id', mid, 'gold', gold, 'items', items);
end $$;
revoke execute on function public.send_mail(uuid, text, jsonb, int) from public, anon;
grant execute on function public.send_mail(uuid, text, jsonb, int) to authenticated;
