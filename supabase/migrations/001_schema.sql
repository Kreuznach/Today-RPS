-- =============================================================
-- Today RPS - 초기 스키마
-- =============================================================

-- ─────────────────────────────────────────
-- 1. users — 유저 기본 정보
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  user_id        TEXT PRIMARY KEY,
  -- Toss SDK는 닉네임을 직접 제공하지 않으므로 앱에서 익명 별명을 자동 생성해 저장합니다.
  nickname       TEXT DEFAULT '익명',
  last_played_at DATE,
  -- has_used_retry 는 game_records 에서 당일 is_retry=true 레코드 존재 여부로
  -- 판단하므로 컬럼 불필요. Cron 기반 전체 테이블 UPDATE도 없어집니다.
  created_at     TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 2. game_records — 플레이 기록
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS game_records (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  played_at   DATE    NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Seoul')::DATE,
  user_choice TEXT    NOT NULL CHECK (user_choice IN ('rock','scissors','paper')),
  comp_choice TEXT    NOT NULL CHECK (comp_choice IN ('rock','scissors','paper')),
  result      TEXT    NOT NULL CHECK (result IN ('win','lose','draw')),
  is_retry    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_game_records_user_played
  ON game_records (user_id, played_at DESC);

-- ─────────────────────────────────────────
-- 3. streaks — 연속 기록 집계
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS streaks (
  user_id          TEXT PRIMARY KEY REFERENCES users(user_id) ON DELETE CASCADE,
  win_streak       INT DEFAULT 0,
  max_win_streak   INT DEFAULT 0,
  lose_streak      INT DEFAULT 0,
  max_lose_streak  INT DEFAULT 0,
  draw_streak      INT DEFAULT 0,
  max_draw_streak  INT DEFAULT 0,
  play_streak      INT DEFAULT 0,   -- 연속 출석일
  max_play_streak  INT DEFAULT 0,
  total_wins       INT DEFAULT 0,
  total_losses     INT DEFAULT 0,
  total_draws      INT DEFAULT 0,
  total_plays      INT DEFAULT 0,
  retry_wins       INT DEFAULT 0,
  last_play_date   DATE,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

-- ─────────────────────────────────────────
-- 4. hall_of_fame — 캐싱된 TOP 5 랭킹
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hall_of_fame (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category    TEXT NOT NULL CHECK (
                category IN (
                  'win_streak','lose_streak','draw_streak',
                  'play_streak','total_wins','retry_wins'
                )
              ),
  rank        INT  NOT NULL CHECK (rank BETWEEN 1 AND 5),
  user_id     TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  record      INT  NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category, rank)
);

CREATE INDEX IF NOT EXISTS idx_hof_category_rank
  ON hall_of_fame (category, rank);
