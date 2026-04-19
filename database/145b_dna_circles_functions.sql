-- ============================================================
-- Migration 145b: DNA Circles — Functions + grants
-- MUST run 145a_dna_circles_tables.sql first.
--
-- Supabase SQL editor mis-parses dollar-quoted blocks when
-- it sees semicolons or INTO-style syntax. Two defenses here:
--   1. Every function uses a UNIQUE dollar-quote tag
--      (e.g. $fn_create_circle$) so the parser cannot collapse
--      boundaries between functions.
--   2. No `INSERT ... RETURNING id INTO var` anywhere. We
--      pre-generate UUIDs with gen_random_uuid() and INSERT
--      with explicit id. No INTO-style captures at all.
--   3. All scalar reads use `var := (SELECT ...)` (no INTO).
-- ============================================================

-- create_circle
CREATE OR REPLACE FUNCTION create_circle(
  p_account_id UUID,
  p_name       TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $fn_create_circle$
DECLARE
  v_circle_id UUID := gen_random_uuid();
BEGIN
  IF (SELECT COUNT(*) FROM circle_members WHERE account_id = p_account_id) >= 7 THEN
    RAISE EXCEPTION 'You can be in a maximum of 7 circles';
  END IF;

  INSERT INTO disciple_circles (id, name, created_by)
  VALUES (v_circle_id, TRIM(p_name), p_account_id);

  INSERT INTO circle_members (circle_id, account_id, role)
  VALUES (v_circle_id, p_account_id, 'host');

  RETURN v_circle_id;
END;
$fn_create_circle$;

-- invite_to_circle
CREATE OR REPLACE FUNCTION invite_to_circle(
  p_circle_id  UUID,
  p_account_id UUID,
  p_email      TEXT
) RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $fn_invite_to_circle$
DECLARE
  v_invitation_id   UUID := gen_random_uuid();
  v_invited_account UUID;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  IF (SELECT COUNT(*) FROM circle_members WHERE circle_id = p_circle_id) >= 12 THEN
    RAISE EXCEPTION 'Circle is at maximum capacity (12 members)';
  END IF;

  v_invited_account := (
    SELECT id FROM disciple_app_accounts
    WHERE LOWER(email) = LOWER(TRIM(p_email))
    LIMIT 1
  );

  IF v_invited_account IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM circle_members
      WHERE circle_id = p_circle_id AND account_id = v_invited_account
    ) THEN
      RAISE EXCEPTION 'This person is already in the circle';
    END IF;
  END IF;

  IF EXISTS (
    SELECT 1 FROM circle_invitations
    WHERE circle_id = p_circle_id
      AND LOWER(invited_email) = LOWER(TRIM(p_email))
      AND status = 'pending'
  ) THEN
    RAISE EXCEPTION 'An invitation is already pending for this email';
  END IF;

  INSERT INTO circle_invitations (id, circle_id, invited_by, invited_email)
  VALUES (v_invitation_id, p_circle_id, p_account_id, LOWER(TRIM(p_email)));

  RETURN v_invitation_id;
END;
$fn_invite_to_circle$;

