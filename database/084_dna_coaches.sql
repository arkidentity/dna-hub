-- 084_dna_coaches
-- Stores reusable DNA coach profiles for the demo system.
-- Selecting a coach on the Demo Tab auto-fills the coach name and booking embed code,
-- eliminating manual re-entry when setting up demos for many churches.

CREATE TABLE IF NOT EXISTS dna_coaches (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,
  email          TEXT,
  booking_embed  TEXT,       -- Direct URL or full <iframe> embed code
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Link demo settings to a coach so the dropdown remembers the selection
ALTER TABLE church_demo_settings
  ADD COLUMN IF NOT EXISTS coach_id UUID REFERENCES dna_coaches(id) ON DELETE SET NULL;
