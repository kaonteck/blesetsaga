-- 027 몬스터 그림 (메인 2026-11-05) — 운영 페이지에서 몬스터 이미지를 올린다.
-- 공개 버킷 monster-art: 누구나 주소로 볼 수 있고, 올리기·바꾸기·지우기는 운영자(public.is_admin())만.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('monster-art', 'monster-art', true, 2097152, array['image/png','image/jpeg','image/webp','image/gif'])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "monster-art: 운영자 읽기" on storage.objects;
drop policy if exists "monster-art: 운영자 올리기" on storage.objects;
drop policy if exists "monster-art: 운영자 바꾸기" on storage.objects;
drop policy if exists "monster-art: 운영자 지우기" on storage.objects;
create policy "monster-art: 운영자 읽기" on storage.objects for select to authenticated
  using (bucket_id = 'monster-art' and (select public.is_admin()));
create policy "monster-art: 운영자 올리기" on storage.objects for insert to authenticated
  with check (bucket_id = 'monster-art' and (select public.is_admin()));
create policy "monster-art: 운영자 바꾸기" on storage.objects for update to authenticated
  using (bucket_id = 'monster-art' and (select public.is_admin())) with check (bucket_id = 'monster-art' and (select public.is_admin()));
create policy "monster-art: 운영자 지우기" on storage.objects for delete to authenticated
  using (bucket_id = 'monster-art' and (select public.is_admin()));
