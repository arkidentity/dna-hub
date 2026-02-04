# DNA Hub Data Models

> Complete reference for database tables, relationships, and data types.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│    churches     │──1:N──│  church_leaders  │
│                 │       │                  │
│ Primary entity  │       │ Login identity   │
│ + template ref  │       │                  │
└────────┬────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌──────────────────┐
│ church_progress │──N:1──│ church_milestones│ (Per-church copies)
│                 │       │                  │
│ Completion data │       │ Fully editable   │
│ + admin_notes   │       │ per church       │
└─────────────────┘       └────────┬─────────┘
                                   │ N:1
                                   ▼
                          ┌──────────────────┐
                          │     phases       │ (Template)
                          │                  │
                          │ 6 phases (0-5)   │
                          └──────────────────┘

TEMPLATE MILESTONE SYSTEM (Migration 032)
=========================================

┌─────────────────────┐       ┌──────────────────────┐
│  journey_templates  │──1:N──│  template_milestones │
│                     │       │                      │
│ "Standard DNA       │       │ Master definitions   │
│  Journey" etc.      │       │ (Phase 0 & 1 only)   │
└─────────────────────┘       └──────────────────────┘
         │
         │ 1:N (via churches.journey_template_id)
         ▼
┌─────────────────┐           ┌──────────────────────┐
│    churches     │───1:N────▶│  church_milestones   │
│                 │           │                      │
│ template_id     │           │ Church-specific      │
│ applied_at      │           │ copies (editable)    │
└─────────────────┘           └──────────────────────┘

┌─────────────────────┐   ┌──────────────────┐
│ church_assessments  │   │ magic_link_tokens│
│                     │   │                  │
│ Intake form data    │   │ Auth tokens      │
└─────────────────────┘   └──────────────────┘

┌─────────────────────┐   ┌──────────────────┐
│milestone_attachments│   │ email_subscribers│
│                     │   │                  │
│ Uploaded files      │   │ Newsletter list  │
└─────────────────────┘   └──────────────────┘

┌─────────────────────┐   ┌──────────────────┐
│  notification_log   │   │ global_resources │
│                     │   │                  │
│ Email audit trail   │   │ Template PDFs,   │
└─────────────────────┘   │ videos, guides   │
                          └────────┬─────────┘
                                   │ N:M
                                   ▼
                          ┌──────────────────┐
                          │milestone_resources│
                          │                  │
                          │ Junction table   │
                          └──────────────────┘

UNIFIED AUTHENTICATION SYSTEM (Migrations 025-026)
===================================================

┌─────────────────┐       ┌──────────────────┐
│      users      │──1:N──│   user_roles     │
│                 │       │                  │
│ Unified user    │       │ Role assignments │
│ accounts        │       │ per user         │
└────────┬────────┘       └──────────────────┘
         │
         │ 1:N
         ├─────────────────────────────────────────────────┐
         │                         │                       │
         ▼                         ▼                       ▼
┌──────────────────┐    ┌─────────────────────┐    ┌──────────────────┐
│magic_link_tokens │    │user_training_progress│   │user_content_unlocks│
│                  │    │                     │    │                  │
│ Auth tokens      │    │ Training journey    │    │ Progressive      │
│                  │    │ milestones          │    │ content unlocking│
└──────────────────┘    └─────────────────────┘    └──────────────────┘
                                  │
                                  │ 1:N
                                  ▼
                        ┌─────────────────────┐
                        │user_flow_assessments│
                        │                     │
                        │ Flow Assessment     │
                        │ responses           │
                        └─────────────────────┘

DNA GROUPS SYSTEM (Roadmap 2)
=============================

