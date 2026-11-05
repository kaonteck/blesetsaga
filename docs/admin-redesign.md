# 운영 페이지 개편 (보기 쉽게) — 백엔드 요청 명세

유저 요청(2026-11-05): 운영 페이지를 더 직관적이고 보기 쉽게. 시안 4가지를 모두 적용하기로 결정했고, 운영 페이지 기능 코드(`admin.html` 마크업·`js/admin/`)는 백엔드 담당이라 **구조 변경은 백엔드가, 스타일은 프론트가** 한다.

- 프론트(완료, 브랜치 `frontend/admin-style`): `admin.html` `<style>` 끝 블록
  - ① 지금 마크업에 바로 적용: 콘텐츠 종류를 위쪽 알약 줄로(≥1101px), 공개하기 줄이 화면 아래에 붙어 있음, 편집 칸 3열(≥1280px), 이름표·표 글자·여백 조금 크게.
  - ② **아래 마크업용 스타일을 미리 넣어 둠** → 백엔드가 아래 구조대로 HTML만 바꾸면 그대로 보임.
- 참고 구현: `docs/admin-redesign/ref.js` — 지금 화면의 DOM을 아래 마크업으로 바꿔 보는 시험 스크립트(어디서도 불러오지 않음). 시안 화면: `docs/admin-redesign/*.png`.

## 1. 왼쪽 메뉴 (11개 탭 → 6묶음)

`shell()`의 `<header class="top">…</header><main class="wrap" id="view">` 대신:

```html
<div class="shell">   <!-- #app 자신에 class="shell"을 붙여도 됨 -->
  <aside class="side">
    <div class="side-brand">블레셋 전기<small>운영 페이지</small></div>
    <nav class="side-nav" role="tablist">
      <div class="nav-g">
        <button class="tab" role="tab" data-tab="home" aria-selected="true"><svg …/>홈</button>
      </div>
      <div class="nav-g"><span class="nav-gl">유저</span>
        <button class="tab" role="tab" data-tab="players" aria-selected="false"><svg …/>회원</button>
        …
      </div>
      …
    </nav>
    <div class="side-me"><span>운영자 이름</span><div class="row"><a class="btn btn-sm" href="./" target="_blank">게임 열기</a><button class="btn btn-g btn-sm" id="logout">로그아웃</button></div></div>
  </aside>
  <main class="wrap" id="view"></main>
</div>
```

- 묶음: (없음) 홈 · **콘텐츠** 콘텐츠 편집 · **유저** 회원·우편 보내기·초대코드 · **커뮤니티** 문의·신고·채팅·피드 · **게임 운영** 행운권·낚시 랭킹 · **보안** 부정 의심·운영 기록.
- 버튼은 지금처럼 `.tab[data-tab]` + 대기 수 `<span class="num">2</span>` → `go()`·`refreshBadges()`·테스트(`.tab[data-tab=…]`) 그대로 동작.
- 아이콘: 16px 선 아이콘 `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">` — 경로는 `ref.js`의 `IC` 그대로 써도 됨.
- 900px 이하에서는 CSS가 위쪽 가로 스크롤 줄로 바꿈(묶음 이름·아이콘 숨김).

## 2. 홈 화면 (새 탭 `home`, 첫 화면)

```html
<div class="ph"><div><h1>오늘의 운영</h1><p>11월 5일 (목) 17:24 · 처리할 일이 3건 있습니다.</p></div></div>
<div class="dash-cards">
  <button class="dash-card ok" data-go="players"><small>지금 접속 중</small><b>1</b><em>최근 10분 · 전체 회원 3명</em></button>
  <button class="dash-card alert" data-go="inbox"><small>답하지 않은 문의</small><b>1</b><em>가장 오래된 것 11-05 17:24</em></button>
  <button class="dash-card alert" data-go="inbox"><small>처리 안 한 신고</small><b>1</b><em>채팅 1건</em></button>
  <button class="dash-card" data-go="guard"><small>부정 의심</small><b>0</b><em>새 기록 없음</em></button>
</div>
<div class="dash-two">
  <div class="panel"><h3>처리할 일</h3><div class="todo">
    <div class="todo-i"><span class="dot bad"></span><div class="t"><b>1:1 문의 · 아린</b><small>버그 신고 · "장비가…" · 11-05 17:24</small></div><button class="btn btn-sm btn-p">답하기</button></div>
    …(신고, 이번 주 행운권 추첨 등. 없으면 <p class="empty">처리할 일이 없습니다.</p>)
  </div></div>
  <div class="panel"><h3>최근 운영 기록 <a class="small" href="#log">모두 보기 ›</a></h3><div class="todo">…최근 5개</div></div>
</div>
```

