-- ============================================================
-- Migration 060: Fix RLS Performance Warnings
-- Addresses all WARN-level performance findings from Supabase linter
-- ============================================================
-- Part 1: Auth RLS Initialization Plan
--         Replace auth.uid()/auth.jwt() with (select auth.uid())
--         so Postgres evaluates once per query, not once per row.
--
-- Part 2: Multiple Permissive Policies
--         Consolidate overlapping policies per table/action into
--         single policies with OR conditions.
--
-- Part 3: Duplicate Index
--         Drop duplicate index on dna_calendar_events.
-- ============================================================


-- ============================================================
-- PART 1: Fix auth function re-evaluation in RLS policies
-- ============================================================

-- ── fireflies_webhook_log ────────────────────────────────────
DROP POLICY IF EXISTS "fireflies_webhook_log_admin" ON public.fireflies_webhook_log;
CREATE POLICY "fireflies_webhook_log_admin"
  ON public.fireflies_webhook_log
  FOR ALL
  USING ((select auth.jwt()->>'email') IN ('thearkidentity@gmail.com', 'travis@arkidentity.com'));

-- ── fireflies_settings ──────────────────────────────────────
DROP POLICY IF EXISTS "fireflies_settings_admin" ON public.fireflies_settings;
CREATE POLICY "fireflies_settings_admin"
  ON public.fireflies_settings
  FOR ALL
  USING ((select auth.jwt()->>'email') IN ('thearkidentity@gmail.com', 'travis@arkidentity.com'));

-- ── church_progress ─────────────────────────────────────────
DROP POLICY IF EXISTS "church_progress_church_update" ON public.church_progress;
CREATE POLICY "church_progress_church_update"
  ON public.church_progress FOR UPDATE
  USING (
    church_id IN (
      SELECT church_id FROM user_roles
      WHERE user_id = (select auth.uid())
        AND role IN ('church_leader', 'admin')
    )
  );

-- ── dna_leader_journeys ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own journey" ON public.dna_leader_journeys;
CREATE POLICY "Users can view own journey"
  ON public.dna_leader_journeys FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own journey" ON public.dna_leader_journeys;
CREATE POLICY "Users can insert own journey"
  ON public.dna_leader_journeys FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own journey" ON public.dna_leader_journeys;
CREATE POLICY "Users can update own journey"
  ON public.dna_leader_journeys FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── dna_training_modules ────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own modules" ON public.dna_training_modules;
CREATE POLICY "Users can view own modules"
  ON public.dna_training_modules FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own modules" ON public.dna_training_modules;
CREATE POLICY "Users can insert own modules"
  ON public.dna_training_modules FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own modules" ON public.dna_training_modules;
CREATE POLICY "Users can update own modules"
  ON public.dna_training_modules FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── disciple_journal_entries ────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own journal entries" ON public.disciple_journal_entries;
CREATE POLICY "Disciples can view own journal entries"
  ON public.disciple_journal_entries FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own journal entries" ON public.disciple_journal_entries;
CREATE POLICY "Disciples can insert own journal entries"
  ON public.disciple_journal_entries FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can update own journal entries" ON public.disciple_journal_entries;
CREATE POLICY "Disciples can update own journal entries"
  ON public.disciple_journal_entries FOR UPDATE
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can delete own journal entries" ON public.disciple_journal_entries;
CREATE POLICY "Disciples can delete own journal entries"
  ON public.disciple_journal_entries FOR DELETE
  USING (account_id = (select auth.uid()));

-- ── disciple_prayer_cards ───────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own prayer cards" ON public.disciple_prayer_cards;
CREATE POLICY "Disciples can view own prayer cards"
  ON public.disciple_prayer_cards FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own prayer cards" ON public.disciple_prayer_cards;
CREATE POLICY "Disciples can insert own prayer cards"
  ON public.disciple_prayer_cards FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can update own prayer cards" ON public.disciple_prayer_cards;
CREATE POLICY "Disciples can update own prayer cards"
  ON public.disciple_prayer_cards FOR UPDATE
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can delete own prayer cards" ON public.disciple_prayer_cards;
CREATE POLICY "Disciples can delete own prayer cards"
  ON public.disciple_prayer_cards FOR DELETE
  USING (account_id = (select auth.uid()));