┌─────────────────┐       ┌──────────────────┐
│   dna_leaders   │──1:N──│    dna_groups    │
│                 │       │                  │
│ Group leaders   │       │ Discipleship     │
│ (may have       │       │ groups (5 phases)│
│  church_id)     │       └────────┬─────────┘
└─────────────────┘                │
                                   │ 1:N (via group_disciples)
                                   ▼
                          ┌──────────────────┐
                          │    disciples     │
                          │                  │
                          │ Group members    │
                          │ (no login)       │
                          └────────┬─────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         │                         │                         │
         ▼                         ▼                         ▼
┌──────────────────┐    ┌──────────────────┐    ┌──────────────────┐
│ life_assessments │    │  leader_notes    │    │ prayer_requests  │
│                  │    │                  │    │                  │
│ Week 1/8 surveys │    │ Private notes    │    │ Prayer tracking  │
│ (token-based)    │    │ (leader only)    │    │ (leader only)    │
└──────────────────┘    └──────────────────┘    └──────────────────┘

┌─────────────────────┐
│leader_health_checkins│
│                     │
│ 6-month leader      │
│ assessments         │
└─────────────────────┘
```

## Core Tables

### churches

Primary entity tracking each church through the implementation process.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Church name |
| `status` | text | Current funnel stage (see enum below) |
| `current_phase` | integer | Active phase (0-5) |
| `phase_1_start` | date | Start date for phase 1 |
| `phase_1_end` | date | End date for phase 1 |
| `phase_2_start` | date | Start date for phase 2 |
| `phase_2_end` | date | End date for phase 2 |
| `phase_3_start` | date | Start date for phase 3 |
| `phase_3_end` | date | End date for phase 3 |
| `phase_4_start` | date | Start date for phase 4 |
| `phase_4_end` | date | End date for phase 4 |
| `phase_5_start` | date | Start date for phase 5 |
| `phase_5_end` | date | End date for phase 5 |
| `journey_template_id` | uuid | FK → journey_templates.id |
| `template_applied_at` | timestamptz | When template milestones were copied |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Status Enum:**
```
pending_assessment   → Initial state
awaiting_discovery   → Assessment submitted, awaiting call
proposal_sent        → Proposal delivered
awaiting_agreement   → Waiting for signed agreement
awaiting_strategy    → Agreement signed, planning strategy
active               → Full dashboard access
completed            → All phases finished
paused               → Implementation on hold
declined             → Church chose not to proceed
```

---

### church_leaders

People associated with each church who can log in.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id |
| `email` | text | Login identifier (unique) |
| `name` | text | Full name |
| `role` | text | Position at church |
| `phone` | text | Contact number |
| `is_primary` | boolean | Primary contact flag |
| `created_at` | timestamptz | Record creation |

**Constraints:**
- `email` is globally unique (one account per email)
- `church_id` + `is_primary=true` should have only one record

---

### phases (Template)

The 5 standard phases every church goes through. Seeded data, rarely modified.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | text | Phase title |
| `description` | text | Phase overview |
| `display_order` | integer | Sort order (0-5) |
| `created_at` | timestamptz | Record creation |

**Standard Phases:**
| Order | Name |
|-------|------|
| 0 | Onboarding |
| 1 | Church Partnership |
| 2 | Leader Preparation |
| 3 | DNA Foundation |
| 4 | Practical Preparation |
| 5 | Final Validation & Launch |

---

### milestones_deprecated (Legacy - DO NOT USE)

> **DEPRECATED**: This table has been replaced by the template milestone system (Migration 032).
> Kept for rollback purposes only. All new code should use `church_milestones`.

---

### journey_templates

Master journey templates that define the milestone structure.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | varchar(255) | Template name (e.g., "Standard DNA Journey") |
| `description` | text | Template description |
| `is_default` | boolean | Is this the default template? |
| `is_active` | boolean | Is template available for use? |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Notes:**
- Currently one template: "Standard DNA Journey"
- Supports multiple templates in future

---

### template_milestones

Master milestone definitions within a journey template. Only Phase 0 and 1 are populated.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `template_id` | uuid | FK → journey_templates.id |
| `phase_id` | uuid | FK → phases.id |
| `title` | varchar(255) | Milestone title |
| `description` | text | What to accomplish |
| `resource_url` | text | Link to PDF/video/guide |
| `resource_type` | varchar(50) | 'pdf', 'video', 'link', 'guide' |
| `display_order` | integer | Sort within phase |
| `is_key_milestone` | boolean | Triggers notification |
| `created_at` | timestamptz | Record creation |

**Pre-populated Milestones:**

**Phase 0: Onboarding**
- Discovery Call Notes
- Proposal Call Notes
- Agreement Call Notes
- Kick-off Notes (key milestone)

**Phase 1: Church Partnership**
- Vision Alignment Meeting
- Identify Church DNA Champion
- Leaders Complete Flow Assessment (key milestone)
- Review Pastor's Guide to Flow Assessment
- Flow Assessment Debrief Meetings (key milestone)

**Phases 2-5:** Empty - admin adds custom milestones per church

---

### church_milestones

Church-specific milestone copies. Fully editable per church.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id |
| `phase_id` | uuid | FK → phases.id |
| `title` | varchar(255) | Milestone title |
| `description` | text | What to accomplish |
| `resource_url` | text | Link to PDF/video/guide |
| `resource_type` | varchar(50) | 'pdf', 'video', 'link', 'guide' |
| `display_order` | integer | Sort within phase |
| `is_key_milestone` | boolean | Triggers notification |
| `source_template_id` | uuid | FK → journey_templates.id (for tracking) |
| `source_milestone_id` | uuid | FK → template_milestones.id (for tracking) |
| `is_custom` | boolean | TRUE if manually added by admin |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Notes:**
- Each church gets their own COPY of milestones
- Editing a milestone only affects that church
- `is_custom = TRUE` for manually added milestones
- `is_custom = FALSE` for milestones copied from template
- `source_template_id` tracks which template was used

**Constraints:**
- Unique on (`church_id`, `phase_id`, `display_order`)

---

### church_progress

Per-church completion status for each milestone.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id |
| `milestone_id` | uuid | FK → church_milestones.id |
| `completed` | boolean | Is it done? |
| `completed_at` | timestamptz | When completed |
| `completed_by` | text | Who marked it complete |
| `target_date` | date | Admin-set deadline |
| `admin_notes` | text | **Private** admin comments (not visible to church leaders) |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Constraints:**
- Unique on (`church_id`, `milestone_id`)

**Note:** The `admin_notes` field is private and only visible to admins in the admin dashboard. Church leaders do not see these notes.

---

### church_assessments

Intake form submissions from potential churches.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id (nullable) |
| **Section 1: Contact** | | |
| `contact_name` | text | Submitter name |
| `contact_email` | text | Submitter email |
| `contact_phone` | text | Submitter phone |
| `contact_role` | text | Position at church |
| **Section 2: Church Info** | | |
| `church_name` | text | Church name |
| `church_city` | text | City |
| `church_state` | text | State |
| `church_size` | text | Attendance range |
| `church_denomination` | text | Affiliation |
| **Section 3: Readiness** | | |
| `is_decision_maker` | text | 'yes', 'no', 'partial' |
| `pastor_commitment` | text | 1-5 scale |
| `leadership_buyin` | text | 1-5 scale |
| `current_discipleship` | text | Existing programs |
| `biggest_challenge` | text | Main obstacle |
| `why_dna` | text | Interest reason |
| `has_read_manual` | boolean | Read DNA Manual? |
| `leaders_identified` | boolean | Have potential leaders? |
| **Section 4: Timeline** | | |
| `desired_start` | text | When to begin |
| `call_availability` | text | Scheduling notes |
| **Meta** | | |
| `readiness_score` | integer | Calculated 0-15 |
| `readiness_level` | text | 'ready', 'building', 'exploring' |
| `submitted_at` | timestamptz | Submission time |
| `call_scheduled` | boolean | Discovery call set? |
| `call_date` | timestamptz | Scheduled call time |
| `created_at` | timestamptz | Record creation |

---

### magic_link_tokens

Authentication tokens for passwordless login (unified auth system).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | User email (links to users.email) |
| `token` | text | Secure random string (32 bytes hex) |
| `expires_at` | timestamptz | 24 hours from creation |
| `used` | boolean | Single-use flag |
| `created_at` | timestamptz | Record creation |

**Note:** Previously linked to `church_leaders.id`, now uses email to work with the unified `users` table.

---

### milestone_attachments

Files uploaded to milestones by admins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_progress_id` | uuid | FK → church_progress.id |
| `file_name` | text | Original filename |
| `file_url` | text | Storage URL |
| `file_size` | integer | Bytes |
| `file_type` | text | MIME type |
| `uploaded_by` | text | Admin email |
| `created_at` | timestamptz | Upload time |

