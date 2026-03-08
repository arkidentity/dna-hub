-- ============================================================
-- Migration 109: Answer Editing — Update Trigger + RPC
-- Created: 2026-03-08
-- Purpose: Allow users to change poll votes, edit open
--          responses, and update fill-in-blank answers.
--
-- 1. Re-create aggregation trigger to fire on INSERT + UPDATE
--    with decrement/increment logic for vote changes.
-- 2. New RPC: update_block_response
-- ============================================================


-- ============================================
-- SECTION 1: UPDATED AGGREGATION TRIGGER
-- Handles both INSERT and UPDATE events.
-- On UPDATE: decrement old key, increment new key.
-- ============================================

CREATE OR REPLACE FUNCTION update_block_response_counts()
RETURNS TRIGGER AS $$
DECLARE
  v_option_key TEXT;
  v_old_key TEXT;
BEGIN
  -- ── Handle UPDATE (answer change) ──
  IF TG_OP = 'UPDATE' THEN
    -- Compute old key
    IF OLD.response_type = 'poll_vote' THEN
      v_old_key := OLD.response_data->>'option';
    ELSIF OLD.response_type = 'next_step_tap' THEN
      v_old_key := COALESCE(OLD.response_data->>'step', OLD.response_type);
    ELSE
      v_old_key := OLD.response_type;
    END IF;

    -- Compute new key
    IF NEW.response_type = 'poll_vote' THEN
      v_option_key := NEW.response_data->>'option';
    ELSIF NEW.response_type = 'next_step_tap' THEN
      v_option_key := COALESCE(NEW.response_data->>'step', NEW.response_type);
    ELSE
      v_option_key := NEW.response_type;
    END IF;

    -- Only adjust counts if the key actually changed
    IF v_old_key IS DISTINCT FROM v_option_key THEN
      -- Decrement old
      UPDATE block_response_counts
      SET counts = jsonb_set(
        counts,
        ARRAY[v_old_key],
        to_jsonb(GREATEST((counts->>v_old_key)::int - 1, 0))
      ),
      updated_at = now()
      WHERE block_id = NEW.block_id
        AND counts ? v_old_key;

      -- Increment new
      UPDATE block_response_counts
      SET counts = CASE
        WHEN counts ? v_option_key THEN
          jsonb_set(counts, ARRAY[v_option_key],
            to_jsonb((counts->>v_option_key)::int + 1))
        ELSE
          counts || jsonb_build_object(v_option_key, 1)
      END,
      updated_at = now()
      WHERE block_id = NEW.block_id;
    END IF;
    -- total stays the same (not a new response, just an edit)

    RETURN NEW;
  END IF;

  -- ── Handle INSERT (new response) ──
  IF NEW.response_type = 'poll_vote' THEN
    v_option_key := NEW.response_data->>'option';
  ELSIF NEW.response_type = 'next_step_tap' THEN
    v_option_key := COALESCE(NEW.response_data->>'step', NEW.response_type);
  ELSE
    v_option_key := NEW.response_type;
  END IF;

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

-- Re-create trigger to fire on INSERT and UPDATE
DROP TRIGGER IF EXISTS trg_update_block_response_counts ON block_responses;
CREATE TRIGGER trg_update_block_response_counts
  AFTER INSERT OR UPDATE ON block_responses
  FOR EACH ROW
  EXECUTE FUNCTION update_block_response_counts();


-- ============================================
-- SECTION 2: UPDATE RESPONSE RPC
-- Allows users to change their previous answer.
-- Auth check: user_id must match auth.uid().
-- ============================================

CREATE OR REPLACE FUNCTION update_block_response(
  p_response_id UUID,
  p_response_data JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE block_responses
  SET response_data = p_response_data
  WHERE id = p_response_id
    AND (user_id = auth.uid() OR (user_id IS NULL AND auth.uid() IS NULL));
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION update_block_response TO anon, authenticated;
