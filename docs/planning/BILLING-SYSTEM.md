# DNA Discipleship — Billing System Plan

> **Status:** Complete (April 2026)
> **Apps affected:** DNA Hub (church admin billing UI + super-admin), Supabase (schema + webhooks)
> **Payment processor:** Stripe (separate DNA Discipleship account)
> **Email delivery:** Resend (already integrated)
> **Sales tax:** Stripe Tax (built-in, handles exemption certificates)

---

## All 4 Phases Complete ✅

### Phase 1 — Core Infrastructure ✅

- `128_billing_system.sql` — schema (church_billing_status, billing_events, church_session_events, sunday_peak_sessions)
- `POST /api/webhooks/stripe` — all events, signature verification, idempotency
- `GET /api/billing/status` — fetch billing status for church
- `POST /api/billing/checkout` — Stripe Checkout session (automatic_tax enabled)
- `GET /api/billing/portal-session` — Stripe Customer Portal session

**Gotchas discovered:**
- Stripe SDK must be **lazy** (function-scoped `getStripe()`, not module-level `const stripe = new Stripe()`) — module-level init fails at build time
- `customer.subscription.created` fires after `checkout.session.completed` and can overwrite period dates with null — fix: `...(periodStart && { current_period_start: periodStart })` (only spread when non-null)

### Phase 2 — Church Admin UI ✅

- `BillingTab.tsx` on `/dashboard` (9th tab, CreditCard icon)
  - Free/canceled: tier selector (Seed $149 / Growth $299 / Thrive $599 / Multiply $1,099) + upgrade CTA
  - Active: plan name, price, next billing, status badge, Manage Billing → portal
  - Past due: yellow banner + update payment button
  - Suspended: red banner + restore button
  - All states: Billing Contact card (`billing_email` via `PATCH /api/billing/contact`)
  - `?billing=success` auto-selects tab + shows success banner
- 7 Resend email templates in `email.ts`: payment failed, day3, day7, suspended, restored, card expiring, upgrade success
- Grace period cron `/api/cron/billing-grace` (daily 10am UTC) — Day 3/7/8 dunning, idempotent via synthetic `billing_events` IDs

### Phase 3 — Super Admin + Tracking ✅

- `AdminBillingTab.tsx` on `/admin` (admin-only, CreditCard icon)
  - MRR / ARR / Active / Needs Attention stat cards
  - Church table: status badge, tier, MRR, next billing, Stripe link
  - Filter pills + search
  - Admin notes inline editing (hover → pencil → `PATCH /api/admin/billing/[churchId]/notes`)
  - Export CSV (client-side)
- `/api/admin/billing` — GET all churches billing data + summary stats
- `daily-dna/lib/sessionTracking.ts` — `log_session_event` RPC calls (join/heartbeat 60s/leave on visibility hidden), wired into `LiveFeed.tsx` via `subdomain` prop

**Deferred:** Sunday peak computation cron, tier nudge system

### Phase 4 — Polish ✅

- `129_billing_admin_notes.sql` — `admin_notes TEXT` on `church_billing_status`; DROP + recreate `get_church_billing_status` RPC
- Admin notes inline editing in `AdminBillingTab`
- CSV export in `AdminBillingTab`
- Billing contact field in `BillingTab` + `PATCH /api/billing/contact`

---

## Business Model

| State | Features |
|---|---|
| Free | All Hub tools, no Live Service Mode |
| Active | Everything + Live Service Mode (`live_service_enabled = true`) |
| Past Due | Full access + yellow warning banner (7-day grace) |
| Suspended | Hub only, Live Service gated |
| Canceled | Hub read-only |

## Pricing Tiers

| Tier | Size | Price |
|---|---|---|
| Seed | 1–250 | $149/mo |
| Growth | 251–1,000 | $299/mo |
| Thrive | 1,001–2,500 | $599/mo |
| Multiply | 2,501–5,000 | $1,099/mo |
| Movement | 5,000+ | Custom |

## Dunning Flow

```
Day 0  → invoice.payment_failed → status=past_due → email
Day 3  → cron → reminder email
Day 7  → cron → "suspending tomorrow" email
Day 8  → cron → status=suspended, live_service_enabled=false → email
Day 30 → Stripe auto-cancels → status=canceled
```

## Environment Variables

```bash
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_SEED=price_...
STRIPE_PRICE_GROWTH=price_...
STRIPE_PRICE_THRIVE=price_...
STRIPE_PRICE_MULTIPLY=price_...
```

## What NOT to Build Yet

- Annual billing, self-service plan switching, self-service cancellation
- Automated tier enforcement (flag + outreach only)
- TaxJar / Avalara (Stripe Tax handles this)
- Sunday peak computation cron (schema ready, cron not built)
- Tier nudge system
