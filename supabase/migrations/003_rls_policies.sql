-- =============================================================
-- Today RPS - GRANT + RLS 정책
-- 현재 앱은 Supabase Auth 없이 localStorage UUID(게스트 ID)를
-- 사용하므로, anon 역할에 대해 전체 접근을 허용합니다.
-- Toss JWT 연동 시 아래 정책을 user_id 기반으로 교체합니다.
-- =============================================================

-- ─────────────────────────────────────────
-- 0. anon 역할에 테이블 권한 부여 (GRANT)
--    Supabase는 migrations로 생성한 테이블에
--    자동 GRANT를 적용하지 않으므로 명시 필요
-- ─────────────────────────────────────────
GRANT SELECT, INSERT, UPDATE, DELETE ON users        TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON game_records TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON streaks      TO anon;
GRANT SELECT                          ON hall_of_fame TO anon;

-- UUID 생성 함수 사용 권한 (game_records.id 기본값)
GRANT EXECUTE ON FUNCTION gen_random_uuid() TO anon;

-- ─────────────────────────────────────────
-- users
-- ─────────────────────────────────────────
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 기존 정책 정리
DROP POLICY IF EXISTS "users: anon full access" ON users;

CREATE POLICY "users: anon full access" ON users
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- game_records
-- ─────────────────────────────────────────
ALTER TABLE game_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "game_records: anon full access" ON game_records;

CREATE POLICY "game_records: anon full access" ON game_records
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- streaks
-- ─────────────────────────────────────────
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "streaks: anon full access" ON streaks;

CREATE POLICY "streaks: anon full access" ON streaks
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);

-- ─────────────────────────────────────────
-- hall_of_fame
-- ─────────────────────────────────────────
ALTER TABLE hall_of_fame ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "hall_of_fame: anon read" ON hall_of_fame;

CREATE POLICY "hall_of_fame: anon read" ON hall_of_fame
  FOR SELECT
  TO anon
  USING (true);
