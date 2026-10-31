-- 004 · 운영 콘텐츠 (운영자가 고치면 모든 유저에게 바로 반영)
-- 지금은 몬스터·퀘스트·아이템 등이 유저마다 세이브(S.data) 안에 있어서 운영자가 고쳐도 운영자 본인에게만 적용된다.
-- 이 파일은 콘텐츠를 서버 한곳(public.content)에 두고, 모든 변경을 자동으로 기록(content_history)해 되돌릴 수 있게 한다.
--
-- kind 예시: monster · quest · item · market(상점 상품) · notice(공지) · event(전광판) · setting(config·mass·banner 같은 단일 설정)
--           이후 recipe · title · village 등도 같은 표에 kind만 늘려서 넣는다.

-- ── 운영자 확인 ──────────────────────────────────────────────
-- 로그인 토큰의 app_metadata.role = 'admin' 이면 운영자. (003_admin.sql 로 지정)
-- 주의: 권한을 바꾼 뒤에는 그 계정이 다시 로그인해야 토큰에 반영된다.
create or replace function public.is_admin()
returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false)
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

-- ── 공개 콘텐츠 ─────────────────────────────────────────────
create table if not exists public.content (
  kind        text not null check (kind ~ '^[a-z][a-z0-9_]{1,30}$'),
  id          text not null check (length(id) between 1 and 64),
  data        jsonb not null,
  published   boolean not null default true,   -- false = 운영자에게만 보임(비공개)
  starts_at   timestamptz,                     -- 예약 공개: 이 시각부터 보임 (비우면 즉시)
  ends_at     timestamptz,                     -- 이 시각 이후 안 보임 (전광판·기간 이벤트)
  sort        int not null default 0,          -- 목록 순서
  rev         int not null default 1,          -- 변경 횟수 (자동 증가)
  note        text,                            -- 운영 메모 (유저에게 안 보임)
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (kind, id)
);
create index if not exists content_kind_sort on public.content (kind, sort, id);

alter table public.content enable row level security;
revoke all on public.content from anon;
grant select, insert, update, delete on public.content to authenticated;

create policy "content: 공개된 것은 누구나 읽기" on public.content
  for select to authenticated
  using (
    (published and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now()))
    or (select public.is_admin())
  );
create policy "content: 운영자만 만들기" on public.content
  for insert to authenticated with check ((select public.is_admin()));
create policy "content: 운영자만 고치기" on public.content
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "content: 운영자만 지우기" on public.content
  for delete to authenticated using ((select public.is_admin()));

-- ── 작성 중(비공개) 초안 ─────────────────────────────────────
-- 운영 화면의 "작성 → 검사 → 공개" 흐름. 초안을 여러 번 저장해도 유저에게는 공개본만 보인다.
create table if not exists public.content_drafts (
  kind        text not null,
  id          text not null,
  data        jsonb not null,
  note        text,
  updated_by  uuid references auth.users(id) on delete set null,
  updated_at  timestamptz not null default now(),
  primary key (kind, id)
);
alter table public.content_drafts enable row level security;
revoke all on public.content_drafts from anon;
grant select, insert, update, delete on public.content_drafts to authenticated;
create policy "drafts: 운영자만" on public.content_drafts
  for all to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));

-- ── 변경 기록 (자동) ────────────────────────────────────────
create table if not exists public.content_history (
  hid         bigint generated always as identity primary key,
  kind        text not null,
  id          text not null,
  op          text not null check (op in ('insert','update','delete','restore')),
  before      jsonb,          -- 바뀌기 전 행 전체 (data·published·기간 포함)
  after       jsonb,          -- 바뀐 뒤 행 전체
  rev         int,
  changed_by  uuid,
  changed_at  timestamptz not null default now()
);
create index if not exists content_history_item on public.content_history (kind, id, hid desc);
create index if not exists content_history_recent on public.content_history (hid desc);
alter table public.content_history enable row level security;
revoke all on public.content_history from anon;
grant select on public.content_history to authenticated;
create policy "history: 운영자만 읽기" on public.content_history
  for select to authenticated using ((select public.is_admin()));

-- 행이 바뀔 때마다 rev·updated_at·updated_by를 채우고 기록을 남긴다.
create or replace function private.content_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin
  if tg_op = 'UPDATE' then
    if (new.data, new.published, new.starts_at, new.ends_at, new.sort, new.note)
       is not distinct from (old.data, old.published, old.starts_at, old.ends_at, old.sort, old.note)
    then return null; end if;   -- 내용이 그대로면 저장·기록을 건너뜀
    new.rev := old.rev + 1;
  else
    new.rev := 1;
  end if;
  new.updated_at := now();
  new.updated_by := coalesce(auth.uid(), new.updated_by);
  return new;
end $$;

