-- ============================================================
-- Migration 097: Live Service Mode — Core Tables
-- Created: 2026-03-07
-- Purpose: Database foundation for interactive church services.
--          9 tables for service definitions, live sessions,
--          congregation responses, guest management, and
--          connect card submissions.
-- Depends: churches, users, disciple_app_accounts (existing)
-- ============================================================


-- ============================================
-- SECTION 1: TABLES (FK dependency order)
-- ============================================

-- ============================================
-- 1.1 CHURCH LOCATIONS (campuses)
-- ============================================
CREATE TABLE IF NOT EXISTS church_locations (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  address     TEXT,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_locations_church
  ON church_locations (church_id);


-- ============================================
-- 1.2 SERVICE SCHEDULES (time slots per location)
-- ============================================
CREATE TABLE IF NOT EXISTS service_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id   UUID NOT NULL REFERENCES church_locations(id) ON DELETE CASCADE,
  day_of_week   INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time    TIME NOT NULL,
  label         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_schedules_location
  ON service_schedules (location_id);


-- ============================================
-- 1.3 CHURCH GUESTS (QR entry visitors)
-- ============================================
CREATE TABLE IF NOT EXISTS church_guests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id         UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name              TEXT NOT NULL,
  email             TEXT,
  phone             TEXT,
  session_token     TEXT UNIQUE,
  merged_to_user_id UUID,            -- no FK (avoids cross-schema complexity)
  first_visit_at    TIMESTAMPTZ DEFAULT now(),
  last_visit_at     TIMESTAMPTZ DEFAULT now(),
  visit_count       INTEGER DEFAULT 1,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_church_guests_church
  ON church_guests (church_id);

CREATE INDEX IF NOT EXISTS idx_church_guests_session_token
  ON church_guests (session_token) WHERE session_token IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_church_guests_email
  ON church_guests (church_id, email) WHERE email IS NOT NULL;


-- ============================================
-- 1.4 INTERACTIVE SERVICES (service definitions)
-- ============================================
CREATE TABLE IF NOT EXISTS interactive_services (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id     UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  location_id   UUID REFERENCES church_locations(id) ON DELETE SET NULL,
  schedule_id   UUID REFERENCES service_schedules(id) ON DELETE SET NULL,
  title         TEXT NOT NULL,
  service_date  DATE,
  created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
  status        TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'live', 'archived')),
  is_template   BOOLEAN DEFAULT false,
  template_name TEXT,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_interactive_services_church
  ON interactive_services (church_id, status);

CREATE INDEX IF NOT EXISTS idx_interactive_services_date
  ON interactive_services (church_id, service_date DESC);

CREATE INDEX IF NOT EXISTS idx_interactive_services_templates
  ON interactive_services (church_id, is_template) WHERE is_template = true;


