-- ============================================================
-- Migration 150: Custom Passage Plans — RPCs
-- Created: 2026-04-19
-- Depends on: 149 (tables + flag)
--
-- RPCs:
--   get_custom_passage_for_today(church_id) — called by Daily DNA on
--     journal load. Returns the church's passage for today if one exists,
--     else returns empty. Daily DNA falls back to global PASSAGES[] when empty.
--
--   replace_passage_series(series_id, church_id, entries JSONB) — atomic
--     swap: deletes existing entries for that series, inserts the new batch,
--     recalculates row_count/start_date/end_date on the parent series row.
--     Caller must supply church_id; we verify the series belongs to it.
--
--   delete_passage_series(series_id) — thin wrapper; CASCADE on the FK does
--     the entry cleanup, but we expose a named RPC for the Hub API layer.
--
-- GOTCHA: grants are re-added at the bottom.
-- ============================================================

-- ============================================================
-- 1. get_custom_passage_for_today
-- ============================================================

DROP FUNCTION IF EXISTS public.get_custom_passage_for_today(UUID);

CREATE FUNCTION public.get_custom_passage_for_today(p_church_id UUID)
RETURNS TABLE (
  reference     TEXT,
  theme         TEXT,
  series_id     UUID,
  series_name   TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    e.reference::TEXT,
    e.theme::TEXT,
    s.id::UUID,
    s.name::TEXT
  FROM church_passage_plan_entries e
  JOIN church_passage_series s ON s.id = e.series_id
  WHERE e.church_id = p_church_id
    AND e.date = CURRENT_DATE
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_custom_passage_for_today(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_custom_passage_for_today(UUID) TO authenticated;

-- ============================================================
-- 2. replace_passage_series
-- ============================================================
-- Entries JSONB shape:
--   [ { "date": "2026-04-20", "reference": "Acts 1:8", "theme": "Week 1" }, ... ]
-- Caller (Hub API) is responsible for:
--   - parsing CSV
--   - validating reference format
--   - resolving cross-series date conflicts (different series_id in same church)
-- ============================================================

DROP FUNCTION IF EXISTS public.replace_passage_series(UUID, JSONB);
DROP FUNCTION IF EXISTS public.replace_passage_series(UUID, UUID, JSONB);

CREATE FUNCTION public.replace_passage_series(
  p_series_id UUID,
  p_church_id UUID,
  p_entries   JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM church_passage_series s
    WHERE s.id = p_series_id AND s.church_id = p_church_id
  ) THEN
    RAISE EXCEPTION 'Series not found for church: %', p_series_id;
  END IF;

  DELETE FROM church_passage_plan_entries
  WHERE church_passage_plan_entries.series_id = p_series_id;

  INSERT INTO church_passage_plan_entries (series_id, church_id, date, reference, theme)
  SELECT
    p_series_id,
    p_church_id,
    (elem->>'date')::DATE,
    elem->>'reference',
    NULLIF(elem->>'theme', '')
  FROM jsonb_array_elements(p_entries) AS elem;

  UPDATE church_passage_series s
  SET row_count  = (SELECT COUNT(*)::INT
                    FROM church_passage_plan_entries e
                    WHERE e.series_id = p_series_id),
      start_date = COALESCE(
                     (SELECT MIN(e.date)
                      FROM church_passage_plan_entries e
                      WHERE e.series_id = p_series_id),
                     s.start_date),
      end_date   = COALESCE(
                     (SELECT MAX(e.date)
                      FROM church_passage_plan_entries e
                      WHERE e.series_id = p_series_id),
                     s.end_date)
  WHERE s.id = p_series_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.replace_passage_series(UUID, UUID, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.replace_passage_series(UUID, UUID, JSONB) TO service_role;

-- ============================================================
-- 3. delete_passage_series
-- ============================================================

DROP FUNCTION IF EXISTS public.delete_passage_series(UUID);

CREATE FUNCTION public.delete_passage_series(p_series_id UUID)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM church_passage_series WHERE id = p_series_id;
$$;

GRANT EXECUTE ON FUNCTION public.delete_passage_series(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_passage_series(UUID) TO service_role;
