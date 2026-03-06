-- ============================================================
-- Migration 094: Church Prayer Wall
-- Created: 2026-03-06
-- Purpose: Shared prayer board per church — members share prayer
--          cards, congregation prays, answered prayers become
--          the church's testimony record.
-- ============================================================

-- ============================================
-- 1. prayer_wall_posts
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_wall_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES disciple_app_accounts(id),
  is_anonymous    BOOLEAN DEFAULT false,
  display_name    TEXT NOT NULL,
  prayer_text     TEXT NOT NULL,
  dimension       TEXT CHECK (dimension IN ('revere', 'reflect', 'request', 'rest')),
  status          TEXT DEFAULT 'active' CHECK (status IN ('active', 'answered', 'pending')),
  is_visible      BOOLEAN DEFAULT true,
  testimony_text  TEXT,
  answered_at     TIMESTAMPTZ,
  pray_count      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- Feed query: church + visible + status + ordering
CREATE INDEX IF NOT EXISTS idx_prayer_wall_posts_church_feed
  ON prayer_wall_posts (church_id, is_visible, status, created_at DESC);

-- User's own posts
CREATE INDEX IF NOT EXISTS idx_prayer_wall_posts_user
  ON prayer_wall_posts (user_id, created_at DESC);

-- ============================================
-- 2. prayer_wall_prays (once per 24hrs per user)
-- ============================================
CREATE TABLE IF NOT EXISTS prayer_wall_prays (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id     UUID NOT NULL REFERENCES prayer_wall_posts(id) ON DELETE CASCADE,
  user_id     UUID NOT NULL REFERENCES disciple_app_accounts(id),
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_prayer_wall_prays_post
  ON prayer_wall_prays (post_id);

CREATE INDEX IF NOT EXISTS idx_prayer_wall_prays_user_time
  ON prayer_wall_prays (user_id, created_at DESC);

-- ============================================
-- 3. church_prayer_wall_settings (admin config)
-- ============================================
CREATE TABLE IF NOT EXISTS church_prayer_wall_settings (
  church_id           UUID PRIMARY KEY REFERENCES churches(id) ON DELETE CASCADE,
  requires_approval   BOOLEAN DEFAULT false,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 4. RLS Policies
-- ============================================

ALTER TABLE prayer_wall_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prayer_wall_prays ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_prayer_wall_settings ENABLE ROW LEVEL SECURITY;

-- prayer_wall_posts: SELECT
CREATE POLICY "prayer_wall_posts_select"
  ON prayer_wall_posts FOR SELECT
  USING (
    (
      is_visible = true
      AND status IN ('active', 'answered')
      AND church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
    OR
    (
      user_id = auth.uid()
    )
  );

-- prayer_wall_posts: INSERT
CREATE POLICY "prayer_wall_posts_insert"
  ON prayer_wall_posts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );

-- prayer_wall_posts: UPDATE (own posts only)
CREATE POLICY "prayer_wall_posts_update"
  ON prayer_wall_posts FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- prayer_wall_prays: SELECT
CREATE POLICY "prayer_wall_prays_select"
  ON prayer_wall_prays FOR SELECT
  USING (
    post_id IN (
      SELECT pwp.id FROM prayer_wall_posts pwp
      WHERE pwp.church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
  );

-- prayer_wall_prays: INSERT
CREATE POLICY "prayer_wall_prays_insert"
  ON prayer_wall_prays FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND post_id IN (
      SELECT pwp.id FROM prayer_wall_posts pwp
      WHERE pwp.is_visible = true
        AND pwp.status IN ('active', 'answered')
        AND pwp.church_id IN (
          SELECT daa.church_id FROM disciple_app_accounts daa
          WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
        )
    )
  );

-- church_prayer_wall_settings: SELECT (church members)
CREATE POLICY "prayer_wall_settings_select"
  ON church_prayer_wall_settings FOR SELECT
  USING (
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );

-- Settings INSERT/UPDATE managed by service role (Hub admin)
-- No authenticated policies needed

-- ============================================
-- 5. RPC: pray_for_post
-- ============================================
CREATE OR REPLACE FUNCTION pray_for_post(
  p_post_id UUID,
  p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_last_pray TIMESTAMPTZ;
  v_new_count INTEGER;
BEGIN
  -- Check 24hr cooldown
  SELECT created_at INTO v_last_pray
  FROM prayer_wall_prays
  WHERE post_id = p_post_id AND user_id = p_user_id;

  IF v_last_pray IS NOT NULL AND v_last_pray > now() - interval '24 hours' THEN
    RETURN jsonb_build_object(
      'success', false,
      'reason', 'cooldown',
      'next_available', (v_last_pray + interval '24 hours')::text
    );
  END IF;

  -- Upsert pray record (update created_at if re-praying after 24hrs)
  INSERT INTO prayer_wall_prays (post_id, user_id, created_at)
  VALUES (p_post_id, p_user_id, now())
  ON CONFLICT (post_id, user_id)
  DO UPDATE SET created_at = now();

  -- Update denormalized count
  SELECT COUNT(*) INTO v_new_count
  FROM prayer_wall_prays WHERE post_id = p_post_id;

  UPDATE prayer_wall_posts
  SET pray_count = v_new_count, updated_at = now()
  WHERE id = p_post_id;

  RETURN jsonb_build_object('success', true, 'new_count', v_new_count);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION pray_for_post TO authenticated;

-- ============================================
-- 6. RPC: get_prayer_wall_feed
-- ============================================
CREATE OR REPLACE FUNCTION get_prayer_wall_feed(
  p_church_id UUID,
  p_user_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  is_anonymous BOOLEAN,
  display_name TEXT,
  prayer_text TEXT,
  dimension TEXT,
  status TEXT,
  testimony_text TEXT,
  answered_at TIMESTAMPTZ,
  pray_count INTEGER,
  created_at TIMESTAMPTZ,
  is_own_post BOOLEAN,
  user_has_prayed BOOLEAN,
  user_pray_available BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.user_id,
    p.is_anonymous,
    CASE WHEN p.is_anonymous AND p.user_id != p_user_id
         THEN 'Anonymous'::TEXT
         ELSE p.display_name
    END,
    p.prayer_text,
    p.dimension,
    p.status,
    p.testimony_text,
    p.answered_at,
    p.pray_count,
    p.created_at,
    (p.user_id = p_user_id),
    EXISTS (
      SELECT 1 FROM prayer_wall_prays pr
      WHERE pr.post_id = p.id AND pr.user_id = p_user_id
    ),
    NOT EXISTS (
      SELECT 1 FROM prayer_wall_prays pr
      WHERE pr.post_id = p.id AND pr.user_id = p_user_id
        AND pr.created_at > now() - interval '24 hours'
    )
  FROM prayer_wall_posts p
  WHERE p.church_id = p_church_id
    AND p.is_visible = true
    AND (
      p.status IN ('active', 'answered')
      OR (p.status = 'pending' AND p.user_id = p_user_id)
    )
  ORDER BY
    -- Answered within 48hrs pinned to top
    CASE WHEN p.status = 'answered' AND p.answered_at > now() - interval '48 hours'
         THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_prayer_wall_feed TO authenticated;

-- ============================================
-- 7. RPC: get_answered_prayers_archive
-- ============================================
CREATE OR REPLACE FUNCTION get_answered_prayers_archive(
  p_church_id UUID,
  p_user_id UUID,
  p_year INTEGER DEFAULT NULL,
  p_month INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  is_anonymous BOOLEAN,
  display_name TEXT,
  prayer_text TEXT,
  dimension TEXT,
  testimony_text TEXT,
  answered_at TIMESTAMPTZ,
  pray_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.is_anonymous,
    CASE WHEN p.is_anonymous THEN 'Anonymous'::TEXT ELSE p.display_name END,
    p.prayer_text,
    p.dimension,
    p.testimony_text,
    p.answered_at,
    p.pray_count,
    p.created_at
  FROM prayer_wall_posts p
  WHERE p.church_id = p_church_id
    AND p.status = 'answered'
    AND p.is_visible = true
    AND p.answered_at < now() - interval '30 days'
    AND (p_year IS NULL OR EXTRACT(YEAR FROM p.answered_at) = p_year)
    AND (p_month IS NULL OR EXTRACT(MONTH FROM p.answered_at) = p_month)
  ORDER BY p.answered_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_answered_prayers_archive TO authenticated;

-- ============================================
-- 8. RPC: get_pending_prayer_wall_posts (admin)
-- ============================================
CREATE OR REPLACE FUNCTION get_pending_prayer_wall_posts(
  p_church_id UUID
)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  display_name TEXT,
  prayer_text TEXT,
  dimension TEXT,
  status TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.user_id, p.display_name, p.prayer_text,
         p.dimension, p.status, p.created_at
  FROM prayer_wall_posts p
  WHERE p.church_id = p_church_id AND p.status = 'pending'
  ORDER BY p.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_pending_prayer_wall_posts TO anon, authenticated;

-- ============================================
-- 9. RPC: get_prayer_wall_display (public)
-- ============================================
CREATE OR REPLACE FUNCTION get_prayer_wall_display(
  p_church_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  display_name TEXT,
  prayer_text TEXT,
  dimension TEXT,
  status TEXT,
  testimony_text TEXT,
  answered_at TIMESTAMPTZ,
  pray_count INTEGER,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    CASE WHEN p.is_anonymous THEN 'Anonymous'::TEXT ELSE p.display_name END,
    p.prayer_text,
    p.dimension,
    p.status,
    p.testimony_text,
    p.answered_at,
    p.pray_count,
    p.created_at
  FROM prayer_wall_posts p
  WHERE p.church_id = p_church_id
    AND p.is_visible = true
    AND p.status IN ('active', 'answered')
  ORDER BY
    CASE WHEN p.status = 'answered' AND p.answered_at > now() - interval '48 hours'
         THEN 0 ELSE 1 END,
    p.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_prayer_wall_display TO anon, authenticated;

-- ============================================
-- 10. Realtime (for display mode)
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE prayer_wall_posts;
