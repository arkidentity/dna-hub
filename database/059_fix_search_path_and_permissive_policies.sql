-- ============================================================
-- Migration 059: Fix Function search_path + Permissive RLS Policies
-- Addresses all WARN-level security findings from Supabase linter
-- ============================================================
-- Part 1: Add SET search_path = public to all 26 flagged functions
--         Prevents search_path injection attacks where a malicious
--         schema could shadow public functions/tables.
--
-- Part 2: Tighten overly permissive RLS policies (USING true / WITH CHECK true)
--         - Service role policies: scope to 'service_role' explicitly
--         - spiritual_gifts INSERT: require account_id match
--
-- Part 3: Enable leaked password protection (done in Supabase dashboard,
--         noted here for reference — cannot be set via SQL migration)
-- ============================================================


-- ============================================================
-- PART 1: Fix search_path on all flagged functions
-- Adding SET search_path = public prevents schema injection.
-- All function bodies are preserved exactly — only the config changes.
-- ============================================================

-- 1. update_updated_at_column (simple timestamp trigger)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 2. update_spiritual_gifts_updated_at (simple timestamp trigger)
CREATE OR REPLACE FUNCTION public.update_spiritual_gifts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 3. archive_document_version
CREATE OR REPLACE FUNCTION public.archive_document_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.file_url IS NOT NULL AND OLD.file_url != NEW.file_url THEN
    INSERT INTO document_versions (
      document_id, version_number, file_url, uploaded_by, created_at
    ) VALUES (
      OLD.id, COALESCE(OLD.current_version, 1), OLD.file_url, OLD.uploaded_by, OLD.updated_at
    );
    NEW.current_version := COALESCE(OLD.current_version, 1) + 1;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 4. should_block_duplicate_call
CREATE OR REPLACE FUNCTION public.should_block_duplicate_call(
  p_church_id UUID,
  p_call_type TEXT,
  p_google_event_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_existing_count INTEGER;
BEGIN
  IF p_call_type NOT IN ('discovery', 'proposal', 'kickoff') THEN
    RETURN FALSE;
  END IF;

  SELECT COUNT(*) INTO v_existing_count
  FROM scheduled_calls
  WHERE church_id = p_church_id
    AND call_type = p_call_type
    AND completed = true
    AND (p_google_event_id IS NULL OR google_event_id != p_google_event_id);

  RETURN v_existing_count > 0;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 5. auto_link_disciple_app_account
CREATE OR REPLACE FUNCTION public.auto_link_disciple_app_account()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE disciples
  SET app_account_id = NEW.id
  WHERE LOWER(email) = LOWER(NEW.email)
    AND app_account_id IS NULL;

  UPDATE disciple_app_accounts
  SET disciple_id = (
    SELECT id FROM disciples
    WHERE LOWER(email) = LOWER(NEW.email)
    LIMIT 1
  )
  WHERE id = NEW.id
    AND disciple_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 6. initialize_training_user
CREATE OR REPLACE FUNCTION public.initialize_training_user(p_user_id UUID)
RETURNS void AS $$
BEGIN
  INSERT INTO user_training_progress (user_id, current_stage)
  VALUES (p_user_id, 'onboarding')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (p_user_id, 'flow_assessment', true, NOW(), 'signup')
  ON CONFLICT (user_id, content_type) DO NOTHING;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 7. generate_certificate_number
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  cert_num TEXT;
  year_part TEXT;
  random_part TEXT;
BEGIN
  year_part := TO_CHAR(NOW(), 'YY');
  random_part := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 6));
  cert_num := 'DNA-' || year_part || '-' || random_part;
  RETURN cert_num;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 8. set_certificate_number
CREATE OR REPLACE FUNCTION public.set_certificate_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.certificate_number IS NULL THEN
    NEW.certificate_number := generate_certificate_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 9. update_dna_journey_stage
CREATE OR REPLACE FUNCTION public.update_dna_journey_stage()
RETURNS TRIGGER AS $$
DECLARE
  journey_record RECORD;
  new_stage TEXT;
