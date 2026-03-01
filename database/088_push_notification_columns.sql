-- Migration 088: Add push notification preference columns and event reminder tracking
--
-- Adds message_alerts and event_reminders to disciple_notification_prefs,
-- and reminder_sent_at to dna_calendar_events for dedup.

-- New notification preference columns
ALTER TABLE disciple_notification_prefs
  ADD COLUMN IF NOT EXISTS message_alerts BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS event_reminders BOOLEAN DEFAULT TRUE;

-- Track which calendar events have already had reminders sent
ALTER TABLE dna_calendar_events
  ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;
