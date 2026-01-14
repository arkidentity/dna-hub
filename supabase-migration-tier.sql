-- Migration: Add selected_tier to churches table
-- Run this in your Supabase SQL Editor
--
-- This stores the tier the church selected when signing their agreement
-- (e.g., 'Starter', 'Growth', 'Partner')

-- Add selected_tier column to churches table
ALTER TABLE churches
ADD COLUMN IF NOT EXISTS selected_tier TEXT;

-- Add comment for documentation
COMMENT ON COLUMN churches.selected_tier IS 'The tier/package the church selected when signing their agreement';