---

### email_subscribers

Landing page email capture list.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | Subscriber email |
| `manual_sent` | boolean | DNA Manual delivered? |
| `manual_sent_at` | timestamptz | Delivery time |
| `assessment_started` | boolean | Started assessment? |
| `created_at` | timestamptz | Subscription time |

---

### notification_log

Audit trail of system-sent emails.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id |
| `type` | text | 'milestone_complete', 'phase_complete' |
| `milestone_id` | uuid | FK → milestones.id (nullable) |
| `phase_id` | uuid | FK → phases.id (nullable) |
| `sent_at` | timestamptz | Email sent time |
| `created_at` | timestamptz | Record creation |

---

### global_resources

Template resources (PDFs, videos, guides) available to all churches. These are linked to milestones via the `milestone_resources` junction table.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `name` | varchar(255) | Resource title |
| `description` | text | What the resource is for |
| `file_url` | text | URL to file (Supabase Storage or external) |
| `resource_type` | varchar(50) | 'pdf', 'video', 'link', 'guide', 'worksheet' |
| `category` | varchar(100) | Grouping: 'welcome_package', 'phase_1', 'training', etc. |
| `display_order` | integer | Sort order within category |
| `is_active` | boolean | Whether resource is available |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Example Resources:**
- Leader Identification Worksheet (welcome_package)
- Pastor's Guide to Flow Assessment (phase_1)
- Vision Casting Guide (phase_2)
- DNA Launch Guide (phase_4)

