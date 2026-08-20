-- =============================================================
-- Today RPS - 성장 기능 (닉네임 제한, 배지, 오늘 집계, 이달 명예의 전당)
--
-- [이 파일을 쓰는 이유]
--   하루 1판 규칙은 그대로 두고, 돌아올 이유와 보여줄 기록만 늘립니다.
--
-- [하는 일]
--   1. 닉네임은 한국 시간 기준 하루에 1번만 바꿀 수 있게 합니다.
--   2. 응원 색(team_color)을 저장합니다.
--   3. 배지, 오늘 전역 통계, 이달(시즌) 랭킹 테이블을 만듭니다.
--   4. 게임을 저장할 때 위 기록을 같이 갱신합니다.
--   5. TOP 10 밖에서도 내 순위를 묻는 함수를 만듭니다.
--
-- [실행 방법]
--   Supabase 대시보드 → SQL Editor 에 이 파일 전체를 붙여 넣고 Run 합니다.
-- =============================================================

-- ─────────────────────────────────────────
-- 1. users 컬럼 추가
-- ─────────────────────────────────────────
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS nickname_updated_on DATE;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS team_color TEXT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_team_color_check'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_team_color_check
      CHECK (team_color IS NULL OR team_color IN ('blue','red','yellow','green'));
  END IF;
END $$;

-- 닉네임 하루 1회 제한
CREATE OR REPLACE FUNCTION fn_guard_nickname()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_today DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
BEGIN
  IF NEW.nickname IS DISTINCT FROM OLD.nickname THEN
    IF OLD.nickname_updated_on = v_today THEN
      RAISE EXCEPTION 'NICK_LIMIT' USING ERRCODE = 'P0001';
    END IF;
    NEW.nickname_updated_on := v_today;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_guard_nickname ON users;
CREATE TRIGGER trg_guard_nickname
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION fn_guard_nickname();

-- ─────────────────────────────────────────
-- 2. 배지
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_badges (
  user_id    TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  badge_key  TEXT NOT NULL,
  earned_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_key)
);

CREATE INDEX IF NOT EXISTS idx_user_badges_user
  ON user_badges (user_id, earned_at DESC);

-- ─────────────────────────────────────────
-- 3. 오늘 전역 통계 (자정 캐시 한 줄)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS daily_stats (
  stat_date        DATE PRIMARY KEY,
  total_plays      INT NOT NULL DEFAULT 0,
  wins             INT NOT NULL DEFAULT 0,
  losses           INT NOT NULL DEFAULT 0,
  draws            INT NOT NULL DEFAULT 0,
  team_blue_wins   INT NOT NULL DEFAULT 0,
  team_red_wins    INT NOT NULL DEFAULT 0,
  team_yellow_wins INT NOT NULL DEFAULT 0,
  team_green_wins  INT NOT NULL DEFAULT 0,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─────────────────────────────────────────
-- 4. 이달(시즌) 연속 기록 + 명예의 전당
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS season_streaks (
  user_id          TEXT NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
  season           TEXT NOT NULL, -- 'YYYY-MM' (KST)
  win_streak       INT NOT NULL DEFAULT 0,
  max_win_streak   INT NOT NULL DEFAULT 0,
  lose_streak      INT NOT NULL DEFAULT 0,
  max_lose_streak  INT NOT NULL DEFAULT 0,
  draw_streak      INT NOT NULL DEFAULT 0,
  max_draw_streak  INT NOT NULL DEFAULT 0,
  play_streak      INT NOT NULL DEFAULT 0,
  max_play_streak  INT NOT NULL DEFAULT 0,
  total_wins       INT NOT NULL DEFAULT 0,
  total_losses     INT NOT NULL DEFAULT 0,
  total_draws      INT NOT NULL DEFAULT 0,
  total_plays      INT NOT NULL DEFAULT 0,
  retry_wins       INT NOT NULL DEFAULT 0,
  last_play_date   DATE,
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, season)
);

