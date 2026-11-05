# 파티 레이드·던전 파티 공유(019·022) 두 플레이어 브라우저 테스트
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
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)+' '+str(e.stack)[:600]))
        pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(name+': '+m.text+' @'+str(m.location)))
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
    # 022: 파티원 card를 조작해도 파티장 화면이 거름(보너스·높은 장비·강화)
    a.evaluate("""(()=>{const db=JSON.parse(localStorage.getItem('__mockdb'));const r=db.party_rooms.find(x=>x.status==='gather');
      const m=r.members.find(x=>x.name==='하늘별');m.card={bonus:{atk:99999,maxHp:99999},equip:{weapon:'g8_scepter',armor:'g8_armor'},enh:{g8_scepter:50},hp:9};
      localStorage.setItem('__mockdb',JSON.stringify(db));})()""");a.evaluate("ptRefresh()");a.wait_for_timeout(500)
    a.evaluate("ACTS.ready()");a.wait_for_timeout(300)
    ok(a.evaluate("partyCheck(S.party).ok"),'출발 조건 충족')
    a.evaluate("ACTS.depart()");a.wait_for_timeout(1200)
    ok(a.evaluate("!!(S.battle&&S.battle.shared)") and db()['party_rooms'][0]['status']=='battle','파티장 출발 → 공유 전투, 방 상태 전투')
    opened=wait(bp,"!!(S.battle&&S.battle.shared)",12000);ok(opened,'파티원 화면에 같은 전투가 열림')
    if not opened: print('\n'.join(res));print('errs',errs[:5]);raise SystemExit(1)
    ok(bp.evaluate("S.battle.players.length")==a.evaluate("S.battle.players.length") and bp.evaluate("S.battle.players.find(p=>p.isMe).name")=='하늘별' and not bp.evaluate("S.battle.players.find(p=>p.name==='아린').isMe"),'같은 파티원 구성 · 하늘별 화면의 "나"는 하늘별')
    ok(a.evaluate("(()=>{const f=S.battle.players.find(p=>p.name==='하늘별');return f.atk<1000&&f.maxHp<5000&&f.hp<=f.maxHp&&!Object.values(f.equip||{}).some(x=>/^g8_/.test(x));})()"),'조작한 card(공격력 99999·LV80 장비·강화 50)는 파티장 화면에서 걸러짐')
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
    exp_gold=bp.evaluate("(()=>{const m=monster(S.battle.monsterId);return Math.round(m.gold*(eventFor(m.id)?1.5:1));})()")
    # 022: 파티장이 보상 값을 조작해 올려도 파티원은 자기 게임 기준으로 받음
    a.evaluate("S.battle.mon.hp=1;S.battle.rules.gold=99999999;S.battle.rules.exp=99999999;S.battle.rules.drops=[['g8_gsword',1],['g8_axe',1]];S.battle.ctx={type:'quest',qid:'E1',step:0,drun:true};S.battle.reward={join:{exp:9e7,gold:9e7}};");
    bp.evaluate("resetAct();ACTS.confirmact()");bp.wait_for_timeout(500)
    ok(wait(a,"S.battle.players.find(p=>p.name==='하늘별').confirmed===true"),'하늘별 공격 확정이 파티장에게')
    a.evaluate("S.battle.players.forEach(p=>{if(!p.real&&!p.isMe)p.planAt=0;});resetAct();ACTS.confirmact()")
    ok(wait(a,"S.battle.over==='win'",12000),'파티장 화면 승리')
    ok(wait(bp,"S.battle&&S.battle.over==='win'",8000),'파티원 화면도 승리')
    bp.wait_for_timeout(300)
    ok(bp.evaluate("!!(S.battle.result&&S.battle.result.eligible)") and bp.evaluate("S.me.gold")>g0 and bp.evaluate("S.me.exp+S.me.level*1e6")>e0,'하늘별은 자기 화면에서 보상을 받음(골드·경험치)')
    ok(bp.evaluate("S.me.gold")-g0==exp_gold and bp.evaluate("S.me.level")<=13 and not bp.evaluate("!!(S.me.inv.g8_gsword||S.me.inv.g8_axe)"),f'파티장이 조작한 보상(1억 골드·LV80 무기)은 무시 · 파티원 골드 +{exp_gold}(내 몬스터 규칙)')
    ok(bp.evaluate("S.battle.ctx.type")=='party' and bp.evaluate("!S.battle.ctx.qid&&!S.battle.ctx.drun"),'진행 정보(ctx)도 내 쪽 값(파티 레이드)')
    ok(db()['party_rooms'][0]['status']=='closed','전투가 끝나면 방 닫힘')
    bp.screenshot(path=OUT+'/party-win.png')
    # 8) 나가기 정리
    bp.evaluate("leaveBattle()");a.evaluate("leaveBattle()");a.wait_for_timeout(400)
    ok(bp.evaluate("!S.party&&!S.battle") and a.evaluate("!S.party&&!S.battle"),'결과 화면을 나가면 둘 다 파티 정리')
    # 8b) 022: 초대 전용 방 — 초대받기 전에는 목록에 없고 참가 막힘, 초대받으면 참가
    a.evaluate(f"go('battle',{{monster:'{mid}'}});ACTS.createparty({{id:'{mid}'}})");a.wait_for_timeout(800)
    a.evaluate("ACTS.setvis({v:'invite'})");a.wait_for_timeout(1500)
    rid2=[r for r in db()['party_rooms'] if r['status']=='gather'][0]['id']
    ok([r for r in db()['party_rooms'] if r['id']==rid2][0]['visibility']=='invite','초대 전용으로 바꿈')
    bp.evaluate("ptFetchRooms()");bp.wait_for_timeout(500)
    ok(not bp.evaluate(f"S.recruits.some(r=>r.roomId==='{rid2}')"),'초대 전용 방은 초대받기 전 다른 블레서 목록에 없음')
    bp.evaluate(f"ACTS.joinrecruit({{id:'room:{rid2}'}})");bp.wait_for_timeout(700)
    ok(bp.evaluate("!S.party") and len([r for r in db()['party_rooms'] if r['id']==rid2][0]['members'])==1,'초대 없이 참가 막힘')
    a.evaluate("mlLoadPlayers()");a.wait_for_timeout(500);a.evaluate("ACTS.invite({name:'하늘별'})");a.wait_for_timeout(700)
    ok(B in ([r for r in db()['party_rooms'] if r['id']==rid2][0].get('invited') or []),'파티장이 실제 블레서 초대')
    bp.evaluate("ptFetchRooms()");bp.wait_for_timeout(500)
    ok(bp.evaluate(f"S.recruits.some(r=>r.roomId==='{rid2}')"),'초대받으면 목록에 보임')
    bp.evaluate(f"ACTS.joinrecruit({{id:'room:{rid2}'}})");bp.wait_for_timeout(900)
    ok(bp.evaluate("!!(S.party&&S.party.shared)"),'초대받은 블레서는 초대 전용 방에 참가')
    bp.evaluate("ACTS.leaveparty()");a.evaluate("ACTS.leaveparty()");a.wait_for_timeout(500)
    # 9) 던전 파티(5페이즈) — 실제 블레서끼리
    did=a.evaluate("(S.data.monsters.find(m=>mkind(m)==='dungeon'&&m.published!==false&&levelOk(m,12)&&!raidBlock(m))||{}).id")
    ok(bool(did),f'던전 {did}')
    def drun_room(): return [r for r in db()['party_rooms'] if r['monster_id']==did][-1]
    def drun_party():
        a.evaluate("daily().dungeon={};S.me.hpPct=1;save()");bp.evaluate("daily().dungeon={};S.me.hpPct=1;save()")
        a.evaluate(f"go('battle',{{monster:'{did}'}});ACTS.createparty({{id:'{did}'}})");a.wait_for_timeout(800)
        r=drun_room();bp.evaluate("ptFetchRooms()");bp.wait_for_timeout(500)
        bp.evaluate(f"ACTS.joinrecruit({{id:'room:{r['id']}'}})");bp.wait_for_timeout(800)
        bp.evaluate("ACTS.ready()");bp.wait_for_timeout(600)
        wait(a,"S.party.members.some(x=>x.name==='하늘별'&&x.ready)")
        a.evaluate("ACTS['merc-fill']&&ACTS['merc-fill']()");a.wait_for_timeout(1200);a.evaluate("ACTS.ready()");a.wait_for_timeout(300)
        a.evaluate("ACTS.depart()");a.wait_for_timeout(1000)
        return r['id']
    drid=drun_party()
    ok(drun_room()['status']=='battle' and a.evaluate("!!(S.drun&&S.drun.shared&&S.drun.shared.host)") ,'던전 파티도 서버 방 → 출발하면 공유 탐사')
    ok(wait(bp,"!!(S.drun&&S.drun.shared)",10000),'파티원 화면에도 같은 던전 탐사가 열림')
    ok(bp.evaluate("JSON.stringify(S.drun.phases)")==a.evaluate("JSON.stringify(S.drun.phases)"),'페이즈 구성이 같음')
    ok('파티장이 진행합니다' in bp.evaluate("vDrun()") and 'data-act="drun-next">' not in bp.evaluate("vDrun()").split('dr-card')[1][:600],'파티원 화면은 진행 버튼 대신 안내')
    i0=bp.evaluate("S.drun.idx");bp.evaluate("ACTS['drun-next']()");bp.wait_for_timeout(300)
    ok(bp.evaluate("S.drun.idx")==i0 and not bp.evaluate("!!S.battle"),'파티원은 혼자 진행할 수 없음')
    g0=bp.evaluate("S.me.gold");boss_gold=bp.evaluate(f"dungeonReward(monster('{did}'),'exp').gold");mob_gold=bp.evaluate(f"Math.round(5+monster('{did}').level)")
    battles=0;chests=0;potion_ok=None
    for step in range(5):
        k=a.evaluate("S.drun.phases[S.drun.idx]");idx=a.evaluate("S.drun.idx")
        if k in ('monster','boss'):
            a.evaluate("ACTS['drun-next']()");a.wait_for_timeout(500)
            okb=wait(bp,f"!!(S.battle&&S.battle.shared&&S.battle.shared.ph==={idx}&&!S.battle.over)",10000)
            if not okb: ok(False,f'{idx+1}페이즈 전투가 파티원에게 열림');break
            if k=='boss': a.evaluate("S.battle.rules.gold=99999999;S.battle.rules.exp=99999999;S.battle.rules.drops=[['g8_gsword',1]];S.battle.ctx.qid='E1';S.battle.ctx.type='dungeon';")
            a.evaluate("S.battle.mon.hp=1")
            bp.evaluate("resetAct();ACTS.confirmact()");wait(a,"S.battle.players.find(p=>p.name==='하늘별').confirmed===true")
            a.evaluate("S.battle.players.forEach(p=>{if(!p.real&&!p.isMe)p.planAt=0;});resetAct();ACTS.confirmact()")
            w1=wait(a,"S.battle.over==='win'",12000);w2=wait(bp,f"S.battle&&S.battle.shared.ph==={idx}&&S.battle.over==='win'",10000)
            if not(w1 and w2): ok(False,f'{idx+1}페이즈 전투 승리(둘 다)');break
            battles+=1
            wait(bp,f"S.drun.idx>{idx}",6000)
            bp.evaluate("leaveBattle()");a.evaluate("leaveBattle()");a.wait_for_timeout(300)
        else:
            if potion_ok is None:
                bp.evaluate("S.drun.hp=0.3;S.me.inv.potion=(S.me.inv.potion||0)+1;ACTS['dr-potion']()")
                potion_ok=wait(a,f"S.drun.hps['{B}']>0.3",5000)
            if k=='chest': chests+=1
            a.evaluate("ACTS['drun-next']()")
            if not wait(bp,f"S.drun.idx>{idx}",6000): ok(False,f'{idx+1}페이즈 이벤트가 파티원에게 전달');break
    ok(battles==3,f'몬스터 2 · 보스 1 페이즈 전투를 함께 진행({battles}번)')
    if potion_ok is not None: ok(potion_ok,'파티원이 던전 사이에 마신 회복약이 파티장 화면 체력에 반영')
    dw=wait(bp,"S.drun&&S.drun.done==='win'",6000) and a.evaluate("S.drun.done==='win'")
    ok(dw,'둘 다 던전 공략 완료')
    ok(bp.evaluate(f"!!daily().dungeon['{did}']"),'파티원도 오늘 클리어 기록')
    dg=bp.evaluate("S.me.gold")-g0
    ok(dg>=boss_gold+2*mob_gold and dg<=boss_gold+2*mob_gold+chests*400 and not bp.evaluate("!!S.me.inv.g8_gsword") and bp.evaluate("S.me.level")<=14,f'파티원 보상은 내 게임 규칙(골드 +{dg}: 보스 {boss_gold}·몬스터 {mob_gold}×2·상자 {chests}) — 파티장이 조작한 1억 골드·LV80 무기 무시')
    ok(drun_room()['status']=='closed','탐사가 끝나면 방 닫힘')
    bp.evaluate("ACTS['drun-exit']()");a.evaluate("ACTS['drun-exit']()");a.wait_for_timeout(300)
    ok(bp.evaluate("!S.drun&&!S.party") and a.evaluate("!S.drun&&!S.party"),'던전 나가기 → 둘 다 정리')
    # 9b) 파티장이 포기하면 파티원 탐사도 끝남
    drun_party()
    ok(wait(bp,"!!(S.drun&&S.drun.shared)",10000),'두 번째 던전 파티 입장')
    a.evaluate("ACTS['drun-quit']()");a.wait_for_timeout(500)
    ok(wait(bp,"S.drun&&S.drun.done==='lose'&&!!S.drun.quitBy",8000) and '탐사 종료' in bp.evaluate("vDrun()"),'파티장이 포기 → 파티원 화면 "탐사 종료"')
    ok(drun_room()['status']=='closed','포기하면 방 닫힘')
    bp.evaluate("ACTS['drun-exit']()");bp.wait_for_timeout(200)
    bp.screenshot(path=OUT+'/party-drun.png')
    # 10) 랜덤 매칭 — 실제 블레서끼리 먼저
    a.evaluate("PT.matchWait=60000");bp.evaluate("PT.matchWait=60000")
    a.evaluate(f"go('battle',{{monster:'{mid}'}});ACTS.queue({{id:'{mid}'}})");a.wait_for_timeout(1200)
    qa=a.evaluate("S.queue&&S.queue.roomId");qt=a.evaluate("S.queue&&S.queue.target")
    ok(bool(qa) and a.evaluate("S.queue.host===true") and [r for r in db()['party_rooms'] if r['id']==qa][0]['name']=='랜덤 매칭','매칭을 시작하면 실제 블레서용 매칭 방을 엶')
    ok(not a.evaluate("!!S.match"),'기다리는 동안은 봇과 바로 매칭하지 않음')
    bp.evaluate(f"go('battle',{{monster:'{mid}'}});ACTS.queue({{id:'{mid}'}})");bp.wait_for_timeout(1500)
    ok(bp.evaluate("S.queue&&S.queue.roomId")==qa and bp.evaluate("S.queue.host")==False,'두 번째 블레서는 그 방으로 매칭')
    ok(wait(a,f"PT.room&&PT.room.members.length===2"),'방장 화면에 실제 블레서 2명')
    ok('실제 블레서' in bp.evaluate("vQueue()"),'매칭 화면에 실제 블레서 매칭 상태 표시')
    if qt and qt>2:
        a.evaluate("PT.matchWait=0");bp.evaluate("PT.matchWait=0")
    ok(wait(a,"!!(S.battle&&S.battle.shared)",10000) and a.evaluate("!S.queue"),'모이면(또는 기다림이 끝나면 용병으로 채워) 출발')
    ok(wait(bp,"!!(S.battle&&S.battle.shared)",10000) and bp.evaluate("!S.queue"),'매칭된 블레서 화면에도 같은 전투')
    ok(bp.evaluate("S.battle.players.some(p=>p.name==='아린'&&!p.isMe)") and a.evaluate("S.battle.players.find(p=>p.name==='하늘별').real===true"),'매칭 파티에 서로 실제 블레서로 들어감')
    a.evaluate("S.battle.over='lose';finishBattle(S.battle);ptPush()");wait(bp,"S.battle&&S.battle.over",8000)
    bp.evaluate("leaveBattle()");a.evaluate("leaveBattle()");a.wait_for_timeout(300)
    # 10b) 혼자면 기다림 뒤 예전처럼 봇 매칭 · 취소하면 방 닫힘
    a.evaluate("PT.matchWait=60000");a.evaluate(f"go('battle',{{monster:'{mid}'}});ACTS.queue({{id:'{mid}'}})");a.wait_for_timeout(1000)
    qc=a.evaluate("S.queue&&S.queue.roomId")
    a.evaluate("ACTS.cancelqueue()");a.wait_for_timeout(400)
    ok(bool(qc) and [r for r in db()['party_rooms'] if r['id']==qc][0]['status']=='closed' and a.evaluate("!S.queue"),'매칭을 취소하면 매칭 방도 닫힘')
    a.evaluate("PT.matchWait=800");a.evaluate(f"go('battle',{{monster:'{mid}'}});ACTS.queue({{id:'{mid}'}})");a.wait_for_timeout(1500)
    a.evaluate("S.queue&&(S.queue.nextTry=0)");
    solo=wait(a,"!!S.match||(S.queue&&S.queue.botOnly)",12000)
    ok(solo and a.evaluate("!S.queue||!S.queue.roomId"),'혼자면 기다림이 끝난 뒤 연습용 동료 매칭으로(방은 닫힘)')
    a.evaluate("S.match?matchFail(true):ACTS.cancelqueue()");a.wait_for_timeout(200)
    bot_r=bp.evaluate("(()=>{const m=S.data.monsters.find(x=>mkind(x)==='party'&&x.published&&levelOk(x,12));let r=null;for(let i=0;i<40;i++){const x=genRecruit(m);if(x&&!joinReason(x)){r=x;break;}}if(!r)return null;S.recruits.push(r);return r.id;})()")
    if bot_r:
        bp.evaluate(f"ACTS.joinrecruit({{id:'{bot_r}'}})");bp.wait_for_timeout(400)
        okb=bp.evaluate("!!S.party&&!S.party.shared&&S.party.members.length>=2")
        if not okb: print('DBG',bp.evaluate("JSON.stringify({p:S.party&&{sh:S.party.shared,n:S.party.members.length},b:!!S.battle,busy:busyReason(),route:S.route,toasts:[...document.querySelectorAll('.toasts > *')].map(t=>t.textContent)})"))
        ok(okb,'봇 파티 참가는 예전처럼(이 기기 안)')
        bp.evaluate("ACTS.leaveparty()")
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    b.close()
print('\n'.join(res));print(f"PASS {sum(r.startswith('OK') for r in res)} / {len(res)}")
