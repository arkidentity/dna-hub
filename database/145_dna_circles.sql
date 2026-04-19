-- ============================================================
-- Migration 145: DNA Circles
-- Peer-led accountability groups for Daily DNA disciples.
-- Any authenticated disciple can create a circle, invite friends,
-- and use the existing chat module. Circles coexist with DNA Groups
-- in a unified chat list.
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

-- Read receipts for circle messages (separate table — group_message_reads has different PK shape)
CREATE TABLE IF NOT EXISTS circle_message_reads (
  circle_id    UUID NOT NULL REFERENCES disciple_circles(id) ON DELETE CASCADE,
  account_id   UUID NOT NULL REFERENCES disciple_app_accounts(id) ON DELETE CASCADE,
  last_read_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (circle_id, account_id)
);

-- ============================================================
-- 2. Make group_messages polymorphic (groups + circles)
-- ============================================================

-- Drop NOT NULL on group_id so a row can belong to either a group or a circle
ALTER TABLE group_messages ALTER COLUMN group_id DROP NOT NULL;

-- Add circle_id column
ALTER TABLE group_messages
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES disciple_circles(id) ON DELETE CASCADE;

-- Exactly one of group_id / circle_id must be set
ALTER TABLE group_messages
  ADD CONSTRAINT group_messages_source_check
  CHECK (
    (group_id IS NOT NULL AND circle_id IS NULL) OR
    (group_id IS NULL  AND circle_id IS NOT NULL)
  );

-- Index for circle message queries
CREATE INDEX IF NOT EXISTS idx_group_messages_circle
  ON group_messages (circle_id, created_at DESC)
  WHERE circle_id IS NOT NULL;

-- ============================================================
-- 3. Make group_message_reactions polymorphic
-- ============================================================

ALTER TABLE group_message_reactions ALTER COLUMN group_id DROP NOT NULL;

ALTER TABLE group_message_reactions
  ADD COLUMN IF NOT EXISTS circle_id UUID REFERENCES disciple_circles(id) ON DELETE CASCADE;

ALTER TABLE group_message_reactions
  ADD CONSTRAINT group_message_reactions_source_check
  CHECK (
    (group_id IS NOT NULL AND circle_id IS NULL) OR
    (group_id IS NULL  AND circle_id IS NOT NULL)
  );

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
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

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
-- group_messages already in supabase_realtime

-- ============================================================
-- 7. RLS
-- ============================================================

ALTER TABLE disciple_circles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_members      ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_invitations  ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_message_reads ENABLE ROW LEVEL SECURITY;

-- disciple_circles: members can read; only host can update/delete
CREATE POLICY "Circle members can view their circles"
  ON disciple_circles FOR SELECT
  USING (
    id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Host can update circle"
  ON disciple_circles FOR UPDATE
  USING (
    id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid() AND role = 'host')
  );

CREATE POLICY "Host can delete circle"
  ON disciple_circles FOR DELETE
  USING (
    id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid() AND role = 'host')
  );

CREATE POLICY "Authenticated can create circle"
  ON disciple_circles FOR INSERT
  WITH CHECK (created_by = auth.uid());

-- circle_members: members can view; only host can delete others
CREATE POLICY "Circle members can view memberships"
  ON circle_members FOR SELECT
  USING (
    circle_id IN (SELECT circle_id FROM circle_members cm WHERE cm.account_id = auth.uid())
  );

CREATE POLICY "Host can insert members (via RPC)"
  ON circle_members FOR INSERT
  WITH CHECK (true); -- RPCs use SECURITY DEFINER

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

