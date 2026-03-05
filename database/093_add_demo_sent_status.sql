-- Migration 093: Add 'demo_sent' to churches status check constraint
-- New funnel stage: after admin sends the demo page invite email to the church leader.

-- Drop the old constraint
ALTER TABLE churches
DROP CONSTRAINT IF EXISTS churches_status_check;

-- Re-add with demo_sent included (between 'demo' and 'pending_assessment')
ALTER TABLE churches
ADD CONSTRAINT churches_status_check
CHECK (status IN (
  'prospect',
  'demo',
  'demo_sent',
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
