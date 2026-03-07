# Today RPS — 진행 상황 & 체크리스트

> 최종 갱신: 2026-03-02

---

## ✅ 완료 항목

### 프로젝트 기반
- [x] Vite + React 18 프로젝트 세팅
- [x] `@supabase/supabase-js` 의존성 설치
- [x] Vite 빌드 설정 (`base: './'`, `manualChunks: undefined`) — WebView(Toss .ait) 호환
- [x] `vite.config.js` 설정 완료
- [x] `package.json` 스크립트 (`dev` / `build` / `build:ait`) 정의

### DB 스키마 (Supabase)
- [x] **001_schema.sql** — `users`, `game_records`, `streaks`, `hall_of_fame` 테이블 생성
- [x] **002_triggers.sql** — `fn_update_streaks()` 트리거 (game_records INSERT → streaks 자동 갱신)
- [x] **002_triggers.sql** — `fn_refresh_hof()` + `pg_cron` 스케줄 (매일 04:00 KST 명예의 전당 갱신)
- [x] **003_rls_policies.sql** — `anon` 역할 GRANT + RLS 정책 작성 _(Supabase SQL Editor 실행 필요)_

### 프론트엔드 구조
- [x] `AppContext.jsx` — 전역 상태 (뷰 라우팅, userId, todayStatus, Toast)
- [x] `App.jsx` — 뷰 전환 애니메이션 (ViewRouter, CSS transition)
- [x] `MainView.jsx` — 메인 화면 (날짜 배지, 기회 표시, 게임 시작/광고 재도전)
- [x] `GameView.jsx` — 가위바위보 선택, 컴퓨터 AI, 애니메이션
- [x] `ResultView.jsx` — 승/패/무 결과, 컨페티, 광고 재도전 버튼
- [x] `HallOfFameView.jsx` — 카테고리 탭 + TOP 5 랭킹
- [x] `MyRecordsView.jsx` — 누적 통계 + 연속 기록 표시
- [x] `TopBar.jsx` — 공통 헤더 컴포넌트 (뒤로 버튼)
- [x] `Toast.jsx` — 전역 토스트 알림

### 라이브러리
- [x] `lib/config.js` — Supabase 키, 게스트 ID 생성 (`localStorage`), 닉네임 생성, 광고 Mock
- [x] `lib/game.js` — 게임 순수 로직 (가위바위보 판정, streak 메시지, confetti, 날짜 포맷)
- [x] `lib/supabase.js` — REST API 래퍼 (`getOrCreateUser`, `getTodayStatus`, `saveGameRecord`, `fetchHallOfFame`, `fetchMyStreaks`)

### CSS / 디자인
- [x] Toss 스타일 디자인 시스템 (CSS 변수, 컬러 팔레트)
- [x] 뷰 전환 트랜지션 (slide + opacity)
- [x] 반응형 레이아웃 (max-width 430px, 모바일 우선)
- [x] `#root` height/flex 명시 추가 (흰 화면 버그 수정 — 2026-03-02)
- [x] `.view-loading { display: flex }` 누락 수정 (2026-03-02)

### 환경 설정 / 배포
- [x] `.env.local` SUPABASE_URL 설정 완료
- [x] `.env.local` ANON_KEY 오타 수정 (`seyJ...` → `eyJ...`, 2026-03-02)
- [x] `npm run build` 성공 (337KB JS, 13KB CSS)

---

## 🔲 미완료 / 진행 중

### Supabase 설정 (즉시 필요)
- [ ] **003_rls_policies.sql** Supabase SQL Editor에서 실행
  - GRANT (INSERT/UPDATE/DELETE) to `anon` 역할
  - RLS POLICY 적용
  - 미적용 시: upsert POST 호출 → 401 오류 지속
  - URL: https://supabase.com/dashboard/project/dxuvdvvdpcbkilesovoc/sql/new

### 기능 미구현
- [ ] Toss In-App SDK 연동 (`getTossUserId()` → 실제 SDK 호출)
- [ ] Toss 광고 SDK 연동 (`watchAd()` — 현재 Mock 1.5초 딜레이)
- [ ] 닉네임 편집 UI (현재 자동 생성만 지원)
- [ ] 오프라인/네트워크 오류 UI 개선 (현재 Toast만 표시)
- [ ] Supabase `pg_cron` 익스텐션 활성화 확인 (HoF 자동 갱신)

### 빌드/배포
- [ ] `.ait` 번들 생성 (`npm run build:ait`) 및 Toss 미니앱 제출
- [ ] 프로덕션 환경 환경변수 설정
- [ ] RLS 정책을 Toss JWT 기반으로 교체 (실서비스 전)

---

## 🐛 해결된 버그

| 날짜 | 증상 | 원인 | 해결 |
|------|------|------|------|
| 2026-03-02 | `http://localhost:5173/` 접속 불가 | 기존 Vite 프로세스(PID 23108)가 5173 포트 점유 | `taskkill /PID 23108 /F` 후 재시작 |
| 2026-03-02 | `No API key found in request` (401) | `ANON_KEY` 맨 앞 `s` 오타 (`seyJ...`) | `.env.local` 수정 후 서버 재시작 |
| 2026-03-02 | upsert POST 401 (GET은 200) | SQL migrations로 생성한 테이블에 `anon` GRANT 미적용 | `003_rls_policies.sql` 작성 (SQL Editor 실행 필요) |
| 2026-03-02 | 흰색 화면 | `#root` height 미지정(`flex child` collapse), `.view-loading` `display:flex` 누락 | `index.css` 수정 |

---

## 📁 파일 구조

```
Today-RPS/
├── index.html
├── vite.config.js
├── package.json
├── .env.local                     ✅ Supabase 연결 정보
├── src/
│   ├── main.jsx
│   ├── App.jsx                    ✅ 뷰 라우터 + 전환 애니메이션
│   ├── index.css                  ✅ Toss 디자인 시스템
│   ├── components/
│   │   ├── TopBar.jsx             ✅
│   │   └── Toast.jsx              ✅
│   ├── context/
│   │   └── AppContext.jsx         ✅ 전역 상태
│   ├── lib/
│   │   ├── config.js              ✅ 환경변수, 게스트 ID, 광고 Mock
│   │   ├── game.js                ✅ 순수 게임 로직
│   │   └── supabase.js            ✅ API 래퍼
│   └── views/
│       ├── MainView.jsx           ✅
│       ├── GameView.jsx           ✅
│       ├── ResultView.jsx         ✅
│       ├── HallOfFameView.jsx     ✅
│       └── MyRecordsView.jsx      ✅
└── supabase/
    └── migrations/
        ├── 001_schema.sql         ✅ 적용 완료
        ├── 002_triggers.sql       ✅ 적용 완료
        └── 003_rls_policies.sql   ⚠️ SQL Editor 실행 필요
```

---

## 🚀 다음 액션 (우선순위 순)

1. **[즉시]** Supabase SQL Editor에서 `003_rls_policies.sql` 실행
2. **[즉시]** http://localhost:5173/ 접속 → 화면 정상 표시 확인
3. **[단기]** Supabase `pg_cron` 익스텐션 활성화 및 `002_triggers.sql` cron 동작 확인
4. **[중기]** Toss In-App SDK 연동 (userId, 광고)
5. **[배포 전]** RLS 정책 Toss JWT 기반으로 교체
6. **[배포 전]** `npm run build:ait` → `.ait` 파일 생성 및 검수