CREATE TABLE IF NOT EXISTS hall_of_fame_season (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season      TEXT NOT NULL,
  category    TEXT NOT NULL CHECK (
                category IN (
                  'win_streak','lose_streak','draw_streak',
                  'play_streak','total_wins','retry_wins'
                )
              ),
  rank        INT  NOT NULL CHECK (rank BETWEEN 1 AND 10),
  user_id     TEXT REFERENCES users(user_id) ON DELETE CASCADE,
  record      INT  NOT NULL,
  achieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (season, category, rank)
);

CREATE INDEX IF NOT EXISTS idx_hof_season_cat_rank
  ON hall_of_fame_season (season, category, rank);

-- ─────────────────────────────────────────
-- 5. 권한 (기존 anon 패턴과 같음)
-- ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON user_badges         TO anon;
GRANT SELECT                         ON daily_stats         TO anon;
GRANT SELECT                         ON season_streaks      TO anon;
GRANT SELECT                         ON hall_of_fame_season TO anon;

ALTER TABLE user_badges         ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats         ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_streaks      ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame_season ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_badges: anon full access" ON user_badges;
CREATE POLICY "user_badges: anon full access" ON user_badges
  FOR ALL TO anon USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "daily_stats: anon read" ON daily_stats;
CREATE POLICY "daily_stats: anon read" ON daily_stats
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "season_streaks: anon read" ON season_streaks;
CREATE POLICY "season_streaks: anon read" ON season_streaks
  FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "hof_season: anon read" ON hall_of_fame_season;
CREATE POLICY "hof_season: anon read" ON hall_of_fame_season
  FOR SELECT TO anon USING (true);

