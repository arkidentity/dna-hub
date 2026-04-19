-- ============================================================
-- Migration 147: Re-assert group_messages RLS policies
--
-- Symptom after 145a: existing group messages appeared "gone"
-- to authenticated clients, and new sends were rejected.
--
-- Root cause is suspected to be that when multiple policies
-- were added to group_messages, Postgres evaluates policies
-- as OR for reads but the send path hit one of the new
-- circle-only policies with WITH CHECK (circle_id IS NOT NULL),
-- which silently rejects group inserts if the old group INSERT
-- policy isn't present or is ordered wrong.
--
-- This migration defensively DROPs + re-CREATEs the group
-- policies from migration 040, ensuring both group and circle
-- policies coexist on group_messages.
-- ============================================================

-- Drop the old group policies if present (idempotent)
DROP POLICY IF EXISTS "Members can view group messages"     ON group_messages;
DROP POLICY IF EXISTS "Members can send messages"           ON group_messages;
DROP POLICY IF EXISTS "Senders can update own messages"     ON group_messages;

-- Re-create group policies (group_id path)
CREATE POLICY "Members can view group messages"
  ON group_messages FOR SELECT
  USING (group_id IS NOT NULL AND group_id = ANY(get_my_group_ids()));

CREATE POLICY "Members can send messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    group_id IS NOT NULL
    AND sender_account_id = auth.uid()
    AND group_id = ANY(get_my_group_ids())
  );

CREATE POLICY "Senders can update own messages"
  ON group_messages FOR UPDATE
  USING (group_id IS NOT NULL AND sender_account_id = auth.uid());

-- Also re-assert the circle policies so both paths coexist cleanly.
DROP POLICY IF EXISTS "Circle members can view circle messages"   ON group_messages;
DROP POLICY IF EXISTS "Circle members can send circle messages"   ON group_messages;
DROP POLICY IF EXISTS "Senders can edit their circle messages"    ON group_messages;

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
    sender_account_id = auth.uid() AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Senders can edit their circle messages"
  ON group_messages FOR UPDATE
  USING (circle_id IS NOT NULL AND sender_account_id = auth.uid());

-- ============================================================
-- Same fix for group_message_reactions
-- ============================================================

DROP POLICY IF EXISTS "Members can view reactions"          ON group_message_reactions;
DROP POLICY IF EXISTS "Members can add reactions"           ON group_message_reactions;
DROP POLICY IF EXISTS "Users can remove their own reactions" ON group_message_reactions;

CREATE POLICY "Members can view reactions"
  ON group_message_reactions FOR SELECT
  USING (
    group_id IS NOT NULL AND group_id = ANY(get_my_group_ids())
  );

CREATE POLICY "Members can add reactions"
  ON group_message_reactions FOR INSERT
  WITH CHECK (
    group_id IS NOT NULL
    AND account_id = auth.uid()
    AND group_id = ANY(get_my_group_ids())
  );

CREATE POLICY "Users can remove their own reactions"
  ON group_message_reactions FOR DELETE
  USING (group_id IS NOT NULL AND account_id = auth.uid());

-- Circle reaction policies (re-assert)
DROP POLICY IF EXISTS "Circle members can view circle reactions"   ON group_message_reactions;
DROP POLICY IF EXISTS "Circle members can react to circle messages" ON group_message_reactions;
DROP POLICY IF EXISTS "Users can remove their own circle reactions" ON group_message_reactions;

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
    account_id = auth.uid() AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Users can remove their own circle reactions"
  ON group_message_reactions FOR DELETE
  USING (circle_id IS NOT NULL AND account_id = auth.uid());
