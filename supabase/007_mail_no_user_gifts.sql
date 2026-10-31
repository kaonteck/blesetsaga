-- 007 · 유저끼리 우편에 골드·아이템 첨부 막기 (체크 세션 요청, 2026-10-31)
-- 문제: 005에서 유저가 mail.items·gold를 직접 넣을 수 있었다. 보내는 사람에게서 빼는 처리가 없어서
--       아무에게나 골드·아이템을 만들어 보낼 수 있다(복사).
-- 해결: 유저가 직접 넣는 우편은 글만. 첨부는 운영 함수(admin_send_mail, security definer)만 넣을 수 있다.
--       유저끼리 선물은 5단계에서 "보내는 사람 세이브에서 빼고 → 우편 만들기"를 한 번에 하는 서버 함수로 다시 연다.

-- 1) 열 권한: 유저는 items·gold 칸을 아예 쓸 수 없다 (기본값 {} · 0 이 들어감)
revoke insert (items, gold) on public.mail from authenticated;

-- 2) 정책에도 한 번 더 (열 권한이 실수로 다시 열려도 막히게)
drop policy if exists "mail: 유저끼리 보내기" on public.mail;
create policy "mail: 유저끼리 보내기 (글만)" on public.mail for insert to authenticated
  with check (sender = (select auth.uid()) and recipient <> (select auth.uid()) and (select public.is_active())
              and items = '{}'::jsonb and gold = 0);