- 카드 색: 0이 아니면 처리할 일 카드에 `alert`, 접속 중은 `ok`. 카드·버튼을 누르면 해당 탭으로(`go(tab)`).
- 숫자는 이미 있는 값 재사용: 문의·신고는 `refreshBadges`와 같은 질의, 접속은 회원 탭의 '최근 10분 접속', 부정 의심은 guard 탭 목록 수.

## 3. 화면 제목 (모든 탭)

각 VIEW 맨 위에 `<div class="ph"><div><h1>회원</h1><p>한 줄 설명</p></div><div class="ph-act">(오른쪽 버튼: 새로고침·찾기 등)</div></div>`.
설명 문구는 `ref.js`의 `DESC` 참고(고쳐도 됨). 지금 패널 제목줄에 있던 새로고침 버튼 등은 `.ph-act`로 옮기면 깔끔함.

## 4. 콘텐츠 편집

- **버튼을 제목 옆에 고정:** `editorHTML`의 `.ed-head`에 `stick` 클래스, 오른쪽 `<div class="row">칩</div>` 대신 `<div class="ed-act"><button id="c-check">검사</button><button id="c-draft">초안 저장</button><button class="btn btn-p" id="c-pub">공개하기</button></div>`. 상태 칩(코드 기본값 등)은 `<h2>` 옆으로. 아래 줄에는 정리·초안 버리기·기본값 불러오기만 남김(id는 그대로). → 그러면 프론트의 '공개하기 줄 아래 고정' 규칙은 자동으로 안 걸림(`:has(>#c-pub)`).
- **이름표:** `a6-forms.js`의 '이름 · name' 형식 → `<span class="fl">이름<code class="key">name</code></span>` (한글 + 작은 회색 영문 키). 체크 상자 이름표도 같게.
- **칸 묶기(몬스터):** 지금 하나인 `.fm-sec`를 여러 개로. `<section class="fm-sec"><h4>공격 패턴 <i>단일 · 광역 · 지속 피해</i></h4><div class="fgrid">…</div></section>`
  - 기본 정보: id·kind·name·art·region·published·desc
  - 레벨 · 인원: level·maxLevel·min·max·target·roles
  - 능력치: hp·hpScale·atk·def
  - 공격 패턴: singleName·singleMult·aoeName·aoeMult·aoeEvery·dotName·dotChance·dotDmg
  - 보상: exp·gold·drops
  - 그 밖의 값: 기타 (몬스터마다 다른 값 — mass·phases 등)
  - 아이템도 가능하면 기본 정보 / 능력치(버프) / 착용 조건 / 가격으로.

## 5. 퀘스트 장면 접기

- 장면 위에 흐름 줄: `<div class="flow"><span>흐름</span><button class="n" data-scn="s1">장면 1</button><span>→</span><button class="n b">장면 3</button>…<button class="n e">완료 · end_r</button></div>` (`b`=전투, `e`=완료). 누르면 그 장면을 펼치고 그쪽으로 스크롤.
- 각 장면 `.fm-sec.scene`을 `<details class="scn [battle|end]"><summary><b>장면 2</b><span class="s">장면 글 첫 줄</span><span class="to">선택지 3개</span></summary> …원래 section… </details>`로 감쌈. 처음엔 시작 장면만 열기.
- **주의:** 양식은 고칠 때마다 다시 그려지므로 열린 장면 목록을 상태에 기억해 다시 그릴 때 유지(`<details open>`).

## 확인

- `supabase/tests/admin-ui/` 67개(지금 통과)가 계속 통과하도록 — 테스트는 `.tab[data-tab]`·`#c-pub`·`#c-json`·`.codebox` 등을 씀.
- 1440·1280·390px에서 가로 넘침 없음.
