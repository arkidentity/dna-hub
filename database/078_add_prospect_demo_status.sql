-- Migration 078: Add 'prospect' and 'demo' to churches status check constraint
-- These two statuses were missing from the constraint added in 008_funnel.sql,
-- causing all updates targeting those statuses to fail with a CHECK violation.

-- Drop the old constraint
ALTER TABLE churches
DROP CONSTRAINT IF EXISTS churches_status_check;

-- Re-add with the full list (prospect + demo added)
ALTER TABLE churches
ADD CONSTRAINT churches_status_check
CHECK (status IN (
  'prospect',
  'demo',
  'pending_assessment',
  'awaiting_discovery',
  'proposal_sent',
  'awaiting_agreement',
  'awaiting_strategy',
  'active',
  'completed',
  'paused',
  'declined'
));
