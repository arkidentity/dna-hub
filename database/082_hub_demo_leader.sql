-- Migration 082: Hub Demo Leader columns
-- Adds two columns to church_demo_settings to track the Hub-side demo experience:
--   hub_demo_leader_id  — auth.users UUID for the seeded Hub demo church leader account.
--                         Used by /api/demo/hub-session/[slug] to sign in without a password prompt.
--   hub_demo_seeded_at  — timestamp of last Hub demo seed run (NULL = not yet seeded).
-- Also adds demo_free_user_id if not already present (referenced in the disciple seed route).

ALTER TABLE church_demo_settings
  ADD COLUMN IF NOT EXISTS hub_demo_leader_id UUID,
  ADD COLUMN IF NOT EXISTS hub_demo_seeded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_free_user_id UUID;
