-- ============================================================
-- Migration 155: Way of Life Tool
-- Personal culture document built during Phase 1 Week 6-8
-- ============================================================

-- ============================================================
-- TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS disciple_way_of_life (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id uuid NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,

  -- 7 categories, each an array of statement strings
  -- { devotion: [], family: [], community: [], mission: [], stewardship: [], health: [], serving: [] }
  categories jsonb NOT NULL DEFAULT '{}',

  -- Optional personal story (Screen 10)
  story text,

  -- Workflow state
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'completed')),

  -- Whether the one-time onboarding screen (Screen 2) has been shown
  onboarding_seen boolean NOT NULL DEFAULT false,

  -- Timestamps
  completed_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  UNIQUE (account_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_way_of_life_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_way_of_life_updated_at ON disciple_way_of_life;
CREATE TRIGGER trg_way_of_life_updated_at
  BEFORE UPDATE ON disciple_way_of_life
  FOR EACH ROW EXECUTE FUNCTION update_way_of_life_updated_at();

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE disciple_way_of_life ENABLE ROW LEVEL SECURITY;

-- Disciple: read & write their own record
CREATE POLICY "disciple_way_of_life_select_own" ON disciple_way_of_life
  FOR SELECT USING (
    account_id = (
      SELECT id FROM disciple_app_accounts WHERE id = auth.uid()
    )
  );

CREATE POLICY "disciple_way_of_life_insert_own" ON disciple_way_of_life
  FOR INSERT WITH CHECK (
    account_id = (
      SELECT id FROM disciple_app_accounts WHERE id = auth.uid()
    )
  );

CREATE POLICY "disciple_way_of_life_update_own" ON disciple_way_of_life
  FOR UPDATE USING (
    account_id = (
      SELECT id FROM disciple_app_accounts WHERE id = auth.uid()
    )
  );

-- Leaders: read records of disciples in their groups
CREATE POLICY "disciple_way_of_life_leader_select" ON disciple_way_of_life
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM group_disciples gd
      JOIN disciples d ON d.id = gd.disciple_id
      JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
      JOIN dna_groups g ON g.id = gd.group_id
      JOIN dna_leaders dl ON (g.leader_id = dl.id OR g.co_leader_id = dl.id)
      JOIN users u ON u.id = dl.user_id
      WHERE daa.id = disciple_way_of_life.account_id
        AND u.id = auth.uid()
    )
  );

-- ============================================================
-- RPCs
-- ============================================================

-- Upsert: called from Daily DNA app after each save / on completion
CREATE OR REPLACE FUNCTION upsert_way_of_life(
  p_account_id uuid,
  p_categories jsonb,
  p_story text,
  p_status text,
  p_onboarding_seen boolean,
  p_completed_at timestamptz DEFAULT NULL,
  p_last_reviewed_at timestamptz DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO disciple_way_of_life (
    account_id, categories, story, status, onboarding_seen,
    completed_at, last_reviewed_at
  )
  VALUES (
    p_account_id, p_categories, p_story, p_status, p_onboarding_seen,
    p_completed_at, p_last_reviewed_at
  )
  ON CONFLICT (account_id) DO UPDATE SET
    categories       = EXCLUDED.categories,
    story            = EXCLUDED.story,
    status           = EXCLUDED.status,
    onboarding_seen  = EXCLUDED.onboarding_seen,
    completed_at     = COALESCE(EXCLUDED.completed_at, disciple_way_of_life.completed_at),
    last_reviewed_at = EXCLUDED.last_reviewed_at,
    updated_at       = now();
END;
$$;

GRANT EXECUTE ON FUNCTION upsert_way_of_life TO authenticated;

-- Read: called from Hub API route (service role bypasses RLS anyway, but also useful for disciple-side read)
CREATE OR REPLACE FUNCTION get_way_of_life(p_account_id uuid)
RETURNS TABLE (
  id uuid,
  account_id uuid,
  categories jsonb,
  story text,
  status text,
  onboarding_seen boolean,
  completed_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    w.id, w.account_id, w.categories, w.story, w.status,
    w.onboarding_seen, w.completed_at, w.last_reviewed_at,
    w.created_at, w.updated_at
  FROM disciple_way_of_life w
  WHERE w.account_id = p_account_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_way_of_life TO authenticated, anon;
