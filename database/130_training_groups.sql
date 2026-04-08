-- Migration 130: Training Group Members
-- Adds training_group_members table for cohort-based training groups.
-- Training groups use group_type = 'training_cohort' on dna_groups (already in schema).
-- Members are DNA leaders (leaders-in-training), not disciples.
-- All members can see each other's profiles within the group.

-- ─── Table ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS training_group_members (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id  UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
  leader_id UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
  role      TEXT NOT NULL CHECK (role IN ('leader', 'co_leader', 'disciple')),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (group_id, leader_id)
);

CREATE INDEX idx_tgm_group_id  ON training_group_members(group_id);
CREATE INDEX idx_tgm_leader_id ON training_group_members(leader_id);

-- ─── RLS ───────────────────────────────────────────────────────────────────

ALTER TABLE training_group_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_role_full_tgm"
  ON training_group_members FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Authenticated users (Daily DNA) can see members of their own training groups
CREATE POLICY "members_can_view_tgm"
  ON training_group_members FOR SELECT TO authenticated
  USING (
    group_id IN (
      SELECT tgm2.group_id
      FROM training_group_members tgm2
      JOIN dna_leaders dl ON dl.id = tgm2.leader_id
      WHERE dl.email = auth.email()
    )
  );

-- ─── RPC: get_my_training_groups ───────────────────────────────────────────
-- Used by Daily DNA to include training groups in the groups list.
-- Accepts the dna_leaders.id of the requesting user.

CREATE OR REPLACE FUNCTION get_my_training_groups(p_leader_id UUID)
RETURNS TABLE (
  group_id      UUID,
  group_name    TEXT,
  current_phase TEXT,
  start_date    DATE,
  cohort_id     UUID,
  leader_id     UUID,
  co_leader_id  UUID,
  my_role       TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    g.id          AS group_id,
    g.group_name,
    g.current_phase,
    g.start_date,
    g.cohort_id,
    g.leader_id,
    g.co_leader_id,
    tgm.role      AS my_role
  FROM training_group_members tgm
  JOIN dna_groups g ON g.id = tgm.group_id
  WHERE tgm.leader_id = p_leader_id
    AND g.group_type = 'training_cohort'
    AND g.is_active = true;
$$;

GRANT EXECUTE ON FUNCTION get_my_training_groups(UUID) TO authenticated;

-- ─── RPC: get_training_group_members ───────────────────────────────────────
-- Returns all members of a training group with profile data.
-- Used by Daily DNA members-tab and Hub admin view.
-- p_requesting_leader_id = NULL skips member-check (for admin/service use).

CREATE OR REPLACE FUNCTION get_training_group_members(
  p_group_id             UUID,
  p_requesting_leader_id UUID DEFAULT NULL
)
RETURNS TABLE (
  member_id          UUID,
  leader_id          UUID,
  leader_name        TEXT,
  leader_email       TEXT,
  role               TEXT,
  life_assessment_done BOOLEAN,
  current_streak     INT,
  longest_streak     INT,
  total_entries      INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If a requesting leader is specified, verify they are a member
  IF p_requesting_leader_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM training_group_members
      WHERE group_id = p_group_id AND leader_id = p_requesting_leader_id
    ) THEN
      RAISE EXCEPTION 'Not a member of this training group';
    END IF;
  END IF;

  RETURN QUERY
  SELECT
    tgm.id                        AS member_id,
    tgm.leader_id,
    dl.name                       AS leader_name,
    dl.email                      AS leader_email,
    tgm.role,
    -- Life assessment: did this person complete it?
    EXISTS (
      SELECT 1
      FROM life_assessment_responses lar
      JOIN disciple_app_accounts daa ON daa.id = lar.account_id
      WHERE daa.email = dl.email
      LIMIT 1
    )                             AS life_assessment_done,
    -- Progress / streak
    COALESCE((
      SELECT dp.current_streak
      FROM disciple_progress dp
      JOIN disciple_app_accounts daa ON daa.id = dp.account_id
      WHERE daa.email = dl.email
      LIMIT 1
    ), 0)                         AS current_streak,
    COALESCE((
      SELECT dp.longest_streak
      FROM disciple_progress dp
      JOIN disciple_app_accounts daa ON daa.id = dp.account_id
      WHERE daa.email = dl.email
      LIMIT 1
    ), 0)                         AS longest_streak,
    COALESCE((
      SELECT dp.total_entries
      FROM disciple_progress dp
      JOIN disciple_app_accounts daa ON daa.id = dp.account_id
      WHERE daa.email = dl.email
      LIMIT 1
    ), 0)                         AS total_entries
  FROM training_group_members tgm
  JOIN dna_leaders dl ON dl.id = tgm.leader_id
  WHERE tgm.group_id = p_group_id
  ORDER BY
    CASE tgm.role WHEN 'leader' THEN 1 WHEN 'co_leader' THEN 2 ELSE 3 END,
    dl.name;
END;
$$;

GRANT EXECUTE ON FUNCTION get_training_group_members(UUID, UUID) TO authenticated;
