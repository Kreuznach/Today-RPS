# 하루 한 번 가위바위보 (Today RPS)
> Toss In-App 제작 기획서

> **현황 주석 (2026-08-20):** 아래 본문은 초기 기획안이다. 구현과 달라진 핵심만 적는다.
> - 명예의 전당: 기획 TOP 5 → 구현 **TOP 10** ([008_hall_of_fame_top10.sql](../supabase/migrations/008_hall_of_fame_top10.sql))
> - 연속 플레이 집계 하한: 기획 20일 → 구현 **10일** ([007_play_streak_min_threshold.sql](../supabase/migrations/007_play_streak_min_threshold.sql))
> - 날짜 기준: 기획 ‘서버 시각’ → 구현 **KST(Asia/Seoul) 자정**
> - v0.14.0: 이름 편집, 배지, 이달 전당, 오늘 통계 ([009_growth_features.sql](../supabase/migrations/009_growth_features.sql))
> - v0.16.0: 출석 도장판, 내일 예고, 다음 목표 한 줄, 새 배지 (DB 변경 없음, [FUN_AND_RETURN_GUIDE.md](FUN_AND_RETURN_GUIDE.md))
> - 성장·확장 아이디어는 [GROWTH_AND_CONTENT.md](GROWTH_AND_CONTENT.md)를 본다.

---

## 1. 개발 환경

| 항목 | 내용 |
|---|---|
| 에디터 | VSCode |
| AI Agent | Claude Sonnet 4.6 |
| 백엔드/DB | Supabase |
| 플랫폼 | Toss In-App (WebView 기반) |

---

## 2. 게임 규칙

- 하루 **1회** 가위바위보 플레이 가능
- 결과가 마음에 들지 않을 경우, **광고 시청 후 1회 한정 재도전** 가능
- 광고 시청 후의 결과는 **강제 적용** (추가 재도전 불가)
- 초기화 기준: **매일 자정(00:00, KST) 서버 기준** 리셋

> 날짜 확인은 반드시 **서버(Supabase) 기준**으로 처리해 클라이언트 조작을 막는다.

---

## 3. 명예의 전당

- 카테고리별 **TOP 10**만 노출 (기획 초안은 TOP 5)
- 동일 기록은 **먼저 달성한 사용자 우선**
- 랭킹은 매 플레이 시 실시간 조회하지 않고 **캐싱된 데이터 조회** (Supabase DB Trigger 활용)

### 카테고리

| 카테고리 | 설명 |
|---|---|
| 🏅 연속 승리 | 연속으로 이긴 최다 횟수 |
| 💀 연속 패배 | 연속으로 진 최다 횟수 |
| 🤝 연속 무승부 | 연속으로 비긴 최다 횟수 |
| 📅 연속 플레이 | 10일 이상 연속 출석 플레이 (기획 초안은 20일) |
| 🏆 총 승리 횟수 | 누적 승리 수 기준 (장기 유저 유도) |
| 🎲 광고 역전승 | 재도전 후 승리한 누적 횟수 |

---

## 4. 화면 구성

```
[메인 화면]
 └─ 오늘의 게임 시작 버튼
 └─ 남은 기회 표시 (1회 / 재도전 가능 여부)
 └─ 명예의 전당 바로가기

[게임 화면]
 └─ 가위 / 바위 / 보 선택
 └─ 결과 애니메이션

[결과 화면]
 └─ 승리 / 패배 / 무승부 표시
 └─ 재도전 광고 버튼 (당일 미사용 시에만 노출)
 └─ 내 연속 기록 업데이트 표시

[명예의 전당]
 └─ 카테고리 탭 전환
 └─ TOP 10 리스트 (닉네임, 기록, 달성일)

[내 기록]
 └─ 나의 현재 연속 기록
 └─ 누적 통계 (총 플레이 / 승 / 패 / 무)
 └─ 이름 바꾸기, 배지, 손 버릇, 이번 주 요약
```

---

## 5. 데이터 설계 (Supabase)

> 최소한의 데이터 이동을 위해 집계는 Trigger로 처리하고, 랭킹은 캐싱된 테이블에서만 조회합니다.

### `users` — 유저 기본 정보

```sql
user_id        TEXT PRIMARY KEY  -- 토스 유저 식별자
last_played_at DATE              -- 마지막 플레이 일자 (서버 기준)
has_used_retry BOOLEAN DEFAULT FALSE  -- 당일 재도전 사용 여부
created_at     TIMESTAMPTZ DEFAULT now()
```

### `game_records` — 플레이 기록

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     TEXT REFERENCES users(user_id)
played_at   DATE              -- 플레이 일자
result      TEXT              -- 'win' | 'lose' | 'draw'
is_retry    BOOLEAN DEFAULT FALSE  -- 재도전 결과 여부
created_at  TIMESTAMPTZ DEFAULT now()
```

### `streaks` — 연속 기록 집계 (명예의 전당용)

```sql
user_id       TEXT PRIMARY KEY REFERENCES users(user_id)
win_streak    INT DEFAULT 0
lose_streak   INT DEFAULT 0
draw_streak   INT DEFAULT 0
play_streak   INT DEFAULT 0   -- 연속 출석일
total_wins    INT DEFAULT 0   -- 누적 승리
retry_wins    INT DEFAULT 0   -- 광고 역전승 횟수
updated_at    TIMESTAMPTZ DEFAULT now()
```

### `hall_of_fame` — 캐싱된 TOP 10 랭킹

```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
category    TEXT              -- 'win_streak' | 'lose_streak' | 'draw_streak' | 'play_streak' | 'total_wins' | 'retry_wins'
rank        INT               -- 1~10
user_id     TEXT
record      INT               -- 기록값
achieved_at TIMESTAMPTZ       -- 최초 달성 시각 (동점자 처리)
```

### DB Trigger 흐름

```
game_records INSERT
  → streaks 테이블 업데이트 (연속 기록 갱신)
    → hall_of_fame 테이블 갱신 (TOP 10 변동 시에만)
```

---

## 6. 최적화 전략

| 항목 | 전략 |
|---|---|
| 랭킹 조회 | 실시간 집계 대신 `hall_of_fame` 캐싱 테이블 조회 |
| 기록 갱신 | DB Trigger로 서버 사이드 자동 처리 |
| 날짜 검증 | 클라이언트가 아닌 Supabase 서버 시각 기준 |
| 광고 검증 | 광고 시청 완료 여부 서버에서 검증 후 재도전 허용 |
| 불필요한 조회 제거 | 로그인 시 `users` 1건, 플레이 시 `game_records` 1건 INSERT만 발생 |

---

## 7. 어뷰징 방지

- 날짜 초기화는 서버 자정 기준 처리 (클라이언트 시간 조작 불가)
- 광고 시청 완료 신호는 **Toss 광고 SDK → 서버 검증 → 재도전 허용** 순서로 처리
- `has_used_retry`는 자정마다 Supabase Scheduled Function으로 일괄 초기화

---

## 8. 추가 고려사항

- **Toss UI 가이드라인** 사전 확인 및 준수 필요
- **광고 SDK 연동** 방식 Toss 정책 확인 (외부 광고 vs Toss 자체 광고)
- **개인정보**: 사용자 식별자는 토스에서 제공하는 익명 ID 활용을 권장한다.
- **접근성**: 가위/바위/보 선택 시 텍스트와 이미지를 함께 표시한다.