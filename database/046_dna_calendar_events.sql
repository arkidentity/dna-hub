-- Migration 046: DNA Calendar Events
-- Unified calendar system for DNA Groups, Cohort events, and Church events
-- Run this in your Supabase SQL Editor

-- =====================
-- DNA CALENDAR EVENTS TABLE
-- =====================
-- Unified calendar for all DNA-related events across the ecosystem
CREATE TABLE IF NOT EXISTS dna_calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Event basics
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,

  -- Event classification
  event_type TEXT CHECK (event_type IN ('group_meeting', 'cohort_event', 'church_event')) NOT NULL,

  -- Scoping (mutually exclusive based on event_type)
  -- group_meeting: requires group_id
  -- cohort_event: requires cohort_id (for DNA leaders only)
  -- church_event: requires church_id (for everyone - leaders + disciples)
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE,
  cohort_id UUID REFERENCES dna_cohorts(id) ON DELETE CASCADE,
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,

  -- Recurrence (Option A: individual instances)
  -- Each occurrence is a separate record with a link to the parent
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern JSONB,  -- { frequency: 'weekly', interval: 1, day_of_week: 3, end_date: '2026-12-31' }
  parent_event_id UUID REFERENCES dna_calendar_events(id) ON DELETE CASCADE,  -- links recurring instances to parent

  -- Metadata
  created_by UUID REFERENCES dna_leaders(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints to ensure proper scoping
  CONSTRAINT check_event_scope CHECK (
    (event_type = 'group_meeting' AND group_id IS NOT NULL) OR
    (event_type = 'cohort_event' AND cohort_id IS NOT NULL) OR
    (event_type = 'church_event' AND church_id IS NOT NULL)
  )
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_type ON dna_calendar_events(event_type);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_group ON dna_calendar_events(group_id);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_cohort ON dna_calendar_events(cohort_id);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_church ON dna_calendar_events(church_id);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_start_time ON dna_calendar_events(start_time);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_created_by ON dna_calendar_events(created_by);
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_parent ON dna_calendar_events(parent_event_id);

-- Index for common query: get upcoming events
CREATE INDEX IF NOT EXISTS idx_dna_calendar_events_upcoming
  ON dna_calendar_events(start_time)
  WHERE start_time >= NOW();

-- =====================
-- UPDATE TRIGGER
-- =====================
CREATE TRIGGER update_dna_calendar_events_updated_at
  BEFORE UPDATE ON dna_calendar_events
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- RLS POLICIES
-- =====================
ALTER TABLE dna_calendar_events ENABLE ROW LEVEL SECURITY;

-- Group meetings: visible to group members (leaders + disciples)
CREATE POLICY "Group members can view group meeting events"
  ON dna_calendar_events FOR SELECT
  USING (
    event_type = 'group_meeting'
    AND group_id IN (
      -- Leaders can see their group events
      SELECT id FROM dna_groups WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
      UNION
      -- Co-leaders can see their group events
      SELECT group_id FROM dna_group_co_leaders WHERE co_leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
      UNION
      -- Disciples can see their group events
      SELECT group_id FROM dna_disciples WHERE account_id = auth.uid()
    )
  );

-- Cohort events: visible to all DNA leaders in that cohort
CREATE POLICY "Cohort members can view cohort events"
  ON dna_calendar_events FOR SELECT
  USING (
    event_type = 'cohort_event'
    AND cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

-- Church events: visible to all DNA leaders + disciples at that church
CREATE POLICY "Church members can view church events"
  ON dna_calendar_events FOR SELECT
  USING (
    event_type = 'church_event'
    AND (
      -- DNA leaders at this church
      church_id IN (
        SELECT church_id FROM dna_leaders WHERE account_id = auth.uid()
      )
      OR
      -- Disciples at this church (via their groups)
      church_id IN (
        SELECT g.church_id
        FROM dna_groups g
        JOIN dna_disciples d ON d.group_id = g.id
        WHERE d.account_id = auth.uid()
      )
    )
  );

-- DNA leaders can create events for their groups
CREATE POLICY "DNA leaders can create group meeting events"
  ON dna_calendar_events FOR INSERT
  WITH CHECK (
    event_type = 'group_meeting'
    AND group_id IN (
      SELECT id FROM dna_groups WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
      UNION
      SELECT group_id FROM dna_group_co_leaders WHERE co_leader_id IN (
        SELECT id FROM dna_leaders WHERE account_id = auth.uid()
      )
    )
  );

-- Cohort trainers and church admins can create cohort events
CREATE POLICY "Trainers and church admins can create cohort events"
  ON dna_calendar_events FOR INSERT
  WITH CHECK (
    event_type = 'cohort_event'
    AND (
      -- Cohort trainer
      cohort_id IN (
        SELECT cohort_id FROM dna_cohort_members
        WHERE leader_id IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid())
        AND role = 'trainer'
      )
      OR
      -- Church admin at the cohort's church
      EXISTS (
        SELECT 1 FROM church_leaders cl
        JOIN dna_cohorts c ON c.church_id = cl.church_id
        WHERE cl.account_id = auth.uid()
        AND c.id = cohort_id
      )
    )
  );

-- Church admins can create church-wide events
CREATE POLICY "Church admins can create church events"
  ON dna_calendar_events FOR INSERT
  WITH CHECK (
    event_type = 'church_event'
    AND church_id IN (
      SELECT church_id FROM church_leaders WHERE account_id = auth.uid()
    )
  );

-- Event creators can update their own events
CREATE POLICY "Event creators can update their events"
  ON dna_calendar_events FOR UPDATE
  USING (created_by IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid()));

