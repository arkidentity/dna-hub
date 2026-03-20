-- ============================================
-- Migration 115: Prayer Card Tags
-- Adds tags array to disciple_prayer_cards
-- ============================================

-- Add tags column
ALTER TABLE disciple_prayer_cards
  ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- GIN index for array containment queries
CREATE INDEX IF NOT EXISTS idx_disciple_prayer_cards_tags
  ON disciple_prayer_cards USING GIN (tags);

-- Re-create upsert RPC with tags parameter
DROP FUNCTION IF EXISTS public.upsert_prayer_card;

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
  p_updated_at TIMESTAMPTZ,
  p_tags TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_prayer_cards (
    account_id, local_id, title, details, scripture,
    status, prayer_count, date_answered, testimony,
    created_at, updated_at, tags
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_details, p_scripture,
    p_status, p_prayer_count, p_date_answered, p_testimony,
    p_created_at, p_updated_at, p_tags
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title = EXCLUDED.title,
    details = EXCLUDED.details,
    scripture = EXCLUDED.scripture,
    status = EXCLUDED.status,
    prayer_count = EXCLUDED.prayer_count,
    date_answered = EXCLUDED.date_answered,
    testimony = EXCLUDED.testimony,
    updated_at = EXCLUDED.updated_at,
    tags = EXCLUDED.tags
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION public.upsert_prayer_card TO anon, authenticated;
