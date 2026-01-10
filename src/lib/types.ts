// Database types for DNA Church Hub

export type ChurchStatus =
  | 'pending_assessment'
  | 'awaiting_call'
  | 'active'
  | 'completed'
  | 'paused';

export interface Church {
  id: string;
  name: string;
  logo_url?: string;
  status: ChurchStatus;
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
  created_at: string;
  updated_at: string;
}

// Extended types for UI
export interface MilestoneWithProgress extends Milestone {
  progress?: ChurchProgress;
  completed_by_name?: string;
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
