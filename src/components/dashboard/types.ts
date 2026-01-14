import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader, FunnelDocument, ScheduledCall, GlobalResource } from '@/lib/types';

export interface DashboardData {
  church: Church;
  leader: ChurchLeader;
  phases: PhaseWithMilestones[];
  documents: FunnelDocument[];
  calls: ScheduledCall[];
  globalResources: GlobalResource[];
  isAdmin: boolean;
}

export interface MilestoneItemProps {
  milestone: MilestoneWithProgress;
  phaseStatus: string;
  isAdmin: boolean;
  compactView: boolean;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  onToggle: (milestone: MilestoneWithProgress, phaseStatus: string) => void;
  onStartEditingDate: (milestoneId: string, currentDate?: string) => void;
  onStartEditingNotes: (milestoneId: string, currentNotes?: string) => void;
  onSaveDate: (milestoneId: string) => void;
  onSaveNotes: (milestoneId: string) => void;
  onCancelEditDate: () => void;
  onCancelEditNotes: () => void;
  onEditDateChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onFileUpload: (milestoneId: string, file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
}

export interface PhaseCardProps {
  phase: PhaseWithMilestones;
  church: Church;
  isExpanded: boolean;
  isAdmin: boolean;
  compactView: boolean;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  onTogglePhase: (phaseId: string) => void;
  onToggleMilestone: (milestone: MilestoneWithProgress, phaseStatus: string) => void;
  onStartEditingDate: (milestoneId: string, currentDate?: string) => void;
  onStartEditingNotes: (milestoneId: string, currentNotes?: string) => void;
  onSaveDate: (milestoneId: string) => void;
  onSaveNotes: (milestoneId: string) => void;
  onCancelEditDate: () => void;
  onCancelEditNotes: () => void;
  onEditDateChange: (value: string) => void;
  onEditNotesChange: (value: string) => void;
  onFileUpload: (milestoneId: string, file: File) => void;
  onDeleteAttachment: (attachmentId: string) => void;
  onExportCalendar: (phaseNumber: number) => void;
}
