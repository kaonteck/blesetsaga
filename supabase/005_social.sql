-- 005 · 공유 데이터 (다른 유저와 함께 보는 것): 프로필 · 피드 · 채팅 · 귓속말 · 우편 · 문의 · 신고 · 낚시 랭킹 · 행운권
-- 지금은 전부 각자 세이브(S) 안에 있다. 이 표들이 생기면 08-server.js가 하나씩 서버로 옮긴다.
-- 글자 수 제한은 게임 입력창(maxlength)과 같게 맞췄다.
-- 주의: 골드·아이템이 걸린 부분(우편 첨부, 행운권 구매)은 아직 클라이언트를 믿는다. 서버 검증은 5단계.

-- ── 프로필 (다른 유저에게 보이는 캐릭터 정보) ───────────────
create table if not exists public.profiles (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  username     text not null unique,                       -- 로그인 아이디
  name         text check (name is null or char_length(name) between 2 and 10),  -- 캐릭터 이름
  job          text,
  level        int not null default 1 check (level between 1 and 999),
  title        text,                                       -- 장착 칭호 id
  memo         text check (memo is null or char_length(memo) <= 40),  -- 공개 한줄메모
  status       text not null default 'offline' check (status in ('online','away','raid','offline')),
  last_seen    timestamptz not null default now(),
  banned_until timestamptz,                                -- 운영자만 바꿈
  ban_reason   text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create unique index if not exists profiles_name_unique on public.profiles (lower(name)) where name is not null;
create index if not exists profiles_seen on public.profiles (last_seen desc);

alter table public.profiles enable row level security;
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;
-- 본인이 바꿀 수 있는 칸만 열어 둔다 (정지·아이디는 못 바꿈)
grant update (name, job, level, title, memo, status, last_seen) on public.profiles to authenticated;

create policy "profiles: 누구나 읽기" on public.profiles for select to authenticated using (true);
create policy "profiles: 내 것만 고치기" on public.profiles for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- 가입하면 프로필을 자동으로 만든다 (아이디는 가입 때 넣은 username)
create or replace function private.on_user_created()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles (user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)))
  on conflict (user_id) do nothing;
  return new;
end $$;
drop trigger if exists on_user_created on auth.users;
create trigger on_user_created after insert on auth.users
  for each row execute function private.on_user_created();

-- 이미 가입한 계정도 프로필을 채워 둔다
insert into public.profiles (user_id, username)
select id, coalesce(raw_user_meta_data->>'username', split_part(email, '@', 1)) from auth.users
on conflict (user_id) do nothing;

-- 정지 여부 (글쓰기 정책에서 사용)
create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.profiles p
                 where p.user_id = auth.uid() and (p.banned_until is null or p.banned_until < now()))
$$;
revoke execute on function public.is_active() from public, anon;
grant execute on function public.is_active() to authenticated;

-- updated_at 공통 트리거
create or replace function private.touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;
drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch before update on public.profiles for each row execute function private.touch();

-- ── 커뮤니티 피드 ───────────────────────────────────────────
create table if not exists public.feed_posts (
  id          uuid primary key default gen_random_uuid(),
  author      uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 300),
  img_path    text,                                     -- Storage 'feed' 버킷 안의 경로 (<user_id>/<파일>)
  likes       int not null default 0,
  comments    int not null default 0,
  hidden      boolean not null default false,           -- 운영자가 가림
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists feed_posts_recent on public.feed_posts (created_at desc);

create table if not exists public.feed_comments (
  id          uuid primary key default gen_random_uuid(),
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  parent_id   uuid references public.feed_comments(id) on delete cascade,   -- 답글이면 원댓글
  author      uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 150),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists feed_comments_post on public.feed_comments (post_id, created_at);