---

### milestone_resources

Junction table linking global resources to **template milestones**. Resources are linked at the template level, and church dashboards access them via `church_milestones.source_milestone_id`.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `milestone_id` | uuid | FK → template_milestones.id |
| `resource_id` | uuid | FK → global_resources.id |
| `display_order` | integer | Sort order for resources on this milestone |
| `created_at` | timestamptz | Record creation |

**Constraints:**
- Unique on (`milestone_id`, `resource_id`)

**How Resources Are Accessed:**
1. `milestone_resources` links to `template_milestones` (master definitions)
2. Each church has copies in `church_milestones` with `source_milestone_id` pointing back to the template
3. Dashboard API joins via `source_milestone_id` to get resources for each church milestone

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_church_progress_church ON church_progress(church_id);
CREATE INDEX idx_church_progress_milestone ON church_progress(milestone_id);
CREATE INDEX idx_church_leaders_church ON church_leaders(church_id);
CREATE INDEX idx_magic_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_tokens_expires ON magic_link_tokens(expires_at);

-- Template milestone system indexes
CREATE INDEX idx_template_milestones_template ON template_milestones(template_id);
CREATE INDEX idx_template_milestones_phase ON template_milestones(phase_id);
CREATE INDEX idx_church_milestones_church ON church_milestones(church_id);
CREATE INDEX idx_church_milestones_phase ON church_milestones(phase_id);
CREATE INDEX idx_church_milestones_church_phase ON church_milestones(church_id, phase_id);

