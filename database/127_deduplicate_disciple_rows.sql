-- ============================================================
-- Migration 127: Deduplicate disciple rows in admin views
--
-- Problem: LEFT JOINing group_disciples and dna_groups produces
-- one row per group per person. A leader with 5 groups appears 5 times.
--
-- Fix: Aggregate all groups into a JSONB array so each person is
-- exactly one row. The UI renders the array as a list.
-- ============================================================

-- ============================================================
-- 1. FIX get_church_disciples — one row per person
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
  -- Groups as JSONB array: [{"id":"...","name":"...","phase":"...","leader":"...","status":"active|leader"}]
  groups_json JSONB,
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
    -- Aggregate all groups into a JSONB array
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', grp.id,
          'name', grp.group_name,
          'phase', grp.current_phase,
          'leader', ldr.name,
          'status', CASE
            WHEN grp.leader_id = my_ldr.id OR grp.co_leader_id = my_ldr.id THEN 'leader'
            ELSE gd2.current_status
          END
        ) ORDER BY grp.group_name)
        FROM (
          -- Path 1: groups they're a disciple in
          SELECT g2.id, g2.group_name, g2.current_phase, g2.leader_id, g2.co_leader_id, gd2.current_status
          FROM group_disciples gd2
          JOIN dna_groups g2 ON g2.id = gd2.group_id
          WHERE gd2.disciple_id = daa.disciple_id
            AND gd2.current_status = 'active'
          UNION
          -- Path 2: groups they lead or co-lead
          SELECT g3.id, g3.group_name, g3.current_phase, g3.leader_id, g3.co_leader_id, 'leader'::TEXT
          FROM dna_leaders ml
          JOIN dna_groups g3 ON g3.leader_id = ml.id OR g3.co_leader_id = ml.id
          WHERE LOWER(ml.email) = LOWER(daa.email)
        ) grp
        LEFT JOIN group_disciples gd2 ON gd2.group_id = grp.id AND gd2.disciple_id = daa.disciple_id
        LEFT JOIN dna_leaders ldr ON ldr.id = grp.leader_id
        LEFT JOIN dna_leaders my_ldr ON LOWER(my_ldr.email) = LOWER(daa.email)
      ),
      '[]'::jsonb
    ) AS groups_json,
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
  LEFT JOIN disciple_progress dp ON dp.account_id = daa.id
  LEFT JOIN disciple_creed_progress dcp ON dcp.account_id = daa.id
  WHERE daa.church_id = p_church_id
  ORDER BY
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
-- 2. FIX get_all_disciples — one row per person
-- ============================================================
DROP FUNCTION IF EXISTS get_all_disciples();

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
  -- Groups as JSONB array
  groups_json JSONB,
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
    COALESCE(
      (
        SELECT jsonb_agg(jsonb_build_object(
          'id', grp.id,
          'name', grp.group_name,
          'phase', grp.current_phase,
          'leader', ldr.name,
          'status', CASE
            WHEN grp.leader_id = my_ldr.id OR grp.co_leader_id = my_ldr.id THEN 'leader'
            ELSE grp.current_status
          END
        ) ORDER BY grp.group_name)
        FROM (
          SELECT g2.id, g2.group_name, g2.current_phase, g2.leader_id, g2.co_leader_id, gd2.current_status
          FROM group_disciples gd2
          JOIN dna_groups g2 ON g2.id = gd2.group_id
          WHERE gd2.disciple_id = daa.disciple_id
            AND gd2.current_status = 'active'
          UNION
          SELECT g3.id, g3.group_name, g3.current_phase, g3.leader_id, g3.co_leader_id, 'leader'::TEXT
          FROM dna_leaders ml
          JOIN dna_groups g3 ON g3.leader_id = ml.id OR g3.co_leader_id = ml.id
          WHERE LOWER(ml.email) = LOWER(daa.email)
        ) grp
        LEFT JOIN dna_leaders ldr ON ldr.id = grp.leader_id
        LEFT JOIN dna_leaders my_ldr ON LOWER(my_ldr.email) = LOWER(daa.email)
      ),
      '[]'::jsonb
    ) AS groups_json,
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
  LEFT JOIN churches c ON c.id = daa.church_id
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