-- ── disciple_prayer_sessions ────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own prayer sessions" ON public.disciple_prayer_sessions;
CREATE POLICY "Disciples can view own prayer sessions"
  ON public.disciple_prayer_sessions FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own prayer sessions" ON public.disciple_prayer_sessions;
CREATE POLICY "Disciples can insert own prayer sessions"
  ON public.disciple_prayer_sessions FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

-- ── dna_flow_assessments ────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own assessments" ON public.dna_flow_assessments;
CREATE POLICY "Users can view own assessments"
  ON public.dna_flow_assessments FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own assessments" ON public.dna_flow_assessments;
CREATE POLICY "Users can insert own assessments"
  ON public.dna_flow_assessments FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own assessments" ON public.dna_flow_assessments;
CREATE POLICY "Users can update own assessments"
  ON public.dna_flow_assessments FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── dna_content_unlocks ─────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own unlocks" ON public.dna_content_unlocks;
CREATE POLICY "Users can view own unlocks"
  ON public.dna_content_unlocks FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own unlocks" ON public.dna_content_unlocks;
CREATE POLICY "Users can insert own unlocks"
  ON public.dna_content_unlocks FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own unlocks" ON public.dna_content_unlocks;
CREATE POLICY "Users can update own unlocks"
  ON public.dna_content_unlocks FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── user_session_notes ──────────────────────────────────────
DROP POLICY IF EXISTS "user_session_notes_policy" ON public.user_session_notes;
CREATE POLICY "user_session_notes_policy"
  ON public.user_session_notes
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── user_bookmarks ──────────────────────────────────────────
DROP POLICY IF EXISTS "user_bookmarks_policy" ON public.user_bookmarks;
CREATE POLICY "user_bookmarks_policy"
  ON public.user_bookmarks
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── user_training_certificates ──────────────────────────────
DROP POLICY IF EXISTS "user_training_certificates_policy" ON public.user_training_certificates;
CREATE POLICY "user_training_certificates_policy"
  ON public.user_training_certificates
  FOR ALL
  USING (user_id = (select auth.uid()))
  WITH CHECK (user_id = (select auth.uid()));

-- ── disciple_app_accounts UPDATE + INSERT ───────────────────
-- SELECT consolidated in Part 2 below
DROP POLICY IF EXISTS "Disciples can update own account" ON public.disciple_app_accounts;
CREATE POLICY "Disciples can update own account"
  ON public.disciple_app_accounts FOR UPDATE
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can create own account" ON public.disciple_app_accounts;
CREATE POLICY "Disciples can create own account"
  ON public.disciple_app_accounts FOR INSERT
  WITH CHECK (id = (select auth.uid()));

-- ── disciple_testimonies ────────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own testimonies" ON public.disciple_testimonies;
CREATE POLICY "Disciples can view own testimonies"
  ON public.disciple_testimonies FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own testimonies" ON public.disciple_testimonies;
CREATE POLICY "Disciples can insert own testimonies"
  ON public.disciple_testimonies FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can update own testimonies" ON public.disciple_testimonies;
CREATE POLICY "Disciples can update own testimonies"
  ON public.disciple_testimonies FOR UPDATE
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can delete own testimonies" ON public.disciple_testimonies;
CREATE POLICY "Disciples can delete own testimonies"
  ON public.disciple_testimonies FOR DELETE
  USING (account_id = (select auth.uid()));

-- ── disciple_progress ───────────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own progress" ON public.disciple_progress;
CREATE POLICY "Disciples can view own progress"
  ON public.disciple_progress FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own progress" ON public.disciple_progress;
CREATE POLICY "Disciples can insert own progress"
  ON public.disciple_progress FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can update own progress" ON public.disciple_progress;
CREATE POLICY "Disciples can update own progress"
  ON public.disciple_progress FOR UPDATE
  USING (account_id = (select auth.uid()));

