-- Migration: Global Resources System
-- Run this in your Supabase SQL Editor
--
-- This creates a system for template resources that are available to all churches
-- Resources can be linked to specific milestones and will appear in every church's dashboard

-- =====================
-- GLOBAL RESOURCES TABLE
-- =====================
-- These are template resources (PDFs, guides, videos) available to all churches
CREATE TABLE IF NOT EXISTS global_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Resource details
  name VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT,                    -- URL to the resource (Supabase Storage or external)
  resource_type VARCHAR(50),        -- 'pdf', 'video', 'link', 'guide', 'worksheet'

  -- Categorization
  category VARCHAR(100),            -- 'welcome_package', 'phase_1', 'training', etc.

  -- Ordering
  display_order INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT TRUE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================
-- MILESTONE RESOURCES (Junction Table)
-- =====================
-- Links global resources to specific milestones
-- When a milestone has linked resources, they show up for all churches
CREATE TABLE IF NOT EXISTS milestone_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  milestone_id UUID REFERENCES milestones(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES global_resources(id) ON DELETE CASCADE,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(milestone_id, resource_id)
);

-- =====================
-- INDEXES
-- =====================
CREATE INDEX IF NOT EXISTS idx_global_resources_category ON global_resources(category);
CREATE INDEX IF NOT EXISTS idx_global_resources_active ON global_resources(is_active);
CREATE INDEX IF NOT EXISTS idx_milestone_resources_milestone ON milestone_resources(milestone_id);
CREATE INDEX IF NOT EXISTS idx_milestone_resources_resource ON milestone_resources(resource_id);

-- =====================
-- UPDATE TRIGGER
-- =====================
CREATE TRIGGER update_global_resources_updated_at
  BEFORE UPDATE ON global_resources
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =====================
-- SEED: Welcome Package Resources
-- =====================
-- Leader Identification Worksheet - linked to Phase 2, Milestone 1
INSERT INTO global_resources (name, description, file_url, resource_type, category, display_order) VALUES
('Leader Identification Worksheet', 'Worksheet to help identify 4-6 potential DNA group leaders in your congregation. Consider spiritual maturity, availability, and relational capacity.', 'https://ydlzqpxjxzmmhksiovsr.supabase.co/storage/v1/object/public/milestone-attachments/Leader-Identification-Worksheet.pdf', 'worksheet', 'welcome_package', 1);

-- Link the worksheet to the "Complete Leader Identification Worksheet" milestone
INSERT INTO milestone_resources (milestone_id, resource_id, display_order)
SELECT
  m.id as milestone_id,
  r.id as resource_id,
  1 as display_order
FROM milestones m, global_resources r
WHERE m.title = 'Complete Leader Identification Worksheet'
  AND r.name = 'Leader Identification Worksheet';

-- =====================
-- SEED: Additional Template Resources
-- =====================
-- These can be uploaded later via admin or directly in the database

-- Pastor's Guide to Dam Assessment (Phase 1)
INSERT INTO global_resources (name, description, resource_type, category, display_order) VALUES
('Pastor''s Guide to Dam Assessment', 'Guide for pastors on how to unpack and discuss Dam Assessment results with their congregation.', 'pdf', 'phase_1', 2);

INSERT INTO milestone_resources (milestone_id, resource_id, display_order)
SELECT
  m.id as milestone_id,
  r.id as resource_id,
  1 as display_order
FROM milestones m, global_resources r
WHERE m.title = 'Review Pastor''s Guide to Dam Assessment'
  AND r.name = 'Pastor''s Guide to Dam Assessment';

-- Vision Casting Guide (Phase 2)
INSERT INTO global_resources (name, description, resource_type, category, display_order) VALUES
('Vision Casting Guide', 'Guide for casting the DNA vision to potential leaders and getting buy-in.', 'guide', 'phase_2', 3);

INSERT INTO milestone_resources (milestone_id, resource_id, display_order)
SELECT
  m.id as milestone_id,
  r.id as resource_id,
  1 as display_order
FROM milestones m, global_resources r
WHERE m.title = 'Vision Cast to Potential Leaders'
  AND r.name = 'Vision Casting Guide';

-- DNA Launch Guide (Phase 4)
INSERT INTO global_resources (name, description, resource_type, category, display_order) VALUES
('DNA Launch Guide', 'Comprehensive guide for launching and facilitating DNA groups.', 'pdf', 'phase_4', 4);

INSERT INTO milestone_resources (milestone_id, resource_id, display_order)
SELECT
  m.id as milestone_id,
  r.id as resource_id,
  1 as display_order
FROM milestones m, global_resources r
WHERE m.title = 'Review DNA Launch Guide'
  AND r.name = 'DNA Launch Guide';
