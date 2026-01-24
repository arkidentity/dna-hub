-- Migration: Admin Activity Log / Audit Trail
-- Run this in Supabase SQL Editor

-- Create admin_activity_log table
CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_email TEXT NOT NULL,
  action TEXT NOT NULL,           -- 'status_change', 'milestone_update', 'document_upload', etc.
  entity_type TEXT NOT NULL,      -- 'church', 'milestone', 'document'
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_log_entity ON admin_activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_admin ON admin_activity_log(admin_email);
CREATE INDEX IF NOT EXISTS idx_audit_log_date ON admin_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON admin_activity_log(action);

-- Enable RLS (Row Level Security)
ALTER TABLE admin_activity_log ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow service role to insert (API routes use service role)
CREATE POLICY "Service role can insert audit logs" ON admin_activity_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy: Only allow service role to select (admins query via API)
CREATE POLICY "Service role can read audit logs" ON admin_activity_log
  FOR SELECT
  TO service_role
  USING (true);

-- Add comment for documentation
COMMENT ON TABLE admin_activity_log IS 'Tracks all admin actions for audit purposes';
COMMENT ON COLUMN admin_activity_log.action IS 'Type of action: status_change, milestone_update, document_upload, milestone_toggle, notes_update, date_update';
COMMENT ON COLUMN admin_activity_log.entity_type IS 'Type of entity: church, milestone, document';
