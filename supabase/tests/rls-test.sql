\set ON_ERROR_STOP 1
create schema t; grant usage on schema t to authenticated;
create function t.fail(q text, label text) returns void language plpgsql as $$
begin begin execute q; exception when others then raise notice 'OK  (막힘) %: %', label, sqlerrm; return; end;
raise exception 'FAIL 막혀야 하는데 통과: %', label; end $$;
create function t.ok(cond bool, label text) returns void language plpgsql as $$
begin if cond then raise notice 'OK  %', label; else raise exception 'FAIL %', label; end if; end $$;
create function t.err(q text) returns text language plpgsql as $f$ begin execute q; return 'none'; exception when others then return sqlerrm; end $f$;
grant execute on all functions in schema t to authenticated;
create function t.as(uid text, admin bool default false) returns void language sql as $$
  select set_config('request.jwt.claims', json_build_object('sub',uid,'role','authenticated','app_metadata',json_build_object('role',case when admin then 'admin' end))::text, false) $$;
grant execute on function t.as(text,bool) to authenticated;

insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values
 ('00000000-0000-0000-0000-00000000000a','admin@x','{"username":"admin"}','{"role":"admin"}'),
 ('00000000-0000-0000-0000-000000000001','p1@x','{"username":"p1"}','{}'),
 ('00000000-0000-0000-0000-000000000002','p2@x','{"username":"p2"}','{}'),
 ('00000000-0000-0000-0000-000000000003','p3@x','{"username":"p3"}','{}');
select t.ok((select count(*) from profiles)=4,'가입 시 프로필 자동 생성');
\set A '00000000-0000-0000-0000-00000000000a'
\set P1 '00000000-0000-0000-0000-000000000001'
\set P2 '00000000-0000-0000-0000-000000000002'
\set P3 '00000000-0000-0000-0000-000000000003'

set role authenticated;
-- 프로필
select t.as(:'P1'); update profiles set name='아린', level=12 where user_id=:'P1';
select t.as(:'P2'); update profiles set name='벨라' where user_id=:'P2';
select t.as(:'P3'); update profiles set name='카이' where user_id=:'P3';
select t.as(:'P1');
select t.fail($$update profiles set banned_until=now()+interval '1d' where user_id='00000000-0000-0000-0000-000000000001'$$,'본인이 정지 칸 수정');
update profiles set status='meal' where user_id=:'P1';
select t.ok((select status from profiles where user_id=:'P1')='meal','상태 식사 중(meal) 저장');
select t.fail($$update profiles set status='sleep' where user_id='00000000-0000-0000-0000-000000000001'$$,'없는 상태');
update profiles set name='해킹' where user_id=:'P2';
select t.ok((select name from profiles where user_id=:'P2')='벨라','남의 프로필 수정 무시');
select t.fail($$update profiles set name='벨라' where user_id='00000000-0000-0000-0000-000000000001'$$,'이름 중복(대소문자 무시)');

