-- ============================================================
-- Migration 116: Pathway Builder
-- Church admins customize their discipleship pathway by
-- arranging tools from ARK's library into a weekly sequence.
-- ============================================================

-- ============================================================
-- 1. pathway_tools — ARK-controlled tool library
-- ============================================================

CREATE TABLE pathway_tools (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('spiritual_formation', 'community', 'mission', 'assessment')),
  tool_type TEXT NOT NULL CHECK (tool_type IN ('app_tool', 'activity')),
  app_route TEXT,
  icon_name TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_pathway_tools_active ON pathway_tools(is_active, sort_order);

-- ============================================================
-- 2. church_pathways — Per-church, per-phase configuration
--    church_id = NULL is the ARK default pathway
-- ============================================================

CREATE TABLE church_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID REFERENCES churches(id) ON DELETE CASCADE,
  phase INTEGER NOT NULL CHECK (phase IN (1, 2)),
  week_count INTEGER NOT NULL CHECK (week_count BETWEEN 1 AND 26),
  is_customized BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(church_id, phase)
);

CREATE INDEX idx_church_pathways_church ON church_pathways(church_id);

-- ============================================================
-- 3. church_pathway_items — Tools assigned to weeks
-- ============================================================

CREATE TABLE church_pathway_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pathway_id UUID REFERENCES church_pathways(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL CHECK (week_number >= 1),
  tool_id INTEGER REFERENCES pathway_tools(id) NOT NULL,
  UNIQUE(pathway_id, week_number)
);

CREATE INDEX idx_church_pathway_items_pathway ON church_pathway_items(pathway_id);

-- ============================================================
-- 4. group_phase_state — Leader-controlled phase transitions
-- ============================================================

CREATE TABLE group_phase_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES dna_groups(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_phase INTEGER NOT NULL DEFAULT 1 CHECK (current_phase IN (1, 2)),
  phase_2_unlocked_at TIMESTAMPTZ,
  unlocked_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_group_phase_state_group ON group_phase_state(group_id);

-- ============================================================
-- 5. disciple_pathway_completions — One row per completed week
-- ============================================================

CREATE TABLE disciple_pathway_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID REFERENCES disciple_app_accounts(id) ON DELETE CASCADE NOT NULL,
  phase INTEGER NOT NULL CHECK (phase IN (1, 2)),
  week_number INTEGER NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(account_id, phase, week_number)
);

CREATE INDEX idx_disciple_pathway_completions_account ON disciple_pathway_completions(account_id);
CREATE INDEX idx_disciple_pathway_completions_phase ON disciple_pathway_completions(account_id, phase);

-- ============================================================
-- 6. RLS Policies
-- ============================================================

ALTER TABLE pathway_tools ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pathway tools"
  ON pathway_tools FOR SELECT USING (true);

ALTER TABLE church_pathways ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read church pathways"
  ON church_pathways FOR SELECT TO authenticated USING (true);

ALTER TABLE church_pathway_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read pathway items"
  ON church_pathway_items FOR SELECT TO authenticated USING (true);
-- Anon also needs read for Daily DNA guests / non-auth fallback
CREATE POLICY "Anon can read pathway items"
  ON church_pathway_items FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read church pathways"
  ON church_pathways FOR SELECT TO anon USING (true);
CREATE POLICY "Anon can read pathway tools"
  ON pathway_tools FOR SELECT TO anon USING (true);

ALTER TABLE group_phase_state ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read group phase state"
  ON group_phase_state FOR SELECT TO authenticated USING (true);

ALTER TABLE disciple_pathway_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Disciples manage own completions"
  ON disciple_pathway_completions FOR ALL TO authenticated
  USING (account_id = auth.uid())
  WITH CHECK (account_id = auth.uid());

-- ============================================================
-- 7. RPCs
-- ============================================================

