-- 초대코드 가입: 코드는 private 스키마에 있어 게임(브라우저)에서는 읽을 수 없다.
create schema if not exists private;

create table if not exists private.invite_codes (
  code text primary key,
  max_uses int default 1,          -- null 이면 무제한
  uses int not null default 0,
  note text,
  created_at timestamptz not null default now()
);

create or replace function private.check_invite()
returns trigger language plpgsql security definer set search_path = '' as $$
declare c text := upper(trim(coalesce(new.raw_user_meta_data->>'invite', '')));
begin
  update private.invite_codes set uses = uses + 1
   where code = c and (max_uses is null or uses < max_uses);
  if not found then
    raise exception 'INVALID_INVITE';
  end if;
  return new;
end $$;

drop trigger if exists check_invite on auth.users;
create trigger check_invite before insert on auth.users
  for each row execute function private.check_invite();
