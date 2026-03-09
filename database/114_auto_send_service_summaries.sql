-- ============================================
-- Migration 114: Auto-Send Service Summaries
-- Adds tracking column to prevent duplicate sends
-- ============================================

-- Track when service summary emails were auto-sent
ALTER TABLE live_sessions
  ADD COLUMN IF NOT EXISTS summary_emailed_at TIMESTAMPTZ;

-- Index for cron to efficiently find un-emailed ended sessions
CREATE INDEX IF NOT EXISTS idx_live_sessions_unsent_summaries
  ON live_sessions (church_id, ended_at)
  WHERE ended_at IS NOT NULL AND summary_emailed_at IS NULL;