-- Global resources indexes
CREATE INDEX idx_global_resources_category ON global_resources(category);
CREATE INDEX idx_global_resources_active ON global_resources(is_active);
CREATE INDEX idx_milestone_resources_milestone ON milestone_resources(milestone_id);
CREATE INDEX idx_milestone_resources_resource ON milestone_resources(resource_id);
```

## Row-Level Security

Enabled on:
- `churches`
- `church_leaders`
- `church_progress`
- `church_assessments`

Policies restrict access based on authenticated user's church_id.

## Common Queries

### Get dashboard data
```sql
SELECT
  c.*,
  json_agg(DISTINCT p.*) as phases,
  json_agg(DISTINCT m.*) as milestones,
  json_agg(DISTINCT cp.*) as progress
FROM churches c
LEFT JOIN phases p ON true
LEFT JOIN milestones m ON m.phase_id = p.id
LEFT JOIN church_progress cp ON cp.church_id = c.id AND cp.milestone_id = m.id
WHERE c.id = $1
GROUP BY c.id;
```

### Check milestone completion for phase
```sql
SELECT
  COUNT(*) FILTER (WHERE cp.completed = true) as completed,
  COUNT(*) as total
FROM milestones m
LEFT JOIN church_progress cp ON cp.milestone_id = m.id AND cp.church_id = $1
WHERE m.phase_id = $2;
```

### Get churches by status
```sql
SELECT * FROM churches
WHERE status = $1
ORDER BY updated_at DESC;
```

---

## DNA Groups Tables (Roadmap 2)

> Migration file: `database/019_dna-groups.sql`

### dna_leaders

DNA group leaders - separate from church_leaders. Can be affiliated with a church or independent.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | Login identifier (unique) |
| `name` | text | Full name |
| `phone` | text | Contact number |
| `church_id` | uuid | FK → churches.id (nullable - NULL = independent) |
| `invited_by` | uuid | Who invited them |
| `invited_by_type` | text | 'church_admin' or 'super_admin' |
| `invited_at` | timestamptz | Invitation time |
| `activated_at` | timestamptz | When they completed signup |
| `signup_token` | text | Token for signup link |
| `signup_token_expires_at` | timestamptz | Token expiry |
| `is_active` | boolean | Active status |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

---

### dna_groups

Discipleship groups led by DNA leaders.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_name` | text | Group name |
| `leader_id` | uuid | FK → dna_leaders.id |
| `co_leader_id` | uuid | FK → dna_leaders.id (optional) |
| `church_id` | uuid | FK → churches.id (nullable) |
| `current_phase` | text | See phases below |
| `start_date` | date | Group start date |
| `multiplication_target_date` | date | When to multiply |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Phase Enum:**
```
pre-launch     → Planning/inviting stage
invitation     → Week 0-1: Group forming
foundation     → Week 1-4: Building foundation
growth         → Week 5-8: Group maturing
multiplication → Week 8+: Preparing to multiply
```

---

### disciples

Group participants. No login - they use token-based links for assessments.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | Email (unique) |
| `name` | text | Full name |
| `phone` | text | Contact number |
| `promoted_to_leader_id` | uuid | FK → dna_leaders.id (if promoted) |
| `promoted_at` | timestamptz | Promotion time |
| `created_at` | timestamptz | Record creation |

---

### group_disciples

Join table linking disciples to groups.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `joined_date` | date | When joined |
| `current_status` | text | 'active', 'completed', 'dropped' |
| `is_active` | boolean | Active in group |
| `created_at` | timestamptz | Record creation |

**Constraints:** Unique on (`group_id`, `disciple_id`)

---

### life_assessments

Week 1 and Week 8 assessments for disciples. Token-based access (no login required).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `disciple_id` | uuid | FK → disciples.id |
| `group_id` | uuid | FK → dna_groups.id |
| `assessment_week` | integer | 1 or 8 |
| `token` | text | Unique access token |
| `responses` | jsonb | All answers |
| `started_at` | timestamptz | When started |
| `completed_at` | timestamptz | When completed |
| `ip_address` | text | For tracking |
| `user_agent` | text | Browser info |
| `created_at` | timestamptz | Record creation |

