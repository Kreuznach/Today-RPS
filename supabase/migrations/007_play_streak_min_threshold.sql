-- =============================================================
-- Today RPS - play_streak 명예의 전당 최소 집계 기준 적용
--
-- [문제]
--   fn_refresh_hall_of_fame 의 모든 카테고리 WHERE 조건이
--   "%I > 0" 으로 동일하여 play_streak 가 1일인 유저도
--   명예의 전당에 집계되는 문제가 있었음.
--
-- [수정]
--   카테고리별 최솟값 배열 v_mins 를 추가하고,
--   play_streak 에 한해 최솟값을 10 으로 설정.
--   다른 카테고리는 기존과 동일하게 0 초과 조건 유지.
-- =============================================================

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
       LIMIT 5',
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

    -- TOP 5 보다 rank 가 높은 오래된 엔트리 정리
    DELETE FROM hall_of_fame
    WHERE category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;
