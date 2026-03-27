# Today RPS — 진행 상황 & 체크리스트

> 최종 갱신: 2026-03-27  |  현재 버전: **v0.9.3** (테스트 광고 ID 분리)

---

## ✅ 완료 항목

### 프로젝트 기반
- [x] Vite + React 18 프로젝트 세팅
- [x] `@supabase/supabase-js` 의존성 설치
- [x] `@apps-in-toss/web-framework` 의존성 설치 (AIT AdMob SDK)
- [x] Vite 빌드 설정 (`base: './'`, `manualChunks: undefined`, `assetsInlineLimit: 4096`) — WebView(.ait) 호환
- [x] `vite.config.js` 설정 완료
- [x] `package.json` 스크립트 (`dev` / `build` / `build:ait`) 정의
- [x] `npm run build:ait` 성공 ✅ (2026-03-07)

### DB 스키마 (Supabase — 전체 적용 완료)
- [x] **001_schema.sql** — `users`, `game_records`, `streaks`, `hall_of_fame` 테이블 생성
- [x] **002_triggers.sql** — `fn_update_streaks()` 트리거 + `pg_cron` HoF 스케줄
- [x] **003_rls_policies.sql** — `anon` 역할 GRANT + RLS 정책
- [x] **004_fix_trigger_security.sql** — 트리거 함수에 `SECURITY DEFINER` 적용 (anon 권한 우회)
- [x] **005_recreate_functions_security_definer.sql** — `fn_refresh_hall_of_fame` / `fn_update_streaks` 완전 재정의 (ALTER FUNCTION 불안정 이슈 해소)
- [x] **006_fix_foreach_datatype.sql** — `FOREACH` `42804 datatype_mismatch` 버그 수정 → `FOR i IN 1..6` 인덱스 순환으로 교체

### 프론트엔드 구조
- [x] `AppContext.jsx` — 전역 상태 (뷰 라우팅, userId, todayStatus, Toast)
- [x] `App.jsx` — 뷰 전환 애니메이션 (ViewRouter, CSS transition)
- [x] `MainView.jsx` — 메인 화면 (날짜 배지, 기회 표시, 게임 시작/광고 재도전)
- [x] `GameView.jsx` — 가위바위보 선택, 컴퓨터 AI, 카운트다운 애니메이션
- [x] `ResultView.jsx` — 승/패/무 결과, 컨페티, 광고 재도전 버튼
- [x] `HallOfFameView.jsx` — 카테고리 탭 + TOP 5 랭킹
- [x] `MyRecordsView.jsx` — 누적 통계 + 연속 기록 표시
- [x] `TopBar.jsx` — 공통 헤더 컴포넌트 (뒤로 버튼)
- [x] `Toast.jsx` — 전역 토스트 알림

### 라이브러리
- [x] `lib/config.js` — Supabase 키, 게스트 ID(`localStorage`), 닉네임 생성
- [x] `lib/config.js` — `watchAd()` : AIT 환경에서 `GoogleAdMob.loadAppsInTossAdMob` → `showAppsInTossAdMob` 2단계 실행, 개발환경 1.5초 Mock 폴백
- [x] `lib/config.js` — `AD_GROUP_ID_PROD` / `AD_GROUP_ID_TEST` 분리, `VITE_AD_ENV` 환경변수로 선택 (미설정 시 `import.meta.env.DEV` 자동 판별)
- [x] `.env.example` — `VITE_AD_ENV` 항목 추가 (test / production / 미설정)
- [x] `lib/game.js` — 게임 순수 로직 (가위바위보 판정, streak 메시지, confetti, 날짜 포맷)
- [x] `lib/supabase.js` — REST API 래퍼 (`getOrCreateUser`, `getTodayStatus`, `saveGameRecord`, `fetchHallOfFame`, `fetchMyStreaks`)
- [x] `lib/config.js` — `getTossNickname()` localStorage 캐시 제거 → `generateNickname()` 로 개명, DB 저장 시에만 호출 (사용자별 고유 닉네임 보장)
- [x] `lib/config.js` — `getTossUserId()` async 전환: `getUserKeyForGame()` → HASH 반환 시 사용, 폴백은 localStorage 게스트 ID
- [x] `lib/supabase.js` — `fetchHallOfFame()` 쿼리에 `user_id` 추가
- [x] `views/HallOfFameView.jsx` — 본인 랭킹 항목에 `.hof-item--me` 클래스 + 👑 배지 표시
- [x] `index.css` — `.hof-item--me` 레인보우 shimmer 그라디언트 테두리 + 골드 글로우 효과
- [x] `views/ResultView.jsx` — 광고 재도전 시 총 시도 2회 기록 안내 문구 추가

