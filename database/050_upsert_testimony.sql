-- Migration 050: Add upsert_testimony RPC function for testimony sync
-- Created: 2026-02-12
-- Purpose: Enable testimony cloud sync for Daily DNA app

-- ============================================
-- UPSERT TESTIMONY (for sync)
-- ============================================
CREATE OR REPLACE FUNCTION upsert_testimony(
  p_account_id UUID,
  p_local_id TEXT,
  p_title TEXT,
  p_testimony_type TEXT,
  p_struggle TEXT,
  p_turning_point TEXT,
  p_outcome TEXT,
  p_reflection TEXT,
  p_your_invitation TEXT,
  p_status TEXT,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_testimonies (
    account_id, local_id, title, testimony_type,
    struggle, turning_point, outcome, reflection, your_invitation,
    status, created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_testimony_type,
    p_struggle, p_turning_point, p_outcome, p_reflection, p_your_invitation,
    p_status, p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    testimony_type = EXCLUDED.testimony_type,
    struggle = EXCLUDED.struggle,
    turning_point = EXCLUDED.turning_point,
    outcome = EXCLUDED.outcome,
    reflection = EXCLUDED.reflection,
    your_invitation = EXCLUDED.your_invitation,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_testimonies.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION upsert_testimony TO authenticated;