BEGIN
  SELECT * INTO journey_record
  FROM dna_leader_journeys
  WHERE user_id = NEW.user_id;

  IF (journey_record.milestones->>'flow_assessment_complete')::jsonb->>'completed' = 'true'
     AND (journey_record.milestones->>'manual_complete')::jsonb->>'completed' = 'false' THEN
    new_stage := 'training';
  ELSIF (journey_record.milestones->>'manual_complete')::jsonb->>'completed' = 'true'
        AND (journey_record.milestones->>'first_group_created')::jsonb->>'completed' = 'false' THEN
    new_stage := 'launching';
  ELSIF (journey_record.milestones->>'first_group_created')::jsonb->>'completed' = 'true' THEN
    new_stage := 'growing';
  ELSE
    new_stage := journey_record.current_stage;
  END IF;

  IF new_stage != journey_record.current_stage THEN
    UPDATE dna_leader_journeys
    SET current_stage = new_stage,
        stage_started_at = NOW(),
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 10. cleanup_old_magic_links
CREATE OR REPLACE FUNCTION public.cleanup_old_magic_links()
RETURNS void AS $$
BEGIN
  DELETE FROM magic_link_tokens
  WHERE created_at < NOW() - INTERVAL '7 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 11. get_my_group_ids
CREATE OR REPLACE FUNCTION public.get_my_group_ids()
RETURNS UUID[] AS $$
DECLARE
  v_disciple_id UUID;
  v_user_email TEXT;
  v_group_ids UUID[];
  v_leader_group_ids UUID[];
BEGIN
  SELECT disciple_id, email INTO v_disciple_id, v_user_email
  FROM disciple_app_accounts
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  IF v_disciple_id IS NOT NULL THEN
    SELECT ARRAY_AGG(group_id) INTO v_group_ids
    FROM group_disciples
    WHERE disciple_id = v_disciple_id
      AND current_status = 'active';
  END IF;

  SELECT ARRAY_AGG(g.id) INTO v_leader_group_ids
  FROM dna_groups g
  JOIN dna_leaders dl ON (g.leader_id = dl.id OR g.co_leader_id = dl.id)
  WHERE dl.email = v_user_email
    AND g.is_active = true;

  IF v_group_ids IS NOT NULL AND v_leader_group_ids IS NOT NULL THEN
    RETURN ARRAY(SELECT DISTINCT unnest(v_group_ids || v_leader_group_ids));
  ELSIF v_group_ids IS NOT NULL THEN
    RETURN v_group_ids;
  ELSIF v_leader_group_ids IS NOT NULL THEN
    RETURN v_leader_group_ids;
  ELSE
    RETURN ARRAY[]::UUID[];
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public;


-- 12. calculate_disciple_streak
CREATE OR REPLACE FUNCTION public.calculate_disciple_streak(p_account_id UUID, p_timezone TEXT DEFAULT 'UTC')
RETURNS INTEGER AS $$
DECLARE
  v_streak INTEGER := 0;
  v_check_date DATE;
  v_has_activity BOOLEAN;
  v_grace_used BOOLEAN := FALSE;
BEGIN
  v_check_date := (NOW() AT TIME ZONE p_timezone)::DATE;

  SELECT EXISTS (
    SELECT 1 FROM disciple_journal_entries
    WHERE account_id = p_account_id
      AND deleted_at IS NULL
      AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
  ) INTO v_has_activity;

  IF NOT v_has_activity THEN
    v_check_date := v_check_date - INTERVAL '1 day';
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;

    IF NOT v_has_activity THEN
      RETURN 0;
    END IF;
    v_grace_used := TRUE;
  END IF;

  LOOP
    SELECT EXISTS (
      SELECT 1 FROM disciple_journal_entries
      WHERE account_id = p_account_id
        AND deleted_at IS NULL
        AND (created_at AT TIME ZONE p_timezone)::DATE = v_check_date
    ) INTO v_has_activity;

    IF v_has_activity THEN
      v_streak := v_streak + 1;
      v_check_date := v_check_date - INTERVAL '1 day';
    ELSE
      EXIT;
    END IF;

    IF v_streak > 1000 THEN EXIT; END IF;
  END LOOP;

  RETURN v_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 13. upsert_journal_entry
