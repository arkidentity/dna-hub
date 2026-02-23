-- ============================================================
-- Migration 077: Fix promote_to_dna_leader trigger
--
-- BUG: When a church-assigned DNA leader creates their first group,
-- the promote_to_dna_leader trigger fires and inserts a dna_leader
-- role with church_id = NULL — duplicating the correctly church-scoped
-- role that already exists from the invite flow.
--
-- FIX: Only insert the bare (church_id = NULL) dna_leader role if the
-- user has NO dna_leader role at all. If they already have one (with or
-- without a church_id), skip the insert entirely — they're already set up.
-- ============================================================

CREATE OR REPLACE FUNCTION promote_to_dna_leader()
RETURNS TRIGGER AS $$
DECLARE
  v_users_id UUID;
  v_auth_user_id UUID;
  v_leader_email TEXT;
BEGIN
  -- Get the leader's email
  SELECT email INTO v_leader_email
  FROM dna_leaders
  WHERE id = NEW.leader_id;

  IF v_leader_email IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve users.id (the custom unified users table, NOT auth.users)
  SELECT id INTO v_users_id
  FROM users
  WHERE email = v_leader_email
  LIMIT 1;

  -- Resolve auth.users.id for dna_leader_journeys
  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_leader_email
  LIMIT 1;

  -- Add dna_leader role ONLY if they have no dna_leader role at all.
  -- If they were invited with a church_id, that role already exists — skip.
  IF v_users_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_users_id
        AND role = 'dna_leader'
    ) THEN
      INSERT INTO user_roles (user_id, role, church_id)
      VALUES (v_users_id, 'dna_leader', NULL);
    END IF;
  END IF;

  -- Update first_group_created milestone (dna_leader_journeys.user_id → auth.users.id)
  IF v_auth_user_id IS NOT NULL THEN
    UPDATE dna_leader_journeys
    SET milestones = jsonb_set(
          milestones,
          '{first_group_created}',
          jsonb_build_object('completed', true, 'completed_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
        ),
        updated_at = NOW()
    WHERE user_id = v_auth_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
