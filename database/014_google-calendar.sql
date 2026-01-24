-- Migration: Google Calendar Integration
-- Run this in Supabase SQL Editor

-- 1. Store Google OAuth tokens for admin
CREATE TABLE IF NOT EXISTS google_oauth_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_email TEXT UNIQUE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  token_expiry TIMESTAMPTZ NOT NULL,
  calendar_id TEXT DEFAULT 'primary',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add google_event_id to scheduled_calls for sync tracking
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS google_event_id TEXT UNIQUE;

-- 3. Add meet_link to scheduled_calls
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS meet_link TEXT;

-- 4. Create table to track unmatched calendar events
-- Events that couldn't be matched to a church automatically
CREATE TABLE IF NOT EXISTS unmatched_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  google_event_id TEXT UNIQUE NOT NULL,
  event_title TEXT NOT NULL,
  event_start TIMESTAMPTZ NOT NULL,
  event_end TIMESTAMPTZ,
  attendee_emails TEXT[], -- Array of attendee emails
  meet_link TEXT,
  matched_church_id UUID REFERENCES churches(id) ON DELETE SET NULL,
  matched_at TIMESTAMPTZ,
  matched_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_google_event_id
ON scheduled_calls(google_event_id);

CREATE INDEX IF NOT EXISTS idx_unmatched_events_google_id
ON unmatched_calendar_events(google_event_id);

-- 6. Enable RLS
ALTER TABLE google_oauth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_calendar_events ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies (service role only - these are admin operations)
DROP POLICY IF EXISTS "Service role can manage oauth tokens" ON google_oauth_tokens;
CREATE POLICY "Service role can manage oauth tokens" ON google_oauth_tokens
  FOR ALL USING (true);

DROP POLICY IF EXISTS "Service role can manage unmatched events" ON unmatched_calendar_events;
CREATE POLICY "Service role can manage unmatched events" ON unmatched_calendar_events
  FOR ALL USING (true);

-- 8. Grant permissions
GRANT ALL ON google_oauth_tokens TO service_role;
GRANT ALL ON unmatched_calendar_events TO service_role;

-- 9. Create sync_log to track calendar sync runs
CREATE TABLE IF NOT EXISTS calendar_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sync_started_at TIMESTAMPTZ DEFAULT NOW(),
  sync_completed_at TIMESTAMPTZ,
  events_processed INTEGER DEFAULT 0,
  events_synced INTEGER DEFAULT 0,
  events_unmatched INTEGER DEFAULT 0,
  errors TEXT[],
  success BOOLEAN DEFAULT true
);

ALTER TABLE calendar_sync_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Service role can manage sync log" ON calendar_sync_log;
CREATE POLICY "Service role can manage sync log" ON calendar_sync_log
  FOR ALL USING (true);

GRANT ALL ON calendar_sync_log TO service_role;
