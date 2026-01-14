# DNA Hub Documentation

## For AI Assistants (Claude)

Start here for quick context:

| Document | Purpose | Read When |
|----------|---------|-----------|
| **[ARCHITECTURE.md](./ARCHITECTURE.md)** | System design, tech stack, data flows | Understanding the big picture |
| **[CODEBASE_MAP.md](./CODEBASE_MAP.md)** | File locations, routes, APIs | Finding where things are |
| **[CONVENTIONS.md](./CONVENTIONS.md)** | Coding patterns, styling, best practices | Writing new code |
| **[DATA_MODELS.md](./DATA_MODELS.md)** | Database tables, relationships | Working with data |
| **[CHANGELOG.md](./CHANGELOG.md)** | Recent changes and updates | Understanding what changed |
| **[IMPROVEMENT_PLAN.md](./IMPROVEMENT_PLAN.md)** | Roadmap for fixes and enhancements | Planning improvements |

> Also see `/.claude/CLAUDE.md` for quick reference (auto-loaded).

## For Humans

### Business Documentation

| Document | Purpose |
|----------|---------|
| [DNA Church Implementation Roadmap.md](./DNA%20Church%20Implementation%20Roadmap.md) | Phase-by-phase implementation guide |
| [DNA Church Onboarding Plan.md](./DNA%20Church%20Onboarding%20Plan.md) | New church setup process |
| [DNA Funnel Strategy - Discipleship Pathway.md](./DNA%20Funnel%20Strategy%20-%20Discipleship%20Pathway.md) | Marketing/sales funnel design |
| [Landing Page Strategy for Discipleship.md](./Landing%20Page%20Strategy%20for%20Discipleship.md) | Website conversion strategy |
| [Future Features.md](./Future%20Features.md) | Planned enhancements |

### Resources

| Folder | Contents |
|--------|----------|
| [resources/](./resources/) | DNA Readiness Quiz PDF, Leader Identification Worksheet |
| [BLVD/](./BLVD/) | BLVD church partnership agreement and implementation docs |

## Quick Links

- **Source Code:** `/src/`
- **Database Schemas:** `/supabase-*.sql`
- **Configuration:** `/package.json`, `/tsconfig.json`

## Documentation Updates

When making significant changes to the codebase:

1. **New feature?** Update `CODEBASE_MAP.md` with file locations
2. **New pattern?** Add to `CONVENTIONS.md`
3. **Schema change?** Update `DATA_MODELS.md`
4. **Architecture change?** Update `ARCHITECTURE.md`
5. **Quick reference?** Update `/.claude/CLAUDE.md`
6. **Any significant change?** Add entry to `CHANGELOG.md`
