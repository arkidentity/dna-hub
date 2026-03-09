-- ============================================
-- Migration 111: Prayer Wall + Announcement block types
-- Adds prayer_wall and announcement to live service system
-- ============================================

-- ── 1. Update block_type CHECK on service_blocks ──

DO $$
DECLARE r RECORD;
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
    'fill_in_blank', 'prayer_wall', 'announcement'
  ));

-- ── 2. Update response_type CHECK on block_responses ──

DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE rel.relname = 'block_responses'
      AND nsp.nspname = 'public'
      AND con.contype = 'c'
  LOOP
    EXECUTE format('ALTER TABLE block_responses DROP CONSTRAINT IF EXISTS %I', r.conname);
  END LOOP;
END $$;

ALTER TABLE block_responses ADD CONSTRAINT block_responses_response_type_check
  CHECK (response_type IN (
    'poll_vote', 'open_text', 'next_step_tap', 'breakout_checkin',
    'connect_card', 'fill_in_blank',
    'announcement_signup'
  ));

-- ── 3. Update aggregation trigger for announcement_signup ──
-- announcement_signup uses response_type as the key (like open_text, connect_card)
-- No special extraction needed — falls through to the ELSE branch.
-- No trigger change required.

-- ── 4. Create service-images storage bucket ──

INSERT INTO storage.buckets (id, name, public)
VALUES ('service-images', 'service-images', true)
ON CONFLICT (id) DO NOTHING;

-- Public read access
CREATE POLICY "Public read service-images" ON storage.objects
  FOR SELECT USING (bucket_id = 'service-images');

-- Authenticated uploads
CREATE POLICY "Authenticated upload service-images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- Authenticated updates (overwrite)
CREATE POLICY "Authenticated update service-images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');

-- Authenticated delete (cleanup)
CREATE POLICY "Authenticated delete service-images" ON storage.objects
  FOR DELETE USING (bucket_id = 'service-images' AND auth.role() = 'authenticated');
