-- ============================================================
-- Migration 126: Fix role sync, leader group display, network admin view
--
-- Fixes three bugs:
-- 1. DNA leaders showing as "disciples" because disciple_app_accounts.role
--    is NULL — re-backfill from user_roles via email match
-- 2. Leaders showing "no groups" in church disciple list — the RPC only
--    checked group_disciples (membership) not dna_groups (leadership)
-- 3. Adds network-wide admin RPC for viewing all disciples across churches
-- ============================================================

-- ============================================================
-- 1A. RE-BACKFILL ROLES from user_roles (primary path)
-- Catches any disciple_app_accounts where role is NULL but user_roles
-- has a matching leader/admin role via email lookup.
-- ============================================================
UPDATE disciple_app_accounts daa
SET role = sub.best_role
FROM (
  SELECT daa2.id AS account_id, (
    SELECT ur.role
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    WHERE LOWER(u.email) = LOWER(daa2.email)
      AND ur.role IN ('dna_leader', 'church_leader', 'admin')
    ORDER BY
      CASE ur.role
        WHEN 'admin'         THEN 1
        WHEN 'church_leader' THEN 2
        WHEN 'dna_leader'    THEN 3
      END
    LIMIT 1
  ) AS best_role
  FROM disciple_app_accounts daa2
  WHERE daa2.role IS NULL
) sub
WHERE daa.id = sub.account_id
  AND sub.best_role IS NOT NULL;

-- ============================================================
-- 1B. RE-BACKFILL ROLES from dna_leaders table (fallback path)
-- Some leaders exist in dna_leaders but were never added to users/user_roles
-- (older invite flow or manual DB inserts). Match by email and set dna_leader.
-- ============================================================
UPDATE disciple_app_accounts daa
SET role = 'dna_leader'
FROM dna_leaders dl
WHERE LOWER(daa.email) = LOWER(dl.email)
  AND dl.is_active = true
  AND daa.role IS NULL;

-- ============================================================
-- 1C. RE-BACKFILL ROLES from church_leaders table (fallback path)
-- Same issue — some church leaders exist but weren't synced to user_roles.
-- ============================================================
UPDATE disciple_app_accounts daa
SET role = 'church_leader'
FROM church_leaders cl
JOIN users u ON u.id = cl.user_id
WHERE LOWER(daa.email) = LOWER(u.email)
  AND daa.role IS NULL;

-- ============================================================
-- 1D. BACKFILL missing user_roles entries
-- If someone is in dna_leaders with a user_id but has no dna_leader
-- role in user_roles, create it — so future triggers work correctly.
-- ============================================================
INSERT INTO user_roles (user_id, role, church_id)
SELECT dl.user_id, 'dna_leader', dl.church_id
FROM dna_leaders dl
WHERE dl.user_id IS NOT NULL
  AND dl.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur.user_id = dl.user_id
      AND ur.role = 'dna_leader'
  );

-- ============================================================
-- 1E. BACKFILL church_id on disciple_app_accounts
-- Leaders who signed up before church branding may have NULL church_id.
-- Fill from dna_leaders.church_id if available.
-- ============================================================
UPDATE disciple_app_accounts daa
SET church_id = dl.church_id
FROM dna_leaders dl
WHERE LOWER(daa.email) = LOWER(dl.email)
  AND daa.church_id IS NULL
  AND dl.church_id IS NOT NULL;

-- ============================================================
-- 2. FIX get_church_disciples — show leader/co-leader groups
-- Leaders who lead groups (dna_groups.leader_id or co_leader_id)
-- should show that group info even if they're not in group_disciples.
-- ============================================================
DROP FUNCTION IF EXISTS get_church_disciples(UUID);

