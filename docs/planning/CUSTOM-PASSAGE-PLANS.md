# Custom Passage Plans

> **Status:** Planning
> **Target migration:** 149 (series table) + 150 (passages table + RPCs)
> **Feature flag:** `custom_passage_plan_enabled` on `church_branding_settings`

## Purpose

Let churches override the global Passage of the Day with their own curated series (e.g., a Sunday sermon series on the book of Acts, Easter week, an Advent plan). When a row exists for today's date on that church's subdomain, disciples see the church's passage. Otherwise they see the global curated passage — no gaps required.

## Design Principles

1. **Partial override only.** Churches fill in the dates they care about. Global curation fills every other day. No "whole year" commitment.
2. **Reference-only.** Churches submit a scripture reference (e.g., `Acts 2:1-4`). The existing `parseReferenceToUSFM` + YouVersion pipeline pulls verses in each user's preferred translation. No pasted text.
3. **Optional theme, no explanation.** If a row has no explanation, the passage card simply renders reference + verses. Keeps quality control in Anthropic's hands for global, keeps overhead low for churches.
4. **Series as first-class.** A passage belongs to a series. Delete a series → all its rows disappear. Edit a series' CSV → atomic replace of that series' rows.
5. **Multi-series scheduling.** A church can have past, active, and future series loaded at once. No activation step — presence of a row for today's date = it shows.

## Data Model

### Migration 149 — `church_passage_series`

```sql
CREATE TABLE church_passage_series (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  name TEXT NOT NULL,               -- "Acts Series", "Easter Week 2026"
  description TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  row_count INT NOT NULL DEFAULT 0, -- denormalized for Hub UI
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (end_date >= start_date)
);

CREATE INDEX idx_passage_series_church ON church_passage_series(church_id, start_date);
```

### Migration 150 — `church_passage_plan_entries` + RPCs

```sql
CREATE TABLE church_passage_plan_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_id UUID NOT NULL REFERENCES church_passage_series(id) ON DELETE CASCADE,
  church_id UUID NOT NULL REFERENCES churches(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  reference TEXT NOT NULL,          -- "Acts 2:1-4"
  theme TEXT,                       -- optional display label
  explanation TEXT,                 -- always NULL for custom plans; reserved for future
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (church_id, date)          -- one passage per church per day
);

CREATE INDEX idx_passage_entries_church_date ON church_passage_plan_entries(church_id, date);
CREATE INDEX idx_passage_entries_series ON church_passage_plan_entries(series_id);
```

**Key constraints:**
- `UNIQUE (church_id, date)` — a church can only have one custom passage per day. Upload-time conflict detection surfaces this to the user (overwrite vs skip).
- `ON DELETE CASCADE` from series → entries means deleting a series cleans up all its rows.

### RPC: `get_custom_passage_for_today`

```sql
CREATE OR REPLACE FUNCTION get_custom_passage_for_today(p_church_id UUID)
RETURNS TABLE (reference TEXT, theme TEXT, series_name TEXT)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT e.reference, e.theme, s.name
  FROM church_passage_plan_entries e
  JOIN church_passage_series s ON s.id = e.series_id
  WHERE e.church_id = p_church_id
    AND e.date = CURRENT_DATE
  LIMIT 1;
$$;
```

Called by Daily DNA when `custom_passage_plan_enabled` is true. If no row, fall back to global `PASSAGES[(dayOfYear - 1) % PASSAGES.length]`.

### RPC: `replace_passage_series`

Single-transaction bulk insert for CSV upload: deletes existing entries for the series ID, inserts new batch, recomputes `row_count` + `start_date` + `end_date`. Prevents partial-write states.

## CSV Format

**Template download** (Hub button):

```csv
date,reference,theme
2026-04-20,Acts 1:8,Acts Series - The Promise
2026-04-21,Acts 2:1-4,Acts Series - Pentecost
2026-04-22,Acts 2:37-41,Acts Series - First Converts
```

**Rules:**
- `date` required, ISO format `YYYY-MM-DD`
- `reference` required, validated against `parseReferenceToUSFM` before accepting upload
- `theme` optional
- No `explanation` column — always null for custom plans
- Duplicate dates within one CSV → reject upload with row numbers called out
- Dates conflicting with existing entries in the same church → preview dialog: "Overwrite / Skip / Cancel"

