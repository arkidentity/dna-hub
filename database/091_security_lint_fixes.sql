-- 091_security_lint_fixes.sql
-- Resolves all Supabase security advisor lint findings
-- ============================================================

-- ============================================================
-- 1. disciple_link_status: SECURITY DEFINER view → INVOKER
--    PostgreSQL 15+: security_invoker makes the view respect
--    the *querying user's* RLS, not the view owner's.
--    NOTE: underlying tables (disciples, disciple_app_accounts,
--    life_assessment_responses) must have policies that allow
--    the calling role to SELECT — leaders already have these.
-- ============================================================
ALTER VIEW public.disciple_link_status SET (security_invoker = true);


-- ============================================================
-- 2. bible_passage_cache: enable RLS (server cache, read-only)
--    Writes come from service-role API only (bypasses RLS).
--    Read is intentionally public — Bible text is not sensitive.
-- ============================================================
ALTER TABLE public.bible_passage_cache ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read bible passage cache"
  ON public.bible_passage_cache
  FOR SELECT
  USING (true);


-- ============================================================
-- 3. dna_coaches: enable RLS
--    Authenticated users (leaders/disciples) may read coaches.
--    Mutations are service-role only (admin API).
-- ============================================================
ALTER TABLE public.dna_coaches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read coaches"
  ON public.dna_coaches
  FOR SELECT
  TO authenticated
  USING (true);


-- ============================================================
-- 4. Fix mutable search_path on all flagged functions
--    Adding SET search_path = public prevents search_path
--    hijacking attacks.
-- ============================================================

-- 4a. update_church_demo_settings_updated_at
CREATE OR REPLACE FUNCTION public.update_church_demo_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 4b. get_national_cohort_id
CREATE OR REPLACE FUNCTION public.get_national_cohort_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT '00000000-0000-0000-0000-000000000002'::UUID;
$$;

GRANT EXECUTE ON FUNCTION public.get_national_cohort_id TO authenticated;

