# 백엔드 (Supabase) 설계

담당: 백엔드 세션. 이 폴더의 SQL은 번호 순서대로 한 번씩 적용한다. 적용 여부는 아래 "적용 상태"에 기록.

## 큰 그림

| 묶음 | 표 | 지금(클라이언트) | 서버로 옮긴 뒤 |
|---|---|---|---|
| 계정 | `saves`, `profiles` | 세이브 통째 저장, 다른 유저는 봇 | 세이브는 그대로 + 공개 프로필(이름·클래스·레벨·상태·한줄메모)을 따로 둠 |
| **운영 콘텐츠** | `content`, `content_drafts`, `content_history` | 몬스터·퀘스트·아이템 등이 **각자 세이브(S.data) 안**에 있어서 운영자가 고쳐도 운영자 본인만 바뀜 | 서버 한곳에 두고 모든 유저가 받아 씀. 운영자가 고치면 접속 중인 유저에게도 바로 반영(실시간) |
| 커뮤니티 | `feed_posts`, `feed_comments`, `feed_likes`, Storage `feed` | `S.feed` | 서버. 사진은 Storage |
| 대화 | `chat_messages`, `direct_messages` | `S.chat`, `S.dm` | 서버 + 실시간 |
| 우편 | `mail` + `claim_mail()` | `S.mail` | 서버. 첨부는 두 번 못 받게 서버가 한 번만 표시 |
| 운영 | `inquiries`, `reports`, `admin_log` | `S.inquiries`, `S.reports` | 서버 |
| 랭킹·추첨 | `fish_catches`(+`fish_weekly` 뷰), `lotto_draws`, `lotto_tickets` | 각자 계산 | 서버 |

## 운영 콘텐츠 표 (`004_content.sql`)

한 표에 종류(`kind`)만 바꿔 모두 넣는다. 새 종류가 생겨도 표를 새로 만들 필요가 없다.

| kind | id 예시 | data |
|---|---|---|
| `monster` | `forest`, `st_witch` | 지금 `DEFAULT_MONSTERS`의 객체 그대로 |
| `quest` | `E1`, `J_defender` | 지금 퀘스트 JSON 그대로 |
| `item` | `potion`, `g2_sword` | `ITEMS[id]` 그대로 |
| `market` | `mk1` | 상점 상품 `{item, price, sell, stock}` |
| `notice` | `n1` | 공지 `{title, text, date}` |
| `event` | (자동) | 전광판 `{kind, title, loc, reward, link}` + `ends_at` |
| `setting` | `config`, `mass`, `banner` | `DEFAULT_CONFIG` · `DEFAULT_MASS` · `DEFAULT_BANNER` |
| (이후) `recipe`, `title`, `village`, `text` … | | |

- **공개 / 비공개(`published`), 예약 공개(`starts_at`), 자동 내림(`ends_at`)** — 유저에게는 지금 보여야 하는 것만 내려간다(RLS).
- **초안(`content_drafts`)** — "작성 → 검사 → 공개". 초안을 여러 번 저장해도 유저는 공개본만 본다. `admin_publish(kind, id)`로 공개.
- **변경 기록(`content_history`)** — 공개본이 바뀔 때마다 자동으로 전·후가 남는다. `admin_restore(hid)`로 아무 시점으로나 되돌리기.
- **가져오기(`admin_import(rows, overwrite)`)** — JSON 배열로 여러 개를 한 번에. 처음 한 번 게임 코드의 기본값을 이걸로 넣는다.
- 기본값은 계속 게임 코드(`02-content.js` 등)에 남겨 둔다. 서버에 없는 id는 코드 기본값을 쓰고, 서버에 있으면 서버 값이 이긴다 → 서버가 꺼져도 게임이 돈다.

## 권한 (RLS 요약)

- 운영자 = 로그인 토큰의 `app_metadata.role = 'admin'` (`is_admin()`). 권한을 바꾸면 그 계정은 다시 로그인해야 반영.
- 정지(`profiles.banned_until`) 중에는 채팅·피드·귓속말·우편 보내기가 막힘(`is_active()`).
- 보낸 사람 이름(채팅·우편)은 서버가 프로필에서 채운다 → 다른 사람 이름으로 못 보냄.
- 유저가 바꿀 수 있는 칸만 열어 둠(열 단위 권한): 예) 프로필에서 정지 칸, 우편의 받음 표시, 행운권 등수는 못 바꿈.
- **아직 클라이언트를 믿는 부분(5단계에서 서버 검증):** 레벨·골드·아이템 수치, 유저끼리 보내는 우편 첨부, 행운권 구매 시 골드 차감, 낚시 크기.

## 운영 도구 함수 (`006_admin_ops.sql`)

