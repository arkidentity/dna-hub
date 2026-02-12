-- Migration 048: Fix get_my_calendar_events
-- 1. Fix ambiguous "id" column (return column clashes with subquery column names)
-- 2. Exclude parent recurring event records — only return individual instances
--    (parent has is_recurring=true + parent_event_id=null; instances have parent_event_id set)

CREATE OR REPLACE FUNCTION get_my_calendar_events(
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 days'
)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  event_type TEXT,
  group_id UUID,
  cohort_id UUID,
  church_id UUID,
  is_recurring BOOLEAN,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    e.id,
    e.title,
    e.description,
    e.location,
    e.start_time,
    e.end_time,
    e.event_type,
    e.group_id,
    e.cohort_id,
    e.church_id,
    e.is_recurring,
    e.created_at
  FROM dna_calendar_events e
  WHERE e.start_time >= start_date
    AND e.start_time <= end_date
    -- Exclude parent recurring records (show instances only, not the template row)
    AND NOT (e.is_recurring = true AND e.parent_event_id IS NULL)
    AND (
      -- Group meetings for groups I'm in
      (e.event_type = 'group_meeting' AND e.group_id IN (
        SELECT g1.id FROM dna_groups g1 WHERE g1.leader_id IN (
          SELECT l1.id FROM dna_leaders l1 WHERE l1.email = auth.jwt()->>'email'
        )
        UNION
        SELECT g2.id FROM dna_groups g2 WHERE g2.co_leader_id IN (
          SELECT l2.id FROM dna_leaders l2 WHERE l2.email = auth.jwt()->>'email'
        )
        UNION
        SELECT gd.group_id
        FROM group_disciples gd
        JOIN disciples d ON d.id = gd.disciple_id
        JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
        WHERE daa.id = auth.uid()
      ))
      OR
      -- Cohort events for cohorts I'm in
      (e.event_type = 'cohort_event' AND e.cohort_id IN (
        SELECT cm.cohort_id
        FROM dna_cohort_members cm
        WHERE cm.leader_id IN (
          SELECT l3.id FROM dna_leaders l3 WHERE l3.email = auth.jwt()->>'email'
        )
      ))
      OR
      -- Church events for my church
      (e.event_type = 'church_event' AND (
        e.church_id IN (
          SELECT l4.church_id FROM dna_leaders l4 WHERE l4.email = auth.jwt()->>'email'
        )
        OR
        e.church_id IN (
          SELECT g3.church_id
          FROM dna_groups g3
          JOIN group_disciples gd2 ON gd2.group_id = g3.id
          JOIN disciples disc ON disc.id = gd2.disciple_id
          JOIN disciple_app_accounts daa2 ON daa2.disciple_id = disc.id
          WHERE daa2.id = auth.uid()
        )
      ))
    )
  ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_my_calendar_events IS 'Returns upcoming calendar events visible to the current user. Excludes parent recurring records (shows instances only). Fixed ambiguous id references. (Migration 048)';
