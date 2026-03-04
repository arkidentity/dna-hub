# Demo Page System

Personalized sales demo pages for church prospects. Each demo page is church-branded, shows a live Daily DNA app preview in an iframe (auto-logged-in via a single global demo account), and adapts CTA copy based on lead temperature.

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
        GET /api/demo/app-session/[slug]
            │  signs in as demo-global@dna.demo (one shared account)
            │  only checks demo_enabled — no per-church seed required
            │
            ├─► Section 4 iframe: https://[slug].dailydna.app/demo-entry
            │       ?at=...&rt=...&redirect=/pathway&church=[slug]
            │       (auto-logged-in as global demo, shows full DNA Pathway)
            │
            └─► Section 7 iframe: /demo-hub/[slug]?embed=1
                    (StaticMiniDashboard — zero DB reads, pure UI)
```

---

## Key Files

| File | Role |
|---|---|
| `src/app/demo/[slug]/page.tsx` | Server component — fetches config, resolves temp, renders client |
| `src/components/demo/DemoPageClient.tsx` | Client component — full page UI, iframes, FAQ, CTAs |
| `src/app/demo-hub/[slug]/page.tsx` | Hub demo server component — reads `?embed=1` param |
| `src/components/demo/HubDemoClient.tsx` | Hub demo client — if `embed=true`, skips auth, shows StaticMiniDashboard |
| `src/app/api/demo/church/[slug]/route.ts` | Public API — returns branding + demo config (only if `demo_enabled`) |
| `src/app/api/demo/app-session/[slug]/route.ts` | Public API — signs in as global demo account, returns tokens |
| `src/app/api/admin/demo/[churchId]/route.ts` | Admin API — GET/POST demo settings per church |
| `src/app/api/admin/demo/[churchId]/seed/route.ts` | Admin API — seeds per-church groups + calendar events (still used for Hub calendar in StaticMiniDashboard is hardcoded — less critical now) |
| `src/app/api/admin/demo/global-seed/route.ts` | **Admin API — one-time global seed. Creates demo-global@dna.demo + disciples + checkpoints/journal/prayers** |
| `src/components/admin/DemoTab.tsx` | Admin UI — configure + seed a church's demo page |
| `daily-dna/app/demo-entry/page.tsx` | Daily DNA — receives tokens via query params, calls setSession, redirects to /pathway |

---

## Global Demo Account (Option B — active)

**All church app demo iframes share one account: `demo-global@dna.demo`**

- Password: `dna-demo-global-session` (or `DEMO_GLOBAL_PASSWORD` env var)
- Role: `dna_leader` — bypasses group gate, shows full DNA Pathway
- No `church_id` — branding comes from the URL subdomain, not the account
- Seeded once via `POST /api/admin/demo/global-seed` (button in `/admin/settings`)
- Idempotent — safe to re-run at any time

**Why global over per-church:**
Previously each church required running a seed that created `demo-{slug}@dna.demo` auth users + `[DEMO] Life Group Alpha` groups + disciples — polluting real tables. The global approach eliminates all of that. Church branding in the iframe is purely from the URL subdomain (`grace-church.dailydna.app` → Grace Church theme).

**Seed data (global, shared):**
- 8 checkpoint completions (weeks 1–6)
- 5 journal entries (John 15:5, Romans 12:2, Psalm 23:1, Matthew 28:19, Philippians 4:13)
- 5 prayer cards (4 active + 1 answered)
- Demo leader account (`demo-leader@dna.demo` / "Sarah Mitchell") — auth user + disciples + disciple_app_accounts + dna_leaders
- 1 DNA group ("Life Group Alpha", foundation phase, 21 days old)
- group_disciples membership (demo-global + leader)
- 8 group chat messages (realistic leader↔disciple conversation)
- group_message_reads (partial unread for demo user)
- 4 upcoming calendar events (group meetings + scripture deep-dive)

**`church_id` backfill note:** `ensureDiscipleAccount` in Daily DNA may set `church_id` on the global user's `disciple_app_accounts` row to whichever church visits first. This is harmless — branding and journey content are unaffected by `church_id`.

---

## Hub Demo iframe (`?embed=1`)

The leader dashboard preview (Section 7 of the demo page) uses a completely different approach:

- Hub page at `/demo-hub/[slug]?embed=1` passes `embed={true}` to `HubDemoClient`
- `HubDemoClient` detects `embed=true` → initializes `authState = 'fallback'`, skips all auth fetches
- Renders `StaticMiniDashboard` immediately — fully hardcoded, zero DB reads
- Nav tabs: Groups | Cohort | Training (mirrors real Hub UserMenu structure)
- Groups view: stat cards + group card → click for detail (disciples, calendar, chat preview)
- Cohort view: identity card, stats, announcements, next event
- Training view: Assessment, Manual, Launch Guide, Create Group cards
- Church branding (name, colors, logo) comes from props passed by the server component
- Demo banner hidden in embed mode and on narrow viewports (&lt;500px)

---

## Database Table: `church_demo_settings`

| Column | Type | Description |
|---|---|---|
| `church_id` | uuid | FK to `churches` (unique) |
| `demo_enabled` | boolean | Gate — page 404s if false |
| `demo_user_id` | uuid | Legacy — per-church demo auth user ID (no longer used by app-session route) |
| `demo_free_user_id` | uuid | Legacy — free-tier demo user (free-tier iframe removed) |
| `demo_seeded_at` | timestamptz | Last per-church seed timestamp |
| `video_url` | text | YouTube URL or direct video URL for coach video |
| `default_temp` | text | `cold` / `warm` / `hot` — default CTA tone |
| `coach_name` | text | Caption under coach video (e.g. "Travis") |
| `booking_url` | text | Calendly/Google Cal embed URL for booking modal |

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

## Auto-Login Flow (app iframe token injection)

1. `DemoPageClient` mounts → calls `GET /api/demo/app-session/[slug]`
2. Server verifies `demo_enabled` for this church
3. Server signs in as `demo-global@dna.demo` via `signInWithPassword` (anon client)
4. Returns `{ access_token, refresh_token, expires_in }`
5. Client sets Section 4 iframe `src` to:
   ```
   https://[slug].dailydna.app/demo-entry?at=...&rt=...&redirect=/pathway&church=[slug]
   ```
6. `demo-entry` calls `supabase.auth.setSession()` → redirects to `/pathway`
7. The `church` param is stored in `sessionStorage` as `demo_church_slug` (metadata only)

**Fallback:** If `demo_enabled` is false or sign-in fails, `{ demo_auth: false }` is returned and the iframe falls back to plain `https://[slug].dailydna.app`.

