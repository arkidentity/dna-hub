-- Migration: Database-Driven Admin Management
-- Run this in Supabase SQL Editor

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  role TEXT DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'readonly')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Policy: Only allow service role to manage admin users
CREATE POLICY "Service role full access" ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Seed existing admins (from hardcoded list)
INSERT INTO admin_users (email, name, role) VALUES
  ('thearkidentity@gmail.com', 'Admin', 'super_admin'),
  ('travis@arkidentity.com', 'Travis', 'super_admin')
ON CONFLICT (email) DO NOTHING;

-- Add comment for documentation
COMMENT ON TABLE admin_users IS 'Stores admin users who can access the admin dashboard';
COMMENT ON COLUMN admin_users.role IS 'super_admin: full access, admin: manage churches, readonly: view only';
