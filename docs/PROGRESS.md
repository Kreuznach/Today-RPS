# Today RPS — 지금 어디까지 했나

> 마지막 고친 날: 2026-11-13  |  지금 버전: **v0.16.0**
>
> 쉬운 말: 하루 한 판 규칙과 공정한 확률은 그대로예요. 이번엔 **"내일 또 오고 싶게"** 만드는 작은 장치를
> 넣었어요. 메인 화면을 정리하고, 출석 도장판과 "내일 예고", "다음 목표 한 줄", 새 배지를 더했어요.
> 데이터베이스(SQL)는 바꾸지 않았으니 새로 실행할 것은 없어요.
>
> 성장 아이디어: [GROWTH_AND_CONTENT.md](GROWTH_AND_CONTENT.md) · 재방문 가이드: [FUN_AND_RETURN_GUIDE.md](FUN_AND_RETURN_GUIDE.md)

### v0.16.0에서 새로 된 것 — 재미·재방문 개선 (2026-11-13)
- **메인 화면 정리**: 꼭 필요한 줄(끊김 예고, 오늘의 기운)만 먼저 보여 주고, 나머지(이번 주 손, 오늘 승률,
  응원 선두)는 **"오늘의 소식 더 보기"** 를 누르면 펼쳐져요. 책상 위를 정리한 것과 같아요.
- **출석 도장판**: 1~10일 칸이 있어서 하루 하면 도장이 하나씩 찍혀요. 10일을 채우면 명예의 전당에 도전할 수 있어요.
- **내일 예고**: 오늘 한 판을 끝내면 "내일은 화요일 집중보!"처럼 내일의 요일 옷을 미리 알려 줘요.
- **다음 목표 한 줄**: 결과 화면과 메인 화면에 "3연승까지 1승 남았어요!", "7일 출석 배지까지 2일!"처럼
  가장 가까운 목표 하나를 보여 줘요. 겁주는 말은 쓰지 않아요.
- **새 배지 8개** (총 22개): 바위 장인, 보 장인, 세 손 정복, 14일 출석, 30일 출석, 10연승, 30승 등.
  오래 하는 사람의 목표가 되도록 만들었어요.
- **바뀌지 않은 것**: 하루 1판, 광고 재도전 1회, 컴퓨터 손 확률, DB 구조.
- **바뀐 파일**: [content.js](../src/lib/content.js), [MainView.jsx](../src/views/MainView.jsx),
  [ResultView.jsx](../src/views/ResultView.jsx), [supabase.js](../src/lib/supabase.js),
  [index.css](../src/index.css), [changelogs.json](../src/data/changelogs.json)
- **확인한 것**: `npm run build`(웹 빌드 + `.ait` 만들기) 성공, `node scripts/check-features.mjs` 통과.
  새 배포 파일: `today-rps.ait` (2026-11-13 빌드)
- **아직 안 한 것(다음 단계)**: 주간 리캡 카드, 친구용 "손 맞히기" 공유, 시즌 마감 이벤트, 조건부 알림
  → [FUN_AND_RETURN_GUIDE.md](FUN_AND_RETURN_GUIDE.md)의 4~5단계

### v0.15.0에서 새로 된 것 — 토스 SDK 업그레이드 (2026-09-10)
- **`@apps-in-toss/web-framework`를 2.1.0 → 3.4.0으로 업그레이드**했습니다.
  - 토스에서 "3.1 이상을 써주세요"라고 권장해서 진행했습니다. (버전 숫자는 게임 버전이랑 비슷해요.
    낮은 번호는 옛날 버전, 높은 번호는 최신 버전이라는 뜻이에요.)
  - 공식 변환 도구(`ait migrate v3`)를 사용해 설정 파일을 `granite.config.js` → **`apps-in-toss.config.js`**
    형식으로 자동 변환했습니다. (파일 이름과 몇몇 설정 이름만 바뀐 것이고, 앱 내용은 그대로예요.)
  - 개발용 도구 패키지 `@apps-in-toss/devtools`가 추가되어, 컴퓨터 브라우저에서도 토스 앱과
    비슷한 화면(테스트 패널)을 볼 수 있게 되었습니다.
- **낡은(deprecated) 함수 교체**: SDK가 "이제 이 함수는 그만 쓰고 이걸 쓰세요"라고 안내한
  두 곳을 새 함수로 바꿨습니다. (기능은 동일하고, 이름만 바뀐 것이에요.)
  - 앱 종료: `closeView()` → `Screen.close()`
  - 사용자 고유 번호 가져오기: `getUserKeyForGame()` → `User.getAnonymousKey()`
- **패치노트(최근 업데이트) 갱신**: 앱 메인 화면 아래 "최근 업데이트" 목록에 오늘 날짜로 안내
  문구를 추가했습니다. → [changelogs.json](../src/data/changelogs.json)
- **확인한 것**: `npm install`, `npm run build`(빌드 성공), `npm run dev`(개발 서버 정상 실행,
  화면 정상 표시)까지 모두 문제없이 동작하는 걸 확인했습니다.

