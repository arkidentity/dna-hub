-- Migration 087: Leader Toolkit Progress
-- Tracks which session guides leaders have completed in the 90-Day Toolkit training module.
-- This is separate from disciple_toolkit_progress (Daily DNA app pathway).

CREATE TABLE IF NOT EXISTS leader_toolkit_progress (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  leader_id     UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
  week_number   INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 12),
  completed     BOOLEAN NOT NULL DEFAULT false,
  completed_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (leader_id, week_number)
);

ALTER TABLE leader_toolkit_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders manage own toolkit progress"
  ON leader_toolkit_progress
  FOR ALL USING (
    leader_id IN (
      SELECT id FROM dna_leaders WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    leader_id IN (
      SELECT id FROM dna_leaders WHERE user_id = auth.uid()
    )
  );

GRANT ALL ON leader_toolkit_progress TO authenticated;
