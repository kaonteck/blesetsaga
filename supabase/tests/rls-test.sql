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

-- 프로필 직업 (013)
select t.as(:'P1'); update profiles set job='mage' where user_id=:'P1';
select t.ok((select job from profiles where user_id=:'P1')='mage','프로필 직업: 클래스 id 저장');
select t.fail($$update profiles set job='<b>x</b>' where user_id='00000000-0000-0000-0000-000000000001'$$,'프로필 직업: 없는 클래스 값 막힘(013)');

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
-- 피드 (011): 이름·댓글 좋아요·답글·도배·사진 열 정리
select t.ok((select author_name from feed_posts)='아린','글쓴이 이름은 서버가 채움');
select t.ok((select author_name from feed_comments)='벨라','댓글 이름도 서버가 채움');
insert into feed_comment_likes(comment_id) select id from feed_comments;
select t.ok((select likes from feed_comments)=1,'댓글 좋아요 수 자동 계산');
select t.fail($$insert into feed_comment_likes(comment_id,user_id) select id,'00000000-0000-0000-0000-000000000003' from feed_comments$$,'남 대신 댓글 좋아요');
insert into feed_comments(post_id,parent_id,text) select post_id,id,'답글' from feed_comments where parent_id is null;
select t.ok((select count(*) from feed_comments where parent_id is not null)=1 and (select comments from feed_posts)=2,'원댓글에 답글 · 댓글 수 2');
select t.fail($$insert into feed_comments(post_id,parent_id,text) select post_id,id,'답글의 답글' from feed_comments where parent_id is not null$$,'답글에 답글(BAD_PARENT)');
delete from feed_comment_likes;
select t.ok((select likes from feed_comments where parent_id is null)=0,'댓글 좋아요 취소');
select t.fail($$insert into feed_posts(text,img_path) values ('사진','x/y.jpg')$$,'사진 경로 열 없음(사진 기능 삭제)');
select t.as(:'P3'); insert into feed_posts(text) values ('a'),('b'),('c'),('d'),('e');
select t.ok((select count(*) from feed_posts where author=:'P3')=5,'피드 글 연속 작성 제한 없음(012)');
insert into feed_comments(post_id,text) select id,n::text from feed_posts, generate_series(1,6) n where author=:'P3' and text='a';
select t.ok((select count(*) from feed_comments where author=:'P3')=6,'피드 댓글 연속 작성 제한 없음(012)');
update profiles set name='카이로' where user_id=:'P3';
select t.ok((select bool_and(author_name='카이로') from feed_posts where author=:'P3') and (select bool_and(author_name='카이로') from feed_comments where author=:'P3'),'이름 바꾸면 내 글·댓글 이름도 바뀜');
update profiles set name='카이' where user_id=:'P3';
select t.as(:'P2'); delete from feed_posts where text='a';
select t.as(:'P3'); select t.ok((select count(*) from feed_posts where text='a')=1,'남이 지우려 해도 그대로');

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
insert into saves(user_id,data) values (:'P1','{"me":{"name":"아린","level":12,"gold":1000,"inv":{"potion":5,"sword":1},"equip":{"weapon":"sword"}}}');
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
select t.as(:'P1'); insert into fish_catches(land,species,size_cm) values ('frost','얼음 송어',41.5),('frost','얼음 송어',55.0);
select t.as(:'P2'); insert into fish_catches(land,species,size_cm) values ('frost','얼음 송어',48.2);
select t.ok((select count(*) from fish_weekly where land='frost')=2 and (select max(size_cm) from fish_weekly)=55.0,'주간 랭킹: 한 사람당 최고 기록');
select t.fail($$insert into fish_catches(land,species,size_cm,week) values ('frost','얼음 송어',60,'2020-01-06')$$,'지난 주 기록 끼워넣기');

-- 문의 답변 우편 · 낚시 정산 (014)
select t.as(:'P2'); insert into inquiries(cat,text) values ('버그 신고','물고기가 안 잡혀요');
select t.fail($$insert into inquiries(cat,text) values ('없는분류','x')$$,'문의 분류는 게임 목록만');
select t.as(:'A',true); update inquiries set answer='확인했습니다' where text='물고기가 안 잡혀요';
select t.as(:'P2');
select t.ok((select count(*) from mail where recipient=:'P2' and sender is null and text like '[1:1 문의 답변] 확인했습니다%')=1,'문의 답변이 우편으로 도착');
select t.fail($$insert into fish_catches(land,species,size_cm) values ('moon','달고기',10)$$,'낚시 기록: 없는 지역 막힘');
reset role;
insert into fish_catches(user_id,land,species,size_cm,week,created_at) values
 (:'P1','meadow','피라미',12.0,public.kst_week()-7,now()-interval '7 days'),
 (:'P2','meadow','붕어',30.0,public.kst_week()-7,now()-interval '6 days'),
 (:'P3','meadow','메기',30.0,public.kst_week()-7,now()-interval '5 days'),
 (:'P1','sea','고등어',40.0,public.kst_week()-7,now()-interval '6 days'),
 (:'P3','meadow','메기',90.0,public.kst_week(),now());
