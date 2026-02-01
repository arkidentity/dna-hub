-- =============================================
-- Migration 027: Training Manual Features
-- Adds tables for session notes and bookmarks
-- =============================================

-- User Session Notes
-- Stores personal notes for each session
CREATE TABLE IF NOT EXISTS user_session_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, session_id)
);

-- User Bookmarks
-- Stores bookmarks for quick access to content
CREATE TABLE IF NOT EXISTS user_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content_type VARCHAR(50) NOT NULL, -- 'manual_session', 'launch_guide_phase', etc.
  content_id VARCHAR(50) NOT NULL, -- session id, phase id, etc.
  lesson_id INTEGER, -- optional: specific lesson within session
  position INTEGER, -- optional: scroll position or paragraph index
  label VARCHAR(255), -- optional: user-defined label
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, content_type, content_id)
);

-- User Training Certificates
-- Tracks completion certificates earned
CREATE TABLE IF NOT EXISTS user_training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  certificate_type VARCHAR(50) NOT NULL, -- 'dna_manual', 'launch_guide', 'full_training'
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number VARCHAR(50) UNIQUE, -- formatted certificate ID
  metadata JSONB DEFAULT '{}', -- completion stats, dates, etc.
  UNIQUE(user_id, certificate_type)
);

-- Add indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_user_session_notes_user_id ON user_session_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bookmarks_user_id ON user_bookmarks(user_id);
CREATE INDEX IF NOT EXISTS idx_user_training_certificates_user_id ON user_training_certificates(user_id);

-- Add RLS policies
ALTER TABLE user_session_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_certificates ENABLE ROW LEVEL SECURITY;

-- Users can only access their own data
CREATE POLICY user_session_notes_policy ON user_session_notes
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_bookmarks_policy ON user_bookmarks
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY user_training_certificates_policy ON user_training_certificates
  FOR ALL USING (user_id = auth.uid());

-- Service role can access all
CREATE POLICY user_session_notes_service ON user_session_notes
  FOR ALL TO service_role USING (true);

CREATE POLICY user_bookmarks_service ON user_bookmarks
  FOR ALL TO service_role USING (true);

CREATE POLICY user_training_certificates_service ON user_training_certificates
  FOR ALL TO service_role USING (true);

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_num TEXT;
  year_part TEXT;
  random_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  cert_num := 'DNA-' || year_part || '-' || random_part;
  RETURN cert_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate certificate number
CREATE OR REPLACE FUNCTION set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_certificate_number
  BEFORE INSERT ON user_training_certificates
  FOR EACH ROW
  EXECUTE FUNCTION set_certificate_number();