-- 4c. get_or_create_church_cohort
CREATE OR REPLACE FUNCTION public.get_or_create_church_cohort(p_church_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id UUID;
  v_church_name TEXT;
BEGIN
  SELECT id INTO v_cohort_id
  FROM dna_cohorts
  WHERE church_id = p_church_id AND status = 'active'
  LIMIT 1;

  IF v_cohort_id IS NOT NULL THEN
    RETURN v_cohort_id;
  END IF;

  SELECT name INTO v_church_name FROM churches WHERE id = p_church_id;

  INSERT INTO dna_cohorts (church_id, name, generation, status, started_at)
  VALUES (
    p_church_id,
    COALESCE(v_church_name, 'Church') || ' G1',
    1,
    'active',
    CURRENT_DATE
  )
  RETURNING id INTO v_cohort_id;

  RETURN v_cohort_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_or_create_church_cohort TO authenticated;

-- 4d. add_leader_to_cohort
CREATE OR REPLACE FUNCTION public.add_leader_to_cohort(p_leader_id UUID, p_church_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id UUID;
BEGIN
  IF p_church_id IS NULL OR p_leader_id IS NULL THEN
    RETURN;
  END IF;

  v_cohort_id := get_or_create_church_cohort(p_church_id);

  INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
  VALUES (v_cohort_id, p_leader_id, 'leader')
  ON CONFLICT (cohort_id, leader_id) DO NOTHING;
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_leader_to_cohort TO authenticated;

-- 4e. initialize_training_user
CREATE OR REPLACE FUNCTION public.initialize_training_user(p_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_training_progress (user_id, current_stage)
  VALUES (p_user_id, 'onboarding')
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO user_content_unlocks (user_id, content_type, unlocked, unlocked_at, unlock_trigger)
  VALUES (p_user_id, 'flow_assessment', true, NOW(), 'signup')
  ON CONFLICT (user_id, content_type) DO NOTHING;
END;
$$;

-- 4f. trg_auto_add_leader_to_cohort (latest definition from 076)
CREATE OR REPLACE FUNCTION public.trg_auto_add_leader_to_cohort()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_cohort_id UUID;
  v_is_church_leader BOOLEAN;
BEGIN
  -- Case A: church_id set (new or changed) → enroll in church cohort
  IF NEW.church_id IS NOT NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN

    v_cohort_id := get_or_create_church_cohort(NEW.church_id);

    SELECT EXISTS (
      SELECT 1 FROM church_leaders
      WHERE email = NEW.email AND church_id = NEW.church_id
    ) INTO v_is_church_leader;

    IF v_is_church_leader THEN
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'trainer')
      ON CONFLICT (cohort_id, leader_id)
      DO UPDATE SET role = 'trainer';
    ELSE
      INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
      VALUES (v_cohort_id, NEW.id, 'leader')
      ON CONFLICT (cohort_id, leader_id) DO NOTHING;
    END IF;

  -- Case B: church_id NULL → enroll in national cohort
  ELSIF NEW.church_id IS NULL AND (TG_OP = 'INSERT' OR OLD.church_id IS DISTINCT FROM NEW.church_id) THEN
    INSERT INTO dna_cohort_members (cohort_id, leader_id, role)
    VALUES (get_national_cohort_id(), NEW.id, 'leader')
    ON CONFLICT (cohort_id, leader_id) DO NOTHING;
  END IF;

  -- Case C: moved from independent → church-assigned, remove from national cohort
  IF TG_OP = 'UPDATE'
    AND OLD.church_id IS NULL
    AND NEW.church_id IS NOT NULL
  THEN
    DELETE FROM dna_cohort_members
    WHERE cohort_id = get_national_cohort_id()
      AND leader_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$;

-- 4g. call_dna_cron (vault and net schemas are always fully-qualified)
CREATE OR REPLACE FUNCTION public.call_dna_cron(endpoint text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  base_url text;
  secret text;
BEGIN
  SELECT decrypted_secret INTO base_url
    FROM vault.decrypted_secrets WHERE name = 'daily_dna_url';
  SELECT decrypted_secret INTO secret
    FROM vault.decrypted_secrets WHERE name = 'cron_secret';

  IF base_url IS NULL OR secret IS NULL THEN
    RAISE WARNING '[cron] Missing vault secrets: daily_dna_url or cron_secret';
    RETURN;
  END IF;

  PERFORM net.http_get(
    url := base_url || endpoint,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.call_dna_cron(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.call_dna_cron(text) FROM anon, authenticated;

-- 4h. promote_to_dna_leader (auth.users always fully-qualified)
CREATE OR REPLACE FUNCTION public.promote_to_dna_leader()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    ) THEN
      INSERT INTO user_roles (user_id, role, church_id)
      VALUES (v_users_id, 'dna_leader', NULL);
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
$$;


-- ============================================================
-- 5. Tighten overly-permissive INSERT policies (WITH CHECK true)
-- ============================================================

-- 5a. spiritual_gifts_assessments
--     Old: WITH CHECK (true)
--     New: anonymous may only create 'public' assessments;
--          dna_group assessments require an authenticated session.
DROP POLICY IF EXISTS "Anyone can create assessments" ON public.spiritual_gifts_assessments;

CREATE POLICY "Anyone can create assessments"
  ON public.spiritual_gifts_assessments
  FOR INSERT
  WITH CHECK (
    source = 'public'
    OR (source = 'dna_group' AND auth.uid() IS NOT NULL)
  );

-- 5b. spiritual_gifts_responses
--     Old: WITH CHECK (true)
--     New: the parent assessment must exist (prevents orphan rows
--          and blocks inserts against fabricated assessment IDs).
DROP POLICY IF EXISTS "Anyone can insert responses" ON public.spiritual_gifts_responses;

CREATE POLICY "Anyone can insert responses"
  ON public.spiritual_gifts_responses
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM spiritual_gifts_assessments
      WHERE spiritual_gifts_assessments.id = assessment_id
    )
  );


-- ============================================================
-- 6. Leaked password protection
--    Cannot be enabled via SQL — enable in Supabase Dashboard:
--    Authentication → Sign In / Up → Password strength →
--    toggle "Prevent use of leaked passwords"
-- ============================================================