### v0.14.0에서 새로 된 것
- 이름 바꾸기 (한국 시간 하루 1번)
- 연결 실패 화면 (오늘 기회는 서버에 남음)
- 결과 공유 카드 (사용자 번호 없음)
- 손 버릇, 주간 요약, 출석 D-day, 내 순위
- 배지, 요일 옷, 오늘의 손 힌트(확률 그대로)
- 이달 명예의 전당, 응원 색
- SQL: [009_growth_features.sql](../supabase/migrations/009_growth_features.sql) (대시보드에서 실행)

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
- [x] **007_play_streak_min_threshold.sql** — `play_streak` 최소 집계 기준 10일 적용
- [x] **008_hall_of_fame_top10.sql** — `fn_refresh_hall_of_fame` `LIMIT 5` → `LIMIT 10` 변경 (TOP 10 확장)
- [x] **009_growth_features.sql** — 닉네임 하루 1회, 배지, 오늘 통계, 이달 랭킹 (대시보드 실행 필요)

### 프론트엔드 구조
- [x] `AppContext.jsx` — 전역 상태 (뷰 라우팅, userId, todayStatus, Toast)
- [x] `App.jsx` — 뷰 전환 애니메이션 (ViewRouter, CSS transition)
- [x] `MainView.jsx` — 메인 화면 (날짜 배지, 기회 표시, 게임 시작/광고 재도전)
- [x] `GameView.jsx` — 가위바위보 선택, 컴퓨터 AI, 카운트다운 애니메이션
- [x] `ResultView.jsx` — 승/패/무 결과, 컨페티, 광고 재도전 버튼
- [x] `HallOfFameView.jsx` — 카테고리 탭 + TOP 10 랭킹
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
- [x] `lib/config.js` — `getTossNickname()` localStorage 캐시 제거 → `generateNickname()`로 개명, DB 저장 시에만 호출 (사용자별 고유 닉네임 보장)
- [x] `lib/config.js` — `getTossUserId()` async 전환: `getUserKeyForGame()` → HASH 반환 시 사용, 폴백은 localStorage 게스트 ID
- [x] `lib/supabase.js` — `fetchHallOfFame()` 쿼리에 `user_id` 추가
- [x] `views/HallOfFameView.jsx` — 본인 랭킹 항목에 `.hof-item--me` 클래스 + 👑 배지 표시
- [x] `index.css` — `.hof-item--me` 레인보우 shimmer 그라디언트 테두리 + 골드 글로우 효과
- [x] `views/ResultView.jsx` — 광고 재도전 시 총 시도 2회 기록 안내 문구 추가

### 명예의 전당 TOP 10 확장 (v0.9.5 — 2026-04-03)
- [x] **`supabase/migrations/008_hall_of_fame_top10.sql`** — `fn_refresh_hall_of_fame` `LIMIT 5 → LIMIT 10` 변경
- [x] **`views/HallOfFameView.jsx`** — `RANK_EMOJI` 배열 5개 → 10개 확장 (`6️⃣`~`🔟` 추가)
- [x] **`index.css`** — `.hof-rank.rank-6` ~ `.rank-10` 스타일 추가
- [x] **`src/data/changelogs.json`** — 2026.04.03 업데이트 항목 추가
- [x] **`index.css`** — `.hof-tabs`에 `position: sticky; top: 56px` 적용 (10개 리스트 스크롤 시 탭 가려짐 현상 수정)

### 심사 반려 대응 (v0.9.2 — 2026-03-27)
- [x] **줌 제스처 비활성화** — `index.html` viewport 메타에 `maximum-scale=1.0, user-scalable=no` 추가
- [x] **내비게이션 바 백버튼 제거** — `granite.config.js`에 `navigationBar: { withBackButton: false }` 설정 (네이티브 중복 버튼 제거)
- [x] **단일 백버튼 구현** — `MainView.jsx` 헤더 좌측을 종료 버튼(`closeApp()`)으로 교체, 하위 화면은 기존 `TopBar` 백버튼 유지
- [x] **Android 하드웨어 백버튼 처리** — `App.jsx` ViewRouter에 `popstate` 리스너 추가 (최초 화면→앱 종료, 하위 화면→화면 이동)
- [x] **내 기록 접근 경로 유지** — 메인 헤더에서 콘텐츠 영역 하단 링크 버튼(`link-btn`)으로 이동
- [x] **`closeApp()` 유틸 추가** — `lib/config.js`에서 AIT `closeView()` 래핑, 미지원 환경에서 무시
- [x] **`goTo()` 버그 수정** — `AppContext.jsx`의 `prevView` 미저장 버그 수정 (functional update로 현재 view를 prevView에 저장)
- [x] **`index.css`** — `.link-btn` 스타일 추가

