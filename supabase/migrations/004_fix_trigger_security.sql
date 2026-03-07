-- =============================================================
-- Today RPS - 트리거 함수 SECURITY DEFINER 적용
--
-- 문제 원인:
--   fn_update_streaks() → fn_refresh_hall_of_fame() 호출 시
--   두 함수 모두 SECURITY DEFINER 없이 정의되어 있어
--   호출자(anon) 권한으로 실행됩니다.
--   그런데 hall_of_fame 테이블은 anon 에게 SELECT 권한만
--   부여되어 있으므로 트리거 내 INSERT/UPDATE/DELETE 가 실패하고
--   game_records INSERT 트랜잭션 전체가 롤백됩니다.
--
-- 수정:
--   두 함수를 SECURITY DEFINER 로 변경하여 함수 소유자(postgres)
--   권한으로 실행하고, RLS 를 우회합니다.
--   SET search_path 는 search_path injection 방지를 위해 명시합니다.
-- =============================================================

ALTER FUNCTION fn_refresh_hall_of_fame(TEXT)
  SECURITY DEFINER
  SET search_path = public;

ALTER FUNCTION fn_update_streaks()
  SECURITY DEFINER
  SET search_path = public;
