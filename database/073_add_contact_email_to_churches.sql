-- Migration 073: Add contact_email column to churches table
-- Created: 2026-02-22
-- Purpose: Fix broken branding RPC — Migration 071 updated the
--          get_church_branding_by_subdomain function to return c.contact_email
--          but the column was never added to the churches table. This caused
--          the RPC to fail with "column c.contact_email does not exist",
--          which broke ALL subdomain-based church branding.

ALTER TABLE churches
  ADD COLUMN IF NOT EXISTS contact_email TEXT;