-- ── disciple_creed_progress ─────────────────────────────────
-- Collapse separate view + upsert policies into one FOR ALL
DROP POLICY IF EXISTS "Disciples can view own creed progress" ON public.disciple_creed_progress;
DROP POLICY IF EXISTS "Disciples can upsert own creed progress" ON public.disciple_creed_progress;
CREATE POLICY "Disciples can manage own creed progress"
  ON public.disciple_creed_progress
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── disciple_toolkit_progress ───────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own toolkit progress" ON public.disciple_toolkit_progress;
DROP POLICY IF EXISTS "Disciples can upsert own toolkit progress" ON public.disciple_toolkit_progress;
CREATE POLICY "Disciples can manage own toolkit progress"
  ON public.disciple_toolkit_progress
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── disciple_checkpoint_completions ─────────────────────────
DROP POLICY IF EXISTS "Disciples can view own checkpoint completions" ON public.disciple_checkpoint_completions;
DROP POLICY IF EXISTS "Disciples can upsert own checkpoint completions" ON public.disciple_checkpoint_completions;
CREATE POLICY "Disciples can manage own checkpoint completions"
  ON public.disciple_checkpoint_completions
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── challenge_registrations ─────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own challenge registrations" ON public.challenge_registrations;
CREATE POLICY "Disciples can view own challenge registrations"
  ON public.challenge_registrations FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own challenge registrations" ON public.challenge_registrations;
CREATE POLICY "Disciples can insert own challenge registrations"
  ON public.challenge_registrations FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can update own challenge registrations" ON public.challenge_registrations;
CREATE POLICY "Disciples can update own challenge registrations"
  ON public.challenge_registrations FOR UPDATE
  USING (account_id = (select auth.uid()));

-- ── life_assessment_responses ───────────────────────────────
-- Collapse view + upsert into one FOR ALL
DROP POLICY IF EXISTS "Disciples can view own assessment responses" ON public.life_assessment_responses;
DROP POLICY IF EXISTS "Disciples can upsert own assessment responses" ON public.life_assessment_responses;
CREATE POLICY "Disciples can manage own assessment responses"
  ON public.life_assessment_responses
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── tool_assignments ────────────────────────────────────────
-- Uses disciple_id (not account_id)
DROP POLICY IF EXISTS "Disciples can view own tool assignments" ON public.tool_assignments;
CREATE POLICY "Disciples can view own tool assignments"
  ON public.tool_assignments FOR SELECT
  USING (
    disciple_id IN (
      SELECT disciple_id FROM disciple_app_accounts WHERE id = (select auth.uid())
    )
  );

-- ── tool_completions ────────────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own tool completions" ON public.tool_completions;
CREATE POLICY "Disciples can view own tool completions"
  ON public.tool_completions FOR SELECT
  USING (account_id = (select auth.uid()));

DROP POLICY IF EXISTS "Disciples can insert own tool completions" ON public.tool_completions;
CREATE POLICY "Disciples can insert own tool completions"
  ON public.tool_completions FOR INSERT
  WITH CHECK (account_id = (select auth.uid()));

-- ── disciple_push_subscriptions ─────────────────────────────
-- Collapse view + manage into one FOR ALL
DROP POLICY IF EXISTS "Disciples can view own push subscriptions" ON public.disciple_push_subscriptions;
DROP POLICY IF EXISTS "Disciples can manage own push subscriptions" ON public.disciple_push_subscriptions;
CREATE POLICY "Disciples can manage own push subscriptions"
  ON public.disciple_push_subscriptions
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── disciple_notification_prefs ─────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own notification prefs" ON public.disciple_notification_prefs;
DROP POLICY IF EXISTS "Disciples can manage own notification prefs" ON public.disciple_notification_prefs;
CREATE POLICY "Disciples can manage own notification prefs"
  ON public.disciple_notification_prefs
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── disciple_sync_metadata ──────────────────────────────────
DROP POLICY IF EXISTS "Disciples can view own sync metadata" ON public.disciple_sync_metadata;
DROP POLICY IF EXISTS "Disciples can manage own sync metadata" ON public.disciple_sync_metadata;
CREATE POLICY "Disciples can manage own sync metadata"
  ON public.disciple_sync_metadata
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── group_messages ──────────────────────────────────────────
DROP POLICY IF EXISTS "Members can send messages" ON public.group_messages;
CREATE POLICY "Members can send messages"
  ON public.group_messages FOR INSERT
  WITH CHECK (
    sender_account_id = (select auth.uid())
    AND group_id = ANY(get_my_group_ids())
  );