---

### leader_notes

Private notes from leaders about disciples. NOT visible to church admins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `leader_id` | uuid | FK → dna_leaders.id |
| `note_text` | text | Note content |
| `created_at` | timestamptz | Record creation |

---

### prayer_requests

Prayer tracking per disciple. NOT visible to church admins.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `request_text` | text | Prayer request |
| `answered` | boolean | Is it answered? |
| `answered_at` | timestamptz | When answered |
| `answer_note` | text | How it was answered |
| `created_at` | timestamptz | Record creation |

---

### leader_health_checkins

6-month health assessments for DNA leaders. Church admins see summary (status + flags), not full responses.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `leader_id` | uuid | FK → dna_leaders.id |
| `church_id` | uuid | FK → churches.id (nullable) |
| `responses` | jsonb | Full assessment answers |
| `overall_score` | integer | Calculated score |
| `status` | text | 'healthy', 'caution', 'needs_attention' |
| `flag_areas` | jsonb | Areas of concern |
| `due_date` | date | When due |
| `reminder_sent_at` | timestamptz | When reminder sent |
| `completed_at` | timestamptz | When completed |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

---

## DNA Groups Indexes

```sql
CREATE INDEX idx_dna_leaders_email ON dna_leaders(email);
CREATE INDEX idx_dna_leaders_church_id ON dna_leaders(church_id);
CREATE INDEX idx_dna_groups_leader_id ON dna_groups(leader_id);
CREATE INDEX idx_dna_groups_church_id ON dna_groups(church_id);
CREATE INDEX idx_disciples_email ON disciples(email);
CREATE INDEX idx_group_disciples_group_id ON group_disciples(group_id);
CREATE INDEX idx_group_disciples_disciple_id ON group_disciples(disciple_id);
CREATE INDEX idx_life_assessments_token ON life_assessments(token);
CREATE INDEX idx_life_assessments_disciple_id ON life_assessments(disciple_id);
CREATE INDEX idx_leader_notes_group_id ON leader_notes(group_id);
CREATE INDEX idx_prayer_requests_group_id ON prayer_requests(group_id);
CREATE INDEX idx_leader_health_checkins_leader_id ON leader_health_checkins(leader_id);
```

---

## Unified Authentication Tables (Migrations 025-026)

> Migration files: `database/025_unified-auth.sql`, `database/026_training-auth-unification.sql`

The unified auth system replaces separate authentication for church leaders, DNA leaders, and training participants with a single user account per email.

### users

Central user accounts - one per email address across all roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `email` | text | Email (unique) |
| `name` | text | Full name |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

---

### user_roles

Role assignments linking users to their permissions. A user can have multiple roles.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `role` | text | Role type (see enum below) |
| `church_id` | uuid | FK → churches.id (for church-scoped roles) |
| `created_at` | timestamptz | Record creation |

**Role Enum:**
```
church_leader         → Church implementation dashboard access
dna_leader            → DNA Groups dashboard access
training_participant  → DNA Training platform access
admin                 → Full system access
```

**Constraints:**
- Unique on (`user_id`, `role`, `church_id`)
- `church_id` is optional - NULL for training_participant and admin roles

---

### user_training_progress

Training journey progress for training participants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id (unique) |
| `current_stage` | text | Current training stage |
| `milestones` | jsonb | Completed milestone data |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

**Stage Values:**
```
onboarding     → Initial stage after signup
flow_assessment → Flow Assessment phase
dna_manual     → DNA Manual content
launch_guide   → Launch Guide content
toolkit        → 90-Day Toolkit
completed      → All training complete
```

---

### user_content_unlocks

