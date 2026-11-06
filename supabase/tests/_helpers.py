# 브라우저 테스트 공통 도우미
def create_char(pg, name, real='테스트', region='서울', timeout=10000):
    """캐릭터 만들기: 이름 → 시작 → 확정 창 '확인' → (뜨면) 블레서 정보 입력."""
    pg.wait_for_selector('#new-name', timeout=20000)
    pg.fill('#new-name', name)
    pg.click('.cd-go')
    pg.wait_for_selector('[data-act="cc-confirm"]', timeout=timeout)
    pg.click('[data-act="cc-confirm"]')
    pg.wait_for_function('typeof S!=="undefined"&&S&&S.me', timeout=timeout)
    try:
        pg.wait_for_selector('#rn-gate', timeout=1500)
    except Exception:
        return
    pg.fill('#rn-in', real); pg.fill('#rn-loc', region)
    pg.click('#rn-gate button[type=submit]')
    pg.wait_for_selector('#rn-gate', state='detached', timeout=timeout)
