'use client';

import { CheckCircle, ArrowRight } from 'lucide-react';
import { PhaseWithMilestones } from '@/lib/types';
import { parseLocalDate } from './utils';

interface NextStepsCardProps {
  phases: PhaseWithMilestones[];
  currentPhase: PhaseWithMilestones | undefined;
  onViewAllClick: () => void;
}

export default function NextStepsCard({ phases, currentPhase, onViewAllClick }: NextStepsCardProps) {
  const onboardingPhase = phases.find(p => p.phase_number === 0);
  const incompleteOnboarding = onboardingPhase?.milestones.filter(m => !m.progress?.completed) || [];
  const incompleteCurrent = currentPhase?.milestones.filter(m => !m.progress?.completed) || [];
  const nextSteps = [...incompleteOnboarding, ...incompleteCurrent].slice(0, 4);

  return (
    <div className="card">
      <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
        <CheckCircle className="w-5 h-5 text-gold" />
        Next Steps
      </h3>
      {nextSteps.length > 0 ? (
        <div className="space-y-2">
          {nextSteps.map((milestone) => (
            <div
              key={milestone.id}
              className="flex items-start gap-2 p-2 bg-background-secondary rounded-lg"
            >
              <div className="w-5 h-5 rounded border-2 border-gold/50 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-navy">{milestone.title}</p>
                {milestone.progress?.target_date && (
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Target: {parseLocalDate(milestone.progress.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </p>
                )}
              </div>
            </div>
          ))}
          <button
            onClick={onViewAllClick}
            className="w-full flex items-center justify-center gap-2 py-2 text-teal hover:text-teal-light transition-colors text-sm"
          >
            View all milestones
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div className="text-center py-4">
          <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
          <p className="text-success font-medium">All caught up!</p>
          <p className="text-sm text-foreground-muted">No pending tasks</p>
        </div>
      )}
    </div>
  );
}