-- circle_invitations: members can read pending invitations for their circles;
-- invitees can see their own invitations by email match (via RPC)
CREATE POLICY "Circle members can view invitations"
  ON circle_invitations FOR SELECT
  USING (
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "RPCs can manage invitations"
  ON circle_invitations FOR ALL
  USING (true) WITH CHECK (true); -- All mutation via SECURITY DEFINER RPCs

-- circle_message_reads
CREATE POLICY "Users can manage their own read receipts"
  ON circle_message_reads FOR ALL
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- group_messages: add circle member access policies
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
  USING (
    circle_id IS NOT NULL AND
    sender_account_id = auth.uid()
  );

-- group_message_reactions: circle access
CREATE POLICY "Circle members can react to circle messages"
  ON group_message_reactions FOR INSERT
  WITH CHECK (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Circle members can view circle reactions"
  ON group_message_reactions FOR SELECT
  USING (
    circle_id IS NOT NULL AND
    circle_id IN (SELECT circle_id FROM circle_members WHERE account_id = auth.uid())
  );

CREATE POLICY "Users can remove their own circle reactions"
  ON group_message_reactions FOR DELETE
  USING (
    circle_id IS NOT NULL AND
    account_id = auth.uid()
  );

-- ============================================================
-- 8. RPCs
-- ============================================================

-- create_circle: insert circle + add creator as host. Cap: 7 circles per user.
CREATE OR REPLACE FUNCTION create_circle(
  p_account_id UUID,
  p_name       TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_circle_id    UUID;
  v_circle_count INT;
BEGIN
  SELECT COUNT(*) INTO v_circle_count
  FROM circle_members WHERE account_id = p_account_id;

  IF v_circle_count >= 7 THEN
    RAISE EXCEPTION 'You can be in a maximum of 7 circles';
  END IF;

  INSERT INTO disciple_circles (name, created_by)
  VALUES (TRIM(p_name), p_account_id)
  RETURNING id INTO v_circle_id;

  INSERT INTO circle_members (circle_id, account_id, role)
  VALUES (v_circle_id, p_account_id, 'host');

  RETURN v_circle_id;
END;
$$;

-- invite_to_circle: insert invitation record. Returns invitation id.
CREATE OR REPLACE FUNCTION invite_to_circle(
  p_circle_id  UUID,
  p_account_id UUID,
  p_email      TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invitation_id     UUID;
  v_member_count      INT;
  v_invited_account   UUID;
BEGIN
  -- Inviter must be a member
  IF NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  -- Cap at 12 members
  SELECT COUNT(*) INTO v_member_count FROM circle_members WHERE circle_id = p_circle_id;
  IF v_member_count >= 12 THEN
    RAISE EXCEPTION 'Circle is at maximum capacity (12 members)';
  END IF;

  -- Check if already a member
  SELECT id INTO v_invited_account
  FROM disciple_app_accounts
  WHERE LOWER(email) = LOWER(TRIM(p_email));

  IF v_invited_account IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = p_circle_id AND account_id = v_invited_account
    ) THEN
      RAISE EXCEPTION 'This person is already in the circle';
    END IF;
  END IF;

  -- No duplicate pending invitation
  IF EXISTS (
    SELECT 1 FROM circle_invitations
    WHERE circle_id = p_circle_id
      AND LOWER(invited_email) = LOWER(TRIM(p_email))
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'An invitation is already pending for this email';
  END IF;

  INSERT INTO circle_invitations (circle_id, invited_by, invited_email)
  VALUES (p_circle_id, p_account_id, LOWER(TRIM(p_email)))
  RETURNING id INTO v_invitation_id;

  RETURN v_invitation_id;
END;
$$;

-- respond_to_circle_invitation: accept or decline
CREATE OR REPLACE FUNCTION respond_to_circle_invitation(
  p_invitation_id UUID,
  p_account_id    UUID,
  p_accept        BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_invitation  circle_invitations%ROWTYPE;
  v_email       TEXT;
  v_circle_count INT;
  v_member_count INT;
BEGIN
  SELECT * INTO v_invitation
  FROM circle_invitations
  WHERE id = p_invitation_id AND status = 'pending';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invitation not found or already responded to';
  END IF;

  SELECT email INTO v_email
  FROM disciple_app_accounts WHERE id = p_account_id;

  IF LOWER(v_email) != LOWER(v_invitation.invited_email) THEN
    RAISE EXCEPTION 'This invitation is not for your account';
  END IF;

  UPDATE circle_invitations
  SET
    status       = CASE WHEN p_accept THEN 'accepted'::TEXT ELSE 'declined'::TEXT END,
    responded_at = NOW()
  WHERE id = p_invitation_id;

  IF p_accept THEN
    -- Circle limit for user
    SELECT COUNT(*) INTO v_circle_count FROM circle_members WHERE account_id = p_account_id;
    IF v_circle_count >= 7 THEN
      RAISE EXCEPTION 'You are already in the maximum number of circles (7)';
    END IF;

    -- Member cap
    SELECT COUNT(*) INTO v_member_count FROM circle_members WHERE circle_id = v_invitation.circle_id;
    IF v_member_count >= 12 THEN
      RAISE EXCEPTION 'This circle is at maximum capacity';
    END IF;

    INSERT INTO circle_members (circle_id, account_id, role)
    VALUES (v_invitation.circle_id, p_account_id, 'member')
    ON CONFLICT (circle_id, account_id) DO NOTHING;
  END IF;
END;
$$;

-- get_pending_circle_invitations: all pending invites for a user's email
CREATE OR REPLACE FUNCTION get_pending_circle_invitations(
  p_account_id UUID
) RETURNS TABLE(
  invitation_id  UUID,
  circle_id      UUID,
  circle_name    TEXT,
  invited_by_name TEXT,
  created_at     TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM disciple_app_accounts WHERE id = p_account_id;

  RETURN QUERY
  SELECT
    ci.id             AS invitation_id,
    ci.circle_id,
    dc.name           AS circle_name,
    daa.display_name  AS invited_by_name,
    ci.created_at
  FROM circle_invitations ci
  JOIN disciple_circles dc ON dc.id = ci.circle_id
  JOIN disciple_app_accounts daa ON daa.id = ci.invited_by
  WHERE LOWER(ci.invited_email) = LOWER(v_email)
    AND ci.status = 'pending'
  ORDER BY ci.created_at DESC;
END;
$$;

-- get_circle_detail: circle info + members + pending invitations
CREATE OR REPLACE FUNCTION get_circle_detail(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  SELECT json_build_object(
    'id',         dc.id,
    'name',       dc.name,
    'created_at', dc.created_at,
    'my_role',    (
      SELECT role FROM circle_members
      WHERE circle_id = p_circle_id AND account_id = p_account_id
    ),
    'members', (
      SELECT json_agg(
        json_build_object(
          'account_id',   daa.id,
          'display_name', COALESCE(daa.display_name, 'Unknown'),
          'avatar_url',   daa.avatar_url,
          'role',         cm.role,
          'joined_at',    cm.joined_at
        )
        ORDER BY CASE cm.role WHEN 'host' THEN 0 ELSE 1 END, daa.display_name
      )
      FROM circle_members cm
      JOIN disciple_app_accounts daa ON daa.id = cm.account_id
      WHERE cm.circle_id = p_circle_id
    ),
    'pending_invitations', (
      SELECT json_agg(
        json_build_object(
          'id',            ci.id,
          'invited_email', ci.invited_email,
          'created_at',    ci.created_at
        )
        ORDER BY ci.created_at
      )
      FROM circle_invitations ci
      WHERE ci.circle_id = p_circle_id AND ci.status = 'pending'
    )
  ) INTO v_result
  FROM disciple_circles dc
  WHERE dc.id = p_circle_id;

  RETURN v_result;
END;
$$;

-- leave_circle: remove self (hosts must delete instead)
CREATE OR REPLACE FUNCTION leave_circle(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_role TEXT;
BEGIN
  SELECT role INTO v_role
  FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  IF v_role = 'host' THEN
    RAISE EXCEPTION 'The host cannot leave. Delete the circle instead.';
  END IF;

  DELETE FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id;
END;
$$;

-- remove_circle_member: host removes another member
CREATE OR REPLACE FUNCTION remove_circle_member(
  p_circle_id         UUID,
  p_host_account_id   UUID,
  p_member_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id AND account_id = p_host_account_id AND role = 'host'
  ) THEN
    RAISE EXCEPTION 'Only the host can remove members';
  END IF;

  IF p_host_account_id = p_member_account_id THEN
    RAISE EXCEPTION 'Cannot remove yourself as host';
  END IF;

  DELETE FROM circle_members
  WHERE circle_id = p_circle_id AND account_id = p_member_account_id;
END;
$$;

-- delete_circle: host deletes (cascades to members, invitations, messages)
CREATE OR REPLACE FUNCTION delete_circle(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id AND account_id = p_account_id AND role = 'host'
  ) THEN
    RAISE EXCEPTION 'Only the host can delete a circle';
  END IF;

  DELETE FROM disciple_circles WHERE id = p_circle_id;
END;
$$;

-- get_unified_chat_list: all groups + circles for a user, sorted by last message
CREATE OR REPLACE FUNCTION get_unified_chat_list(
  p_account_id UUID
) RETURNS TABLE(
  chat_id               UUID,
  chat_type             TEXT,
  name                  TEXT,
  last_message_content  TEXT,
  last_message_sender   TEXT,
  last_message_at       TIMESTAMPTZ,
  last_message_type     TEXT,
  unread_count          BIGINT,
  member_count          BIGINT,
  is_host               BOOLEAN,
  leader_name           TEXT,
  is_training           BOOLEAN
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_disciple_id UUID;
  v_email       TEXT;
  v_leader_id   UUID;
BEGIN
  SELECT daa.disciple_id, daa.email
  INTO v_disciple_id, v_email
  FROM disciple_app_accounts daa
  WHERE daa.id = p_account_id;

  SELECT dl.id INTO v_leader_id
  FROM dna_leaders dl
  WHERE LOWER(dl.email) = LOWER(v_email);

  RETURN QUERY
  WITH
  my_group_ids AS (
    SELECT gd.group_id AS id
    FROM group_disciples gd
    WHERE v_disciple_id IS NOT NULL
      AND gd.disciple_id = v_disciple_id
      AND gd.current_status = 'active'
    UNION
    SELECT g.id
    FROM dna_groups g
    WHERE v_leader_id IS NOT NULL
      AND (g.leader_id = v_leader_id OR g.co_leader_id = v_leader_id)
  ),
  my_circles AS (
    SELECT cm.circle_id AS id, cm.role
    FROM circle_members cm
    WHERE cm.account_id = p_account_id
  ),
  group_last_msg AS (
    SELECT DISTINCT ON (gm.group_id)
      gm.group_id AS id,
      gm.content,
      gm.sender_name,
      gm.created_at,
      gm.message_type
    FROM group_messages gm
    WHERE gm.group_id IN (SELECT id FROM my_group_ids)
      AND gm.deleted_at IS NULL
    ORDER BY gm.group_id, gm.created_at DESC
  ),
  circle_last_msg AS (
    SELECT DISTINCT ON (gm.circle_id)
      gm.circle_id AS id,
      gm.content,
      gm.sender_name,
      gm.created_at,
      gm.message_type
    FROM group_messages gm
    WHERE gm.circle_id IN (SELECT id FROM my_circles)
      AND gm.deleted_at IS NULL
    ORDER BY gm.circle_id, gm.created_at DESC
  ),
  group_unread AS (
    SELECT gm.group_id AS id, COUNT(*) AS cnt
    FROM group_messages gm
    LEFT JOIN group_message_reads gmr
      ON gmr.group_id = gm.group_id AND gmr.account_id = p_account_id
    WHERE gm.group_id IN (SELECT id FROM my_group_ids)
      AND gm.deleted_at IS NULL
      AND gm.sender_account_id != p_account_id
      AND (gmr.last_read_at IS NULL OR gm.created_at > gmr.last_read_at)
    GROUP BY gm.group_id
  ),
  circle_unread AS (
    SELECT gm.circle_id AS id, COUNT(*) AS cnt
    FROM group_messages gm
    LEFT JOIN circle_message_reads cmr
      ON cmr.circle_id = gm.circle_id AND cmr.account_id = p_account_id
    WHERE gm.circle_id IN (SELECT id FROM my_circles)
      AND gm.deleted_at IS NULL
      AND gm.sender_account_id != p_account_id
      AND (cmr.last_read_at IS NULL OR gm.created_at > cmr.last_read_at)
    GROUP BY gm.circle_id
  ),
  group_member_count AS (
    SELECT gd2.group_id AS id, COUNT(*) + 1 AS cnt
    FROM group_disciples gd2
    WHERE gd2.group_id IN (SELECT id FROM my_group_ids)
      AND gd2.current_status = 'active'
    GROUP BY gd2.group_id
  ),
  circle_member_count AS (
    SELECT cm2.circle_id AS id, COUNT(*) AS cnt
    FROM circle_members cm2
    WHERE cm2.circle_id IN (SELECT id FROM my_circles)
    GROUP BY cm2.circle_id
  )
  SELECT
    g.id                                          AS chat_id,
    'group'::TEXT                                 AS chat_type,
    g.group_name                                  AS name,
    glm.content                                   AS last_message_content,
    glm.sender_name                               AS last_message_sender,
    glm.created_at                                AS last_message_at,
    COALESCE(glm.message_type, 'text')            AS last_message_type,
    COALESCE(gu.cnt, 0)                           AS unread_count,
    COALESCE(gmc.cnt, 2)                          AS member_count,
    FALSE                                         AS is_host,
    dl.name                                       AS leader_name,
    (COALESCE(g.group_type, '') = 'training_cohort') AS is_training
  FROM dna_groups g
  JOIN my_group_ids mgi ON mgi.id = g.id
  LEFT JOIN group_last_msg glm   ON glm.id = g.id
  LEFT JOIN group_unread gu      ON gu.id = g.id
  LEFT JOIN group_member_count gmc ON gmc.id = g.id
  LEFT JOIN dna_leaders dl       ON dl.id = g.leader_id

  UNION ALL

  SELECT
    dc.id                                         AS chat_id,
    'circle'::TEXT                                AS chat_type,
    dc.name                                       AS name,
    clm.content                                   AS last_message_content,
    clm.sender_name                               AS last_message_sender,
    clm.created_at                                AS last_message_at,
    COALESCE(clm.message_type, 'text')            AS last_message_type,
    COALESCE(cu.cnt, 0)                           AS unread_count,
    COALESCE(cmc.cnt, 0)                          AS member_count,
    (mc.role = 'host')                            AS is_host,
    NULL::TEXT                                    AS leader_name,
    FALSE                                         AS is_training
  FROM disciple_circles dc
  JOIN my_circles mc ON mc.id = dc.id
  LEFT JOIN circle_last_msg clm      ON clm.id = dc.id
  LEFT JOIN circle_unread cu         ON cu.id = dc.id
  LEFT JOIN circle_member_count cmc  ON cmc.id = dc.id

  ORDER BY last_message_at DESC NULLS LAST;
END;
$$;

-- ============================================================
-- 9. Grants
-- ============================================================

GRANT EXECUTE ON FUNCTION create_circle(UUID, TEXT)                                    TO authenticated;
GRANT EXECUTE ON FUNCTION invite_to_circle(UUID, UUID, TEXT)                           TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_circle_invitation(UUID, UUID, BOOLEAN)            TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_circle_invitations(UUID)                         TO authenticated;
GRANT EXECUTE ON FUNCTION get_circle_detail(UUID, UUID)                                TO authenticated;
GRANT EXECUTE ON FUNCTION leave_circle(UUID, UUID)                                     TO authenticated;
GRANT EXECUTE ON FUNCTION remove_circle_member(UUID, UUID, UUID)                       TO authenticated;
GRANT EXECUTE ON FUNCTION delete_circle(UUID, UUID)                                    TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_chat_list(UUID)                                  TO authenticated;
