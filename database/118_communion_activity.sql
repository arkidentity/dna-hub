-- ============================================================
-- Migration 118: Add Communion Activity Tool
-- ============================================================

INSERT INTO pathway_tools (slug, name, description, category, tool_type, app_route, icon_name, sort_order)
VALUES (
  'communion',
  'Communion',
  'Share in the Lord''s Supper together as a group. Remember what Jesus did on the cross — His body broken and His blood poured out for you. Communion isn''t just a ritual. It''s a moment to pause, reflect, and reconnect with the heart of the Gospel as a community.',
  'community', 'activity', NULL, 'Wine', 16
);
