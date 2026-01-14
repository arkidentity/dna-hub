'use client';

import { PhaseWithMilestones, Church } from '@/lib/types';

interface QuickStatsProps {
  phases: PhaseWithMilestones[];
  church: Church;
}

export default function QuickStats({ phases, church }: QuickStatsProps) {
  const totalMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <div className="card text-center">
        <p className="text-3xl font-bold text-success">{completedMilestones}</p>
        <p className="text-sm text-foreground-muted">Milestones Completed</p>
      </div>
      <div className="card text-center">
        <p className="text-3xl font-bold text-gold">{totalMilestones - completedMilestones}</p>
        <p className="text-sm text-foreground-muted">Milestones Remaining</p>
      </div>
      <div className="card text-center">
        <p className="text-3xl font-bold text-navy">{church.current_phase || 1}</p>
        <p className="text-sm text-foreground-muted">Current Phase</p>
      </div>
      <div className="card text-center">
        <p className="text-3xl font-bold text-teal">{overallProgress}%</p>
        <p className="text-sm text-foreground-muted">Overall Progress</p>
      </div>
    </div>
  );
}
