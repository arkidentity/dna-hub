-- Migration 115: Conductor Permissions
-- Allows church leaders to grant conductor (Run Live Service) access
-- to up to 2 non-leader email addresses per church.

-- ─── Table ────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS church_conductors (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id   UUID        NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  email       TEXT        NOT NULL,
  granted_by  UUID        REFERENCES users(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(church_id, email)
);

ALTER TABLE church_conductors ENABLE ROW LEVEL SECURITY;

-- Authenticated users can SELECT rows where the email matches their own
-- (used by Daily DNA to confirm conductor access)
CREATE POLICY "conductor_read_own"
  ON church_conductors FOR SELECT
  USING (lower(email) = lower(auth.jwt() ->> 'email'));

-- ─── RPC: check_conductor_access ──────────────────────────────────────────────
-- Called from Daily DNA to gate the conductor page / Run Live button.
DROP FUNCTION IF EXISTS check_conductor_access(UUID, TEXT);

CREATE OR REPLACE FUNCTION check_conductor_access(
  p_church_id UUID,
  p_email     TEXT
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM church_conductors
    WHERE church_id = p_church_id
      AND lower(email) = lower(p_email)
  );
$$;

GRANT EXECUTE ON FUNCTION check_conductor_access(UUID, TEXT) TO anon, authenticated;

-- ─── RPC: get_church_conductors ───────────────────────────────────────────────
-- Called from DNA Hub to display/manage the conductor list.
DROP FUNCTION IF EXISTS get_church_conductors(UUID);

CREATE OR REPLACE FUNCTION get_church_conductors(p_church_id UUID)
RETURNS TABLE(id UUID, email TEXT, created_at TIMESTAMPTZ)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id, email, created_at
  FROM   church_conductors
  WHERE  church_id = p_church_id
  ORDER  BY created_at;
$$;

GRANT EXECUTE ON FUNCTION get_church_conductors(UUID) TO authenticated;
