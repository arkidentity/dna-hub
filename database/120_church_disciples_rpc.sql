-- Church-Wide Disciples View
-- Migration: 120_church_disciples_rpc.sql
-- Purpose: RPC to fetch all app users for a church with group & engagement data
-- Created: 2026-03-20

-- ============================================
-- 1. GET CHURCH DISCIPLES
-- Returns everyone with an app account at this church,
-- with optional group/leader info and engagement stats.
-- Includes disciples, DNA leaders, and church leaders.
-- ============================================
CREATE OR REPLACE FUNCTION get_church_disciples(p_church_id UUID)
RETURNS TABLE (
  app_account_id UUID,
  display_name TEXT,
  account_email TEXT,
  account_role TEXT,
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN,
  -- Group info (NULL if not in a group)
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
    g.id AS group_id,
    g.group_name,
    g.current_phase,
    dl.name AS leader_name,
    dl.id AS leader_id,
    gd.current_status AS membership_status,
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
  -- Optional: group membership (pick most recent active group, or any group)
  LEFT JOIN group_disciples gd
    ON gd.disciple_id = daa.disciple_id
    AND gd.current_status = 'active'
  LEFT JOIN dna_groups g ON g.id = gd.group_id
  LEFT JOIN dna_leaders dl ON dl.id = g.leader_id
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
