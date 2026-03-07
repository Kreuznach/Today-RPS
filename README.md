# 하루 한 번 가위바위보 (Today RPS)

> Toss In-App WebView 기반 일일 가위바위보 게임  
> **스택: Vite + React 18 + Supabase** | 빌드 결과물: `today-rps.ait`

---

## .ait 파일이란?

`.ait` = Toss In-App Builder에 업로드하는 **웹 번들 ZIP 아카이브**  
내부 구조: `index.html` + CSS + JS 정적 파일 (WebView에서 실행)  
React Native가 아닌 **웹 기술(React Web)**을 사용합니다.

---

## 프로젝트 구조

```
Today-RPS/
├── index.html                    # Vite 진입점
├── vite.config.js
├── package.json
├── .env.example                  # 환경변수 템플릿
├── scripts/
│   └── build-ait.cjs             # dist/ → today-rps.ait 생성
├── src/
│   ├── main.jsx                  # React 마운트
│   ├── App.jsx                   # 뷰 라우터
│   ├── index.css                 # 전역 스타일 (Toss-style)
│   ├── context/
│   │   └── AppContext.jsx        # 전역 상태 (뷰, 유저, Toast)
│   ├── lib/
│   │   ├── config.js             # 설정, 유틸, 상수
│   │   ├── supabase.js           # DB 액세스 레이어
│   │   └── game.js               # 게임 순수 로직
│   ├── components/
│   │   ├── TopBar.jsx
│   │   └── Toast.jsx
│   └── views/
│       ├── MainView.jsx          # 메인 화면
│       ├── GameView.jsx          # 게임 화면
│       ├── ResultView.jsx        # 결과 화면
│       ├── HallOfFameView.jsx    # 명예의 전당
│       └── MyRecordsView.jsx     # 내 기록
└── supabase/migrations/
    ├── 001_schema.sql            # 테이블 정의
    └── 002_triggers.sql          # 트리거, RLS, 자정 초기화
```

---

## 시작하기

### 1. Supabase 설정

```sql
-- Supabase SQL Editor에서 순서대로 실행
\i supabase/migrations/001_schema.sql
\i supabase/migrations/002_triggers.sql

-- 자정 초기화 Cron (pg_cron 활성화 후)
SELECT cron.schedule(
  'daily-retry-reset',
  '0 15 * * *',   -- UTC 15:00 = KST 00:00
  'SELECT fn_daily_reset()'
);
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
# .env.local 편집
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY
```

### 3. 의존성 설치 & 개발 서버

```bash
npm install
npm run dev       # → http://localhost:5173
```

### 4. .ait 빌드 (Toss 업로드용)

```bash
npm run build:ait
# → today-rps.ait 생성
```

Toss In-App Builder 콘솔에서 `today-rps.ait` 파일을 업로드하세요.

---

## 화면 구성

| 화면 | 설명 |
|---|---|
| **메인** | 오늘 날짜, 남은 기회(도트), 게임 시작 버튼, 오늘 결과 미리보기 |
| **게임** | 가위/바위/보 선택, VS 애니메이션, 카운트다운 바 |
| **결과** | 승/패/무 표시, 컨페티 효과, 연속 기록 업데이트, 광고 재도전 버튼 |
| **명예의 전당** | 카테고리 6종 탭, TOP 5 랭킹 |
| **내 기록** | 누적 통계, 승률 바, 연속 기록 최고값 |

---

## 어뷰징 방지

| 항목 | 내용 |
|---|---|
| 날짜 조작 | Supabase 서버 KST 기준 날짜 사용 |
| 광고 우회 | `watchAd()` → Toss SDK 서버 검증 |
| 자정 초기화 | `fn_daily_reset()` Cron (UTC 15:00) |
| 데이터 보안 | RLS 정책으로 자신의 데이터만 접근 |

---

## Toss SDK 연동 (프로덕션)

`src/lib/config.js`의 주석 처리된 코드를 활성화합니다:

```js
export function getTossUserId() {
  return window.TossInApp?.getUserId() ?? _guestId();
}

export async function watchAd() {
  return window.TossInApp?.showRewardedAd('retry_chance');
}
```
