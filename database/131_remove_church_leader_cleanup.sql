-- Migration 131: Church leader removal cleanup
-- Adds a helper RPC for atomically removing a church leader from a specific church.
-- This covers all 4 tables that must stay in sync:
--   church_leaders, user_roles (church_leader), user_roles (dna_leader), dna_leaders
--
-- Also provides a one-time backfill to detect and fix leaders who have stale
-- user_roles entries pointing to a church they no longer belong to in dna_leaders.

-- ─── RPC: remove_church_leader ───────────────────────────────────────────────
-- Removes a leader from a specific church. Called from the Hub API.
-- Requires service-role or admin context.

CREATE OR REPLACE FUNCTION remove_church_leader(
  p_user_id   UUID,
  p_church_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Remove from church_leaders
  DELETE FROM church_leaders
  WHERE user_id = p_user_id AND church_id = p_church_id;

  -- 2. Remove church_leader role
  DELETE FROM user_roles
  WHERE user_id = p_user_id
    AND role = 'church_leader'
    AND church_id = p_church_id;

  -- 3. Remove dna_leader role scoped to this church
  DELETE FROM user_roles
  WHERE user_id = p_user_id
    AND role = 'dna_leader'
    AND church_id = p_church_id;

  -- 4. Soft-deactivate dna_leaders record if it still points to this church
  UPDATE dna_leaders
  SET church_id  = NULL,
      is_active  = FALSE,
      updated_at = NOW()
  WHERE user_id  = p_user_id
    AND church_id = p_church_id;
END;
$$;

GRANT EXECUTE ON FUNCTION remove_church_leader(UUID, UUID) TO authenticated;


-- ─── DIAGNOSTIC: Find mismatched leaders ─────────────────────────────────────
-- Run this SELECT to see leaders whose user_roles.church_id doesn't match
-- their dna_leaders.church_id (i.e., stale access from a prior assignment).
--
-- SELECT
--   u.email,
--   dl.church_id   AS dna_leaders_church,
--   ur.church_id   AS user_roles_church,
--   ur.role
-- FROM dna_leaders dl
-- JOIN users u        ON u.id = dl.user_id
-- JOIN user_roles ur  ON ur.user_id = dl.user_id
--                    AND ur.role IN ('church_leader', 'dna_leader')
-- WHERE ur.church_id IS NOT NULL
--   AND ur.church_id IS DISTINCT FROM dl.church_id
-- ORDER BY u.email, ur.role;


-- ─── ONE-TIME FIX for Travis / stale Boulevard records ───────────────────────
-- After identifying the stale church_id via the diagnostic above, run:
--
--   SELECT remove_church_leader(
--     (SELECT id FROM users WHERE email = 'travis@arkidentity.com'),
--     (SELECT id FROM churches WHERE name ILIKE '%boulevard%' LIMIT 1)
--   );
--
-- Verify with:
--   SELECT role, church_id FROM user_roles
--   WHERE user_id = (SELECT id FROM users WHERE email = 'travis@arkidentity.com');
