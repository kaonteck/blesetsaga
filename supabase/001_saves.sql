-- 캐릭터 저장 테이블 (유저 1명당 1줄)
create table if not exists public.saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.saves enable row level security;

grant select, insert, update on public.saves to authenticated;

create policy "saves: 내 것만 읽기" on public.saves
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "saves: 내 것만 만들기" on public.saves
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "saves: 내 것만 고치기" on public.saves
  for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
