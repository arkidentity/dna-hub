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
  Calendar,
  Download,
  Pencil,
  MessageSquare,
  X,
  Save,
  Paperclip,
  Trash2,
  File,
  LayoutDashboard,
  Map,
  Phone,
  CheckCircle,
  ArrowRight,
  List,
  LayoutList,
} from 'lucide-react';
import { PhaseWithMilestones, MilestoneWithProgress, Church, ChurchLeader, FunnelDocument, ScheduledCall, GlobalResource } from '@/lib/types';

interface DashboardData {
  church: Church;
  leader: ChurchLeader;
  phases: PhaseWithMilestones[];
  documents: FunnelDocument[];
  calls: ScheduledCall[];
  globalResources: GlobalResource[];
  isAdmin: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'journey'>('overview');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [compactView, setCompactView] = useState(false);
  const [updatingMilestone, setUpdatingMilestone] = useState<string | null>(null);

  // Admin editing state
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [editDateValue, setEditDateValue] = useState<string>('');
  const [editNotesValue, setEditNotesValue] = useState<string>('');
  const [uploadingMilestone, setUploadingMilestone] = useState<string | null>(null);

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

      if (response.status === 307) {
        const data = await response.json();
        router.push(data.redirect || '/portal');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard');
      }

      const dashboardData = await response.json();

      if (dashboardData.redirect) {
        router.push(dashboardData.redirect);
        return;
      }

      setData(dashboardData);

