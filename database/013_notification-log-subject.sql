-- Migration: Add subject field to notification_log
-- Run this in your Supabase SQL Editor
--
-- This adds a subject field to help with email audit trail

-- Add subject column to notification_log table
ALTER TABLE notification_log
ADD COLUMN IF NOT EXISTS subject TEXT;

-- Add comment for documentation
COMMENT ON COLUMN notification_log.subject IS 'The email subject line for audit trail';
