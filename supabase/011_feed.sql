-- 011 · 커뮤니티 피드 서버 연결
-- 표(feed_posts · feed_comments · feed_likes)는 005에서 만들었다. 여기서는 게임 화면에 맞추고 정리한다.
--  1) 글쓴이 이름을 서버가 채움(author_name) — 채팅·우편과 같은 방식(사칭 방지, 이름표 조회 없이 바로 표시)
--  2) 댓글·답글 좋아요(feed_comment_likes) + 댓글 좋아요 수
--  3) 답글은 같은 글의 원댓글에만(답글의 답글 없음 — 게임 화면 구조와 같음)
--  4) 도배 막기: 글 1분에 3개, 댓글 5초에 4개까지 (운영자는 제외)
--  5) 사진 첨부 정리(메인 요청: 사진 기능 삭제) — img_path 열·Storage 'feed' 정책 삭제

-- ── 1) 글쓴이 이름 ──
alter table public.feed_posts add column if not exists author_name text;
alter table public.feed_comments add column if not exists author_name text;
update public.feed_posts f set author_name = coalesce(p.name, p.username) from public.profiles p where p.user_id = f.author and f.author_name is null;
update public.feed_comments f set author_name = coalesce(p.name, p.username) from public.profiles p where p.user_id = f.author and f.author_name is null;

create or replace function private.stamp_author_name()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n text;
begin
  select coalesce(p.name, p.username) into n from public.profiles p where p.user_id = new.author;
  new.author_name := coalesce(n, '알 수 없음');
  return new;
end $$;
revoke execute on function private.stamp_author_name() from public, anon, authenticated;
drop trigger if exists posts_name on public.feed_posts;
create trigger posts_name before insert on public.feed_posts for each row execute function private.stamp_author_name();
drop trigger if exists comments_name on public.feed_comments;
create trigger comments_name before insert on public.feed_comments for each row execute function private.stamp_author_name();

-- 이름을 바꾸면 내가 쓴 글·댓글 이름도 따라 바뀐다
create or replace function private.feed_rename()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if coalesce(new.name, new.username) is distinct from coalesce(old.name, old.username) then
    update public.feed_posts set author_name = coalesce(new.name, new.username) where author = new.user_id;
    update public.feed_comments set author_name = coalesce(new.name, new.username) where author = new.user_id;
  end if;
  return null;
end $$;
revoke execute on function private.feed_rename() from public, anon, authenticated;
drop trigger if exists profiles_feed_rename on public.profiles;
create trigger profiles_feed_rename after update of name on public.profiles for each row execute function private.feed_rename();

-- ── 2) 댓글·답글 좋아요 ──
alter table public.feed_comments add column if not exists likes int not null default 0;
create table if not exists public.feed_comment_likes (
  comment_id  uuid not null references public.feed_comments(id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles(user_id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (comment_id, user_id)
);
create index if not exists feed_comment_likes_user on public.feed_comment_likes (user_id);
alter table public.feed_comment_likes enable row level security;
revoke all on public.feed_comment_likes from anon, authenticated;
grant select, delete on public.feed_comment_likes to authenticated;
grant insert (comment_id) on public.feed_comment_likes to authenticated;
drop policy if exists "comment likes: 읽기" on public.feed_comment_likes;
create policy "comment likes: 읽기" on public.feed_comment_likes for select to authenticated using (true);
drop policy if exists "comment likes: 누르기" on public.feed_comment_likes;
create policy "comment likes: 누르기" on public.feed_comment_likes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_active()));
drop policy if exists "comment likes: 취소" on public.feed_comment_likes;
create policy "comment likes: 취소" on public.feed_comment_likes for delete to authenticated using (user_id = (select auth.uid()));

create or replace function private.feed_comment_like_count()
returns trigger language plpgsql security definer set search_path = '' as $$
declare cid uuid := coalesce(new.comment_id, old.comment_id); d int := case when tg_op = 'INSERT' then 1 else -1 end;
begin
  update public.feed_comments set likes = greatest(0, likes + d) where id = cid;
  return null;
end $$;
revoke execute on function private.feed_comment_like_count() from public, anon, authenticated;
drop trigger if exists comment_likes_count on public.feed_comment_likes;
create trigger comment_likes_count after insert or delete on public.feed_comment_likes for each row execute function private.feed_comment_like_count();

-- 글 좋아요도 정지된 계정은 못 누르게
drop policy if exists "likes: 누르기" on public.feed_likes;
create policy "likes: 누르기" on public.feed_likes for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.is_active()));

-- ── 3) 답글은 같은 글의 원댓글에만 ──
create or replace function private.comment_parent_check()
returns trigger language plpgsql security definer set search_path = '' as $$
declare pp uuid; pparent uuid;
begin
  if new.parent_id is null then return new; end if;
  select post_id, parent_id into pp, pparent from public.feed_comments where id = new.parent_id;
  if not found or pp <> new.post_id or pparent is not null then raise exception 'BAD_PARENT'; end if;
  return new;
end $$;
revoke execute on function private.comment_parent_check() from public, anon, authenticated;
drop trigger if exists comments_parent on public.feed_comments;
create trigger comments_parent before insert on public.feed_comments for each row execute function private.comment_parent_check();

-- ── 4) 도배 막기 ──
create or replace function private.feed_rate_limit()
returns trigger language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if public.is_admin() then return new; end if;
  if tg_table_name = 'feed_posts' then
    select count(*) into n from public.feed_posts where author = auth.uid() and created_at > now() - interval '60 seconds';
    if n >= 3 then raise exception 'TOO_FAST'; end if;
  else
    select count(*) into n from public.feed_comments where author = auth.uid() and created_at > now() - interval '5 seconds';
    if n >= 4 then raise exception 'TOO_FAST'; end if;
  end if;
  return new;
end $$;
revoke execute on function private.feed_rate_limit() from public, anon, authenticated;
create index if not exists feed_posts_author_recent on public.feed_posts (author, created_at desc);
create index if not exists feed_comments_author_recent on public.feed_comments (author, created_at desc);
drop trigger if exists posts_rate on public.feed_posts;
create trigger posts_rate before insert on public.feed_posts for each row execute function private.feed_rate_limit();
drop trigger if exists comments_rate on public.feed_comments;
create trigger comments_rate before insert on public.feed_comments for each row execute function private.feed_rate_limit();

-- ── 5) 사진 첨부 정리 ──
revoke insert (img_path), update (img_path) on public.feed_posts from authenticated;
alter table public.feed_posts drop column if exists img_path;
drop policy if exists "feed 사진: 내 폴더에 올리기" on storage.objects;
drop policy if exists "feed 사진: 내 것·운영자 지우기" on storage.objects;
drop policy if exists "feed 사진: 읽기" on storage.objects;
-- 버킷 자체는 Supabase가 SQL 삭제를 막을 수 있어 시도만 한다(막히면 대시보드 Storage에서 'feed' 삭제)
do $$ begin
  begin delete from storage.buckets where id = 'feed' and not exists (select 1 from storage.objects where bucket_id = 'feed');
  exception when others then raise notice 'feed 버킷은 대시보드에서 지워 주세요: %', sqlerrm; end;
end $$;

-- 실시간: 글·댓글 바뀜(좋아요 수 포함)으로 충분. 좋아요 표는 넣지 않음.