-- ─────────────────────────────────────────
-- 6. 배지 지급 도우미
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_award_badge(p_user_id TEXT, p_badge TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_badges (user_id, badge_key)
  VALUES (p_user_id, p_badge)
  ON CONFLICT (user_id, badge_key) DO NOTHING;
END;
$$;

-- ─────────────────────────────────────────
-- 7. 이달 명예의 전당 갱신
--    시즌은 한 달마다 리셋되므로 출석 하한을 3일로 둡니다.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_refresh_hall_of_fame_season(p_season TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cats TEXT[] := ARRAY[
    'win_streak', 'lose_streak', 'draw_streak',
    'play_streak', 'total_wins', 'retry_wins'
  ];
  v_cols TEXT[] := ARRAY[
    'max_win_streak', 'max_lose_streak', 'max_draw_streak',
    'max_play_streak', 'total_wins',     'retry_wins'
  ];
  v_mins INT[]  := ARRAY[0, 0, 0, 2, 0, 0];
  i      INT;
  v_cat  TEXT;
  v_col  TEXT;
  v_min  INT;
  v_rank INT;
  v_rec  RECORD;
BEGIN
  IF p_season IS NULL OR length(p_season) < 7 THEN
    RETURN;
  END IF;

  FOR i IN 1..6 LOOP
    v_cat  := v_cats[i];
    v_col  := v_cols[i];
    v_min  := v_mins[i];
    v_rank := 1;

    FOR v_rec IN EXECUTE format(
      'SELECT user_id, %I AS record, updated_at
       FROM season_streaks
       WHERE season = %L AND %I > %s
       ORDER BY %I DESC, updated_at ASC
       LIMIT 10',
      v_col, p_season, v_col, v_min, v_col
    )
    LOOP
      INSERT INTO hall_of_fame_season (season, category, rank, user_id, record, achieved_at)
      VALUES (p_season, v_cat, v_rank, v_rec.user_id, v_rec.record, v_rec.updated_at)
      ON CONFLICT (season, category, rank)
      DO UPDATE SET
        user_id     = EXCLUDED.user_id,
        record      = EXCLUDED.record,
        achieved_at = EXCLUDED.achieved_at;
      v_rank := v_rank + 1;
    END LOOP;

    DELETE FROM hall_of_fame_season
    WHERE season = p_season AND category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- 8. 내 순위 (TOP 10 밖도 보여 줌)
--    p_season 이 NULL 이면 통산, 있으면 이달
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_my_rank(
  p_user_id TEXT,
  p_category TEXT,
  p_season TEXT DEFAULT NULL
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_col    TEXT;
  v_min    INT := 0;
  v_record INT;
  v_rank   BIGINT;
  v_sql    TEXT;
BEGIN
  v_col := CASE p_category
    WHEN 'win_streak'  THEN 'max_win_streak'
    WHEN 'lose_streak' THEN 'max_lose_streak'
    WHEN 'draw_streak' THEN 'max_draw_streak'
    WHEN 'play_streak' THEN 'max_play_streak'
    WHEN 'total_wins'  THEN 'total_wins'
    WHEN 'retry_wins'  THEN 'retry_wins'
    ELSE NULL
  END;

  IF v_col IS NULL THEN
    RETURN json_build_object('rank', NULL, 'record', 0, 'min_needed', 0);
  END IF;

  IF p_category = 'play_streak' THEN
    v_min := CASE WHEN p_season IS NULL THEN 9 ELSE 2 END;
  END IF;

  IF p_season IS NULL THEN
    EXECUTE format('SELECT %I FROM streaks WHERE user_id = $1', v_col)
      INTO v_record USING p_user_id;
  ELSE
    EXECUTE format(
      'SELECT %I FROM season_streaks WHERE user_id = $1 AND season = $2',
      v_col
    ) INTO v_record USING p_user_id, p_season;
  END IF;

  v_record := COALESCE(v_record, 0);

  IF v_record <= v_min THEN
    RETURN json_build_object(
      'rank', NULL,
      'record', v_record,
      'min_needed', v_min + 1
    );
  END IF;

  IF p_season IS NULL THEN
    v_sql := format(
      'SELECT COUNT(*) + 1 FROM streaks
       WHERE %I > $1 OR (%I = $1 AND updated_at < (
         SELECT updated_at FROM streaks WHERE user_id = $2
       ))',
      v_col, v_col
    );
    EXECUTE v_sql INTO v_rank USING v_record, p_user_id;
  ELSE
    v_sql := format(
      'SELECT COUNT(*) + 1 FROM season_streaks
       WHERE season = $3 AND (
         %I > $1 OR (%I = $1 AND updated_at < (
           SELECT updated_at FROM season_streaks
           WHERE user_id = $2 AND season = $3
         ))
       )',
      v_col, v_col
    );
    EXECUTE v_sql INTO v_rank USING v_record, p_user_id, p_season;
  END IF;

  RETURN json_build_object(
    'rank', v_rank,
    'record', v_record,
    'min_needed', v_min + 1
  );
END;
$$;

GRANT EXECUTE ON FUNCTION fn_my_rank(TEXT, TEXT, TEXT) TO anon;

-- ─────────────────────────────────────────
-- 9. 게임 저장 시 집계 (최신 트리거)
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_streak  streaks%ROWTYPE;
  v_today   DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
  v_season  TEXT := to_char((now() AT TIME ZONE 'Asia/Seoul'), 'YYYY-MM');
  v_team    TEXT;
  v_ss      season_streaks%ROWTYPE;
BEGIN
  INSERT INTO streaks (user_id, last_play_date)
  VALUES (NEW.user_id, v_today)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak FROM streaks WHERE user_id = NEW.user_id;

  IF v_streak.last_play_date = v_today - 1 THEN
    v_streak.play_streak := v_streak.play_streak + 1;
  ELSIF v_streak.last_play_date = v_today THEN
    NULL;
  ELSE
    v_streak.play_streak := 1;
  END IF;
  v_streak.max_play_streak := GREATEST(v_streak.max_play_streak, v_streak.play_streak);
  v_streak.total_plays := v_streak.total_plays + 1;

  IF NEW.result = 'win' THEN
    v_streak.win_streak  := v_streak.win_streak + 1;
    v_streak.lose_streak := 0;
    v_streak.draw_streak := 0;
    v_streak.total_wins  := v_streak.total_wins + 1;
    v_streak.max_win_streak := GREATEST(v_streak.max_win_streak, v_streak.win_streak);
    IF NEW.is_retry THEN
      v_streak.retry_wins := v_streak.retry_wins + 1;
    END IF;
  ELSIF NEW.result = 'lose' THEN
    v_streak.win_streak   := 0;
    v_streak.lose_streak  := v_streak.lose_streak + 1;
    v_streak.draw_streak  := 0;
    v_streak.total_losses := v_streak.total_losses + 1;
    v_streak.max_lose_streak := GREATEST(v_streak.max_lose_streak, v_streak.lose_streak);
  ELSIF NEW.result = 'draw' THEN
    v_streak.win_streak  := 0;
    v_streak.lose_streak := 0;
    v_streak.draw_streak := v_streak.draw_streak + 1;
    v_streak.total_draws := v_streak.total_draws + 1;
    v_streak.max_draw_streak := GREATEST(v_streak.max_draw_streak, v_streak.draw_streak);
  END IF;

  v_streak.last_play_date := v_today;
  v_streak.updated_at     := now();

  UPDATE streaks
  SET
    win_streak       = v_streak.win_streak,
    max_win_streak   = v_streak.max_win_streak,
    lose_streak      = v_streak.lose_streak,
    max_lose_streak  = v_streak.max_lose_streak,
    draw_streak      = v_streak.draw_streak,
    max_draw_streak  = v_streak.max_draw_streak,
    play_streak      = v_streak.play_streak,
    max_play_streak  = v_streak.max_play_streak,
    total_wins       = v_streak.total_wins,
    total_losses     = v_streak.total_losses,
    total_draws      = v_streak.total_draws,
    total_plays      = v_streak.total_plays,
    retry_wins       = v_streak.retry_wins,
    last_play_date   = v_streak.last_play_date,
    updated_at       = v_streak.updated_at
  WHERE user_id = NEW.user_id;

  -- 이달 기록
  INSERT INTO season_streaks (user_id, season, last_play_date)
  VALUES (NEW.user_id, v_season, v_today)
  ON CONFLICT (user_id, season) DO NOTHING;

  SELECT * INTO v_ss FROM season_streaks
  WHERE user_id = NEW.user_id AND season = v_season;

  IF v_ss.last_play_date = v_today - 1 THEN
    v_ss.play_streak := v_ss.play_streak + 1;
  ELSIF v_ss.last_play_date = v_today THEN
    NULL;
  ELSE
    v_ss.play_streak := 1;
  END IF;
  v_ss.max_play_streak := GREATEST(v_ss.max_play_streak, v_ss.play_streak);
  v_ss.total_plays := v_ss.total_plays + 1;

  IF NEW.result = 'win' THEN
    v_ss.win_streak  := v_ss.win_streak + 1;
    v_ss.lose_streak := 0;
    v_ss.draw_streak := 0;
    v_ss.total_wins  := v_ss.total_wins + 1;
    v_ss.max_win_streak := GREATEST(v_ss.max_win_streak, v_ss.win_streak);
    IF NEW.is_retry THEN
      v_ss.retry_wins := v_ss.retry_wins + 1;
    END IF;
  ELSIF NEW.result = 'lose' THEN
    v_ss.win_streak   := 0;
    v_ss.lose_streak  := v_ss.lose_streak + 1;
    v_ss.draw_streak  := 0;
    v_ss.total_losses := v_ss.total_losses + 1;
    v_ss.max_lose_streak := GREATEST(v_ss.max_lose_streak, v_ss.lose_streak);
  ELSIF NEW.result = 'draw' THEN
    v_ss.win_streak  := 0;
    v_ss.lose_streak := 0;
    v_ss.draw_streak := v_ss.draw_streak + 1;
    v_ss.total_draws := v_ss.total_draws + 1;
    v_ss.max_draw_streak := GREATEST(v_ss.max_draw_streak, v_ss.draw_streak);
  END IF;

  v_ss.last_play_date := v_today;
  v_ss.updated_at     := now();

  UPDATE season_streaks
  SET
    win_streak       = v_ss.win_streak,
    max_win_streak   = v_ss.max_win_streak,
    lose_streak      = v_ss.lose_streak,
    max_lose_streak  = v_ss.max_lose_streak,
    draw_streak      = v_ss.draw_streak,
    max_draw_streak  = v_ss.max_draw_streak,
    play_streak      = v_ss.play_streak,
    max_play_streak  = v_ss.max_play_streak,
    total_wins       = v_ss.total_wins,
    total_losses     = v_ss.total_losses,
    total_draws      = v_ss.total_draws,
    total_plays      = v_ss.total_plays,
    retry_wins       = v_ss.retry_wins,
    last_play_date   = v_ss.last_play_date,
    updated_at       = v_ss.updated_at
  WHERE user_id = NEW.user_id AND season = v_season;

  -- 오늘 세상 집계
  SELECT team_color INTO v_team FROM users WHERE user_id = NEW.user_id;

  INSERT INTO daily_stats (
    stat_date, total_plays, wins, losses, draws,
    team_blue_wins, team_red_wins, team_yellow_wins, team_green_wins
  )
  VALUES (
    v_today, 1,
    CASE WHEN NEW.result = 'win'  THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'lose' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'draw' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'win' AND v_team = 'blue'   THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'win' AND v_team = 'red'    THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'win' AND v_team = 'yellow' THEN 1 ELSE 0 END,
    CASE WHEN NEW.result = 'win' AND v_team = 'green'  THEN 1 ELSE 0 END
  )
  ON CONFLICT (stat_date) DO UPDATE SET
    total_plays      = daily_stats.total_plays + 1,
    wins             = daily_stats.wins    + CASE WHEN NEW.result = 'win'  THEN 1 ELSE 0 END,
    losses           = daily_stats.losses  + CASE WHEN NEW.result = 'lose' THEN 1 ELSE 0 END,
    draws            = daily_stats.draws   + CASE WHEN NEW.result = 'draw' THEN 1 ELSE 0 END,
    team_blue_wins   = daily_stats.team_blue_wins   + CASE WHEN NEW.result = 'win' AND v_team = 'blue'   THEN 1 ELSE 0 END,
    team_red_wins    = daily_stats.team_red_wins    + CASE WHEN NEW.result = 'win' AND v_team = 'red'    THEN 1 ELSE 0 END,
    team_yellow_wins = daily_stats.team_yellow_wins + CASE WHEN NEW.result = 'win' AND v_team = 'yellow' THEN 1 ELSE 0 END,
    team_green_wins  = daily_stats.team_green_wins  + CASE WHEN NEW.result = 'win' AND v_team = 'green'  THEN 1 ELSE 0 END,
    updated_at       = now();

  -- 배지 (판 수를 늘리지 않고 목표만 늘림)
  PERFORM fn_award_badge(NEW.user_id, 'first_play');
  IF NEW.result = 'win'  THEN PERFORM fn_award_badge(NEW.user_id, 'first_win');  END IF;
  IF NEW.result = 'lose' THEN PERFORM fn_award_badge(NEW.user_id, 'first_lose'); END IF;
  IF NEW.result = 'draw' THEN PERFORM fn_award_badge(NEW.user_id, 'first_draw'); END IF;
  IF NEW.is_retry AND NEW.result = 'win' THEN
    PERFORM fn_award_badge(NEW.user_id, 'first_retry_win');
  END IF;
  IF v_streak.play_streak >= 7  THEN PERFORM fn_award_badge(NEW.user_id, 'play_7');  END IF;
  IF v_streak.play_streak >= 10 THEN PERFORM fn_award_badge(NEW.user_id, 'play_10'); END IF;
  IF v_streak.win_streak  >= 3  THEN PERFORM fn_award_badge(NEW.user_id, 'win_3');   END IF;
  IF v_streak.win_streak  >= 5  THEN PERFORM fn_award_badge(NEW.user_id, 'win_5');   END IF;
  IF v_streak.retry_wins  >= 3  THEN PERFORM fn_award_badge(NEW.user_id, 'retry_3'); END IF;
  IF v_ss.total_draws     >= 3  THEN PERFORM fn_award_badge(NEW.user_id, 'month_draw_3'); END IF;
  IF v_team IS NOT NULL THEN
    PERFORM fn_award_badge(NEW.user_id, 'team_joined');
  END IF;

  PERFORM fn_refresh_hall_of_fame(NEW.user_id);
  PERFORM fn_refresh_hall_of_fame_season(v_season);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_streaks ON game_records;
CREATE TRIGGER trg_update_streaks
  AFTER INSERT ON game_records
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_streaks();
