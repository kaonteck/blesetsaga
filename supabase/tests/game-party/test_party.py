# 파티 레이드 공유(019) 두 플레이어 브라우저 테스트
# python3 -m http.server 8765 (저장소 맨 위) → python3 supabase/tests/game-party/test_party.py
from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read();res=[]
A='aaaaaaaa-0000-0000-0000-00000000000a';B='bbbbbbbb-0000-0000-0000-00000000000b'
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
def wait(pg,js,ms=8000):
    try: pg.wait_for_function(js,timeout=ms);return True
    except Exception: return False
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':900});errs=[]
    ctx.route('**/fonts.g*/**',lambda r:r.abort());ctx.route('**/cdn.jsdelivr.net/gh/**',lambda r:r.abort())
    def player(uid,user,name,job):
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)))
        pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(name+': '+m.text))
        pg.add_init_script(f"window.__UID='{uid}';window.__USERNAME='{user}';")
        pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
        pg.goto('http://localhost:8765/');pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
        pg.fill('input[maxlength="10"]',name);pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
        pg.evaluate(f"S.me.job='{job}';S.me.level=12;S.me.exp=0;hpFull&&hpFull();save();pfSync();cloudFlush()");pg.wait_for_timeout(500);return pg
    a=player(A,'arin','아린','defender');bp=player(B,'bella','하늘별','priest')
    db=lambda:a.evaluate("JSON.parse(localStorage.getItem('__mockdb'))")
    mid=a.evaluate("(S.data.monsters.find(m=>mkind(m)==='party'&&m.published&&levelOk(m,12))||{}).id")
    ok(bool(mid),f'파티 레이드 몬스터 {mid}')
    # 1) 파티장 아린이 파티를 만듦 → 서버 방
    a.evaluate(f"go('battle',{{monster:'{mid}'}})");a.wait_for_timeout(300)
    a.evaluate(f"ACTS.createparty({{id:'{mid}'}})");a.wait_for_timeout(800)
    rooms=db()['party_rooms'];rid=rooms[0]['id'] if rooms else ''
    ok(len(rooms)==1 and rooms[0]['status']=='gather' and rooms[0]['members'][0]['name']=='아린','파티를 만들면 서버 방이 생김(파티장 아린)')
    ok(a.evaluate("!!(S.party&&S.party.shared&&S.party.roomId)&&S.party.nextJoin===Infinity"),'공유 파티 · 봇 자동 참가 꺼짐')
    # 2) 하늘별의 모집 목록에 실제 블레서 파티
    bp.evaluate("ptFetchRooms()");bp.wait_for_timeout(500)
    rows=bp.evaluate("recruitRows(S.recruits,true)")
    ok('블레서' in rows and '아린' in rows,'다른 블레서 모집 목록에 실제 블레서 파티가 보임')
    ok(bp.evaluate("recruitCard(S.recruits.find(r=>r.real)).includes('파티장 아린')"),'모집 카드(메인 화면)도 그려짐')
    # 3) 참가
    bp.evaluate(f"ACTS.joinrecruit({{id:'room:{rid}'}})");bp.wait_for_timeout(900)
    ok(len(db()['party_rooms'][0]['members'])==2 and bp.evaluate("S.party&&S.party.shared&&S.party.leader")=='아린','하늘별 참가 → 서버 방 2명, 내 화면 파티장 아린')
    ok(wait(a,"S.party.members.some(x=>x.name==='하늘별'&&x.real)"),'파티장 화면에 하늘별이 실시간으로 들어옴')
    # 4) 파티 채팅 · 봇 사칭 막기
    bp.evaluate("S.sel.chatTab='party';sendChat('party','안녕하세요 같이 가요')");bp.wait_for_timeout(700)
    ok(wait(a,"S.party.chat.some(m=>m.from==='하늘별'&&m.text==='안녕하세요 같이 가요')"),'파티 채팅이 서버로 전달(보낸 이름은 서버가 붙임)')
    a.evaluate("botSay('party','하늘별','봇이 하는 말')");
    ok(not a.evaluate("S.party.chat.some(m=>m.text==='봇이 하는 말')"),'공유 파티에서는 봇이 실제 블레서 이름으로 말하지 않음')
    # 5) 준비 · 용병 · 출발
    bp.evaluate("ACTS.ready()");bp.wait_for_timeout(700)
    ok(wait(a,"S.party.members.find(x=>x.name==='하늘별').ready===true"),'하늘별 준비 → 파티장 화면에 준비 표시')
    a.evaluate("ACTS['merc-fill']()");a.wait_for_timeout(1600)
    nm=a.evaluate("S.party.members.filter(x=>x.merc).length")
    ok(wait(bp,f"S.party.members.filter(x=>x.merc).length==={nm}") ,f'파티장의 용병 {nm}명이 파티원 화면에도 보임')
    ok(bp.evaluate("!S.battle"),'파티원 화면은 혼자 출발하지 않음')
    a.evaluate("ACTS.ready()");a.wait_for_timeout(300)
    ok(a.evaluate("partyCheck(S.party).ok"),'출발 조건 충족')
    a.evaluate("ACTS.depart()");a.wait_for_timeout(1200)
    ok(a.evaluate("!!(S.battle&&S.battle.shared)") and db()['party_rooms'][0]['status']=='battle','파티장 출발 → 공유 전투, 방 상태 전투')
    opened=wait(bp,"!!(S.battle&&S.battle.shared)",12000);ok(opened,'파티원 화면에 같은 전투가 열림')
    if not opened: print('\n'.join(res));print('errs',errs[:5]);raise SystemExit(1)
    ok(bp.evaluate("S.battle.players.length")==a.evaluate("S.battle.players.length") and bp.evaluate("S.battle.players.find(p=>p.isMe).name")=='하늘별' and not bp.evaluate("S.battle.players.find(p=>p.name==='아린').isMe"),'같은 파티원 구성 · 하늘별 화면의 "나"는 하늘별')
    ok(a.evaluate("S.battle.players.find(p=>p.name==='하늘별').real===true") and a.evaluate("S.battle.players.find(p=>p.name==='하늘별').planAt===Infinity"),'파티장 화면은 하늘별을 봇처럼 자동 행동시키지 않음')
    bp.screenshot(path=OUT+'/party-member.png')
    # 6) 1턴: 하늘별이 방어를 정함 → 파티장 화면에 반영
    t1=a.evaluate("S.battle.turn")
    bp.evaluate("ACTS.confirmdefend()");bp.wait_for_timeout(500)
    ok(db()['party_acts'][0]['action']['action']['kind']=='defend','하늘별 행동이 서버로')
    ok(wait(a,"S.battle.players.find(p=>p.name==='하늘별').confirmed===true"),'파티장 화면에 하늘별 행동 확정')
    a.evaluate("S.battle.players.forEach(p=>{if(p.merc||(!p.real&&!p.isMe))p.planAt=0;});ACTS.confirmdefend()")
    ok(wait(a,f"S.battle.turn>{t1}",12000),'모두 정하면 파티장 화면이 턴을 넘김')
    ok(wait(bp,f"S.battle.turn>{t1}",8000),'파티원 화면도 다음 턴으로')
    ok(bp.evaluate("!S.battle.players.find(p=>p.isMe).confirmed"),'새 턴에는 다시 행동을 정할 수 있음')
    # 7) 마무리: 몬스터 HP 1로 → 둘 다 공격 → 승리 · 각자 보상
    g0=bp.evaluate("S.me.gold");e0=bp.evaluate("S.me.exp+S.me.level*1e6")
    a.evaluate("S.battle.mon.hp=1");
    bp.evaluate("resetAct();ACTS.confirmact()");bp.wait_for_timeout(500)
    ok(wait(a,"S.battle.players.find(p=>p.name==='하늘별').confirmed===true"),'하늘별 공격 확정이 파티장에게')
    a.evaluate("S.battle.players.forEach(p=>{if(!p.real&&!p.isMe)p.planAt=0;});resetAct();ACTS.confirmact()")
    ok(wait(a,"S.battle.over==='win'",12000),'파티장 화면 승리')
    ok(wait(bp,"S.battle&&S.battle.over==='win'",8000),'파티원 화면도 승리')
    bp.wait_for_timeout(300)
    ok(bp.evaluate("!!(S.battle.result&&S.battle.result.eligible)") and bp.evaluate("S.me.gold")>g0 and bp.evaluate("S.me.exp+S.me.level*1e6")>e0,'하늘별은 자기 화면에서 보상을 받음(골드·경험치)')
    ok(db()['party_rooms'][0]['status']=='closed','전투가 끝나면 방 닫힘')
    bp.screenshot(path=OUT+'/party-win.png')
    # 8) 나가기 정리
    bp.evaluate("leaveBattle()");a.evaluate("leaveBattle()");a.wait_for_timeout(400)
    ok(bp.evaluate("!S.party&&!S.battle") and a.evaluate("!S.party&&!S.battle"),'결과 화면을 나가면 둘 다 파티 정리')
    # 9) 던전 파티는 이 기기 안에서만 · 봇 파티 참가는 예전처럼
    did=a.evaluate("(S.data.monsters.find(m=>mkind(m)==='dungeon'&&levelOk(m,12))||{}).id")
    if did:
        n0=len(db()['party_rooms']);a.evaluate(f"ACTS.createparty({{id:'{did}'}})");a.wait_for_timeout(600)
        ok(a.evaluate("!!S.party&&!S.party.shared") and len(db()['party_rooms'])==n0,'던전 파티는 서버 방을 만들지 않음')
        a.evaluate("ACTS.leaveparty()");a.wait_for_timeout(200)
    bot_r=bp.evaluate("(()=>{const m=S.data.monsters.find(x=>mkind(x)==='party'&&x.published&&levelOk(x,12));const r=genRecruit(m);if(!r)return null;S.recruits.push(r);return r.id;})()")
    if bot_r:
        bp.evaluate(f"ACTS.joinrecruit({{id:'{bot_r}'}})");bp.wait_for_timeout(400)
        ok(bp.evaluate("!!S.party&&!S.party.shared&&S.party.members.length>=2"),'봇 파티 참가는 예전처럼(이 기기 안)')
        bp.evaluate("ACTS.leaveparty()")
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    b.close()
print('\n'.join(res));print(f"PASS {sum(r.startswith('OK') for r in res)} / {len(res)}")