DROP POLICY IF EXISTS "Senders can update own messages" ON public.group_messages;
CREATE POLICY "Senders can update own messages"
  ON public.group_messages FOR UPDATE
  USING (sender_account_id = (select auth.uid()));

-- ── group_message_reads ─────────────────────────────────────
DROP POLICY IF EXISTS "Users manage own read receipts" ON public.group_message_reads;
CREATE POLICY "Users manage own read receipts"
  ON public.group_message_reads
  FOR ALL
  USING (account_id = (select auth.uid()))
  WITH CHECK (account_id = (select auth.uid()));

-- ── users ───────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view themselves" ON public.users;
CREATE POLICY "Users can view themselves"
  ON public.users FOR SELECT
  USING (id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update themselves" ON public.users;
CREATE POLICY "Users can update themselves"
  ON public.users FOR UPDATE
  USING (id = (select auth.uid()));

-- ── user_roles ──────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view own roles" ON public.user_roles;
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (user_id = (select auth.uid()));

-- ── user_flow_assessments ───────────────────────────────────
DROP POLICY IF EXISTS "Users can view own flow assessments" ON public.user_flow_assessments;
CREATE POLICY "Users can view own flow assessments"
  ON public.user_flow_assessments FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can insert own flow assessments" ON public.user_flow_assessments;
CREATE POLICY "Users can insert own flow assessments"
  ON public.user_flow_assessments FOR INSERT
  WITH CHECK (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own flow assessments" ON public.user_flow_assessments;
CREATE POLICY "Users can update own flow assessments"
  ON public.user_flow_assessments FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── user_training_progress ──────────────────────────────────
DROP POLICY IF EXISTS "Users can view own training progress" ON public.user_training_progress;
CREATE POLICY "Users can view own training progress"
  ON public.user_training_progress FOR SELECT
  USING (user_id = (select auth.uid()));

DROP POLICY IF EXISTS "Users can update own training progress" ON public.user_training_progress;
CREATE POLICY "Users can update own training progress"
  ON public.user_training_progress FOR UPDATE
  USING (user_id = (select auth.uid()));

-- ── church_milestones ───────────────────────────────────────
DROP POLICY IF EXISTS "Church leaders can view their church milestones" ON public.church_milestones;
CREATE POLICY "Church leaders can view their church milestones"
  ON public.church_milestones FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM user_roles
      WHERE user_id = (select auth.uid())
        AND role IN ('church_leader', 'admin')
    )
  );

-- ── spiritual_gifts_assessments ─────────────────────────────
-- Two permissive SELECT policies → one consolidated policy (also fixes init plan)
DROP POLICY IF EXISTS "Users can read their own assessments" ON public.spiritual_gifts_assessments;
DROP POLICY IF EXISTS "DNA leaders can read group assessments" ON public.spiritual_gifts_assessments;
CREATE POLICY "Users and leaders can read spiritual gifts assessments"
  ON public.spiritual_gifts_assessments FOR SELECT
  USING (
    (source = 'dna_group' AND disciple_id = (select auth.uid()))
    OR (source = 'public')
    OR EXISTS (
      SELECT 1 FROM dna_leaders
      WHERE dna_leaders.id = dna_leader_id
        AND dna_leaders.email = (select auth.jwt()->>'email')
    )
  );

DROP POLICY IF EXISTS "Users can update their own assessments" ON public.spiritual_gifts_assessments;
CREATE POLICY "Users can update their own assessments"
  ON public.spiritual_gifts_assessments FOR UPDATE
  USING (
    (source = 'dna_group' AND disciple_id = (select auth.uid()))
    OR (source = 'public')
  );

-- ── spiritual_gifts_responses ───────────────────────────────
DROP POLICY IF EXISTS "Users can read their own responses" ON public.spiritual_gifts_responses;
CREATE POLICY "Users can read their own responses"
  ON public.spiritual_gifts_responses FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM spiritual_gifts_assessments
      WHERE spiritual_gifts_assessments.id = assessment_id
        AND (
          (spiritual_gifts_assessments.source = 'dna_group'
           AND spiritual_gifts_assessments.disciple_id = (select auth.uid()))
          OR spiritual_gifts_assessments.source = 'public'
        )
    )
  );

