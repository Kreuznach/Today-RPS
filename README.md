# 하루 한 번 가위바위보 (Today RPS)

> Toss 미니앱(웹뷰)에서 돌아가는 **하루 한 판** 가위바위보입니다.  
> **쓰는 도구: Vite + React 18 + Supabase** | 올리는 파일: `today-rps.ait`  
> **지금 버전: v0.14.0** (이름 바꾸기, 배지, 이달 순위)

쉬운 규칙: 하루에 한 번만 냅니다. 결과가 아쉬우면 광고를 보고 **딱 한 번** 더 낼 수 있습니다.

---

## .ait 파일이란?

`.ait` = Toss In-App Builder에 업로드하는 **웹 번들 ZIP 아카이브**  
내부 구조: `index.html` + CSS + JS 정적 파일 (WebView에서 실행)  
React Native가 아닌 **웹 기술(React Web)**을 사용한다.

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
    ├── 001_schema.sql … 008_*.sql   # 기본 테이블과 순위
    └── 009_growth_features.sql      # 배지, 이달 순위 (SQL 편집기에서 실행)
```

---

## 시작하기

### 1. Supabase 설정

```text
Supabase 대시보드 → SQL Editor
001 부터 009 까지 번호 순서대로 붙여 넣고 Run 합니다.
009 를 빼먹으면 이름 바꾸기·배지·이달 순위가 저장되지 않습니다.
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

Toss In-App Builder 콘솔에서 `today-rps.ait` 파일을 업로드한다.

#### ⚠️ Windows에서 `'node_modules'은(는) ... 아닙니다` 오류가 날 때

```
> today-rps@1.0.0 build:ait
> node_modules/.bin/ait build

'node_modules'은(는) 내부 또는 외부 명령, 실행할 수 있는 프로그램, 또는
배치 파일이 아닙니다.
```

- **원인**: `package.json`의 `build:ait` 스크립트가 `node_modules/.bin/ait build`처럼 **슬래시(`/`) 경로**로 작성되어 있었습니다. npm 스크립트는 Windows에서 기본적으로 `cmd.exe`로 실행되는데, `cmd.exe`는 `/`를 스위치 구분자로 해석해 `node_modules`를 실행 파일명으로, `.bin/ait`를 스위치로 잘못 인식합니다. (macOS/Linux의 `sh`에서는 문제없이 동작하던 스크립트라 OS 차이로 드러난 문제입니다.)
- **해결**: `build:ait` 스크립트를 경로 없이 `ait build`로 변경했습니다. npm은 스크립트 실행 시 `node_modules/.bin`을 `PATH`에 자동으로 추가하므로 OS와 무관하게 동작합니다.

```jsonc
// package.json
"scripts": {
  "build:ait": "ait build"
}
```

수정 후 다시 `npm run build:ait`를 실행하면 정상적으로 `today-rps.ait`가 생성됩니다 (빌드 로그에 `AIT build completed (today-rps.ait)`와 `deploymentId` 값이 출력되면 성공입니다).

---

## 화면 구성

| 화면 | 설명 |
|---|---|
| **메인** | 오늘 날짜, 남은 기회(칩), 게임 시작 버튼, 오늘 결과 미리보기 |
| **게임** | 가위/바위/보 선택, VS 애니메이션, 카운트다운 바 |
| **결과** | 승/패/무 표시, 컨페티 효과, 연속 기록 업데이트, 광고 재도전 버튼 |
| **명예의 전당** | 카테고리 6종 탭, TOP 10 랭킹 |
| **내 기록** | 누적 통계, 승률 바, 연속 기록 최고값 |

---
, 요일 옷, 출석 D-day |
| **게임** | 가위/바위/보 선택 (글자와 그림 같이) |
| **결과** | 승/패/무, 공유 카드, 광고 재도전 |
| **명예의 전당** | 통산 / 이달, TOP 10, 내 순위 |
| **내 기록** | 통계, 이름, 배지, 손 버릇
| 날짜 조작 | Supabase 서버 KST 기준 날짜 사용 |
| 광고 우회 | `watchAd()` → Toss SDK 서버 검증 |
| 자정 초기화 | `fn_daily_reset()` Cron (UTC 15:00) |
| 데이터 보안 | RLS 정책으로 자신의 데이터만 접근 |

---

## Toss SDK 연동 (프로덕션)

`src/lib/config.js`의 주석 처리된 코드를 활성화한다.

```js
export function getTossUserId() {
  return window.TossInApp?.getUserId() ?? _guestId();
}

export async function watchAd() {
  return window.TossInApp?.showRewardedAd('retry_chance');
}
```