### UI 개선 (v0.9.4 — 2026-04-01)
- [x] **`MainView.jsx`** — 메인 화면 기회 표시 캐러셀 점(`.chance-dot`) → 레이블 칩(`.chance-chip`)으로 재설계 ("1회" / "재도전" 텍스트 칩, 상태별 색상 유지)
- [x] **`MainView.jsx`** — 우측 상단 별표(⭐ 즐겨찾기 연상) SVG → 트로피 컵 SVG로 교체 (명예의 전당 이동 버튼 의미 명확화)
- [x] **`index.css`** — `.chance-indicator` / `.chance-dot` 스타일 → `.chance-slots` / `.chance-chip` 스타일로 교체

### 테스트 광고 ID 분리 (v0.9.3 — 2026-03-27)
- [x] **`lib/config.js`** — `AD_GROUP_ID_PROD` (`ait.v2.live.cacf10246e29481d`) / `AD_GROUP_ID_TEST` (`ait-ad-test-rewarded-id`) 분리 정의
- [x] **`lib/config.js`** — `VITE_AD_ENV` 환경변수로 광고 ID 선택 (`test` / `production` / 미설정 시 `import.meta.env.DEV` 자동 판별)
- [x] **`.env.example`** — `VITE_AD_ENV` 항목 및 사용법 주석 추가### CSS / 디자인
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
- [x] 닉네임 편집 UI (v0.14.0)
- [x] 오프라인/네트워크 오류 UI (v0.14.0)
- [ ] Toss 계정과 게스트 기록 합치기 (콘솔·운영 작업)
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
| 2026-04-02 | KST 00:00 자정 기준 날짜 오류 | `getLocalKSTDate()` 내 `.toISOString()` UTC 변환으로 전날 날짜 반환 | `Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul' })` 로 교체 |
| 2026-04-02 | `.ait` 업로드 시 `deploymentId를 찾을 수 없다` | 커스텀 스크립트가 단순 ZIP 생성 (AITBUNDL 바이너리 헤더 미포함) | `build:ait` 스크립트를 `node_modules/.bin/ait build` 로 교체 |
| 2026-04-03 | 기록 저장 중 `[23514]` check_violation | `hall_of_fame.rank CHECK (rank BETWEEN 1 AND 5)` 제약이 남아 있어 6~10위 INSERT 실패 | `008` 마이그레이션에 `DROP/ADD CONSTRAINT` 추가 (1~10 으로 확장) |
| 2026-04-03 | 명예의 전당 카테고리 탭이 스크롤 시 가려짐 (2차) | `.view`의 `flex + overflow-y: auto`에서 `sticky`가 동작하지 않는 구조적 문제 | `hof-view` 클래스 추가 → `.view` overflow 제거, `.hof-content`를 스크롤 컨테이너로 변경 |
| 2026-07-24 | Windows에서 `npm run build:ait` 시 `'node_modules'은(는) ... 아닙니다` | `build:ait` 스크립트가 `node_modules/.bin/ait build` 슬래시 경로로 작성되어 Windows 기본 셸(`cmd.exe`)이 `/`를 스위치로 오인식 | `build:ait` 스크립트를 `ait build`로 변경 (npm이 `node_modules/.bin`을 PATH에 자동 추가하므로 OS 무관하게 동작) |
| 2026-09-10 | `ait migrate v3` 실행 중 `npm install` 자동 실행 단계 실패 (`ETARGET`) | 마이그레이션 도구가 넣어준 `@apps-in-toss/devtools@^3.4.0`이 실제로 존재하지 않는 버전이었음 | `package.json`에서 devtools 버전을 실제 존재하는 최신판 `^3.2.0`으로 고쳐 쓰고 `npm install` 재실행 |

---

## 📁 파일 구조

```
Today-RPS/
├── index.html
├── vite.config.js
├── package.json                   v0.14.0 기능은 앱 안 APP_VERSION
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
├── data/
│   └── changelogs.json            ✅ 앱 안 최근 업데이트 표시용
└── supabase/
    └── migrations/
        ├── 001_schema.sql         ✅ 적용 완료
        ├── 002_triggers.sql       ✅ 적용 완료
        ├── 003_rls_policies.sql   ✅ 적용 완료
        ├── 004_fix_trigger_security.sql            ✅ 적용 완료
        ├── 005_recreate_functions_security_definer.sql ✅ 적용 완료
        ├── 006_fix_foreach_datatype.sql            ✅ 적용 완료
        ├── 007_play_streak_min_threshold.sql       ✅ 적용 완료
        ├── 008_hall_of_fame_top10.sql              ✅ 적용 완료
        └── 009_growth_features.sql                 ⬜ 대시보드에서 실행
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

```5  명예의 전당 TOP 10
v0.14.0 성장 묶음 — 이름, 공유, 오류 화면, 배지, 이달 순위
v0.15.0 토스 SDK 3.4.0 업그레이드 (앱 기능 변화 없음, 엔진만 교체)
v0.16.0 재미·재방문 개선 — 메인 정리, 출석 도장판, 내일 예고, 다음 목표, 새 배지
v1.0.0  스토어 출시 (JWT·검수는 코드 밖 작업
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

성장·콘텐츠 백로그(공유 카드, 손 버릇 리포트, 시즌 랭킹 등)는 [GROWTH_AND_CONTENT.md](GROWTH_AND_CONTENT.md)를 본다.
