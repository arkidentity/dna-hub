'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  Calendar,
  Download,
  ArrowLeft,
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader } from '@/lib/types';

// Mock data for testing
const mockChurch: Church = {
  id: 'test-church-1',
  name: 'Grace Community Church',
  logo_url: undefined,
  status: 'active',
  start_date: '2024-01-15',
  phase_1_start: '2024-01-15',
  phase_1_target: '2024-02-15',
  phase_2_start: '2024-02-15',
  phase_2_target: '2024-03-15',
  phase_3_start: '2024-03-15',
  phase_3_target: '2024-04-15',
  phase_4_start: '2024-04-15',
  phase_4_target: '2024-05-15',
  phase_5_start: '2024-05-15',
  phase_5_target: '2024-06-15',
  current_phase: 2,
  created_at: '2024-01-01',
  updated_at: '2024-01-15',
};

const mockLeader: ChurchLeader = {
  id: 'test-leader-1',
  church_id: 'test-church-1',
  email: 'pastor@gracechurch.org',
  name: 'Pastor John Smith',
  role: 'Senior Pastor',
  is_primary_contact: true,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const mockPhases: PhaseWithMilestones[] = [
  {
    id: 'phase-0',
    phase_number: 0,
    name: 'Onboarding',
    description: 'Initial setup and orientation for your DNA journey',
    duration_weeks: 2,
    display_order: 0,
    created_at: '2024-01-01',
    status: 'completed',
    completedCount: 3,
    totalCount: 3,
    milestones: [
      {
        id: 'm-0-1',
        phase_id: 'phase-0',
        title: 'Complete Strategy Call',
        description: 'Meet with your DNA coach to plan your implementation',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
        progress: { id: 'p1', church_id: 'test-church-1', milestone_id: 'm-0-1', completed: true, completed_at: '2024-01-10', created_at: '2024-01-01', updated_at: '2024-01-10' },
        completed_by_name: 'Pastor John Smith',
      },
      {
        id: 'm-0-2',
        phase_id: 'phase-0',
        title: 'Review DNA Manual',
        description: 'Read through the foundational DNA materials',
        resource_url: 'https://example.com/manual.pdf',
        resource_type: 'pdf',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: { id: 'p2', church_id: 'test-church-1', milestone_id: 'm-0-2', completed: true, completed_at: '2024-01-12', created_at: '2024-01-01', updated_at: '2024-01-12' },
        completed_by_name: 'Pastor John Smith',
      },
      {
        id: 'm-0-3',
        phase_id: 'phase-0',
        title: 'Set Implementation Dates',
        description: 'Work with your coach to set target dates for each phase',
        display_order: 3,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: { id: 'p3', church_id: 'test-church-1', milestone_id: 'm-0-3', completed: true, completed_at: '2024-01-14', created_at: '2024-01-01', updated_at: '2024-01-14' },
        completed_by_name: 'Pastor John Smith',
      },
    ],
  },
  {
    id: 'phase-1',
    phase_number: 1,
    name: 'Church Partnership',
    description: 'Establish DNA partnership and align church leadership',
    duration_weeks: 4,
    display_order: 1,
    created_at: '2024-01-01',
    status: 'completed',
    completedCount: 4,
    totalCount: 4,
    milestones: [
      {
        id: 'm-1-1',
        phase_id: 'phase-1',
        title: 'Pastor Champions DNA Vision',
        description: 'Senior pastor communicates DNA vision to leadership',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
        progress: { id: 'p4', church_id: 'test-church-1', milestone_id: 'm-1-1', completed: true, completed_at: '2024-01-20', created_at: '2024-01-01', updated_at: '2024-01-20' },
        completed_by_name: 'Pastor John Smith',
      },
      {
        id: 'm-1-2',
        phase_id: 'phase-1',
        title: 'Leadership Team Alignment',
        description: 'Key leaders understand and support the DNA framework',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: { id: 'p5', church_id: 'test-church-1', milestone_id: 'm-1-2', completed: true, completed_at: '2024-01-25', created_at: '2024-01-01', updated_at: '2024-01-25' },
        completed_by_name: 'Sarah Johnson',
      },
      {
        id: 'm-1-3',
        phase_id: 'phase-1',
        title: 'Identify Core Team',
        description: 'Select 3-5 leaders to lead DNA implementation',
        display_order: 3,
        is_key_milestone: true,
        created_at: '2024-01-01',
        progress: { id: 'p6', church_id: 'test-church-1', milestone_id: 'm-1-3', completed: true, completed_at: '2024-02-01', created_at: '2024-01-01', updated_at: '2024-02-01' },
        completed_by_name: 'Pastor John Smith',
      },
      {
        id: 'm-1-4',
        phase_id: 'phase-1',
        title: 'Schedule Leadership Training',
        description: 'Set dates for core team DNA training sessions',
        display_order: 4,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: { id: 'p7', church_id: 'test-church-1', milestone_id: 'm-1-4', completed: true, completed_at: '2024-02-05', created_at: '2024-01-01', updated_at: '2024-02-05' },
        completed_by_name: 'Sarah Johnson',
      },
    ],
  },
  {
    id: 'phase-2',
    phase_number: 2,
    name: 'Leader Preparation',
    description: 'Train and equip your core leadership team',
    duration_weeks: 6,
    display_order: 2,
    created_at: '2024-01-01',
    status: 'current',
    completedCount: 2,
    totalCount: 5,
    milestones: [
      {
        id: 'm-2-1',
        phase_id: 'phase-2',
        title: 'Core Team Completes DNA Training',
        description: 'All core team members complete the DNA leadership course',
        resource_url: 'https://example.com/training',
        resource_type: 'video',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
        progress: {
          id: 'p8',
          church_id: 'test-church-1',
          milestone_id: 'm-2-1',
          completed: true,
          completed_at: '2024-02-20',
          target_date: '2024-02-25',
          notes: 'All 5 core team members completed training. Great engagement!',
          created_at: '2024-01-01',
          updated_at: '2024-02-20'
        },
        completed_by_name: 'Pastor John Smith',
      },
      {
        id: 'm-2-2',
        phase_id: 'phase-2',
        title: 'Practice DNA Conversations',
        description: 'Core team practices DNA conversations with each other',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: {
          id: 'p9',
          church_id: 'test-church-1',
          milestone_id: 'm-2-2',
          completed: true,
          completed_at: '2024-02-28',
          target_date: '2024-03-01',
          created_at: '2024-01-01',
          updated_at: '2024-02-28'
        },
        completed_by_name: 'Sarah Johnson',
      },
      {
        id: 'm-2-3',
        phase_id: 'phase-2',
        title: 'Establish Meeting Rhythms',
        description: 'Set regular meeting times for DNA groups',
        display_order: 3,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: {
          id: 'p10',
          church_id: 'test-church-1',
          milestone_id: 'm-2-3',
          completed: false,
          target_date: '2024-03-10',
          notes: 'Working on finding times that work for everyone',
          created_at: '2024-01-01',
          updated_at: '2024-03-01'
        },
      },
      {
        id: 'm-2-4',
        phase_id: 'phase-2',
        title: 'Review DNA Resources',
        description: 'Core team reviews all DNA participant materials',
        resource_url: 'https://example.com/resources',
        resource_type: 'guide',
        display_order: 4,
        is_key_milestone: false,
        created_at: '2024-01-01',
        progress: {
          id: 'p11',
          church_id: 'test-church-1',
          milestone_id: 'm-2-4',
          completed: false,
          target_date: '2024-01-15', // Overdue!
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
      },
      {
        id: 'm-2-5',
        phase_id: 'phase-2',
        title: 'Complete Phase 2 Check-in Call',
        description: 'Schedule and complete check-in call with DNA coach',
        display_order: 5,
        is_key_milestone: true,
        created_at: '2024-01-01',
        progress: {
          id: 'p12',
          church_id: 'test-church-1',
          milestone_id: 'm-2-5',
          completed: false,
          target_date: '2024-03-15',
          created_at: '2024-01-01',
          updated_at: '2024-01-01'
        },
      },
    ],
  },
  {
    id: 'phase-3',
    phase_number: 3,
    name: 'DNA Foundation',
    description: 'Launch initial DNA groups with core team',
    duration_weeks: 8,
    display_order: 3,
    created_at: '2024-01-01',
    status: 'upcoming',
    completedCount: 0,
    totalCount: 4,
    milestones: [
      {
        id: 'm-3-1',
        phase_id: 'phase-3',
        title: 'Launch First DNA Groups',
        description: 'Core team leads first round of DNA groups',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
      {
        id: 'm-3-2',
        phase_id: 'phase-3',
        title: 'Weekly Group Meetings',
        description: 'Groups meet consistently for 6+ weeks',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
      },
      {
        id: 'm-3-3',
        phase_id: 'phase-3',
        title: 'Identify Emerging Leaders',
        description: 'Spot potential DNA group leaders from participants',
        display_order: 3,
        is_key_milestone: false,
        created_at: '2024-01-01',
      },
      {
        id: 'm-3-4',
        phase_id: 'phase-3',
        title: 'Complete Phase 3 Review',
        description: 'Evaluate first groups and plan expansion',
        display_order: 4,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
    ],
  },
  {
    id: 'phase-4',
    phase_number: 4,
    name: 'Practical Preparation',
    description: 'Expand DNA groups and train new leaders',
    duration_weeks: 8,
    display_order: 4,
    created_at: '2024-01-01',
    status: 'locked',
    completedCount: 0,
    totalCount: 4,
    milestones: [
      {
        id: 'm-4-1',
        phase_id: 'phase-4',
        title: 'Train New DNA Leaders',
        description: 'Emerging leaders complete DNA leadership training',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
      {
        id: 'm-4-2',
        phase_id: 'phase-4',
        title: 'Launch Second Wave Groups',
        description: 'New leaders start their own DNA groups',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
      },
      {
        id: 'm-4-3',
        phase_id: 'phase-4',
        title: 'Establish Support Systems',
        description: 'Create ongoing coaching and support for DNA leaders',
        display_order: 3,
        is_key_milestone: false,
        created_at: '2024-01-01',
      },
      {
        id: 'm-4-4',
        phase_id: 'phase-4',
        title: 'Complete Phase 4 Review',
        description: 'Evaluate expansion and prepare for final phase',
        display_order: 4,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
    ],
  },
  {
    id: 'phase-5',
    phase_number: 5,
    name: 'Final Validation & Launch',
    description: 'Full church-wide DNA implementation',
    duration_weeks: 4,
    display_order: 5,
    created_at: '2024-01-01',
    status: 'locked',
    completedCount: 0,
    totalCount: 3,
    milestones: [
      {
        id: 'm-5-1',
        phase_id: 'phase-5',
        title: 'Church-Wide Launch',
        description: 'DNA becomes integrated into church culture',
        display_order: 1,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
      {
        id: 'm-5-2',
        phase_id: 'phase-5',
        title: 'Graduation Celebration',
        description: 'Celebrate completing the DNA implementation journey',
        display_order: 2,
        is_key_milestone: false,
        created_at: '2024-01-01',
      },
      {
        id: 'm-5-3',
        phase_id: 'phase-5',
        title: 'Ongoing Multiplication Plan',
        description: 'Establish sustainable DNA multiplication systems',
        display_order: 3,
        is_key_milestone: true,
        created_at: '2024-01-01',
      },
    ],
  },
];

export default function TestDashboardPage() {
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(
    new Set(['phase-0', 'phase-2', 'phase-3'])
  );
  const [completedMilestones, setCompletedMilestones] = useState<Set<string>>(
    new Set(
      mockPhases.flatMap(p =>
        p.milestones
          .filter(m => m.progress?.completed)
          .map(m => m.id)
      )
    )
  );

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

  const toggleMilestone = (milestoneId: string, phaseStatus: string) => {
    if (phaseStatus === 'locked' || phaseStatus === 'upcoming') return;

    setCompletedMilestones(prev => {
      const next = new Set(prev);
      if (next.has(milestoneId)) {
        next.delete(milestoneId);
      } else {
        next.add(milestoneId);
      }
      return next;
    });
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

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getPhaseDate = (phase: PhaseWithMilestones) => {
    const startKey = `phase_${phase.phase_number}_start` as keyof Church;
    const targetKey = `phase_${phase.phase_number}_target` as keyof Church;

    const start = mockChurch[startKey] as string | undefined;
    const target = mockChurch[targetKey] as string | undefined;

    if (start && target) {
      const startDate = parseLocalDate(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const targetDate = parseLocalDate(target).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startDate} - ${targetDate}`;
    }

    return null;
  };

  const formatTargetDate = (dateStr?: string) => {
    if (!dateStr) return null;
    return parseLocalDate(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const isOverdue = (dateStr?: string, completed?: boolean) => {
    if (!dateStr || completed) return false;
    const targetDate = parseLocalDate(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return targetDate < today;
  };

  // Calculate overall progress
  const totalMilestones = mockPhases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedCount = mockPhases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedCount / totalMilestones) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/test" className="text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <p className="text-gold font-medium text-sm tracking-wide">DNA ROADMAP (TEST)</p>
              <p className="font-semibold">{mockChurch.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{mockLeader.name}</span>
            </div>
            <button
              className="text-gray-300 hover:text-white transition-colors"
              title="Logout (disabled in test mode)"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        {/* Test Mode Banner */}
        <div className="bg-gold/10 border border-gold/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-navy">
            <strong>Test Mode:</strong> This is a preview with mock data. Changes won&apos;t be saved.
          </p>
        </div>

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
            <span>{completedCount} of {totalMilestones} milestones completed</span>
            <span>Phase {mockChurch.current_phase} of 5</span>
          </div>
        </div>

        {/* Phases */}
        <div className="space-y-4">
          {mockPhases.map(phase => {
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
                <div className="flex items-center justify-between">
                  <button
                    onClick={() => !isLocked && togglePhase(phase.id)}
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
                  {isExpanded && !isLocked && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        alert('Calendar export disabled in test mode');
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
                    {phase.milestones.map(milestone => {
                      const isCompleted = completedMilestones.has(milestone.id);
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
                            onClick={() => toggleMilestone(milestone.id, phase.status)}
                            disabled={!canToggle}
                            className={`flex-shrink-0 w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${
                              isCompleted
                                ? 'bg-success border-success text-white'
                                : canToggle
                                  ? 'border-input-border hover:border-gold'
                                  : 'border-input-border opacity-50'
                            } ${!canToggle ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                          >
                            {isCompleted && <Check className="w-4 h-4" />}
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

                            {/* Target date display */}
                            {milestone.progress?.target_date && (
                              <p className={`text-xs flex items-center gap-1 mt-2 ${
                                isOverdue(milestone.progress.target_date, isCompleted)
                                  ? 'text-error font-medium'
                                  : 'text-foreground-muted'
                              }`}>
                                <Calendar className="w-3 h-3" />
                                {isOverdue(milestone.progress.target_date, isCompleted) && (
                                  <span className="text-error">Overdue:</span>
                                )}
                                Target: {formatTargetDate(milestone.progress.target_date)}
                              </p>
                            )}

                            {/* Notes display */}
                            {milestone.progress?.notes && (
                              <div className="mt-3 p-2 bg-gold/5 border-l-2 border-gold/30 rounded-r">
                                <p className="text-xs font-medium text-gold/80 mb-1">Admin Note:</p>
                                <p className="text-sm text-foreground-muted italic whitespace-pre-wrap">
                                  {milestone.progress.notes}
                                </p>
                              </div>
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
