import json,sys
from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read()
URL='http://localhost:8765/admin.html'
res=[]
def ok(c,label):
    res.append(('OK  ' if c else 'FAIL')+' '+label)
def setup(pg,role='admin',nosession=False):
    pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=f"window.__MOCK_ROLE='{role}';window.__MOCK_NOSESSION={'true' if nosession else 'false'};"+MOCK,content_type='application/javascript'))
    pg.route('**/fonts.g*/**',lambda r:r.abort())
with sync_playwright() as p:
    b=p.chromium.launch()
    pg=b.new_page(viewport={'width':1440,'height':900});errs=[]
    pg.on('pageerror',lambda e:errs.append('pageerror: '+str(e)));pg.on('console',lambda m: m.type=='error' and 'net::ERR_FAILED' not in m.text and errs.append(m.text))
    setup(pg)
    pg.goto(URL);pg.wait_for_selector('.li[data-id]',timeout=20000)
    ok(pg.locator('.kind').count()==7,'콘텐츠 종류 7개')
    n=pg.locator('.li[data-id]').count();ok(n>=40,f'몬스터 목록 {n}개 (코드 기본값)')
    ok('연결 준비 중' not in pg.inner_text('#view'),'게임 연결됨 → 미연결 안내 없음')
    pg.screenshot(path=OUT+'/1-content.png')
    # 기본값 올리기
    pg.click('#c-seed');pg.click('[data-ans="1"]');pg.wait_for_timeout(600)
    cnt=pg.evaluate('__DB.content.length');ok(cnt>200,f'기본값 서버 업로드 {cnt}개')
    ok(pg.locator('.chip.ok').count()>0,'서버 공개 표시')
    # 몬스터 편집·공개
    pg.click('.li[data-id="forest"]');pg.wait_for_selector('#c-json')
    d=json.loads(pg.input_value('#c-json'));d['hp']=999;pg.fill('#c-json',json.dumps(d,ensure_ascii=False))
    pg.click('#c-pub');pg.wait_for_timeout(300)
    body=pg.inner_text('#modal');ok('hp' in body,'공개 전 변경점(hp) 표시')
    pg.click('[data-ans="1"]');pg.wait_for_timeout(500)
    r=pg.evaluate("__DB.content.find(x=>x.kind==='monster'&&x.id==='forest')");ok(r['data']['hp']==999 and r['rev']==2,'공개 → 서버 반영 rev2')
    ok('기본값과 다름' in pg.inner_text('#view'),'기본값과 다름 표시')
    ok('hp' in pg.inner_text('.diff'),'기본값과 다른 점에 hp')
    pg.wait_for_selector('[data-restore]');pg.screenshot(path=OUT+'/2-editor.png',full_page=True)
    pg.click('[data-restore]');pg.click('[data-ans="1"]');pg.wait_for_timeout(500)
    r=pg.evaluate("__DB.content.find(x=>x.kind==='monster'&&x.id==='forest')");ok(r['data']['hp']!=999,'되돌리기')
    # 잘못된 JSON
    pg.fill('#c-json','{"name": "x",, }');pg.click('#c-check');ok('JSON 형식' in pg.inner_text('#c-msg'),'잘못된 JSON 안내')
    # 퀘스트 검사 (게임 검사 함수)
    pg.click('.kind[data-kind=quest]');pg.click('.li[data-id="E1"]');pg.wait_for_selector('#c-json')
    d=json.loads(pg.input_value('#c-json'));d['start']='nope';pg.fill('#c-json',json.dumps(d,ensure_ascii=False));pg.click('#c-check')
    msg=pg.inner_text('#c-msg');ok('문제' in msg,'퀘스트 검사로 잘못된 시작 단계 찾음: '+msg.split('\n')[1][:60] if '\n' in msg else msg[:80])
    # 초안
    pg.click('#c-draft');pg.wait_for_timeout(400);ok(pg.evaluate("__DB.content_drafts.length")==1,'초안 저장');ok('초안' in pg.inner_text('.kinds'),'종류에 초안 표시')
    pg.click('#c-dropdraft');pg.click('[data-ans="1"]');pg.wait_for_timeout(400);ok(pg.evaluate("__DB.content_drafts.length")==0,'초안 버리기')
    # 공개 설정(예약)
    pg.fill('#s-start','2030-01-01T09:00');pg.click('#s-save');pg.wait_for_timeout(400)
    ok(pg.evaluate("__DB.content.find(x=>x.kind==='quest'&&x.id==='E1').starts_at").startswith('2030-01-01T00:00'),'예약 공개 시각(한국 9시=UTC 0시)')
    ok('예약' in pg.inner_text('#view'),'예약 표시')
    # 새 전광판
    pg.click('.kind[data-kind=event]');pg.click('#c-new');pg.fill('#n-id','ev_test');pg.click('#nf .btn-p');pg.wait_for_timeout(400)
    ok(pg.evaluate("__DB.content_drafts.some(x=>x.id==='ev_test')"),'새 항목 → 초안')
    pg.click('#c-pub');pg.wait_for_timeout(200);pg.click('[data-ans="1"]');pg.wait_for_timeout(400)
    ok(pg.evaluate("__DB.content.some(x=>x.id==='ev_test')"),'새 전광판 공개')
    pg.click('#c-del');pg.click('[data-ans="1"]');pg.wait_for_timeout(400);ok(not pg.evaluate("__DB.content.some(x=>x.id==='ev_test')"),'삭제')
    # 회원
    pg.click('.tab[data-tab=players]');pg.wait_for_selector('[data-save]')
    ok(pg.locator('tbody tr').count()==3,'회원 3명');pg.screenshot(path=OUT+'/3-players.png')
    pg.click('[data-save="u2"]');pg.wait_for_selector('#sv-copy');ok('3,400' in pg.inner_text('#modal') and '회복약' in pg.inner_text('#modal'),'세이브 보기(골드·아이템 이름)');pg.keyboard.press('Escape')
    pg.click('[data-ban="u3"]');pg.fill('#b-why','도배');pg.click('#bf .btn-d');pg.wait_for_timeout(500)
    ok('정지 ~' in pg.inner_text('#view'),'정지 표시')
    pg.click('[data-unban="u3"]');pg.click('[data-ans="1"]');pg.wait_for_timeout(500);ok('정지 ~' not in pg.inner_text('#view'),'정지 해제')
    # 우편
    pg.click('[data-mail="u2"]');pg.wait_for_selector('#mf');ok(pg.is_checked('input[value=pick]'),'회원 → 우편: 받는 사람 미리 선택')
    pg.fill('#m-text','점검 보상');pg.fill('#m-gold','500');pg.click('#m-add');pg.select_option('[data-it]','potion');pg.fill('[data-n]','3')
    pg.click('#mf .btn-p');pg.wait_for_timeout(200);ok('1명' in pg.inner_text('#modal') and '회복약' in pg.inner_text('#modal'),'발송 확인창(1명·회복약)')
    pg.click('[data-ans="1"]');pg.wait_for_timeout(500);ok('점검 보상' in pg.inner_text('#view'),'최근 보낸 우편에 표시')
    pg.screenshot(path=OUT+'/4-mail.png')
    # 문의·신고
    pg.click('.tab[data-tab=inbox]');pg.wait_for_selector('[data-ans-in]');ok(pg.locator('.tab[data-tab=inbox] .num').inner_text()=='2','문의·신고 알림 2')
    pg.fill('[data-ans-in="i1"]','복구했습니다');pg.click('[data-ans="i1"]');pg.wait_for_timeout(500);ok('답변 ·' in pg.inner_text('#view'),'문의 답변')
    pg.click('[data-hide="chat:5"]');pg.wait_for_timeout(300);ok(pg.evaluate("__DB.chat_messages[0].hidden"),'신고된 채팅 가리기')
    pg.click('[data-done="r1"]');pg.wait_for_timeout(500);ok(pg.locator('.tab[data-tab=inbox] .num').count()==0,'처리 후 알림 0')
    # 초대코드
    pg.click('.tab[data-tab=invites]');pg.wait_for_selector('#if');pg.fill('#i-code','NEWCODE9');pg.click('#if .btn-p');pg.wait_for_timeout(600)
    ok('NEWCODE9' in pg.inner_text('#i-new'),'초대코드 생성');pg.screenshot(path=OUT+'/5-invites.png')
    # 기록
    pg.click('.tab[data-tab=log]');pg.wait_for_selector('.tbl tbody tr');t=pg.inner_text('#view')
    miss=[w for w in ['우편 발송','콘텐츠 수정','콘텐츠 되돌림','초대코드 생성','정지 해제'] if w not in t];ok(not miss,'운영 기록 통합 (빠진 것: '+','.join(miss)+')')
    pg.click('[data-go]');pg.wait_for_selector('[data-restore]');ok('삭제됨' in pg.inner_text('#view'),'기록 → 삭제된 항목 열기')
    pg.click('[data-restore]');pg.click('[data-ans="1"]');pg.wait_for_timeout(500);ok(pg.evaluate("__DB.content.some(x=>x.id==='ev_test')"),'삭제된 항목 살리기')
    ok(pg.locator('#c-json').count()==1,'살린 뒤 편집기 열림')
    ok(not errs,'콘솔 오류 없음 '+('; '.join(errs[:3])))
    # 휴대폰
    m=b.new_page(viewport={'width':390,'height':844},is_mobile=True,has_touch=True);merrs=[]
    m.on('pageerror',lambda e:merrs.append(str(e)));setup(m)
    m.goto(URL);m.wait_for_selector('.kind');m.screenshot(path=OUT+'/6-mobile-kinds.png')
    ok(not m.locator('.list-p').is_visible(),'휴대폰: 처음엔 종류만')
    m.click('.kind[data-kind=quest]');ok(m.locator('.list-p').is_visible() and not m.locator('.kinds-p').is_visible(),'휴대폰: 종류 → 목록')
    m.click('.li[data-id="E1"]');m.wait_for_selector('#c-json');ok(not m.locator('.list-p').is_visible(),'휴대폰: 목록 → 편집기');m.screenshot(path=OUT+'/7-mobile-editor.png')
    sw=m.evaluate('document.documentElement.scrollWidth');ok(sw<=390,f'휴대폰 가로 넘침 없음 ({sw}px)')
    m.click('.ed .back');ok(m.locator('.list-p').is_visible(),'휴대폰: 뒤로')
    m.click('.tab[data-tab=players]');m.wait_for_selector('[data-save]');m.screenshot(path=OUT+'/8-mobile-players.png')
    ok(not merrs,'휴대폰 콘솔 오류 없음 '+'; '.join(merrs[:3]))
    # 운영자 아님 / 로그인
    n=b.new_page();setup(n,role='user');n.goto(URL);n.wait_for_selector('.msg.warn');ok('운영자 권한이 없습니다' in n.inner_text('body'),'일반 계정 차단')
    l=b.new_page();setup(l,nosession=True);l.goto(URL);l.wait_for_selector('#lf');l.screenshot(path=OUT+'/9-login.png')
    l.fill('#lid','admin');l.fill('#lpw','x');l.click('#lgo');l.wait_for_selector('.li[data-id]',timeout=20000);ok(True,'로그인 → 콘텐츠')
    ok(l.evaluate("Object.keys(localStorage).filter(k=>k.startsWith('bleset')).length")==0,'게임 세이브 키를 건드리지 않음')
    b.close()
print('\n'.join(res));print('PASS',sum(r.startswith('OK') for r in res),'/',len(res))
