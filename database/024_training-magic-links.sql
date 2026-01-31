-- =====================================================
-- TRAINING MAGIC LINKS
-- =====================================================
-- Migration: 024
-- Description: Magic link tokens for training platform authentication
-- Created: 2026-01-30

-- =====================================================
-- TABLE: training_magic_links
-- =====================================================
-- Stores magic link tokens for passwordless login

CREATE TABLE IF NOT EXISTS training_magic_links (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Token
  token TEXT NOT NULL UNIQUE,

  -- Expiration and usage
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMPTZ,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- IP and user agent for security auditing (optional)
  ip_address TEXT,
  user_agent TEXT
);

-- Indexes
CREATE INDEX idx_training_magic_links_token ON training_magic_links(token);
CREATE INDEX idx_training_magic_links_user_id ON training_magic_links(user_id);
CREATE INDEX idx_training_magic_links_expires ON training_magic_links(expires_at);

-- Enable RLS
ALTER TABLE training_magic_links ENABLE ROW LEVEL SECURITY;

-- Policy: Only service role can access (no direct user access)
-- Users interact via API routes only
CREATE POLICY "Service role only"
  ON training_magic_links
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Auto-cleanup old tokens (older than 7 days)
-- This can be run periodically via a cron job or Supabase scheduled function
CREATE OR REPLACE FUNCTION cleanup_old_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM training_magic_links
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON TABLE training_magic_links IS 'Magic link tokens for passwordless training platform authentication';
COMMENT ON COLUMN training_magic_links.token IS 'Unique token sent via email for authentication';
COMMENT ON COLUMN training_magic_links.expires_at IS 'Token expiration time (24 hours from creation)';