### 심사 반려 대응 (v0.9.2 — 2026-03-27)
- [x] **줌 제스처 비활성화** — `index.html` viewport 메타에 `maximum-scale=1.0, user-scalable=no` 추가
- [x] **내비게이션 바 백버튼 제거** — `granite.config.js`에 `navigationBar: { withBackButton: false }` 설정 (네이티브 중복 버튼 제거)
- [x] **단일 백버튼 구현** — `MainView.jsx` 헤더 좌측을 종료 버튼(`closeApp()`)으로 교체, 하위 화면은 기존 `TopBar` 백버튼 유지
- [x] **Android 하드웨어 백버튼 처리** — `App.jsx` ViewRouter에 `popstate` 리스너 추가 (최초 화면→앱 종료, 하위 화면→화면 이동)
- [x] **내 기록 접근 경로 유지** — 메인 헤더에서 콘텐츠 영역 하단 링크 버튼(`link-btn`)으로 이동
- [x] **`closeApp()` 유틸 추가** — `lib/config.js`에서 AIT `closeView()` 래핑, 미지원 환경에서 무시
- [x] **`goTo()` 버그 수정** — `AppContext.jsx`의 `prevView` 미저장 버그 수정 (functional update로 현재 view를 prevView에 저장)
- [x] **`index.css`** — `.link-btn` 스타일 추가

### 테스트 광고 ID 분리 (v0.9.3 — 2026-03-27)
- [x] **`lib/config.js`** — `AD_GROUP_ID_PROD` (`ait.v2.live.cacf10246e29481d`) / `AD_GROUP_ID_TEST` (`ait-ad-test-rewarded-id`) 분리 정의
- [x] **`lib/config.js`** — `VITE_AD_ENV` 환경변수로 광고 ID 선택 (`test` / `production` / 미설정 시 `import.meta.env.DEV` 자동 판별)
- [x] **`.env.example`** — `VITE_AD_ENV` 항목 및 사용법 주석 추가
### CSS / 디자인
- [x] Toss 스타일 디자인 시스템 (CSS 변수, 컬러 팔레트)
- [x] 뷰 전환 트랜지션 (slide + opacity)
- [x] 반응형 레이아웃 (max-width 430px, 모바일 우선)
- [x] `#root` height/flex 명시 추가 (흰 화면 버그 수정 — 2026-03-02)
- [x] `.view-loading { display: flex }` 누락 수정 (2026-03-02)

### 환경 설정 / 배포
- [x] `.env.local` SUPABASE_URL 설정 완료
- [x] `.env.local` ANON_KEY 오타 수정 (`seyJ...` → `eyJ...`)
- [x] `npm run build` 성공
- [x] `npm run build:ait` 성공 (`.ait` 번들 생성 완료, 2026-03-07)

---

## 🔲 미완료 / 진행 중

### 기능 미구현
- [ ] Toss In-App SDK 연동 (`getTossUserId()` — ~~현재 `localStorage` 기반 게스트 ID 폴백 사용 중~~ → v0.9.1에서 `getUserKeyForGame()` 연동 완료, 폴백 유지)
- [ ] 닉네임 편집 UI (현재 자동 생성만 지원)
- [ ] 오프라인/네트워크 오류 UI 개선 (현재 Toast만 표시)
- [ ] Supabase `pg_cron` 익스텐션 활성화 확인 (HoF 자동 갱신)

### 빌드/배포
- [ ] Toss 미니앱 콘솔에서 `.ait` 검수 제출
- [ ] 프로덕션 빌드 시 `VITE_AD_ENV=production` 설정 (또는 미설정 — `vite build`는 PROD 자동 적용)
- [ ] 프로덕션 환경변수 설정 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
- [ ] RLS 정책을 Toss JWT(`auth.jwt() ->> 'sub'`) 기반으로 교체 (실서비스 전)

---

## 🐛 해결된 버그

| 날짜 | 증상 | 원인 | 해결 |
|------|------|------|------|
| 2026-03-02 | `http://localhost:5173/` 접속 불가 | 기존 Vite 프로세스(PID 23108)가 포트 점유 | `taskkill /PID 23108 /F` 후 재시작 |
| 2026-03-02 | `No API key found in request` (401) | `ANON_KEY` 맨 앞 `s` 오타 | `.env.local` 수정 후 재시작 |
| 2026-03-02 | upsert POST 401 (GET은 200) | `anon` GRANT 미적용 | `003_rls_policies.sql` 실행 |
| 2026-03-02 | 흰색 화면 | `#root` height 미지정, `.view-loading` `display:flex` 누락 | `index.css` 수정 |
| 2026-03-07 | `game_records INSERT` 시 트랜잭션 롤백 | 트리거 함수가 `SECURITY DEFINER` 없이 `anon` 권한으로 실행 → `hall_of_fame` 쓰기 실패 | `004`, `005` migration으로 `SECURITY DEFINER` 추가 |
| 2026-03-07 | `42804 datatype_mismatch` (HoF 갱신 실패) | `fn_refresh_hall_of_fame` 내 `FOREACH v_cat, v_col` 다중 루프 변수 사용 불가 | `006` migration으로 `FOR i IN 1..6` 인덱스 순환 방식으로 교체 |
| 2026-03-27 | 심사 반려 — 줌 제스처 활성화 | viewport 메타에 `user-scalable` 미지정 | `maximum-scale=1.0, user-scalable=no` 추가 |
| 2026-03-27 | 심사 반려 — 중복 뒤로가기 버튼 | 네이티브 nav bar 백버튼 + in-app TopBar 백버튼 동시 노출 | `granite.config.js` `navigationBar.withBackButton: false` + MainView 헤더 종료 버튼 교체 |
| 2026-03-27 | `goTo()` prevView 미저장 (내비게이션 버그) | `setPrevView(v => v)` 가 현재 view를 캡처하지 못함 | functional update `setView(cur => { setPrevView(cur); return next; })` 로 수정 |
| 2026-03-27 | 테스트 시 실제 광고 ID 사용 → 정책 위반 위험 | `AD_GROUP_ID` 단일 값으로 환경 구분 불가 | `VITE_AD_ENV` 환경변수 + `import.meta.env.DEV` 자동 판별로 TEST/PROD ID 분리 |

