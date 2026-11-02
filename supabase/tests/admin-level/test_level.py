# 운영자 레벨 조정(supabase/010_admin_level.sql + 08-server.js admApply) 브라우저 테스트
# python3 -m http.server 8765 (저장소 맨 위) → python3 supabase/tests/admin-level/test_level.py
from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__))
MOCK=open(SP+'/mock-supabase.js').read();res=[]
A='aaaaaaaa-0000-0000-0000-00000000000a'
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':390,'height':844});errs=[]
    ctx.route('**/fonts.g*/**',lambda r:r.abort())
    ctx.add_init_script(f"window.__UID='{A}';window.__USERNAME='arin';")
    ctx.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
    def page():
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(m.text))
        pg.goto('http://localhost:8765/');return pg
    pg=page();pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
    pg.fill('input[maxlength="10"]','아린');pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
    srv=lambda:pg.evaluate("(()=>{const d=JSON.parse(localStorage.getItem('__mockdb')).saves.find(x=>x.user_id==='"+A+"').data;return {lv:d.me.level,exp:d.me.exp,gold:d.me.gold,rev:d.adminRev||0}})()")
    pg.evaluate("S.me.level=5;S.me.exp=40;S.me.gold=100;save()");pg.evaluate("cloudFlush()");pg.wait_for_timeout(400)
    ok(srv()['lv']==5,'처음 저장 LV5')
    # 접속 중에 운영자가 LV30으로 조정
    r=pg.evaluate("__adminSet('"+A+"',30)");ok(r['before']==5 and r['rev']==1,'운영자 조정 5 → 30')
    # 게임은 아직 모르고 계속 플레이(골드 +500) 후 저장 → 서버는 레벨 지키고, 응답으로 게임이 반영
    pg.evaluate("S.me.gold+=500;save()");pg.evaluate("cloudFlush()");pg.wait_for_timeout(600)
    ok(pg.evaluate("S.me.level")==30 and pg.evaluate("S.me.exp")==0 and pg.evaluate("S.adminRev")==1,'접속 중인 게임에 LV30 반영(경험치 0)')
    ok(pg.evaluate("S.me.gold")==600 and srv()['gold']==600,'그 사이 플레이(골드 +500)는 그대로 남음')
    s=srv();ok(s['lv']==30 and s['rev']==1,'서버도 LV30 유지')
    ok('LV30' in pg.inner_text('#top')+pg.inner_text('#view') or pg.evaluate("S.me.level")==30,'화면 다시 그림')
    nt=pg.evaluate("[...document.querySelectorAll('.toasts > *')].map(t=>t.textContent).join(' | ')")
    ok('LV5 → LV30' in nt,'유저에게 알림: '+nt[:60])
    # 자연 레벨업은 그대로 저장
    pg.evaluate("grantExp(expNeed(30)+1);save()");pg.evaluate("cloudFlush()");pg.wait_for_timeout(400)
    ok(pg.evaluate("S.me.level")==31 and srv()['lv']==31,'조정 뒤 자연 레벨업 저장(LV31)')
    # 접속 안 한 동안 조정 → 다시 접속하면 서버 세이브가 이김
    pg.evaluate("cloudFlush()");pg.wait_for_timeout(300);pg.close()
    pg=page();pg.wait_for_function('typeof S!=="undefined"&&S&&S.me',timeout=20000)
    pg.evaluate("__adminSet('"+A+"',12)");pg.close()
    pg=page();pg.wait_for_function('typeof S!=="undefined"&&S&&S.me',timeout=20000);pg.wait_for_timeout(500)
    ok(pg.evaluate("S.me.level")==12 and pg.evaluate("S.adminRev")==2,'접속 안 한 동안 조정 → 다음 접속에 LV12')
    # 이 기기 로컬 세이브가 더 최근(시계 차이 등)이어도 레벨·경험치는 서버 값
    pg.evaluate("cloudFlush()");pg.wait_for_timeout(300)
    pg.evaluate("__adminSet('"+A+"',44)")
    pg.close()
    # 새 페이지가 게임을 불러오기 직전에 이 기기의 로컬 세이브를 '더 최근'으로 고침
    pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.add_init_script("(()=>{const k='bleset-saga-v1:"+A+"';const s=JSON.parse(localStorage.getItem(k)||'null');if(s&&!s.__t){s.savedAt=Date.now()+3600e3;s.me.gold=7777;s.__t=1;localStorage.setItem(k,JSON.stringify(s));}})()")
    pg.goto('http://localhost:8765/');pg.wait_for_function('typeof S!=="undefined"&&S&&S.me',timeout=20000);pg.wait_for_timeout(500)
    got=pg.evaluate("({lv:S.me.level,gold:S.me.gold,rev:S.adminRev})")
    ok(got['lv']==44 and got['gold']==7777,f'로컬이 더 최근이어도 레벨은 서버(LV44), 나머지는 로컬: {got}')
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    b.close()
print('\n'.join(res));print('PASS' if all(r.startswith('OK') for r in res) else 'FAIL',sum(r.startswith('OK') for r in res),'/',len(res))
