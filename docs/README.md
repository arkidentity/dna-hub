# DNA Hub Documentation

## Quick Start

| Audience | Start Here |
|----------|-----------|
| **Developers** | [technical/ARCHITECTURE.md](./technical/ARCHITECTURE.md) |
| **Finding Files** | [technical/CODEBASE_MAP.md](./technical/CODEBASE_MAP.md) |
| **Writing Code** | [technical/CONVENTIONS.md](./technical/CONVENTIONS.md) |
| **Database** | [technical/DATA_MODELS.md](./technical/DATA_MODELS.md) |
| **AI Assistants** | [/.claude/CLAUDE.md](../.claude/CLAUDE.md) (auto-loaded) |

---

## Documentation Structure

```
/docs/
├── technical/           # Developer documentation
│   ├── ARCHITECTURE.md      # System design & tech stack
│   ├── CODEBASE_MAP.md      # File locations & routes
│   ├── CONVENTIONS.md       # Coding standards
│   ├── DATA_MODELS.md       # Database schema
│   └── CHANGELOG.md         # Version history
│
├── integrations/        # Third-party service integrations
│   ├── FIREFLIES.md         # Meeting transcription (Fireflies.ai)
│   └── GOOGLE_CALENDAR.md   # Calendar sync
│
├── business/            # Business strategy & processes
│   ├── DNA-IMPLEMENTATION-ROADMAP.md  # 5-phase implementation guide
│   ├── DNA-ONBOARDING-PLAN.md         # New church setup
│   ├── FUNNEL-STRATEGY.md             # Marketing/sales funnel
│   └── LANDING-PAGE-STRATEGY.md       # Website conversion
│
├── planning/            # Future work & roadmaps
│   ├── DNA-GROUPS-PLAN.md       # DNA Groups Dashboard (Roadmap 2)
│   ├── FUTURE-FEATURES.md       # Feature backlog
│   └── IMPROVEMENT_PLAN.md      # Bug fixes & enhancements
│
└── resources/           # Static files & worksheets
    ├── DNA-Readiness-Quiz.pdf
    └── Leader-Identification-Worksheet.pdf
```

---

## Technical Documentation

For developers and AI assistants working on the codebase.

| Document | Purpose | Read When |
|----------|---------|-----------|
| [ARCHITECTURE.md](./technical/ARCHITECTURE.md) | System design, tech stack, data flows | Understanding the big picture |
| [CODEBASE_MAP.md](./technical/CODEBASE_MAP.md) | File locations, routes, APIs | Finding where things are |
| [CONVENTIONS.md](./technical/CONVENTIONS.md) | Coding patterns, styling, best practices | Writing new code |
| [DATA_MODELS.md](./technical/DATA_MODELS.md) | Database tables, relationships | Working with data |
| [CHANGELOG.md](./technical/CHANGELOG.md) | Recent changes and updates | Understanding what changed |

---

## Integrations

Third-party service documentation.

| Integration | Status | Document |
|-------------|--------|----------|
| **Fireflies.ai** | Backend Complete, Church UI Pending | [FIREFLIES.md](./integrations/FIREFLIES.md) |
| **Google Calendar** | Phase 1 Complete | [GOOGLE_CALENDAR.md](./integrations/GOOGLE_CALENDAR.md) |

---

## Business Documentation

Strategy and process documentation for humans.

| Document | Purpose |
|----------|---------|
| [DNA-IMPLEMENTATION-ROADMAP.md](./business/DNA-IMPLEMENTATION-ROADMAP.md) | 5-phase implementation guide for churches |
| [DNA-ONBOARDING-PLAN.md](./business/DNA-ONBOARDING-PLAN.md) | New church setup process |
| [FUNNEL-STRATEGY.md](./business/FUNNEL-STRATEGY.md) | Marketing/sales funnel design |
| [LANDING-PAGE-STRATEGY.md](./business/LANDING-PAGE-STRATEGY.md) | Website conversion strategy |

---

## Planning & Roadmaps

Future work and feature planning.

| Document | Purpose |
|----------|---------|
| [DNA-GROUPS-PLAN.md](./planning/DNA-GROUPS-PLAN.md) | DNA Groups Dashboard implementation plan |
| [FUTURE-FEATURES.md](./planning/FUTURE-FEATURES.md) | Feature backlog and ideas |
| [IMPROVEMENT_PLAN.md](./planning/IMPROVEMENT_PLAN.md) | Bug fixes and enhancements roadmap |

---

## Resources

Static files and worksheets in [resources/](./resources/).

- DNA Readiness Quiz (PDF)
- Leader Identification Worksheet (PDF)

---

## Documentation Updates

When making significant changes to the codebase:

| Change Type | Update |
|-------------|--------|
| New feature | `technical/CODEBASE_MAP.md` |
| New pattern | `technical/CONVENTIONS.md` |
| Schema change | `technical/DATA_MODELS.md` |
| Architecture change | `technical/ARCHITECTURE.md` |
| Quick reference | `/.claude/CLAUDE.md` |
| Any significant change | `technical/CHANGELOG.md` |

---

## Quick Links

- **Source Code:** `/src/`
- **Database Migrations:** `/database/` (see [README](/database/README.md))
- **Configuration:** `/package.json`, `/tsconfig.json`
- **Claude Config:** `/.claude/CLAUDE.md`

---

*Last updated: January 2026*
