-- Migration 129: Admin notes on church billing records
-- Adds an internal notes field for the DNA team to annotate billing situations
-- (hardship cases, negotiated pricing, support history, etc.)

ALTER TABLE church_billing_status
  ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Re-create get_church_billing_status RPC to include the new column
CREATE OR REPLACE FUNCTION get_church_billing_status(p_church_id UUID)
RETURNS TABLE (
  id                      UUID,
  church_id               UUID,
  stripe_customer_id      TEXT,
  stripe_subscription_id  TEXT,
  plan_tier               TEXT,
  status                  TEXT,
  monthly_amount_cents    INTEGER,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN,
  billing_email           TEXT,
  admin_notes             TEXT,
  nudge_dismissed_at      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ,
  updated_at              TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow church leaders to fetch their own church's billing
  IF NOT EXISTS (
    SELECT 1 FROM church_leaders
    WHERE user_id = auth.uid()
      AND church_id = p_church_id
  ) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  RETURN QUERY
  SELECT
    b.id, b.church_id, b.stripe_customer_id, b.stripe_subscription_id,
    b.plan_tier, b.status, b.monthly_amount_cents,
    b.current_period_start, b.current_period_end, b.cancel_at_period_end,
    b.billing_email, b.admin_notes, b.nudge_dismissed_at, b.created_at, b.updated_at
  FROM church_billing_status b
  WHERE b.church_id = p_church_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_church_billing_status(UUID) TO authenticated;