---

## DemoPageClient Layout (sections)

1. **Header** — DNA logo + church logo (fixed)
2. **Hero** — personalized headline ("This is what discipleship looks like at {Church}.")
3. **Coach Video** — 9:16 iframe (YouTube or direct video), coach name caption
4. **Your Free App** (Section 4) — 9:16 iframe, full DNA Pathway, `dna_leader` role. Subline: "This is the complete DNA Pathway, branded for {church}."
5. **Gate intro** (Section 6) — dark section, "A dashboard built for multiplication." Always open (no toggle).
6. **Leader Dashboard** (Section 7A) — 9:16 hub iframe at `/demo-hub/[slug]?embed=1` (StaticMiniDashboard). "Explore the full leader dashboard →" link below.
7. **Built for DNA Leaders** (Section 7B) — dark section, 3 feature cards: Group Management, Peer-to-Peer Cohort, Discipleship Training.
8. **Coaching Partnership** (Section 7C) — warm section, 3 proof points, book call CTA.
9. **FAQ** — accordion, 4 items
10. **Final CTA** — dark section, primary + secondary buttons
11. **Footer** — copyright + church name
12. **Sticky mobile bar** — fixed bottom CTA, hides when Final CTA is in view or iframe is active

---

## Admin: Seeding

### Global seed (one-time, done ✓)
- Button: `/admin/settings` → "Global Demo Account" card → "Seed / Re-seed Global Demo"
- Endpoint: `POST /api/admin/demo/global-seed`
- Creates: 2 auth users (demo-global + demo-leader) + disciples + disciple_app_accounts + dna_leaders + dna_groups + group_disciples + checkpoints/journal/prayers + group_messages + calendar events
- No church_id — branding comes from URL subdomain

### Per-church seed (optional, for Hub calendar events)
- Button: `/admin/church/[id]` → Demo tab → "Seed Demo Data"
- Endpoint: `POST /api/admin/demo/[churchId]/seed`
- Still creates: `[DEMO] Life Group Alpha` group + `[DEMO]` calendar events
- Hub iframe no longer reads from DB (StaticMiniDashboard is hardcoded), so per-church seed is optional

---

## Cleanup Needed (post-launch)

- Delete legacy `demo-{slug}@dna.demo` auth users in Supabase → Authentication → Users
- Delete legacy `demo-free-{slug}@dna.demo` auth users
- `demo-leader@dna.demo` auth user is permanent (needed for global seed group messages FK)
- The per-church `seed/route.ts` step 10 (free-tier user creation) is now dead code — can be removed
- `church_demo_settings.demo_user_id` and `demo_free_user_id` columns are legacy — no longer read by `app-session`

---

## Public API Security

Both public demo endpoints require no auth. Security enforced by:

1. **`demo_enabled` gate** — returns 403 if demo not enabled
2. **Slug validation** — rejects anything not matching `[a-z0-9-]+`
3. **`noindex, nofollow` meta** — demo pages not indexed
4. **Global creds not exposed** — `DEMO_GLOBAL_EMAIL` / `DEMO_GLOBAL_PASSWORD` are server-side env vars; the client only receives short-lived JWT tokens
