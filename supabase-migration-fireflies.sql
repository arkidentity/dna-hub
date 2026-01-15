-- Migration: Fireflies.ai Integration for Meeting Notes (Phase 2)
-- Description: Adds tables and columns for storing meeting transcripts, AI summaries, and Fireflies metadata

-- ============================================================================
-- 1. Add Fireflies columns to scheduled_calls table
-- ============================================================================

-- Add columns to existing scheduled_calls table
ALTER TABLE scheduled_calls
ADD COLUMN IF NOT EXISTS fireflies_meeting_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS transcript_url TEXT,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS action_items TEXT[],
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS transcript_processed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS visible_to_church BOOLEAN DEFAULT false;

-- Create index for faster lookup by Fireflies meeting ID
CREATE INDEX IF NOT EXISTS idx_scheduled_calls_fireflies_meeting_id
ON scheduled_calls(fireflies_meeting_id);

-- ============================================================================
-- 2. Create meeting_transcripts table for full transcript data
-- ============================================================================

CREATE TABLE IF NOT EXISTS meeting_transcripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_call_id UUID REFERENCES scheduled_calls(id) ON DELETE CASCADE,
  fireflies_meeting_id TEXT UNIQUE NOT NULL,

  -- Meeting metadata
  title TEXT NOT NULL,
  duration INTEGER, -- in seconds
  meeting_date TIMESTAMPTZ,
  participants TEXT[], -- array of participant names/emails

  -- Transcript data
  full_transcript TEXT, -- complete transcript text
  sentences JSONB, -- array of {text, speaker_id, start_time} objects

  -- AI-generated content
  ai_summary TEXT,
  action_items TEXT[],
  keywords TEXT[],
  key_moments JSONB, -- array of important moments with timestamps

  -- URLs and files
  transcript_url TEXT,
  audio_url TEXT,
  video_url TEXT,

  -- Processing metadata
  processed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_scheduled_call
ON meeting_transcripts(scheduled_call_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_fireflies_meeting
ON meeting_transcripts(fireflies_meeting_id);

CREATE INDEX IF NOT EXISTS idx_meeting_transcripts_meeting_date
ON meeting_transcripts(meeting_date);

-- ============================================================================
-- 3. Create fireflies_webhook_log table for debugging
-- ============================================================================

CREATE TABLE IF NOT EXISTS fireflies_webhook_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Webhook data
  fireflies_meeting_id TEXT,
  event_type TEXT,
  client_reference_id TEXT,
  payload JSONB,

  -- Processing status
  processed BOOLEAN DEFAULT false,
  matched_church_id UUID REFERENCES churches(id),
  matched_call_id UUID REFERENCES scheduled_calls(id),
  error_message TEXT,

  -- Timestamps
  received_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_fireflies_webhook_log_meeting_id
ON fireflies_webhook_log(fireflies_meeting_id);

CREATE INDEX IF NOT EXISTS idx_fireflies_webhook_log_processed
ON fireflies_webhook_log(processed);

CREATE INDEX IF NOT EXISTS idx_fireflies_webhook_log_received_at
ON fireflies_webhook_log(received_at DESC);

-- ============================================================================
-- 4. Create fireflies_settings table for API configuration
-- ============================================================================

CREATE TABLE IF NOT EXISTS fireflies_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- API credentials (encrypted in application layer)
  api_key TEXT NOT NULL,
  webhook_secret TEXT, -- for verifying webhook signatures

  -- Configuration
  admin_email TEXT NOT NULL UNIQUE,
  auto_process_enabled BOOLEAN DEFAULT true,
  auto_match_enabled BOOLEAN DEFAULT true,
  auto_share_with_churches BOOLEAN DEFAULT false, -- require manual approval

  -- Metadata
  connected_at TIMESTAMPTZ DEFAULT NOW(),
  last_webhook_received_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. Create unmatched_fireflies_meetings table
-- ============================================================================

CREATE TABLE IF NOT EXISTS unmatched_fireflies_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Meeting data
  fireflies_meeting_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meeting_date TIMESTAMPTZ,
  participants TEXT[],
  duration INTEGER,

  -- Transcript summary
  ai_summary TEXT,
  transcript_url TEXT,

  -- Matching attempts
  match_attempted BOOLEAN DEFAULT false,
  match_attempt_count INTEGER DEFAULT 0,
  last_match_attempt TIMESTAMPTZ,

  -- Manual resolution
  matched_church_id UUID REFERENCES churches(id),
  matched_call_id UUID REFERENCES scheduled_calls(id),
  matched_at TIMESTAMPTZ,
  matched_by TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_unmatched_fireflies_meeting_id
ON unmatched_fireflies_meetings(fireflies_meeting_id);

CREATE INDEX IF NOT EXISTS idx_unmatched_fireflies_matched
ON unmatched_fireflies_meetings(matched_church_id)
WHERE matched_church_id IS NOT NULL;

-- ============================================================================
-- 6. Add RLS (Row Level Security) Policies
-- ============================================================================

-- Enable RLS on new tables
ALTER TABLE meeting_transcripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE fireflies_webhook_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE fireflies_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE unmatched_fireflies_meetings ENABLE ROW LEVEL SECURITY;

-- meeting_transcripts: Church leaders can view their own transcripts if visible
CREATE POLICY meeting_transcripts_church_view ON meeting_transcripts
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM scheduled_calls sc
      JOIN church_leaders cl ON cl.church_id = sc.church_id
      WHERE sc.id = meeting_transcripts.scheduled_call_id
        AND cl.email = auth.jwt() ->> 'email'
        AND sc.completed = true
        AND (
          meeting_transcripts.scheduled_call_id IN (
            SELECT id FROM scheduled_calls WHERE visible_to_church = true
          )
        )
    )
  );