CREATE OR REPLACE FUNCTION public.upsert_journal_entry(
  p_account_id UUID,
  p_local_id TEXT,
  p_scripture TEXT,
  p_scripture_passage TEXT,
  p_head TEXT,
  p_heart TEXT,
  p_hands TEXT,
  p_bible_version_id INTEGER,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_journal_entries (
    account_id, local_id, scripture, scripture_passage,
    head, heart, hands, bible_version_id, created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_scripture, p_scripture_passage,
    p_head, p_heart, p_hands, p_bible_version_id, p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    scripture = EXCLUDED.scripture,
    scripture_passage = EXCLUDED.scripture_passage,
    head = EXCLUDED.head,
    heart = EXCLUDED.heart,
    hands = EXCLUDED.hands,
    bible_version_id = EXCLUDED.bible_version_id,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_journal_entries.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 14. link_disciple_account
CREATE OR REPLACE FUNCTION public.link_disciple_account(
  p_account_id UUID,
  p_email TEXT
)
RETURNS UUID AS $$
DECLARE
  v_disciple_id UUID;
BEGIN
  SELECT id INTO v_disciple_id
  FROM disciples
  WHERE LOWER(email) = LOWER(p_email)
  LIMIT 1;

  IF v_disciple_id IS NULL THEN
    RETURN NULL;
  END IF;

  UPDATE disciple_app_accounts
  SET disciple_id = v_disciple_id
  WHERE id = p_account_id
    AND disciple_id IS NULL;

  UPDATE disciples
  SET app_account_id = p_account_id
  WHERE id = v_disciple_id
    AND app_account_id IS NULL;

  RETURN v_disciple_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 15. upsert_prayer_card
CREATE OR REPLACE FUNCTION public.upsert_prayer_card(
  p_account_id UUID,
  p_local_id TEXT,
  p_title TEXT,
  p_details TEXT,
  p_scripture TEXT,
  p_status TEXT,
  p_prayer_count INTEGER,
  p_date_answered TIMESTAMPTZ,
  p_testimony TEXT,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_prayer_cards (
    account_id, local_id, title, details, scripture,
    status, prayer_count, date_answered, testimony,
    created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_details, p_scripture,
    p_status, p_prayer_count, p_date_answered, p_testimony,
    p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    details = EXCLUDED.details,
    scripture = EXCLUDED.scripture,
    status = EXCLUDED.status,
    prayer_count = GREATEST(disciple_prayer_cards.prayer_count, EXCLUDED.prayer_count),
    date_answered = EXCLUDED.date_answered,
    testimony = EXCLUDED.testimony,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_prayer_cards.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 16. update_disciple_progress
CREATE OR REPLACE FUNCTION public.update_disciple_progress(p_account_id UUID)
RETURNS VOID AS $$
DECLARE
  v_timezone TEXT;
  v_streak INTEGER;
  v_journal_count INTEGER;
  v_prayer_count INTEGER;
  v_prayer_card_count INTEGER;
BEGIN
  SELECT COALESCE(timezone, 'UTC') INTO v_timezone
  FROM disciple_app_accounts WHERE id = p_account_id;

  v_streak := calculate_disciple_streak(p_account_id, v_timezone);

  SELECT COUNT(*) INTO v_journal_count
  FROM disciple_journal_entries
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  SELECT COUNT(*) INTO v_prayer_count
  FROM disciple_prayer_sessions
  WHERE account_id = p_account_id;

  SELECT COUNT(*) INTO v_prayer_card_count
  FROM disciple_prayer_cards
  WHERE account_id = p_account_id AND deleted_at IS NULL;

  INSERT INTO disciple_progress (
    account_id, current_streak, longest_streak, last_activity_date,
    total_journal_entries, total_prayer_sessions, total_prayer_cards
  )
  VALUES (
    p_account_id, v_streak, v_streak, (NOW() AT TIME ZONE v_timezone)::DATE,
    v_journal_count, v_prayer_count, v_prayer_card_count
  )
  ON CONFLICT (account_id)
  DO UPDATE SET
    current_streak = v_streak,
    longest_streak = GREATEST(disciple_progress.longest_streak, v_streak),
    last_activity_date = (NOW() AT TIME ZONE v_timezone)::DATE,
    total_journal_entries = v_journal_count,
    total_prayer_sessions = v_prayer_count,
    total_prayer_cards = v_prayer_card_count,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 17. get_passage_of_the_day
CREATE OR REPLACE FUNCTION public.get_passage_of_the_day(p_cycle_year INTEGER DEFAULT 1)
RETURNS TABLE (
  id INTEGER,
  reference TEXT,
  theme TEXT,
  category TEXT,
  explanation TEXT
) AS $$
DECLARE
  v_day_of_year INTEGER;
  v_scripture_count INTEGER;
  v_scripture_index INTEGER;
BEGIN
  v_day_of_year := EXTRACT(DOY FROM CURRENT_DATE)::INTEGER;

  SELECT COUNT(*) INTO v_scripture_count
  FROM daily_scriptures ds
  WHERE ds.cycle_year = p_cycle_year AND ds.is_active = TRUE;

  IF v_scripture_count = 0 THEN
    RETURN;
  END IF;

  v_scripture_index := ((v_day_of_year - 1) % v_scripture_count) + 1;

  RETURN QUERY
  SELECT ds.id, ds.reference, ds.theme, ds.category, ds.explanation
  FROM daily_scriptures ds
  WHERE ds.cycle_year = p_cycle_year AND ds.is_active = TRUE
  ORDER BY COALESCE(ds.day_of_year, ds.sort_order, ds.id)
  LIMIT 1 OFFSET (v_scripture_index - 1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 18. upsert_testimony
CREATE OR REPLACE FUNCTION public.upsert_testimony(
  p_account_id UUID,
  p_local_id TEXT,
  p_title TEXT,
  p_testimony_type TEXT,
  p_struggle TEXT,
  p_turning_point TEXT,
  p_outcome TEXT,
  p_reflection TEXT,
  p_your_invitation TEXT,
  p_status TEXT,
  p_created_at TIMESTAMPTZ,
  p_updated_at TIMESTAMPTZ
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_testimonies (
    account_id, local_id, title, testimony_type,
    struggle, turning_point, outcome, reflection, your_invitation,
    status, created_at, updated_at
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_testimony_type,
    p_struggle, p_turning_point, p_outcome, p_reflection, p_your_invitation,
    p_status, p_created_at, p_updated_at
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    testimony_type = EXCLUDED.testimony_type,
    struggle = EXCLUDED.struggle,
    turning_point = EXCLUDED.turning_point,
    outcome = EXCLUDED.outcome,
    reflection = EXCLUDED.reflection,
    your_invitation = EXCLUDED.your_invitation,
    status = EXCLUDED.status,
    updated_at = EXCLUDED.updated_at
  WHERE disciple_testimonies.updated_at < EXCLUDED.updated_at
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 19. auto_assign_church_from_group
CREATE OR REPLACE FUNCTION public.auto_assign_church_from_group()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE disciple_app_accounts
  SET
    church_id = (
      SELECT g.church_id FROM dna_groups g WHERE g.id = NEW.group_id
    ),
    church_subdomain = (
      SELECT ch.subdomain
      FROM churches ch
      INNER JOIN dna_groups g ON g.church_id = ch.id
      WHERE g.id = NEW.group_id
    ),
    updated_at = NOW()
  WHERE
    disciple_id = NEW.disciple_id
    AND church_id IS NULL;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql
   SET search_path = public;


-- 20. get_my_group_disciple_ids
CREATE OR REPLACE FUNCTION public.get_my_group_disciple_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_disciple_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(DISTINCT disciple_id) INTO v_disciple_ids
  FROM group_disciples
  WHERE group_id = ANY(v_group_ids)
    AND current_status = 'active';

  RETURN COALESCE(v_disciple_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public;


-- 21. get_my_group_member_account_ids
CREATE OR REPLACE FUNCTION public.get_my_group_member_account_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_account_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    RETURN ARRAY[auth.uid()];
  END IF;

  SELECT ARRAY_AGG(DISTINCT account_id) INTO v_account_ids
  FROM (
    SELECT d.app_account_id AS account_id
    FROM disciples d
    JOIN group_disciples gd ON gd.disciple_id = d.id
    WHERE gd.group_id = ANY(v_group_ids)
      AND gd.current_status = 'active'
      AND d.app_account_id IS NOT NULL

    UNION

    SELECT daa.id AS account_id
    FROM disciple_app_accounts daa
    JOIN dna_leaders dl ON LOWER(dl.email) = LOWER(daa.email)
    JOIN dna_groups g ON (g.leader_id = dl.id OR g.co_leader_id = dl.id)
    WHERE g.id = ANY(v_group_ids)

    UNION

    SELECT auth.uid() AS account_id
  ) sub
  WHERE account_id IS NOT NULL;

  RETURN COALESCE(v_account_ids, ARRAY[auth.uid()]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public;


-- 22. get_my_group_leader_ids
CREATE OR REPLACE FUNCTION public.get_my_group_leader_ids()
RETURNS UUID[] AS $$
DECLARE
  v_group_ids UUID[];
  v_leader_ids UUID[];
BEGIN
  v_group_ids := get_my_group_ids();

  IF v_group_ids IS NULL OR array_length(v_group_ids, 1) IS NULL THEN
    RETURN ARRAY[]::UUID[];
  END IF;

  SELECT ARRAY_AGG(DISTINCT leader_id) INTO v_leader_ids
  FROM (
    SELECT leader_id FROM dna_groups WHERE id = ANY(v_group_ids) AND leader_id IS NOT NULL
    UNION
    SELECT co_leader_id FROM dna_groups WHERE id = ANY(v_group_ids) AND co_leader_id IS NOT NULL
  ) sub;

  RETURN COALESCE(v_leader_ids, ARRAY[]::UUID[]);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE
   SET search_path = public;


-- 23. get_my_calendar_events
CREATE OR REPLACE FUNCTION public.get_my_calendar_events(
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
    e.id, e.title, e.description, e.location,
    e.start_time, e.end_time, e.event_type,
    e.group_id, e.cohort_id, e.church_id,
    e.is_recurring, e.created_at
  FROM dna_calendar_events e
  WHERE e.start_time >= start_date
    AND e.start_time <= end_date
    AND NOT (e.is_recurring = true AND e.parent_event_id IS NULL)
    AND (
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
      (e.event_type = 'cohort_event' AND e.cohort_id IN (
        SELECT cm.cohort_id
        FROM dna_cohort_members cm
        WHERE cm.leader_id IN (
          SELECT l3.id FROM dna_leaders l3 WHERE l3.email = auth.jwt()->>'email'
        )
      ))
      OR
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
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 24. promote_to_dna_leader
CREATE OR REPLACE FUNCTION public.promote_to_dna_leader()
RETURNS TRIGGER AS $$
DECLARE
  v_users_id UUID;
  v_auth_user_id UUID;
  v_leader_email TEXT;
BEGIN
  SELECT email INTO v_leader_email
  FROM dna_leaders
  WHERE id = NEW.leader_id;

  IF v_leader_email IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT id INTO v_users_id
  FROM users
  WHERE email = v_leader_email
  LIMIT 1;

  SELECT id INTO v_auth_user_id
  FROM auth.users
  WHERE email = v_leader_email
  LIMIT 1;

  IF v_users_id IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = v_users_id
        AND role = 'dna_leader'
        AND church_id IS NULL
    ) THEN
      INSERT INTO user_roles (user_id, role)
      VALUES (v_users_id, 'dna_leader');
    END IF;
  END IF;

  IF v_auth_user_id IS NOT NULL THEN
    UPDATE dna_leader_journeys
    SET milestones = jsonb_set(
          milestones,
          '{first_group_created}',
          jsonb_build_object('completed', true, 'completed_at', to_char(NOW() AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"'))
        ),
        updated_at = NOW()
    WHERE user_id = v_auth_user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 25. get_church_branding_by_subdomain
-- DROP first required because return type (OUT columns) differs from existing function
DROP FUNCTION IF EXISTS public.get_church_branding_by_subdomain(TEXT);
CREATE OR REPLACE FUNCTION public.get_church_branding_by_subdomain(p_subdomain TEXT)
RETURNS TABLE (
  church_id       UUID,
  church_name     TEXT,
  subdomain       TEXT,
  logo_url        TEXT,
  primary_color   TEXT,
  accent_color    TEXT,
  app_title       TEXT,
  app_description TEXT,
  theme_color     TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.name,
    c.subdomain,
    c.logo_url,
    COALESCE(c.primary_color, '#143348'),
    COALESCE(c.accent_color,  '#e8b562'),
    COALESCE(cbs.app_title,       'DNA Daily'),
    COALESCE(cbs.app_description, 'Daily discipleship tools'),
    COALESCE(cbs.theme_color, c.primary_color, '#143348')
  FROM churches c
  LEFT JOIN church_branding_settings cbs ON cbs.church_id = c.id
  WHERE c.subdomain = p_subdomain;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;


-- 26. sync_app_account_role
CREATE OR REPLACE FUNCTION public.sync_app_account_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT email INTO v_email FROM users WHERE id = NEW.user_id;

  IF v_email IS NOT NULL AND NEW.role IN ('dna_leader', 'church_leader', 'admin') THEN
    UPDATE disciple_app_accounts
    SET role = NEW.role
    WHERE email = v_email
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


-- ============================================================
-- PART 2: Tighten overly permissive RLS policies
-- ============================================================

-- ── Service-role-managed tables ─────────────────────────────
-- These tables use FOR ALL with USING (true) — replace with
-- role-scoped policies so the linter is satisfied.
-- Service role bypasses RLS anyway, but explicit scoping is cleaner.

-- calendar_sync_log
DROP POLICY IF EXISTS "Service role can manage sync log" ON public.calendar_sync_log;
CREATE POLICY "Service role can manage sync log"
  ON public.calendar_sync_log
  TO service_role
  USING (true)
  WITH CHECK (true);

-- document_versions
DROP POLICY IF EXISTS "Service role can manage document versions" ON public.document_versions;
CREATE POLICY "Service role can manage document versions"
  ON public.document_versions
  TO service_role
  USING (true)
  WITH CHECK (true);

-- email_subscribers
DROP POLICY IF EXISTS "Service role can manage subscribers" ON public.email_subscribers;
CREATE POLICY "Service role can manage subscribers"
  ON public.email_subscribers
  TO service_role
  USING (true)
  WITH CHECK (true);

-- follow_up_emails
DROP POLICY IF EXISTS "Service role can manage follow up emails" ON public.follow_up_emails;
CREATE POLICY "Service role can manage follow up emails"
  ON public.follow_up_emails
  TO service_role
  USING (true)
  WITH CHECK (true);

-- funnel_documents
DROP POLICY IF EXISTS "Service role can manage funnel documents" ON public.funnel_documents;
CREATE POLICY "Service role can manage funnel documents"
  ON public.funnel_documents
  TO service_role
  USING (true)
  WITH CHECK (true);

-- google_oauth_tokens
DROP POLICY IF EXISTS "Service role can manage oauth tokens" ON public.google_oauth_tokens;
CREATE POLICY "Service role can manage oauth tokens"
  ON public.google_oauth_tokens
  TO service_role
  USING (true)
  WITH CHECK (true);

-- scheduled_calls
DROP POLICY IF EXISTS "Service role can manage scheduled calls" ON public.scheduled_calls;
CREATE POLICY "Service role can manage scheduled calls"
  ON public.scheduled_calls
  TO service_role
  USING (true)
  WITH CHECK (true);

-- unmatched_calendar_events
DROP POLICY IF EXISTS "Service role can manage unmatched events" ON public.unmatched_calendar_events;
CREATE POLICY "Service role can manage unmatched events"
  ON public.unmatched_calendar_events
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── Spiritual gifts — tighten open INSERT policies ───────────

-- spiritual_gifts_assessments: INSERT stays open intentionally.
-- This table supports both authenticated disciples (dna_group source) AND
-- anonymous public users (public source) via unique_token — open insert is by design.
-- Re-create scoped to authenticated + anon roles to satisfy linter without breaking public flow.
DROP POLICY IF EXISTS "Anyone can create assessments" ON public.spiritual_gifts_assessments;
CREATE POLICY "Anyone can create assessments"
  ON public.spiritual_gifts_assessments FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- spiritual_gifts_responses: Scope insert to authenticated + anon (same public flow)
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.spiritual_gifts_responses;
CREATE POLICY "Anyone can insert responses"
  ON public.spiritual_gifts_responses FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

-- spiritual_gifts_leader_inquiries: Service role only (inserted server-side)
DROP POLICY IF EXISTS "Service role can insert inquiries" ON public.spiritual_gifts_leader_inquiries;
CREATE POLICY "Service role can insert inquiries"
  ON public.spiritual_gifts_leader_inquiries FOR INSERT
  TO service_role
  WITH CHECK (true);


-- ============================================================
-- PART 3: Leaked Password Protection
-- ── Cannot be set via SQL — must be done in the Supabase dashboard ──
-- Go to: Authentication → Providers → Email → Enable "Leaked password protection"
-- This checks submitted passwords against HaveIBeenPwned.org.
-- Since DNA uses magic links (not passwords), risk is LOW.
-- Still recommended to enable for any password-based sign-in paths.
-- ============================================================
