-- =============================================================
-- Today RPS - DB 트리거 & 스케줄 함수
-- =============================================================

-- ─────────────────────────────────────────
-- 1. game_records INSERT 후 streaks 갱신
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_update_streaks()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_streak  streaks%ROWTYPE;
  v_today   DATE := (now() AT TIME ZONE 'Asia/Seoul')::DATE;
BEGIN
  -- streaks 없으면 초기 생성
  INSERT INTO streaks (user_id, last_play_date)
  VALUES (NEW.user_id, v_today)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT * INTO v_streak FROM streaks WHERE user_id = NEW.user_id;

  -- ──── 연속 출석 계산 ────
  IF v_streak.last_play_date = v_today - 1 THEN
    v_streak.play_streak := v_streak.play_streak + 1;
  ELSIF v_streak.last_play_date = v_today THEN
    -- 같은 날 재도전: play_streak 유지
    NULL;
  ELSE
    v_streak.play_streak := 1;
  END IF;
  v_streak.max_play_streak := GREATEST(v_streak.max_play_streak, v_streak.play_streak);

  -- ──── 총 플레이 ────
  v_streak.total_plays := v_streak.total_plays + 1;

  -- ──── 결과별 streak/total 갱신 ────
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

  -- ──── hall_of_fame 갱신 호출 ────
  PERFORM fn_refresh_hall_of_fame(NEW.user_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_streaks ON game_records;
CREATE TRIGGER trg_update_streaks
  AFTER INSERT ON game_records
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_streaks();


-- ─────────────────────────────────────────
-- 2. hall_of_fame TOP5 갱신 함수
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION fn_refresh_hall_of_fame(p_user_id TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
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
  i      INT;
  v_cat  TEXT;
  v_col  TEXT;
  v_rank INT;
  v_rec  RECORD;
BEGIN
  FOR i IN 1..6 LOOP
    v_cat  := v_cats[i];
    v_col  := v_cols[i];
    v_rank := 1;
    -- 해당 카테고리 기준 TOP 5 유저 순위
    FOR v_rec IN EXECUTE format(
      'SELECT user_id, %I AS record, updated_at
       FROM streaks
       WHERE %I > 0
       ORDER BY %I DESC, updated_at ASC
       LIMIT 5',
      v_col, v_col, v_col
    )
    LOOP
      INSERT INTO hall_of_fame (category, rank, user_id, record, achieved_at)
      VALUES (v_cat, v_rank, v_rec.user_id, v_rec.record, v_rec.updated_at)
      ON CONFLICT (category, rank)
      DO UPDATE SET
        user_id     = EXCLUDED.user_id,
        record      = EXCLUDED.record,
        achieved_at = EXCLUDED.achieved_at;
      v_rank := v_rank + 1;
    END LOOP;

    -- 현재 TOP 5보다 rank가 더 큰 엔트리 정리 (유저 수 줄었을 때)
    DELETE FROM hall_of_fame
    WHERE category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;


-- ─────────────────────────────────────────
-- 3. 일일 재도전 지원좌 판단 방식 변경 안내
--
--   변경 이유:
--     has_used_retry 콼럼을 users 테이블에서 제거했습니다.
--     재도전 사용 여부는 game_records 에서
--     당일 is_retry = true 레코드 존재 여부로 판단합니다.
--     따라서 fn_daily_reset 함수 및 Cron이 더 이상 필요하지 않습니다.
-- ─────────────────────────────────────────

-- ─────────────────────────────────────────
-- 4. Row Level Security (RLS)
--
-- Toss In-App 인증 방식:
--   Toss 앱은 Supabase 자체 Auth를 사용하지 않으므로
--   auth.uid()는 항상 null을 반환합니다.
--
--   해결책: Supabase Custom JWT Provider
--     Supabase Dashboard → Settings → API → JWT Settings
--     → Custom JWT Secret에 Toss 공개키 등록
--
--   Toss가 발급한 JWT의 'sub' 클레임을 user_id로 사용합니다.
--   auth.jwt() ->> 'sub' 로 재인증됩니다.
-- ─────────────────────────────────────────
ALTER TABLE users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_records  ENABLE ROW LEVEL SECURITY;
ALTER TABLE streaks       ENABLE ROW LEVEL SECURITY;
ALTER TABLE hall_of_fame  ENABLE ROW LEVEL SECURITY;

-- 유저는 JWT sub 클레임이 일치하는 자신의 데이터만 읽기/쓰기 가능
CREATE POLICY "users_self" ON users
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "game_records_self" ON game_records
  USING ((auth.jwt() ->> 'sub') = user_id)
  WITH CHECK ((auth.jwt() ->> 'sub') = user_id);

CREATE POLICY "streaks_self_read" ON streaks
  FOR SELECT USING ((auth.jwt() ->> 'sub') = user_id);

-- streaks 는 trigger(service_role)로만 쓰기

-- hall_of_fame 은 모두 읽기 가능
CREATE POLICY "hof_public_read" ON hall_of_fame
  FOR SELECT USING (true);