---

## 📁 파일 구조

```
Today-RPS/
├── index.html
├── vite.config.js
├── package.json                   v0.9.0
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
│   │   ├── config.js              ✅ 환경변수, 게스트 ID, AIT AdMob 광고
│   │   ├── game.js                ✅ 순수 게임 로직
│   │   └── supabase.js            ✅ API 래퍼 (is_retry 기반 재도전 판단)
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
        ├── 003_rls_policies.sql   ✅ 적용 완료
        ├── 004_fix_trigger_security.sql            ✅ 적용 완료
        ├── 005_recreate_functions_security_definer.sql ✅ 적용 완료
        └── 006_fix_foreach_datatype.sql            ✅ 적용 완료
```

---

## 🏷️ 버전 관리 플랜

### 버전 체계 — SemVer (`MAJOR.MINOR.PATCH`)

| 자릿수 | 의미 | 예시 트리거 |
|--------|------|------------|
| **MAJOR** | 하위 호환 불가 변경 | DB 스키마 파괴적 수정, API 계약 변경, Toss SDK 주요 버전 업 |
| **MINOR** | 하위 호환 기능 추가 | 새 뷰/기능 추가, 새 통계 카테고리, 닉네임 편집 UI |
| **PATCH** | 버그 수정, 미세 조정 | 버그 픽스, 문구/스타일 수정, migration 핫픽스 |

### 현재 버전 로드맵

```
v0.9.0  현재  — .ait 빌드 성공, 광고 SDK 연동, DB 트리거 안정화
  │
  ├─ v0.9.1  PATCH — Toss JWT 기반 getTossUserId() 연동
  ├─ v0.9.2  PATCH — RLS 정책 Toss JWT 교체 + pg_cron 확인
  │
  ├─ v0.10.0 MINOR — 닉네임 편집 UI 추가
  ├─ v0.11.0 MINOR — 오프라인 에러 UI 개선
  │
  └─ v1.0.0  MAJOR — Toss 미니앱 스토어 정식 출시
                      (실 SDK 완전 연동 + RLS 프로덕션 설정 완료)
```

### 버전 관리 규칙

1. **`package.json`의 `version` 필드**가 단일 진실 공급원(SSOT)  
   → `npm version patch|minor|major` 명령으로 자동 bump + git tag 생성

2. **빌드 시 버전 주입** — 향후 UI(앱 정보 화면 등)에 표시할 경우:
   ```js
   // vite.config.js 에 추가 예정
   define: {
     __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
   }
   ```

3. **Migration 버전 연동** — DB 스키마 변경이 포함된 릴리스는 반드시 `MAJOR` 또는 `MINOR` bump  
   → migration 파일명: `NNN_description.sql` (연번 오름차순 유지)

4. **git 태그 컨벤션**: `v0.9.0`, `v1.0.0` 형식 (npm 기본값 그대로 사용)

5. **`.ait` 제출 시**: Toss 미니앱 콘솔의 앱 버전은 `package.json` 버전과 일치시킴

---

## 🚀 다음 액션 (우선순위 순)

1. **[즉시]** Toss 미니앱 콘솔에 `.ait` 파일 업로드 → 내부 검수 시작
2. **[단기 — v0.9.1]** `getTossUserId()` 실제 Toss In-App SDK 호출로 교체
3. **[단기 — v0.9.2]** RLS 정책 Toss JWT 기반으로 교체 + Supabase Custom JWT Provider 설정
4. **[중기 — v0.10.0]** 닉네임 편집 UI 추가
5. **[중기]** `pg_cron` 익스텐션 활성화 및 HoF 자동 갱신 검증
6. **[배포 전 — v1.0.0]** 프로덕션 환경변수 최종 점검 후 정식 릴리스