CREATE OR REPLACE FUNCTION get_church_disciples(p_church_id UUID)
RETURNS TABLE (
  app_account_id UUID,
  display_name TEXT,
  account_email TEXT,
  account_role TEXT,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN,
  -- Group info (NULL if not in a group and not leading one)
  group_id UUID,
  group_name TEXT,
  current_phase TEXT,
  leader_name TEXT,
  leader_id UUID,
  membership_status TEXT,
  joined_date DATE,
  -- Engagement stats
  current_streak INTEGER,
  longest_streak INTEGER,
  total_journal_entries INTEGER,
  total_prayer_sessions INTEGER,
  total_prayer_cards INTEGER,
  cards_mastered INTEGER[],
  creed_study_sessions INTEGER,
  last_activity_date DATE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    daa.id AS app_account_id,
    COALESCE(daa.display_name, d.name, daa.email) AS display_name,
    daa.email AS account_email,
    daa.role AS account_role,
    daa.last_login_at,
    daa.is_active,
    -- Prefer disciple group membership; fall back to led/co-led group
    COALESCE(g.id, lg.id) AS group_id,
    COALESCE(g.group_name, lg.group_name) AS group_name,
    COALESCE(g.current_phase, lg.current_phase) AS current_phase,
    COALESCE(dl.name, ldl.name) AS leader_name,
    COALESCE(dl.id, ldl.id) AS leader_id,
    COALESCE(gd.current_status, CASE WHEN lg.id IS NOT NULL THEN 'leader' ELSE NULL END) AS membership_status,
    gd.joined_date,
    COALESCE(dp.current_streak, 0) AS current_streak,
    COALESCE(dp.longest_streak, 0) AS longest_streak,
    COALESCE(dp.total_journal_entries, 0) AS total_journal_entries,
    COALESCE(dp.total_prayer_sessions, 0) AS total_prayer_sessions,
    COALESCE(dp.total_prayer_cards, 0) AS total_prayer_cards,
    COALESCE(dcp.cards_mastered, '{}') AS cards_mastered,
    COALESCE(dcp.total_study_sessions, 0) AS creed_study_sessions,
    dp.last_activity_date
  FROM disciple_app_accounts daa
  -- Optional: link to disciples table for name/phone
  LEFT JOIN disciples d ON d.id = daa.disciple_id
  -- Path 1: group membership (disciple in a group)
  LEFT JOIN group_disciples gd
    ON gd.disciple_id = daa.disciple_id
    AND gd.current_status = 'active'
  LEFT JOIN dna_groups g ON g.id = gd.group_id
  LEFT JOIN dna_leaders dl ON dl.id = g.leader_id
  -- Path 2: leader/co-leader of a group (via email → dna_leaders)
  LEFT JOIN dna_leaders my_leader
    ON LOWER(my_leader.email) = LOWER(daa.email)
  LEFT JOIN dna_groups lg
    ON (lg.leader_id = my_leader.id OR lg.co_leader_id = my_leader.id)
    AND g.id IS NULL  -- only use leader group if not already in a group as disciple
  LEFT JOIN dna_leaders ldl ON ldl.id = lg.leader_id
  -- Engagement stats
  LEFT JOIN disciple_progress dp ON dp.account_id = daa.id
  LEFT JOIN disciple_creed_progress dcp ON dcp.account_id = daa.id
  WHERE daa.church_id = p_church_id
  ORDER BY
    -- Leaders first, then by name
    CASE daa.role
      WHEN 'admin' THEN 0
      WHEN 'church_leader' THEN 1
      WHEN 'dna_leader' THEN 2
      ELSE 3
    END,
    COALESCE(daa.display_name, d.name, daa.email) ASC;
$$;

GRANT EXECUTE ON FUNCTION get_church_disciples(UUID) TO authenticated;

-- ============================================================
-- 3. NETWORK-WIDE ADMIN DISCIPLES VIEW
-- Returns all app users across all churches (admin only).
-- ============================================================
CREATE OR REPLACE FUNCTION get_all_disciples()
RETURNS TABLE (
  app_account_id UUID,
  display_name TEXT,
  account_email TEXT,
  account_role TEXT,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN,
  church_id UUID,
  church_subdomain TEXT,
  church_name TEXT,
  -- Group info
  group_id UUID,
  group_name TEXT,
  current_phase TEXT,
  leader_name TEXT,
  membership_status TEXT,
  -- Engagement stats
  current_streak INTEGER,
  longest_streak INTEGER,
  total_journal_entries INTEGER,
  total_prayer_sessions INTEGER,
  total_prayer_cards INTEGER,
  cards_mastered INTEGER[],
  creed_study_sessions INTEGER,
  last_activity_date DATE
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    daa.id AS app_account_id,
    COALESCE(daa.display_name, d.name, daa.email) AS display_name,
    daa.email AS account_email,
    daa.role AS account_role,
    daa.last_login_at,
    daa.is_active,
    daa.church_id,
    c.subdomain AS church_subdomain,
    c.name AS church_name,
    -- Prefer disciple group membership; fall back to led/co-led group
    COALESCE(g.id, lg.id) AS group_id,
    COALESCE(g.group_name, lg.group_name) AS group_name,
    COALESCE(g.current_phase, lg.current_phase) AS current_phase,
    COALESCE(dl.name, ldl.name) AS leader_name,
    COALESCE(gd.current_status, CASE WHEN lg.id IS NOT NULL THEN 'leader' ELSE NULL END) AS membership_status,
    COALESCE(dp.current_streak, 0) AS current_streak,
    COALESCE(dp.longest_streak, 0) AS longest_streak,
    COALESCE(dp.total_journal_entries, 0) AS total_journal_entries,
    COALESCE(dp.total_prayer_sessions, 0) AS total_prayer_sessions,
    COALESCE(dp.total_prayer_cards, 0) AS total_prayer_cards,
    COALESCE(dcp.cards_mastered, '{}') AS cards_mastered,
    COALESCE(dcp.total_study_sessions, 0) AS creed_study_sessions,
    dp.last_activity_date
  FROM disciple_app_accounts daa
  LEFT JOIN disciples d ON d.id = daa.disciple_id
  -- Church info
  LEFT JOIN churches c ON c.id = daa.church_id
  -- Path 1: group membership
  LEFT JOIN group_disciples gd
    ON gd.disciple_id = daa.disciple_id
    AND gd.current_status = 'active'
  LEFT JOIN dna_groups g ON g.id = gd.group_id
  LEFT JOIN dna_leaders dl ON dl.id = g.leader_id
  -- Path 2: leader/co-leader of a group
  LEFT JOIN dna_leaders my_leader
    ON LOWER(my_leader.email) = LOWER(daa.email)
  LEFT JOIN dna_groups lg
    ON (lg.leader_id = my_leader.id OR lg.co_leader_id = my_leader.id)
    AND g.id IS NULL
  LEFT JOIN dna_leaders ldl ON ldl.id = lg.leader_id
  -- Engagement stats
  LEFT JOIN disciple_progress dp ON dp.account_id = daa.id
  LEFT JOIN disciple_creed_progress dcp ON dcp.account_id = daa.id
  ORDER BY
    COALESCE(c.name, 'zzz') ASC,
    CASE daa.role
      WHEN 'admin' THEN 0
      WHEN 'church_leader' THEN 1
      WHEN 'dna_leader' THEN 2
      ELSE 3
    END,
    COALESCE(daa.display_name, d.name, daa.email) ASC;
$$;

GRANT EXECUTE ON FUNCTION get_all_disciples() TO authenticated;

-- ============================================================
-- 4. FIX ROLE SYNC TRIGGERS — use case-insensitive email match
-- ============================================================

-- Fix the user_roles → disciple_app_accounts sync trigger
CREATE OR REPLACE FUNCTION sync_app_account_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM users WHERE id = NEW.user_id;

  IF v_email IS NOT NULL AND NEW.role IN ('dna_leader', 'church_leader', 'admin') THEN
    UPDATE disciple_app_accounts
    SET role = NEW.role
    WHERE LOWER(email) = LOWER(v_email)
      AND (role IS NULL OR
           CASE NEW.role
             WHEN 'admin'         THEN 1
             WHEN 'church_leader' THEN 2
             WHEN 'dna_leader'    THEN 3
           END <
           CASE role
             WHEN 'admin'         THEN 1
             WHEN 'church_leader' THEN 2
             WHEN 'dna_leader'    THEN 3
             ELSE 99
           END);
  END IF;

  RETURN NEW;
END;
$$;

-- Fix the disciple_app_accounts INSERT trigger
-- Now also checks dna_leaders table as fallback
CREATE OR REPLACE FUNCTION sync_role_on_app_account_create()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_catalog
AS $$
DECLARE
  v_role TEXT;
  v_church_id UUID;
BEGIN
  -- Primary path: check user_roles
  SELECT ur.role INTO v_role
  FROM users u
  JOIN user_roles ur ON ur.user_id = u.id
  WHERE LOWER(u.email) = LOWER(NEW.email)
    AND ur.role IN ('dna_leader', 'church_leader', 'admin')
  ORDER BY
    CASE ur.role
      WHEN 'admin'         THEN 1
      WHEN 'church_leader' THEN 2
      WHEN 'dna_leader'    THEN 3
    END
  LIMIT 1;

  -- Fallback: check dna_leaders table directly
  IF v_role IS NULL THEN
    SELECT 'dna_leader', dl.church_id INTO v_role, v_church_id
    FROM dna_leaders dl
    WHERE LOWER(dl.email) = LOWER(NEW.email)
      AND dl.is_active = true
    LIMIT 1;
  END IF;

  IF v_role IS NOT NULL THEN
    UPDATE disciple_app_accounts
    SET role = v_role,
        church_id = COALESCE(church_id, v_church_id)
    WHERE id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;
