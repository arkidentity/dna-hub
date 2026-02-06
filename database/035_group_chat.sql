-- ============================================
-- Migration 035: Group Chat & Messaging
-- ============================================
-- Adds real-time group chat for DNA groups.
-- Leaders and disciples communicate within their group.
-- Supports text messages, shared content (journal/testimony/prayer),
-- and future image/GIF support.
-- ============================================

-- ============================================
-- GROUP CHAT MESSAGES
-- ============================================
CREATE TABLE IF NOT EXISTS group_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,

  -- Sender (always a disciple_app_accounts user — leaders sign up in the app too)
  sender_account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE SET NULL NOT NULL,
  sender_name TEXT NOT NULL,

  -- Content
  content TEXT,
  message_type TEXT CHECK (message_type IN (
    'text',
    'shared_journal',
    'shared_testimony',
    'shared_prayer_card',
    'image',
    'gif',
    'event'
  )) NOT NULL DEFAULT 'text',

  -- Shared content reference (for shared_journal, shared_testimony, shared_prayer_card)
  shared_content JSONB,

  -- Image/GIF (Phase 2)
  media_url TEXT,

  -- Edit/Delete
  edited_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Primary query: messages for a group, newest first
CREATE INDEX IF NOT EXISTS idx_group_messages_group_created
  ON group_messages(group_id, created_at DESC);

-- Sender lookup
CREATE INDEX IF NOT EXISTS idx_group_messages_sender
  ON group_messages(sender_account_id);

-- Active messages only (excludes soft-deleted)
CREATE INDEX IF NOT EXISTS idx_group_messages_active
  ON group_messages(group_id, created_at DESC)
  WHERE deleted_at IS NULL;

-- Enable RLS
ALTER TABLE group_messages ENABLE ROW LEVEL SECURITY;

-- Members can read messages in their groups
CREATE POLICY "Members can view group messages"
ON group_messages FOR SELECT
USING (group_id IN (
  SELECT gd.group_id FROM group_disciples gd
  JOIN disciples d ON gd.disciple_id = d.id
  JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
  WHERE daa.id = auth.uid() AND gd.current_status = 'active'
));

-- Members can send messages to their groups
CREATE POLICY "Members can send messages"
ON group_messages FOR INSERT
WITH CHECK (
  sender_account_id = auth.uid()
  AND group_id IN (
    SELECT gd.group_id FROM group_disciples gd
    JOIN disciples d ON gd.disciple_id = d.id
    JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
    WHERE daa.id = auth.uid() AND gd.current_status = 'active'
  )
);

-- Senders can edit/soft-delete their own messages
CREATE POLICY "Senders can update own messages"
ON group_messages FOR UPDATE
USING (sender_account_id = auth.uid());

-- ============================================
-- GROUP MESSAGE READ RECEIPTS
-- ============================================
-- Tracks when each user last read messages in each group.
-- Used for unread count badges on the groups list page.
CREATE TABLE IF NOT EXISTS group_message_reads (
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL,
  last_read_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (account_id, group_id)
);

ALTER TABLE group_message_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own read receipts"
ON group_message_reads FOR ALL
USING (account_id = auth.uid());

-- ============================================
-- ENABLE REALTIME FOR GROUP MESSAGES
-- ============================================
-- This allows Supabase Realtime to broadcast INSERT/UPDATE events
-- on the group_messages table to subscribed clients.
ALTER PUBLICATION supabase_realtime ADD TABLE group_messages;
