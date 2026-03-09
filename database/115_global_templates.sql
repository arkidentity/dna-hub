-- Migration 115: Global Service Templates
-- Allows templates to be shared across all churches

-- 1. Add is_global column
ALTER TABLE interactive_services
  ADD COLUMN IF NOT EXISTS is_global BOOLEAN DEFAULT false;

-- 2. Partial index for global template lookups
CREATE INDEX IF NOT EXISTS idx_interactive_services_global
  ON interactive_services (is_global)
  WHERE is_template = true AND is_global = true;

-- 3. Update RLS SELECT policy to include global templates
DROP POLICY IF EXISTS "interactive_services_select" ON interactive_services;
CREATE POLICY "interactive_services_select"
  ON interactive_services FOR SELECT
  USING (
    (is_template = true AND is_global = true)
    OR
    church_id IN (
      SELECT daa.church_id FROM disciple_app_accounts daa
      WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
    )
  );

-- 4. Update service_blocks SELECT policy so blocks of global templates are readable
DROP POLICY IF EXISTS "service_blocks_select" ON service_blocks;
CREATE POLICY "service_blocks_select"
  ON service_blocks FOR SELECT
  USING (
    service_id IN (
      SELECT id FROM interactive_services
      WHERE is_template = true AND is_global = true
    )
    OR
    service_id IN (
      SELECT id FROM interactive_services
      WHERE church_id IN (
        SELECT daa.church_id FROM disciple_app_accounts daa
        WHERE daa.id = auth.uid() AND daa.church_id IS NOT NULL
      )
    )
  );