set role authenticated; select t.as(:'P1');
select t.ok((select public.fish_settle())=2,'지난 주 지역 2곳 정산');
select t.ok((select public.fish_settle())=0,'두 번 불러도 한 번만');
select t.ok((select user_id from fish_awards where land='meadow')=:'P2','같은 크기면 먼저 낚은 사람이 1위(이번 주 기록은 정산 안 함)');
select t.ok((select count(*) from fish_awards)=2 and (select count(*) from fish_awards where week=public.kst_week())=0,'이번 주는 정산하지 않음');
select t.fail($$insert into fish_awards(week,land,user_id,species,size_cm) values (current_date,'sea','00000000-0000-0000-0000-000000000001','x',1)$$,'유저가 수상 기록 직접 쓰기');
select t.ok((select gold from mail where recipient=:'P1' and text like '[주간 낚시 랭킹]%바다의 땅%벤테의 낚시왕%')=500,'1위 우편: 500골드·칭호 안내');
-- 낚시 기록 제한 · 정산 막힘 방지 (015)
select t.as(:'P1');
select t.fail($$insert into fish_catches(land,species,size_cm) values ('frost',repeat('가',600),50)$$,'낚시 기록: 게임에 없는 물고기 이름(600자) 막힘');
select t.fail($$insert into fish_catches(land,species,size_cm) values ('frost','얼음 송어',9999)$$,'낚시 기록: 물고기 최대 크기 넘으면 막힘');
select t.fail($$insert into fish_catches(land,species,size_cm) values ('frost','얼음 송어',39.9)$$,'낚시 기록: 물고기 최소 크기 아래 막힘');
select t.fail($$insert into fish_catches(land,species,size_cm) values ('frost','고등어',30)$$,'낚시 기록: 다른 지역 물고기 막힘');
reset role;
alter table fish_catches disable trigger fish_check;   -- 015 전에 들어간 나쁜 기록 흉내
insert into fish_catches(user_id,land,species,size_cm,week,created_at) values
 (:'P1','frost',repeat('가',600),9999,public.kst_week()-14,now()-interval '14 days'),
 (:'P2','frost','빙어',15.0,public.kst_week()-14,now()-interval '13 days'),
 (:'P3','sea','새끼 리바이어던',500.0,public.kst_week()-14,now()-interval '13 days');
alter table fish_catches enable trigger fish_check;
set role authenticated; select t.as(:'P2');
select t.ok((select public.fish_settle())=2,'나쁜 기록이 있어도 정산 계속(2주 전 혹한·바다)');
select t.ok((select user_id from fish_awards where land='frost' and week=public.kst_week()-14)=:'P2','나쁜 기록은 1위가 못 됨 → 정상 기록이 1위');
select t.ok((select max(length(text)) from mail where text like '[주간 낚시 랭킹]%')<=500,'정산 우편 글 500자 이하');

-- 행운권 (시계를 바꿔 끼워서 판매·마감·추첨·수령을 차례로 확인)
reset role;
create table t.clock(ts timestamptz); insert into t.clock values ('2026-11-04 03:00+00');   -- 수 12:00 KST
grant select on t.clock to authenticated;
create or replace function private.lotto_clock() returns timestamptz language sql stable set search_path='' as $$ select ts from t.clock $$;
insert into saves(user_id,data) values (:'P2','{"me":{"name":"벨라","level":12,"gold":50,"inv":{}}}') on conflict (user_id) do nothing;
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
reset role; update saves set data=jsonb_set(jsonb_set(data,'{me,level}','3'),'{me,gold}','900') where user_id=:'P2'; set role authenticated;
select t.as(:'P2'); select t.fail($$select buy_lotto('{1,2,3,4}')$$,'행운권: LV10 미만은 서버에서도 막힘(016)');
reset role; update saves set data=jsonb_set(jsonb_set(data,'{me,level}','12'),'{me,gold}','50') where user_id=:'P2'; set role authenticated;
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
insert into inquiries(cat,text) values ('버그 신고','장비가 사라졌어요');
insert into reports(target,kind,snapshot) values (:'P2','chat','도배');
update inquiries set answer='셀프 답변';
select t.ok((select answer is null from inquiries where text='장비가 사라졌어요'),'유저가 문의에 셀프 답변 불가');
select t.as(:'A',true);
select t.ok((select count(*) from admin_players())=4,'운영자 회원 목록');
select t.ok(length(admin_invite_create(null,5,'테스트'))=8,'초대코드 자동 생성');
update inquiries set answer='복구해 드렸습니다' where text='장비가 사라졌어요';
select t.ok((select answered_by is not null and answered_at is not null from inquiries where text='장비가 사라졌어요'),'답변자·시각 자동 기록');
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

