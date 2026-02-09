-- ============================================
-- Migration 044: Spiritual Gifts Leader Inquiries
-- ============================================
-- Table to capture pastor/leader lead gen form submissions
-- from the spiritual-gifts-leaders landing page
-- ============================================

CREATE TABLE spiritual_gifts_leader_inquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Contact info
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  church_name TEXT NOT NULL,
  church_size TEXT NOT NULL CHECK (church_size IN ('1-50', '51-200', '201-500', '501-1000', '1001+')),

  -- Optional message
  message TEXT,

  -- Follow-up tracking
  contacted_at TIMESTAMPTZ,
  access_granted_at TIMESTAMPTZ,
  notes TEXT, -- Admin notes about follow-up

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_spiritual_gifts_leader_inquiries_email ON spiritual_gifts_leader_inquiries(email);
CREATE INDEX idx_spiritual_gifts_leader_inquiries_created ON spiritual_gifts_leader_inquiries(created_at DESC);
CREATE INDEX idx_spiritual_gifts_leader_inquiries_contacted ON spiritual_gifts_leader_inquiries(contacted_at) WHERE contacted_at IS NOT NULL;

-- RLS policies
ALTER TABLE spiritual_gifts_leader_inquiries ENABLE ROW LEVEL SECURITY;

-- Only admins can view inquiries (service role key required)
CREATE POLICY "Only service role can access inquiries"
  ON spiritual_gifts_leader_inquiries
  FOR ALL
  USING (false); -- No user-level access, only via service role

-- Allow INSERT from API (service role will handle this)
CREATE POLICY "Service role can insert inquiries"
  ON spiritual_gifts_leader_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Create update function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for updated_at
CREATE TRIGGER spiritual_gifts_leader_inquiries_updated_at
  BEFORE UPDATE ON spiritual_gifts_leader_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE spiritual_gifts_leader_inquiries IS 'Lead gen form submissions from spiritual-gifts-leaders landing page';
COMMENT ON COLUMN spiritual_gifts_leader_inquiries.church_size IS 'Church attendance size bracket';
COMMENT ON COLUMN spiritual_gifts_leader_inquiries.contacted_at IS 'When we first reached out to them';
COMMENT ON COLUMN spiritual_gifts_leader_inquiries.access_granted_at IS 'When we gave them team dashboard access';

-- ============================================
-- END OF MIGRATION 044
-- ============================================
