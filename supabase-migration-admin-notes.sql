-- Migration: Add admin_notes field to church_progress
-- Run this in your Supabase SQL Editor
--
-- This adds a private notes field that only admins can see/edit
-- Church leaders will NOT see these notes

-- Add admin_notes column to church_progress table
ALTER TABLE church_progress
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Add comment for documentation
COMMENT ON COLUMN church_progress.admin_notes IS 'Private notes visible only to admins, not shown to church leaders';
