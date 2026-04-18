-- Migration 143: DNA Lifeline
-- Creates lifeline_events table and adds lifeline summary fields to disciple_app_accounts

-- ============================================================
-- lifeline_events table
-- ============================================================
CREATE TABLE IF NOT EXISTS lifeline_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  decade_start INT NOT NULL CHECK (decade_start >= 0 AND decade_start % 10 = 0),
  label TEXT NOT NULL DEFAULT '',
  god_part TEXT NOT NULL DEFAULT '',
  position TEXT NOT NULL DEFAULT 'high' CHECK (position IN ('high', 'low')),
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lifeline_events_account_id ON lifeline_events(account_id);
CREATE INDEX IF NOT EXISTS idx_lifeline_events_account_decade ON lifeline_events(account_id, decade_start);

-- updated_at trigger
CREATE OR REPLACE FUNCTION update_lifeline_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_lifeline_events_updated_at ON lifeline_events;
CREATE TRIGGER trg_lifeline_events_updated_at
  BEFORE UPDATE ON lifeline_events
  FOR EACH ROW EXECUTE FUNCTION update_lifeline_events_updated_at();

-- ============================================================
-- Add lifeline summary fields to disciple_app_accounts
-- ============================================================
ALTER TABLE disciple_app_accounts
  ADD COLUMN IF NOT EXISTS lifeline_today TEXT,
  ADD COLUMN IF NOT EXISTS lifeline_hope TEXT;

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE lifeline_events ENABLE ROW LEVEL SECURITY;

-- Disciples can read/write their own events
CREATE POLICY "lifeline_events_own_read" ON lifeline_events
  FOR SELECT USING (account_id = auth.uid());

CREATE POLICY "lifeline_events_own_insert" ON lifeline_events
  FOR INSERT WITH CHECK (account_id = auth.uid());

CREATE POLICY "lifeline_events_own_update" ON lifeline_events
  FOR UPDATE USING (account_id = auth.uid());

CREATE POLICY "lifeline_events_own_delete" ON lifeline_events
  FOR DELETE USING (account_id = auth.uid());

-- Service role can read all (for leader view in Hub)
CREATE POLICY "lifeline_events_service_role_all" ON lifeline_events
  FOR ALL USING (auth.role() = 'service_role');

GRANT ALL ON lifeline_events TO authenticated;
GRANT ALL ON lifeline_events TO service_role;