-- ── co_leader_invitations ───────────────────────────────────
-- Uses invited_by_leader_id / invited_leader_id (references dna_leaders, not auth users)
DROP POLICY IF EXISTS "Leaders can view invitations they sent or received" ON public.co_leader_invitations;
CREATE POLICY "Leaders can view invitations they sent or received"
  ON public.co_leader_invitations FOR SELECT
  USING (
    invited_by_leader_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
    OR invited_leader_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );

DROP POLICY IF EXISTS "Invited leaders can accept their invitation" ON public.co_leader_invitations;
CREATE POLICY "Invited leaders can accept their invitation"
  ON public.co_leader_invitations FOR UPDATE
  USING (
    invited_leader_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );

-- ── dna_cohorts ─────────────────────────────────────────────
-- Two permissive SELECT policies → one + separate service_role policy
DROP POLICY IF EXISTS "Church leaders can view their cohorts" ON public.dna_cohorts;
DROP POLICY IF EXISTS "Service role has full access to cohorts" ON public.dna_cohorts;
CREATE POLICY "Church leaders can view their cohorts"
  ON public.dna_cohorts FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
    )
  );
CREATE POLICY "Service role has full access to cohorts"
  ON public.dna_cohorts
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── dna_cohort_members ──────────────────────────────────────
DROP POLICY IF EXISTS "Cohort members can view their cohort members" ON public.dna_cohort_members;
DROP POLICY IF EXISTS "Service role has full access to cohort members" ON public.dna_cohort_members;
CREATE POLICY "Cohort members can view their cohort members"
  ON public.dna_cohort_members FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );
CREATE POLICY "Service role has full access to cohort members"
  ON public.dna_cohort_members
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── dna_cohort_posts ────────────────────────────────────────
-- Four permissive policies → three targeted + service_role separate
DROP POLICY IF EXISTS "Cohort members can view posts in their cohort" ON public.dna_cohort_posts;
DROP POLICY IF EXISTS "Trainers can create posts in their cohort" ON public.dna_cohort_posts;
DROP POLICY IF EXISTS "Trainers can update their own posts" ON public.dna_cohort_posts;
DROP POLICY IF EXISTS "Service role has full access to cohort posts" ON public.dna_cohort_posts;
CREATE POLICY "Cohort members can view posts in their cohort"
  ON public.dna_cohort_posts FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );
CREATE POLICY "Trainers can create posts in their cohort"
  ON public.dna_cohort_posts FOR INSERT
  WITH CHECK (
    author_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
    AND cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );
CREATE POLICY "Trainers can update their own posts"
  ON public.dna_cohort_posts FOR UPDATE
  USING (
    author_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );
CREATE POLICY "Service role has full access to cohort posts"
  ON public.dna_cohort_posts
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── dna_cohort_discussion ───────────────────────────────────
DROP POLICY IF EXISTS "Cohort members can view discussion in their cohort" ON public.dna_cohort_discussion;
DROP POLICY IF EXISTS "Cohort members can post in discussion" ON public.dna_cohort_discussion;
DROP POLICY IF EXISTS "Authors can update their own discussion posts" ON public.dna_cohort_discussion;
DROP POLICY IF EXISTS "Service role has full access to cohort discussion" ON public.dna_cohort_discussion;
CREATE POLICY "Cohort members can view discussion in their cohort"
  ON public.dna_cohort_discussion FOR SELECT
  USING (
    cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );
