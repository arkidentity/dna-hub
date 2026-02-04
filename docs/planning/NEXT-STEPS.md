# DNA Hub - Next Steps

**Last Updated:** February 3, 2026

---

## Quick Summary

| Priority | Count | Key Items |
|----------|-------|-----------|
| **High** | 3 | Assessment PDF, Disciple profile design, Life Assessment form |
| **Medium** | ~15 | Global Resources, DNA Manual, Leader notes/prayers, RLS policies |
| **Low** | ~20 | Integrations, polish, admin views, 90-day toolkit |

---

## 🔴 High Priority

### 1. Assessment to PDF for Milestone Attachment

**Status:** Not Started

Church assessments need to be attachable to the "Church Assessment" milestone in the DNA Journey.

**Requirements:**
- Generate PDF from church assessment data
- Add "Attach Assessment" button on the Church Assessment milestone
- Store PDF in milestone attachments

**Files involved:**
- `/src/app/api/assessment/route.ts` - Existing assessment data
- `/src/app/api/admin/church/[id]/milestones/route.ts` - Milestone attachments
- New: PDF generation endpoint

---

### 2. DNA Groups - Complete Implementation

**Status:** Planning Complete | Ready for Implementation

A comprehensive plan for DNA Groups has been created including:
- Disciple profile pages with journey tracking
- Leader notes and prayer requests
- Tool assignments (trigger tools in Daily DNA)
- Engagement analytics from Daily DNA
- Multiplication tracking and family tree

**Open Questions to Resolve:**
- [ ] Disciple onboarding flow (auto-create Daily DNA account?)
- [ ] Phase advancement (auto vs manual approval?)
- [ ] Engagement sync frequency (real-time vs daily batch?)
- [ ] Multiplication flow (archive original group immediately?)

**See:** `/docs/planning/DNA-GROUPS-COMPLETE-PLAN.md` for full implementation plan

---

### 3. Daily DNA App Integration

**Status:** Waiting (~1 week until Daily DNA ready)

Integration between DNA Hub and Daily DNA app for:
- Triggering tool unlocks (Life Assessment, Spiritual Gifts, etc.)
- Syncing completion events and PDFs back to DNA Hub
- Engagement analytics (without exposing private content)

**Daily DNA App Location:** `/Users/docgrfx/Documents/GitHub/dna-app/daily-dna/`

**Tools to Build in Daily DNA:**
- Life Assessment
- Spiritual Gifts Test
- Testimony Builder
- 90-Day Toolkit (disciple version)

---

## 🟠 Medium Priority

### Church Implementation (Roadmap 1)

| Item | Status | Notes |
|------|--------|-------|
| Global Resources System | DB Ready | Need API endpoints + Admin UI |
| Onboarding Questionnaire | Not Started | Post-commitment form for implementation details |
| Google Calendar Sync | Monitoring | Improve keyword matching when issues arise |

**Global Resources Next Steps:**
1. Create `GET/POST /api/admin/resources` endpoint
2. Build admin UI for resource management
3. Add resource linking in milestone editing
4. Display resources in church dashboard milestones

---

### DNA Groups Dashboard (Roadmap 2)

**See:** `DNA-GROUPS-COMPLETE-PLAN.md` for full implementation plan including Daily DNA integration.

| Phase | Item | Status |
|-------|------|--------|
| **Phase A** | Discipleship Log (notes + prayers) | Not Started |
| **Phase A** | Disciple Profile Page | Not Started |
| **Phase A** | Group Phase Advancement | Not Started |
| **Phase A** | Co-Leader System | Not Started |
| **Phase B** | Disciple Journey View | Not Started |
| **Phase B** | Phase Checkpoints | Not Started |
| **Phase C** | Tool Assignment System | Not Started |
| **Phase C** | Daily DNA Integration | Not Started |
| **Phase C** | Life Assessment (in Daily DNA) | Not Started |
| **Phase D** | Engagement Analytics | Not Started |
| **Phase D** | Multiplication Wizard | Not Started |
| **Phase D** | Multiplication Tree | Not Started |

---

### DNA Training Platform (Roadmap 3)

| Phase | Item | Status | Blocked By |
|-------|------|--------|------------|
| **Phase 2** | DNA Manual content extraction | Not Started | Need content files |
| **Phase 2** | `/training/manual` pages | Not Started | Content |
| **Phase 2** | Session components | Not Started | Content |
| **Phase 2** | Sequential unlocking | Not Started | Pages |
| **Phase 3** | Launch Guide content extraction | Not Started | Need content files |
| **Phase 3** | `/training/launch-guide` pages | Not Started | Content |
| **Phase 3** | Checklist completion tracking | Not Started | Pages |

