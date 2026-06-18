-- ============================================================
-- PikNik – Supabase schema setup
-- Safe to run multiple times (idempotent). Paste the whole file
-- into the Supabase Dashboard → SQL Editor → Run.
-- ============================================================

-- ============================================
-- BLOCK 1: Tables
-- ============================================

CREATE TABLE IF NOT EXISTS sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  color TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ingredients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT DEFAULT '',
  added_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  ingredients JSONB DEFAULT '[]',
  steps JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- BLOCK 2: RPC – participants for a session code
-- ============================================

CREATE OR REPLACE FUNCTION get_session_data(p_session_code TEXT)
RETURNS TABLE (
  user_id UUID,
  user_name TEXT,
  user_color TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT u.id AS user_id, u.name AS user_name, u.color AS user_color
  FROM users u
  JOIN sessions s ON u.session_id = s.id
  WHERE s.code = p_session_code;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- BLOCK 3: Row Level Security (permissive – anon app, no auth)
-- ============================================

ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all on sessions" ON sessions;
DROP POLICY IF EXISTS "Allow all on users" ON users;
DROP POLICY IF EXISTS "Allow all on ingredients" ON ingredients;
DROP POLICY IF EXISTS "Allow all on recipes" ON recipes;

CREATE POLICY "Allow all on sessions" ON sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on ingredients" ON ingredients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all on recipes" ON recipes FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- BLOCK 4: Realtime publication (optional)
-- The app syncs via broadcast + presence, not postgres_changes,
-- so this is not strictly required — included for completeness.
-- Guarded so re-running never errors on "already member".
-- ============================================

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['sessions', 'ingredients', 'recipes'] LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE %I', t);
    END IF;
  END LOOP;
END $$;
