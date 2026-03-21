-- ============================================================
-- Migration 121: Add Confession to pathway_tools
-- ============================================================
-- Adds Confession as an activity tool in the community category.
-- Leaders can now assign Confession to pathway weeks via the
-- customizable pathway builder.
-- ============================================================

INSERT INTO pathway_tools (slug, name, description, category, tool_type, app_route, icon_name, sort_order)
VALUES (
  'confession',
  'Confession',
  'Walking in the light together — vertical and horizontal honesty. Confession isn''t about shame. It''s about freedom. When we confess to God and to one another, we break the power of secrecy and invite healing. Come ready to be honest.',
  'community', 'activity', NULL, 'Eye', 16
);
