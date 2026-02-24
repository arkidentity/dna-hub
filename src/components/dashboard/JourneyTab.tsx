'use client';

import { useEffect, useRef } from 'react';
import { Calendar, CheckCircle, Clock, Video, Phone } from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ScheduledCall } from '@/lib/types';
import PhaseCard from './PhaseCard';
import { formatCallDate } from './utils';

// Helper component for displaying a scheduled call
function CallCard({ call, label }: { call?: ScheduledCall; label: string }) {
  const isUpcoming = call && !call.completed && new Date(call.scheduled_at) > new Date();

  return (
    <div className={`p-3 rounded-lg ${
      call
        ? call.completed
          ? 'bg-success/5 border border-success/20'
          : 'bg-teal/5 border border-teal/20'
        : 'bg-background-secondary border border-card-border'
    }`}>
      <p className="text-xs font-medium uppercase tracking-wide text-foreground-muted mb-1">
        {label}
      </p>
      {call ? (
        <>
          <div className="flex items-center gap-1.5">
            {call.completed ? (
              <CheckCircle className="w-4 h-4 text-success" />
            ) : (
              <Clock className="w-4 h-4 text-teal" />
            )}
            <span className={`text-sm font-medium ${call.completed ? 'text-success' : 'text-navy'}`}>
              {call.completed ? 'Completed' : 'Scheduled'}
            </span>
          </div>
          <p className="text-xs text-foreground-muted mt-1">
            {formatCallDate(call.scheduled_at)}
          </p>
          {/* Show Meet link for upcoming calls */}
          {isUpcoming && call.meet_link && (
            <a
              href={call.meet_link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-teal text-white text-xs font-medium rounded hover:bg-teal/90 transition-colors"
            >
              <Video className="w-3.5 h-3.5" />
              Join Google Meet
            </a>
          )}
        </>
      ) : (
        <p className="text-sm text-foreground-muted">Not scheduled</p>
      )}
    </div>
  );
}

interface JourneyTabProps {
  phases: PhaseWithMilestones[];
  church: Church;
  calls: ScheduledCall[];
  isAdmin: boolean;
  compactPhases: Set<string>;
  expandedPhases: Set<string>;
  updatingMilestone: string | null;
  editingDateId: string | null;
  editingNotesId: string | null;
  editDateValue: string;
  editNotesValue: string;
  uploadingMilestone: string | null;
  editingChurchNotesId: string | null;
  editChurchNotesValue: string;
  onTogglePhaseCompact: (phaseId: string) => void;
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
  onStartEditingChurchNotes: (milestoneId: string, currentNotes?: string) => void;
  onSaveChurchNotes: (milestoneId: string) => void;
  onCancelEditChurchNotes: () => void;
  onEditChurchNotesChange: (value: string) => void;
}

export default function JourneyTab({
  phases,
  church,
  calls,
  isAdmin,
  compactPhases,
  expandedPhases,
  updatingMilestone,
  editingDateId,
  editingNotesId,
  editDateValue,
  editNotesValue,
  uploadingMilestone,
  editingChurchNotesId,
  editChurchNotesValue,
  onTogglePhaseCompact,
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
}: JourneyTabProps) {
  // Scroll to first incomplete milestone in current phase (once on load)
  const hasScrolledRef = useRef(false);
  useEffect(() => {
    if (hasScrolledRef.current) return;
    const currentPhase = phases.find(
      p => p.phase_number === church.current_phase ||
        (church.current_phase === 0 && p.phase_number === 1)
    );
    if (!currentPhase || !expandedPhases.has(currentPhase.id)) return;
    const firstIncomplete = currentPhase.milestones.find(m => !m.progress?.completed);
    if (!firstIncomplete) return;
    hasScrolledRef.current = true;
    setTimeout(() => {
      document.getElementById(`milestone-${firstIncomplete.id}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }, 200);
  }, [expandedPhases, phases, church.current_phase]);

  // Only show scheduled calls that haven't been completed yet
  const activeDiscovery = calls.find(c => c.call_type === 'discovery' && !c.completed);
  const activeProposal  = calls.find(c => c.call_type === 'proposal'  && !c.completed);
  const activeStrategy  = calls.find(c => c.call_type === 'strategy'  && !c.completed);
  const hasActiveCalls  = !!(activeDiscovery || activeProposal || activeStrategy);

  const totalMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Progress + Calls side-by-side on desktop, stacked on mobile */}
      <div className="grid md:grid-cols-2 gap-6 items-start">
        {/* Progress Overview with Per-Phase Bars */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-navy">Your DNA Journey</h2>
            <span className="text-2xl font-bold text-gold">{overallProgress}%</span>
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

        {/* Scheduled Calls Section */}
        {hasActiveCalls ? (
          <div className="card">
            <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-teal" />
              Your Scheduled Calls
            </h3>
            <div className={`grid gap-3 ${[activeDiscovery, activeProposal, activeStrategy].filter(Boolean).length === 1 ? 'sm:grid-cols-1 max-w-sm' : [activeDiscovery, activeProposal, activeStrategy].filter(Boolean).length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
              {activeDiscovery && <CallCard call={activeDiscovery} label="Discovery Call" />}
              {activeProposal  && <CallCard call={activeProposal}  label="Proposal Call"  />}
              {activeStrategy  && <CallCard call={activeStrategy}  label="Strategy Call"  />}
            </div>
          </div>
        ) : (
          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-navy flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal" />
                  Ready for a check-in?
                </h3>
                <p className="text-sm text-foreground-muted mt-1">
                  No upcoming calls scheduled. Book time with your DNA coach.
                </p>
              </div>
              <a
                href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true"
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors text-sm font-medium"
              >
                <Phone className="w-4 h-4" />
                Book a Call
              </a>
            </div>
          </div>
        )}
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map(phase => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            church={church}
            calls={calls}
            isExpanded={expandedPhases.has(phase.id)}
            isAdmin={isAdmin}
            isCompact={compactPhases.has(phase.id)}
            updatingMilestone={updatingMilestone}
            editingDateId={editingDateId}
            editingNotesId={editingNotesId}
            editDateValue={editDateValue}
            editNotesValue={editNotesValue}
            uploadingMilestone={uploadingMilestone}
            editingChurchNotesId={editingChurchNotesId}
            editChurchNotesValue={editChurchNotesValue}
            onTogglePhase={onTogglePhase}
            onToggleCompact={() => onTogglePhaseCompact(phase.id)}
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
            onStartEditingChurchNotes={onStartEditingChurchNotes}
            onSaveChurchNotes={onSaveChurchNotes}
            onCancelEditChurchNotes={onCancelEditChurchNotes}
            onEditChurchNotesChange={onEditChurchNotesChange}
          />
        ))}
      </div>
    </div>
  );
}