Progressive content unlocking for training participants.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `content_type` | text | Content item type |
| `unlocked` | boolean | Is content accessible? |
| `unlocked_at` | timestamptz | When unlocked |
| `unlock_trigger` | text | What triggered unlock |
| `created_at` | timestamptz | Record creation |

**Content Types:**
```
flow_assessment   → Flow Assessment (unlocked at signup)
dna_manual        → DNA Manual (6 sessions)
launch_guide      → Launch Guide (5 phases)
toolkit_90day     → 90-Day Toolkit
```

**Constraints:** Unique on (`user_id`, `content_type`)

---

### user_flow_assessments

Flow Assessment responses and results.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `user_id` | uuid | FK → users.id |
| `status` | text | 'in_progress' or 'completed' |
| `current_step` | integer | Current question step |
| `roadblock_ratings` | jsonb | Ratings for each roadblock |
| `reflections` | jsonb | Reflection answers |
| `top_roadblocks` | text[] | Top 3 selected roadblocks |
| `action_plan` | text | User's action plan |
| `accountability_partner` | text | Accountability partner name |
| `accountability_date` | date | Check-in date |
| `started_at` | timestamptz | When started |
| `completed_at` | timestamptz | When completed |
| `previous_assessment_id` | uuid | FK → self (for re-assessments) |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

---

## Unified Auth Indexes

```sql
CREATE UNIQUE INDEX idx_users_email ON users(email);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_church_id ON user_roles(church_id);
CREATE UNIQUE INDEX idx_user_training_progress_user_id ON user_training_progress(user_id);
CREATE INDEX idx_user_content_unlocks_user_id ON user_content_unlocks(user_id);
CREATE INDEX idx_user_flow_assessments_user_id ON user_flow_assessments(user_id);
```

---

## Unified Auth Helper Functions

### initialize_training_user(UUID)

Creates initial training data for a new training participant:
- Creates `user_training_progress` record with 'onboarding' stage
- Creates `user_content_unlocks` record unlocking Flow Assessment

```sql
SELECT initialize_training_user('user-uuid-here');
```

---

## Daily DNA Integration Tables (Migration 034 - Planned)

> See `/docs/planning/DAILY-DNA-DATABASE-MIGRATION.md` for full migration plan.

The Daily DNA mobile app will share the DNA Hub Supabase database for real-time sync between disciples and leaders.

### disciple_app_accounts

Disciple login accounts for the Daily DNA mobile app. **Separate from leader auth** (which uses `users` table).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `disciple_id` | uuid | FK → disciples.id |
| `auth_user_id` | uuid | FK → auth.users.id (Supabase Auth) |
| `created_at` | timestamptz | Record creation |
| `last_login_at` | timestamptz | Last app login |

**Why separate auth?** Leaders use magic links for frictionless multi-device access. Disciples need persistent mobile login (email/password or OAuth) for daily engagement tracking.

---

### disciple_journal_entries

3D Journal entries from the Daily DNA app (Head/Heart/Hands).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `disciple_id` | uuid | FK → disciples.id |
| `local_id` | text | Client-side UUID for offline sync |
| `head_text` | text | "What did I learn?" |
| `heart_text` | text | "What did I feel?" |
| `hands_text` | text | "What will I do?" |
| `is_favorite` | boolean | Marked as favorite |
| `tags` | jsonb | User-defined tags |
| `created_at` | timestamptz | Entry creation (client time) |
| `synced_at` | timestamptz | When synced to server |
| `updated_at` | timestamptz | Last modification |

**Constraints:** Unique on (`disciple_id`, `local_id`) for deduplication

---

### disciple_prayer_cards

4D Prayer cards from the Daily DNA app (Revere/Reflect/Request/Rest).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `disciple_id` | uuid | FK → disciples.id |
| `local_id` | text | Client-side UUID for offline sync |
| `title` | text | Prayer card title |
| `revere` | text | Praise/worship |
| `reflect` | text | Confession |
| `request` | text | Prayer requests |
| `rest` | text | Thanksgiving/peace |
| `status` | text | 'active', 'answered', 'archived' |
| `answered_at` | timestamptz | When marked answered |
| `testimony` | text | How prayer was answered |
| `prayer_count` | integer | Times prayed |
| `created_at` | timestamptz | Entry creation |
| `synced_at` | timestamptz | When synced to server |
| `updated_at` | timestamptz | Last modification |

