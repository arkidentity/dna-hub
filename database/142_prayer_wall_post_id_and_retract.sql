-- ============================================
-- Migration 142: Prayer Wall Post ID + Retract
-- Adds wall_post_id to disciple_prayer_cards,
-- retract RPC for users, and updates upsert_prayer_card
-- ============================================

-- 1. Add wall_post_id column to disciple_prayer_cards
ALTER TABLE disciple_prayer_cards
  ADD COLUMN IF NOT EXISTS wall_post_id UUID REFERENCES prayer_wall_posts(id) ON DELETE SET NULL;

-- 2. Re-create upsert_prayer_card with wall_post_id
DROP FUNCTION IF EXISTS public.upsert_prayer_card;

CREATE OR REPLACE FUNCTION public.upsert_prayer_card(
  p_account_id      UUID,
  p_local_id        TEXT,
  p_title           TEXT,
  p_details         TEXT,
  p_scripture       TEXT,
  p_status          TEXT,
  p_prayer_count    INTEGER,
  p_date_answered   TIMESTAMPTZ,
  p_testimony       TEXT,
  p_created_at      TIMESTAMPTZ,
  p_updated_at      TIMESTAMPTZ,
  p_tags            TEXT[]    DEFAULT '{}',
  p_wall_post_id    UUID      DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO disciple_prayer_cards (
    account_id, local_id, title, details, scripture,
    status, prayer_count, date_answered, testimony,
    created_at, updated_at, tags, wall_post_id
  )
  VALUES (
    p_account_id, p_local_id, p_title, p_details, p_scripture,
    p_status, p_prayer_count, p_date_answered, p_testimony,
    p_created_at, p_updated_at, p_tags, p_wall_post_id
  )
  ON CONFLICT (account_id, local_id)
  DO UPDATE SET
    title          = EXCLUDED.title,
    details        = EXCLUDED.details,
    scripture      = EXCLUDED.scripture,
    status         = EXCLUDED.status,
    prayer_count   = EXCLUDED.prayer_count,
    date_answered  = EXCLUDED.date_answered,
    testimony      = EXCLUDED.testimony,
    updated_at     = EXCLUDED.updated_at,
    tags           = EXCLUDED.tags,
    wall_post_id   = COALESCE(EXCLUDED.wall_post_id, disciple_prayer_cards.wall_post_id)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION public.upsert_prayer_card TO anon, authenticated;

-- 3. RPC: retract_prayer_wall_post
--    Allows a user to delete their own post from the prayer wall.
--    Clears wall_post_id on any linked disciple_prayer_cards row.
CREATE OR REPLACE FUNCTION public.retract_prayer_wall_post(
  p_post_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_owner   UUID;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_authenticated');
  END IF;

  SELECT user_id INTO v_owner
  FROM prayer_wall_posts
  WHERE id = p_post_id;

  IF v_owner IS NULL THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_found');
  END IF;

  IF v_owner <> v_user_id THEN
    RETURN jsonb_build_object('success', false, 'reason', 'not_owner');
  END IF;

  -- Clear the FK on any synced prayer card rows (don't cascade-delete the card)
  UPDATE disciple_prayer_cards
  SET wall_post_id = NULL
  WHERE wall_post_id = p_post_id
    AND account_id = v_user_id;

  DELETE FROM prayer_wall_posts WHERE id = p_post_id;

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER
   SET search_path = public;

GRANT EXECUTE ON FUNCTION public.retract_prayer_wall_post TO authenticated;