-- Event creators can delete their own events
CREATE POLICY "Event creators can delete their events"
  ON dna_calendar_events FOR DELETE
  USING (created_by IN (SELECT id FROM dna_leaders WHERE account_id = auth.uid()));

-- Service role has full access
CREATE POLICY "Service role has full access to calendar events"
  ON dna_calendar_events FOR ALL
  USING (auth.jwt()->>'role' = 'service_role');

-- =====================
-- HELPER FUNCTION
-- =====================
-- Function to get all events visible to the current user
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
    AND (
      -- Group meetings for groups I'm in
      (e.event_type = 'group_meeting' AND e.group_id IN (
        SELECT g.id FROM dna_groups g WHERE g.leader_id IN (
          SELECT id FROM dna_leaders WHERE account_id = auth.uid()
        )
        UNION
        SELECT gcl.group_id FROM dna_group_co_leaders gcl WHERE gcl.co_leader_id IN (
          SELECT id FROM dna_leaders WHERE account_id = auth.uid()
        )
        UNION
        SELECT d.group_id FROM dna_disciples d WHERE d.account_id = auth.uid()
      ))
      OR
      -- Cohort events for cohorts I'm in
      (e.event_type = 'cohort_event' AND e.cohort_id IN (
        SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
          SELECT id FROM dna_leaders WHERE account_id = auth.uid()
        )
      ))
      OR
      -- Church events for my church
      (e.event_type = 'church_event' AND (
        e.church_id IN (
          SELECT church_id FROM dna_leaders WHERE account_id = auth.uid()
        )
        OR
        e.church_id IN (
          SELECT g.church_id
          FROM dna_groups g
          JOIN dna_disciples d ON d.group_id = g.id
          WHERE d.account_id = auth.uid()
        )
      ))
    )
  ORDER BY e.start_time ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================
-- COMMENTS
-- =====================
COMMENT ON TABLE dna_calendar_events IS 'Unified calendar for DNA Groups, Cohort, and Church events. Stores individual event instances for recurring events.';
COMMENT ON COLUMN dna_calendar_events.event_type IS 'group_meeting = DNA group meetings (members only), cohort_event = cohort events (DNA leaders only), church_event = church-wide events (everyone)';
COMMENT ON COLUMN dna_calendar_events.parent_event_id IS 'For recurring events: links individual instances back to the parent event record';
COMMENT ON COLUMN dna_calendar_events.recurrence_pattern IS 'JSON: {frequency: "weekly", interval: 1, day_of_week: 3, end_date: "2026-12-31"}';
COMMENT ON FUNCTION get_my_calendar_events IS 'Helper function to fetch all calendar events visible to the current user within a date range';
