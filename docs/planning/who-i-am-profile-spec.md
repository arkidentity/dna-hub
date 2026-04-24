# Who I Am — Profile Page Spec
*DNA Pathway | Collapsible Section Below Pathway Phases*

---

## What This Page Is

"Who I Am" is a disciple's living discipleship portfolio. It is not a settings page and not a progress tracker. It is a cumulative record of who a person is becoming in Christ, built from the tools they complete on the DNA Pathway.

Every item in the profile is populated automatically when a disciple completes the corresponding tool. Nothing requires a separate save step. The profile grows as the disciple grows.

This section lives at the bottom of the Pathway screen, collapsed by default, unlocked only for disciples in an active DNA group. The identical content is visible to the disciple's DNA leader on the group dashboard under that disciple's profile.

---

## Access and Visibility

| Viewer | Access |
|---|---|
| Disciple | Full view of all "Who I Am" content |
| DNA Leader | Full view of all "Who I Am" content via disciple profile on dashboard |
| Church Leader (Pastor) | Does not have access to individual disciple profile details |

**Private tools (never appear in "Who I Am"):**
Journal entries, prayer cards, testimonies

**Everything else on the pathway is visible in "Who I Am" once completed.**

---

## Page Header

**Title:** Who I Am

**Subtitle:** *Your discipleship story, in one place.*

Small secondary line below subtitle (muted text):
*Updated as you complete tools on the pathway. Visible to your DNA leader.*

---

## Section Order and Content

Sections appear in this order on the page. Incomplete sections show a locked/empty state with a prompt pointing them back to the relevant pathway tool.

---

### Section 1: My Way of Life
*Populated by: Way of Life tool (Phase 1, Week 6–8)*

**Display:** Each of the seven categories shown as a collapsible card. The category name is the card header. Tapping it expands to show that category's statements.

**Header row shows:**
- Category name
- Number of statements in that category
- Date last updated

**Full expanded view shows:**
- All statements in that category
- "Last updated" timestamp at the bottom
- Edit button (opens the Way of Life tool to that category)

**Update prompt:** If 90+ days since last update, a soft banner appears at the top of this section:
*"It's been a while. Anything new God has been building in you?"* with a button to open the tool.

**Empty state:** *"You haven't built your Way of Life yet. This is where you name your personal culture with Jesus."* Link to tool on pathway.

---

### Section 2: Life Assessment
*Populated by: Life Assessment (Week 1) and Life Assessment Revisited (Week 12)*

This is the only section that holds two snapshots intentionally. Both are kept and displayed together so growth is visible.

**Display:** Two side-by-side cards or a toggle between Week 1 and Week 12.

**Week 1 card shows:**
- Completion date
- Score summary across the 7 assessment categories
- Option to view full responses

**Week 12 card shows:**
- Completion date
- Score summary across the 7 assessment categories
- Option to view full responses
- Percentage change per category compared to Week 1 (same format as the comparison PDF generated on the dashboard)

**Before Week 12 is complete:** Week 12 card shows an empty state: *"You'll retake the Life Assessment at Week 12. This is where you'll see how far you've come."*

**Before Week 1 is complete:** Full section is empty state: *"Your Life Assessment is the first tool on the pathway. It's where everything starts."*

---

### Section 3: Ministry Gifts
*Populated by: Ministry Gift Test (Phase 1, Month 3)*

**Display:** A summary card showing the disciple's top gift(s) with a short description of each.

**Card shows:**
- Primary gift name and icon
- One-sentence description of that gift
- Secondary gifts listed below (if applicable)
- Completion date
- Button: "View Full Results"

**Full results view:**
- All gift scores ranked
- Description of each gift in the disciple's profile
- What this gift looks like when healthy
- Where this gift can serve in the church

**Empty state:** *"Your Ministry Gifts results will appear here after you complete the Ministry Gift Test on the pathway."*

---

### Section 4: Identity Battle Plan
*Populated by: Identity Shift tool (Phase 1)*

**Display:** The disciple's completed Identity Battle Plan shown as a formatted document card.

**Card shows:**
- Title: My Identity Battle Plan
- Completion date
- Preview of first 2–3 lines
- Button: "View Full Battle Plan"

**Full view:** The complete Battle Plan as formatted text. Read-only unless the tool allows updates.

**Empty state:** *"Your Identity Battle Plan will appear here after you complete the Identity Shift tool."*

---

### Section 5: My Lifeline
*Populated by: Lifeline tool (Phase 1, pre-launch)*

**Display:** A visual timeline card showing the key moments a disciple mapped in their Lifeline.

**Card shows:**
- Title: My Lifeline
- Completion date
- A condensed visual of the timeline (horizontal scroll or vertical stack of key moments)
- Button: "View Full Lifeline"

**Full view:** The complete Lifeline in whatever format it was built (timeline layout).

**Note:** This is read-only. The Lifeline captures a moment in time and is not meant to be updated like the Way of Life.

**Empty state:** *"Your Lifeline is a map of your story before your DNA group began. Complete it on the pathway to see it here."*

---

## Empty State (Full Page — Before Any Tools Completed)

If a disciple has just joined a group and completed nothing yet, the full "Who I Am" section shows:

**Header:** Who I Am

**Body:**
*"This is where your story takes shape. As you move through the pathway, your results, declarations, and milestones will collect here. Come back after your first tool."*

No individual section empty states are shown until the disciple is far enough in the pathway that those tools are relevant.

---

## Interaction Details

**Collapsed state (default):**
A single row at the bottom of the Pathway screen labeled "Who I Am" with a chevron/arrow and a one-line summary like "5 of 5 sections complete" or "2 of 5 sections complete." Tapping expands the full section.

**Expanded state:**
All five sections displayed in order as cards. Each card is tappable to expand details or navigate to the full view.

**Edit access:**
Way of Life is the only section with a direct edit button. All other sections are read-only in "Who I Am." To update Ministry Gifts or Life Assessment, the disciple must retake those tools through the pathway (which requires leader initiation from the dashboard, as it does today).

---

## Leader Dashboard Mirror

Everything in "Who I Am" is visible to the DNA leader on the disciple's profile in the group dashboard. The layout mirrors the in-app view. The leader sees:

- All five sections in the same order
- The same content with the same timestamps
- The comparison view of Life Assessment Week 1 vs. Week 12
- A notification flag when any section is newly completed or updated

**Leader notifications:**
- Way of Life completed (first time)
- Way of Life updated (any subsequent save)
- Life Assessment Week 1 completed
- Life Assessment Week 12 completed
- Ministry Gift Test completed
- Identity Battle Plan completed
- Lifeline completed

---

## Locked State (Not in a DNA Group)

If a disciple is not yet in a group, the entire "Who I Am" section on the Pathway screen shows as locked with a single prompt:

*"Who I Am unlocks when you join a DNA group. These tools are meant to be done with someone walking alongside you."*

CTA button: *"Get Connected"* — links to the existing group connection/signup flow.

---

## Technical Notes for Build

- "Who I Am" data is pulled from existing tool completion records. No new data input is required from the user beyond completing each tool.
- The 90-day Way of Life prompt is triggered client-side based on the last save timestamp.
- Life Assessment comparison data is already generated on the dashboard as a PDF. The in-app view should pull from the same data source, formatted for mobile display rather than PDF export.
- All "Who I Am" content syncs with the leader dashboard in real time on tool completion or update.

---

*Spec version 1.0 — April 2026*
*Companion document: way-of-life-tool-spec.md*