-- 콘텐츠
select t.as(:'A',true);
insert into content(kind,id,data) values ('monster','forest','{"name":"숲의 파수꾼","hp":400}');
insert into content(kind,id,data,published) values ('quest','E9','{"title":"비밀"}',false);
insert into content(kind,id,data,starts_at) values ('notice','n_future','{"title":"예약"}',now()+interval '1 hour');
update content set data='{"name":"숲의 파수꾼","hp":500}' where kind='monster' and id='forest';
update content set data='{"name":"숲의 파수꾼","hp":500}' where kind='monster' and id='forest';
select t.ok((select rev from content where id='forest')=2,'수정할 때 rev 증가, 같은 내용 재저장은 무시');
select t.ok((select count(*) from content_history where id='forest')=2,'변경 기록 2건(생성·수정)');
select admin_restore((select min(hid) from content_history where id='forest'));
select t.ok((select (data->>'hp')::int from content where id='forest')=400,'기록으로 되돌리기');
select t.ok((select op from content_history where id='forest' order by hid desc limit 1)='restore','되돌리기도 기록됨');
insert into content_drafts(kind,id,data) values ('monster','forest','{"name":"숲의 파수꾼","hp":777}');
select t.as(:'P1');
select t.ok((select count(*) from content)=1,'유저는 공개·기간 안의 콘텐츠만 봄 (비공개·예약 숨김)');
select t.ok((select (data->>'hp')::int from content where id='forest')=400,'초안은 공개 전 유저에게 안 보임');
select t.ok((select count(*) from content_drafts)=0,'유저는 초안 못 봄');
select t.ok((select count(*) from content_history)=0,'유저는 변경 기록 못 봄');
select t.fail($$insert into content(kind,id,data) values ('item','x','{}')$$,'유저가 콘텐츠 추가');
update content set data='{}' where id='forest';
select t.ok((select (data->>'hp')::int from content where id='forest')=400,'유저의 콘텐츠 수정 무시');
select t.fail($$select admin_publish('monster','forest')$$,'유저가 공개 함수 호출');
select t.as(:'A',true); select admin_publish('monster','forest');
select t.ok((select (data->>'hp')::int from content where id='forest')=777 and not exists(select 1 from content_drafts),'초안 공개 후 초안 삭제');
select admin_import('[{"kind":"item","id":"potion","data":{"name":"회복약"}},{"kind":"item","id":"monster_x","data":{}}]');
select t.ok((select count(*) from content where kind='item')=2,'JSON 한꺼번에 넣기');

-- 피드
select t.as(:'P1'); insert into feed_posts(text) values ('첫 글');
select t.as(:'P2');
insert into feed_likes(post_id) select id from feed_posts;
insert into feed_comments(post_id,text) select id,'반가워요' from feed_posts;
select t.ok((select likes=1 and comments=1 from feed_posts),'좋아요·댓글 수 자동 계산');
update feed_posts set text='바꿈';
select t.ok((select text from feed_posts)='첫 글','남의 글 수정 무시');
select t.fail($$insert into feed_posts(author,text) values ('00000000-0000-0000-0000-000000000001','사칭')$$,'다른 사람 이름으로 글쓰기');
select t.fail($$insert into feed_likes(post_id,user_id) select id,'00000000-0000-0000-0000-000000000003' from feed_posts$$,'남 대신 좋아요');
select t.as(:'P1'); update feed_posts set hidden=true;
select t.ok((select not hidden from feed_posts),'작성자가 스스로 가림 표시 불가');
select t.as(:'A',true); update feed_posts set hidden=true;
select t.as(:'P2'); select t.ok((select count(*) from feed_posts)=0,'운영자가 가린 글은 다른 유저에게 안 보임');
select t.as(:'P1'); select t.ok((select count(*) from feed_posts)=1,'작성자 본인은 가린 글 봄');

-- 채팅
select t.as(:'P1'); insert into chat_messages(channel,name,text) values ('lobby','운영자','안녕');
select t.ok((select name from chat_messages order by id desc limit 1)='아린','보낸 사람 이름은 서버가 채움(사칭 방지)');
select t.fail($$insert into chat_messages(channel,text) values ('world','공지 사칭')$$,'유저가 월드 공지 채널에 쓰기');
select t.fail($$insert into chat_messages(channel,text) values ('lobby; drop','x')$$,'잘못된 채널');
select t.as(:'A',true); insert into chat_messages(channel,name,cat,text) values ('world','운영자','notice','점검 안내');
select t.ok((select name from chat_messages where channel='world')='운영자','운영자는 이름 지정 가능');
insert into chat_messages(channel,name,cat,text) values ('world','운영자','maint','내일 점검');
select t.ok(exists(select 1 from chat_messages where cat='maint'),'월드 분류에 점검(maint)');
select t.fail($$insert into chat_messages(channel,name,cat,text) values ('world','운영자','event','x')$$,'없는 월드 분류');
-- 도배 막기: 5초 안에 4개까지, 5개째 막힘 (운영자는 제외)
select t.as(:'P3');
insert into chat_messages(channel,text) values ('lobby','1'),('lobby','2'),('lobby','3'),('lobby','4');
select t.fail($$insert into chat_messages(channel,text) values ('lobby','5')$$,'채팅 5초 안에 5개째');
insert into direct_messages(recipient,text) values (:'P1','a'),(:'P1','b'),(:'P1','c'),(:'P1','d');
select t.fail($$insert into direct_messages(recipient,text) values ('00000000-0000-0000-0000-000000000001','e')$$,'귓속말 5초 안에 5개째');
select t.as(:'A',true);
insert into chat_messages(channel,name,cat,text) values ('world','운영자','notice','a'),('world','운영자','notice','b'),('world','운영자','notice','c'),('world','운영자','notice','d'),('world','운영자','notice','e');
select t.ok(true,'운영자는 연속 공지 가능');

