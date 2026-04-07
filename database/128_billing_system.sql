-- Migration 128: Billing System
-- Creates billing status mirror, event log, session tracking, and Sunday peak tables

-- Billing status mirror (synced from Stripe via webhooks)
CREATE TABLE church_billing_status (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id               UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  stripe_customer_id      TEXT UNIQUE,
  stripe_subscription_id  TEXT UNIQUE,
  plan_tier               TEXT CHECK (plan_tier IN ('seed', 'growth', 'thrive', 'multiply', 'movement', 'custom')),
  billing_interval        TEXT DEFAULT 'monthly' CHECK (billing_interval IN ('monthly', 'annual')),
  status                  TEXT NOT NULL DEFAULT 'free'
                            CHECK (status IN ('free', 'active', 'past_due', 'suspended', 'canceled')),
  monthly_amount_cents    INTEGER,
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT false,
  suspended_at            TIMESTAMPTZ,
  church_size_reported    INTEGER,
  billing_email           TEXT,
  nudge_dismissed_at      TIMESTAMPTZ,
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

CREATE UNIQUE INDEX idx_billing_church_id ON church_billing_status(church_id);
CREATE INDEX idx_billing_status ON church_billing_status(status);
CREATE INDEX idx_billing_stripe_customer ON church_billing_status(stripe_customer_id);
CREATE INDEX idx_billing_stripe_subscription ON church_billing_status(stripe_subscription_id);

-- Billing event log (audit trail of all Stripe webhook events)
CREATE TABLE billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       UUID REFERENCES churches(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  processed_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_billing_events_church ON billing_events(church_id);
CREATE INDEX idx_billing_events_type ON billing_events(event_type);
CREATE INDEX idx_billing_events_processed ON billing_events(processed_at);

-- Sunday concurrent user session tracking
CREATE TABLE church_session_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  subdomain    TEXT NOT NULL,
  session_id   TEXT NOT NULL,
  event_type   TEXT NOT NULL CHECK (event_type IN ('join', 'heartbeat', 'leave')),
  page         TEXT,
  recorded_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_events_church_date
  ON church_session_events(church_id, recorded_at);
CREATE INDEX idx_session_events_session
  ON church_session_events(session_id);

-- Precomputed Sunday peak concurrent users
CREATE TABLE sunday_peak_sessions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  service_date    DATE NOT NULL,
  peak_concurrent INTEGER NOT NULL DEFAULT 0,
  tier_limit      INTEGER,
  exceeded        BOOLEAN GENERATED ALWAYS AS (peak_concurrent > tier_limit) STORED,
  computed_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(church_id, service_date)
);

CREATE INDEX idx_sunday_peaks_church ON sunday_peak_sessions(church_id);

-- updated_at trigger for billing status
CREATE OR REPLACE FUNCTION update_billing_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER billing_status_updated_at
  BEFORE UPDATE ON church_billing_status
  FOR EACH ROW EXECUTE FUNCTION update_billing_updated_at();

-- RLS
ALTER TABLE church_billing_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE church_session_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE sunday_peak_sessions ENABLE ROW LEVEL SECURITY;

-- Church leaders can read their own billing status
CREATE POLICY "church leaders read own billing"
  ON church_billing_status FOR SELECT
  USING (
    church_id IN (
      SELECT church_id FROM church_leaders WHERE user_id = auth.uid()
    )
  );

-- Service role only for all writes (webhook handler uses service role)
-- No authenticated INSERT/UPDATE/DELETE policies — all mutations go through service role

-- RPC: get billing status for a church (used by Hub billing tab)
CREATE OR REPLACE FUNCTION get_church_billing_status(p_church_id UUID)
RETURNS TABLE (
  id                     UUID,
  church_id              UUID,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  plan_tier              TEXT,
  status                 TEXT,
  monthly_amount_cents   INTEGER,
  current_period_start   TIMESTAMPTZ,
  current_period_end     TIMESTAMPTZ,
  cancel_at_period_end   BOOLEAN,
  billing_email          TEXT,
  nudge_dismissed_at     TIMESTAMPTZ,
  created_at             TIMESTAMPTZ,
  updated_at             TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Verify caller is a church leader for this church or admin
  IF NOT EXISTS (
    SELECT 1 FROM church_leaders WHERE user_id = auth.uid() AND church_id = p_church_id
  ) AND NOT EXISTS (
    SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    b.id, b.church_id, b.stripe_customer_id, b.stripe_subscription_id,
    b.plan_tier, b.status, b.monthly_amount_cents,
    b.current_period_start, b.current_period_end, b.cancel_at_period_end,
    b.billing_email, b.nudge_dismissed_at, b.created_at, b.updated_at
  FROM church_billing_status b
  WHERE b.church_id = p_church_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_church_billing_status(UUID) TO authenticated;

-- RPC: log session event from Daily DNA /live page
CREATE OR REPLACE FUNCTION log_session_event(
  p_church_id  UUID,
  p_subdomain  TEXT,
  p_session_id TEXT,
  p_event_type TEXT,
  p_page       TEXT DEFAULT '/live'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO church_session_events (church_id, subdomain, session_id, event_type, page)
  VALUES (p_church_id, p_subdomain, p_session_id, p_event_type, p_page);
END;
$$;

GRANT EXECUTE ON FUNCTION log_session_event(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
