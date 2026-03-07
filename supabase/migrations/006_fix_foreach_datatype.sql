-- =============================================================
-- Today RPS - fn_refresh_hall_of_fame FOREACH 버그 수정
--
-- [42804 datatype_mismatch 원인]
--   PL/pgSQL FOREACH 는 루프 변수를 하나만 허용합니다.
--   FOREACH v_cat, v_col IN ARRAY cat_cols 는 TEXT[][] 의
--   각 슬라이스(TEXT[])를 TEXT 변수에 대입하려다
--   42804 datatype_mismatch 가 발생합니다.
--
-- [수정]
--   cat_cols TEXT[][] 대신 v_cats / v_cols 를 별개 TEXT[] 로 선언하고
--   FOR i IN 1..6 LOOP 으로 인덱스 순환합니다.
--   fn_update_streaks 는 005 에서 이미 정상이므로 여기서는 재정의하지 않습니다.
-- =============================================================

CREATE OR REPLACE FUNCTION fn_refresh_hall_of_fame(p_user_id TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- 카테고리명 (hall_of_fame.category) 과 streaks 조회 컬럼명을 병렬 배열로 관리
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

    -- TOP 5 보다 rank 가 높은 오래된 엔트리 정리
    DELETE FROM hall_of_fame
    WHERE category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;