| 함수 | 하는 일 |
|---|---|
| `admin_players(search, limit)` | 회원 목록: 아이디·이름·레벨·상태·마지막 접속/저장·정지·초대코드 |
| `admin_player_save(user)` | 한 유저의 세이브 보기(읽기 전용, 문의 대응용) |
| `admin_ban(user, until, reason)` | 정지 / `until = null`이면 해제 |
| `admin_send_mail(users, text, items, gold, from)` | 운영 우편. `users = null`이면 전체 |
| `admin_invites()` / `admin_invite_create(code, max_uses, note)` / `admin_invite_delete(code)` | 초대코드 관리. 코드를 비우면 8자리 자동 생성 |
| `admin_log` 표 | 위 함수들이 한 일 전부 기록 |

## 운영 페이지 (`admin.html`)

주소: `/admin.html` (게임과 같은 로그인, 운영자 계정만). 게임 코드를 숨은 프레임에서 돌려 기본값을 읽으므로 기본값을 따로 관리할 필요 없음. 테스트: `tests/admin-ui/`.

### 계획(초안)

운영자가 콘텐츠를 바로 고칠 수 있는 화면. 게임 안 "운영" 탭은 메인·프론트 담당 파일(`04-ui.js`, `06-actions.js`)에 있으므로, **별도 페이지 `admin.html`(+ `js/admin/`)을 백엔드가 새로 만든다.** 게임 파일을 건드리지 않아 다른 세션과 겹치지 않는다.

- 왼쪽: 종류별 목록(검색, 공개/비공개/초안 있음/예약 표시) · 오른쪽: 편집기
- 편집기: 자주 쓰는 칸은 입력 폼, 나머지는 JSON. 저장 = 초안, "공개" 버튼으로 반영
- 공개 전 미리보기 · 검사(퀘스트 단계 연결, 몬스터 id 존재 여부 등)
- 항목마다 변경 기록 타임라인 + "이 시점으로 되돌리기"
- 회원 · 우편 보내기 · 정지 · 초대코드 · 문의 답변 · 신고 처리 · 운영 기록 탭
- 전체 내보내기/가져오기(JSON) — 백업과 대량 수정용

## 게임 연결 상태 (`js/08-server.js`)

- [x] 콘텐츠: 접속할 때 세이브와 함께 받고, 실시간(`content` 변경 알림, 0.8초 모아서) + 5분마다 + 탭을 다시 볼 때 다시 받는다. 운영자 계정도 유저와 같은 기준(공개·기간 안)만 게임에 쓴다.
  - 덮는 곳: monster/quest/market/notice → `S.data` 목록(id로 교체·추가), item → `ITEMS`+`S.data.items`, setting(config·mass·banner) → 기본값 위에 일부만 덮기, event → `S.events`에 `srv:<id>`로.
  - 처음 덮을 때 원래 값을 `S.data._srv[kind][id].base`에 저장 → 서버에서 사라지면 복귀. 덮기 전에 1회 보정(`ensureRelevel`·`ensureVilQuest`·`ensureDunParty`)을 먼저 돌린다.
  - 전투 중·입력 중에는 다시 그리지 않음(다음 화면 전환 때 반영). 이미 시작한 전투는 시작 때 값 유지.
- [ ] 프로필 · 우편 · 채팅 · 피드 · 문의/신고 · 낚시 랭킹 · 행운권

## 연결 순서 (계획)

1. 프로필 동기화(이름·클래스·레벨·상태) → 다른 유저가 봇 대신 실제 유저로 보이기 시작
2. 콘텐츠 불러오기 + 실시간 반영 (서버 값이 코드 기본값을 덮음)
3. 우편 → 채팅·귓속말 → 피드 → 문의·신고 → 낚시 랭킹 → 행운권
4. 운영 페이지

## 적용 상태

| 파일 | Supabase 적용 |
|---|---|
| 001_saves.sql | 적용됨 |
| 002_invites.sql, 003_admin.sql | 적용됨 |
| 004_content.sql | 적용됨 (2026-10-31) |
| 005_social.sql | 적용됨 (2026-10-31) |
| 006_admin_ops.sql | 적용됨 (2026-10-31) |

## 보안 점검 결과 (적용 직후)
- 공개 표는 전부 RLS 켜짐.
- "로그인 유저가 SECURITY DEFINER 함수 실행 가능" 경고(admin_* 등 12개)는 의도된 것: 운영 함수는 첫 줄에서 운영자가 아니면 `NOT_ADMIN`으로 막고, `claim_mail`은 본인 우편만.
- `private.invite_codes` "RLS는 켜졌는데 정책 없음"도 의도된 것(앱에서 접근 불가가 목적).
- 남은 할 일(대시보드): Auth → 유출 비밀번호 차단 켜기.
- 성능 권고(외래키 인덱스·안 쓰인 인덱스)는 데이터가 쌓인 뒤 다시 본다.

## 테스트

로컬 Postgres에 Supabase 흉내(auth·storage·역할)를 만들고 004–006을 적용한 뒤 권한 시나리오 57개를 돌린다(사칭·첨부 두 번 받기·정지 우회·남의 글 수정·추첨 후 구매 등). 스크립트: `tests/`.