## Hub UI

New tab under **Daily DNA** section: **Passage Plan** (after Guests tab).

### `PassagePlanTab.tsx`

**Top controls:**
- Toggle: `Enable Custom Passage Plans` (writes to `church_branding_settings.custom_passage_plan_enabled`)
- Download CSV Template button
- Upload CSV button → opens `UploadSeriesModal`

**Series list** (sorted by `start_date` desc):

```
┌─────────────────────────────────────────────────────┐
│ Acts Series                          [Active now]   │
│ Apr 20 – May 10, 2026 · 21 passages                 │
│ [View] [Replace CSV] [Delete]                       │
├─────────────────────────────────────────────────────┤
│ Book of James                        [Upcoming]     │
│ May 11 – Jun 1, 2026 · 22 passages                  │
│ [View] [Replace CSV] [Delete]                       │
├─────────────────────────────────────────────────────┤
│ Easter Week 2026                     [Past]         │
│ Apr 5 – Apr 12, 2026 · 8 passages                   │
│ [View] [Delete]                                     │
└─────────────────────────────────────────────────────┘
```

**Status pill logic:** `Past` if `end_date < today`, `Active now` if `start_date <= today <= end_date`, `Upcoming` if `start_date > today`.

### `UploadSeriesModal.tsx`

Step 1: name + description + CSV file picker
Step 2: validation preview — table of parsed rows with any errors highlighted inline (invalid reference, duplicate date, bad date format)
Step 3: conflict resolution — if any dates overlap existing entries for this church, show "3 conflicts with *Acts Series* — Overwrite / Skip Those Rows / Cancel"
Step 4: submit → RPC → success

### `ViewSeriesModal.tsx`

Read-only table of all entries in the series. Inline edit single rows (date, reference, theme) with autosave. Delete single row button. Useful for small typo fixes without re-uploading.

### Replace CSV flow

On an existing series: upload a new CSV → `replace_passage_series` RPC atomically swaps contents. Used when church fixes a typo across many rows and wants a clean re-import.

## Daily DNA Integration

Single change in `lib/passageOfTheDay.ts` (or wrapper):

```ts
export async function getPassageForToday(churchId: string | null, theme: ChurchTheme) {
  if (churchId && theme.custom_passage_plan_enabled) {
    const custom = await supabase.rpc('get_custom_passage_for_today', { p_church_id: churchId });
    if (custom.data?.[0]) {
      return {
        reference: custom.data[0].reference,
        theme: custom.data[0].theme,
        explanation: null,          // skip explanation for custom plans
        source: 'custom',
        seriesName: custom.data[0].series_name,
      };
    }
  }
  // Fallback: global curated passage
  const idx = (dayOfYear() - 1) % PASSAGES.length;
  return { ...PASSAGES[idx], source: 'global' };
}
```

**Journal card UI:** when `source === 'custom'`, show a small subtitle chip: `From your church: Acts Series`. No explanation block rendered.

## Rollout Plan

1. Migration 149 + 150
2. Hub: `PassagePlanTab` + upload/view modals + API routes
3. Hub: add `custom_passage_plan_enabled` field to BrandingTab + pipe through `get_church_branding_by_subdomain` RPC (same pattern as `live_service_enabled`)
4. Daily DNA: `getPassageForToday` wrapper + journal card "from your church" chip
5. Pilot with one church (their spring series) before wide release

## Open Questions

- **Sunday auto-anchor?** Should we offer a "sermon passage continues for 7 days" quick-add helper that takes one reference + one date and creates 7 rows? (Later enhancement, not v1.)
- **Analytics?** Do churches want to see how many of their disciples opened the custom passage vs skipped? (Deferred.)
- **Multi-passage days?** Not v1 — unique constraint enforces one per day. Could relax later if demand appears.

## Non-Goals

- Church-authored explanations (skip for quality + support overhead)
- Whole-year reading plans (out of scope — this is for series)
- Per-disciple customization (always church-wide on the subdomain)
- Pasted scripture text (always pulled live via translation pipeline)
