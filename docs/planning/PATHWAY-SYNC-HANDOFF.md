# Pathway Sync Reliability — Handoff

**Built:** 2026-04-23
**Scope:** Daily DNA app — fix "disciple marked week complete, Hub dashboard shows nothing"
**Status:** Shipped, unverified in prod (needs manual QA — steps below)

---

## The bug this fixes

Pre-fix, `toggleDynamicWeek` did optimistic UI + fire-and-forget upsert with swallowed errors, no retry, and no auth check. On mobile PWA, the following failed silently:

- Brief network drop during tap → write lost, UI shows ✓, Hub shows nothing.
- Expired Supabase JWT after tab suspend → RLS rejects upsert → silent failure.
- Any transient Supabase 5xx → swallowed, never retried.

Compounding it, two parallel completion systems were both being written:

- Legacy `disciple_checkpoint_completions` (Migration 055)
- New `disciple_pathway_completions` (Migration 116)

The Hub dashboard reads both and prefers the new table, but the double-write muddied debugging.

---

## What changed (4 patches, all in `dna-app/daily-dna/`)

### Patch 1 — Typed errors + session check
**File:** `lib/pathwayDynamic.ts`

- New `PathwaySyncError` class with codes `AUTH_EXPIRED | NETWORK | RLS_DENIED | UNKNOWN`.
- New `ensureAuthed()` helper: checks `supabase.auth.getSession()`, tries one `refreshSession()` if stale/missing, throws `AUTH_EXPIRED` if still dead. Runs before every mark/unmark.
- `markWeekComplete` / `unmarkWeekComplete` now return `Promise<void>` and **throw** typed errors instead of returning `false`.

### Patch 2 — Outbox with backoff + wake-up drain
**New file:** `lib/pathwayOutbox.ts`
**File:** `hooks/usePathway.ts`

- `localStorage['dna_pathway_outbox']` = array of pending `{id, accountId, phase, weekNumber, op, attempts, lastAttemptAt}`.
- `enqueue()` dedupes on `(accountId, phase, weekNumber)` — rapid mark→unmark collapses to one op, user's final intent wins.
- `drain()` is serialized via in-flight flag, runs mark/unmark via Patch 1 functions, removes on success, increments attempts + exponential backoff (5s × attempts, capped 60s) on failure. `AUTH_EXPIRED` stops drain early.
- `toggleDynamicWeek` no longer calls DB directly: optimistic flip → enqueue → trigger drain.
- Drain triggers: hook mount, `document.visibilitychange → visible` (mobile wake-up catches backgrounded failures), and Retry button.

### Patch 3 — Overlay pending outbox on fetched pathway
**File:** `hooks/usePathway.ts`

- `overlayPending()` applies queued outbox ops onto a freshly-fetched pathway before setting state. Prevents UI flickering back to "uncomplete" when a mount-time fetch races ahead of the drain. Applied in both initial fetch and `refresh()`.

### Patch 4(a) — Freeze legacy checkpoint writes
**File:** `lib/pathwaySync.ts`

- `syncPathway()` no longer calls `syncCheckpointCompletions`. Function still exported in case a backfill migration is wanted later.
- `syncToolkitProgress` (different table — `disciple_toolkit_progress`, month pointer) still runs.

### Patch 4(b) — Error banner UI
**File:** `app/pathway/page.tsx`

- `SyncErrorBanner` component: fixed-top red banner, `role="alert"`, Retry + Dismiss buttons. Retry hidden for `AUTH_EXPIRED` (pointless until re-auth).
- Rendered via fragments above every subview (main / phase-detail / week-detail / no-group).

---

## Hub impact — zero code changes needed

Audited `dna-hub/src/` for Hub views reading `checkpoint_completions`:

- **Disciple profile [page.tsx:426](../../src/app/groups/[id]/disciples/[discipleId]/page.tsx)** correctly prefers `pathway_completions` when present. Falls back to checkpoint count in footer only when `hasDynamicPathway` is false.
- **Line 848** in that file calculates `hasCheckpoints` but never uses it — dead code, harmless, worth deleting next time that file is touched.
- **Demo seed routes** at `/api/admin/demo/...` write checkpoint data server-side for fixtures; unaffected by the sync freeze.
- API endpoint at [route.ts:177](../../src/app/api/groups/[id]/disciples/[discipleId]/route.ts) reads both tables and returns both — safe.

