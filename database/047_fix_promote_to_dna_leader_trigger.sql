-- Migration 047: Fix promote_to_dna_leader trigger
-- PROBLEM 1: ON CONFLICT (user_id, role) DO NOTHING no longer matches any
--   constraint. Migration 025 replaced UNIQUE(user_id, role) with two partial
--   unique indexes (WHERE church_id IS NULL / IS NOT NULL). PL/pgSQL does not
--   support ON CONFLICT with a partial-index predicate, so we use NOT EXISTS.
-- PROBLEM 2: NEW.leader_id is dna_leaders.id, but user_roles.user_id and
--   dna_leader_journeys.user_id both reference auth.users(id). Passing
--   NEW.leader_id directly caused a foreign key violation on every group
--   creation after the first. We must resolve the auth.users UUID via the
--   leader's email first.

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

  -- Add dna_leader role if not already present (user_roles.user_id → users.id)
  IF v_users_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_users_id
        AND role = 'dna_leader'
        AND church_id IS NULL
    ) THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (v_users_id, 'dna_leader');
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
