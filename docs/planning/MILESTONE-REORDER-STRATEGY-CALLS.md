# Handoff Document: Milestone Reordering & Strategy Calls per Phase

## Overview

This document outlines the implementation plan for two remaining features:
- **B. Milestone Reordering** - Allow admins to reorder milestones within phases
- **C. Strategy Calls per Phase** - Track multiple strategy calls linked to specific milestones

---

## B. Milestone Reordering

### Current State
- Milestones have a `display_order` column (integer) in the database
- New custom milestones are appended to the end (`max display_order + 1`)
- No UI exists to change order after creation

### Implementation Plan

#### Option 1: Up/Down Buttons (Recommended - Simpler)

**Files to modify:**

1. **API Endpoint** - `/src/app/api/admin/church/[id]/milestones/route.ts`

   Add a new action to the PATCH handler for reordering:
   ```typescript
   // In PATCH handler, add support for:
   // { milestone_id, action: 'move_up' | 'move_down' }

   // Logic:
   // 1. Get current milestone's display_order and phase_id
   // 2. Find adjacent milestone (above or below) in same phase
   // 3. Swap their display_order values
   // 4. Return success
   ```

2. **UI Component** - `/src/components/admin/AdminChurchJourneyTab.tsx`

   Add up/down arrow buttons next to each milestone:
   ```tsx
   // Import ChevronUp, ChevronDown from lucide-react

   // Add to milestone row (near the delete button):
   <div className="flex flex-col">
     <button onClick={() => handleMoveMilestone(milestone.id, 'up')}
             disabled={isFirstInPhase}>
       <ChevronUp className="w-3 h-3" />
     </button>
     <button onClick={() => handleMoveMilestone(milestone.id, 'down')}
             disabled={isLastInPhase}>
       <ChevronDown className="w-3 h-3" />
     </button>
   </div>

   // Handler:
   const handleMoveMilestone = async (milestoneId: string, direction: 'up' | 'down') => {
     await fetch(`/api/admin/church/${churchId}/milestones`, {
       method: 'PATCH',
       body: JSON.stringify({ milestone_id: milestoneId, action: `move_${direction}` })
     });
     await onRefresh();
   };
   ```

#### Option 2: Drag-and-Drop (Nicer UX, More Complex)

**Dependencies to add:**
```bash
npm install @hello-pangea/dnd
```

**Files to modify:**

1. Same API endpoint changes as Option 1, but also support:
   ```typescript
   // { milestone_id, new_order: number, phase_id: string }
   // Reorder all milestones in phase to accommodate new position
   ```

2. **UI Component** - Wrap milestone list in DragDropContext:
   ```tsx
   import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

   // Wrap phase milestones in Droppable
   // Each milestone becomes Draggable
   // On drag end, call API with new order
   ```

### Database Schema
No changes needed - `display_order` column already exists.

---

## C. Strategy Calls per Phase

### Current State
- Strategy calls sync as `call_type: 'strategy'`
- Calls can be linked to milestones via `milestone_id` column
- Duplicate blocking only applies to discovery, proposal, kickoff (not strategy)
- The call-to-milestone linking UI was just added

### Implementation Plan

#### Step 1: Create Strategy Call Milestone Templates

**Option A: Manual Creation**
Admin manually adds "Strategy Call 1", "Strategy Call 2" etc. as custom milestones to each church's journey using the existing "Add custom milestone" feature.

**Option B: Automated Templates (Recommended)**

Add strategy call milestones to the default phase templates in the database seed:

**Database migration** - Create `/database/0XX_strategy-milestones.sql`:
```sql
-- Add strategy call milestones to each phase template
-- These are template milestones (church_id IS NULL) that all churches inherit

-- Phase 1: Church Partnership
INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT p.id, 'Strategy Call 1', 'First strategy session for Phase 1',
       (SELECT COALESCE(MAX(display_order), 0) + 1 FROM milestones WHERE phase_id = p.id),
       false, NULL
FROM phases p WHERE p.phase_number = 1
ON CONFLICT DO NOTHING;

INSERT INTO milestones (phase_id, title, description, display_order, is_key_milestone, church_id)
SELECT p.id, 'Strategy Call 2', 'Second strategy session for Phase 1',
       (SELECT COALESCE(MAX(display_order), 0) + 2 FROM milestones WHERE phase_id = p.id),
       false, NULL
FROM phases p WHERE p.phase_number = 1
ON CONFLICT DO NOTHING;

-- Repeat for Phases 2-5...
```

#### Step 2: Workflow for Strategy Calls

**When a strategy call syncs:**
1. If church leader is an attendee → auto-assigns to church
2. Call appears in church's "Scheduled Calls" with `call_type: 'strategy'`
3. Call is NOT auto-linked to a milestone (goes to unlinked calls)
4. Admin goes to Journey tab → finds appropriate "Strategy Call X" milestone → links the call

**This is already working!** The infrastructure built today supports this:
- `/api/admin/calls` PATCH endpoint can link calls to milestones
- `AdminChurchJourneyTab` shows "Link a call" button on each milestone
- Unlinked calls appear in the dropdown

#### Step 3: Optional Enhancement - Strategy Call Counter

Add visual indicator showing how many strategy calls are linked vs expected per phase:

**UI Enhancement** in `AdminChurchJourneyTab.tsx`:
```tsx
// In phase header, show strategy call count
const strategyMilestones = phase.milestones.filter(m =>
  m.title.toLowerCase().includes('strategy call')
);
const linkedStrategyCount = strategyMilestones.filter(m =>
  m.linked_calls && m.linked_calls.length > 0
).length;

// Display: "Strategy Calls: 2/3 linked"
```

---

## Summary Checklist

### B. Milestone Reordering
- [ ] Add `move_up`/`move_down` action to `/api/admin/church/[id]/milestones` PATCH
- [ ] Add up/down buttons to `AdminChurchJourneyTab.tsx`
- [ ] Test reordering within phase boundaries
- [ ] (Optional) Implement drag-and-drop with `@hello-pangea/dnd`

### C. Strategy Calls per Phase
- [ ] Create database migration adding strategy call milestones to each phase
- [ ] Run migration in Supabase
- [ ] Update `/database/README.md` with new migration
- [ ] (Optional) Add strategy call counter to phase headers

### Already Complete (from today's work)
- [x] Call-to-milestone linking API (`/api/admin/calls`)
- [x] Link/unlink calls UI in `AdminChurchJourneyTab`
- [x] Strategy calls are NOT duplicate-blocked (multiple allowed)
- [x] Conservative calendar sync (church leader email only)
- [x] Manual assignment UI for unmatched events

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `/src/app/api/admin/church/[id]/milestones/route.ts` | Milestone CRUD + reorder |
| `/src/app/api/admin/calls/route.ts` | Call linking/updating |
| `/src/components/admin/AdminChurchJourneyTab.tsx` | Journey tab UI with milestones |
| `/src/lib/google-calendar.ts` | Calendar sync matching logic |
| `/database/` | SQL migrations |

---

## Related Documentation

- `/docs/technical/ARCHITECTURE.md` - System architecture
- `/docs/technical/DATA_MODELS.md` - Database schema reference
- `/docs/integrations/GOOGLE_CALENDAR.md` - Calendar sync details
