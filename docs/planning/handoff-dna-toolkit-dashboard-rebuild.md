# Handoff: DNA Toolkit Dashboard Module Rebuild
*For Claude Code / Dev Implementation*

---

## What This Is

A rebuild of the DNA Toolkit section inside the DNA Leader Dashboard. The current module uses a month-by-month teaching structure (Month 1, Month 2, Month 3) with individual video/content modules per tool. That entire structure is being replaced with a single-page accordion layout.

---

## What's Being Removed

Delete the existing month-by-month teaching modules inside the DNA Toolkit training section entirely. No content from those modules needs to be preserved or migrated.

---

## New Structure: Single Page, Accordion Layout

The DNA Toolkit section becomes one page with collapsible accordion sections. The page is available to DNA Leaders inside their dashboard training area.

### Page Header

**Title:** DNA Toolkit
**Subtitle:** Your complete library of DNA tools and leader resources.

---

### Accordion Sections

Build each of the following as a collapsible accordion. Default state: all collapsed except the first (Overview).

---

#### 1. Overview
*Default: expanded on page load*

Static text content explaining what the DNA Toolkit is. Use this copy (edit for tone/length as needed):

> The DNA Toolkit is your master library of discipleship tools. Each tool is designed to be used inside your DNA group meetings — giving disciples a repeatable experience they can eventually facilitate themselves.
>
> The toolkit is not a rigid curriculum. It's a library. The 90-Day Toolkit pathway tells you which tools to use in Phase 1 and in what sequence. Phase 2 and beyond give you more flexibility to use tools based on where your group is.
>
> Use the leader guides below to prepare for each meeting. You don't need to memorize them — just know the tool well enough to lead it with confidence.

---

#### 2. Leader Expectations

Static text content. Use this copy:

> **Before you lead a tool, you must have experienced it as a disciple.**
> This is non-negotiable in DNA. You cannot give away what you haven't received.
>
> As a DNA leader, you are expected to:
> - Complete your own daily 3D Journal and 4D Prayer
> - Come to each meeting prepared — read the leader guide for that week's tool in advance
> - Model vulnerability. Your disciples will go as deep as you go.
> - Follow up with your disciples between meetings, not just during them
> - Stay connected to your coach and the DNA Cohort

---

#### 3. Key Principles

Static text content. Use this copy:

> **Depth over velocity.**
> DNA runs on a 12-month multiplication timeline. Don't rush it. The system works because the relationships are real.
>
> **Faithfulness over capability.**
> Select disciples who are hungry and faithful — not the most talented or ready-looking people in the room.
>
> **Experience before facilitation.**
> Every tool in Phase 1 is experienced by disciples first. In Phase 2, they begin to facilitate. In Phase 3, they lead. That progression is the system.
>
> **The group is the curriculum.**
> The tools create the environment. The Holy Spirit and the relationships do the actual work. Stay out of the way when God is moving.

---

#### 4. Leader Guides

This accordion section contains the full list of DNA tool leader guides, available as PDF files.

**Layout inside the accordion:**
- Display tools as a simple list or card grid
- Each tool shows: Tool name + one-line description
- Two action buttons per tool: **View** (opens PDF inline) and **Download** (triggers PDF download)

**PDF storage:** PDFs will be uploaded to Supabase storage and referenced by URL. See the file naming convention below.

**File naming convention:**
```
DNA-Leader-Guide-[ToolName].pdf
```
Examples:
- `DNA-Leader-Guide-LifeAssessment.pdf`
- `DNA-Leader-Guide-3DJournal.pdf`
- `DNA-Leader-Guide-Confession.pdf`

**Current tools to list (PDFs will be added progressively as they are completed):**

| Tool Name | One-Line Description |
|-----------|----------------------|
| Life Assessment | Surfacing where disciples are starting from |
| 3D Journal | The daily Scripture reading and reflection practice |
| 4D Prayer | The daily prayer rhythm: Revere, Reflect, Request, Rest |
| Creed Cards | Anchoring disciples in foundational doctrine |
| Communion | Leading the shared table as an act of remembrance and unity |
| Testimony Time | Teaching disciples to articulate what God is doing in their lives |
| Outreach | Taking the group into a live mission experience together |
| Art of Asking Questions | Building the skill of Spirit-led, discovery-based conversations |
| Listening Prayer Circle | Practicing hearing from God for one another |
| Breaking Strongholds | Identifying and breaking patterns that block spiritual freedom |
| Ministry Gift Test | Discovering how God has uniquely wired each disciple |
| Confession | Walking in the light together — vertical and horizontal honesty |
| Simple Fellowship | Creating space for unstructured, life-giving community |
| Rest / Sabbath | Practicing intentional rest as a spiritual discipline |
| Worship Experience | Leading the group into a dedicated time of corporate worship |
| Q&A Time | Opening the floor for honest questions about faith and life |

*Additional tools will be added as PDFs are completed. Build the list so new entries can be added without a code change — ideally driven from a Supabase table or a simple config array.*

---

## Technical Notes

### PDF Viewing (Inline)
- When the user clicks **View**, open the PDF in a modal or inline panel within the dashboard
- Do not navigate away from the page
- Use an embedded PDF viewer (browser native or a lightweight library like `react-pdf`)

### PDF Download
- When the user clicks **Download**, trigger a direct file download
- File should download with the standardized filename (e.g., `DNA-Leader-Guide-Confession.pdf`)

### PDF Storage
- Store PDFs in Supabase Storage
- Bucket name suggestion: `leader-guides`
- Reference PDFs by public URL
- If a PDF is not yet uploaded for a tool, hide that tool's row or show it as "Coming Soon" (non-clickable)

### Tool List Data
Build the tool list from a config source (Supabase table preferred, or a static array as a fallback) so Travis can add new tools without a deploy. Suggested Supabase table:

```sql
create table dna_leader_guides (
  id uuid default gen_random_uuid() primary key,
  tool_name text not null,
  description text,
  pdf_url text,
  is_published boolean default false,
  sort_order integer,
  created_at timestamp default now()
);
```

Only show tools where `is_published = true`. This lets Travis control what appears without touching code.

### Access Control
This page is visible to DNA Leaders and Church Leaders only. It should not be accessible to disciple-level users. Use existing role-based access patterns already in the dashboard.

---

## Accordion UI Behavior

- All sections collapsed by default except Overview (section 1)
- Smooth expand/collapse animation
- Visual indicator (chevron or +/-) showing open/closed state
- Only one section open at a time, OR allow multiple open simultaneously — your call based on existing dashboard UI patterns

---

## What Is NOT Changing

- The 90-Day Toolkit document itself (separate from this module)
- The DNA Launch Guide
- The DNA Multiplication Manual
- Any other training resources already in the dashboard
- Group management features
- Any other dashboard tabs or sections

Only the DNA Toolkit training module page is being rebuilt.

---

## Questions to Resolve Before Building

1. Is the PDF viewer library already decided, or does this need a new dependency?
2. Is Supabase Storage already configured and accessible from the dashboard, or does that bucket need to be created?
3. What is the current routing path for the DNA Toolkit section in the dashboard? (Needed to know where to drop the new component.)

---

*Contact Travis for content questions or PDF files as they are completed.*
