-- Migration 154: set_prayer_phase with optional starting card index
-- Allows conductor to start a phase at a random card rather than always card 0.
-- p_card_index defaults to 0 for backward compatibility.

DROP FUNCTION IF EXISTS set_prayer_phase(UUID, TEXT);

CREATE OR REPLACE FUNCTION set_prayer_phase(
  p_block_id    UUID,
  p_phase       TEXT,
  p_card_index  INT DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_church_id UUID;
BEGIN
  SELECT isvc.church_id INTO v_church_id
  FROM service_blocks sb
  JOIN interactive_services isvc ON isvc.id = sb.service_id
  WHERE sb.id = p_block_id;

  IF NOT is_church_leader_for(v_church_id) THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_phase NOT IN ('REVERE', 'REFLECT', 'REQUEST', 'REST') THEN
    RAISE EXCEPTION 'Invalid phase: %', p_phase;
  END IF;

  UPDATE service_blocks
  SET live_state = jsonb_build_object(
    'phase',               p_phase,
    'card_index',          GREATEST(0, p_card_index),
    'request_queue',       COALESCE(live_state->'request_queue', '[]'::jsonb),
    'request_queue_index', 0
  )
  WHERE id = p_block_id;
END;
$$;

GRANT EXECUTE ON FUNCTION set_prayer_phase(UUID, TEXT, INT) TO authenticated;
