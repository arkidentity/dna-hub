-- ============================================================
-- Migration 156: Add Way of Life to pathway_tools
-- ============================================================
-- Adds Way of Life as an app_tool in the spiritual_formation
-- category. Leaders can assign it to pathway weeks via the
-- customizable pathway builder. Suggested placement: Week 6-8
-- of Phase 1 after gospel foundations are established.
-- ============================================================

INSERT INTO pathway_tools (slug, name, description, category, tool_type, app_route, icon_name, sort_order)
VALUES (
  'way_of_life',
  'Way of Life',
  'Disciples name their personal culture with Jesus across 7 life categories — Devotion, Family, Community, Mission, Stewardship, Health, and Serving. This is their declaration of who they already are, not a to-do list.',
  'spiritual_formation', 'app_tool', '/tools/way-of-life', 'Layers', 17
);