No Hub view will regress. New disciples onboarded after 2026-04-23 will naturally have zero legacy checkpoint rows; they'll use the new path and show up correctly.

---

## Manual verification — run these before calling it done

Start the dev server: `cd dna-app/daily-dna && npm run dev`

1. **Happy path online**
   Sign in as a test disciple. Tap to mark week 2 complete. Verify: ✓ appears, no banner, `disciple_pathway_completions` has a row, Hub dashboard for this disciple shows week 2 complete.

2. **Offline retry**
   DevTools → Network → Offline. Tap week 3 complete. Verify: ✓ flips optimistically, red banner "Couldn't reach server — Retry", `localStorage['dna_pathway_outbox']` has 1 item. Go back online, click Retry. Banner clears, DB row lands.

3. **Dedup**
   Offline, tap week 4 (mark), then tap week 4 again (unmark). Verify: outbox has exactly 1 item with `op: 'unmark'`, not 2.

4. **Wake-up drain**
   Offline, tap week 5. Close browser tab. Reopen tab online. Verify: outbox drains automatically on mount, no click needed, banner never appears, DB row exists.

5. **Expired JWT**
   In console: `supabase.auth.signOut()` without reloading. Tap week 6. Verify: banner says "Your session expired", no Retry button.

6. **Hub parity**
   For each test above, open the disciple's profile in the Hub. Every tick that landed in the DB should appear; every tick still in the outbox should NOT appear (that's correct — it hasn't synced yet).

---

## What is NOT yet done

Deferred deliberately — pick up in a future session if/when needed:

- **Backfill migration** `disciple_checkpoint_completions` → `disciple_pathway_completions`. Legacy table is now frozen-but-read. Only needed if historical completions need to appear in the new UI.
- **Pending-count UI** ("3 syncing…" chip). Skipped because drain is near-instant online; users only see a banner when it fails.
- **Pathway versioning.** So a church editing a pathway mid-season doesn't retroactively scramble everyone's progress. Deferred — build when a church actually requests pathway edits.
- **Same pattern for other syncs.** `journalSync`, `activitySync`, `testimonySync`, `assessmentSync` are all still fire-and-forget without retry. If silent-loss reports surface for those tools, replicate the outbox pattern (trivially — `pathwayOutbox.ts` is 170 LOC and generic enough to copy).
- **External tool embeds.** A future `tool_type='external' + external_url + nullable church_id` on `pathway_tools` to let churches add custom tools rendered as iframes. Architectural seam already exists (tool registry is data-driven). Separate scope.
- **Dead code cleanup** at [disciples/[discipleId]/page.tsx:848](../../src/app/groups/[id]/disciples/[discipleId]/page.tsx) — `hasCheckpoints` is calculated but unused.

---

## For the next chat

The session memory file already captures all of this:
`~/.claude/projects/-Users-docgrfx-Documents-GitHub/memory/project_pathway_sync_fix.md`

A fresh Claude session will auto-load MEMORY.md (which indexes the file) and have full context. No need to paste this doc — just reference "the pathway sync fix" and Claude will know.

Recommended next-chat prompts:
- **"Walk me through verifying the pathway sync fixes"** — do the 6 steps above together.
- **"Audit the existing Hub PathwayEditor for gaps"** — I didn't actually read `PathwayEditor.tsx`; worth a targeted review.
- **"Add external tool embeds to pathway_tools"** — schema + Hub UI + Daily DNA iframe rendering.
- **"Replicate the outbox pattern for `journalSync`"** (or any other sync) — same bug class, different table.

---

## Key files changed

```
dna-app/daily-dna/lib/pathwayDynamic.ts    [modified]  — typed errors, ensureAuthed
dna-app/daily-dna/lib/pathwayOutbox.ts     [NEW]       — localStorage queue + drain
dna-app/daily-dna/lib/pathwaySync.ts       [modified]  — froze syncCheckpointCompletions
dna-app/daily-dna/hooks/usePathway.ts      [modified]  — outbox wiring, overlayPending, visibilitychange
dna-app/daily-dna/app/pathway/page.tsx     [modified]  — SyncErrorBanner
```

No schema migrations. No Hub changes.
