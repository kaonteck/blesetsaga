-- 028 실제 이름 (메인 2026-11-06) — 6장 '반쯤 지워진 종잇조각'에 쓰는 블레서의 실제 이름.
-- 처음 접속할 때 반드시 입력. 서버에만 저장하고 본인만 읽고 쓴다(운영자·다른 유저 읽기 없음). 캐릭터 페이지·세이브(saves)에는 넣지 않는다.
create table if not exists public.real_names (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  real_name text not null check (char_length(btrim(real_name)) between 1 and 30),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.real_names enable row level security;
drop policy if exists "real_names: 내 것 읽기" on public.real_names;
drop policy if exists "real_names: 내 것 쓰기" on public.real_names;
drop policy if exists "real_names: 내 것 고치기" on public.real_names;
create policy "real_names: 내 것 읽기" on public.real_names for select to authenticated using (user_id = (select auth.uid()));
create policy "real_names: 내 것 쓰기" on public.real_names for insert to authenticated with check (user_id = (select auth.uid()));
create policy "real_names: 내 것 고치기" on public.real_names for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
revoke all on public.real_names from anon;
grant select, insert, update on public.real_names to authenticated;

-- 6장 새 아이템
insert into public.item_catalog (id, type, lvl) values ('q_scrap','mat',0) on conflict (id) do nothing;