create table if not exists public.feed_likes (
  post_id     uuid not null references public.feed_posts(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (post_id, user_id)
);
create index if not exists feed_likes_user on public.feed_likes (user_id);

alter table public.feed_posts enable row level security;
alter table public.feed_comments enable row level security;
alter table public.feed_likes enable row level security;
revoke all on public.feed_posts, public.feed_comments, public.feed_likes from anon, authenticated;
grant select, delete on public.feed_posts, public.feed_comments to authenticated;
grant insert (text, img_path) on public.feed_posts to authenticated;
grant update (text, img_path, hidden) on public.feed_posts to authenticated;
grant insert (post_id, parent_id, text) on public.feed_comments to authenticated;
grant update (hidden) on public.feed_comments to authenticated;
grant select, delete on public.feed_likes to authenticated;
grant insert (post_id) on public.feed_likes to authenticated;

create policy "posts: 읽기" on public.feed_posts for select to authenticated
  using (not hidden or author = (select auth.uid()) or (select public.is_admin()));
create policy "posts: 쓰기" on public.feed_posts for insert to authenticated
  with check (author = (select auth.uid()) and (select public.is_active()));
create policy "posts: 내 글 고치기·운영자" on public.feed_posts for update to authenticated
  using (author = (select auth.uid()) or (select public.is_admin()))
  with check (author = (select auth.uid()) or (select public.is_admin()));
create policy "posts: 내 글 지우기·운영자" on public.feed_posts for delete to authenticated
  using (author = (select auth.uid()) or (select public.is_admin()));

create policy "comments: 읽기" on public.feed_comments for select to authenticated
  using (not hidden or author = (select auth.uid()) or (select public.is_admin()));
create policy "comments: 쓰기" on public.feed_comments for insert to authenticated
  with check (author = (select auth.uid()) and (select public.is_active()));
create policy "comments: 운영자 가리기" on public.feed_comments for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "comments: 내 댓글 지우기·운영자" on public.feed_comments for delete to authenticated
  using (author = (select auth.uid()) or (select public.is_admin()));

create policy "likes: 읽기" on public.feed_likes for select to authenticated using (true);
create policy "likes: 누르기" on public.feed_likes for insert to authenticated with check (user_id = (select auth.uid()));
create policy "likes: 취소" on public.feed_likes for delete to authenticated using (user_id = (select auth.uid()));

-- 본인 글 수정 시 hidden은 운영자만 바꿀 수 있게 막는다
create or replace function private.posts_guard()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.hidden is distinct from old.hidden and not public.is_admin() then new.hidden := old.hidden; end if;
  new.updated_at := now();
  return new;
end $$;
drop trigger if exists posts_guard on public.feed_posts;
create trigger posts_guard before update on public.feed_posts for each row execute function private.posts_guard();

-- 좋아요·댓글 수 자동 계산
create or replace function private.feed_counts()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pid uuid := coalesce(new.post_id, old.post_id); d int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  if tg_table_name = 'feed_likes' then
    update public.feed_posts set likes = greatest(0, likes + d) where id = pid;
  else
    update public.feed_posts set comments = greatest(0, comments + d) where id = pid;
  end if;
  return null;
end $$;
drop trigger if exists likes_count on public.feed_likes;
create trigger likes_count after insert or delete on public.feed_likes for each row execute function private.feed_counts();
drop trigger if exists comments_count on public.feed_comments;
create trigger comments_count after insert or delete on public.feed_comments for each row execute function private.feed_counts();

-- ── 채팅 (월드·로비·파티) ───────────────────────────────────
-- channel: 'world'(운영자 공지·업데이트), 'lobby'(모두), 'party:<파티 id>'
create table if not exists public.chat_messages (
  id          bigint generated always as identity primary key,
  channel     text not null check (channel in ('world','lobby') or channel ~ '^party:[A-Za-z0-9_-]{1,40}$'),
  author      uuid default auth.uid() references public.profiles(user_id) on delete set null,
  name        text not null default '',          -- 보낼 때의 캐릭터 이름 (서버가 채움, 이름을 바꿔도 기록은 그대로)
  cat         text check (cat in ('notice','update')),   -- world 채널 분류
  text        text not null check (char_length(text) between 1 and 200),
  hidden      boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists chat_channel_recent on public.chat_messages (channel, id desc);

alter table public.chat_messages enable row level security;
revoke all on public.chat_messages from anon, authenticated;
grant select on public.chat_messages to authenticated;
grant insert (channel, name, cat, text) on public.chat_messages to authenticated;
grant update (hidden) on public.chat_messages to authenticated;
grant delete on public.chat_messages to authenticated;

create policy "chat: 읽기" on public.chat_messages for select to authenticated
  using (not hidden or (select public.is_admin()));
create policy "chat: 쓰기" on public.chat_messages for insert to authenticated
  with check (author = (select auth.uid()) and (select public.is_active())
              and (channel <> 'world' or (select public.is_admin()))
              and (cat is null or (select public.is_admin())));
create policy "chat: 운영자 가리기" on public.chat_messages for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "chat: 운영자 지우기" on public.chat_messages for delete to authenticated
  using ((select public.is_admin()));

-- 보낸 사람 이름은 서버가 프로필에서 채운다 (다른 사람 이름으로 보내기 방지). 운영자는 '운영자' 등 지정 가능.
create or replace function private.stamp_sender_name()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  if public.is_admin() and coalesce(new.name, '') <> '' then return new; end if;
  select coalesce(p.name, p.username) into n from public.profiles p where p.user_id = auth.uid();
  new.name := coalesce(n, '알 수 없음');
  return new;
end $$;
drop trigger if exists chat_name on public.chat_messages;
create trigger chat_name before insert on public.chat_messages for each row execute function private.stamp_sender_name();

-- ── 귓속말 ──────────────────────────────────────────────────
create table if not exists public.direct_messages (
  id          bigint generated always as identity primary key,
  sender      uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  recipient   uuid not null references public.profiles(user_id) on delete cascade,
  text        text not null check (char_length(text) between 1 and 200),
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  check (sender <> recipient)
);
create index if not exists dm_recipient on public.direct_messages (recipient, id desc);
create index if not exists dm_sender on public.direct_messages (sender, id desc);

alter table public.direct_messages enable row level security;
revoke all on public.direct_messages from anon, authenticated;
grant select on public.direct_messages to authenticated;
grant insert (recipient, text) on public.direct_messages to authenticated;
grant update (read_at) on public.direct_messages to authenticated;

create policy "dm: 보낸 사람·받는 사람만 읽기" on public.direct_messages for select to authenticated
  using (sender = (select auth.uid()) or recipient = (select auth.uid()));
create policy "dm: 보내기" on public.direct_messages for insert to authenticated
  with check (sender = (select auth.uid()) and (select public.is_active()));
create policy "dm: 받은 것 읽음 표시" on public.direct_messages for update to authenticated
  using (recipient = (select auth.uid())) with check (recipient = (select auth.uid()));

-- ── 우편함 ──────────────────────────────────────────────────
-- 받은 지 7일이 지나면 자동 삭제(보관한 것 제외) — 정리 작업은 006(예약 작업)에서.
create table if not exists public.mail (
  id          uuid primary key default gen_random_uuid(),
  recipient   uuid not null references public.profiles(user_id) on delete cascade,
  sender      uuid default auth.uid() references public.profiles(user_id) on delete set null,  -- null = 운영·시스템
  sender_name text not null default '',
  text        text not null check (char_length(text) between 1 and 500),
  items       jsonb not null default '{}'::jsonb check (jsonb_typeof(items) = 'object'),   -- {"potion":3}
  gold        int not null default 0 check (gold >= 0),
  read_at     timestamptz,
  claimed_at  timestamptz,
  archived    boolean not null default false,
  created_at  timestamptz not null default now()
);
create index if not exists mail_recipient on public.mail (recipient, created_at desc);

alter table public.mail enable row level security;
revoke all on public.mail from anon, authenticated;
grant select on public.mail to authenticated;
grant insert (recipient, sender_name, text, items, gold) on public.mail to authenticated;
grant update (read_at, archived) on public.mail to authenticated;
grant delete on public.mail to authenticated;

create policy "mail: 받은 사람·운영자 읽기" on public.mail for select to authenticated
  using (recipient = (select auth.uid()) or (select public.is_admin()));
create policy "mail: 유저끼리 보내기" on public.mail for insert to authenticated
  with check (sender = (select auth.uid()) and recipient <> (select auth.uid()) and (select public.is_active()));
create policy "mail: 읽음·보관 표시" on public.mail for update to authenticated
  using (recipient = (select auth.uid())) with check (recipient = (select auth.uid()));
create policy "mail: 내 우편 지우기" on public.mail for delete to authenticated
  using (recipient = (select auth.uid()) and (claimed_at is not null or (items = '{}'::jsonb and gold = 0)));

-- 첨부 받기: 두 번 받지 못하게 서버에서 한 번만 표시하고 내용물을 돌려준다
create or replace function public.claim_mail(p_id uuid)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare m public.mail;
begin
  update public.mail set claimed_at = now(), read_at = coalesce(read_at, now())
   where id = p_id and recipient = auth.uid() and claimed_at is null
  returning * into m;
  if not found then raise exception 'ALREADY_CLAIMED'; end if;
  return jsonb_build_object('items', m.items, 'gold', m.gold);
end $$;
revoke execute on function public.claim_mail(uuid) from public, anon;
grant execute on function public.claim_mail(uuid) to authenticated;

-- 유저끼리 보낼 때 보낸 사람 이름은 프로필에서 채운다
create or replace function private.stamp_mail_sender()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  if new.sender is null then return new; end if;   -- 운영·시스템 우편(운영 함수가 넣음)
  select coalesce(p.name, p.username) into n from public.profiles p where p.user_id = new.sender;
  new.sender_name := coalesce(n, '알 수 없음');
  return new;
end $$;
drop trigger if exists mail_sender on public.mail;
create trigger mail_sender before insert on public.mail for each row execute function private.stamp_mail_sender();

-- ── 1:1 문의 ────────────────────────────────────────────────
create table if not exists public.inquiries (
  id          uuid primary key default gen_random_uuid(),
  author      uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  cat         text not null,
  text        text not null check (char_length(text) between 1 and 500),
  answer      text check (answer is null or char_length(answer) <= 300),
  answered_by uuid references auth.users(id) on delete set null,
  answered_at timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists inquiries_open on public.inquiries (created_at desc) where answer is null;
alter table public.inquiries enable row level security;
revoke all on public.inquiries from anon, authenticated;
grant select on public.inquiries to authenticated;
grant insert (cat, text) on public.inquiries to authenticated;
grant update (answer) on public.inquiries to authenticated;
create policy "inquiries: 본인·운영자 읽기" on public.inquiries for select to authenticated
  using (author = (select auth.uid()) or (select public.is_admin()));
create policy "inquiries: 쓰기" on public.inquiries for insert to authenticated
  with check (author = (select auth.uid()));
create policy "inquiries: 운영자 답변" on public.inquiries for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function private.inquiry_answered()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.answer is distinct from old.answer then new.answered_by := auth.uid(); new.answered_at := now(); end if;
  return new;
end $$;
drop trigger if exists inquiry_answered on public.inquiries;
create trigger inquiry_answered before update on public.inquiries for each row execute function private.inquiry_answered();

-- ── 신고 ────────────────────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  reporter    uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  target      uuid references public.profiles(user_id) on delete set null,
  target_name text,
  kind        text not null check (kind in ('chat','dm','feed','comment','profile','etc')),
  ref_id      text,                 -- 신고한 메시지·글 id
  snapshot    text check (snapshot is null or char_length(snapshot) <= 500),  -- 신고 당시 내용
  reason      text check (reason is null or char_length(reason) <= 200),
  done        boolean not null default false,
  handled_by  uuid references auth.users(id) on delete set null,
  handled_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists reports_open on public.reports (created_at desc) where not done;
alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;
grant select on public.reports to authenticated;
grant insert (target, target_name, kind, ref_id, snapshot, reason) on public.reports to authenticated;
grant update (done) on public.reports to authenticated;
create policy "reports: 본인·운영자 읽기" on public.reports for select to authenticated
  using (reporter = (select auth.uid()) or (select public.is_admin()));
create policy "reports: 쓰기" on public.reports for insert to authenticated
  with check (reporter = (select auth.uid()));
create policy "reports: 운영자 처리" on public.reports for update to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

create or replace function private.report_handled()
returns trigger language plpgsql set search_path = '' as $$
begin
  if new.done and not old.done then new.handled_by := auth.uid(); new.handled_at := now(); end if;
  return new;
end $$;
drop trigger if exists report_handled on public.reports;
create trigger report_handled before update on public.reports for each row execute function private.report_handled();

-- ── 낚시 기록 · 주간 랭킹 ───────────────────────────────────
-- 주(week)는 한국 시간 월요일 00:00 기준 날짜. 랭킹 = 그 주·그 지역에서 가장 큰 한 마리.
create or replace function public.kst_week(t timestamptz default now())
returns date language sql stable set search_path = '' as $$
  select date_trunc('week', t at time zone 'Asia/Seoul')::date
$$;

create table if not exists public.fish_catches (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  land        text not null,
  species     text not null,
  size_cm     numeric(6,1) not null check (size_cm > 0 and size_cm < 10000),
  week        date not null default public.kst_week(),
  created_at  timestamptz not null default now()
);
create index if not exists fish_rank on public.fish_catches (week, land, size_cm desc);
alter table public.fish_catches enable row level security;
revoke all on public.fish_catches from anon, authenticated;
grant select on public.fish_catches to authenticated;
grant insert (land, species, size_cm) on public.fish_catches to authenticated;
create policy "fish: 읽기" on public.fish_catches for select to authenticated using (true);
create policy "fish: 내 기록 남기기" on public.fish_catches for insert to authenticated
  with check (user_id = (select auth.uid()) and week = public.kst_week());

-- 지역별 이번 주 순위 (한 사람당 가장 큰 기록 1개)
create or replace view public.fish_weekly with (security_invoker = true) as
select distinct on (f.week, f.land, f.user_id)
       f.week, f.land, f.user_id, p.name, f.species, f.size_cm, f.created_at
from public.fish_catches f join public.profiles p on p.user_id = f.user_id
order by f.week, f.land, f.user_id, f.size_cm desc, f.created_at;
grant select on public.fish_weekly to authenticated;

-- ── 주간 행운권 (로또) ──────────────────────────────────────
-- 매주 금요일 20:00(KST) 추첨. draw_key 예: '2026-11-06'. 추첨 결과는 운영자/예약 작업만 기록.
create table if not exists public.lotto_draws (
  draw_key    text primary key,
  draw_at     timestamptz not null,
  nums        smallint[] check (nums is null or cardinality(nums) = 4),
  drawn_at    timestamptz
);
create table if not exists public.lotto_tickets (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  draw_key    text not null,
  nums        smallint[] not null check (cardinality(nums) = 4 and 0 <= all(nums) and 9 >= all(nums)),
  rank        smallint,          -- 추첨 후 1·2·3등, 꽝은 0
  claimed_at  timestamptz,
  created_at  timestamptz not null default now()
);
create index if not exists lotto_tickets_draw on public.lotto_tickets (draw_key);
create index if not exists lotto_tickets_user on public.lotto_tickets (user_id, created_at desc);

alter table public.lotto_draws enable row level security;
alter table public.lotto_tickets enable row level security;
revoke all on public.lotto_draws, public.lotto_tickets from anon, authenticated;
grant select on public.lotto_draws, public.lotto_tickets to authenticated;
grant insert (draw_key, nums) on public.lotto_tickets to authenticated;
create policy "draws: 읽기" on public.lotto_draws for select to authenticated using (true);
create policy "tickets: 내 것·운영자 읽기" on public.lotto_tickets for select to authenticated
  using (user_id = (select auth.uid()) or (select public.is_admin()));
-- 아직 추첨하지 않은 회차만 살 수 있다 (추첨 시각 지나면 막힘)
create policy "tickets: 사기" on public.lotto_tickets for insert to authenticated
  with check (user_id = (select auth.uid())
              and not exists (select 1 from public.lotto_draws d where d.draw_key = lotto_tickets.draw_key
                              and (d.drawn_at is not null or d.draw_at <= now())));

-- ── 실시간 알림 대상 (Realtime) ─────────────────────────────
-- 채팅·귓속말·우편·피드·콘텐츠가 바뀌면 접속 중인 화면에 바로 전달 (RLS가 그대로 적용됨)
do $$
declare t text;
begin
  foreach t in array array['chat_messages','direct_messages','mail','feed_posts','feed_comments','content'] loop
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;
