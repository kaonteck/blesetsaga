import json,datetime
from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read();res=[]
U='aaaaaaaa-0000-0000-0000-00000000000a'
KST=datetime.timezone(datetime.timedelta(hours=9))
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
with sync_playwright() as p:
    b=p.chromium.launch();pg=b.new_page();errs=[]
    pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(m.text))
    pg.route('**/fonts.g*/**',lambda r:r.abort())
    pg.clock.install(time=datetime.datetime(2026,11,4,12,0,tzinfo=KST))   # 수 12:00
    pg.add_init_script(f"window.__UID='{U}';window.__USERNAME='arin';window.__FORCE_NUMS=[1,2,3,9];")
    pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
    pg.goto('http://localhost:8765/');pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
    pg.fill('input[maxlength="10"]','아린');pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
    g=lambda js:pg.evaluate(js)
    srvgold=lambda:g("JSON.parse(localStorage.getItem('__mockdb')).saves.find(s=>s.user_id==='"+U+"').data.me.gold")
    g("S.me.level=5;S.me.gold=1000;save()");g("cloudFlush()");pg.wait_for_timeout(400)
    # 레벨 미달
    g("S.sel.lotPick=[1,2,3,4];ACTS['lotto-buy']({})");pg.wait_for_timeout(300)
    ok(g("window.__RPC.filter(x=>x==='buy_lotto').length")==0 and g("S.me.gold")==1000,'LV10 미만이면 구매 막힘(서버 호출 없음)')
    g("S.me.level=10;S.sel.lotPick=[];save()");g("cloudFlush()");pg.wait_for_timeout(300)
    g("ACTS['lotto-open']({})");pg.wait_for_selector('[data-lt-left]');pg.wait_for_timeout(400)
    for n in [3,1,2,4]: pg.click(f'[data-act="lotto-pick"][data-n="{n}"]')
    pg.click('[data-act="lotto-buy"]');pg.wait_for_timeout(800)
    ok(g("S.me.gold")==800 and srvgold()==800,'구매 → 화면·서버 모두 200골드 차감 (1000→800)')
    ok('추첨 대기' in pg.inner_text('.modal') and g("S.me.lotto.filter(x=>x.id.startsWith('srv:')).length")==1,'이번 주 내 행운권에 표시 (추첨 대기)')
    for n in [5,6,7,8]: pg.click(f'[data-act="lotto-pick"][data-n="{n}"]')
    pg.click('[data-act="lotto-buy"]');pg.wait_for_timeout(800)
    ok(g("S.me.gold")==600 and srvgold()==600,'2장째 구매 (→600)')
    ok(pg.locator('[data-act="lotto-buy"]').is_disabled() and '2장을 모두' in pg.inner_text('.modal'),'2장 사면 구매 버튼 잠김')
    # 서버가 3장째 거절 (화면 확인을 우회해도)
    g("S.me.lotto=S.me.lotto.filter(x=>!x.id.startsWith('srv:'));S.sel.lotPick=[0,4,7,9];ACTS['lotto-buy']({})");pg.wait_for_timeout(800)
    ok(g("S.me.gold")==600 and srvgold()==600,'화면을 우회해 3장째 사도 서버가 거절 · 골드 그대로')
    ok(g("S.me.lotto.filter(x=>x.id.startsWith('srv:')).length")==2,'거절 뒤 서버 기록으로 다시 맞춤(2장)')
    # 금 19:30 판매 마감
    pg.clock.set_system_time(datetime.datetime(2026,11,6,19,30,tzinfo=KST))
    g("openLotto()");ok('판매 마감' in pg.inner_text('.modal'),'금 19:30 판매 마감 표시')
    # 금 20:00:05 추첨
    pg.clock.set_system_time(datetime.datetime(2026,11,6,20,0,5,tzinfo=KST))
    g("ltSync()");pg.wait_for_timeout(600);g("openLotto()");pg.wait_for_timeout(200)
    txt=pg.inner_text('.modal');ok('지난 추첨 결과' in txt,'추첨 뒤 지난 결과에 표시')
    win=g("drawNums('2026-11-06')");ok(win==[1,2,3,9],f'당첨 번호는 서버 번호 {win} (날짜 공식 아님)')
    ok('2등' in txt and '3,000골드 받기' in txt,'3개 일치 → 2등 3,000골드 받기 버튼')
    pg.locator('[data-act="lotto-claim"]', has_text='2등').click();pg.wait_for_timeout(800)
    ok(g("S.me.gold")==3600 and srvgold()==3600,'2등 수령 → 화면·서버 모두 +3000 (→3600)')
    x=g("S.me.lotto.find(t=>t.rank===2).id")
    g(f"S.me.lotto.find(t=>t.id==='{x}').claimed=false;ACTS['lotto-claim']({{id:'{x}'}})");pg.wait_for_timeout(700)
    ok(g("S.me.gold")==3600,'같은 행운권 다시 받기 → 서버가 거절')
    pg.locator('[data-act="lotto-claim"]', has_text='낙첨').click();pg.wait_for_timeout(700)
    ok(g("S.me.lotto.filter(t=>t.id.startsWith('srv:')).every(t=>t.claimed)"),'낙첨 확인도 서버에 표시')
    # 다음 주 판매 다시 열림
    g("openLotto()");ok('이번 주 내 행운권 0/2' in pg.inner_text('.modal'),'추첨 뒤 다음 주 판매 시작 (0/2)')
    # 서버 이전에 산 이 기기 행운권은 예전 방식
    g("S.me.lotto.push({id:'lt_old',nums:[0,1,2,3],draw:'2026-10-30',at:Date.parse('2026-10-30T11:00:00Z'),claimed:false,ts:0});save();ACTS['lotto-claim']({id:'lt_old'})");pg.wait_for_timeout(300)
    ok(g("S.me.lotto.find(t=>t.id==='lt_old').claimed") and g("window.__RPC.filter(x=>x==='claim_lotto').length")==3,'예전 로컬 행운권은 서버 호출 없이 예전대로')
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    g("openLotto()");pg.screenshot(path=OUT+'/lotto.png')
    b.close()
print('\n'.join(res));print('PASS',sum(r.startswith('OK') for r in res),'/',len(res))