-- ============================================
-- 1.5 SERVICE BLOCKS (ordered blocks within service)
-- ============================================
CREATE TABLE IF NOT EXISTS service_blocks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id      UUID NOT NULL REFERENCES interactive_services(id) ON DELETE CASCADE,
  block_type      TEXT NOT NULL CHECK (block_type IN (
    'scripture', 'teaching_note', 'creed_card', 'worship_set',
    'poll', 'open_response', 'breakout_prompt',
    'giving', 'next_steps', 'connect_card'
  )),
  config          JSONB NOT NULL DEFAULT '{}',
  sort_order      INTEGER NOT NULL,
  is_active       BOOLEAN DEFAULT false,
  activated_at    TIMESTAMPTZ,
  deactivated_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_service_blocks_order
  ON service_blocks (service_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_service_blocks_active
  ON service_blocks (service_id, is_active) WHERE is_active = true;


-- ============================================
-- 1.6 LIVE SESSIONS (active service state)
-- ============================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id       UUID NOT NULL REFERENCES interactive_services(id) ON DELETE CASCADE,
  church_id        UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  is_live          BOOLEAN DEFAULT true,
  current_block_id UUID REFERENCES service_blocks(id) ON DELETE SET NULL,
  started_at       TIMESTAMPTZ DEFAULT now(),
  ended_at         TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_live_sessions_church_live
  ON live_sessions (church_id, is_live) WHERE is_live = true;

CREATE INDEX IF NOT EXISTS idx_live_sessions_service
  ON live_sessions (service_id);


-- ============================================
-- 1.7 BLOCK RESPONSES (congregation responses)
-- ============================================
CREATE TABLE IF NOT EXISTS block_responses (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id       UUID NOT NULL REFERENCES service_blocks(id) ON DELETE CASCADE,
  session_id     UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id        UUID,                -- no FK (avoids cross-schema complexity; RLS uses auth.uid())
  guest_id       UUID REFERENCES church_guests(id) ON DELETE SET NULL,
  response_type  TEXT NOT NULL CHECK (response_type IN (
    'poll_vote', 'open_text', 'next_step_tap', 'breakout_checkin'
  )),
  response_data  JSONB NOT NULL DEFAULT '{}',
  is_approved    BOOLEAN,
  created_at     TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_block_responses_block
  ON block_responses (block_id, response_type);

CREATE INDEX IF NOT EXISTS idx_block_responses_session
  ON block_responses (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_block_responses_user
  ON block_responses (user_id) WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_block_responses_moderation
  ON block_responses (block_id, is_approved)
  WHERE is_approved IS NULL OR is_approved = false;


-- ============================================
-- 1.8 BLOCK RESPONSE COUNTS (denormalized aggregates)
-- ============================================
CREATE TABLE IF NOT EXISTS block_response_counts (
  block_id    UUID PRIMARY KEY REFERENCES service_blocks(id) ON DELETE CASCADE,
  counts      JSONB NOT NULL DEFAULT '{}',
  total       INTEGER DEFAULT 0,
  updated_at  TIMESTAMPTZ DEFAULT now()
);


-- ============================================
-- 1.9 CONNECT CARD SUBMISSIONS
-- ============================================
CREATE TABLE IF NOT EXISTS connect_card_submissions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  block_id        UUID NOT NULL REFERENCES service_blocks(id) ON DELETE CASCADE,
  session_id      UUID NOT NULL REFERENCES live_sessions(id) ON DELETE CASCADE,
  user_id         UUID,              -- no FK (same pattern as block_responses)
  guest_id        UUID REFERENCES church_guests(id) ON DELETE SET NULL,
  is_first_time   BOOLEAN,
  address         TEXT,
  how_heard       TEXT,
  prayer_request  TEXT,
  custom_fields   JSONB,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_connect_card_submissions_session
  ON connect_card_submissions (session_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_connect_card_submissions_block
  ON connect_card_submissions (block_id);


-- ============================================
-- SECTION 2: ROW LEVEL SECURITY
-- ============================================

-- ============================================
-- 2.1 RLS: church_locations
-- ============================================
ALTER TABLE church_locations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "church_locations_select"
  ON church_locations FOR SELECT
  USING (
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );
-- INSERT/UPDATE/DELETE: service role only (Hub admin)


-- ============================================
-- 2.2 RLS: service_schedules
-- ============================================
ALTER TABLE service_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_schedules_select"
  ON service_schedules FOR SELECT
  USING (
    location_id IN (
      SELECT cl.id FROM church_locations cl
      WHERE cl.church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
  );
-- INSERT/UPDATE/DELETE: service role only


-- ============================================
-- 2.3 RLS: church_guests
-- ============================================
ALTER TABLE church_guests ENABLE ROW LEVEL SECURITY;

-- Anon can insert (QR registration)
CREATE POLICY "church_guests_insert_anon"
  ON church_guests FOR INSERT
  WITH CHECK (true);

-- SELECT/UPDATE/DELETE: service role + RPCs only


-- ============================================
-- 2.4 RLS: interactive_services
-- ============================================
ALTER TABLE interactive_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "interactive_services_select"
  ON interactive_services FOR SELECT
  USING (
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );
-- INSERT/UPDATE/DELETE: service role only


-- ============================================
-- 2.5 RLS: service_blocks
-- ============================================
ALTER TABLE service_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "service_blocks_select"
  ON service_blocks FOR SELECT
  USING (
    service_id IN (
      SELECT isvc.id FROM interactive_services isvc
      WHERE isvc.church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
  );
-- INSERT/UPDATE/DELETE: service role only


-- ============================================
-- 2.6 RLS: live_sessions
-- ============================================
ALTER TABLE live_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "live_sessions_select"
  ON live_sessions FOR SELECT
  USING (
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );
-- INSERT/UPDATE/DELETE: service role only


-- ============================================
-- 2.7 RLS: block_responses
-- ============================================
ALTER TABLE block_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_responses_select_own"
  ON block_responses FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "block_responses_insert"
  ON block_responses FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);


-- ============================================
-- 2.8 RLS: block_response_counts
-- ============================================
ALTER TABLE block_response_counts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "block_response_counts_select"
  ON block_response_counts FOR SELECT
  USING (
    block_id IN (
      SELECT sb.id FROM service_blocks sb
      JOIN interactive_services isvc ON isvc.id = sb.service_id
      WHERE isvc.church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
  );
-- INSERT/UPDATE: trigger function only (SECURITY DEFINER)


-- ============================================
-- 2.9 RLS: connect_card_submissions
-- ============================================
ALTER TABLE connect_card_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "connect_card_submissions_select_own"
  ON connect_card_submissions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "connect_card_submissions_insert"
  ON connect_card_submissions FOR INSERT
  WITH CHECK (user_id = auth.uid() OR user_id IS NULL);


-- ============================================
-- SECTION 3: UPDATED_AT TRIGGERS
-- ============================================

CREATE TRIGGER update_interactive_services_updated_at
  BEFORE UPDATE ON interactive_services
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_block_response_counts_updated_at
  BEFORE UPDATE ON block_response_counts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();


-- ============================================
-- SECTION 4: REALTIME PUBLICATION
-- ============================================

ALTER PUBLICATION supabase_realtime ADD TABLE service_blocks;
ALTER PUBLICATION supabase_realtime ADD TABLE live_sessions;
ALTER PUBLICATION supabase_realtime ADD TABLE block_response_counts;