-- 7a. Get the effective pathway for a church+phase
--     Falls back to ARK default (church_id IS NULL) if no custom pathway exists
CREATE OR REPLACE FUNCTION get_effective_pathway(
  p_church_id UUID,
  p_phase INTEGER
)
RETURNS TABLE (
  week_number INTEGER,
  tool_id INTEGER,
  tool_slug TEXT,
  tool_name TEXT,
  tool_description TEXT,
  tool_type TEXT,
  app_route TEXT,
  category TEXT,
  icon_name TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_pathway_id UUID;
BEGIN
  -- Try church-specific pathway first
  SELECT cp.id INTO v_pathway_id
  FROM church_pathways cp
  WHERE cp.church_id = p_church_id AND cp.phase = p_phase;

  -- Fall back to ARK default
  IF v_pathway_id IS NULL THEN
    SELECT cp.id INTO v_pathway_id
    FROM church_pathways cp
    WHERE cp.church_id IS NULL AND cp.phase = p_phase;
  END IF;

  IF v_pathway_id IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    cpi.week_number,
    pt.id AS tool_id,
    pt.slug AS tool_slug,
    pt.name AS tool_name,
    pt.description AS tool_description,
    pt.tool_type,
    pt.app_route,
    pt.category,
    pt.icon_name
  FROM church_pathway_items cpi
  JOIN pathway_tools pt ON pt.id = cpi.tool_id
  WHERE cpi.pathway_id = v_pathway_id
  ORDER BY cpi.week_number;
END;
$$;

GRANT EXECUTE ON FUNCTION get_effective_pathway TO anon, authenticated;

-- 7b. Get disciple's full pathway with progress
CREATE OR REPLACE FUNCTION get_disciple_pathway_progress(
  p_account_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_church_id UUID;
  v_group_id UUID;
  v_current_phase INTEGER;
  v_result JSONB;
BEGIN
  -- Get disciple's church and active group
  SELECT daa.church_id, gd.group_id
  INTO v_church_id, v_group_id
  FROM disciple_app_accounts daa
  LEFT JOIN group_disciples gd
    ON gd.disciple_id = (
      SELECT d.id FROM disciples d WHERE d.app_account_id = daa.id LIMIT 1
    )
    AND gd.current_status = 'active'
  WHERE daa.id = p_account_id
  LIMIT 1;

  -- Get current phase from group state (default 1)
  IF v_group_id IS NOT NULL THEN
    SELECT COALESCE(gps.current_phase, 1)
    INTO v_current_phase
    FROM group_phase_state gps
    WHERE gps.group_id = v_group_id;
  END IF;

  v_current_phase := COALESCE(v_current_phase, 1);

  -- Build phases array
  SELECT jsonb_build_object(
    'current_phase', v_current_phase,
    'church_id', v_church_id,
    'group_id', v_group_id,
    'phases', jsonb_agg(phase_obj ORDER BY phase_num)
  ) INTO v_result
  FROM (
    SELECT
      phase_num,
      jsonb_build_object(
        'phase', phase_num,
        'week_count', COALESCE(
          (SELECT cp.week_count FROM church_pathways cp WHERE cp.church_id = v_church_id AND cp.phase = phase_num),
          (SELECT cp.week_count FROM church_pathways cp WHERE cp.church_id IS NULL AND cp.phase = phase_num),
          12
        ),
        'is_active', phase_num <= v_current_phase,
        'weeks', COALESCE(
          (
            SELECT jsonb_agg(
              jsonb_build_object(
                'week_number', ep.week_number,
                'tool_slug', ep.tool_slug,
                'tool_name', ep.tool_name,
                'tool_description', ep.tool_description,
                'tool_type', ep.tool_type,
                'app_route', ep.app_route,
                'category', ep.category,
                'icon_name', ep.icon_name,
                'completed', EXISTS (
                  SELECT 1 FROM disciple_pathway_completions dpc
                  WHERE dpc.account_id = p_account_id
                    AND dpc.phase = phase_num
                    AND dpc.week_number = ep.week_number
                )
              ) ORDER BY ep.week_number
            )
            FROM get_effective_pathway(v_church_id, phase_num) ep
          ),
          '[]'::jsonb
        )
      ) AS phase_obj
    FROM (VALUES (1), (2)) AS phases(phase_num)
  ) sub;

  RETURN COALESCE(v_result, '{}'::jsonb);
END;
$$;

GRANT EXECUTE ON FUNCTION get_disciple_pathway_progress TO authenticated;

-- ============================================================
-- 8. Seed Data: Tool Library (15 tools)
-- ============================================================

INSERT INTO pathway_tools (slug, name, description, category, tool_type, app_route, icon_name, sort_order) VALUES
(
  'life_assessment',
  'Life Assessment',
  'Take a baseline snapshot of your spiritual, emotional, relational, and practical health. This isn''t about being "spiritual enough" — it''s about identifying where you are so you can grow. Answer honestly. You''ll retake this later to measure your growth.',
  'assessment', 'app_tool', '/tools/life-assessment', 'ClipboardCheck', 1
),
(
  '3d_journal',
  '3D Journal',
  'The 3D Journal is a simple method for hearing God through Scripture. Most Christians struggle with Bible reading because they don''t know how to move from information to transformation. The 3D Journal bridges that gap using the Head, Heart, Hands method.',
  'spiritual_formation', 'app_tool', '/journal', 'BookOpen', 2
),
(
  '4d_prayer',
  '4D Prayer',
  'Prayer isn''t just asking God for things — it''s partnering with Him. Practice the 4D Prayer Rhythm: Revere (worship God for who He is), Reflect (thank God for what He''s done), Request (intercede for others), Rest (be still and listen).',
  'spiritual_formation', 'app_tool', '/prayer', 'Heart', 3
),
(
  'creed_cards',
  'Creed Cards',
  'A creed is a statement of belief. Throughout Christian history, the church has used creeds to say, "These are the non-negotiables." Creed Cards help you learn and wrestle with foundational truths — bite-sized, biblical doctrines rooted in 2,000 years of Christian history.',
  'spiritual_formation', 'app_tool', '/creed-cards', 'Shield', 4
),
(
  'qa_questions',
  'Q&A Question Time',
  'It''s okay to have questions. It''s okay to doubt. This is a safe space to bring your hardest questions about faith, the Bible, God, or anything else. Come prepared with at least one question you''ve been wrestling with.',
  'community', 'app_tool', '/tools/qa-questions', 'HelpCircle', 5
),
(
  'listening_prayer',
  'Listening Prayer Circle',
  'Practice hearing God''s voice — not just for yourself, but for others. You''ve been journaling and praying. Now it''s time to step out and speak what you sense God saying to someone else. Don''t worry about being perfect. Your group is a safe place to practice.',
  'spiritual_formation', 'app_tool', '/tools/listening-prayer', 'Ear', 6
),
(
  'outreach_mission',
  'Outreach Mission',
  'Faith isn''t meant to stay inside the walls of a meeting room. Your group will do an outreach activity together — putting your faith into action. Pray for opportunities to share God''s love. Be ready to serve without expecting anything in return.',
  'mission', 'activity', NULL, 'Globe', 7
),
(
  'testimony_builder',
  'Testimony Builder',
  'Craft and refine your personal testimony using the STORY framework. Your story matters. Learning to tell it clearly and authentically is one of the most powerful tools you have for sharing your faith.',
  'mission', 'app_tool', '/tools/testimony-builder', 'Mic', 8
),
(
  'breaking_strongholds',
  'Breaking Strongholds',
  'A stronghold is a lie you believe that keeps you from freedom. It could be shame, fear, addiction, bitterness, or false beliefs about God or yourself. Identify strongholds and begin breaking them: Reveal the lie, Renounce it out loud, Replace it with God''s truth.',
  'spiritual_formation', 'app_tool', NULL, 'Hammer', 9
),
(
  'identity_shift',
  'Identity Shift',
  'You are not what you do. You are not what others say about you. You are who GOD says you are. This week is about cementing your identity in Christ — not in performance, success, failure, or the opinions of others.',
  'spiritual_formation', 'app_tool', NULL, 'Sparkles', 10
),
(
  'ministry_gifts',
  'Ministry Gifts & Activation',
  'God has given you spiritual gifts — unique abilities to serve Him and others. Discover your gifts across three tiers: how you serve (Romans 12), supernatural empowerment (1 Corinthians 12), and leadership calling (Ephesians 4:11).',
  'assessment', 'app_tool', '/tools/spiritual-gifts', 'Gift', 11
),
(
  'simple_fellowship',
  'Simple Fellowship / Outing',
  'Enjoy time together outside the group meeting. Build real relationships. Go do something fun — pick up golf balls, grab coffee, serve at a food bank. Watch for natural opportunities to share God''s love with people you meet along the way.',
  'community', 'activity', NULL, 'Users', 12
),
(
  'rest_sabbath',
  'Rest / Sabbath',
  'Practice intentional rest as a spiritual discipline. Instead of filling your time with busyness, take time to be still with God — in silence, with soaking music, or simply with no phone. Learn the art of being present with the Father.',
  'spiritual_formation', 'activity', NULL, 'Moon', 13
),
(
  'worship_experience',
  'Worship Experience',
  'Gather together for a time of worship and adoration. Put on a playlist and let the Holy Spirit lead. Pray for one another. This is a space for surrender, encounter, and connection with God as a community.',
  'community', 'activity', NULL, 'Music', 14
),
(
  'art_of_questions',
  'The Art of Asking Questions',
  'Learn to ask the right questions to help people open their hearts. Move from surface-level questions to personal questions to transformative questions. Become a better listener and communicator — leading people through conversation to a place of transformation.',
  'community', 'app_tool', NULL, 'MessageCircleQuestion', 15
);

-- ============================================================
-- 9. Seed Data: ARK Default Phase 1 Pathway (12 weeks)
-- ============================================================

DO $$
DECLARE
  v_pathway_id UUID;
BEGIN
  -- Create the ARK default Phase 1 pathway (church_id = NULL)
  INSERT INTO church_pathways (id, church_id, phase, week_count, is_customized)
  VALUES (gen_random_uuid(), NULL, 1, 12, FALSE)
  RETURNING id INTO v_pathway_id;

  -- Insert 12 weeks
  INSERT INTO church_pathway_items (pathway_id, week_number, tool_id)
  SELECT v_pathway_id, w.week_num, pt.id
  FROM (VALUES
    (1, 'life_assessment'),
    (2, '3d_journal'),
    (3, '4d_prayer'),
    (4, 'creed_cards'),
    (5, 'qa_questions'),
    (6, 'listening_prayer'),
    (7, 'outreach_mission'),
    (8, 'testimony_builder'),
    (9, 'breaking_strongholds'),
    (10, 'identity_shift'),
    (11, 'ministry_gifts'),
    (12, 'life_assessment')
  ) AS w(week_num, tool_slug)
  JOIN pathway_tools pt ON pt.slug = w.tool_slug;
END $$;

-- ============================================================
-- 10. Seed Data: ARK Default Phase 2 Pathway (12 weeks)
--     Placeholder — Travis will define final content later.
--     Repeats some Phase 1 tools (disciples now facilitate).
-- ============================================================

DO $$
DECLARE
  v_pathway_id UUID;
BEGIN
  INSERT INTO church_pathways (id, church_id, phase, week_count, is_customized)
  VALUES (gen_random_uuid(), NULL, 2, 12, FALSE)
  RETURNING id INTO v_pathway_id;

  INSERT INTO church_pathway_items (pathway_id, week_number, tool_id)
  SELECT v_pathway_id, w.week_num, pt.id
  FROM (VALUES
    (1, '3d_journal'),
    (2, '4d_prayer'),
    (3, 'creed_cards'),
    (4, 'qa_questions'),
    (5, 'listening_prayer'),
    (6, 'testimony_builder'),
    (7, 'breaking_strongholds'),
    (8, 'identity_shift'),
    (9, 'ministry_gifts'),
    (10, 'outreach_mission'),
    (11, 'simple_fellowship'),
    (12, 'life_assessment')
  ) AS w(week_num, tool_slug)
  JOIN pathway_tools pt ON pt.slug = w.tool_slug;
END $$;