-- meeting_transcripts: Admins can view all transcripts
CREATE POLICY meeting_transcripts_admin_all ON meeting_transcripts
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
  );

-- fireflies_webhook_log: Admin only
CREATE POLICY fireflies_webhook_log_admin ON fireflies_webhook_log
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
  );

-- fireflies_settings: Admin only
CREATE POLICY fireflies_settings_admin ON fireflies_settings
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
  );

-- unmatched_fireflies_meetings: Admin only
CREATE POLICY unmatched_fireflies_meetings_admin ON unmatched_fireflies_meetings
  FOR ALL
  USING (
    auth.jwt() ->> 'email' IN ('thearkidentity@gmail.com', 'travis@arkidentity.com')
  );

-- ============================================================================
-- 7. Create helper functions
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
CREATE TRIGGER update_meeting_transcripts_updated_at BEFORE UPDATE ON meeting_transcripts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_fireflies_settings_updated_at BEFORE UPDATE ON fireflies_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_unmatched_fireflies_meetings_updated_at BEFORE UPDATE ON unmatched_fireflies_meetings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 8. Add comments for documentation
-- ============================================================================

COMMENT ON TABLE meeting_transcripts IS 'Stores full transcript data from Fireflies.ai meetings';
COMMENT ON TABLE fireflies_webhook_log IS 'Logs all webhook events from Fireflies for debugging';
COMMENT ON TABLE fireflies_settings IS 'Stores Fireflies API configuration and settings';
COMMENT ON TABLE unmatched_fireflies_meetings IS 'Meetings that could not be automatically matched to churches';

COMMENT ON COLUMN scheduled_calls.fireflies_meeting_id IS 'Fireflies meeting ID for linking to transcript data';
COMMENT ON COLUMN scheduled_calls.visible_to_church IS 'Whether church leaders can view this transcript';
COMMENT ON COLUMN meeting_transcripts.sentences IS 'Array of transcript sentences with speaker and timing data';
COMMENT ON COLUMN meeting_transcripts.key_moments IS 'Important moments identified by Fireflies AI';