create or replace function private.content_log()
returns trigger language plpgsql security definer set search_path = '' as $$
declare op text := lower(tg_op);
begin
  if tg_op = 'UPDATE' and current_setting('bleset.restoring', true) = 'on' then op := 'restore'; end if;
  insert into public.content_history (kind, id, op, before, after, rev, changed_by)
  values (
    coalesce(new.kind, old.kind), coalesce(new.id, old.id), op,
    case when tg_op <> 'INSERT' then to_jsonb(old) end,
    case when tg_op <> 'DELETE' then to_jsonb(new) end,
    coalesce(new.rev, old.rev), auth.uid());
  return null;
end $$;

drop trigger if exists content_stamp on public.content;
create trigger content_stamp before insert or update on public.content
  for each row execute function private.content_stamp();
drop trigger if exists content_log on public.content;
create trigger content_log after insert or update or delete on public.content
  for each row execute function private.content_log();

drop trigger if exists drafts_stamp on public.content_drafts;
create or replace function private.draft_stamp()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); new.updated_by := coalesce(auth.uid(), new.updated_by); return new; end $$;
create trigger drafts_stamp before insert or update on public.content_drafts
  for each row execute function private.draft_stamp();

-- ── 운영 함수 ───────────────────────────────────────────────
-- 초안을 공개본으로 올리고 초안을 지운다.
create or replace function public.admin_publish(p_kind text, p_id text)
returns public.content language plpgsql security definer set search_path = '' as $$
declare d public.content_drafts; r public.content;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into d from public.content_drafts where kind = p_kind and id = p_id;
  if not found then raise exception 'NO_DRAFT'; end if;
  insert into public.content (kind, id, data, note)
  values (d.kind, d.id, d.data, d.note)
  on conflict (kind, id) do update set data = excluded.data, note = coalesce(excluded.note, public.content.note)
  returning * into r;
  delete from public.content_drafts where kind = p_kind and id = p_id;
  return r;
end $$;

-- 기록 한 줄의 상태로 되돌린다. (그 변경 '직후' 상태로. 지운 기록이면 지우기 직전 상태로 살린다.)
create or replace function public.admin_restore(p_hid bigint)
returns public.content language plpgsql security definer set search_path = '' as $$
declare h public.content_history; s jsonb; r public.content;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  select * into h from public.content_history where hid = p_hid;
  if not found then raise exception 'NO_HISTORY'; end if;
  s := coalesce(h.after, h.before);
  perform set_config('bleset.restoring', 'on', true);
  insert into public.content (kind, id, data, published, starts_at, ends_at, sort, note)
  values (h.kind, h.id, s->'data', coalesce((s->>'published')::boolean, true),
          (s->>'starts_at')::timestamptz, (s->>'ends_at')::timestamptz, coalesce((s->>'sort')::int, 0), s->>'note')
  on conflict (kind, id) do update set
    data = excluded.data, published = excluded.published, starts_at = excluded.starts_at,
    ends_at = excluded.ends_at, sort = excluded.sort, note = excluded.note
  returning * into r;
  perform set_config('bleset.restoring', 'off', true);
  return r;
end $$;

-- 여러 개를 한 번에 넣기 (JSON 가져오기·초기 데이터 넣기). rows = [{kind,id,data,published?,sort?}, ...]
create or replace function public.admin_import(p_rows jsonb, p_overwrite boolean default false)
returns int language plpgsql security definer set search_path = '' as $$
declare n int;
begin
  if not public.is_admin() then raise exception 'NOT_ADMIN'; end if;
  with src as (
    select x->>'kind' kind, x->>'id' id, x->'data' data,
           coalesce((x->>'published')::boolean, true) published, coalesce((x->>'sort')::int, 0) sort
    from jsonb_array_elements(p_rows) x
  ), ins as (
    insert into public.content (kind, id, data, published, sort)
    select kind, id, data, published, sort from src
    on conflict (kind, id) do update set data = excluded.data, published = excluded.published, sort = excluded.sort
      where p_overwrite
    returning 1
  ) select count(*) into n from ins;
  return n;
end $$;

revoke execute on function public.admin_publish(text, text) from public, anon;
revoke execute on function public.admin_restore(bigint) from public, anon;
revoke execute on function public.admin_import(jsonb, boolean) from public, anon;
grant execute on function public.admin_publish(text, text) to authenticated;
grant execute on function public.admin_restore(bigint) to authenticated;
grant execute on function public.admin_import(jsonb, boolean) to authenticated;

-- ── 그 밖의 보안 정리 ───────────────────────────────────────
-- private 스키마는 이미 anon/authenticated 접근이 막혀 있지만, 보안 권고(RLS 꺼짐)도 없앤다.
-- 초대코드 검사 트리거는 소유자(postgres) 권한으로 돌아서 RLS의 영향을 받지 않는다.
alter table private.invite_codes enable row level security;
