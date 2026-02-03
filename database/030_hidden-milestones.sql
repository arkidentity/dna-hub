-- Migration 030: Hidden Milestones
-- Allows churches to hide template milestones from their DNA Journey
-- This provides flexibility without deleting shared milestones

-- Create table to track hidden milestones per church
CREATE TABLE IF NOT EXISTS church_hidden_milestones (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
    milestone_id UUID NOT NULL REFERENCES milestones(id) ON DELETE CASCADE,
    hidden_at TIMESTAMPTZ DEFAULT NOW(),
    hidden_by TEXT, -- Admin email who hid it
    UNIQUE(church_id, milestone_id)
);

-- Add index for quick lookups
CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_church
ON church_hidden_milestones(church_id);

CREATE INDEX IF NOT EXISTS idx_church_hidden_milestones_milestone
ON church_hidden_milestones(milestone_id);

-- Add comment
COMMENT ON TABLE church_hidden_milestones IS 'Tracks which template milestones are hidden for specific churches';