**Content Needed From You:**
- [ ] Updated DNA Manual PDF (or confirm Ark app `dna-course-data.js` is current)
- [ ] Confirm `/resources/DNA Launch Guide.md` is current
- [ ] Confirm `/resources/THE 90-DAY TOOLKIT_*.md` are current

---

## 🟡 Low Priority

### DNA Groups - Later Phases

| Item | Status |
|------|--------|
| Read-only group detail for church admins | Not Started |
| Advanced stats and filtering | Not Started |
| Leader health check-in system (6-month) | Not Started |
| Mobile responsive testing | Not Started |

### DNA Training - Later Phases

| Item | Status |
|------|--------|
| 90-Day Toolkit pages | Not Started |
| Dashboard enhancement components | Not Started |
| "Create Group" button integration | Not Started |
| Admin training analytics dashboard | Not Started |
| Export training analytics CSV | Not Started |

### P3 - Future Integrations

| Item | Status |
|------|--------|
| Role-Based Access Control (RBAC) | Not Started |
| Calendar Integration (Calendly/Cal.com) | Not Started |
| E-Signature Integration (DocuSign/PandaDoc) | Not Started |
| Payment Processing (Stripe) | Not Started |
| CRM Integration (HubSpot/Pipedrive) | Not Started |
| Mobile Optimization | Not Started |
| Accessibility Improvements (ARIA, keyboard nav) | Not Started |

### Other Future Features

| Item | Status |
|------|--------|
| Email automation (ConvertKit/Resend sequences) | Not Started |
| Landing page with email capture for DNA Manual | Not Started |
| AI-powered 3 Steps recommendations | Not Started |

---

## ✅ Completed (Recent)

### Template-Based Milestone System (Migration 032)
- Each church gets their own COPY of milestones (fully editable)
- New tables: `journey_templates`, `template_milestones`, `church_milestones`
- Apply Template button for new churches

### Unified Authentication System (Migrations 025 & 026)
- Single login for all user types
- Role-based access (church_leader, dna_leader, training_participant, admin)
- UserMenu dropdown for dashboard switching

### DNA Groups - Phase 1 (Mostly Complete)
- Database schema and types
- DNA Leader invitation system
- Group creation and management
- Disciple management (add to groups)
- Church integration (DNA Groups tab)
- Admin DNA Leaders section

### DNA Training - Phase 1 (Complete)
- Flow Assessment with 7 roadblocks
- Draft saving and results page
- Unified auth integration

### Improvement Plan (P0-P2 Complete)
- Scoring consistency, audit logging, bulk operations
- Funnel analytics, follow-up automation, document versioning

---

## Cleanup Tasks (When Ready)

### Delete Old Auth Code
- Delete `/src/lib/training-auth.ts`
- Remove deprecated auth routes

### Drop Old Database Tables
```sql
DROP TABLE IF EXISTS dna_leader_journeys CASCADE;
DROP TABLE IF EXISTS dna_content_unlocks CASCADE;
DROP TABLE IF EXISTS dna_flow_assessments CASCADE;
DROP TABLE IF EXISTS training_magic_links CASCADE;
DROP TABLE IF EXISTS milestones_deprecated CASCADE;
```

---

## Roadmap Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 1: Church Implementation Dashboard                      │
│ Status: Production ✅                                           │
│ Active: Assessment PDF, Global Resources, Journey Templates     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 2: DNA Groups Dashboard                                 │
│ Status: Phase 1 Complete ✅ | Phase 2-5 Not Started             │
│ Next: Disciple profile design → Life Assessment tool            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│ ROADMAP 3: DNA Training Platform                                │
│ Status: Flow Assessment Complete ✅ | Phase 2-7 Not Started     │
│ Next: DNA Manual content → Launch Guide → 90-Day Toolkit        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Related Documentation

| Document | Purpose |
|----------|---------|
| `DNA-GROUPS-COMPLETE-PLAN.md` | **NEW** - Complete DNA Groups implementation plan with Daily DNA integration |
| `DNA-GROUPS-PLAN.md` | Original DNA Groups plan (Phase 1 details) |
| `DNA-TRAINING-IMPLEMENTATION-PLAN.md` | Training platform roadmap (Phases 1-7) |
| `IMPROVEMENT_PLAN.md` | Detailed P0-P3 improvement tasks |
| `FUTURE-FEATURES.md` | Onboarding questionnaire and backlog ideas |
| `archive/` | Completed implementation docs |
