-- ============================================================
-- Migration 106: Bug Fixes — Fill-in-Blank + Next Steps
-- Created: 2026-03-08
-- Purpose: Three critical fixes for live service blocks.
--
-- Bug A: fill_in_blank response_type CHECK constraint
--   Migration 104 tried DROP CONSTRAINT IF EXISTS with
--   an assumed name. If the original unnamed constraint
--   had a different auto-generated name, the drop silently
--   failed, leaving the old CHECK (without fill_in_blank)
--   active. Fix: drop ALL check constraints on the column,
--   then re-add with explicit name.
--
-- Bug B: NextSteps aggregation trigger
--   Trigger only extracts per-option keys for poll_vote.
--   For next_step_tap it stores { "next_step_tap": N }
--   instead of per-step counts { "step_1": N, "step_2": N }.
--   Fix: extract response_data->>'step' for next_step_tap.
--
-- GOTCHA: DROP + CREATE trigger = re-add GRANT if needed.
-- ============================================================


-- ============================================
-- SECTION 1: FIX response_type CHECK
-- Drop ALL check constraints on block_responses,
-- then re-add with the correct values.
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  -- Drop every CHECK constraint on block_responses
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'block_responses'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'  -- CHECK constraints only
  LOOP
    EXECUTE format('ALTER TABLE block_responses DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

-- Re-add with explicit name and all valid types
ALTER TABLE block_responses ADD CONSTRAINT block_responses_response_type_check
  CHECK (response_type IN (
    'poll_vote', 'open_text', 'next_step_tap', 'breakout_checkin',
    'connect_card', 'fill_in_blank'
  ));


-- ============================================
-- SECTION 2: FIX block_type CHECK (same issue)
-- ============================================

DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'service_blocks'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE service_blocks DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE service_blocks ADD CONSTRAINT service_blocks_block_type_check
  CHECK (block_type IN (
    'scripture', 'teaching_note', 'creed_card', 'worship_set',
    'poll', 'open_response', 'breakout_prompt',
    'giving', 'next_steps', 'connect_card',
    'fill_in_blank'
  ));


-- ============================================
-- SECTION 3: FIX aggregation trigger
-- Extract per-step keys for next_step_tap
-- (same pattern as poll_vote extracting option)
-- ============================================

CREATE OR REPLACE FUNCTION update_block_response_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_option_key TEXT;
BEGIN
  -- Determine the count key based on response type
  IF NEW.response_type = 'poll_vote' THEN
    v_option_key := NEW.response_data->>'option';
  ELSIF NEW.response_type = 'next_step_tap' THEN
    v_option_key := COALESCE(NEW.response_data->>'step', NEW.response_type);
  ELSE
    v_option_key := NEW.response_type;
  END IF;

  -- Upsert: create row on first response, increment on subsequent
  INSERT INTO block_response_counts (block_id, counts, total)
  VALUES (
    NEW.block_id,
    jsonb_build_object(v_option_key, 1),
    1
  )
  ON CONFLICT (block_id) DO UPDATE SET
    counts = CASE
      WHEN block_response_counts.counts ? v_option_key THEN
        jsonb_set(
          block_response_counts.counts,
          ARRAY[v_option_key],
          to_jsonb((block_response_counts.counts->>v_option_key)::int + 1)
        )
      ELSE
        block_response_counts.counts || jsonb_build_object(v_option_key, 1)
    END,
    total = block_response_counts.total + 1,
    updated_at = now();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger already exists (migration 098), CREATE OR REPLACE
-- on the function is sufficient. No need to re-create trigger.
