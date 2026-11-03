from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read();res=[]
A='aaaaaaaa-0000-0000-0000-00000000000a';B='bbbbbbbb-0000-0000-0000-00000000000b'
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':900});errs=[]
    ctx.route('**/fonts.g*/**',lambda r:r.abort())
    def player(uid,user,name):
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)))
        pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(name+': '+m.text))
        pg.add_init_script(f"window.__UID='{uid}';window.__USERNAME='{user}';")
        pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
        pg.goto('http://localhost:8765/');pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
        pg.fill('input[maxlength="10"]',name);pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
        pg.evaluate("cloudFlush()");pg.wait_for_timeout(500);return pg
    a=player(A,'arin','아린');bp=player(B,'bella','하늘별')
    db=lambda:a.evaluate("JSON.parse(localStorage.getItem('__mockdb'))")
    put=lambda js:a.evaluate("(()=>{const d=JSON.parse(localStorage.getItem('__mockdb'));"+js+";localStorage.setItem('__mockdb',JSON.stringify(d));})()")

    # ── 1:1 문의 ──
    a.evaluate("S.sel.pop='set';S.sel.setTab='ask';renderPop()");a.wait_for_timeout(200)
    ok('보낸 문의가 없습니다' in a.inner_text('#pop'),'문의 탭: 서버 문의 없음')
    a.select_option('#ask-cat','버그 신고');a.fill('#ask-text','짧음');a.click('#pop [data-form="ask"] button[type=submit]');a.wait_for_timeout(300)
    ok(len(db()['inquiries'])==0 and '5자 이상' in a.inner_text('#toasts'),'5자 미만은 안 보냄')
    a.fill('#ask-text','낚시 랭킹이 안 보여요 확인 부탁드립니다');a.click('#pop [data-form="ask"] button[type=submit]');a.wait_for_timeout(800)
    q=db()['inquiries'];ok(len(q)==1 and q[0]['author']==A and q[0]['cat']=='버그 신고','문의가 서버에 저장(분류·작성자)')
    ok('낚시 랭킹이 안 보여요' in a.inner_text('#pop') and '답변 대기' in a.inner_text('#pop') and a.input_value('#ask-text')=='','내 문의 목록에 답변 대기로 표시 · 입력칸 비움')
    ok(not a.evaluate("(S.inquiries||[]).some(x=>x.text.includes('낚시 랭킹이'))"),'이 기기 문의 목록(S.inquiries)에는 안 들어감')
    # 운영자 답변(서버 트리거 흉내: 답 + 우편) → 실시간 반영
    qid=q[0]['id']
    put(f"const x=d.inquiries.find(i=>i.id==='{qid}');x.answer='확인 후 고쳤습니다';x.answered_at=new Date().toISOString();d.mail.push({{id:'mq1',recipient:'{A}',sender:null,sender_name:'운영자',text:'[1:1 문의 답변] 확인 후 고쳤습니다',items:{{}},gold:0,read_at:null,claimed_at:null,archived:false,created_at:new Date().toISOString()}})")
    a.evaluate(f"(()=>{{const d=JSON.parse(localStorage.getItem('__mockdb'));window.__notifyRT('inquiries',d.inquiries[0],'UPDATE');window.__notifyRT('mail',d.mail.find(m=>m.id==='mq1'),'INSERT');}})()");a.wait_for_timeout(1200)
    ok('답변 완료' in a.inner_text('#pop') and '확인 후 고쳤습니다' in a.inner_text('#pop'),'답변이 실시간으로 문의 탭에 표시')
    ok(a.evaluate("S.mail.some(m=>m.id==='srv:mq1'&&m.text.startsWith('[1:1 문의 답변]'))"),'답변 우편 도착')
    a.evaluate("window.__BANNED=true");a.fill('#ask-text','정지 중 문의를 보내 봅니다');a.click('#pop [data-form="ask"] button[type=submit]');a.wait_for_timeout(500)
    ok('이용이 제한' in a.inner_text('#toasts') and a.input_value('#ask-text')=='정지 중 문의를 보내 봅니다','정지 중엔 거절 · 쓴 글 남김')
    a.evaluate("window.__BANNED=false;S.sel.pop=null;renderPop()")

    # ── 낚시 랭킹 ──
    sp=a.evaluate("FISH.meadow[0][0]");spn=a.evaluate("FISH.meadow[0][1]")
    a.evaluate(f"noteFishBest({{land:'meadow',sp:'{sp}',size:21.5}})");a.wait_for_timeout(700)
    fc=db()['fish_catches'];ok(len(fc)==1 and fc[0]['user_id']==A and fc[0]['species']==spn and fc[0]['size_cm']==21.5,'내 주간 최고 기록이 서버에 저장(물고기 이름)')
    a.evaluate(f"noteFishBest({{land:'meadow',sp:'{sp}',size:10}})");a.wait_for_timeout(500)
    ok(len(db()['fish_catches'])==1,'더 작은 기록은 안 올림')
    bp.evaluate(f"noteFishBest({{land:'meadow',sp:'{sp}',size:33}})");bp.wait_for_timeout(700)
    a.evaluate("ACTS['fish-rank']({land:'meadow'})");a.wait_for_timeout(800)
    mt=a.inner_text('.modal')
    ok('하늘별' in mt and '아린' in mt and mt.index('하늘별')<mt.index('아린') and '참가 2명' in mt,'랭킹: 실제 블레서만, 큰 순서(하늘별 33 > 아린 21.5)')
    ok(not any(n in mt for n in ['카이로','세린','벨라','노아','엘라']),'랭킹에 봇 없음')
    a.screenshot(path=OUT+'/fish-rank.png');a.evaluate("modal('')")
    # 서버 연결 전에 낚은 이번 주 기록도 올림
    bp.evaluate(f"S.me.fishBest.sea={{sp:FISH.sea[0][0],size:44}};fbPushMine()");bp.wait_for_timeout(800)
    ok(any(x['land']=='sea' and x['user_id']==B and x['size_cm']==44 for x in db()['fish_catches']),'예전에 낚은 이번 주 기록도 서버로')
    # 지난 주 정산 → 500G 우편 + 칭호
    put(f"d.fish_catches.push({{id:9001,user_id:'{A}',land:'frost',species:'빙어',size_cm:15,week:'2026-10-26',created_at:'2026-10-27T00:00:00Z'}},{{id:9002,user_id:'{B}',land:'frost',species:'빙어',size_cm:12,week:'2026-10-26',created_at:'2026-10-27T00:00:00Z'}})")
    g0=a.evaluate("S.me.gold")
    a.evaluate("fbAwards().then(()=>mlFetch())");a.wait_for_timeout(1200)
    ok(len(db()['fish_awards'])==1 and db()['fish_awards'][0]['user_id']==A,'지난 주 혹한 1위 정산(아린)')
    ok(a.evaluate("(S.me.fishKingLand||{}).frost")==1 and a.evaluate("!!(S.titles&&S.titles.owned&&S.titles.owned.t_fk_frost)"),'낚시왕 칭호 획득')
    m=a.evaluate("S.mail.find(m=>m.text&&m.text.startsWith('[주간 낚시 랭킹]'))")
    ok(m and m['items'].get('_gold')==500,'1위 우편 500골드')
    a.evaluate("fbAwards()");a.wait_for_timeout(600)
    ok(a.evaluate("(S.me.fishKingLand||{}).frost")==1 and len(db()['fish_awards'])==1,'다시 불러도 한 번만')
    ok(a.evaluate("settleFish(),S.mail.filter(m=>!String(m.id).startsWith('srv:')&&String(m.text).includes('주간 낚시 랭킹')).length")==0,'이 기기 정산(봇 순위)은 안 함')
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    b.close()
print('\n'.join(res));print(f"PASS {sum(r.startswith('OK') for r in res)} / {len(res)}")