-- 귓속말
select t.as(:'P1'); insert into direct_messages(recipient,text) values (:'P3','비밀 얘기');
select t.as(:'P2'); select t.ok((select count(*) from direct_messages)=0,'남의 귓속말 못 봄');
select t.as(:'P3'); select t.ok((select count(*) from direct_messages where recipient=:'P3')=1,'받은 사람은 봄');

-- 우편
select t.as(:'P1'); select t.fail($$select admin_send_mail(null,'x')$$,'유저가 전체 우편');
select t.as(:'A',true); select t.ok(admin_send_mail(null,'점검 보상','{"potion":3}',500)=4,'운영 우편 전체 발송');
select t.as(:'P1');
select t.ok((select count(*) from mail)=1,'내 우편만 보임');
select t.ok((select (claim_mail((select id from mail))->>'gold')::int)=500,'첨부 받기');
select t.fail($$select claim_mail((select id from mail))$$,'같은 첨부 두 번 받기');
select t.fail($$update mail set claimed_at=null$$,'받음 표시 지우기');
-- 유저끼리 선물: send_mail 로만, 보내는 사람 세이브에서 차감
reset role;
insert into saves(user_id,data) values (:'P1','{"me":{"name":"아린","gold":1000,"inv":{"potion":5,"sword":1},"equip":{"weapon":"sword"}}}');
set role authenticated; select t.as(:'P1');
select t.fail($$insert into mail(recipient,text,items) values ('00000000-0000-0000-0000-000000000002','선물','{"potion":99}')$$,'표에 직접 아이템 첨부(차감 없이 복사)');
select t.fail($$insert into mail(recipient,text,gold) values ('00000000-0000-0000-0000-000000000002','선물',99999)$$,'표에 직접 골드 첨부');
insert into mail(recipient,text) values (:'P2','글만 보내기');
select t.ok(true,'표에 직접 글만 보내기는 가능');
select send_mail(:'P2','선물이에요','{"potion":2}',300);
reset role;
select t.ok((select (data->'me'->>'gold')::int=700 and (data->'me'->'inv'->>'potion')::int=3 from saves where user_id=:'P1'),'보낸 만큼 세이브에서 차감 (골드 1000→700, 회복약 5→3)');
set role authenticated; select t.as(:'P1');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{"potion":4}',0)$$,'가진 것보다 많은 아이템');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{}',701)$$,'가진 것보다 많은 골드');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{"sword":1}',0)$$,'장착 중인 장비(1개뿐)');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000001','x','{"potion":1}',0)$$,'나에게 보내기');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{"a":1,"b":1,"c":1,"d":1}',0)$$,'4종류 첨부');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{"potion":-5}',0)$$,'음수 개수');
select t.as(:'P3');
select t.fail($$select send_mail('00000000-0000-0000-0000-000000000002','x','{"potion":1}',0)$$,'세이브 없는 사람이 선물');
select t.as(:'P1');
reset role;
select t.ok((select (data->'me'->>'gold')::int=700 and (data->'me'->'inv'->>'potion')::int=3 from saves where user_id=:'P1'),'실패한 보내기는 아무것도 빼지 않음');
set role authenticated;
select t.as(:'P2'); select t.ok((select sender_name from mail where gold=300)='아린','받은 선물 · 보낸 이름은 서버가 채움');
select t.ok((select (claim_mail((select id from mail where gold=300))->>'gold')::int)=300,'받은 사람이 선물 받기');
delete from mail where text='글만 보내기';
select t.ok(not exists(select 1 from mail where text='글만 보내기'),'받은 우편 지우기');

