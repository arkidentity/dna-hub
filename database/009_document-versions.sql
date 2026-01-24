-- Migration: Document Versioning
-- Run this in Supabase SQL Editor

-- 1. Create document_versions table to track all versions
CREATE TABLE IF NOT EXISTS document_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES funnel_documents(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL DEFAULT 1,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  uploaded_by TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure version numbers are unique per document
  UNIQUE(document_id, version_number)
);

-- 2. Add version tracking columns to funnel_documents
ALTER TABLE funnel_documents
ADD COLUMN IF NOT EXISTS current_version INTEGER DEFAULT 1;

ALTER TABLE funnel_documents
ADD COLUMN IF NOT EXISTS uploaded_by TEXT;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX IF NOT EXISTS idx_document_versions_created_at ON document_versions(created_at);

-- 4. Enable RLS
ALTER TABLE document_versions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy
DROP POLICY IF EXISTS "Service role can manage document versions" ON document_versions;
CREATE POLICY "Service role can manage document versions" ON document_versions
  FOR ALL USING (true);

-- 6. Grant permissions
GRANT ALL ON document_versions TO service_role;

-- 7. Create function to archive current version before update
-- This is called automatically when a new file is uploaded
CREATE OR REPLACE FUNCTION archive_document_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Only archive if there's an existing file being replaced
  IF OLD.file_url IS NOT NULL AND OLD.file_url != NEW.file_url THEN
    INSERT INTO document_versions (
      document_id,
      version_number,
      file_url,
      uploaded_by,
      created_at
    ) VALUES (
      OLD.id,
      COALESCE(OLD.current_version, 1),
      OLD.file_url,
      OLD.uploaded_by,
      OLD.updated_at
    );

    -- Increment version number
    NEW.current_version := COALESCE(OLD.current_version, 1) + 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Create trigger on funnel_documents
DROP TRIGGER IF EXISTS archive_document_on_update ON funnel_documents;
CREATE TRIGGER archive_document_on_update
  BEFORE UPDATE OF file_url ON funnel_documents
  FOR EACH ROW
  EXECUTE FUNCTION archive_document_version();
