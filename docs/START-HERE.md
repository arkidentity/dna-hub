# START HERE — DNA Hub + Daily DNA

**Current Status:** Spiritual Gifts Assessment + PDF built ✅ | Next: Cloud Sync, Calendar, Assessments Tab, Week 8→12 fix
**Last Updated:** February 8, 2026

---

## For Your Next Session

### **Copy/Paste This:**

```
Hi! Continuing DNA ecosystem work.

Read: /docs/planning/NEXT-STEPS.md (full roadmap with weekly priorities)

What was just completed:
- Spiritual Gifts Assessment BUILT in Daily DNA app (core + PDF complete)
  - 96 questions, 3 tiers, scoring, results with synopses
  - 2-page PDF download (client-side via @react-pdf/renderer)
  - In-app route: /tools/spiritual-gifts (Week 11 checkpoint)
  - Public route: /gifts (requires account, no anonymous access)
  - Files: types/spiritualGifts.ts, lib/spiritualGiftsData.ts, lib/spiritualGiftsStorage.ts, lib/spiritualGiftsSynopses.ts, lib/spiritualGiftsPdf.tsx, components/gifts/SpiritualGiftsAssessment.tsx

What to work on next (pick based on time):
- Quick win: Week 8 → Week 12 fix across Hub (~15 min)
- Spiritual Gifts remaining: cloud sync to Supabase, /gifts auth gate, pastor landing page (lead gen)
- Bigger builds: Groups Calendar, Assessments Tab, Global Resources Admin

Key context:
- Daily DNA app is MVP-complete and live at dailydna.app
- DNA Hub is live at dnadiscipleship.com
- Both share same Supabase database
- Groups & Chat Phase 1 is live
- Training (Flow Assessment + Manual + Launch Guide) is complete
```

---

## Quick Reference

| Document | Purpose |
|----------|---------|
| `/docs/planning/NEXT-STEPS.md` | **Active roadmap** — Read this first |
| `/docs/planning/DNA-GROUPS-COMPLETE-PLAN.md` | Groups implementation plan + recent decisions |
| `/docs/planning/Gifts/` | Spiritual Gifts Assessment planning (questions, synopses, impl plan) |
| `/dna-planning/README.md` | Cross-project overview and architecture decisions |
| `/dna-planning/INTEGRATION-PLAN.md` | Hub ↔ Daily DNA communication |
| `/.claude/CLAUDE.md` | AI/Claude project guide |

---

## What's Done ✅

### DNA Hub
- ✅ Church Implementation Dashboard (5-phase, ~35 milestones)
- ✅ Unified auth system (magic links, role-based)
- ✅ DNA Groups Phase A (~85% — groups, disciples, discipleship log, co-leaders, phase advancement)
- ✅ DNA Training (Flow Assessment + DNA Manual 6 sessions + Launch Guide 4 phases)
- ✅ Hub API endpoints for Daily DNA (disciple metrics, log, dashboard)
- ✅ Admin dashboard, template milestones

### Daily DNA App
- ✅ 3D Journal, 4D Prayer, Creed Cards, Challenge System
- ✅ DNA Pathway (12-week journey), Life Assessment (42 questions)
- ✅ Testimony Builder (STORY framework), Q&A, Listening Prayer
- ✅ Groups & Chat Phase 1 (real-time, shared content cards)
- ✅ Google + Discord OAuth, account syncing to Hub
- ✅ **Spiritual Gifts Assessment** (96 questions, 3 tiers, scoring, results with synopses, 2-page PDF download, public + in-app routes)

---

## What to Build Next 🔨

### **This Week: Spiritual Gifts Enhancements + Quick Wins**
1. ~~Core assessment UI~~ ✅ Built
2. ~~PDF generation for results~~ ✅ Built (2-page PDF via @react-pdf/renderer, client-side)
3. ~~Week 8 → Week 12 bug fix across Hub~~ ✅ Fixed (code only — DB migration still needed)
4. Cloud sync to Supabase (`spiritual_gifts_assessments` table)
5. `/gifts` public route → requires account creation (no anonymous test-taking)
6. Pastor landing page for lead gen (separate from `/gifts`, offers team assessment access)
7. Passage of the Day content expansion (265+ more passages)

### **Next Week:**
- Assessment to PDF for church milestones
- Disciple Profile — Assessments tab (Life Assessment scores + Spiritual Gifts results)
- Global Resources Admin UI (CRUD for church implementation resources)
- Groups Calendar (Supabase events, Resend reminders, .ics links)

### **Week 3:**
- Pathway locking (locked unless in DNA group)
- Cloud sync for Testimony Builder + Life Assessment
- Training ↔ Groups bridge

---

## Key Decisions (Feb 8, 2026)

- **Calendar:** Supabase source of truth. No Google Calendar API. Resend + .ics.
- **Pathway:** Locked unless in group. Unlock by phase/month. Creed Cards + Gifts + Testimony always available.
- **Notifications:** Email + in-app badges. No PWA push.
- **Training:** Should bridge to Groups dashboard. 90-Day Toolkit belongs in Groups.
- **Spiritual Gifts:** Same test, two contexts — in-app for disciples (Week 11), public at /gifts (requires account). No anonymous email capture. Lead gen is a separate pastor landing page on Hub that offers team assessment access.
- **Spiritual Gifts PDF:** 2-page compact PDF (overview + primary gift details). Client-side generation via @react-pdf/renderer. No server cost. ~100KB per file.
- **Fireflies:** Deprioritized.

---

## Design System

**Colors:** DNA Hub light theme
- Cream: `#FFFBF5`
- Navy: `#1A2332`
- Gold: `#D4A853`
- Teal: `#2D6A6A`

**Groups:** Dark mode theme
- Deep dark: `#0f1419`
- Card: `#1a1f2e`
- Gold accent: `#D4A853`

**Daily DNA App:** Dark navy theme
- Background: `#143348`
- Gold accent: `#e8b562`

---

**Ready to build? Start with NEXT-STEPS.md!**