-- 정지
select t.as(:'A',true); select admin_ban(:'P2', now()+interval '1 day','도배');
select t.as(:'P2');
select t.fail($$insert into chat_messages(channel,text) values ('lobby','도배')$$,'정지 중 채팅');
select t.fail($$insert into feed_posts(text) values ('도배')$$,'정지 중 글쓰기');
select t.as(:'A',true); select admin_ban(:'P2', null);
select t.as(:'P2'); insert into chat_messages(channel,text) values ('lobby','풀렸다');
select t.ok(true,'해제 후 채팅 가능');

-- 낚시
select t.as(:'P1'); insert into fish_catches(land,species,size_cm) values ('swamp','메기',41.5),('swamp','메기',55.0);
select t.as(:'P2'); insert into fish_catches(land,species,size_cm) values ('swamp','잉어',48.2);
select t.ok((select count(*) from fish_weekly where land='swamp')=2 and (select max(size_cm) from fish_weekly)=55.0,'주간 랭킹: 한 사람당 최고 기록');
select t.fail($$insert into fish_catches(land,species,size_cm,week) values ('swamp','메기',99,'2020-01-06')$$,'지난 주 기록 끼워넣기');

-- 행운권 (시계를 바꿔 끼워서 판매·마감·추첨·수령을 차례로 확인)
reset role;
create table t.clock(ts timestamptz); insert into t.clock values ('2026-11-04 03:00+00');   -- 수 12:00 KST
grant select on t.clock to authenticated;
create or replace function private.lotto_clock() returns timestamptz language sql stable set search_path='' as $$ select ts from t.clock $$;
insert into saves(user_id,data) values (:'P2','{"me":{"name":"벨라","gold":50,"inv":{}}}') on conflict (user_id) do nothing;
set role authenticated; select t.as(:'P1');
select t.fail($$insert into lotto_tickets(draw_key,nums) values ('2026-11-06','{1,2,3,4}')$$,'행운권 표에 직접 넣기(돈 안 내고)');
select buy_lotto('{3,1,2,4}'); select buy_lotto('{5,6,7,8}');
reset role;
select t.ok((select (data->'me'->>'gold')::int from saves where user_id=:'P1')=300,'2장 구매 → 400골드 차감 (700→300)');
select t.ok((select array_agg(nums::text order by nums::text) from lotto_tickets where user_id=:'P1')='{"{1,2,3,4}","{5,6,7,8}"}','번호는 정렬해서 저장 · 회차 2026-11-06');
select t.ok((select draw_at from lotto_draws where draw_key='2026-11-06')='2026-11-06 11:00+00','추첨 시각 = 금 20:00 KST');
set role authenticated; select t.as(:'P1');
select t.fail($$select buy_lotto('{0,1,2,3}')$$,'한 주 3장째');
select t.fail($$select buy_lotto('{1,1,2,3}')$$,'같은 숫자 두 번');
select t.fail($$select buy_lotto('{1,2,3,12}')$$,'0–9 밖 숫자');
select t.fail($$select buy_lotto('{1,2,3}')$$,'숫자 3개');
select t.as(:'P2'); select t.fail($$select buy_lotto('{1,2,3,4}')$$,'골드 부족(50G)');
select t.as(:'P3'); select t.fail($$select buy_lotto('{1,2,3,4}')$$,'세이브 없음');
select t.as(:'P1');
select t.ok((select jsonb_array_length(lotto_sync()->'tickets'))=2 and (select lotto_sync()->'draws')='{}','추첨 전: 내 행운권 2장 · 당첨 번호 없음');
select t.fail($$select claim_lotto((select id from lotto_tickets limit 1))$$,'추첨 전 수령');
select t.fail($$update lotto_tickets set rank=1$$,'등수 직접 수정');
reset role; update t.clock set ts='2026-11-06 10:30+00'; set role authenticated;   -- 금 19:30 KST
select t.as(:'P2'); select t.fail($$select buy_lotto('{1,2,3,4}')$$,'금 19:00 이후 판매 마감');
select t.as(:'P1');
select t.ok((select lotto_sync()->'draws')='{}','추첨 시각 전에는 아직 안 뽑음');
reset role; update t.clock set ts='2026-11-06 11:00:01+00'; set role authenticated;   -- 금 20:00:01 KST
select t.as(:'P1');
select lotto_sync();
select t.ok((select cardinality(nums)=4 and cardinality(array(select distinct unnest(nums)))=4 and nums=(select array_agg(x order by x) from unnest(nums) x) from lotto_draws where draw_key='2026-11-06' and drawn_at is not null),'추첨 시각 지나 결과를 보면 서버가 4개 뽑음(서로 다른·정렬)');
select t.ok((select lotto_sync()->'draws'->>'2026-11-06') is not null,'내 결과에 당첨 번호 포함');
reset role; create temp table t_first as select nums from lotto_draws where draw_key='2026-11-06'; grant select on t_first to authenticated; set role authenticated;
select lotto_sync(); select t.ok((select nums from lotto_draws where draw_key='2026-11-06')=(select nums from t_first),'한 번 뽑으면 다시 안 바뀜');
select t.ok(not exists(select 1 from lotto_tickets where rank is null),'추첨되면 모든 행운권 등수 매김');
-- 등수·상금 확인을 위해 당첨 번호를 정해 놓고 다시 매긴다
reset role; update lotto_draws set nums='{1,2,3,9}' where draw_key='2026-11-06'; update lotto_tickets set rank=null; select private.lotto_draw_due(); set role authenticated;
select t.as(:'P1');
select t.ok((select rank from lotto_tickets where nums='{1,2,3,4}')=2 and (select rank from lotto_tickets where nums='{5,6,7,8}')=0,'3개 일치 2등 · 0개 꽝');
select t.ok((select (claim_lotto((select id from lotto_tickets where nums='{1,2,3,4}'))->>'prize')::int)=3000,'2등 수령 3000골드');
reset role; select t.ok((select (data->'me'->>'gold')::int from saves where user_id=:'P1')=3300,'상금이 세이브에 더해짐 (300→3300)'); set role authenticated; select t.as(:'P1');
select t.fail($$select claim_lotto((select id from lotto_tickets where nums='{1,2,3,4}'))$$,'같은 행운권 두 번 수령');
select t.ok((select (claim_lotto((select id from lotto_tickets where nums='{5,6,7,8}'))->>'prize')::int)=0,'꽝 확인(0골드)');
select t.as(:'P2'); select t.fail($$select claim_lotto((select id from lotto_tickets limit 1))$$,'남의 행운권 수령(보이지도 않음)');
select t.ok(t.err($$select claim_lotto('00000000-0000-0000-0000-0000000000ff')$$)='NOT_FOUND','없는 행운권 → NOT_FOUND');
select t.as(:'P1'); select buy_lotto('{0,4,7,9}');
select t.ok((select draw_key from lotto_tickets where nums='{0,4,7,9}')='2026-11-13','추첨 뒤에는 다음 주 회차로 판매');
select t.fail($$select * from admin_lotto()$$,'유저가 운영 행운권 현황');
select t.as(:'A',true);
select t.ok((select tickets=2 and r2=1 and claimed=2 and paid=3000 from admin_lotto() where draw_key='2026-11-06'),'운영 현황: 판매 2 · 2등 1 · 수령 2 · 지급 3000');
select t.as(:'P1');

