-- Migration 079: Church Demo Settings
-- Stores per-church demo page configuration:
-- video URL (YouTube unlisted), enabled flag, temperature default, seed status

CREATE TABLE IF NOT EXISTS church_demo_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID UNIQUE NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  video_url TEXT,                     -- YouTube unlisted watch URL or embed URL
  demo_enabled BOOLEAN DEFAULT false, -- Gate: page only accessible when true
  default_temp TEXT DEFAULT 'warm'    -- 'cold' | 'warm' | 'hot'
    CHECK (default_temp IN ('cold', 'warm', 'hot')),
  demo_seeded_at TIMESTAMPTZ,         -- NULL = not yet seeded
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Only admins and coaches can access demo settings
ALTER TABLE church_demo_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin and coach access" ON church_demo_settings
  USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid()
        AND au.is_active = true
    )
  );

-- Allow the public demo endpoint to read enabled demos (anon read of enabled rows only)
CREATE POLICY "Public read enabled demos" ON church_demo_settings
  FOR SELECT
  USING (demo_enabled = true);

-- Index for fast church lookup
CREATE INDEX IF NOT EXISTS idx_church_demo_settings_church_id
  ON church_demo_settings(church_id);

-- Auto-update updated_at on modification
CREATE OR REPLACE FUNCTION update_church_demo_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER church_demo_settings_updated_at
  BEFORE UPDATE ON church_demo_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_church_demo_settings_updated_at();

-- Grants
GRANT SELECT ON church_demo_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON church_demo_settings TO authenticated;
