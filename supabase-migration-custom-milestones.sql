-- Migration: Add church_id to milestones for custom church-specific milestones
-- Run this in your Supabase SQL Editor

-- Add church_id column to milestones table
-- NULL means it's a template milestone (shown to all churches)
-- A value means it's a custom milestone for that specific church
ALTER TABLE milestones
ADD COLUMN IF NOT EXISTS church_id UUID REFERENCES churches(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_milestones_church_id ON milestones(church_id);

-- Add target_date to church_progress if not exists
ALTER TABLE church_progress
ADD COLUMN IF NOT EXISTS target_date DATE;