-- 운영 함수 · 문의 · 신고
select t.fail($$select * from admin_players()$$,'유저가 회원 목록');
select t.fail($$select admin_invite_create()$$,'유저가 초대코드 생성');
insert into inquiries(cat,text) values ('버그','장비가 사라졌어요');
insert into reports(target,kind,snapshot) values (:'P2','chat','도배');
update inquiries set answer='셀프 답변';
select t.ok((select answer is null from inquiries),'유저가 문의에 셀프 답변 불가');
select t.as(:'A',true);
select t.ok((select count(*) from admin_players())=4,'운영자 회원 목록');
select t.ok(length(admin_invite_create(null,5,'테스트'))=8,'초대코드 자동 생성');
update inquiries set answer='복구해 드렸습니다';
select t.ok((select answered_by is not null from inquiries),'답변자·시각 자동 기록');
update reports set done=true;
select t.ok((select handled_at is not null from reports),'신고 처리자·시각 자동 기록');
select t.ok((select count(*) from admin_log)>=4,'운영 기록(정지·해제·우편·초대코드)');

-- 운영: 유저 레벨 조정 (010)
select t.fail($$select admin_set_level('00000000-0000-0000-0000-000000000003',30)$$,'세이브 없는 유저 레벨 조정(NO_SAVE)');
reset role;
insert into saves(user_id,data) values (:'P3','{"v":3,"savedAt":1,"me":{"name":"카이","level":5,"exp":40,"gold":100,"inv":{}}}');
set role authenticated;
select t.as(:'P3');
select t.fail($$select admin_set_level('00000000-0000-0000-0000-000000000003',50)$$,'유저가 자기 레벨 조정');
select t.as(:'A',true);
select t.fail($$select admin_set_level('00000000-0000-0000-0000-000000000003',0)$$,'레벨 0');
select t.fail($$select admin_set_level('00000000-0000-0000-0000-000000000003',100)$$,'레벨 100');
select t.ok((select (admin_set_level(:'P3',30,'테스트')->>'before')::int)=5,'운영자 레벨 조정 5 → 30');
reset role;
select t.ok((select (data->'me'->>'level')::int=30 and (data->'me'->>'exp')::int=0 and (data->>'adminRev')::int=1 and (data->>'savedAt')::bigint>1 and (data->'me'->>'gold')::int=100 from saves where user_id=:'P3'),'세이브: LV30·경험치 0·adminRev 1·savedAt 갱신·골드 그대로');
select t.ok((select level from profiles where user_id=:'P3')=30,'프로필 레벨도 30');
set role authenticated; select t.as(:'P3');
-- 접속 중인 게임이 조정을 모른 채 예전 세이브(LV6·골드 999)를 올림 → 레벨·경험치만 서버 값 유지
insert into saves(user_id,data) values (:'P3','{"v":3,"savedAt":2,"me":{"name":"카이","level":6,"exp":10,"gold":999,"inv":{"potion":3}}}')
  on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=30 and (data->'me'->>'exp')::int=0 and (data->'me'->>'gold')::int=999 and (data->'me'->'inv'->>'potion')::int=3 and (data->>'adminRev')::int=1 from saves where user_id=:'P3'),'예전 세이브 덮어쓰기: 레벨·경험치는 운영 값, 나머지 진행은 게임 값');
-- 조정을 받은 게임(adminRev 1)이 자연 레벨업 후 저장 → 그대로 저장
insert into saves(user_id,data) values (:'P3','{"v":3,"adminRev":1,"savedAt":3,"me":{"name":"카이","level":31,"exp":5,"gold":1200,"inv":{}}}')
  on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=31 and (data->'me'->>'exp')::int=5 from saves where user_id=:'P3'),'조정 반영 뒤 레벨업 저장은 막지 않음');
select t.as(:'A',true);
select t.ok((select count(*) from admin_log where action='set_level' and target=:'P3' and (detail->>'after')::int=30)=1,'운영 기록에 레벨 조정');
reset role;
select 'ALL TESTS PASSED';
