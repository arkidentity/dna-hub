-- ============================================
-- Migration 055: Pathway Sync Support
--
-- Adds checkpoint_key (string) to disciple_checkpoint_completions
-- so the Daily DNA app can upsert by string key without needing
-- to look up the integer toolkit_checkpoints(id) FK.
--
-- Also adds week_number for leader visibility in disciple profile.
-- ============================================

-- 1. Add checkpoint_key column (nullable for existing rows)
ALTER TABLE disciple_checkpoint_completions
  ADD COLUMN IF NOT EXISTS checkpoint_key TEXT,
  ADD COLUMN IF NOT EXISTS week_number INTEGER;

-- 2. Make checkpoint_id nullable (app syncs by key, not integer FK)
ALTER TABLE disciple_checkpoint_completions
  ALTER COLUMN checkpoint_id DROP NOT NULL;

-- 3. Add unique constraint on (account_id, checkpoint_key)
--    so the app can upsert by key safely
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'disciple_checkpoint_completions_account_key_unique'
  ) THEN
    ALTER TABLE disciple_checkpoint_completions
      ADD CONSTRAINT disciple_checkpoint_completions_account_key_unique
      UNIQUE (account_id, checkpoint_key);
  END IF;
END $$;

-- 4. Index for fast leader queries
CREATE INDEX IF NOT EXISTS idx_disciple_checkpoint_completions_key
  ON disciple_checkpoint_completions(account_id, checkpoint_key);

-- 5. RLS — disciples can insert/update their own rows (already exists for account_id)
--    No changes needed; existing policies cover new columns.
