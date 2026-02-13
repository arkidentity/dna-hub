-- ============================================
-- Migration 051: Link spiritual_gifts_leader_inquiries to churches
-- ============================================
-- Adds church_id FK so auto-provisioned church is traceable
-- from the inquiry record.
-- ============================================

ALTER TABLE spiritual_gifts_leader_inquiries
  ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_spiritual_gifts_leader_inquiries_church
  ON spiritual_gifts_leader_inquiries(church_id)
  WHERE church_id IS NOT NULL;

COMMENT ON COLUMN spiritual_gifts_leader_inquiries.church_id IS 'Auto-provisioned church created when inquiry was submitted';

-- ============================================
-- END OF MIGRATION 051
-- ============================================
