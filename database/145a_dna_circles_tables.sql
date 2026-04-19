-- ============================================================
-- Migration 145a: DNA Circles — Tables, indexes, RLS only
-- Run this first, then run 145b_dna_circles_functions.sql
-- Safe to re-run (uses IF NOT EXISTS / DO blocks for idempotency)
-- ============================================================

-- ============================================================
-- 1. Core tables
-- ============================================================

CREATE TABLE IF NOT EXISTS disciple_circles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL CHECK (char_length(TRIM(name)) >= 1),
  created_by  UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS circle_members (
  circle_id   UUID NOT NULL REFERENCES disciple_circles(id) ON DELETE CASCADE,
  account_id  UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('host', 'member')) DEFAULT 'member',
  joined_at   TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (circle_id, account_id)
);

CREATE TABLE IF NOT EXISTS circle_invitations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  circle_id       UUID NOT NULL REFERENCES disciple_circles(id) ON DELETE CASCADE,
  invited_by      UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  invited_email   TEXT NOT NULL,
  status          TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  responded_at    TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS circle_message_reads (
  circle_id    UUID NOT NULL REFERENCES disciple_circles(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (circle_id, account_id)
);

-- ============================================================
-- 2. Make group_messages polymorphic
-- ============================================================

ALTER TABLE group_messages ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES disciple_circles(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_messages_source_check'
  ) THEN
    ALTER TABLE group_messages
      ADD CONSTRAINT group_messages_source_check
      CHECK (
        (group_id IS NOT NULL AND circle_id IS NULL) OR
        (group_id IS NULL  AND circle_id IS NOT NULL)
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_group_messages_circle
  ON group_messages (circle_id, created_at DESC)
  WHERE circle_id IS NOT NULL;

-- ============================================================
-- 3. Make group_message_reactions polymorphic
-- ============================================================

ALTER TABLE group_message_reactions ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE group_message_reactions
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES disciple_circles(id) ON DELETE CASCADE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'group_message_reactions_source_check'
  ) THEN
    ALTER TABLE group_message_reactions
      ADD CONSTRAINT group_message_reactions_source_check
      CHECK (
        (group_id IS NOT NULL AND circle_id IS NULL) OR
        (group_id IS NULL  AND circle_id IS NOT NULL)
      );
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS idx_group_message_reactions_circle
  ON group_message_reactions (circle_id)
  WHERE circle_id IS NOT NULL;

-- ============================================================
-- 4. Indexes on new tables
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_circle_members_account
  ON circle_members (account_id);

CREATE INDEX IF NOT EXISTS idx_circle_invitations_email_status
  ON circle_invitations (invited_email, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_circle_invitations_circle
  ON circle_invitations (circle_id, status);

-- ============================================================
-- 5. Updated_at trigger
-- ============================================================

CREATE OR REPLACE FUNCTION update_disciple_circles_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $trig$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$trig$;

DROP TRIGGER IF EXISTS trg_disciple_circles_updated_at ON disciple_circles;
CREATE TRIGGER trg_disciple_circles_updated_at
  BEFORE UPDATE ON disciple_circles
  FOR EACH ROW EXECUTE FUNCTION update_disciple_circles_updated_at();

-- ============================================================
-- 6. Enable Realtime
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE disciple_circles;
ALTER PUBLICATION supabase_realtime ADD TABLE circle_members;
ALTER PUBLICATION supabase_realtime ADD TABLE circle_invitations;
ALTER PUBLICATION supabase_realtime ADD TABLE circle_message_reads;

-- ============================================================
-- 7. RLS
-- ============================================================

ALTER TABLE disciple_circles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members       ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invitations   ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_message_reads ENABLE ROW LEVEL SECURITY;

-- disciple_circles
CREATE POLICY "Circle members can view their circles"
  ON disciple_circles FOR SELECT
  USING (id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid()));

CREATE POLICY "Authenticated can create circle"
  ON disciple_circles FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Host can update circle"
  ON disciple_circles FOR UPDATE
  USING (id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid() AND role = 'host'));

CREATE POLICY "Host can delete circle"
  ON disciple_circles FOR DELETE
  USING (id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid() AND role = 'host'));

-- circle_members
CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM circle_members cm WHERE cm.account_id = auth.uid()));

CREATE POLICY "RPCs can insert members"
  ON circle_members FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members can remove themselves"
  ON circle_members FOR DELETE
  USING (account_id = auth.uid());

CREATE POLICY "Host can remove any member"
  ON circle_members FOR DELETE
  USING (
    circle_id IN (
      SELECT circle_id FROM circle_members cm
      WHERE cm.account_id = auth.uid() AND cm.role = 'host'
    )
  );

-- circle_invitations
CREATE POLICY "Circle members can view invitations"
  ON circle_invitations FOR SELECT
  USING (circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid()));

CREATE POLICY "RPCs can manage invitations"
  ON circle_invitations FOR ALL
  USING (true) WITH CHECK (true);

-- circle_message_reads
CREATE POLICY "Users can manage their own read receipts"
  ON circle_message_reads FOR ALL
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- group_messages: circle access
CREATE POLICY "Circle members can view circle messages"
  ON group_messages FOR SELECT
  USING (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Circle members can send circle messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Senders can edit their circle messages"
  ON group_messages FOR UPDATE
  USING (circle_id IS NOT NULL AND sender_account_id = auth.uid());

-- group_message_reactions: circle access
CREATE POLICY "Circle members can view circle reactions"
  ON group_message_reactions FOR SELECT
  USING (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Circle members can react to circle messages"
  ON group_message_reactions FOR INSERT
  WITH CHECK (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Users can remove their own circle reactions"
  ON group_message_reactions FOR DELETE
  USING (circle_id IS NOT NULL AND account_id = auth.uid());
