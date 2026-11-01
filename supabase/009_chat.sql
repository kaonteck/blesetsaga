-- 009 · 채팅 서버 연결 보완
-- 표(chat_messages · direct_messages)는 005에서 만들었다. 여기서는 게임과 맞추고 도배를 막는다.
--  1) 월드 채널 분류에 '점검(maint)' 추가 (게임의 WCAT = 공지·업데이트·점검)
--  2) 서버에서도 너무 빠른 연속 전송 막기: 5초 안에 4개를 넘게 보내면 TOO_FAST (운영자는 제외)
--     게임은 1.2초 간격으로 막지만, 게임을 거치지 않고 보내는 경우를 대비한다.
--  3) 보낸 사람별 최근 메시지 찾기용 인덱스 (도배 검사·운영 페이지)

alter table public.chat_messages drop constraint if exists chat_messages_cat_check;
alter table public.chat_messages add constraint chat_messages_cat_check check (cat is null or cat in ('notice','update','maint'));

create index if not exists chat_author_recent on public.chat_messages (author, created_at desc);
create index if not exists dm_sender_recent on public.direct_messages (sender, created_at desc);

create or replace function private.chat_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if public.is_admin() then return new; end if;
  if tg_table_name = 'chat_messages' then
    select count(*) into n from public.chat_messages where author = auth.uid() and created_at > now() - interval '5 seconds';
  else
    select count(*) into n from public.direct_messages where sender = auth.uid() and created_at > now() - interval '5 seconds';
  end if;
  if n >= 4 then raise exception 'TOO_FAST'; end if;
  return new;
end $$;
revoke execute on function private.chat_rate_limit() from public, anon, authenticated;

drop trigger if exists chat_rate on public.chat_messages;
create trigger chat_rate before insert on public.chat_messages for each row execute function private.chat_rate_limit();
drop trigger if exists dm_rate on public.direct_messages;
create trigger dm_rate before insert on public.direct_messages for each row execute function private.chat_rate_limit();

-- ── (함께) 프로필 상태에 '식사 중(meal)' 추가 — 게임 STATUS에 새로 생김(메인, 2026-11-01) ──
alter table public.profiles drop constraint if exists profiles_status_check;
alter table public.profiles add constraint profiles_status_check check (status in ('online','away','raid','meal','offline'));

-- ── (함께) 행운권 수령 오류 이름 정리 — 체크 요청 ──
-- 남의 것·없는 행운권을 받으려 할 때 ALREADY_CLAIMED 대신 NOT_FOUND. 동작은 같다.
create or replace function public.claim_lotto(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare me uuid := auth.uid(); t public.lotto_tickets; prize int;
begin
  if me is null then raise exception 'NOT_ACTIVE'; end if;
  perform private.lotto_draw_due();
  select * into t from public.lotto_tickets where id = p_id and user_id = me for update;
  if not found then raise exception 'NOT_FOUND'; end if;
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
revoke execute on function public.claim_lotto(uuid) from public, anon;
grant execute on function public.claim_lotto(uuid) to authenticated;
