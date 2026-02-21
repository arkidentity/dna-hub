-- Migration 070: Add author_role column to dna_cohort_posts
-- The insert code already sends author_role but the column was missing from the
-- original CREATE TABLE in migration 045, causing all cohort post inserts to fail.

ALTER TABLE dna_cohort_posts
  ADD COLUMN IF NOT EXISTS author_role TEXT DEFAULT 'trainer';