      // Auto-expand current and onboarding phases
      const toExpand = new Set<string>();
      dashboardData.phases.forEach((phase: PhaseWithMilestones) => {
        if (phase.status === 'current' || phase.phase_number === 0) {
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

      await fetchDashboard();
    } catch (error) {
      console.error('Progress update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  // Admin: Save target date
  const saveTargetDate = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          targetDate: editDateValue || null,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update date');
      }

      await fetchDashboard();
      setEditingDateId(null);
      setEditDateValue('');
    } catch (error) {
      console.error('Date update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  // Admin: Save notes
  const saveNotes = async (milestoneId: string) => {
    setUpdatingMilestone(milestoneId);
    try {
      const response = await fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          milestoneId,
          notes: editNotesValue,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update notes');
      }

      await fetchDashboard();
      setEditingNotesId(null);
      setEditNotesValue('');
    } catch (error) {
      console.error('Notes update error:', error);
    } finally {
      setUpdatingMilestone(null);
    }
  };

  const startEditingDate = (milestoneId: string, currentDate?: string) => {
    setEditingDateId(milestoneId);
    setEditDateValue(currentDate ? currentDate.split('T')[0] : '');
    setEditingNotesId(null);
  };

  const startEditingNotes = (milestoneId: string, currentNotes?: string) => {
    setEditingNotesId(milestoneId);
    setEditNotesValue(currentNotes || '');
    setEditingDateId(null);
  };

  const handleFileUpload = async (milestoneId: string, file: File) => {
    setUploadingMilestone(milestoneId);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('milestoneId', milestoneId);

      const response = await fetch('/api/attachments', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to upload file');
        return;
      }

      await fetchDashboard();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file');
    } finally {
      setUploadingMilestone(null);
    }
  };

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm('Delete this attachment?')) return;

    try {
      const response = await fetch(`/api/attachments?id=${attachmentId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        alert(error.error || 'Failed to delete attachment');
        return;
      }

      await fetchDashboard();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete attachment');
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

  const parseLocalDate = (dateStr: string) => {
    const parts = dateStr.split('T')[0].split('-');
    return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
  };

  const getPhaseDate = (phase: PhaseWithMilestones) => {
    if (!data?.church) return null;
    const church = data.church;

    const startKey = `phase_${phase.phase_number}_start` as keyof Church;
    const targetKey = `phase_${phase.phase_number}_target` as keyof Church;

    const start = church[startKey] as string | undefined;
    const target = church[targetKey] as string | undefined;

    if (start && target) {
      const startDate = parseLocalDate(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const targetDate = parseLocalDate(target).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      return `${startDate} - ${targetDate}`;
    }

    return null;
  };

  const exportCalendar = (phaseNumber?: number) => {
    const url = phaseNumber
      ? `/api/calendar?phase=${phaseNumber}`
      : '/api/calendar';
    window.location.href = url;
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

  const formatCallDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
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

  const { church, leader, phases, documents, calls, globalResources, isAdmin } = data;

  // Calculate overall progress (exclude Phase 0)
  const totalMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.totalCount, 0);
  const completedMilestones = phases.filter(p => p.phase_number > 0).reduce((sum, p) => sum + p.completedCount, 0);
  const overallProgress = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Get upcoming call
  const upcomingCall = calls.find(c => !c.completed && new Date(c.scheduled_at) > new Date());

  // Get documents
  const proposalPdf = documents.find(d => d.document_type === 'proposal_pdf');
  const implementationPlan = documents.find(d => d.document_type === 'implementation_plan');
  const agreementPdf = documents.find(d => d.document_type === 'agreement_pdf');

  // Get current phase info
  const currentPhase = phases.find(p => p.phase_number === church.current_phase) || phases.find(p => p.phase_number === 1);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-navy text-white py-4 px-6">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
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
              {isAdmin && (
                <span className="text-xs bg-gold/20 text-gold px-2 py-0.5 rounded-full font-medium">
                  Admin
                </span>
              )}
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

      {/* Tab Navigation */}
      <div className="bg-white border-b border-card-border">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-6">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'journey', label: 'DNA Journey', icon: Map },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold text-navy font-medium'
                    : 'border-transparent text-foreground-muted hover:text-navy'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* ============ OVERVIEW TAB ============ */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Overall Progress Card */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-navy">Implementation Progress</h2>
                <span className="text-3xl font-bold text-gold">{overallProgress}%</span>
              </div>
              <div className="h-4 bg-background-secondary rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gold transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>

              {/* Per-phase progress bars */}
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
            </div>

            {/* Two Column Layout */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Current Focus - Show next incomplete milestones */}
              <div className="card">
                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-gold" />
                  Next Steps
                </h3>
                {(() => {
                  // Get incomplete milestones from onboarding (phase 0) and current phase
                  const onboardingPhase = phases.find(p => p.phase_number === 0);
                  const incompleteOnboarding = onboardingPhase?.milestones.filter(m => !m.progress?.completed) || [];
                  const incompleteCurrent = currentPhase?.milestones.filter(m => !m.progress?.completed) || [];
                  const nextSteps = [...incompleteOnboarding, ...incompleteCurrent].slice(0, 4);

                  return nextSteps.length > 0 ? (
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
                        onClick={() => setActiveTab('journey')}
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
                  );
                })()}
              </div>

              {/* Schedule a Call */}
              <div className="card">
                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-teal" />
                  Schedule a Call
                </h3>
                {upcomingCall && (
                  <div className="p-3 bg-teal/5 rounded-lg border-l-4 border-teal mb-4">
                    <p className="text-xs text-teal font-medium uppercase tracking-wide">Upcoming</p>
                    <p className="font-medium text-navy capitalize mt-1">
                      {upcomingCall.call_type.replace('_', ' ')} Call
                    </p>
                    <p className="text-sm text-foreground-muted">
                      {formatCallDate(upcomingCall.scheduled_at)}
                    </p>
                  </div>
                )}
                <div className="space-y-2">
                  <a
                    href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ06-H6-Lu-ReUlLa7bTB0qgXj9c1DxocZWH7WxTLw__s9chlLMDflEtH_my63oqNrQAaV7oahqR?gv=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-3 bg-gold text-white rounded-lg hover:bg-gold/90 transition-colors font-medium"
                  >
                    <Phone className="w-4 h-4" />
                    Book 60-Minute Strategy Call
                  </a>
                  <a
                    href="https://calendar.google.com/calendar/appointments/schedules/AcZssZ0LdUpKkvo_qoOrtiu6fQfPgkQJUZaG9RxPtYVieJrl1RAFnUmgTN9WATs6jAxSbkdo5M4-bpfI?gv=true"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 py-2 border border-teal text-teal rounded-lg hover:bg-teal/5 transition-colors text-sm"
                  >
                    <Calendar className="w-4 h-4" />
                    Quick 15-Minute Check-In
                  </a>
                </div>
              </div>
            </div>

            {/* Documents Section */}
            {(proposalPdf?.file_url || implementationPlan?.file_url || agreementPdf?.file_url) && (
              <div className="card">
                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-gold" />
                  Your Documents
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {proposalPdf?.file_url && (
                    <a
                      href={proposalPdf.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-gold/5 hover:bg-gold/10 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5 text-gold" />
                      <div>
                        <p className="font-medium text-navy text-sm">Partnership Proposal</p>
                        <p className="text-xs text-foreground-muted">PDF Document</p>
                      </div>
                    </a>
                  )}
                  {implementationPlan?.file_url && (
                    <a
                      href={implementationPlan.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-teal/5 hover:bg-teal/10 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5 text-teal" />
                      <div>
                        <p className="font-medium text-navy text-sm">Implementation Plan</p>
                        <p className="text-xs text-foreground-muted">90-Day Game Plan</p>
                      </div>
                    </a>
                  )}
                  {agreementPdf?.file_url && (
                    <a
                      href={agreementPdf.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-success/5 hover:bg-success/10 rounded-lg transition-colors"
                    >
                      <Download className="w-5 h-5 text-success" />
                      <div>
                        <p className="font-medium text-navy text-sm">Partnership Agreement</p>
                        <p className="text-xs text-foreground-muted">Signed Agreement</p>
                      </div>
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* DNA Resources Section */}
            {globalResources && globalResources.filter(r => r.file_url).length > 0 && (
              <div className="card">
                <h3 className="font-semibold text-navy mb-4 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  DNA Resources
                </h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {globalResources.filter(r => r.file_url).map((resource) => (
                    <a
                      key={resource.id}
                      href={resource.file_url!}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors"
                    >
                      {resource.resource_type === 'worksheet' && <FileText className="w-5 h-5 text-blue-500" />}
                      {resource.resource_type === 'pdf' && <FileText className="w-5 h-5 text-red-500" />}
                      {resource.resource_type === 'guide' && <BookOpen className="w-5 h-5 text-purple-600" />}
                      {resource.resource_type === 'video' && <Video className="w-5 h-5 text-purple-500" />}
                      {!resource.resource_type && <FileText className="w-5 h-5 text-gray-500" />}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-navy text-sm truncate">{resource.name}</p>
                        {resource.description && (
                          <p className="text-xs text-foreground-muted truncate">{resource.description}</p>
                        )}
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats */}
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
          </div>
        )}

        {/* ============ DNA JOURNEY TAB ============ */}
        {activeTab === 'journey' && (
          <div className="space-y-6">
            {/* Progress Overview with Per-Phase Bars */}
            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-navy">Your DNA Journey</h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setCompactView(!compactView)}
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
                      {/* Calendar Export Button */}
                      {isExpanded && !isLocked && phase.milestones.some(m => m.progress?.target_date) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            exportCalendar(phase.phase_number);
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
                                  <div className="flex-1">
                                    <p className={`font-medium ${isCompleted ? 'text-success line-through' : 'text-navy'}`}>
                                      {milestone.title}
                                    </p>
                                    {!compactView && milestone.description && (
                                      <p className="text-sm text-foreground-muted mt-1">
                                        {milestone.description}
                                      </p>
                                    )}
                                    {/* Compact: show target date inline */}
                                    {compactView && milestone.progress?.target_date && (
                                      <p className={`text-xs mt-0.5 ${isOverdue(milestone.progress.target_date, isCompleted) ? 'text-error' : 'text-foreground-muted'}`}>
                                        Target: {formatTargetDate(milestone.progress.target_date)}
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

                                {/* Expanded view content */}
                                {!compactView && (
                                  <>
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

                                {/* Target date display/edit */}
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
                                      disabled={updatingMilestone === milestone.id}
                                      className="p-1 text-success hover:bg-success/10 rounded"
                                      title="Save"
                                    >
                                      {updatingMilestone === milestone.id ? (
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
                                      isOverdue(milestone.progress.target_date, milestone.progress?.completed)
                                        ? 'text-error font-medium'
                                        : 'text-foreground-muted'
                                    }`}>
                                      <Calendar className="w-3 h-3" />
                                      {isOverdue(milestone.progress.target_date, milestone.progress?.completed) && (
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

                                {/* Notes display/edit - visible to all but only admin can edit */}
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
                                        disabled={updatingMilestone === milestone.id}
                                        className="text-xs px-3 py-1 bg-gold text-white rounded hover:bg-gold/90 flex items-center gap-1"
                                      >
                                        {updatingMilestone === milestone.id ? (
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
                                        <p className="text-xs font-medium text-gold/80 mb-1">Note:</p>
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

                                {/* Global Resources section */}
                                {milestone.resources && milestone.resources.length > 0 && (
                                  <div className="mt-3 space-y-1">
                                    {milestone.resources.map((resource) => (
                                      <div
                                        key={resource.id}
                                        className="flex items-center gap-2 text-xs bg-purple-50 px-2 py-1.5 rounded"
                                      >
                                        {resource.resource_type === 'pdf' && <FileText className="w-3 h-3 text-red-500" />}
                                        {resource.resource_type === 'worksheet' && <FileText className="w-3 h-3 text-blue-500" />}
                                        {resource.resource_type === 'video' && <Video className="w-3 h-3 text-purple-500" />}
                                        {resource.resource_type === 'guide' && <BookOpen className="w-3 h-3 text-teal" />}
                                        {resource.resource_type === 'link' && <ExternalLink className="w-3 h-3 text-gray-500" />}
                                        {!resource.resource_type && <File className="w-3 h-3 text-gray-400" />}
                                        {resource.file_url ? (
                                          <a
                                            href={resource.file_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-purple-700 hover:text-purple-900 hover:underline flex-1"
                                          >
                                            {resource.name}
                                          </a>
                                        ) : (
                                          <span className="text-foreground-muted flex-1">
                                            {resource.name}
                                            <span className="text-orange-500 ml-1">(coming soon)</span>
                                          </span>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}

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
                                                onClick={() => handleDeleteAttachment(attachment.id)}
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
                                        {uploadingMilestone === milestone.id ? (
                                          <>
                                            <Loader2 className="w-3 h-3 animate-spin" />
                                            <span>Uploading...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Paperclip className="w-3 h-3" />
                                            <span>Attach file</span>
                                            <input
                                              type="file"
                                              className="hidden"
                                              accept=".pdf,.png,.jpg,.jpeg,.gif,.doc,.docx"
                                              onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                  handleFileUpload(milestone.id, file);
                                                  e.target.value = '';
                                                }
                                              }}
                                            />
                                          </>
                                        )}
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
                                  </>
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
          </div>
        )}

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
