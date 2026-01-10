'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  ChevronDown,
  ChevronRight,
  Check,
  Lock,
  Clock,
  FileText,
  Video,
  ExternalLink,
  BookOpen,
  LogOut,
  User,
  Loader2,
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader } from '@/lib/types';

interface DashboardData {
  church: Church;
  leader: ChurchLeader;
  phases: PhaseWithMilestones[];
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard');

      if (response.status === 401) {
        router.push('/login');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const dashboardData = await response.json();
      setData(dashboardData);

      // Auto-expand current and upcoming phases
      const toExpand = new Set<string>();
      dashboardData.phases.forEach((phase: PhaseWithMilestones) => {
        if (phase.status === 'current' || phase.status === 'upcoming') {
          toExpand.add(phase.id);
        }
      });
      setExpandedPhases(toExpand);
    } catch (error) {
      console.error('Dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases(prev => {
      const next = new Set(prev);
      if (next.has(phaseId)) {
        next.delete(phaseId);
      } else {
        next.add(phaseId);
      }
      return next;
    });
  };

  const toggleMilestone = async (milestone: MilestoneWithProgress, phaseStatus: string) => {
    if (phaseStatus === 'locked' || phaseStatus === 'upcoming') return;

    setUpdatingMilestone(milestone.id);

    try {
      const newCompleted = !milestone.progress?.completed;

      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId: milestone.id,
          completed: newCompleted,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update progress');
      }

      // Refetch dashboard to get updated data
      await fetchDashboard();
    } catch (error) {
      console.error('Progress update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getResourceIcon = (type?: string) => {
    switch (type) {
      case 'pdf':
        return <FileText className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'link':
        return <ExternalLink className="w-4 h-4" />;
      case 'guide':
        return <BookOpen className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getPhaseDate = (phase: PhaseWithMilestones) => {
    if (!data?.church) return null;
    const church = data.church;

    const startKey = `phase_${phase.phase_number}_start` as keyof Church;
    const targetKey = `phase_${phase.phase_number}_target` as keyof Church;

    const start = church[startKey] as string | undefined;
    const target = church[targetKey] as string | undefined;

    if (start && target) {
      const startDate = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const targetDate = new Date(target).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startDate} - ${targetDate}`;
    }

    return null;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-gold animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-foreground-muted">Failed to load dashboard</p>
      </div>
    );
  }

  const { church, leader, phases } = data;

  // Calculate overall progress
  const totalMilestones = phases.reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            {church.logo_url && (
              <Image
                src={church.logo_url}
                alt={church.name}
                width={40}
                height={40}
                className="rounded-full"
              />
            )}
            <div>
              <p className="text-gold font-medium text-sm tracking-wide">DNA ROADMAP</p>
              <p className="font-semibold">{church.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{leader.name}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-gray-300 hover:text-white transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Progress Overview */}
        <div className="card mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-navy">Your DNA Journey</h2>
            <span className="text-2xl font-bold text-gold">{overallProgress}%</span>
          </div>
          <div className="h-3 bg-background-secondary rounded-full overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-500"
              style={{ width: `${overallProgress}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-sm text-foreground-muted">
            <span>{completedMilestones} of {totalMilestones} milestones completed</span>
            <span>Phase {Math.max(1, church.current_phase)} of 5</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          {phases.map(phase => {
            const isExpanded = expandedPhases.has(phase.id);
            const isAccessible = phase.status === 'current' || phase.status === 'completed';
            const isUpcoming = phase.status === 'upcoming';
            const isLocked = phase.status === 'locked';
            const phaseDate = getPhaseDate(phase);

            return (
              <div
                key={phase.id}
                className={`card ${
                  phase.status === 'current' ? 'phase-current' :
                  phase.status === 'completed' ? 'phase-completed' :
                  ''
                } ${isLocked ? 'opacity-50' : ''}`}
              >
                {/* Phase Header */}
                <button
                  onClick={() => !isLocked && togglePhase(phase.id)}
                  disabled={isLocked}
                  className={`w-full flex items-center justify-between ${isLocked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
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
                          Phase {phase.phase_number}: {phase.name}
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

                {/* Phase Description */}
                {isExpanded && phase.description && (
                  <p className="text-foreground-muted mt-4 pl-9">{phase.description}</p>
                )}

                {/* Milestones */}
                {isExpanded && (
                  <div className="mt-6 pl-9 space-y-3">
                    {phase.milestones.map(milestone => {
                      const isCompleted = milestone.progress?.completed;
                      const canToggle = isAccessible;

                      return (
                        <div
                          key={milestone.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            isCompleted ? 'bg-success/5' :
                            isUpcoming ? 'bg-background-secondary/50' :
                            'bg-background-secondary hover:bg-background-secondary/80'
                          }`}
                        >
                          {/* Checkbox */}
                          <button
                            onClick={() => toggleMilestone(milestone, phase.status)}
                            disabled={!canToggle || updatingMilestone === milestone.id}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-success border-success text-white'
                                : canToggle
                                  ? 'border-input-border hover:border-gold'
                                  : 'border-input-border opacity-50'
                            } ${!canToggle ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {updatingMilestone === milestone.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : isCompleted ? (
                              <Check className="w-4 h-4" />
                            ) : null}
                          </button>

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className={`font-medium ${isCompleted ? 'text-success line-through' : 'text-navy'}`}>
                                  {milestone.title}
                                </p>
                                {milestone.description && (
                                  <p className="text-sm text-foreground-muted mt-1">
                                    {milestone.description}
                                  </p>
                                )}
                              </div>
                              {milestone.resource_type && milestone.resource_url && (
                                <a
                                  href={milestone.resource_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex-shrink-0 text-teal hover:text-teal-light"
                                >
                                  {getResourceIcon(milestone.resource_type)}
                                </a>
                              )}
                            </div>

                            {/* Completion info */}
                            {isCompleted && milestone.progress && (
                              <p className="text-xs text-foreground-muted mt-2">
                                Completed by {milestone.completed_by_name || 'team member'} on{' '}
                                {new Date(milestone.progress.completed_at!).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric',
                                })}
                              </p>
                            )}

                            {/* Key milestone badge */}
                            {milestone.is_key_milestone && (
                              <span className="inline-block text-xs text-gold bg-gold/10 px-2 py-0.5 rounded mt-2">
                                Key Milestone
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="mt-12 text-center text-foreground-muted">
          <p>
            Need help?{' '}
            <a href="mailto:travis@arkidentity.com" className="text-teal hover:text-teal-light">
              Email Travis
            </a>{' '}
            or{' '}
            <a
              href="https://calendly.com/arkidentity"
              target="_blank"
              rel="noopener noreferrer"
              className="text-teal hover:text-teal-light"
            >
              schedule office hours
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
