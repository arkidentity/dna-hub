# Demo Page System

Personalized sales demo pages for church prospects. Each demo page is church-branded, shows a live Daily DNA app preview in an iframe (auto-logged-in), and adapts CTA copy based on lead temperature.

---

## Architecture Overview

```
Prospect visits /demo/[slug]
        │
        ▼
DemoPage (server component)
  ├── GET /api/demo/church/[slug]  → branding + demo config (public)
  └── renders DemoPageClient
            │
            ▼ (client-side, on mount)
        GET /api/demo/app-session/[slug]  → Supabase tokens (public)
            │
            └─► iframe: https://[slug].dailydna.app/#access_token=...
                        (auto-logged-in as demo disciple account)
```

---

## Key Files

| File | Role |
|---|---|
| `src/app/demo/[slug]/page.tsx` | Server component — fetches config, resolves temp, renders client |
| `src/components/demo/DemoPageClient.tsx` | Client component — full page UI, iframe, FAQ, CTAs |
| `src/app/api/demo/church/[slug]/route.ts` | Public API — returns branding + demo config (only if `demo_enabled`) |
| `src/app/api/demo/app-session/[slug]/route.ts` | Public API — generates short-lived Supabase tokens for iframe auto-login |
| `src/app/api/admin/demo/[churchId]/route.ts` | Admin API — GET/POST demo settings |
| `src/app/api/admin/demo/[churchId]/seed/route.ts` | Admin API — seeds full demo data for a church |
| `src/components/admin/DemoTab.tsx` | Admin UI — configure + seed a church's demo page |

---

## Database Table: `church_demo_settings`

| Column | Type | Description |
|---|---|---|
| `church_id` | uuid | FK to `churches` (unique) |
| `demo_enabled` | boolean | Gate — page 404s if false |
| `demo_user_id` | uuid | FK to `auth.users` for the seeded demo account |
| `demo_seeded_at` | timestamptz | Last seed timestamp (null = not seeded) |
| `video_url` | text | YouTube URL or direct video URL for coach video |
| `default_temp` | text | `cold` / `warm` / `hot` — default CTA tone |
| `coach_name` | text | Caption under coach video (e.g. "Travis") |

---

## Lead Temperature System

Three CTA tone variants. Coaches send the appropriate link to each prospect.

| Temp | Tone | CTA Text | URL param |
|---|---|---|---|
| `cold` | Educational | "Schedule a Free Overview Call" | `?temp=cold` |
| `warm` | Personalized | "Book a Discovery Call" | `?temp=warm` |
| `hot` | Action | "Book Your Strategy Call" | `?temp=hot` |

**Resolution order:** URL `?temp=` param → `church_demo_settings.default_temp` → fallback `warm`

---

## Auto-Login Flow (iframe token injection)

The demo page shows Daily DNA in an iframe, pre-logged-in as the demo disciple account, so prospects see a realistic in-app experience without a login screen.

**Step-by-step:**

1. `DemoPageClient` mounts → calls `GET /api/demo/app-session/[slug]`
2. Server looks up `demo_user_id` from `church_demo_settings`
3. Server calls `supabase.auth.admin.generateLink({ type: 'magiclink', email: demoEmail })`
4. Extracts `hashed_token` from the link response
5. POSTs to Supabase `/auth/v1/verify` with `{ token: hashedToken, type: 'magiclink' }`
6. Receives `{ access_token, refresh_token, expires_in }`
7. Returns tokens to client
8. Client sets iframe `src` to:
   ```
   https://[slug].dailydna.app/#access_token=...&refresh_token=...&type=recovery
   ```
9. Daily DNA reads the hash fragment on load and establishes the session

**Fallback:** If demo not seeded or token generation fails, `{ demo_auth: false }` is returned and the iframe falls back to plain `https://[slug].dailydna.app` (shows the login screen).

**Demo account email convention:** `demo-{subdomain}@dna.demo`

