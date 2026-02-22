-- ============================================================
-- Migration 074: Bible Passage Cache
--
-- Caches YouVersion API responses server-side so each unique
-- passage+version+format combination is only fetched once from
-- the YouVersion API, ever. All subsequent requests are served
-- from this table — eliminating rate limit concerns at scale.
-- ============================================================

CREATE TABLE IF NOT EXISTS bible_passage_cache (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  usfm          TEXT NOT NULL,          -- e.g. "JHN.3.16-17"
  version_id    INTEGER NOT NULL,       -- YouVersion version ID, e.g. 111 (NIV)
  format        TEXT NOT NULL DEFAULT 'text', -- 'text' or 'html'
  content       TEXT NOT NULL,          -- raw passage content from API
  reference     TEXT NOT NULL,          -- human-readable reference, e.g. "John 3:16-17"
  cached_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraint: one row per passage + version + format combination
CREATE UNIQUE INDEX IF NOT EXISTS bible_passage_cache_unique
  ON bible_passage_cache (usfm, version_id, format);

-- Index for lookups
CREATE INDEX IF NOT EXISTS bible_passage_cache_lookup
  ON bible_passage_cache (usfm, version_id, format);

-- No RLS needed — this is a read-only public cache, accessed via service role only
-- (the proxy API route uses the service role key server-side)
