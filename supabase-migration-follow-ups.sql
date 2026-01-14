-- Migration: Follow-up Email Tracking
-- Run this in Supabase SQL Editor

-- 1. Add table to track which follow-up emails have been sent
-- This prevents duplicate emails from being sent
CREATE TABLE IF NOT EXISTS follow_up_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL CHECK (email_type IN (
    'book_discovery_reminder',     -- 3 days after assessment, no call booked
    'call_reminder_24h',           -- 24 hours before scheduled call
    'call_missed',                 -- Call time passed without completion
    'proposal_expiring',           -- 7 days after proposal sent
    'inactive_reminder',           -- 14 days with no progress
    'milestone_stalled'            -- 7 days on same milestone
  )),
  scheduled_call_id UUID REFERENCES scheduled_calls(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate emails for the same trigger
  UNIQUE(church_id, email_type, scheduled_call_id)
);

-- 2. Add reminder_sent flag to scheduled_calls if not exists
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;

-- 3. Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_church_id ON follow_up_emails(church_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_type ON follow_up_emails(email_type);
CREATE INDEX IF NOT EXISTS idx_follow_up_emails_sent_at ON follow_up_emails(sent_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_reminder_sent ON scheduled_calls(reminder_sent);

-- 4. Enable RLS
ALTER TABLE follow_up_emails ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policy
DROP POLICY IF EXISTS "Service role can manage follow up emails" ON follow_up_emails;
CREATE POLICY "Service role can manage follow up emails" ON follow_up_emails
  FOR ALL USING (true);

-- 6. Grant permissions
GRANT ALL ON follow_up_emails TO service_role;