---

## Seed Flow

Seeding creates a full, realistic demo experience. Idempotent — safe to re-run.

**Trigger:** Admin clicks "Seed Demo Data" in DemoTab → `POST /api/admin/demo/[churchId]/seed`

**What gets created/replaced:**

1. **Supabase Auth user** — `demo-{subdomain}@dna.demo`, `email_confirm: true`, `is_demo: true` metadata
2. **`disciples` record** — "Demo Disciple", upserted by email
3. **`disciple_app_accounts` record** — `id` = auth user id (FK constraint), links to church
4. **`dna_groups` + `group_disciples`** — `[DEMO] Life Group Alpha`, start_date 21 days ago, only if a `dna_leaders` row exists for the church
5. **`disciple_checkpoint_completions`** — 8 checkpoints across weeks 1–6, spaced 3 days apart (delete+insert, not upsert)
6. **`disciple_journal_entries`** — 5 entries with realistic Head/Heart/Hands content (delete+insert)
7. **`disciple_prayer_cards`** — 4 active + 1 answered (delete+insert)
8. **`dna_calendar_events`** — 2 upcoming Thursday events prefixed `[DEMO]` (delete+insert)
9. **`church_demo_settings`** — updates `demo_user_id` + `demo_seeded_at`

**Idempotency strategy:**
- Auth user: conflict → find via `listUsers` by email
- `disciples`: upsert on `email`
- `disciple_app_accounts`: upsert on `id`
- `dna_groups`: find by `ilike(group_name, '[DEMO]%')` → update if exists, insert if not
- Checkpoints, journals, prayers, calendar events: delete then insert (full refresh)

---

## Admin UI: DemoTab

Located at: `src/components/admin/DemoTab.tsx`
Rendered on: `/admin/church/[id]` → Demo tab

**Fields:**
- **Demo Enabled toggle** — gates the public `/demo/[slug]` page (404 if off)
- **Coach Video URL** — YouTube URL (any format); ID extracted client-side via regex. Supports shorts, watch, embed, and direct video URLs
- **Coach Name** — caption below video (e.g. "Travis · Founder, DNA Discipleship")
- **Default Lead Temperature** — `cold` / `warm` / `hot` pill selector

**Generated Links section:** Shows all 3 temp-parameterized URLs with copy + preview buttons. Hidden if demo is disabled or church has no subdomain.

**Seed Data section:** Shows seed status badge + "Seed Demo Data" button with confirmation step. Describes what will be created/replaced.

---

## Public API Security

Both public demo endpoints (`/api/demo/church/[slug]` and `/api/demo/app-session/[slug]`) require no auth — they're in the sales funnel. Security is enforced by:

1. **`demo_enabled` gate** — returns 404/403 if demo not enabled
2. **Slug validation** — rejects anything not matching `[a-z0-9-]+`
3. **`demo_user_id` check** — token generation returns `{ demo_auth: false }` if not seeded
4. **`noindex, nofollow` meta** — demo pages not indexed by search engines

---

## DemoPageClient Layout (sections)

1. **Header** — DNA logo + church logo (fixed, blurred)
2. **Hero** — personalized headline + primary CTA + assessment link
3. **Coach Video** — 9:16 iframe (YouTube or direct video), coach name caption
4. **Live App Preview** — 9:16 iframe of `[slug].dailydna.app` auto-logged-in, with loading spinner
5. **Proof Points** — 3 icon+text badges
6. **Leader Dashboard CTA** — card with link to `/demo-hub/[slug]` (conditional, if `hubDemoUrl` set)
7. **FAQ** — accordion, 4 items
8. **Final CTA** — dark section, primary + secondary buttons
9. **Footer** — copyright + "Personalized demo for [Church Name]"
10. **Sticky mobile bar** — fixed bottom CTA, hides when Final CTA section is in view (IntersectionObserver)
