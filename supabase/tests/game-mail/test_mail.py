import json
from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read();res=[]
A='aaaaaaaa-0000-0000-0000-00000000000a';B='bbbbbbbb-0000-0000-0000-00000000000b'
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context();errs=[]
    ctx.route('**/fonts.g*/**',lambda r:r.abort());ctx.route('**/cdn.jsdelivr.net/gh/**',lambda r:r.abort())
    def player(uid,user,name):
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)))
        pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(name+': '+m.text))
        pg.add_init_script(f"window.__UID='{uid}';window.__USERNAME='{user}';")
        pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
        pg.goto('http://localhost:8765/');pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
        pg.fill('input[maxlength="10"]',name);pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
        return pg
    a=player(A,'arin','아린');bp=player(B,'bella','하늘별')
    a.evaluate("S.me.gold=1000;S.me.inv.potion=5;save()");a.evaluate("cloudFlush()");a.wait_for_timeout(600)
    bp.evaluate("cloudFlush()");bp.wait_for_timeout(600)
    db=lambda pg:pg.evaluate("JSON.parse(localStorage.getItem('__mockdb'))")
    d=db(a);ok(any(x['name']=='아린' and x['level']==1 for x in d['profiles']) and any(x['name']=='하늘별' for x in d['profiles']),'두 플레이어 프로필(이름) 서버에 올라감')
    # A: 편지 쓰기
    a.evaluate("S.sel.pop='mail';ACTS['mail-compose']({});");a.wait_for_timeout(600)
    opts=a.evaluate("[...document.querySelectorAll('#mc-to optgroup[label=\"블레서\"] option')].map(o=>o.textContent)")
    ok(any('하늘별' in o for o in opts),'받는 사람 목록에 실제 유저: '+', '.join(opts))
    ok(a.locator('#mc-to optgroup[label="테스트 봇"]').count()==1,'봇은 따로 묶여 표시')
    a.select_option('#mc-to','@'+B);a.fill('#mc-text','물약 나눠 줄게요');a.click('[data-act="mc-gift"]');a.wait_for_timeout(200)
    ok(a.locator('#mc-gold').count()==1,'선물 켜면 골드 칸')
    a.select_option('#mc-item','potion');a.fill('#mc-qty','2');a.click('[data-act="mc-add"]');a.wait_for_timeout(200)
    a.fill('#mc-gold','300');a.click('[data-act="mc-send"]');a.wait_for_timeout(1500)
    ok(a.evaluate("S.me.gold")==700 and a.evaluate("S.me.inv.potion")==3,'보낸 사람 화면에서 차감 (골드 700, 회복약 3)')
    s=[x for x in db(a)['saves'] if x['user_id']==A][0]['data']['me'];ok(s['gold']==700 and s['inv']['potion']==3,'보낸 사람 서버 세이브도 차감')
    ok(a.evaluate("S.sel.mailView")!='compose','보낸 뒤 편지 쓰기 닫힘')
    # B: 실시간 도착
    bp.wait_for_function("S.mail.some(m=>String(m.id).startsWith('srv:'))",timeout=8000)
    m=bp.evaluate("S.mail.find(m=>String(m.id).startsWith('srv:'))")
    ok(m['from']=='아린' and m['items'].get('potion')==2 and m['items'].get('_gold')==300 and not m['claimed'],'받는 사람에게 실시간 도착 (아린 · 회복약 2 · 300골드)')
    g0=bp.evaluate("S.me.gold");p0=bp.evaluate("S.me.inv.potion||0")
    bp.evaluate(f"S.sel.pop='mail';ACTS['mail-open']({{id:'{m['id']}'}})");bp.wait_for_timeout(300)
    ok(bp.locator('[data-act="mail-reply"]').count()==1,'실제 유저 편지에 답장 버튼')
    bp.evaluate("S.route='character';S.sel.charTab='equip';render()");bp.wait_for_timeout(300)
    gtxt=lambda g:bp.evaluate(f"document.querySelector('#view').innerText.includes(({g}).toLocaleString('ko-KR'))")
    ok(gtxt(g0),'받기 전: 화면에 지금 골드 표시')
    bp.click('[data-act="mail-claim"]');bp.wait_for_timeout(800)
    ok(bp.evaluate("S.me.gold")==g0+300 and bp.evaluate("S.me.inv.potion||0")==p0+2,'선물 받기 → 골드·아이템 들어옴')
    ok(gtxt(g0+300),'새로고침 없이 화면 골드도 바로 바뀜')
    ok(bp.evaluate("S.sel.pop")=='mail' and bp.locator('#pop [data-act="mail-claim"]:not([disabled])').count()==0,'우편 팝업은 그대로 열려 있음 · 받기 버튼은 받음(비활성)으로')
    ok([x for x in db(bp)['mail']][0]['claimed_at'] is not None,'서버에 받음 표시')
    bp.evaluate(f"S.mail.find(x=>x.id==='{m['id']}').claimed=false;ACTS['mail-claim']({{id:'{m['id']}'}})");bp.wait_for_timeout(600)
    ok(bp.evaluate("S.me.gold")==g0+300,'두 번 받기 막힘 (다른 기기에서 다시 눌러도)')
    # 느린 응답 중에 우편 목록이 새로 받아져도(실시간 알림) 선물이 빠지지 않고 한 번만
    bp.evaluate("(()=>{const d=JSON.parse(localStorage.getItem('__mockdb'));d.mail.push({id:'mslow',recipient:'"+B+"',sender:null,sender_name:'운영자',text:'느린 선물',items:{},gold:500,read_at:null,claimed_at:null,archived:false,created_at:new Date().toISOString()});localStorage.setItem('__mockdb',JSON.stringify(d));})()")
    bp.evaluate("mlFetch()");bp.wait_for_timeout(500);g1=bp.evaluate("S.me.gold")
    bp.evaluate("window.__RPCDELAY=1500;ACTS['mail-open']({id:'srv:mslow'})");bp.wait_for_timeout(300)
    bp.click('[data-act="mail-claim"]');bp.wait_for_timeout(2600);bp.evaluate("window.__RPCDELAY=0")
    ok(bp.evaluate("S.me.gold")==g1+500,f'느린 응답 중 목록이 바뀌어도 골드 한 번 들어옴 ({g1}→{bp.evaluate("S.me.gold")})')
    ok(bp.evaluate("S.mail.find(m=>m.id==='srv:mslow').claimed") and bp.evaluate("S.mail.filter(m=>m.id==='srv:mslow').length")==1,'받음 표시 · 우편 중복 없음')
    bp.evaluate("mlFetch()");bp.wait_for_timeout(500)
    ok(bp.evaluate("S.me.gold")==g1+500,'다시 받아 와도 그대로')
    bp.evaluate(f"S.sel.pop='mail';ACTS['mail-open']({{id:'{m['id']}'}})");bp.wait_for_timeout(300)
    ok([x for x in db(bp)['mail']][0]['read_at'] is not None,'읽음 서버 반영')
    # 답장 → 받는 사람이 미리 선택
    bp.click('[data-act="mail-reply"]');bp.wait_for_timeout(500);ok(bp.input_value('#mc-to')=='@'+A,'답장하면 보낸 사람이 받는 사람으로')
    bp.fill('#mc-text','고마워요!');bp.click('[data-act="mc-send"]');bp.wait_for_timeout(1200)
    a.wait_for_function("S.mail.some(m=>m.from==='하늘별')",timeout=8000);ok(True,'글만 보낸 답장도 도착')
    # 부족하면 막힘
    a.evaluate("S.sel.pop='mail';ACTS['mail-compose']({})");a.wait_for_timeout(500);a.select_option('#mc-to','@'+B);a.fill('#mc-text','x');a.click('[data-act="mc-gift"]');a.fill('#mc-gold','5000');a.click('[data-act="mc-send"]');a.wait_for_timeout(600)
    ok(a.evaluate("S.me.gold")==700 and a.evaluate("window.__RPC.filter(x=>x==='send_mail').length")==1,'가진 것보다 많은 골드는 보내기 전에 막힘')
    # 서버 기준으로 부족: 로컬에만 있는 물약(서버 세이브보다 많이) — 서버 업로드 실패 상황 흉내
    a.evaluate("cloudFlush=async()=>true;cloudPush=async()=>true;cloudSave=()=>{};S.me.inv.potion=50")   # 자동 저장도 막아 서버 기록이 3개로 남게;a.fill('#mc-gold','0');a.select_option('#mc-item','potion');a.fill('#mc-qty','10');a.click('[data-act="mc-add"]');a.click('[data-act="mc-send"]');a.wait_for_timeout(800)
    ok(a.evaluate("S.me.inv.potion")==50,'서버 기록보다 많으면 서버가 거절 · 화면 차감 없음')
    # 지우기
    bp.evaluate("S.sel.pop='mail';S.sel.mailView=null;renderPop()");mid=m['id']
    bp.evaluate(f"ACTS['m-del']({{ids:'{mid}'}})");bp.wait_for_timeout(500)
    ok(not any(x['id']==mid[4:] for x in db(bp)['mail']),'지우면 서버에서도 삭제')
    bp.evaluate("mlFetch()");bp.wait_for_timeout(500);ok(not bp.evaluate(f"S.mail.some(x=>x.id==='{mid}')"),'다시 받아도 안 돌아옴')
    ok(bp.evaluate("S.mail.some(m=>!String(m.id).startsWith('srv:'))"),'게임 안 시스템 우편(환영 편지 등)은 그대로')
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    a.screenshot(path=OUT+'/m-a.png');bp.evaluate("S.sel.pop='mail';ACTS['mail-compose']({})");bp.wait_for_timeout(400);bp.click('[data-act=\"mc-gift\"]');bp.wait_for_timeout(200);bp.screenshot(path=OUT+'/m-b-compose.png')
    b.close()
print('\n'.join(res));print('PASS',sum(r.startswith('OK') for r in res),'/',len(res))