CREATE POLICY "Cohort members can post in discussion"
  ON public.dna_cohort_discussion FOR INSERT
  WITH CHECK (
    author_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
    AND cohort_id IN (
      SELECT cohort_id FROM dna_cohort_members
      WHERE leader_id IN (
        SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );
CREATE POLICY "Authors can update their own discussion posts"
  ON public.dna_cohort_discussion FOR UPDATE
  USING (
    author_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );
CREATE POLICY "Service role has full access to cohort discussion"
  ON public.dna_cohort_discussion
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ── dna_calendar_events ─────────────────────────────────────
-- 9 permissive policies → 4 targeted + 1 service_role
-- Preserve exact original subquery logic; wrap auth calls with (select ...)
DROP POLICY IF EXISTS "Group members can view group meeting events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Cohort members can view cohort events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Church members can view church events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "DNA leaders can create group meeting events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Trainers and church admins can create cohort events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Church admins can create church events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Event creators can update their events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Event creators can delete their events" ON public.dna_calendar_events;
DROP POLICY IF EXISTS "Service role has full access to calendar events" ON public.dna_calendar_events;

CREATE POLICY "Members can view their calendar events"
  ON public.dna_calendar_events FOR SELECT
  USING (
    (
      event_type = 'group_meeting'
      AND group_id IN (
        SELECT id FROM dna_groups WHERE leader_id IN (
          SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
        UNION
        SELECT id FROM dna_groups WHERE co_leader_id IN (
          SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
        UNION
        SELECT gd.group_id FROM group_disciples gd
        JOIN disciples d ON d.id = gd.disciple_id
        JOIN disciple_app_accounts daa ON daa.disciple_id = d.id
        WHERE daa.id = (select auth.uid())
      )
    )
    OR (
      event_type = 'cohort_event'
      AND cohort_id IN (
        SELECT cohort_id FROM dna_cohort_members WHERE leader_id IN (
          SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
      )
    )
    OR (
      event_type = 'church_event'
      AND (
        church_id IN (
          SELECT church_id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
        OR church_id IN (
          SELECT g.church_id
          FROM dna_groups g
          JOIN group_disciples gd ON gd.group_id = g.id
          JOIN disciples disc ON disc.id = gd.disciple_id
          JOIN disciple_app_accounts daa ON daa.disciple_id = disc.id
          WHERE daa.id = (select auth.uid())
        )
      )
    )
  );

CREATE POLICY "Leaders can create calendar events"
  ON public.dna_calendar_events FOR INSERT
  WITH CHECK (
    (
      event_type = 'group_meeting'
      AND group_id IN (
        SELECT id FROM dna_groups WHERE leader_id IN (
          SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
        UNION
        SELECT id FROM dna_groups WHERE co_leader_id IN (
          SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email')
        )
      )
    )
    OR (
      event_type = 'cohort_event'
      AND (
        cohort_id IN (
          SELECT cohort_id FROM dna_cohort_members
          WHERE leader_id IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
            AND role = 'trainer'
        )
        OR EXISTS (
          SELECT 1 FROM church_leaders cl
          JOIN dna_cohorts c ON c.church_id = cl.church_id
          WHERE cl.email = (select auth.jwt()->>'email')
            AND c.id = cohort_id
        )
      )
    )
    OR (
      event_type = 'church_event'
      AND church_id IN (
        SELECT church_id FROM church_leaders WHERE email = (select auth.jwt()->>'email')
      )
    )
  );

CREATE POLICY "Event creators can update their events"
  ON public.dna_calendar_events FOR UPDATE
  USING (
    created_by IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );

CREATE POLICY "Event creators can delete their events"
  ON public.dna_calendar_events FOR DELETE
  USING (
    created_by IN (SELECT id FROM dna_leaders WHERE email = (select auth.jwt()->>'email'))
  );

CREATE POLICY "Service role has full access to calendar events"
  ON public.dna_calendar_events
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ============================================================
-- PART 2: Consolidate disciple_app_accounts SELECT
-- Was: "Disciples can view own account" + "Disciples can view group members app accounts"
-- ============================================================
DROP POLICY IF EXISTS "Disciples can view own account" ON public.disciple_app_accounts;
DROP POLICY IF EXISTS "Disciples can view group members app accounts" ON public.disciple_app_accounts;
CREATE POLICY "Disciples can view own or group member accounts"
  ON public.disciple_app_accounts FOR SELECT
  USING (
    id = (select auth.uid())
    OR id = ANY(get_my_group_member_account_ids())
  );


-- ============================================================
-- PART 3: Drop duplicate index on dna_calendar_events
-- idx_dna_calendar_events_start_time is identical to
-- idx_dna_calendar_events_upcoming — drop the less descriptive one
-- ============================================================
DROP INDEX IF EXISTS public.idx_dna_calendar_events_start_time;
