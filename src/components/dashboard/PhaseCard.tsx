'use client';

import {
  ChevronDown,
  ChevronRight,
  Lock,
  Clock,
  Download,
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ScheduledCall } from '@/lib/types';
import { getPhaseDate } from './utils';
import MilestoneItem from './MilestoneItem';

interface PhaseCardProps {
  phase: PhaseWithMilestones;
  church: Church;
  calls: ScheduledCall[];
  isExpanded: boolean;
  isAdmin: boolean;
  compactView: boolean;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  editingChurchNotesId: string | null;
  editChurchNotesValue: string;
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
  onStartEditingChurchNotes: (milestoneId: string, currentNotes?: string) => void;
  onSaveChurchNotes: (milestoneId: string) => void;
  onCancelEditChurchNotes: () => void;
  onEditChurchNotesChange: (value: string) => void;
}

// Helper function to match milestone title to call type
function getMatchingCall(milestoneTitle: string, calls: ScheduledCall[]): ScheduledCall | undefined {
  const title = milestoneTitle.toLowerCase();
  if (title.includes('strategy call') || title.includes('strategy session')) {
    return calls.find(c => c.call_type === 'strategy');
  }
  if (title.includes('discovery call') || title.includes('discovery session')) {
    return calls.find(c => c.call_type === 'discovery');
  }
  if (title.includes('proposal call') || title.includes('proposal session') || title.includes('agreement call') || title.includes('agreement session')) {
    return calls.find(c => c.call_type === 'proposal');
  }
  if (title.includes('kick-off') || title.includes('kickoff')) {
    return calls.find(c => c.call_type === 'kickoff');
  }
  if (title.includes('assessment call')) {
    return calls.find(c => c.call_type === 'assessment');
  }
  if (title.includes('onboarding call') || title.includes('onboarding session')) {
    return calls.find(c => c.call_type === 'onboarding');
  }
  if (title.includes('check-in') || title.includes('checkin') || title.includes('check in')) {
    return calls.find(c => c.call_type === 'checkin');
  }
  return undefined;
}

export default function PhaseCard({
  phase,
  church,
  calls,
  isExpanded,
  isAdmin,
  compactView,
  updatingMilestone,
  editingDateId,
  editingNotesId,
  editDateValue,
  editNotesValue,
  uploadingMilestone,
  editingChurchNotesId,
  editChurchNotesValue,
  onTogglePhase,
  onToggleMilestone,
  onStartEditingDate,
  onStartEditingNotes,
  onSaveDate,
  onSaveNotes,
  onCancelEditDate,
  onCancelEditNotes,
  onEditDateChange,
  onEditNotesChange,
  onFileUpload,
  onDeleteAttachment,
  onExportCalendar,
  onStartEditingChurchNotes,
  onSaveChurchNotes,
  onCancelEditChurchNotes,
  onEditChurchNotesChange,
}: PhaseCardProps) {
  const isAccessible = phase.status === 'current' || phase.status === 'completed';
  const isUpcoming = phase.status === 'upcoming';
  const isLocked = phase.status === 'locked';
  const phaseDate = getPhaseDate(phase, church);

  return (
    <div
      className={`card ${
        phase.status === 'current' ? 'phase-current' :
        phase.status === 'completed' ? 'phase-completed' :
        ''
      } ${isLocked ? 'opacity-50' : ''}`}
    >
      {/* Phase Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => !isLocked && onTogglePhase(phase.id)}
          disabled={isLocked}
          className={`flex-1 flex items-center justify-between ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <div className="flex items-center gap-4">
            {isLocked ? (
              <Lock className="w-5 h-5 text-foreground-muted" />
            ) : isExpanded ? (
              <ChevronDown className="w-5 h-5 text-gold" />
            ) : (
              <ChevronRight className="w-5 h-5 text-gold" />
            )}
            <div className="text-left">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-navy">
                  {phase.phase_number === 0 ? phase.name : `Phase ${phase.phase_number}: ${phase.name}`}
                </h3>
                {phase.status === 'current' && (
                  <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full">
                    Current
                  </span>
                )}
                {isUpcoming && (
                  <span className="text-xs bg-teal text-white px-2 py-0.5 rounded-full">
                    Up Next
                  </span>
                )}
              </div>
              {phaseDate && (
                <p className="text-sm text-foreground-muted flex items-center gap-1 mt-1">
                  <Clock className="w-3 h-3" />
                  {phaseDate}
                </p>
              )}
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-navy">
              {phase.completedCount}/{phase.totalCount}
            </p>
            <p className="text-xs text-foreground-muted">completed</p>
          </div>
        </button>
        {/* Calendar Export Button */}
        {isExpanded && !isLocked && phase.milestones.some(m => m.progress?.target_date) && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onExportCalendar(phase.phase_number);
            }}
            className="ml-4 p-2 text-teal hover:text-teal-light hover:bg-teal/10 rounded-lg transition-colors"
            title="Export to Calendar"
          >
            <Download className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Phase Description */}
      {isExpanded && phase.description && (
        <p className="text-foreground-muted mt-4 pl-9">{phase.description}</p>
      )}

      {/* Milestones */}
      {isExpanded && (
        <div className="mt-6 pl-9 space-y-3">
          {phase.milestones.map(milestone => (
            <div key={milestone.id} id={`milestone-${milestone.id}`}>
            <MilestoneItem
              key={milestone.id}
              milestone={milestone}
              scheduledCall={getMatchingCall(milestone.title, calls)}
              phaseStatus={phase.status}
              isAdmin={isAdmin}
              compactView={compactView}
              updatingMilestone={updatingMilestone}
              editingDateId={editingDateId}
              editingNotesId={editingNotesId}
              editDateValue={editDateValue}
              editNotesValue={editNotesValue}
              uploadingMilestone={uploadingMilestone}
              editingChurchNotesId={editingChurchNotesId}
              editChurchNotesValue={editChurchNotesValue}
              onToggle={onToggleMilestone}
              onStartEditingDate={onStartEditingDate}
              onStartEditingNotes={onStartEditingNotes}
              onSaveDate={onSaveDate}
              onSaveNotes={onSaveNotes}
              onCancelEditDate={onCancelEditDate}
              onCancelEditNotes={onCancelEditNotes}
              onEditDateChange={onEditDateChange}
              onEditNotesChange={onEditNotesChange}
              onFileUpload={onFileUpload}
              onDeleteAttachment={onDeleteAttachment}
              onStartEditingChurchNotes={onStartEditingChurchNotes}
              onSaveChurchNotes={onSaveChurchNotes}
              onCancelEditChurchNotes={onCancelEditChurchNotes}
              onEditChurchNotesChange={onEditChurchNotesChange}
            />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
