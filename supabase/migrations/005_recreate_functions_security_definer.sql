-- =============================================================
-- Today RPS - 트리거 함수 완전 재정의 (SECURITY DEFINER)
--
-- [왜 ALTER FUNCTION 대신 CREATE OR REPLACE 를 쓰나]
--   ALTER FUNCTION 으로 SECURITY DEFINER 를 붙여도 일부 Supabase
--   환경에서 함수 소유자 불일치 등으로 적용이 되지 않거나
--   기존 LANGUAGE/BODY 와 충돌할 수 있습니다.
--   CREATE OR REPLACE 는 함수 정의를 통째로 덮어쓰므로
--   SECURITY DEFINER 가 항상 올바르게 반영됩니다.
--
-- [핵심 원리]
--   현재 anon 역할은 hall_of_fame 에 SELECT 권한만 있습니다.
--   그러나 트리거(fn_update_streaks)가 SECURITY DEFINER 없이
--   실행되면 호출자(anon) 권한으로 hall_of_fame 에
--   INSERT/UPDATE/DELETE 를 시도 → 권한 오류 → game_records
--   INSERT 트랜잭션 전체가 롤백됩니다.
--
--   SECURITY DEFINER + SET search_path = public 을 붙이면
--   함수가 소유자(postgres, 슈퍼유저) 권한으로 실행되어
--   RLS 를 우회하고 모든 테이블에 정상 접근합니다.
--
-- [이 파일을 Supabase Dashboard → SQL Editor 에서 실행하세요]
-- =============================================================

-- ─────────────────────────────────────────
-- 1. hall_of_fame TOP5 갱신 함수 (재정의)
-- ─────────────────────────────────────────
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

    DELETE FROM hall_of_fame
    WHERE category = v_cat AND rank >= v_rank;
  END LOOP;
END;
$$;

-- ─────────────────────────────────────────
-- 2. streaks 갱신 트리거 함수 (재정의)
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

  PERFORM fn_refresh_hall_of_fame(NEW.user_id);

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────
-- 3. 트리거 재생성 (함수 교체를 반영)
-- ─────────────────────────────────────────
DROP TRIGGER IF EXISTS trg_update_streaks ON game_records;
CREATE TRIGGER trg_update_streaks
  AFTER INSERT ON game_records
  FOR EACH ROW
  EXECUTE FUNCTION fn_update_streaks();
