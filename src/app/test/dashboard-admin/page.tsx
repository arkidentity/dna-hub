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
  Loader2,
  Calendar,
  Download,
  Pencil,
  MessageSquare,
  X,
  Save,
  Paperclip,
  Trash2,
  File,
  ArrowLeft,
} from 'lucide-react';
import { PhaseWithMilestones, Church, ChurchLeader } from '@/lib/types';

// Mock data for testing (same as dashboard but with admin features)
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
  email: 'travis@arkidentity.com',
  name: 'Travis (Admin)',
  role: 'DNA Coach',
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
        attachments: [
          {
            id: 'att-1',
            church_id: 'test-church-1',
            milestone_id: 'm-2-1',
            file_name: 'training_certificate.pdf',
            file_url: 'https://example.com/cert.pdf',
            file_type: 'application/pdf',
            file_size: 245000,
            created_at: '2024-02-20',
          }
        ],
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
    ],
  },
];

export default function TestDashboardAdminPage() {
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

  // Admin editing state
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [editNotesValue, setEditNotesValue] = useState<string>('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const isAdmin = true; // Always admin for this test page

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

  // Admin: Start editing date
  const startEditingDate = (milestoneId: string, currentDate?: string) => {
    setEditingDateId(milestoneId);
    setEditDateValue(currentDate ? currentDate.split('T')[0] : '');
    setEditingNotesId(null);
  };

  // Admin: Start editing notes
  const startEditingNotes = (milestoneId: string, currentNotes?: string) => {
    setEditingNotesId(milestoneId);
    setEditNotesValue(currentNotes || '');
    setEditingDateId(null);
  };

  // Admin: Save (mock)
  const saveTargetDate = async (milestoneId: string) => {
    setSavingId(milestoneId);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`Date saved: ${editDateValue || 'cleared'} (test mode - not persisted)`);
    setEditingDateId(null);
    setEditDateValue('');
    setSavingId(null);
  };

  const saveNotes = async (milestoneId: string) => {
    setSavingId(milestoneId);
    await new Promise(resolve => setTimeout(resolve, 500));
    alert(`Notes saved (test mode - not persisted)`);
    setEditingNotesId(null);
    setEditNotesValue('');
    setSavingId(null);
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

  const getFileIcon = (fileType?: string) => {
    if (fileType?.includes('pdf')) return <FileText className="w-4 h-4" />;
    if (fileType?.includes('image')) return <File className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
              <p className="text-gold font-medium text-sm tracking-wide">DNA ROADMAP (ADMIN TEST)</p>
              <p className="font-semibold">{mockChurch.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-gray-300">
              <User className="w-4 h-4" />
              <span>{mockLeader.name}</span>
              <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">
                Admin
              </span>
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
        <div className="bg-teal/10 border border-teal/30 rounded-lg p-4 mb-6">
          <p className="text-sm text-navy">
            <strong>Admin Test Mode:</strong> This shows admin features (edit dates, notes, attachments). Changes won&apos;t be saved.
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

                            {/* Target date display/edit - Admin features */}
                            {editingDateId === milestone.id ? (
                              <div className="flex items-center gap-2 mt-2">
                                <Calendar className="w-3 h-3 text-foreground-muted" />
                                <input
                                  type="date"
                                  value={editDateValue}
                                  onChange={(e) => setEditDateValue(e.target.value)}
                                  className="text-xs px-2 py-1 border border-input-border rounded bg-white"
                                  autoFocus
                                />
                                <button
                                  onClick={() => saveTargetDate(milestone.id)}
                                  disabled={savingId === milestone.id}
                                  className="p-1 text-success hover:bg-success/10 rounded"
                                  title="Save"
                                >
                                  {savingId === milestone.id ? (
                                    <Loader2 className="w-3 h-3 animate-spin" />
                                  ) : (
                                    <Save className="w-3 h-3" />
                                  )}
                                </button>
                                <button
                                  onClick={() => { setEditingDateId(null); setEditDateValue(''); }}
                                  className="p-1 text-foreground-muted hover:bg-background-secondary rounded"
                                  title="Cancel"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ) : milestone.progress?.target_date ? (
                              <div className="flex items-center gap-1 mt-2">
                                <p className={`text-xs flex items-center gap-1 ${
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
                                {isAdmin && (
                                  <button
                                    onClick={() => startEditingDate(milestone.id, milestone.progress?.target_date)}
                                    className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded ml-1"
                                    title="Edit date"
                                  >
                                    <Pencil className="w-3 h-3" />
                                  </button>
                                )}
                              </div>
                            ) : isAdmin ? (
                              <button
                                onClick={() => startEditingDate(milestone.id)}
                                className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
                              >
                                <Calendar className="w-3 h-3" />
                                <span>Add target date</span>
                              </button>
                            ) : null}

                            {/* Admin notes display/edit */}
                            {editingNotesId === milestone.id ? (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={editNotesValue}
                                  onChange={(e) => setEditNotesValue(e.target.value)}
                                  placeholder="Add a note (challenges, victories, updates...)"
                                  className="w-full text-sm px-3 py-2 border border-input-border rounded bg-white resize-none"
                                  rows={3}
                                  autoFocus
                                />
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => saveNotes(milestone.id)}
                                    disabled={savingId === milestone.id}
                                    className="text-xs px-3 py-1 bg-gold text-white rounded hover:bg-gold/90 flex items-center gap-1"
                                  >
                                    {savingId === milestone.id ? (
                                      <Loader2 className="w-3 h-3 animate-spin" />
                                    ) : (
                                      <Save className="w-3 h-3" />
                                    )}
                                    Save
                                  </button>
                                  <button
                                    onClick={() => { setEditingNotesId(null); setEditNotesValue(''); }}
                                    className="text-xs px-3 py-1 text-foreground-muted hover:bg-background-secondary rounded"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            ) : milestone.progress?.notes ? (
                              <div className="mt-3 p-2 bg-gold/5 border-l-2 border-gold/30 rounded-r">
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex-1">
                                    <p className="text-xs font-medium text-gold/80 mb-1">Admin Note:</p>
                                    <p className="text-sm text-foreground-muted italic whitespace-pre-wrap">
                                      {milestone.progress.notes}
                                    </p>
                                  </div>
                                  {isAdmin && (
                                    <button
                                      onClick={() => startEditingNotes(milestone.id, milestone.progress?.notes)}
                                      className="p-1 text-foreground-muted hover:text-teal hover:bg-teal/10 rounded flex-shrink-0"
                                      title="Edit note"
                                    >
                                      <Pencil className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : isAdmin ? (
                              <button
                                onClick={() => startEditingNotes(milestone.id)}
                                className="text-xs text-teal hover:text-teal-light flex items-center gap-1 mt-2"
                              >
                                <MessageSquare className="w-3 h-3" />
                                <span>Add note</span>
                              </button>
                            ) : null}

                            {/* Attachments section */}
                            {(milestone.attachments && milestone.attachments.length > 0) || isAdmin ? (
                              <div className="mt-3">
                                {milestone.attachments && milestone.attachments.length > 0 && (
                                  <div className="space-y-1 mb-2">
                                    {milestone.attachments.map(attachment => (
                                      <div
                                        key={attachment.id}
                                        className="flex items-center gap-2 text-xs bg-teal/5 px-2 py-1.5 rounded group"
                                      >
                                        {getFileIcon(attachment.file_type)}
                                        <a
                                          href={attachment.file_url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-teal hover:text-teal-light flex-1 truncate"
                                          title={attachment.file_name}
                                        >
                                          {attachment.file_name}
                                        </a>
                                        <span className="text-foreground-muted">
                                          {formatFileSize(attachment.file_size)}
                                        </span>
                                        {isAdmin && (
                                          <button
                                            onClick={() => alert('Delete disabled in test mode')}
                                            className="p-1 text-foreground-muted hover:text-error opacity-0 group-hover:opacity-100 transition-opacity"
                                            title="Delete attachment"
                                          >
                                            <Trash2 className="w-3 h-3" />
                                          </button>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

                                {isAdmin && (
                                  <label className="text-xs text-teal hover:text-teal-light flex items-center gap-1 cursor-pointer">
                                    <Paperclip className="w-3 h-3" />
                                    <span>Attach file</span>
                                    <input
                                      type="file"
                                      className="hidden"
                                      accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
                                      onChange={() => alert('Upload disabled in test mode')}
                                    />
                                  </label>
                                )}
                              </div>
                            ) : null}

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
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