---

### disciple_progress

Engagement tracking - streaks, badges, stats.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `disciple_id` | uuid | FK → disciples.id (unique) |
| `current_streak` | integer | Consecutive days |
| `longest_streak` | integer | All-time best |
| `last_activity_date` | date | For streak calculation |
| `total_journal_entries` | integer | All-time count |
| `total_prayer_cards` | integer | All-time count |
| `badges` | jsonb | Earned badges |
| `current_challenge_id` | uuid | Active challenge |
| `created_at` | timestamptz | Record creation |
| `updated_at` | timestamptz | Last modification |

---

### tool_assignments

Leader assigns tools/content to disciples.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `tool_type` | text | Type of tool (see enum) |
| `tool_reference` | text | Video ID, document URL, etc. |
| `title` | text | Display title |
| `description` | text | Instructions/notes |
| `assigned_by` | uuid | FK → dna_leaders.id |
| `due_date` | date | Optional deadline |
| `created_at` | timestamptz | Record creation |

**Tool Types:**
```
video            → Teaching video
document         → PDF/reading
reflection       → Written reflection prompt
practice         → Practical exercise
scripture        → Scripture memorization
```

---

### tool_completions

Tracks tool completion by disciples (syncs from Daily DNA app).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `assignment_id` | uuid | FK → tool_assignments.id |
| `disciple_id` | uuid | FK → disciples.id |
| `completed_at` | timestamptz | When completed |
| `notes` | text | Optional reflection |
| `synced_from_app` | boolean | TRUE if from Daily DNA app |
| `created_at` | timestamptz | Record creation |

**Constraints:** Unique on (`assignment_id`, `disciple_id`)

---

### journey_checkpoints

Phase checkpoints requiring leader approval.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `checkpoint_type` | text | Type of checkpoint |
| `phase` | integer | Which phase (0-3) |
| `approved_by` | uuid | FK → dna_leaders.id |
| `approved_at` | timestamptz | When approved |
| `notes` | text | Leader notes |
| `created_at` | timestamptz | Record creation |

**Checkpoint Types:**
```
week1_assessment     → Life Assessment Week 1 complete
foundation_complete  → Phase 1 Foundation checkpoint
week8_assessment     → Life Assessment Week 8 complete
multiplication_ready → Ready for Phase 3
```

---

### discipleship_log

Unified notes + prayer requests from leaders (replaces separate tables).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `group_id` | uuid | FK → dna_groups.id |
| `disciple_id` | uuid | FK → disciples.id |
| `leader_id` | uuid | FK → dna_leaders.id |
| `entry_type` | text | 'note' or 'prayer' |
| `content` | text | Note or prayer text |
| `prayer_status` | text | 'active', 'answered', 'archived' |
| `prayer_answered_at` | timestamptz | When answered |
| `prayer_answer_note` | text | How answered |
| `created_at` | timestamptz | Record creation |

---

## Daily DNA Sync Strategy

**Real-time (Supabase Subscriptions):**
- Tool completions → Leader sees immediately
- Checkpoint completions → Updates disciple phase
- Assessment submissions → Triggers notifications

**Batch (Daily Cron Jobs):**
- Streak calculations → Runs at midnight
- Engagement analytics → Dashboard aggregates
- Health metrics → Leader dashboard stats

**Two-Way Sync Pattern:**
```javascript
// From Daily DNA app (journalSync.ts pattern)
1. Push local changes with local_id
2. Server uses UPSERT on (disciple_id, local_id)
3. Pull server changes since lastSyncTimestamp
4. Merge into local storage, dedupe by local_id
```
