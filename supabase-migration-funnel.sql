-- Migration: Funnel System Tables
-- Run this in Supabase SQL Editor

-- 1. Email Subscribers (landing page email capture)
CREATE TABLE IF NOT EXISTS email_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  manual_sent BOOLEAN DEFAULT FALSE,
  assessment_started BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Funnel Documents (discovery notes, proposals, agreements)
CREATE TABLE IF NOT EXISTS funnel_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN ('discovery_notes', 'proposal_pdf', 'agreement_notes', 'agreement_pdf', '3_steps_pdf')),
  file_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Scheduled Calls (appointments)
CREATE TABLE IF NOT EXISTS scheduled_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('discovery', 'proposal', 'strategy')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Update churches table to add new status values
-- First, drop the existing constraint if it exists
ALTER TABLE churches
DROP CONSTRAINT IF EXISTS churches_status_check;

-- Add the new constraint with expanded status values
ALTER TABLE churches
ADD CONSTRAINT churches_status_check
CHECK (status IN (
  'pending_assessment',
  'awaiting_discovery',
  'proposal_sent',
  'awaiting_agreement',
  'awaiting_strategy',
  'active',
  'completed',
  'paused',
  'declined'
));

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_email_subscribers_email ON email_subscribers(email);
CREATE INDEX IF NOT EXISTS idx_funnel_documents_church_id ON funnel_documents(church_id);
CREATE INDEX IF NOT EXISTS idx_funnel_documents_type ON funnel_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_church_id ON scheduled_calls(church_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_scheduled_at ON scheduled_calls(scheduled_at);

-- 6. Enable RLS
ALTER TABLE email_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE funnel_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_calls ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for email_subscribers (admin only)
DROP POLICY IF EXISTS "Service role can manage subscribers" ON email_subscribers;
CREATE POLICY "Service role can manage subscribers" ON email_subscribers
  FOR ALL USING (true);

-- 8. RLS Policies for funnel_documents
DROP POLICY IF EXISTS "Service role can manage funnel documents" ON funnel_documents;
CREATE POLICY "Service role can manage funnel documents" ON funnel_documents
  FOR ALL USING (true);

-- 9. RLS Policies for scheduled_calls
DROP POLICY IF EXISTS "Service role can manage scheduled calls" ON scheduled_calls;
CREATE POLICY "Service role can manage scheduled calls" ON scheduled_calls
  FOR ALL USING (true);

-- 10. Grant permissions
GRANT ALL ON email_subscribers TO service_role;
GRANT ALL ON funnel_documents TO service_role;
GRANT ALL ON scheduled_calls TO service_role;

-- 11. Create storage bucket for funnel documents
-- Run this in the Supabase Dashboard under Storage:
-- Create a new bucket called 'funnel-documents' with public access
-- Or run via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('funnel-documents', 'funnel-documents', true)
ON CONFLICT (id) DO NOTHING;

-- 12. Storage policies for funnel-documents bucket
DROP POLICY IF EXISTS "Service role can upload to funnel-documents" ON storage.objects;
CREATE POLICY "Service role can upload to funnel-documents"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'funnel-documents');

DROP POLICY IF EXISTS "Service role can update funnel-documents" ON storage.objects;
CREATE POLICY "Service role can update funnel-documents"
ON storage.objects FOR UPDATE
TO service_role
USING (bucket_id = 'funnel-documents');

DROP POLICY IF EXISTS "Service role can delete from funnel-documents" ON storage.objects;
CREATE POLICY "Service role can delete from funnel-documents"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'funnel-documents');

DROP POLICY IF EXISTS "Public can read funnel-documents" ON storage.objects;
CREATE POLICY "Public can read funnel-documents"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'funnel-documents');
