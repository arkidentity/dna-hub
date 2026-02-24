'use client';

import { PhaseWithMilestones, Church } from '@/lib/types';

interface ProgressBarProps {
  phases: PhaseWithMilestones[];
  church: Church;
  title: string;
  showPerPhase?: boolean;
  compact?: boolean;
}

export default function ProgressBar({ phases, church, title, showPerPhase = true, compact = false }: ProgressBarProps) {
  const totalMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-navy">{title}</h2>
        <span className="text-2xl font-bold text-gold">{overallProgress}%</span>
      </div>
      <div className="h-3 bg-background-secondary rounded-full overflow-hidden mb-4">
        <div
          className="h-full bg-gold transition-all duration-500"
          style={{ width: `${overallProgress}%` }}
        />
      </div>

      {showPerPhase && (
        compact ? (
          /* Compact: horizontal mini-bars matching the Journey tab style */
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
        ) : (
          /* Verbose: labeled rows with phase names and percentages */
          <div className="space-y-2">
            {phases.filter(p => p.phase_number > 0).map((phase) => {
              const percent = phase.totalCount > 0
                ? Math.round((phase.completedCount / phase.totalCount) * 100)
                : 0;
              const isCurrent = phase.phase_number === church.current_phase ||
                (church.current_phase === 0 && phase.phase_number === 1);

              return (
                <div key={phase.id} className="flex items-center gap-3">
                  <span className={`w-20 text-sm ${isCurrent ? 'font-medium text-navy' : 'text-foreground-muted'}`}>
                    Phase {phase.phase_number}
                  </span>
                  <div className="flex-1 h-2 bg-background-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        percent === 100 ? 'bg-success' : isCurrent ? 'bg-gold' : 'bg-gray-300'
                      }`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                  <span className={`w-12 text-sm text-right ${isCurrent ? 'font-medium' : 'text-foreground-muted'}`}>
                    {percent}%
                  </span>
                  {isCurrent && (
                    <span className="text-xs bg-gold text-white px-2 py-0.5 rounded-full">Current</span>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
