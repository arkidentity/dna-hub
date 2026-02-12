-- Migration 049: Co-Leader Invitations
-- Adds invitation/acceptance flow for co-leader assignments.
-- Instead of directly setting co_leader_id, a primary leader sends an invitation.
-- The invited leader must accept before they become the co-leader.

-- Add pending co-leader tracking to dna_groups
ALTER TABLE dna_groups
  ADD COLUMN IF NOT EXISTS pending_co_leader_id UUID REFERENCES dna_leaders(id),
  ADD COLUMN IF NOT EXISTS co_leader_invited_at TIMESTAMPTZ;

-- Create invitations table
CREATE TABLE IF NOT EXISTS co_leader_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES dna_groups(id) ON DELETE CASCADE,
  invited_leader_id UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
  invited_by_leader_id UUID NOT NULL REFERENCES dna_leaders(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled', 'expired')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_co_leader_invitations_group_id ON co_leader_invitations(group_id);
CREATE INDEX idx_co_leader_invitations_invited_leader_id ON co_leader_invitations(invited_leader_id);
CREATE INDEX idx_co_leader_invitations_token ON co_leader_invitations(token);
CREATE INDEX idx_co_leader_invitations_status ON co_leader_invitations(status);
