from playwright.sync_api import sync_playwright
import os; SP=os.path.dirname(os.path.abspath(__file__)); OUT=os.environ.get('SHOTS','/tmp')
MOCK=open(SP+'/mock-supabase.js').read();res=[]
A='aaaaaaaa-0000-0000-0000-00000000000a';B='bbbbbbbb-0000-0000-0000-00000000000b'
def ok(c,l):res.append(('OK  ' if c else 'FAIL')+' '+l)
with sync_playwright() as p:
    b=p.chromium.launch();ctx=b.new_context(viewport={'width':1280,'height':900});errs=[]
    ctx.route('**/fonts.g*/**',lambda r:r.abort());ctx.route('**/cdn.jsdelivr.net/gh/**',lambda r:r.abort())
    def player(uid,user,name):
        pg=ctx.new_page();pg.on('pageerror',lambda e:errs.append(name+': '+str(e)))
        pg.on('console',lambda m:m.type=='error' and 'ERR_FAILED' not in m.text and errs.append(name+': '+m.text))
        pg.add_init_script(f"window.__UID='{uid}';window.__USERNAME='{user}';")
        pg.route('**/supabase-js@*/**',lambda r:r.fulfill(body=MOCK,content_type='application/javascript'))
        pg.goto('http://localhost:8765/');pg.wait_for_selector('input[maxlength="10"]',timeout=20000)
        pg.fill('input[maxlength="10"]',name);pg.locator('.create button.btn-primary').first.click();pg.wait_for_function('S&&S.me',timeout=10000)
        pg.evaluate("cloudFlush()");pg.wait_for_timeout(500);return pg
    a=player(A,'arin','아린');bp=player(B,'bella','하늘별')
    for pg in (a,bp): pg.evaluate("mlLoadPlayers().then(()=>{S.route='community';render();})")
    a.wait_for_timeout(700)
    db=lambda:a.evaluate("JSON.parse(localStorage.getItem('__mockdb'))")
    view=lambda pg:pg.inner_text('#view .fd-list')
    # 빈 피드: 봇 글 없음
    ok('아직 올라온 글이 없습니다' in view(a) and a.locator('.fd-post').count()==0,'서버 모드 피드에 봇 글 없음 · 빈 안내')
    # A 글쓰기
    a.fill('#fd-text','오늘 첫 사냥 다녀왔어요 ⚔️');a.click('.fd-compose button[type=submit]');a.wait_for_timeout(900)
    d=db();ok(len(d['feed_posts'])==1 and d['feed_posts'][0]['author']==A and d['feed_posts'][0]['author_name']=='아린','글이 서버에 저장(쓴 사람 아린)')
    ok(a.locator('.fd-post').count()==1 and '오늘 첫 사냥' in view(a) and a.input_value('#fd-text')=='','내 화면에 글 · 입력칸 비움')
    ok(a.evaluate("(S.feed||[]).some(p=>p.text.includes('첫 사냥'))")==False,'로컬 봇 피드(S.feed)에는 안 들어감')
    # B 실시간
    bp.wait_for_timeout(900)
    ok('오늘 첫 사냥' in view(bp) and '아린' in view(bp),'상대 화면에 실시간 도착')
    pid=bp.evaluate("feed()[0].id")
    # B 좋아요·댓글
    bp.click(f'.fd-like[data-k="p"][data-id="{pid}"]');bp.wait_for_timeout(900)
    ok(len(db()['feed_likes'])==1 and db()['feed_likes'][0]['user_id']==B,'좋아요 서버 저장')
    a.wait_for_timeout(700)
    ok('하늘별님이 좋아합니다' in view(a),'글쓴이 화면에 "하늘별님이 좋아합니다"')
    bp.fill(f'#fdc-{pid}','축하해요! 🎉');bp.press(f'#fdc-{pid}','Enter');bp.wait_for_timeout(900)
    c=[x for x in db()['feed_comments']];ok(len(c)==1 and c[0]['author_name']=='하늘별' and c[0]['parent_id'] is None,'댓글 서버 저장')
    a.wait_for_timeout(800)
    ok('축하해요!' in view(a),'글쓴이 화면에 댓글 실시간')
    ok('하늘별님이 내 글에 댓글을 남겼습니다' in a.inner_text('body'),'내 글 댓글 알림')
    # A 답글 · 댓글 좋아요
    cid=a.evaluate("feed()[0].comments[0].id")
    a.click(f'[data-act="fd-reply"][data-id="{cid}"]');a.wait_for_timeout(200)
    a.fill(f'#fdi-{cid}','고마워요 😊');a.press(f'#fdi-{cid}','Enter');a.wait_for_timeout(900)
    c=db()['feed_comments'];ok(any(x['parent_id']==c[0]['id'] and x['text']=='고마워요 😊' for x in c),'답글 서버 저장(원댓글에)')
    a.click(f'.fd-like[data-k="c"][data-id="{cid}"]');a.wait_for_timeout(900)
    ok(len(db()['feed_comment_likes'])==1,'댓글 좋아요 서버 저장')
    bp.wait_for_timeout(700)
    ok(bp.evaluate("feed()[0].comments[0].replies.map(r=>r.text)")==['고마워요 😊'] and bp.evaluate("feed()[0].comments[0].likes")==['아린'],'상대에게 답글·댓글 좋아요 도착')
    # 쓰던 입력칸 지키기: B가 댓글 쓰는 중에 A가 새 글
    bp.click(f'#fdc-{pid}');bp.type(f'#fdc-{pid}','쓰는 중인데');
    a.fill('#fd-text','두 번째 글');a.click('.fd-compose button[type=submit]');a.wait_for_timeout(1300)
    ok(bp.locator('.fd-post').count()==2,'쓰는 중에도 새 글 받아 옴')
    ok(bp.input_value(f'#fdc-{pid}')=='쓰는 중인데' and bp.evaluate(f"document.activeElement.id")==f'fdc-{pid}','다시 그려도 쓰던 댓글·커서 그대로')
    bp.fill(f'#fdc-{pid}','')
    # 좋아요 취소
    bp.click(f'.fd-like[data-k="p"][data-id="{pid}"]');bp.wait_for_timeout(900)
    ok(len(db()['feed_likes'])==0 and bp.evaluate(f"fdFind('p','{pid}').likes")==[],'좋아요 취소')
    # 남의 글엔 삭제 버튼 없음, 내 글 삭제
    ok(bp.locator(f'[data-act="fd-del"][data-id="{pid}"]').count()==0,'남의 글에는 삭제 버튼 없음')
    a.click(f'[data-act="fd-del"][data-id="{pid}"]');a.wait_for_timeout(1000)
    ok(len(db()['feed_posts'])==1 and len(db()['feed_comments'])==0,'내 글 삭제(댓글도 함께)')
    bp.wait_for_timeout(700);ok(bp.locator('.fd-post').count()==1 and '오늘 첫 사냥' not in view(bp),'상대 화면에서도 사라짐')
    # 가린 글은 안 보임 (운영자가 가린 경우: 1분마다 다시 받음)
    # 가짜 서버는 두 탭이 localStorage를 함께 고쳐 써서 방금 넣은 값이 덮일 수 있음 → 반영될 때까지 다시 넣고 기다림(가짜 서버만의 문제)
    hide="(()=>{const d=JSON.parse(localStorage.getItem('__mockdb'));d.feed_posts.forEach(p=>p.hidden=true);localStorage.setItem('__mockdb',JSON.stringify(d));return d.feed_posts.every(p=>p.hidden);})()"
    for _ in range(10):
        a.evaluate(hide);bp.wait_for_timeout(300)
        if a.evaluate("JSON.parse(localStorage.getItem('__mockdb')).feed_posts.every(p=>p.hidden)"):break
    bp.evaluate("fdFetch()")
    try: bp.wait_for_function("document.querySelectorAll('.fd-post').length===0",timeout=4000)
    except Exception: pass
    ok(bp.locator('.fd-post').count()==0,'가린 글은 안 보임')
    # HTML 삽입
    a.fill('#fd-text','<img src=x onerror="window.__X=1"><b>굵게</b>');a.click('.fd-compose button[type=submit]');a.wait_for_timeout(900);bp.wait_for_timeout(800)
    ok(bp.locator('.fd-text img').count()==0 and '<b>굵게</b>' in view(bp) and not bp.evaluate("window.__X||0"),'글 속 HTML은 글자로만')
    # 정지 계정
    a.evaluate("window.__BANNED=true");a.fill('#fd-text','정지 중 글');a.click('.fd-compose button[type=submit]');a.wait_for_timeout(700)
    ok('이용이 제한' in a.inner_text('#toasts') and a.input_value('#fd-text')=='정지 중 글','정지 중엔 거절 · 쓴 글 남김')
    a.evaluate("window.__BANNED=false")
    # 실제 블레서 이름 → 정보 카드
    bp.locator('.fd-post .fd-name',has_text='아린').first.click();bp.wait_for_timeout(300)
    ok('아린' in bp.inner_text('#rmenu') and '1:1 대화' in bp.inner_text('#rmenu'),'글쓴이 이름 → 실제 블레서 정보 카드')
    a.screenshot(path=OUT+'/feed-a.png',full_page=False)
    ok(not errs,'콘솔 오류 없음 '+'; '.join(errs[:3]))
    b.close()
print('\n'.join(res));print(f"PASS {sum(r.startswith('OK') for r in res)} / {len(res)}")
