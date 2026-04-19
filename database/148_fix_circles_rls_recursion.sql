-- ============================================================
-- Migration 148: Fix infinite recursion in circle_members RLS
--
-- The policy "Circle members can view memberships" on
-- circle_members queries circle_members in a subquery, which
-- re-triggers the same policy → infinite recursion (error
-- 42P17). This also cascades into group_messages and
-- group_message_reactions, because the circle SELECT policies
-- there read circle_members, inheriting the recursion.
--
-- Fix (pattern matches get_my_group_ids from migration 040):
--   1. Add SECURITY DEFINER helpers that bypass RLS:
--        get_my_circle_ids()       — all circles I'm in
--        get_my_host_circle_ids()  — circles where I'm host
--   2. Rewrite every policy that reads circle_members via a
--      subquery to call the helper instead. Helpers run as
--      postgres, so no recursion.
-- ============================================================

-- ---------- Helper functions ----------

CREATE OR REPLACE FUNCTION get_my_circle_ids()
RETURNS UUID[] LANGUAGE sql SECURITY DEFINER STABLE AS $fn_get_my_circle_ids$
  SELECT COALESCE(ARRAY_AGG(circle_id), ARRAY[]::UUID[])
  FROM circle_members
  WHERE account_id = auth.uid();
$fn_get_my_circle_ids$;

CREATE OR REPLACE FUNCTION get_my_host_circle_ids()
RETURNS UUID[] LANGUAGE sql SECURITY DEFINER STABLE AS $fn_get_my_host_circle_ids$
  SELECT COALESCE(ARRAY_AGG(circle_id), ARRAY[]::UUID[])
  FROM circle_members
  WHERE account_id = auth.uid() AND role = 'host';
$fn_get_my_host_circle_ids$;

GRANT EXECUTE ON FUNCTION get_my_circle_ids()      TO authenticated;
GRANT EXECUTE ON FUNCTION get_my_host_circle_ids() TO authenticated;

-- ---------- disciple_circles ----------

DROP POLICY IF EXISTS "Circle members can view their circles" ON disciple_circles;
DROP POLICY IF EXISTS "Host can update circle"                ON disciple_circles;
DROP POLICY IF EXISTS "Host can delete circle"                ON disciple_circles;

CREATE POLICY "Circle members can view their circles"
  ON disciple_circles FOR SELECT
  USING (id = ANY(get_my_circle_ids()));

CREATE POLICY "Host can update circle"
  ON disciple_circles FOR UPDATE
  USING (id = ANY(get_my_host_circle_ids()));

CREATE POLICY "Host can delete circle"
  ON disciple_circles FOR DELETE
  USING (id = ANY(get_my_host_circle_ids()));

-- ---------- circle_members (the recursion source) ----------

DROP POLICY IF EXISTS "Circle members can view memberships" ON circle_members;
DROP POLICY IF EXISTS "Host can remove any member"          ON circle_members;

CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (circle_id = ANY(get_my_circle_ids()));

CREATE POLICY "Host can remove any member"
  ON circle_members FOR DELETE
  USING (circle_id = ANY(get_my_host_circle_ids()));

-- ---------- circle_invitations ----------

DROP POLICY IF EXISTS "Circle members can view invitations" ON circle_invitations;

CREATE POLICY "Circle members can view invitations"
  ON circle_invitations FOR SELECT
  USING (circle_id = ANY(get_my_circle_ids()));

-- ---------- group_messages (circle path) ----------

DROP POLICY IF EXISTS "Circle members can view circle messages" ON group_messages;
DROP POLICY IF EXISTS "Circle members can send circle messages" ON group_messages;

CREATE POLICY "Circle members can view circle messages"
  ON group_messages FOR SELECT
  USING (circle_id IS NOT NULL AND circle_id = ANY(get_my_circle_ids()));

CREATE POLICY "Circle members can send circle messages"
  ON group_messages FOR INSERT
  WITH CHECK (
    circle_id IS NOT NULL
    AND sender_account_id = auth.uid()
    AND circle_id = ANY(get_my_circle_ids())
  );

-- ---------- group_message_reactions (circle path) ----------

DROP POLICY IF EXISTS "Circle members can view circle reactions"    ON group_message_reactions;
DROP POLICY IF EXISTS "Circle members can react to circle messages" ON group_message_reactions;

CREATE POLICY "Circle members can view circle reactions"
  ON group_message_reactions FOR SELECT
  USING (circle_id IS NOT NULL AND circle_id = ANY(get_my_circle_ids()));

CREATE POLICY "Circle members can react to circle messages"
  ON group_message_reactions FOR INSERT
  WITH CHECK (
    circle_id IS NOT NULL
    AND account_id = auth.uid()
    AND circle_id = ANY(get_my_circle_ids())
  );
