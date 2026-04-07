# DNA Discipleship — Billing System Plan

> **Status:** Planning (March 2026)
> **Apps affected:** DNA Hub (church admin billing UI + super-admin), Supabase (schema + webhooks)
> **Payment processor:** Stripe (separate DNA Discipleship account)
> **Email delivery:** Resend (already integrated)
> **Sales tax:** Stripe Tax (built-in, handles exemption certificates)

---

## Table of Contents

1. [Overview](#overview)
2. [Business Model](#business-model)
3. [Pricing Tiers](#pricing-tiers)
4. [Free vs. Active Account Model](#free-vs-active-account-model)
5. [Architecture](#architecture)
6. [Database Schema](#database-schema)
7. [Stripe Configuration](#stripe-configuration)
8. [Sales Tax Compliance](#sales-tax-compliance)
9. [Webhook Handler](#webhook-handler)
10. [Hub Billing Tab (Church Admin)](#hub-billing-tab-church-admin)
11. [Checkout Flow](#checkout-flow)
12. [Super-Admin Billing Dashboard](#super-admin-billing-dashboard)
13. [Sunday Concurrent User Tracking](#sunday-concurrent-user-tracking)
14. [Dunning & Grace Period](#dunning--grace-period)
15. [Tier Upgrade Nudges](#tier-upgrade-nudges)
16. [Coupons & Discounts](#coupons--discounts)
17. [Transactional Emails](#transactional-emails)
18. [Build Order](#build-order)
19. [Environment Variables](#environment-variables)
20. [What NOT to Build Yet](#what-not-to-build-yet)

---

## Overview

DNA Discipleship is a complete church platform: discipleship system, group tracking, white-labeled PWA, and live interactive services with real-time concurrent users. Churches get a **free account with no time limit** to set up and get comfortable. When they're ready to go live with their congregation, they upgrade to a paid plan which activates Live Service Mode and full church-facing features.

Billing is **relational** — every church has a relationship with the DNA team. Cancellations, pauses, and plan changes outside of normal upgrades happen through conversation, not self-service buttons.

---

## Business Model

| State | What it means | Features available |
|---|---|---|
| **Free** | Church has an account, setting up | All Hub tools, group management, DNA training, cohorts, dashboard |
| **Active (paid)** | Church has upgraded, live with congregation | Everything + Live Service Mode (`live_service_enabled = true`) |
| **Past Due** | Payment failed, in grace period | Full access + warning banner (7-day grace) |
| **Suspended** | Grace period expired | Hub access only, Live Service gated |
| **Canceled** | Subscription ended | Hub read-only, congregation features off |

---

## Pricing Tiers

Monthly billing only. No annual plans at this time.

| Tier | Church Size | Monthly Price | Stripe Product Key |
|---|---|---|---|
| Seed | 1–250 members | $149 | `dna_seed` |
| Growth | 251–1,000 members | $299 | `dna_growth` |
| Thrive | 1,001–2,500 members | $599 | `dna_thrive` |
| Multiply | 2,501–5,000 members | $1,099 | `dna_multiply` |
| Movement | 5,000+ members | Custom | Manual via Stripe dashboard |

**Tier limits stored as Stripe product metadata:**
```
tier: seed | growth | thrive | multiply
member_limit: 250 | 1000 | 2500 | 5000
```

---

## Free vs. Active Account Model

No trial timer. No credit card required to start.

- Church signs up → free account, no expiration
- They set up groups, disciples, training, cohorts at their own pace
- When ready to launch Live Service Mode → they upgrade from within Hub
- Upgrade triggers Stripe Checkout → on success, webhook flips `live_service_enabled = true` on `church_branding_settings`
- That single flag gates all congregation-facing live features

**No onboarding fee at this time.**

---

## Architecture

### Source of Truth

| Data | Lives in |
|---|---|
| Payment method, subscription state, invoices | **Stripe** (authoritative) |
| Billing status mirror, feature gate flag | **Supabase** (read fast, no Stripe API call on every request) |
| Concurrent user sessions | **Supabase** (internal tracking only) |

### Data Flow

```
Church Admin clicks "Upgrade"
  → Stripe Checkout (embedded or redirect)
    → checkout.session.completed webhook
      → Supabase church_billing_status row created/updated
        → church_branding_settings.live_service_enabled = true
          → Church is live
```

```
Stripe invoice.payment_failed webhook
  → Supabase status = 'past_due'
    → Resend email to church admin
      → Day 7: status = 'suspended', live_service_enabled = false
```

---

## Database Schema

### Migration: `NNN_billing_system.sql`

```sql
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
  monthly_amount_cents    INTEGER,                   -- mirrors Stripe price
  current_period_start    TIMESTAMPTZ,
  current_period_end      TIMESTAMPTZ,
  cancel_at_period_end    BOOLEAN DEFAULT false,
  suspended_at            TIMESTAMPTZ,               -- set when grace period expires
  church_size_reported    INTEGER,                   -- self-reported at signup
  billing_email           TEXT,                      -- church finance contact
  created_at              TIMESTAMPTZ DEFAULT now(),
  updated_at              TIMESTAMPTZ DEFAULT now()
);

-- One row per church, enforce uniqueness
CREATE UNIQUE INDEX idx_billing_church_id ON church_billing_status(church_id);

-- Billing event log (audit trail of all webhook events)
CREATE TABLE billing_events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id       UUID REFERENCES churches(id) ON DELETE SET NULL,
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type      TEXT NOT NULL,
  payload         JSONB,
  processed_at    TIMESTAMPTZ DEFAULT now()
);

-- Sunday concurrent user session tracking (internal only)
CREATE TABLE church_session_events (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id    UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  subdomain    TEXT NOT NULL,
  session_id   TEXT NOT NULL,               -- anonymous, from localStorage
  event_type   TEXT NOT NULL CHECK (event_type IN ('join', 'heartbeat', 'leave')),
  page         TEXT,                         -- e.g. '/live', '/journal'
  recorded_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_session_events_church_date
  ON church_session_events(church_id, recorded_at);

-- Precomputed Sunday peak concurrent (updated by cron or on-demand)
CREATE TABLE sunday_peak_sessions (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id      UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  service_date   DATE NOT NULL,
  peak_concurrent INTEGER NOT NULL DEFAULT 0,
  tier_limit     INTEGER,                   -- their limit on that date
  exceeded       BOOLEAN GENERATED ALWAYS AS (peak_concurrent > tier_limit) STORED,
  computed_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(church_id, service_date)
);

-- RLS: service role only for billing tables (no church user access)
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
```

---

## Stripe Configuration

### Products to Create (Stripe Dashboard)

```
Product: DNA Seed
  Price: $149.00 / month (recurring)
  Metadata: { tier: "seed", member_limit: "250" }

Product: DNA Growth
  Price: $299.00 / month (recurring)
  Metadata: { tier: "growth", member_limit: "1000" }

Product: DNA Thrive
  Price: $599.00 / month (recurring)
  Metadata: { tier: "thrive", member_limit: "2500" }

Product: DNA Multiply
  Price: $1,099.00 / month (recurring)
  Metadata: { tier: "multiply", member_limit: "5000" }
```

**Movement tier** — no standard Stripe price. Set up manually per church from Stripe dashboard.

### Customer Portal Settings

Enable:
- View and download invoice history
- Update payment method
- Update billing address

Disable:
- Cancel subscription (relational — not self-serve)
- Switch plans (relational — not self-serve)

### Statement Descriptor
`DNA DISCIPLESHIP` (22 char max, no special chars)

### Invoice Footer
`DNA Discipleship is a ministry of ARK Identity`

### Webhook Events to Listen For

```
checkout.session.completed
customer.subscription.created
customer.subscription.updated
customer.subscription.deleted
invoice.payment_succeeded
invoice.payment_failed
invoice.upcoming
payment_method.expiring
```

---

## Sales Tax Compliance

> **This must be configured before the first paid subscription goes live. Non-negotiable.**

### Why This Matters

Selling SaaS subscriptions to churches across all 50 states creates **economic nexus** in most states once you hit revenue or transaction thresholds (typically $100,000 in sales OR 200 transactions in a 12-month period in a given state — some states have lower thresholds). Once nexus is established, you're required to collect and remit sales tax in that state.

SaaS and digital products are treated very differently by state:

| Treatment | States (examples) |
|---|---|
| Fully taxable | Texas, New York, Pennsylvania, Washington, Iowa |
| Partially taxable or unclear | Illinois (Chicago city tax), Ohio |
| Generally exempt | California, Florida, Virginia |

**Iowa specifically taxes some digital services** — this applies to DNA Discipleship from day one.

Churches are tax-exempt in many states as 501(c)(3) organizations, but this does **not** happen automatically. You must collect a valid state-issued exemption certificate from each church and store it. Without it, you are liable for the tax — not the church.

### Recommended Solution: Stripe Tax

Since DNA Discipleship is already on Stripe, **Stripe Tax** is the correct tool — not TaxJar or Avalara. Those platforms make sense when you're on multiple payment processors or at enterprise scale. Stripe Tax is:

- Built natively into Stripe Checkout and subscriptions — zero separate integration
- Automatically calculates the correct tax rate for every transaction based on customer location
- Handles church tax exemption certificates (church submits cert, Stripe stores it, future charges are $0 tax)
- Covers all 50 US states including complex ones (Texas, Iowa, New York)
- Cost: 0.5% of transactions where tax is calculated — exempt customers cost nothing

TaxJar and Avalara are valid alternatives but add an external API, a separate dashboard, and a data sync layer. At this stage, Stripe Tax eliminates all of that.

### Church Tax Exemption Flow

```
Church reaches checkout
  → Stripe Tax detects billing state (e.g. Texas — SaaS taxable)
    → Church sees: "Are you a tax-exempt organization?"
      → Yes: Upload state-issued exemption certificate
        → Stripe stores certificate, marks customer as tax-exempt
          → All future charges: $0 tax collected
      → No / Skip: Tax calculated and collected normally
```

Exemption certificates are stored by Stripe and accessible from the Stripe customer record. You do not need to store them separately in Supabase.

### Setup Checklist (Stripe Dashboard)

1. **Enable Stripe Tax** — Stripe Dashboard → Tax → Get started
2. **Set your origin address** — the address DNA Discipleship operates from (ARK Identity / Iowa address). This establishes your nexus starting point.
3. **Set product tax code** — for all 4 Stripe products, set the tax code to `txcd_10103001` ("SaaS — software as a service, business use"). This is the correct code for a church management/discipleship platform.
4. **Enable on Checkout** — when creating Stripe Checkout sessions, set `automatic_tax: { enabled: true }`
5. **Enable on subscriptions** — set `automatic_tax: { enabled: true }` when creating subscriptions via API
6. **Configure tax exemption collection** — Stripe Tax settings → enable "Collect tax exemption certificates"
7. **Filing** — Stripe Tax provides a tax summary report per state per period. You (or your accountant) use this to file and remit. Stripe does not file on your behalf — that's the one thing it doesn't do (TaxJar AutoFile does, but adds complexity and cost)

### On Filing and Remittance

Stripe Tax calculates and collects the tax. **You are still responsible for remitting it to each state.** Options:

- **Manual filing** — workable in early stages when you're in few states. Use Stripe's tax reports.
- **Accountant** — recommended. Hand the Stripe tax summary to your CPA each quarter.
- **TaxJar AutoFile** — if the volume of states grows and manual filing becomes unmanageable, layer TaxJar in later solely for its AutoFile feature. That's a future problem.

### Key Decisions

- **Do not go live with paid subscriptions before Stripe Tax is enabled.** Iowa alone creates liability from your first Texas or New York subscriber.
- **Treat exemption certificate collection as required UX**, not optional. If a church claims exemption but provides no certificate and you don't collect tax, you owe it.
- **Document which states you have nexus in** as you grow. Track this in your Stripe Tax dashboard.

---

## Webhook Handler

**File:** `src/app/api/webhooks/stripe/route.ts`

Verify Stripe signature on every request using `STRIPE_WEBHOOK_SECRET`. Do not process unverified events.

### Event Handlers

| Event | Action |
|---|---|
| `checkout.session.completed` | Create/update `church_billing_status`, flip `live_service_enabled = true` |
| `customer.subscription.created` | Sync plan tier, status, period dates to Supabase |
| `customer.subscription.updated` | Sync updated tier/status (handles upgrades, downgrades) |
| `customer.subscription.deleted` | Set status `canceled`, flip `live_service_enabled = false` |
| `invoice.payment_succeeded` | Set status `active`, clear any suspended state, log event |
| `invoice.payment_failed` | Set status `past_due`, trigger Resend dunning email (Day 0) |
| `invoice.upcoming` | Check if card expires before next billing date → send card expiry warning |
| `payment_method.expiring` | Send card-expiring email to billing contact |

All events logged to `billing_events` table for audit trail.

### Idempotency
Check `billing_events.stripe_event_id` before processing — Stripe can deliver webhooks more than once.

---

## Hub Billing Tab (Church Admin)

**Location:** New "Billing" tab inside the church admin section of Hub

**Access:** `church_leader` role only, scoped to their church

### What it shows

```
┌─────────────────────────────────────────────────────┐
│  Current Plan: DNA Growth                           │
│  $299 / month · Next billing: April 14, 2026        │
│  Status: Active  ✓                                  │
│                                                     │
│  Payment method: Visa ending in 4242  (exp 08/27)   │
│                                                     │
│  [  Manage Billing  ]   → opens Stripe Portal       │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│  Invoice History                                    │
│  Mar 2026  $299.00  Paid  [Download PDF]            │
│  Feb 2026  $299.00  Paid  [Download PDF]            │
│  Jan 2026  $299.00  Paid  [Download PDF]            │
└─────────────────────────────────────────────────────┘
```

**"Manage Billing" button** — calls `/api/billing/portal-session` which creates a Stripe Customer Portal session and redirects. Handles card updates, downloads invoice PDFs.

### Past Due State

When `status = 'past_due'`:
- Yellow warning banner across top of Hub: *"Payment failed — please update your payment method to keep your service active."*
- "Manage Billing" button emphasized
- No features gated yet (grace period active)

### Suspended State

When `status = 'suspended'`:
- Red banner: *"Your account has been suspended. Update your payment method to restore access."*
- Live Service Mode features gated
- Hub admin access preserved so they can fix billing

### Free State (not yet upgraded)

When `status = 'free'`:
- Show upgrade prompt card
- List what they unlock by upgrading
- "Upgrade Now" → Checkout flow

---

## Checkout Flow

**Entry points:**
- "Upgrade Now" button on Hub Billing tab (free churches)
- Upgrade prompt when trying to enable Live Service Mode

**Flow:**

```
1. Church admin selects plan tier on plan selection page
2. POST /api/billing/checkout — creates Stripe Checkout session
   - Creates Stripe Customer if none exists (store customer_id in church_billing_status)
   - Passes church_id as metadata on the session
3. Redirect to Stripe Checkout (hosted page)
4. On success → redirect back to Hub /dashboard?billing=success
5. checkout.session.completed webhook fires → activates account
6. Hub shows success state, Live Service Mode now available
```

**API routes needed:**
- `POST /api/billing/checkout` — create checkout session
- `GET /api/billing/portal-session` — create Customer Portal session
- `GET /api/billing/status` — fetch current billing status for church
- `POST /api/webhooks/stripe` — receive all Stripe webhook events

---

## Super-Admin Billing Dashboard

**Location:** New "Billing" section in Hub admin (`/admin/billing`)

**Access:** `admin` role only

### Overview Panel

```
MRR:  $X,XXX         Active Churches: XX
ARR:  $XX,XXX        Past Due: X
                     Suspended: X
```

### Church Billing Table

| Church | Subdomain | Tier | MRR | Status | Members | Last Payment | Actions |
|---|---|---|---|---|---|---|---|
| Grace Chapel | grace | Growth | $299 | Active | 420 | Mar 14 | View |
| River Church | river | Seed | $149 | Past Due ⚠️ | 85 | Feb 14 | View |

**Filters:** All / Active / Past Due / Suspended / Free / Flagged (exceeded tier)

### Church Billing Detail (drill-in)

- Full billing history
- Current Stripe subscription link
- Sunday peak concurrent history (last 8 Sundays)
- Tier overage flags
- Notes field (internal)
- Admin actions: Apply discount, view in Stripe, manually change tier

### Tier Overage Flags

Churches that have exceeded their concurrent user tier limit appear with a warning badge. Shown in the main table and a dedicated "Needs Attention" section at top.

```
⚠️  3 churches have exceeded their tier limit 2+ Sundays in a row
```

---

## Sunday Concurrent User Tracking

### How it works

Every time a user loads `/live` in Daily DNA:
- `join` event fires → logged to `church_session_events`
- Heartbeat every 60 seconds while on page → `heartbeat` events
- `visibilitychange` or unload → `leave` event

Concurrent users at any moment = sessions with a `heartbeat` or `join` in the last 90 seconds with no `leave`.

### Peak Calculation

A background process (or on-demand admin trigger) computes Sunday peak by:

```sql
-- Peak concurrent for a given church on a given Sunday
SELECT MAX(concurrent) FROM (
  SELECT
    date_trunc('minute', recorded_at) as minute,
    COUNT(DISTINCT session_id) as concurrent
  FROM church_session_events
  WHERE church_id = $church_id
    AND date_trunc('day', recorded_at) = $sunday_date
    AND event_type IN ('join', 'heartbeat')
    AND recorded_at > (
      SELECT COALESCE(MAX(recorded_at), '1970-01-01')
      FROM church_session_events e2
      WHERE e2.session_id = church_session_events.session_id
        AND e2.event_type = 'leave'
    )
  GROUP BY minute
) counts;
```

Results stored in `sunday_peak_sessions`. Admin dashboard reads from this table.

### Tier Limits for Concurrent Users

| Tier | Concurrent User Limit |
|---|---|
| Seed (≤250) | 200 |
| Growth (≤1,000) | 700 |
| Thrive (≤2,500) | 1,750 |
| Multiply (≤5,000) | 3,500 |
| Movement | Custom |

Exceeding the limit does **not** auto-gate access. It flags the church internally. After 2–3 consecutive Sundays over limit, the DNA team reaches out to the church to discuss upgrading. This is relational, not automated enforcement.

---

## Dunning & Grace Period

### Payment Failure Flow

```
Day 0  — invoice.payment_failed fires
         → status = 'past_due'
         → Email: "Payment failed — update your card"
         → Yellow banner in Hub

Day 3  — Resend reminder email
         → "Your account will suspend in 4 days"

Day 7  — Resend final warning email
         → "Suspending tomorrow if not resolved"

Day 8  — Cron job runs
         → status = 'suspended'
         → live_service_enabled = false
         → Red banner in Hub
         → Email: "Your account has been suspended"

Day 30 — Stripe auto-cancels subscription
         → customer.subscription.deleted webhook
         → status = 'canceled'
```

### Card Expiring Flow

```
payment_method.expiring webhook fires (Stripe sends ~1 month before expiry)
  → Resend email to billing contact
  → "Your card on file expires soon — update it to avoid interruption"
  → Banner in Hub billing tab if expiry is within 30 days
```

When payment succeeds after a failure:
- `invoice.payment_succeeded` webhook
- status → `active`
- `live_service_enabled` → `true`
- Banners cleared
- Resend confirmation email: "You're all set — service restored"

---

## Tier Upgrade Nudges

### Trigger Conditions

When a church's active disciple count or Sunday concurrent peak crosses a tier boundary, show an upgrade nudge in Hub. Not an alert — a celebration.

**Check points:**
- On Hub dashboard load: compare `disciples` count to current tier limit
- On Sunday peak computed: compare to tier concurrent limit
- Nudge fires when either exceeds ~85% of current tier cap

### Nudge Copy (Examples)

**Disciples crossing Growth → Thrive boundary:**
> **Your church is multiplying!**
> You now have over 1,000 disciples actively engaging in DNA. That's not a number — that's a movement happening right in your church. Your community has grown beyond the Growth tier.
> It's time to step into **Thrive**. [Upgrade Now →]

**Concurrent users crossing Seed → Growth boundary:**
> **Your congregation is showing up!**
> Over 200 people joined your last live service — you've outgrown the Seed tier. This is a celebration moment. Your church is alive and engaged.
> It's time to grow into **Growth**. [Upgrade Now →]

**Behavior:**
- Dismissable (stores dismissal in `church_billing_status` metadata or a separate column)
- Reappears after 7 days if not acted on
- Does not show if they're already on the correct tier

---

## Coupons & Discounts

Handled entirely in **Stripe dashboard** — no custom coupon UI needed in Hub.

**Types of discounts:**

| Discount Type | How to Apply |
|---|---|
| Launch promo (first 100 churches) | Single Stripe coupon code, `max_redemptions: 100`, % off or fixed amount, entered at checkout |
| Church plant discount | Manual — apply coupon to specific Stripe customer from Stripe dashboard |
| Hardship / situational discount | Manual — apply coupon to specific Stripe customer from Stripe dashboard |
| Negotiated pricing (Movement tier) | Custom subscription created directly in Stripe dashboard |

At Stripe Checkout, show a "Have a promo code?" field. Stripe validates and applies automatically. No webhook handling needed for coupons — Stripe just charges the discounted amount and your invoice reflects it.

---

## Transactional Emails

All sent via Resend. New templates to create in `src/lib/email.ts`.

| Email | Trigger | Recipient |
|---|---|---|
| `billing-payment-failed` | `invoice.payment_failed` | Church billing contact |
| `billing-payment-failed-day3` | Cron at Day 3 post-failure | Church billing contact |
| `billing-suspending-soon` | Cron at Day 7 post-failure | Church billing contact |
| `billing-suspended` | Day 8 cron / status change | Church billing contact |
| `billing-restored` | `invoice.payment_succeeded` (after failure) | Church billing contact |
| `billing-card-expiring` | `payment_method.expiring` | Church billing contact |
| `billing-upgrade-success` | `checkout.session.completed` | Church billing contact |
| `billing-tier-nudge` | Computed trigger | Church billing contact |

Each email should:
- Be plain, warm, and direct (not corporate)
- Include a "Manage Billing" link → deep link to Hub billing tab
- Include DNA Discipleship branding (not ARK Identity)

---

## Build Order

### Pre-Build (Stripe Dashboard — before writing any code)

0. ✅ Create DNA Discipleship Stripe account (separate from ARK Identity)
0. ✅ Create 4 Products + Prices (Seed/Growth/Thrive/Multiply) with tier metadata
0. ✅ Configure Customer Portal (invoice download on, cancellation off, plan-switch off)
0. ✅ Set statement descriptor: `DNA DISCIPLESHIP`
0. ✅ Set invoice footer: `DNA Discipleship is a ministry of ARK Identity`
0. ✅ **Enable Stripe Tax** — set origin address, assign SaaS tax code (`txcd_10103001`) to all products, enable exemption certificate collection
0. ✅ Set up Webhook endpoint, capture signing secret

### Phase 1 — Core Infrastructure ✅ COMPLETE

1. ✅ `128_billing_system.sql` — database schema (billing status, events, session tracking, Sunday peaks)
2. ✅ `POST /api/webhooks/stripe` — webhook handler (all events, signature verification, idempotency)
3. ✅ `GET /api/billing/status` — fetch billing status for church
4. ✅ `POST /api/billing/checkout` — create Stripe Checkout session (with `automatic_tax: { enabled: true }`)
5. ✅ `GET /api/billing/portal-session` — create Stripe Customer Portal session

**Notes:**
- ARK Identity LLC (Colorado) is the legal entity. DBA "DNA Discipleship" needed for Stripe statement descriptor — file with Colorado SOS.
- Stripe SDK v17: `current_period_start/end` not in TypeScript types, cast to `any` to access at runtime.
- Billing tab lives on `/dashboard` (church leader admin view), not a separate admin page.

### Phase 2 — Church Admin UI

6. Billing tab on `/dashboard` (church leader view)
   - Free state (upgrade CTA with tier selector)
   - Active state (plan info, next billing date, manage billing button)
   - Past due / suspended states (warning banners)
   - Invoice history list (from Stripe via portal)
7. Resend email templates (payment failed, card expiring, restored, upgrade success)
8. Grace period cron (Day 3, Day 7, Day 8 jobs)

### Phase 3 — Super Admin + Tracking

9. `/admin/billing` — super-admin billing dashboard
   - MRR/ARR overview
   - Church billing table with filters
   - Tier overage flags
   - Church billing detail drill-in
10. Sunday concurrent user tracking (session events from Daily DNA `/live` page)
11. Sunday peak computation + storage
12. Tier nudge system (threshold detection + dismissable banner in Hub)

### Phase 4 — Polish

13. Tier upgrade flow (plan selection page before checkout)
14. Admin notes field on church billing records
15. CSV export of billing data from super-admin view
16. Billing contact field (separate from church admin email, for finance teams)

---

## Environment Variables

Add to `dna-hub/.env.local` and production:

```bash
# Stripe (DNA Discipleship account — separate from ARK Identity)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Stripe Price IDs (from Stripe Dashboard after creating products)
STRIPE_PRICE_SEED=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_THRIVE=price_...
STRIPE_PRICE_MULTIPLY=price_...
```

---

## What NOT to Build Yet

- **Annual billing** — monthly only for now
- **Self-service plan switching** — relational, handled by DNA team
- **Self-service cancellation** — relational, not a one-click button
- **Self-service subscription pause** — conversation-based only
- **Automated tier enforcement** (hard cutoff when concurrent users exceed limit) — internal flag + outreach only
- **Usage-based billing** — flat tier pricing is the model
- **Multi-seat / per-user pricing** — not applicable to this model
- **Stripe Connect** — not needed, single platform account
- **TaxJar or Avalara** — Stripe Tax covers all needs at this stage; revisit only if AutoFile becomes necessary at scale
- **Custom tax calculation logic** — Stripe Tax handles this entirely, do not build it
