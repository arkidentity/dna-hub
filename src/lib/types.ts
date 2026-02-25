// Database types for DNA Church Hub

// Admin user roles
export type AdminRole = 'super_admin' | 'admin' | 'readonly';

export interface AdminUser {
  id: string;
  email: string;
  name?: string;
  role: AdminRole;
  is_active: boolean;
  created_at: string;
  created_by?: string;
}

export type ChurchStatus =
  | 'prospect'              // Admin building demo, church doesn't know yet
  | 'demo'                  // Demo built, outreach/meeting in progress
  | 'pending_assessment'    // Church expressed interest — sent assessment form link
  | 'awaiting_discovery'    // Assessment submitted, reviewing + booking discovery call
  | 'proposal_sent'         // Discovery done, proposal sent
  | 'awaiting_agreement'    // Proposal reviewed, waiting for agreement
  | 'awaiting_strategy'     // Agreement signed, waiting for strategy call
  | 'active'                // Strategy done, full dashboard access
  | 'completed'             // Finished all phases
  | 'paused'                // On hold
  | 'declined';             // Not a fit

// Funnel document types for pre-dashboard
export interface FunnelDocument {
  id: string;
  church_id: string;
  document_type: 'discovery_notes' | 'proposal_pdf' | 'agreement_notes' | 'agreement_pdf' | '3_steps_pdf' | 'implementation_plan';
  file_url?: string;
  notes?: string;
  current_version?: number;
  uploaded_by?: string;
  created_at: string;
  updated_at: string;
}

// Document version history
export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  file_url: string;
  file_name?: string;
  file_size?: number;
  uploaded_by?: string;
  notes?: string;
  created_at: string;
}

// Document with version history
export interface FunnelDocumentWithVersions extends FunnelDocument {
  versions: DocumentVersion[];
}

// Scheduled calls/appointments
export interface ScheduledCall {
  id: string;
  church_id: string;
  call_type: 'discovery' | 'proposal' | 'strategy' | 'kickoff' | 'assessment' | 'onboarding' | 'checkin';
  scheduled_at: string;
  completed: boolean;
  notes?: string;
  google_event_id?: string;
  meet_link?: string;
  fireflies_meeting_id?: string;
  transcript_url?: string;
  ai_summary?: string;
  action_items?: string[];
  keywords?: string[];
  transcript_processed_at?: string;
  visible_to_church?: boolean;
  milestone_id?: string;
  created_at: string;
}

// Email subscribers (for landing page)
export interface EmailSubscriber {
  id: string;
  email: string;
  first_name: string;
  subscribed_at: string;
  manual_sent: boolean;
  assessment_started: boolean;
}

export interface Church {
  id: string;
  name: string;
  logo_url?: string;
  splash_logo_url?: string | null;
  subdomain?: string | null;
  status: ChurchStatus;
  selected_tier?: string;  // The tier/package selected when signing agreement
  start_date?: string;
  phase_1_start?: string;
  phase_1_target?: string;
  phase_2_start?: string;
  phase_2_target?: string;
  phase_3_start?: string;
  phase_3_target?: string;
  phase_4_start?: string;
  phase_4_target?: string;
  phase_5_start?: string;
  phase_5_target?: string;
  current_phase: number;
  created_at: string;
  updated_at: string;
}