-- 부정 방지: 세이브 검사 (016)
reset role;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('00000000-0000-0000-0000-000000000004','p4@x','{"username":"p4"}','{}');
insert into saves(user_id,data) values ('00000000-0000-0000-0000-000000000004','{"me":{"name":"도윤","level":2,"exp":10,"gold":100,"inv":{"potion":1}}}');
update profiles set name='도윤', level=2 where user_id='00000000-0000-0000-0000-000000000004';
\set P4 '00000000-0000-0000-0000-000000000004'
set role authenticated; select t.as(:'P4');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":4,"exp":50,"gold":5000,"inv":{"potion":3}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=4 and (data->'me'->>'gold')::int=5000 and (guard->>'rev')::int=0 and jsonb_array_length(guard->'flags')=0 from saves where user_id=:'P4'),'정상 진행(LV2→4, 골드 100→5000)은 그대로 저장');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":99,"exp":500,"gold":5000,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=12 and (data->'me'->>'exp')::int=0 and (guard->>'rev')::int=1 and guard->'flags'->0->>'k'='level' from saves where user_id=:'P4'),'LV4→99 한 번에: 예산(10레벨)만큼 LV12로, 경험치 0, 의심 기록');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":13,"exp":0,"gold":5000,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P4')=12,'예산을 다 쓰면 바로 다음 레벨업도 막힘(1분에 1레벨씩 참)');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":5,"exp":0,"gold":5000,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P4')=12,'레벨은 내려가지 않음(예전 기기 저장)');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":12,"exp":0,"gold":9999999,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'gold')::numeric between 100000 and 100200 and guard->'flags'->0->>'k'='gold' from saves where user_id=:'P4'),'골드 5천→999만: 예산(10만)까지만, 의심 기록');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":12,"exp":0,"gold":-50,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'gold')::numeric from saves where user_id=:'P4')=0,'골드 음수 → 0');
reset role;
insert into mail(recipient,sender,sender_name,text,gold,claimed_at) values (:'P4',null,'운영자','보상',70000,now());
set role authenticated; select t.as(:'P4');
insert into saves(user_id,data) select user_id, jsonb_set(data,'{me,gold}','70000') from saves where user_id=:'P4' on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'gold')::numeric from saves where user_id=:'P4')=70000,'서버에서 받은 우편 골드(7만)는 예산과 따로 인정');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":12,"exp":0,"gold":70000,"inv":{"potion":120,"herb":2.4}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->'inv'->>'potion')::int=120 and (data->'me'->'inv'->>'herb')::int=2 and (guard->>'rev')::int=5 and guard->'flags'->0->>'k'='gold' from saves where user_id=:'P4'),'020: 아이템 99개 넘어도 그대로(120, 보정 번호 그대로, 의심 기록 없음)');
insert into saves(user_id,data) values (:'P4','{"me":{"name":"도윤","level":12,"exp":0,"gold":70000,"inv":{"potion":50000}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->'inv'->>'potion')::int=9999 and (guard->>'rev')::int=6 and guard->'flags'->0->>'k'='inv' from saves where user_id=:'P4'),'아이템 5만 개 → 9,999개, 보정 번호 올림, 의심 기록');
insert into saves(user_id,data) values (:'P4','{"adminRev":99,"me":{"name":"도윤","level":12,"exp":0,"gold":70000,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select not (data ? 'adminRev') from saves where user_id=:'P4'),'운영 조정 번호(adminRev)는 유저가 못 올림');
select t.fail($$update saves set guard='{}' where user_id='00000000-0000-0000-0000-000000000004'$$,'검사 상태(guard) 직접 고치기');
select t.fail($$insert into saves(user_id,data,guard) values ('00000000-0000-0000-0000-000000000004','{}','{}') on conflict (user_id) do update set guard=excluded.guard$$,'검사 상태(guard) 넣기');
insert into saves(user_id,data) values (:'P4','{"v":3}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P4')=12,'캐릭터 없는 저장으로 기존 캐릭터를 지우지 못함');
update profiles set level=99 where user_id=:'P4';
select t.ok((select level from profiles where user_id=:'P4')=12,'공개 프로필 레벨은 세이브 레벨(99로 못 부풀림)');
select t.fail($$select admin_save_flags()$$,'유저가 의심 목록 보기');
select t.as(:'A',true);
select t.ok((select n from admin_save_flags() where user_id=:'P4')>=3,'운영자: 의심 목록에 레벨·골드·인벤토리');
select admin_clear_flags(:'P4');
select t.ok((select count(*) from admin_save_flags() where user_id=:'P4')=0,'운영자: 의심 기록 지우기');
-- 서버 함수(운영 레벨 조정)는 검사 안 받음
select t.ok((select (admin_set_level(:'P4',60,'테스트')->>'after')::int)=60,'운영자 레벨 조정은 예산과 무관(LV12→60)');
reset role;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P4')=60,'세이브 LV60');

-- 016 보완 (017): 첫 업로드는 자르지 않음 · 계정 삭제는 서버 함수로
reset role;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('00000000-0000-0000-0000-000000000005','p5@x','{"username":"p5"}','{}');
\set P5 '00000000-0000-0000-0000-000000000005'
set role authenticated; select t.as(:'P5');
insert into saves(user_id,data) values (:'P5','{"me":{"name":"하람","level":30,"exp":10,"gold":250000,"inv":{"potion":120}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=30 and (data->'me'->>'gold')::int=250000 and (data->'me'->'inv'->>'potion')::int=120 from saves where user_id=:'P5'),'첫 업로드(이 기기에서 키운 LV30·25만 골드·회복약 120)는 자르지 않음');
select t.ok((select jsonb_array_length(guard->'flags')=2 and guard->'flags'->0->>'k'='first' from saves where user_id=:'P5'),'첫 업로드가 크면 의심 기록만 2건(레벨·골드)');
insert into saves(user_id,data) values (:'P5','{"me":{"name":"하람","level":31,"exp":0,"gold":250500,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P5')=31,'그 뒤 저장은 평소처럼(LV31)');
reset role;
insert into mail(recipient,sender,sender_name,text,gold) values (:'P5',null,'운영자','선물',100);
insert into fish_catches(user_id,land,species,size_cm) values (:'P5','frost','빙어',10);
set role authenticated; select t.as(:'P5');
update profiles set name='하람', level=31, job='mage', title='t_x', memo='안녕' where user_id=:'P5';
select t.fail($q$do $x$ begin perform set_config('request.jwt.claims','{}',true); perform public.reset_my_save(); end $x$$q$,'로그인 없이 계정 삭제');
select t.as(:'P5');
select reset_my_save();
reset role;
select t.ok((select data='{}'::jsonb and (guard->>'rev') is not null and jsonb_array_length(guard->'flags')=2 from saves where user_id=:'P5'),'계정 삭제: 세이브 비움(보정 번호·의심 기록은 남김)');
select t.ok((select count(*) from mail where recipient=:'P5')=0 and (select count(*) from fish_catches where user_id=:'P5')=0,'계정 삭제: 우편·낚시 기록도 삭제');
select t.ok((select level=1 and job is null and title is null and memo is null from profiles where user_id=:'P5'),'계정 삭제: 공개 프로필 레벨·직업·칭호·메모 처음으로');
set role authenticated; select t.as(:'P5');
insert into saves(user_id,data) values (:'P5','{"v":3}') on conflict (user_id) do update set data=excluded.data;
insert into saves(user_id,data) values (:'P5','{"me":{"name":"새싹","level":1,"exp":0,"gold":100,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int=1 and (data->'me'->>'gold')::int=100 and data->'me'->>'name'='새싹' from saves where user_id=:'P5'),'삭제 뒤 새 캐릭터는 LV1부터(예전 LV31이 안 붙음)');
insert into saves(user_id,data) values (:'P5','{"me":{"name":"새싹","level":30,"exp":0,"gold":100,"inv":{}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok((select (data->'me'->>'level')::int from saves where user_id=:'P5')=11,'삭제로 첫 업로드 예외를 다시 쓸 수 없음(LV30 요청 → 11)');

-- 부정 방지 2차(1): 아이템 검사 — 기록만 (018)
reset role;
insert into auth.users(id,email,raw_user_meta_data,raw_app_meta_data) values ('00000000-0000-0000-0000-000000000006','p6@x','{"username":"p6"}','{}');
\set P6 '00000000-0000-0000-0000-000000000006'
insert into content(kind,id,data) values ('item','ev_gem','{"name":"축제 보석","type":"mat"}');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":2}}}');
create function t.flags(u uuid) returns text language sql security definer as $$ select coalesce(string_agg(f->>'k', ','), '') from public.saves s, jsonb_array_elements(s.guard->'flags') f where s.user_id = u $$;
grant execute on function t.flags(uuid) to authenticated;
set role authenticated; select t.as(:'P6');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":7,"herb":3,"ev_gem":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6')='','정상 획득(물약·약초·운영 공개 아이템)은 기록 없음');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":7,"herb":3,"ev_gem":1,"cheat_blade":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6')='item_unknown' and (select (data->'me'->'inv'->>'cheat_blade')::int=1 from saves where user_id=:'P6'),'게임에 없는 아이템 → 기록만(아이템은 그대로)');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":7,"herb":3,"ev_gem":1,"cheat_blade":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6')='item_unknown','같은 아이템은 다음 저장에서 다시 기록하지 않음');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":7,"herb":3,"ev_gem":1,"cheat_blade":1,"g8_gsword":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6') like 'gear,%','LV5가 LV80 장비를 얻음 → 높은 장비 기록');
reset role;
insert into mail(recipient,sender,sender_name,text,items,claimed_at) values (:'P6',null,'친구','선물','{"g7_staff":1}',now());
set role authenticated; select t.as(:'P6');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":5000,"inv":{"potion":7,"herb":3,"ev_gem":1,"cheat_blade":1,"g8_gsword":1,"g7_staff":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6') like 'gear,%' and t.flags(:'P6') not like 'gear,gear%','우편으로 받은 높은 장비는 기록 안 함');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":1000,"inv":{"potion":99,"herb":99,"ev_gem":1,"cheat_blade":1,"g8_gsword":1,"g7_staff":1}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6') like 'gear,%' and t.flags(:'P6') not like 'items%','골드 4천을 쓰고 아이템 188개 → 구매로 인정(기록 없음)');
insert into saves(user_id,data) values (:'P6','{"me":{"name":"이안","level":5,"exp":0,"gold":1000,"inv":{"potion":99,"herb":99,"ev_gem":1,"cheat_blade":1,"g8_gsword":1,"g7_staff":1,"ore":99,"salt":99,"pearl":99}}}') on conflict (user_id) do update set data=excluded.data;
select t.ok(t.flags(:'P6') like 'items,%' and (select (data->'me'->'inv'->>'pearl')::int=99 from saves where user_id=:'P6'),'골드 안 쓰고 아이템 297개 한 번에 → 개수 증가 기록(아이템은 그대로)');

-- 파티 방 (019)
reset role; set role authenticated; select t.as(:'P1');
select party_create('m_test','첫 파티',2,'public','{"hp":1}') as rid \gset
select t.ok((select status='gather' and jsonb_array_length(members)=1 and members->0->>'name'='아린' and leader=:'P1' from party_rooms where id=:'rid'),'파티 만들기: 파티장이 첫 파티원(이름은 서버 프로필)');
select t.fail($$insert into party_rooms(leader,monster_id,name,target) values ('00000000-0000-0000-0000-000000000001','x','x',2)$$,'방 표에 직접 넣기');
select t.as(:'P2');
select t.ok((select count(*) from party_rooms where id=:'rid')=1,'다른 블레서도 열린 방을 봄');
select t.ok((select count(*) from party_state where room_id=:'rid')=0,'전투 상태는 방 사람만');
select party_join(:'rid','{}');
select t.ok((select jsonb_array_length(members)=2 and members->1->>'name'='벨라' from party_rooms where id=:'rid'),'참가 → 파티원 2명');
select t.as(:'P5');
select t.fail(format($$select party_join(%L,'{}')$$, :'rid'),'꽉 찬 방에 참가(FULL)');
select t.as(:'P2');
select party_ready(:'rid', true);
select t.ok((select (members->1->>'ready')::boolean from party_rooms where id=:'rid'),'준비 완료 표시');
select t.fail(format($$select party_start(%L)$$, :'rid'),'파티원이 출발시키기(NOT_LEADER)');
select t.fail(format($$select party_kick(%L,'00000000-0000-0000-0000-000000000001')$$, :'rid'),'파티원이 파티장 내보내기');
select t.as(:'P1');
select t.fail(format($$select party_set(%L,'[{"name":"용병 카스","job":"hacker","level":5}]')$$, :'rid'),'용병 직업은 클래스만');
select party_set(:'rid','[]');
select party_start(:'rid');
select t.ok((select status from party_rooms where id=:'rid')='battle','파티장이 출발 → 전투');
select t.as(:'P2');
select party_act(:'rid', 1, '{"action":{"kind":"defend"}}');
select t.ok((select turn=1 and action->'action'->>'kind'='defend' from party_acts where room_id=:'rid' and uid=:'P2'),'파티원 행동 올리기');
select t.fail(format($$select party_push(%L,'{"turn":1}',1,false)$$, :'rid'),'파티원이 전투 상태 올리기');
select party_say(:'rid','같이 가요 <b>x</b>');
select t.as(:'P5');
select t.fail(format($$select party_act(%L,1,'{"x":1}')$$, :'rid'),'방 밖 사람의 행동(NOT_BATTLE)');
select t.ok((select count(*) from party_acts where room_id=:'rid')=0 and (select count(*) from party_msgs where room_id=:'rid')=0,'방 밖 사람은 행동·채팅 못 봄');
select t.fail(format($$select party_say(%L,'끼어들기')$$, :'rid'),'방 밖 사람 채팅');
select t.as(:'P1');
select party_push(:'rid','{"turn":2,"over":null}',3,false);
select t.ok((select count(*) from party_acts where room_id=:'rid')=1 and (select name from party_msgs where room_id=:'rid')='벨라','파티장이 행동·채팅(서버가 이름 붙임)을 봄');
select t.as(:'P2');
select t.ok((select rev=3 and state->>'turn'='2' from party_state where room_id=:'rid'),'파티원이 전투 상태를 받음');
select t.as(:'P1');
select party_push(:'rid','{"turn":3,"over":"win"}',4,true);
select t.ok((select status from party_rooms where id=:'rid')='closed','전투 끝 → 방 닫힘');
select t.as(:'P5');
select t.ok((select count(*) from party_rooms where id=:'rid')=0,'닫힌 방은 방 밖 사람에게 안 보임');
select t.fail(format($$select party_join(%L,'{}')$$, :'rid'),'닫힌 방 참가(NO_ROOM)');
select t.as(:'P1');
select party_create('m_test','둘째',3) as rid2 \gset
select party_create('m_test','셋째',3) as rid3 \gset
select t.ok((select status from party_rooms where id=:'rid2')='closed' and (select status from party_rooms where id=:'rid3')='gather','새 방을 만들면 예전 방은 닫힘(한 사람 한 방)');
select t.as(:'P2'); select party_join(:'rid3','{}');
select t.as(:'P5'); select party_join(:'rid3','{}');
select t.as(:'P2'); select party_leave(:'rid3');
select t.ok((select jsonb_array_length(members) from party_rooms where id=:'rid3')=2,'파티원 나가기');
select t.as(:'P1'); select party_kick(:'rid3', :'P5');
select t.ok((select jsonb_array_length(members) from party_rooms where id=:'rid3')=1,'파티장이 내보내기');
select party_leave(:'rid3');
select t.ok((select status from party_rooms where id=:'rid3')='closed','파티장이 나가면 방 닫힘');

-- 파티 보완 (022): 초대 전용 · card 값 검사
reset role;
update saves set data=jsonb_set(data,'{me,inv}',coalesce(data->'me'->'inv','{}'::jsonb)||'{"sword":1}') where user_id=:'P5';
update profiles set level=5 where user_id=:'P5';
set role authenticated; select t.as(:'P1');
select party_create('m_test','초대방',4,'invite','{}') as rid4 \gset
select t.as(:'P5');
select t.fail(format($$select party_join(%L,'{}')$$, :'rid4'),'초대 전용 방에 초대 없이 참가(NOT_INVITED)');
select t.fail(format($$select party_invite(%L,'00000000-0000-0000-0000-000000000002')$$, :'rid4'),'파티원 아닌 사람이 초대(NOT_LEADER)');
select t.as(:'P1');
select party_invite(:'rid4', :'P5');
select t.as(:'P5');
select t.fail(format($$select party_join(%L,'{"bonus":{"atk":99999}}')$$, :'rid4'),'card 보너스 99999 막힘(BAD_CARD)');
select t.fail(format($$select party_join(%L,'{"equip":{"weapon":"g8_gsword"}}')$$, :'rid4'),'card 레벨보다 높은 장비 막힘');
select t.fail(format($$select party_join(%L,'{"equip":{"weapon":"cheat_blade"}}')$$, :'rid4'),'card 게임에 없는 장비 막힘');
select t.fail(format($$select party_join(%L,'{"equip":{"weapon":"staff"}}')$$, :'rid4'),'card 세이브에 없는 장비 막힘');
select t.fail(format($$select party_join(%L,'{"enh":{"sword":50}}')$$, :'rid4'),'card 강화 50 막힘');
select t.fail(format($$select party_join(%L,'{"hp":5}')$$, :'rid4'),'card 체력 5 막힘');
select t.fail(format($$select party_join(%L,'{"x":1}')$$, :'rid4'),'card 모르는 항목 막힘');
select party_join(:'rid4','{"equip":{"weapon":"sword"},"enh":{"sword":3},"bonus":{"atk":8},"hp":0.5}');
select t.ok((select jsonb_array_length(members)=2 and members->1->'card'->'equip'->>'weapon'='sword' from party_rooms where id=:'rid4'),'초대받은 사람은 초대 전용 방에 참가 · 정상 card');
select t.as(:'P1'); select party_leave(:'rid4');

-- 만신전 공유 (026)
select t.as(:'P1');
select t.fail($$select mass_spawn('ev_rift',30,20,'{}')$$,'운영자 아닌 사람이 만신전 띄우기(NOT_ADMIN)');
select t.as(:'A',true);
select t.fail($$select mass_spawn('ev_rift',30,21,'{}')$$,'정원 21명 막힘');
select mass_spawn('ev_rift',30,3,'{"loc":"성문 인근","title":"균열"}') as mr \gset
select t.ok((select kind='mass' and status='gather' and target=3 and until>now() and jsonb_array_length(members)=0 from party_rooms where id=:'mr'),'운영자가 만신전 띄움(모집 중 · 원정대 0명)');
select t.as(:'P1');
select t.ok((select count(*) from party_rooms where id=:'mr')=1,'다른 블레서도 만신전 방을 읽음');
select t.fail(format($$select party_join(%L,'{}')$$, :'mr'),'파티 참가 함수로 만신전 방에 들어가기(NO_ROOM)');
select mass_join(:'mr','{"hp":1}');
select t.ok((select leader from party_rooms where id=:'mr')=:'P1','처음 들어온 블레서가 공대장');
select t.as(:'P2'); select mass_join(:'mr','{}');
select t.fail(format($$select mass_start(%L)$$, :'mr'),'공대장 아닌 원정대원은 마감 전 출발 못 함');
select t.fail(format($$select party_set(%L,'[]',null,8)$$, :'mr'),'만신전 방 정원 바꾸기(파티 함수) 막힘');
select t.as(:'P1');
select t.fail(format($$select party_kick(%L,%L)$$, :'mr', :'P2'),'공대장도 파티 함수로 원정대원 내보내기 못 함');
select party_leave(:'mr');
select t.ok((select status='gather' and leader=:'P2' and jsonb_array_length(members)=1 from party_rooms where id=:'mr'),'공대장이 나가면 이벤트는 그대로 · 다음 사람이 공대장');
select mass_join(:'mr','{}');
select t.as(:'P3'); select mass_join(:'mr','{}');
select t.as(:'P5');
select t.fail(format($$select mass_join(%L,'{}')$$, :'mr'),'정원이 차면 참가 막힘(FULL)');
select t.as(:'P2'); select mass_start(:'mr');
select t.ok((select status from party_rooms where id=:'mr')='battle','공대장 출발 → 전투');
select party_push(:'mr','{"turn":1}',1,false);
select t.as(:'P1');
select t.ok((select count(*) from party_state where room_id=:'mr')=1,'원정대원은 전투 상태를 읽음');
select party_act(:'mr',1,'{"action":{"kind":"move","to":11}}'); select party_say(:'mr','가자');
select t.as(:'P5');
select t.ok((select count(*) from party_state where room_id=:'mr')=0 and (select count(*) from party_msgs where room_id=:'mr')=0,'원정대 밖 사람은 전투 상태·레이드 채팅 못 봄');
-- 마감이 지나도 공대장이 출발하지 않으면 원정대 누구나
select t.as(:'A',true); select mass_spawn('ev_rift',30,20,'{}') as mr2 \gset
select t.ok((select status from party_rooms where id=:'mr')='battle','새 만신전을 띄워도 전투 중인 만신전은 그대로');
select t.as(:'P1'); select mass_join(:'mr2','{}');
select t.as(:'P3'); select mass_join(:'mr2','{}');
reset role; update party_rooms set until=now()-interval '20 seconds' where id=:'mr2'; set role authenticated;
select t.as(:'P5');
select t.fail(format($$select mass_join(%L,'{}')$$, :'mr2'),'집결 마감 뒤 참가 막힘');
select t.as(:'P3'); select mass_start(:'mr2');
select t.ok((select status='battle' and leader=:'P3' from party_rooms where id=:'mr2'),'마감 10초가 지나면 원정대 누구나 출발(그 사람이 공대장)');
-- 만신전 원정대원이 파티를 만들어도 이벤트는 닫히지 않음(원정대에서만 빠짐)
select t.as(:'A',true); select mass_spawn('ev_rift',30,20,'{}') as mr3 \gset
select t.as(:'P1'); select mass_join(:'mr3','{}');
select party_create('m_test','다른 파티',3) as rid5 \gset
select t.ok((select status='gather' and jsonb_array_length(members)=0 from party_rooms where id=:'mr3'),'원정대원이 파티를 만들면 원정대에서만 빠짐(만신전은 그대로)');
select party_leave(:'rid5');
select t.as(:'A',true); select mass_spawn('ev_crown',10,20,'{}');
select t.ok((select status from party_rooms where id=:'mr3')='closed','새 만신전을 띄우면 모집 중이던 만신전은 닫힘');

-- 031 서버 공동 목표
select t.as(:'P1');
select t.fail($q$insert into weekly_goals(week,kind,target,name) values (goal_week(),'kill',10,'x')$q$,'일반 유저는 공동 목표 못 만듦');
select t.as(:'A',true);
select t.fail($q$insert into weekly_goals(week,kind,target,name,items) values (goal_week(),'kill',10,'x','{"no_such":1}')$q$,'없는 아이템 보상 막힘');
select t.fail($q$insert into weekly_goals(week,kind,target,name) values (goal_week(),'hack',10,'x')$q$,'모르는 종류 막힘');
insert into weekly_goals(week,kind,target,name,gold,items,total) values (goal_week(),'kill',1000,'몬스터 천 마리',100,'{"potion":1}',999);
select t.ok((select total from weekly_goals where week=goal_week())=0,'운영자가 만들어도 합계는 0부터');
select t.as(:'P1');
select t.ok((select goal_add('explore',1)->>'reason')='OTHER_KIND','다른 종류는 아무 일도 안 함');
select t.ok((select (goal_add('kill:m_dog',1000)->>'added')::int)=300,'한 번에 예산(300)까지만');
select t.ok((select goal_add('kill',5)->>'reason')='QUEUED','예산을 다 쓰면 넘친 양은 대기분으로(032)');
select t.ok((select (goal_status()->>'pending')::int)=705,'대기분 705 = 넘친 700 + 5');
select goal_add('kill',1000);
select t.ok((select goal_add('kill',1000)->>'reason')='TOO_FAST' and (select (goal_status()->>'pending')::int)=2000,'대기분 상한(처치 2,000)을 넘는 양만 버림');
reset role; update weekly_goal_progress set at=at-interval '10 minutes' where week=goal_week() and user_id=:'P1'; set role authenticated; select t.as(:'P1');
select t.ok((select (goal_status()->>'mine')::int)=360 and (select (goal_status()->>'pending')::int)=1940,'예산이 다시 차면 상태를 읽을 때 대기분부터 합계로(10분 = 60)');
reset role; update weekly_goal_progress set n=300, pending=0 where week=goal_week() and user_id=:'P1'; update weekly_goals set total=300 where week=goal_week(); set role authenticated; select t.as(:'P1');
update weekly_goals set total=999999 where week=goal_week();
select t.ok((select total from weekly_goals where week=goal_week())=300,'유저는 합계 못 바꿈');
select t.ok((select (goal_status()->>'mine')::int)=300 and (select (goal_status()->>'total')::int)=300,'상태: 합계·내 기여');
select t.as(:'P2');
select t.ok((select count(*) from weekly_goal_progress)=0,'남의 기여 줄은 못 봄');
select t.as(:'A',true);
update weekly_goals set target=305, total=0 where week=goal_week();
select t.ok((select total=300 and target=305 from weekly_goals where week=goal_week()),'운영자는 목표만 고치고 합계는 그대로');
select t.as(:'P2');
select t.ok((select (goal_add('kill',5)->>'done')::bool),'목표에 닿으면 달성');
select t.as(:'P1');
select t.ok((select count(*) from mail where recipient=:'P1' and text like '[공동 목표 달성]%' and gold=100 and items='{"potion":1}')=1,'기여한 블레서 1에게 우편(골드·아이템)');
select t.as(:'P2');
select t.ok((select count(*) from mail where recipient=:'P2' and text like '[공동 목표 달성]%')=1,'기여한 블레서 2에게 우편');
select t.as(:'P3');
select t.ok((select count(*) from mail where recipient=:'P3' and text like '[공동 목표 달성]%')=0,'기여 안 한 블레서는 우편 없음');
select t.ok((select goal_add('kill',1)->>'reason')='DONE','달성 뒤에는 더 안 받음');
select t.ok((select (goal_status()->>'pending')::int)=0,'달성 뒤 대기분 없음');
select t.ok((select goal_settle())=0,'정산 다시 불러도 두 번 안 보냄');
select t.as(:'A',true);
select t.fail($q$update weekly_goals set gold=99999 where week=goal_week()$q$,'보상 보낸 주는 보상 못 바꿈');
select t.ok((select paid_n from weekly_goals where week=goal_week())=2,'보낸 인원 기록');
select t.ok((select people from admin_goals(4) where week=goal_week())=2,'운영: 기여 인원');
select t.as(:'P1');
select t.fail('select * from admin_goals(4)','일반 유저 admin_goals 막힘');
-- 지난 주에 다 찼는데 못 보낸 것 → settle이 보냄 · 기본 순환 목록
reset role;
insert into weekly_goals(week,kind,target,name,gold) values (goal_week()-7,'fish',3,'지난 주',50);
update weekly_goals set total=3 where week=goal_week()-7;
insert into weekly_goal_progress(week,user_id,n) values (goal_week()-7,:'P3',3);
select private.goal_ensure(date '2026-01-12');
select t.ok((select kind='explore' and auto from weekly_goals where week=date '2026-01-12'),'목표가 없는 주는 기본 순환 목록에서');
set role authenticated; select t.as(:'P3');
select t.ok((select goal_settle())=1,'지난 주 늦은 달성도 정산');
select t.ok((select count(*) from mail where recipient=:'P3' and gold=50)=1,'지난 주 기여자 우편');
select 'ALL TESTS PASSED';
