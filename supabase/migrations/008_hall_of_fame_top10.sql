-- =============================================================
-- Today RPS - 명예의 전당 TOP 5 → TOP 10 확장
--
-- [변경 내용]
--   1. hall_of_fame.rank CHECK 제약을 1~5 → 1~10 으로 확장
--      (기존 CHECK 위반 오류 23514 해소)
--   2. fn_refresh_hall_of_fame 의 LIMIT 5 를 LIMIT 10 으로 변경하여
--      각 카테고리별 최대 10위까지 집계합니다.
-- =============================================================

-- rank 컬럼의 CHECK 제약 변경 (1~5 → 1~10)
ALTER TABLE hall_of_fame
  DROP CONSTRAINT IF EXISTS hall_of_fame_rank_check;

ALTER TABLE hall_of_fame
  ADD CONSTRAINT hall_of_fame_rank_check CHECK (rank BETWEEN 1 AND 10);

CREATE OR REPLACE FUNCTION fn_refresh_hall_of_fame(p_user_id TEXT DEFAULT NULL)
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
  -- 카테고리별 최소 집계 기준값
  -- play_streak(4번째)만 10, 나머지는 0 초과(즉 최솟값 1 적용)
  v_mins INT[]  := ARRAY[0, 0, 0, 9, 0, 0];
  i      INT;
  v_cat  TEXT;
  v_col  TEXT;
  v_min  INT;
  v_rank INT;
  v_rec  RECORD;
BEGIN
  FOR i IN 1..6 LOOP
    v_cat  := v_cats[i];
    v_col  := v_cols[i];
    v_min  := v_mins[i];
    v_rank := 1;

    FOR v_rec IN EXECUTE format(
      'SELECT user_id, %I AS record, updated_at
       FROM streaks
       WHERE %I > %s
       ORDER BY %I DESC, updated_at ASC
       LIMIT 10',
      v_col, v_col, v_min, v_col
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

    -- TOP 10 보다 rank 가 높은 오래된 엔트리 정리
    DELETE FROM hall_of_fame
    WHERE category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;
