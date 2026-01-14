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
  | 'pending_assessment'    // Just submitted assessment
  | 'awaiting_discovery'    // Assessment reviewed, waiting for discovery call
  | 'proposal_sent'         // Discovery done, proposal sent
  | 'awaiting_agreement'    // Proposal reviewed, waiting for agreement call
  | 'awaiting_strategy'     // Agreement done, waiting for strategy call
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
  call_type: 'discovery' | 'proposal' | 'strategy' | 'kickoff' | 'assessment';
  scheduled_at: string;
  completed: boolean;
  notes?: string;
  google_event_id?: string;
  meet_link?: string;
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
  notes?: string;
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
