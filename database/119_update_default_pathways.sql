-- ============================================================
-- Migration 119: Update ARK Default Pathways to BLVD Configuration
-- Replaces default Phase 1 (12 weeks) and Phase 2 (14 weeks)
-- Churches with custom pathways are NOT affected.
-- ============================================================

-- Phase 1: Delete old default items, update week_count, insert new items
DO $$
DECLARE
  v_pathway_id UUID;
BEGIN
  -- Find the ARK default Phase 1 pathway
  SELECT id INTO v_pathway_id
  FROM church_pathways
  WHERE church_id IS NULL AND phase = 1;

  -- Delete existing items
  DELETE FROM church_pathway_items WHERE pathway_id = v_pathway_id;

  -- Update week count
  UPDATE church_pathways SET week_count = 12, updated_at = NOW() WHERE id = v_pathway_id;

  -- Insert BLVD Phase 1 (12 weeks)
  INSERT INTO church_pathway_items (pathway_id, week_number, tool_id)
  SELECT v_pathway_id, w.week_num, pt.id
  FROM (VALUES
    (1,  'life_assessment'),
    (2,  '3d_journal'),
    (3,  '4d_prayer'),
    (4,  'creed_cards'),
    (5,  'communion'),
    (6,  'art_of_questions'),
    (7,  'outreach_mission'),
    (8,  'testimony_builder'),
    (9,  'breaking_strongholds'),
    (10, 'identity_shift'),
    (11, 'ministry_gifts'),
    (12, 'life_assessment')
  ) AS w(week_num, tool_slug)
  JOIN pathway_tools pt ON pt.slug = w.tool_slug;
END $$;

-- Phase 2: Delete old default items, update week_count, insert new items
DO $$
DECLARE
  v_pathway_id UUID;
BEGIN
  -- Find the ARK default Phase 2 pathway
  SELECT id INTO v_pathway_id
  FROM church_pathways
  WHERE church_id IS NULL AND phase = 2;

  -- Delete existing items
  DELETE FROM church_pathway_items WHERE pathway_id = v_pathway_id;

  -- Update week count to 14
  UPDATE church_pathways SET week_count = 14, updated_at = NOW() WHERE id = v_pathway_id;

  -- Insert BLVD Phase 2 (14 weeks)
  INSERT INTO church_pathway_items (pathway_id, week_number, tool_id)
  SELECT v_pathway_id, w.week_num, pt.id
  FROM (VALUES
    (1,  'rest_sabbath'),
    (2,  '3d_journal'),
    (3,  '4d_prayer'),
    (4,  'creed_cards'),
    (5,  'simple_fellowship'),
    (6,  'listening_prayer'),
    (7,  'qa_questions'),
    (8,  'communion'),
    (9,  'worship_experience'),
    (10, 'outreach_mission'),
    (11, 'testimony_builder'),
    (12, '3d_journal'),
    (13, '4d_prayer'),
    (14, 'creed_cards')
  ) AS w(week_num, tool_slug)
  JOIN pathway_tools pt ON pt.slug = w.tool_slug;
END $$;
