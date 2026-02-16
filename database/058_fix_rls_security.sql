-- ============================================================
-- Migration 058: Fix RLS Security Gaps
-- Addresses all ERROR-level security findings from Supabase linter
-- ============================================================
-- Categories:
--   1. Enable RLS on tables that already have policies written
--   2. Critical sensitive tables (tokens, PII, personal data)
--   3. User-scoped personal data tables
--   4. Church-scoped data tables
--   5. Reference/template data (public read, no write)
--   6. Deprecated / audit-only tables


-- ============================================================
-- PART 1: Enable RLS Where Policies Already Exist
-- These tables had policies written but RLS never flipped on.
-- One line each — lowest risk, highest impact.
-- ============================================================

ALTER TABLE public.dna_content_unlocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dna_leader_journeys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_unlocks ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- PART 2: Critical — Tokens & Sensitive Credentials
-- No user should ever query these directly.
-- Service role bypasses RLS so server-side routes are unaffected.
-- ============================================================

-- magic_link_tokens: Raw login tokens. Block all direct access.
ALTER TABLE public.magic_link_tokens ENABLE ROW LEVEL SECURITY;
-- No SELECT/INSERT/UPDATE/DELETE policies — RLS blocks all by default.
-- Only service role (server-side) can read/write.

-- co_leader_invitations: Contains token column granting group access.
ALTER TABLE public.co_leader_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Leaders can view invitations they sent or received"
  ON public.co_leader_invitations FOR SELECT
  USING (
    invited_leader_id IN (
      SELECT id FROM public.dna_leaders WHERE email = auth.jwt()->>'email'
    )
    OR invited_by_leader_id IN (
      SELECT id FROM public.dna_leaders WHERE email = auth.jwt()->>'email'
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Invited leaders can accept their invitation"
  ON public.co_leader_invitations FOR UPDATE
  USING (
    invited_leader_id IN (
      SELECT id FROM public.dna_leaders WHERE email = auth.jwt()->>'email'
    )
  );


-- ============================================================
-- PART 3: User-Scoped Personal Data
-- Each user can only see their own rows. Admins see all.
-- ============================================================

-- users: Identity/contact data
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view themselves"
  ON public.users FOR SELECT
  USING (
    auth.uid() = id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update themselves"
  ON public.users FOR UPDATE
  USING (auth.uid() = id);


-- user_roles: RBAC assignments — critical, read carefully
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles ur
      WHERE ur.user_id = auth.uid() AND ur.role = 'admin'
    )
  );

-- Note: INSERT/UPDATE/DELETE on user_roles is service-role only (no policies = blocked)


-- user_flow_assessments: Personal Flow Assessment responses, reflections, action plans
ALTER TABLE public.user_flow_assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own flow assessments"
  ON public.user_flow_assessments FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can insert own flow assessments"
  ON public.user_flow_assessments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own flow assessments"
  ON public.user_flow_assessments FOR UPDATE
  USING (auth.uid() = user_id);


-- user_training_progress: Training stage progression per user
ALTER TABLE public.user_training_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own training progress"
  ON public.user_training_progress FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Users can update own training progress"
  ON public.user_training_progress FOR UPDATE
  USING (auth.uid() = user_id);


-- ============================================================
-- PART 4: Church-Scoped Data
-- Visible to leaders of that church. Admins see all.
-- ============================================================

-- church_milestones: Church-specific milestone copies and completion tracking
ALTER TABLE public.church_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church leaders can view their church milestones"
  ON public.church_milestones FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND role IN ('church_leader', 'dna_leader')
        AND church_id IS NOT NULL
    )
    OR EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );


-- church_branding_settings: White-label theming — intentionally public read
-- (Daily DNA middleware fetches this unauthenticated by subdomain)
ALTER TABLE public.church_branding_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church branding is publicly readable"
  ON public.church_branding_settings FOR SELECT
  USING (true);

-- Writes remain service-role only (no INSERT/UPDATE policies)


-- ============================================================
-- PART 5: Reference / Template Data (Public Read)
-- Shared lookup tables with no user-specific data.
-- Any authenticated user can read; writes are service-role only.
-- ============================================================

-- phases: Phase definitions (0-5 labels, descriptions)
ALTER TABLE public.phases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Phases are publicly readable"
  ON public.phases FOR SELECT
  USING (true);


-- global_resources: Shared PDF/guide library available to all churches
ALTER TABLE public.global_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Global resources are publicly readable"
  ON public.global_resources FOR SELECT
  USING (true);


-- journey_templates: Master journey template definitions
ALTER TABLE public.journey_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Journey templates are publicly readable"
  ON public.journey_templates FOR SELECT
  USING (true);


-- template_milestones: Master milestone definitions linked to templates
ALTER TABLE public.template_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Template milestones are publicly readable"
  ON public.template_milestones FOR SELECT
  USING (true);


-- milestone_resources: Junction table linking global_resources to template_milestones
ALTER TABLE public.milestone_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Milestone resources are publicly readable"
  ON public.milestone_resources FOR SELECT
  USING (true);


-- ============================================================
-- PART 6: Deprecated & Audit-Only Tables
-- ============================================================

-- milestones_deprecated: Old milestone table, kept for rollback only.
-- Block all direct access — no one should be using this.
ALTER TABLE public.milestones_deprecated ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Deprecated milestones - no direct access"
  ON public.milestones_deprecated
  USING (false);


-- notification_log: Server-side audit log of sent notifications.
-- Service role writes, no user reads needed.
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
-- No policies — RLS blocks all direct access by default.
-- Service role (server-side) bypasses RLS for inserts.


-- ============================================================
-- VERIFICATION NOTES
-- After applying this migration, re-run the Supabase linter.
-- All 23 ERROR items should resolve.
--
-- Tables accessed exclusively via service role are safe even
-- with restrictive policies — service role bypasses RLS.
--
-- Tables that need anon/public read (church_branding_settings,
-- phases, global_resources, etc.) have explicit SELECT USING (true).
-- ============================================================
