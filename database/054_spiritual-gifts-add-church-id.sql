-- ============================================
-- Migration 052: Add church_id to spiritual_gifts_assessments
-- ============================================
-- Enables team-level results view per church.
-- Team members who take the gifts test via a church-scoped
-- link (dailydna.app/gifts?church=<id>) will have their
-- results linked to that church automatically.
-- ============================================

ALTER TABLE spiritual_gifts_assessments
  ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sga_church_id
  ON spiritual_gifts_assessments(church_id)
  WHERE church_id IS NOT NULL;

COMMENT ON COLUMN spiritual_gifts_assessments.church_id IS 'Church the team member was invited by — set when assessment taken via church-scoped gifts link';

-- ============================================
-- END OF MIGRATION 052
-- ============================================
