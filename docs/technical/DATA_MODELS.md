# DNA Hub Data Models

> Complete reference for database tables, relationships, and data types.

## Entity Relationship Diagram

```
┌─────────────────┐       ┌──────────────────┐
│    churches     │──1:N──│  church_leaders  │
│                 │       │                  │
│ Primary entity  │       │ Login identity   │
└────────┬────────┘       └──────────────────┘
         │
         │ 1:N
         ▼
┌─────────────────┐       ┌──────────────────┐
│ church_progress │──N:1──│   milestones     │ (Template + Custom)
│                 │       │                  │
│ Completion data │       │ Curriculum items │
│ + admin_notes   │       │ + church_id opt. │
└─────────────────┘       └────────┬─────────┘
                                   │ N:1
                                   ▼
                          ┌──────────────────┐
                          │     phases       │ (Template)
                          │                  │
                          │ 6 phases (0-5)   │
                          └──────────────────┘

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

### milestones (Template + Custom)

Individual tasks within each phase. Can be template milestones (shared across all churches) or custom milestones (specific to one church).

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `phase_id` | uuid | FK → phases.id |
| `church_id` | uuid | FK → churches.id (nullable - NULL = template, value = custom) |
| `title` | text | Milestone title |
| `description` | text | What to accomplish |
| `resource_url` | text | Link to PDF/video/guide |
| `resource_type` | text | 'pdf', 'video', 'link', 'guide', 'worksheet' |
| `display_order` | integer | Sort within phase |
| `is_key_milestone` | boolean | Triggers notification |
| `created_at` | timestamptz | Record creation |

**Notes:**
- ~35 template milestones across all phases
- `church_id = NULL` means template milestone (shown to all churches)
- `church_id = [uuid]` means custom milestone for that specific church only

---

### church_progress

Per-church completion status for each milestone.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `church_id` | uuid | FK → churches.id |
| `milestone_id` | uuid | FK → milestones.id |
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

Authentication tokens for passwordless login.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `leader_id` | uuid | FK → church_leaders.id |
| `token` | text | Secure random string |
| `expires_at` | timestamptz | 7 days from creation |
| `used` | boolean | Single-use flag |
| `created_at` | timestamptz | Record creation |

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
- Pastor's Guide to Dam Assessment (phase_1)
- Vision Casting Guide (phase_2)
- DNA Launch Guide (phase_4)

---

### milestone_resources

Junction table linking global resources to specific milestones. When a milestone has linked resources, they appear for all churches on that milestone.

| Column | Type | Description |
|--------|------|-------------|
| `id` | uuid | Primary key |
| `milestone_id` | uuid | FK → milestones.id |
| `resource_id` | uuid | FK → global_resources.id |
| `display_order` | integer | Sort order for resources on this milestone |
| `created_at` | timestamptz | Record creation |

**Constraints:**
- Unique on (`milestone_id`, `resource_id`)

---

## Indexes

```sql
-- Performance indexes
CREATE INDEX idx_church_progress_church ON church_progress(church_id);
CREATE INDEX idx_church_progress_milestone ON church_progress(milestone_id);
CREATE INDEX idx_milestones_phase ON milestones(phase_id);
CREATE INDEX idx_milestones_church_id ON milestones(church_id);
CREATE INDEX idx_church_leaders_church ON church_leaders(church_id);
CREATE INDEX idx_magic_tokens_token ON magic_link_tokens(token);
CREATE INDEX idx_magic_tokens_expires ON magic_link_tokens(expires_at);

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
