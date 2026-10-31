# 운영 페이지 브라우저 테스트

진짜 Supabase 대신 메모리 가짜 서버(`mock-supabase.js`)를 끼워 `admin.html`의 모든 탭을 눌러 본다(46개 확인, 콘솔 오류·휴대폰 가로 넘침 포함).

```
python3 -m http.server 8765        # 저장소 맨 위에서
python3 supabase/tests/admin-ui/test_admin.py   # SHOTS=폴더 로 스크린샷 위치 지정
```