export interface ChurchLeader {
  id: string;
  church_id: string;
  email: string;
  name: string;
  role?: string;
  is_primary_contact: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChurchAssessment {
  id: string;
  church_id?: string;

  // Contact Info
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  church_name: string;
  church_city?: string;
  church_state?: string;
  church_website?: string;

  // Church Context
  congregation_size?: string;
  current_discipleship_approach?: string;
  why_interested?: string;

  // Leadership Readiness
  identified_leaders?: number;
  leaders_completed_dna?: boolean;
  pastor_commitment_level?: string;

  // Implementation Timeline
  desired_launch_timeline?: string;
  potential_barriers?: string;

  // Expectations
  first_year_goals?: string;
  support_needed?: string;

  // Additional
  how_heard_about_us?: string;
  additional_questions?: string;

  // Strategy Call
  call_already_booked: boolean;
  call_scheduled_at?: string;
  call_notes?: string;

  submitted_at: string;
}

export interface Phase {
  id: string;
  phase_number: number;
  name: string;
  description?: string;
  duration_weeks?: number;
  display_order: number;
  created_at: string;
}

export interface Milestone {
  id: string;
  phase_id: string;
  title: string;
  description?: string;
  resource_url?: string;
  resource_type?: 'pdf' | 'video' | 'link' | 'guide';
  display_order: number;
  is_key_milestone: boolean;
  created_at: string;
}

export interface ChurchProgress {
  id: string;
  church_id: string;
  milestone_id: string;
  completed: boolean;
  completed_at?: string;
  completed_by?: string;
  notes?: string; // Admin notes
  church_notes?: string; // Church-written notes (separate from admin notes)
  target_date?: string;
  created_at: string;
  updated_at: string;
}

export interface MilestoneAttachment {
  id: string;
  church_id: string;
  milestone_id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  uploaded_by?: string;
  created_at: string;
}

// Global resource linked to a milestone
export interface MilestoneResource {
  id: string;
  name: string;
  description?: string | null;
  file_url?: string | null;
  resource_type?: string | null;
}

// Church white-label branding settings
export interface ChurchBranding {
  id: string;
  name: string;
  logo_url: string | null;        // Horizontal header logo
  icon_url: string | null;        // Square PWA app icon (512×512 recommended)
  splash_logo_url: string | null; // Splash/loading screen logo
  subdomain: string | null;
  primary_color: string;
  accent_color: string;
  app_title: string;
  app_description: string;
  theme_color: string;
  header_style: 'text' | 'logo';
  reading_plan_id: string | null;
  custom_tab_label: string | null;
  custom_tab_url: string | null;
  custom_tab_mode: 'iframe' | 'browser' | null;
  custom_link_1_title: string | null;
  custom_link_1_url: string | null;
  custom_link_1_mode: 'iframe' | 'browser' | null;
  custom_link_2_title: string | null;
  custom_link_2_url: string | null;
  custom_link_2_mode: 'iframe' | 'browser' | null;
  custom_link_3_title: string | null;
  custom_link_3_url: string | null;
  custom_link_3_mode: 'iframe' | 'browser' | null;
  custom_link_4_title: string | null;
  custom_link_4_url: string | null;
  custom_link_4_mode: 'iframe' | 'browser' | null;
  custom_link_5_title: string | null;
  custom_link_5_url: string | null;
  custom_link_5_mode: 'iframe' | 'browser' | null;
}

// Global resource (general resources for all churches)
export interface GlobalResource {
  id: string;
  name: string;
  description?: string | null;
  file_url?: string | null;
  resource_type?: string | null;
  category?: string | null;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

// DNA Calendar Event
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string | null;
  location?: string | null;
  start_time: string;
  end_time?: string | null;
  event_type: 'group_meeting' | 'cohort_event' | 'church_event';
  group_id?: string | null;
  cohort_id?: string | null;
  church_id?: string | null;
  is_recurring: boolean;
  recurrence_pattern?: RecurrencePattern | null;
  parent_event_id?: string | null;
  created_by?: string | null;
  created_at: string;
  updated_at: string;
}

export interface RecurrencePattern {
  frequency: 'weekly' | 'biweekly' | 'monthly';
  interval: number;
  day_of_week?: number;
  end_date: string;
}

// DNA Cohort
export interface Cohort {
  id: string;
  church_id: string;
  name: string;
  generation?: number | null;
  status: 'active' | 'archived';
  started_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Extended types for UI
export interface MilestoneWithProgress extends Milestone {
  progress?: ChurchProgress;
  completed_by_name?: string;
  attachments?: MilestoneAttachment[];
  resources?: MilestoneResource[];
}

export interface PhaseWithMilestones extends Phase {
  milestones: MilestoneWithProgress[];
  status: 'locked' | 'current' | 'completed' | 'upcoming';
  completedCount: number;
  totalCount: number;
}

export interface ChurchDashboardData {
  church: Church;
  leader: ChurchLeader;
  phases: PhaseWithMilestones[];
  isAdmin: boolean;
}

// Assessment form data
export interface AssessmentFormData {
  // Contact Info
  contact_name: string;
  contact_email: string;
  contact_phone: string;
  church_name: string;
  church_city: string;
  church_state: string;
  church_website: string;

  // Church Context
  congregation_size: string;
  current_discipleship_approach: string;
  why_interested: string;

  // Leadership Readiness
  identified_leaders: string;
  leaders_completed_dna: string;
  pastor_commitment_level: string;

  // Implementation Timeline
  desired_launch_timeline: string;
  potential_barriers: string;

