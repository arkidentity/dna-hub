-- Migration 144: Allow 'dna_coach' as a valid invited_by_type for dna_leaders
-- Needed so DNA coaches can invite leaders without violating the CHECK constraint.

ALTER TABLE dna_leaders
  DROP CONSTRAINT IF EXISTS dna_leaders_invited_by_type_check;

ALTER TABLE dna_leaders
  ADD CONSTRAINT dna_leaders_invited_by_type_check
    CHECK (invited_by_type IN ('church_admin', 'super_admin', 'dna_coach'));