-- respond_to_circle_invitation
CREATE OR REPLACE FUNCTION respond_to_circle_invitation(
  p_invitation_id UUID,
  p_account_id    UUID,
  p_accept        BOOLEAN
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $fn_respond_to_invitation$
DECLARE
  v_inv_circle_id UUID;
  v_inv_email     TEXT;
  v_account_email TEXT;
BEGIN
  v_inv_circle_id := (
    SELECT circle_id FROM circle_invitations
    WHERE id = p_invitation_id AND status = 'pending'
  );

  v_inv_email := (
    SELECT invited_email FROM circle_invitations
    WHERE id = p_invitation_id AND status = 'pending'
  );

  IF v_inv_circle_id IS NULL THEN
    RAISE EXCEPTION 'Invitation not found or already responded to';
  END IF;

  v_account_email := (
    SELECT email FROM disciple_app_accounts WHERE id = p_account_id
  );

  IF LOWER(v_account_email) != LOWER(v_inv_email) THEN
    RAISE EXCEPTION 'This invitation is not for your account';
  END IF;

  UPDATE circle_invitations
  SET
    status       = CASE WHEN p_accept THEN 'accepted'::TEXT ELSE 'declined'::TEXT END,
    responded_at = NOW()
  WHERE id = p_invitation_id;

  IF p_accept THEN
    IF (SELECT COUNT(*) FROM circle_members WHERE account_id = p_account_id) >= 7 THEN
      RAISE EXCEPTION 'You are already in the maximum number of circles (7)';
    END IF;

    IF (SELECT COUNT(*) FROM circle_members WHERE circle_id = v_inv_circle_id) >= 12 THEN
      RAISE EXCEPTION 'This circle is at maximum capacity';
    END IF;

    INSERT INTO circle_members (circle_id, account_id, role)
    VALUES (v_inv_circle_id, p_account_id, 'member')
    ON CONFLICT (circle_id, account_id) DO NOTHING;
  END IF;
END;
$fn_respond_to_invitation$;

-- get_pending_circle_invitations
CREATE OR REPLACE FUNCTION get_pending_circle_invitations(
  p_account_id UUID
) RETURNS TABLE(
  invitation_id   UUID,
  circle_id       UUID,
  circle_name     TEXT,
  invited_by_name TEXT,
  created_at      TIMESTAMPTZ
) LANGUAGE plpgsql SECURITY DEFINER AS $fn_get_pending_invitations$
DECLARE
  v_email TEXT;
BEGIN
  v_email := (SELECT email FROM disciple_app_accounts WHERE id = p_account_id);

  RETURN QUERY
  SELECT
    ci.id             AS invitation_id,
    ci.circle_id,
    dc.name           AS circle_name,
    daa.display_name  AS invited_by_name,
    ci.created_at
  FROM circle_invitations ci
  JOIN disciple_circles dc       ON dc.id  = ci.circle_id
  JOIN disciple_app_accounts daa ON daa.id = ci.invited_by
  WHERE LOWER(ci.invited_email) = LOWER(v_email)
    AND ci.status = 'pending'
  ORDER BY ci.created_at DESC;
END;
$fn_get_pending_invitations$;

-- get_circle_detail
CREATE OR REPLACE FUNCTION get_circle_detail(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS JSON LANGUAGE plpgsql SECURITY DEFINER AS $fn_get_circle_detail$
DECLARE
  v_result JSON;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id
  ) THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  v_result := (
    SELECT json_build_object(
      'id',         dc.id,
      'name',       dc.name,
      'created_at', dc.created_at,
      'my_role', (
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
    )
    FROM disciple_circles dc
    WHERE dc.id = p_circle_id
  );

  RETURN v_result;
END;
$fn_get_circle_detail$;

-- leave_circle
CREATE OR REPLACE FUNCTION leave_circle(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $fn_leave_circle$
DECLARE
  v_role TEXT;
BEGIN
  v_role := (
    SELECT role FROM circle_members
    WHERE circle_id = p_circle_id AND account_id = p_account_id
  );

  IF v_role IS NULL THEN
    RAISE EXCEPTION 'Not a member of this circle';
  END IF;

  IF v_role = 'host' THEN
    RAISE EXCEPTION 'The host cannot leave. Delete the circle instead.';
  END IF;

  DELETE FROM circle_members WHERE circle_id = p_circle_id AND account_id = p_account_id;
END;
$fn_leave_circle$;

-- remove_circle_member
CREATE OR REPLACE FUNCTION remove_circle_member(
  p_circle_id         UUID,
  p_host_account_id   UUID,
  p_member_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $fn_remove_circle_member$
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
$fn_remove_circle_member$;

-- delete_circle
CREATE OR REPLACE FUNCTION delete_circle(
  p_circle_id  UUID,
  p_account_id UUID
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $fn_delete_circle$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM circle_members
    WHERE circle_id = p_circle_id AND account_id = p_account_id AND role = 'host'
  ) THEN
    RAISE EXCEPTION 'Only the host can delete a circle';
  END IF;

  DELETE FROM disciple_circles WHERE id = p_circle_id;
END;
$fn_delete_circle$;

-- get_unified_chat_list
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
) LANGUAGE plpgsql SECURITY DEFINER AS $fn_get_unified_chat_list$
DECLARE
  v_disciple_id UUID;
  v_email       TEXT;
  v_leader_id   UUID;
BEGIN
  v_disciple_id := (SELECT disciple_id FROM disciple_app_accounts WHERE id = p_account_id);
  v_email       := (SELECT email       FROM disciple_app_accounts WHERE id = p_account_id);
  v_leader_id   := (SELECT id FROM dna_leaders WHERE LOWER(email) = LOWER(v_email) LIMIT 1);

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
    g.id                                             AS chat_id,
    'group'::TEXT                                    AS chat_type,
    g.group_name                                     AS name,
    glm.content                                      AS last_message_content,
    glm.sender_name                                  AS last_message_sender,
    glm.created_at                                   AS last_message_at,
    COALESCE(glm.message_type, 'text')               AS last_message_type,
    COALESCE(gu.cnt, 0)                              AS unread_count,
    COALESCE(gmc.cnt, 2)                             AS member_count,
    FALSE                                            AS is_host,
    dl.name                                          AS leader_name,
    (COALESCE(g.group_type, '') = 'training_cohort') AS is_training
  FROM dna_groups g
  JOIN my_group_ids mgi    ON mgi.id = g.id
  LEFT JOIN group_last_msg glm     ON glm.id = g.id
  LEFT JOIN group_unread gu        ON gu.id  = g.id
  LEFT JOIN group_member_count gmc ON gmc.id = g.id
  LEFT JOIN dna_leaders dl         ON dl.id  = g.leader_id

  UNION ALL

  SELECT
    dc.id                               AS chat_id,
    'circle'::TEXT                      AS chat_type,
    dc.name                             AS name,
    clm.content                         AS last_message_content,
    clm.sender_name                     AS last_message_sender,
    clm.created_at                      AS last_message_at,
    COALESCE(clm.message_type, 'text')  AS last_message_type,
    COALESCE(cu.cnt, 0)                 AS unread_count,
    COALESCE(cmc.cnt, 0)                AS member_count,
    (mc.role = 'host')                  AS is_host,
    NULL::TEXT                          AS leader_name,
    FALSE                               AS is_training
  FROM disciple_circles dc
  JOIN my_circles mc              ON mc.id  = dc.id
  LEFT JOIN circle_last_msg clm   ON clm.id = dc.id
  LEFT JOIN circle_unread cu      ON cu.id  = dc.id
  LEFT JOIN circle_member_count cmc ON cmc.id = dc.id

  ORDER BY last_message_at DESC NULLS LAST;
END;
$fn_get_unified_chat_list$;

-- ============================================================
-- Grants
-- ============================================================

GRANT EXECUTE ON FUNCTION create_circle(UUID, TEXT)                         TO authenticated;
GRANT EXECUTE ON FUNCTION invite_to_circle(UUID, UUID, TEXT)                TO authenticated;
GRANT EXECUTE ON FUNCTION respond_to_circle_invitation(UUID, UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION get_pending_circle_invitations(UUID)              TO authenticated;
GRANT EXECUTE ON FUNCTION get_circle_detail(UUID, UUID)                     TO authenticated;
GRANT EXECUTE ON FUNCTION leave_circle(UUID, UUID)                          TO authenticated;
GRANT EXECUTE ON FUNCTION remove_circle_member(UUID, UUID, UUID)            TO authenticated;
GRANT EXECUTE ON FUNCTION delete_circle(UUID, UUID)                         TO authenticated;
GRANT EXECUTE ON FUNCTION get_unified_chat_list(UUID)                       TO authenticated;
