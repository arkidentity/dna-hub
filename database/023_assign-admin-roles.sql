-- =====================================================
-- ASSIGN ADMIN ROLES
-- =====================================================
-- Migration: 023
-- Description: Manually assign admin role to existing admin users
-- Run this AFTER migration 022
-- Created: 2026-01-30

-- Assign admin role to thearkidentity@gmail.com
-- (Replace with actual user_id from auth.users)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'thearkidentity@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Assign admin role to travis@arkidentity.com
-- (Replace with actual user_id from auth.users)
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin'
FROM auth.users
WHERE email = 'travis@arkidentity.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify admin roles were assigned
SELECT
  u.email,
  ur.role,
  ur.created_at
FROM user_roles ur
JOIN auth.users u ON u.id = ur.user_id
WHERE ur.role = 'admin';