  // Expectations
  first_year_goals: string;
  support_needed: string;

  // Additional
  how_heard_about_us: string;
  additional_questions: string;
}

// ============================================================================
// Fireflies.ai Integration Types (Phase 2)
// ============================================================================

// Transcript sentence with speaker and timing
export interface TranscriptSentence {
  text: string;
  speaker_id: string;
  speaker_name?: string;
  start_time: number; // seconds from start
  end_time?: number;
}

// Key moment identified by AI
export interface KeyMoment {
  title: string;
  description?: string;
  start_time: number;
  end_time?: number;
  importance?: 'high' | 'medium' | 'low';
}

// Full meeting transcript data
export interface MeetingTranscript {
  id: string;
  scheduled_call_id?: string;
  fireflies_meeting_id: string;

  // Meeting metadata
  title: string;
  duration?: number; // in seconds
  meeting_date?: string;
  participants?: string[];

  // Transcript data
  full_transcript?: string;
  sentences?: TranscriptSentence[];

  // AI-generated content
  ai_summary?: string;
  action_items?: string[];
  keywords?: string[];
  key_moments?: KeyMoment[];

  // URLs and files
  transcript_url?: string;
  audio_url?: string;
  video_url?: string;

  // Timestamps
  processed_at?: string;
  created_at: string;
  updated_at: string;
}

// Fireflies webhook payload
export interface FirefliesWebhookPayload {
  meetingId: string;
  eventType: 'transcription_completed' | 'audio_uploaded';
  clientReferenceId?: string;
  timestamp?: string;
}

// Fireflies webhook log entry
export interface FirefliesWebhookLog {
  id: string;
  fireflies_meeting_id?: string;
  event_type?: string;
  client_reference_id?: string;
  payload: Record<string, unknown>;
  processed: boolean;
  matched_church_id?: string;
  matched_call_id?: string;
  error_message?: string;
  received_at: string;
  processed_at?: string;
}

// Fireflies API settings
export interface FirefliesSettings {
  id: string;
  api_key: string;
  webhook_secret?: string;
  admin_email: string;
  auto_process_enabled: boolean;
  auto_match_enabled: boolean;
  auto_share_with_churches: boolean;
  connected_at: string;
  last_webhook_received_at?: string;
  created_at: string;
  updated_at: string;
}

// Unmatched Fireflies meeting
export interface UnmatchedFirefliesMeeting {
  id: string;
  fireflies_meeting_id: string;
  title: string;
  meeting_date?: string;
  participants?: string[];
  duration?: number;
  ai_summary?: string;
  transcript_url?: string;
  match_attempted: boolean;
  match_attempt_count: number;
  last_match_attempt?: string;
  matched_church_id?: string;
  matched_call_id?: string;
  matched_at?: string;
  matched_by?: string;
  created_at: string;
  updated_at: string;
}

// Fireflies GraphQL API response types
export interface FirefliesTranscriptResponse {
  data: {
    transcript: {
      id: string;
      title: string;
      date: string;
      duration: number;
      participants: Array<{
        name: string;
        email?: string;
      }>;
      transcript_url: string;
      audio_url?: string;
      video_url?: string;
      sentences: Array<{
        text: string;
        speaker_id: string;
        speaker_name?: string;
        start_time: number;
        end_time?: number;
      }>;
      summary?: {
        overview?: string;
        action_items?: string[];
        keywords?: string[];
        key_moments?: Array<{
          title: string;
          description?: string;
          start_time: number;
        }>;
      };
    };
  };
}

// ============================================================================
// DNA Groups System Types (Roadmap 2)
// ============================================================================

// DNA Leader - leads discipleship groups
export interface DNALeader {
  id: string;
  email: string;
  name: string;
  phone?: string;
  church_id?: string; // null = independent
  invited_by?: string;
  invited_by_type?: 'church_admin' | 'super_admin';
  invited_at: string;
  activated_at?: string;
  signup_token?: string;
  signup_token_expires_at?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// DNA Group phases
export type DNAGroupPhase =
  | 'pre-launch'      // Planning/inviting stage
  | 'invitation'      // Week 0-1: Invitations sent, group forming
  | 'foundation'      // Week 1-4: Building foundation
  | 'growth'          // Week 5-12: Group maturing
  | 'multiplication'; // Week 12+: Preparing to multiply

// DNA Group - a discipleship group
export interface DNAGroup {
  id: string;
  group_name: string;
  leader_id: string;
  co_leader_id?: string;
  church_id?: string; // null = independent
  current_phase: DNAGroupPhase;
  start_date: string;
  multiplication_target_date?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Disciple - group participant (no login)
export interface Disciple {
  id: string;
  email: string;
  name: string;
  phone?: string;
  promoted_to_leader_id?: string;
  promoted_at?: string;
  created_at: string;
}

// Disciple membership status in a group
export type DiscipleStatus = 'active' | 'completed' | 'dropped';

// Group-Disciple relationship
export interface GroupDisciple {
  id: string;
  group_id: string;
  disciple_id: string;
  joined_date: string;
  current_status: DiscipleStatus;
  created_at: string;
}

// Life Assessment (Week 1 and Week 12)
export interface LifeAssessment {
  id: string;
  disciple_id: string;
  group_id: string;
  assessment_week: 1 | 12;
  token: string;
  token_expires_at?: string;
  responses: Record<string, unknown>; // JSONB - flexible structure
  sent_at?: string;
  started_at?: string;
  completed_at?: string;
  last_reminder_sent_at?: string;
  reminder_count: number;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

// Leader Note - private notes on disciples
export interface LeaderNote {
  id: string;
  group_id: string;
  disciple_id: string;
  leader_id: string;
  note_text: string;
  created_at: string;
}

// Prayer Request
export interface PrayerRequest {
  id: string;
  group_id: string;
  disciple_id: string;
  request_text: string;
  answered: boolean;
  answered_at?: string;
  answer_note?: string;
  created_at: string;
}

// Leader Health Check-in status
export type HealthCheckinStatus = 'healthy' | 'caution' | 'needs_attention';

// Flag area with level
export interface HealthFlagArea {
  area: string; // e.g., 'burnout', 'isolation', 'community'
  level: 'green' | 'yellow' | 'red';
}

// Leader Health Check-in (6-month assessment)
export interface LeaderHealthCheckin {
  id: string;
  leader_id: string;
  church_id?: string; // snapshot at time of checkin
  responses: Record<string, unknown>; // JSONB - full responses (leader only)
  overall_score?: number; // e.g., 3.75 out of 5
  status: HealthCheckinStatus;
  flag_areas: HealthFlagArea[];
  due_date: string;
  reminder_sent_at?: string;
  reminder_count: number;
  sent_at?: string;
  started_at?: string;
  completed_at?: string;
  token?: string;
  token_expires_at?: string;
  created_at: string;
}

// ============================================================================
// DNA Groups Extended Types (for UI)
// ============================================================================

// Disciple with their group membership info
export interface DiscipleWithMembership extends Disciple {
  membership: GroupDisciple;
  assessments?: LifeAssessment[];
}

// DNA Group with related data
export interface DNAGroupWithDetails extends DNAGroup {
  leader?: DNALeader;
  co_leader?: DNALeader;
  church?: Church;
  disciples?: DiscipleWithMembership[];
  disciple_count?: number;
}

// DNA Leader with their groups
export interface DNALeaderWithGroups extends DNALeader {
  church?: Church;
  groups?: DNAGroup[];
  group_count?: number;
}

// Health checkin summary (for church admin view - no full responses)
export interface HealthCheckinSummary {
  id: string;
  leader_id: string;
  leader_name: string;
  overall_score?: number;
  status: HealthCheckinStatus;
  flag_areas: HealthFlagArea[];
  due_date: string;
  completed_at?: string;
}

// Life Assessment comparison (Week 1 vs Week 12)
export interface AssessmentComparison {
  disciple: Disciple;
  group: DNAGroup;
  week1: LifeAssessment;
  week12: LifeAssessment;
  category_scores: {
    category: string;
    week1_score: number;
    week12_score: number;
    change: number;
    change_level: 'growth' | 'slight_growth' | 'no_change' | 'decline';
  }[];
  overall_change: number;
  strengths: string[];
  focus_areas: string[];
}

// ============================================================================
// DNA Groups Phase A Types (Discipleship Log, Journey, Profile)
// ============================================================================

// Discipleship Log entry types
export type DiscipleshipLogEntryType = 'note' | 'prayer' | 'milestone';

// Discipleship Log Entry (unified timeline for notes + prayers + milestones)
export interface DiscipleshipLogEntry {
  id: string;
  group_id: string;
  disciple_id: string;
  created_by_leader_id?: string;
  created_by_name?: string;
  entry_type: DiscipleshipLogEntryType;
  content: string;
  is_answered?: boolean;
  answered_at?: string;
  answer_notes?: string;
  is_private: boolean;
  created_at: string;
  updated_at: string;
}

// Journey Checkpoint (phase-based progress tracking for disciples)
export interface JourneyCheckpoint {
  id: string;
  group_id: string;
  disciple_id: string;
  phase: number;
  checkpoint_key: string;
  completed: boolean;
  completed_at?: string;
  completed_by_leader_id?: string;
  completed_by_name?: string;
  notes?: string;
  created_at: string;
}

// App engagement stats (stats only - no journal/prayer content)
export interface AppActivityProgress {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string | null;
  total_journal_entries: number;
  total_prayer_sessions: number;
  total_prayer_cards: number;
  total_time_minutes: number;
  badges: string[];
}

export interface AppActivityToolkit {
  current_month: number;
  current_week: number;
  started_at: string | null;
  month_1_completed_at: string | null;
  month_2_completed_at: string | null;
  month_3_completed_at: string | null;
}

export interface AppFilteredMetrics {
  days: number | 'all';
  journal_entries: number;
  prayer_sessions: number;
  prayer_cards: number;
}

export interface AppTestimonySummary {
  id: string;
  title: string;
  status: 'draft' | 'complete';
  testimony_type: string | null;
  created_at: string;
}

export interface AppCreedProgress {
  cards_mastered: number[];
  total_cards_mastered: number;
  total_study_sessions: number;
  last_studied_at: string | null;
}

export interface LifeAssessmentResult {
  assessment_type: 'week_1' | 'week_12';
  category_scores: Record<string, number> | null;
  overall_score: number | null;
  responses: Record<string, unknown>;
  follow_ups: Record<string, string> | null;
  submitted_at: string | null;
}

export interface AppActivity {
  connected: boolean;
  progress: AppActivityProgress | null;
  filtered_metrics?: AppFilteredMetrics;
  toolkit: AppActivityToolkit | null;
  checkpoint_completions: Array<{
    checkpoint_id: number;
    completed_at: string;
    marked_by: string;
  }>;
  testimonies?: AppTestimonySummary[];
  creed_progress?: AppCreedProgress | null;
  life_assessments?: {
    week1: LifeAssessmentResult | null;
    week12: LifeAssessmentResult | null;
  } | null;
}

// Disciple Profile (extended with journey data for profile page)
export interface DiscipleProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  joined_date: string;
  current_status: DiscipleStatus;
  week1_assessment_status: string;
  week12_assessment_status: string;
  group: {
    id: string;
    group_name: string;
    current_phase: DNAGroupPhase;
  };
  log_entries: DiscipleshipLogEntry[];
  checkpoints: JourneyCheckpoint[];
  app_activity?: AppActivity | null;
}

// ============================================================================
// Journey Template System Types (Migration 032)
// ============================================================================

// Journey Template - master template definition
export interface JourneyTemplate {
  id: string;
  name: string;
  description?: string;
  is_default: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Template Milestone - master milestone definition within a template
export interface TemplateMilestone {
  id: string;
  template_id: string;
  phase_id: string;
  title: string;
  description?: string;
  resource_url?: string;
  resource_type?: 'pdf' | 'video' | 'link' | 'guide';
  display_order: number;
  is_key_milestone: boolean;
  created_at: string;
}

// Church Milestone - church-specific copy of a milestone (fully editable)
export interface ChurchMilestone {
  id: string;
  church_id: string;
  phase_id: string;
  title: string;
  description?: string;
  resource_url?: string;
  resource_type?: 'pdf' | 'video' | 'link' | 'guide';
  display_order: number;
  is_key_milestone: boolean;
  source_template_id?: string;
  source_milestone_id?: string;
  is_custom: boolean;
  created_at: string;
  updated_at: string;
}

// Church Milestone with progress and attachments (for UI)
export interface ChurchMilestoneWithProgress extends ChurchMilestone {
  progress?: ChurchProgress;
  completed_by_name?: string;
  attachments?: MilestoneAttachment[];
  resources?: MilestoneResource[];
  linked_calls?: ScheduledCall[];
}

// Phase with church-specific milestones
export interface PhaseWithChurchMilestones extends Phase {
  milestones: ChurchMilestoneWithProgress[];
  status: 'locked' | 'current' | 'completed' | 'upcoming';
  completedCount: number;
  totalCount: number;
}
