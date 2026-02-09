-- ============================================
-- Migration 043: Fix get_my_group_ids() for Leaders
-- ============================================
-- PROBLEM: Leaders who log into the Daily DNA app cannot see their groups.
--
-- ROOT CAUSE: The get_my_group_ids() function only looks for group memberships
-- via disciple_app_accounts.disciple_id → group_disciples. But leaders are
-- stored in dna_leaders, not disciples. When a leader creates an app account,
-- they have no disciple_id, so get_my_group_ids() returns empty.
--
-- FIX: Update get_my_group_ids() to ALSO check if the user is a leader or
-- co-leader by matching their email against dna_leaders.
-- ============================================

CREATE OR REPLACE FUNCTION get_my_group_ids()
RETURNS UUID[] AS $$
DECLARE
  v_disciple_id UUID;
  v_user_email TEXT;
  v_group_ids UUID[];
  v_leader_group_ids UUID[];
BEGIN
  -- Get the user's email and disciple_id from their app account
  SELECT disciple_id, email INTO v_disciple_id, v_user_email
  FROM disciple_app_accounts
  WHERE id = auth.uid();

  -- If no app account found, return empty
  IF v_user_email IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  -- Path 1: Get groups where the user is a disciple
  IF v_disciple_id IS NOT NULL THEN
    SELECT ARRAY_AGG(group_id) INTO v_group_ids
    FROM group_disciples
    WHERE disciple_id = v_disciple_id
      AND current_status = 'active';
  END IF;

  -- Path 2: Get groups where the user is a leader or co-leader
  -- Match by email since leaders may not have a disciple_id
  SELECT ARRAY_AGG(g.id) INTO v_leader_group_ids
  FROM dna_groups g
  JOIN dna_leaders dl ON (g.leader_id = dl.id OR g.co_leader_id = dl.id)
  WHERE dl.email = v_user_email
    AND g.is_active = true;

  -- Combine both arrays and remove duplicates
  IF v_group_ids IS NOT NULL AND v_leader_group_ids IS NOT NULL THEN
    RETURN ARRAY(SELECT DISTINCT unnest(v_group_ids || v_leader_group_ids));
  ELSIF v_group_ids IS NOT NULL THEN
    RETURN v_group_ids;
  ELSIF v_leader_group_ids IS NOT NULL THEN
    RETURN v_leader_group_ids;
  ELSE
    RETURN ARRAY[]::UUID[];
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION get_my_group_ids TO authenticated;

-- ============================================
-- END OF MIGRATION 043
-- ============================================
