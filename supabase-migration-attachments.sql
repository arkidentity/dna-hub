-- Migration: Add milestone attachments support
-- Run this in your Supabase SQL Editor

-- =====================
-- MILESTONE ATTACHMENTS TABLE
-- =====================
-- Stores file attachments for specific church milestones
CREATE TABLE IF NOT EXISTS milestone_attachments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,

  -- File info
  file_name VARCHAR(255) NOT NULL,
  file_url TEXT NOT NULL,
  file_type VARCHAR(100), -- mime type (application/pdf, image/png, etc.)
  file_size INTEGER, -- size in bytes

  -- Metadata
  uploaded_by UUID REFERENCES church_leaders(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique file names per church/milestone combo
  UNIQUE(church_id, milestone_id, file_name)
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_milestone_attachments_church_milestone
  ON milestone_attachments(church_id, milestone_id);

-- Enable RLS
ALTER TABLE milestone_attachments ENABLE ROW LEVEL SECURITY;

-- =====================
-- STORAGE BUCKET
-- =====================
-- Note: Run this in Supabase Dashboard > Storage, or via SQL:
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('milestone-attachments', 'milestone-attachments', true);

-- Storage policies (run after creating bucket):
-- Allow authenticated uploads (via service key)
-- Files are publicly readable once uploaded
