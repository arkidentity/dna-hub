'use client';

import { List, LayoutList } from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church } from '@/lib/types';
import PhaseCard from './PhaseCard';

interface JourneyTabProps {
  phases: PhaseWithMilestones[];
  church: Church;
  isAdmin: boolean;
  compactView: boolean;
  expandedPhases: Set<string>;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  onToggleCompactView: () => void;
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
  onExportCalendar: (phaseNumber?: number) => void;
}

export default function JourneyTab({
  phases,
  church,
  isAdmin,
  compactView,
  expandedPhases,
  updatingMilestone,
  editingDateId,
  editingNotesId,
  editDateValue,
  editNotesValue,
  uploadingMilestone,
  onToggleCompactView,
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
}: JourneyTabProps) {
  const totalMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress Overview with Per-Phase Bars */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-navy">Your DNA Journey</h2>
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleCompactView}
              className={`p-2 rounded-lg transition-colors ${compactView ? 'bg-gold/10 text-gold' : 'text-foreground-muted hover:bg-background-secondary'}`}
              title={compactView ? 'Expanded view' : 'Compact view'}
            >
              {compactView ? <LayoutList className="w-5 h-5" /> : <List className="w-5 h-5" />}
            </button>
            <span className="text-2xl font-bold text-gold">{overallProgress}%</span>
          </div>
        </div>
        <div className="h-3 bg-background-secondary rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-gold transition-all duration-500"
            style={{ width: `${overallProgress}%` }}
          />
        </div>

        {/* Per-phase mini progress */}
        <div className="flex gap-2">
          {phases.filter(p => p.phase_number > 0).map((phase) => {
            const percent = phase.totalCount > 0
              ? Math.round((phase.completedCount / phase.totalCount) * 100)
              : 0;
            const isCurrent = phase.phase_number === church.current_phase ||
              (church.current_phase === 0 && phase.phase_number === 1);

            return (
              <div key={phase.id} className="flex-1">
                <div className="h-1.5 bg-background-secondary rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all ${
                      percent === 100 ? 'bg-success' : isCurrent ? 'bg-gold' : 'bg-gray-300'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
                <p className={`text-xs mt-1 text-center ${isCurrent ? 'text-gold font-medium' : 'text-foreground-muted'}`}>
                  P{phase.phase_number}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            church={church}
            isExpanded={expandedPhases.has(phase.id)}
            isAdmin={isAdmin}
            compactView={compactView}
            updatingMilestone={updatingMilestone}
            editingDateId={editingDateId}
            editingNotesId={editingNotesId}
            editDateValue={editDateValue}
            editNotesValue={editNotesValue}
            uploadingMilestone={uploadingMilestone}
            onTogglePhase={onTogglePhase}
            onToggleMilestone={onToggleMilestone}
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
            onExportCalendar={onExportCalendar}
          />
        ))}
      </div>
    </div>
  );
}
