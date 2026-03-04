-- ============================================================
-- 092: Group Message Reactions
-- Allows group members to react to messages with emojis
-- ============================================================

CREATE TABLE IF NOT EXISTS group_message_reactions (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id  UUID        NOT NULL REFERENCES group_messages(id) ON DELETE CASCADE,
  group_id    UUID        NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
  account_id  UUID        NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  emoji       TEXT        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- One reaction per emoji per user per message
  UNIQUE (message_id, account_id, emoji)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_group_reactions_message  ON group_message_reactions (message_id);
CREATE INDEX IF NOT EXISTS idx_group_reactions_group    ON group_message_reactions (group_id);
CREATE INDEX IF NOT EXISTS idx_group_reactions_account  ON group_message_reactions (account_id);

-- RLS
ALTER TABLE group_message_reactions ENABLE ROW LEVEL SECURITY;

-- Group members can view all reactions in the group
CREATE POLICY "reactions_select" ON group_message_reactions
  FOR SELECT TO authenticated
  USING (true);

-- Authenticated users can insert their own reactions
CREATE POLICY "reactions_insert" ON group_message_reactions
  FOR INSERT TO authenticated
  WITH CHECK (account_id = auth.uid());

-- Users can only delete their own reactions
CREATE POLICY "reactions_delete" ON group_message_reactions
  FOR DELETE TO authenticated
  USING (account_id = auth.uid());

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE group_message_reactions;
