-- Migration 069: Track last login time on users table
-- Allows church leaders and admins to see when DNA leaders last logged in.

ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN users.last_login_at IS 'Timestamp of the most recent successful magic-link login. NULL means never logged in after initial invite.';
