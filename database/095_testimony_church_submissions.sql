-- ============================================================
-- Migration 095: Testimony Church Submissions
-- Created: 2026-03-06
-- Purpose: Disciples can submit completed testimonies to their
--          church for leader review. Snapshot of testimony at
--          submission time so admins see what was submitted even
--          if the user later edits the original.
-- ============================================================

-- ============================================
-- 1. testimony_church_submissions
-- ============================================
CREATE TABLE IF NOT EXISTS testimony_church_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  testimony_id    UUID NOT NULL REFERENCES disciple_testimonies(id) ON DELETE CASCADE,
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES disciple_app_accounts(id),
  display_name    TEXT NOT NULL,

  -- Snapshot of testimony content at submission time
  title           TEXT NOT NULL,
  testimony_type  TEXT,
  struggle        TEXT,
  turning_point   TEXT,
  outcome         TEXT,
  reflection      TEXT,
  your_invitation TEXT,

  -- Moderation
  status          TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'archived')),
  admin_notes     TEXT,
  reviewed_at     TIMESTAMPTZ,
  reviewed_by     UUID,

  -- Timestamps
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),

  -- Prevent duplicate submissions of same testimony to same church
  UNIQUE(testimony_id, church_id)
);

-- Fast lookup for church admin moderation queue
CREATE INDEX IF NOT EXISTS idx_testimony_submissions_church
  ON testimony_church_submissions (church_id, status, created_at DESC);

-- User's own submissions
CREATE INDEX IF NOT EXISTS idx_testimony_submissions_user
  ON testimony_church_submissions (user_id, created_at DESC);

-- ============================================
-- 2. RLS Policies
-- ============================================
ALTER TABLE testimony_church_submissions ENABLE ROW LEVEL SECURITY;

-- Disciples can view their own submissions
CREATE POLICY "testimony_submissions_select_own"
  ON testimony_church_submissions FOR SELECT
  USING (user_id = auth.uid());

-- Disciples can insert submissions for their own church
CREATE POLICY "testimony_submissions_insert"
  ON testimony_church_submissions FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );
