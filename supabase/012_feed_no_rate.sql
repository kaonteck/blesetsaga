-- 012 · 피드 도배 제한 없앰 (사용자 요청, 2026-11-03)
-- 011에서 넣은 글 1분 3개 · 댓글 5초 4개 제한을 지운다. 채팅·귓속말 제한(009)은 그대로.
drop trigger if exists posts_rate on public.feed_posts;
drop trigger if exists comments_rate on public.feed_comments;
drop function if exists private.feed_rate_limit();
